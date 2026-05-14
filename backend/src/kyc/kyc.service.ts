import { Injectable, Logger, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { MailService } from '../notifications/mail.service';
import { KycStatus } from '@prisma/client';
import { S3Service } from '../uploads/s3.service';
import { callOpenRouter, parseAIJson } from '../common/ai-utils';

@Injectable()
export class KycService {
  private readonly logger = new Logger(KycService.name);

  constructor(
    private prisma: PrismaService,
    private mailService: MailService,
    private s3Service: S3Service,
  ) {}

  async submitKyc(userId: string, data: { idDocumentUrl: string; ownershipProofUrl: string; certificateUrl?: string }) {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user) throw new NotFoundException('User not found');
    if (user.role !== 'LANDLORD') throw new BadRequestException('Only landlords can submit KYC');

    // Run AI OCR to extract data
    let aiAnalysis = {};
    try {
      aiAnalysis = await this.scanKycDocumentsWithAI([data.idDocumentUrl, data.ownershipProofUrl]);
    } catch (error) {
      this.logger.error('Failed to run AI OCR on KYC documents', error);
      // We don't fail the request if AI fails, admin can review manually
      aiAnalysis = { error: 'Failed to extract data via AI' };
    }

    const existingKyc = await this.prisma.landlordKyc.findUnique({ where: { userId } });

    if (existingKyc) {
      return this.prisma.landlordKyc.update({
        where: { userId },
        data: {
          ...data,
          status: KycStatus.PENDING,
          aiAnalysis,
        }
      });
    }

    return this.prisma.landlordKyc.create({
      data: {
        userId,
        ...data,
        status: KycStatus.PENDING,
        aiAnalysis,
      }
    });
  }

  async getPendingKyc() {
    return this.prisma.landlordKyc.findMany({
      where: { status: KycStatus.PENDING },
      include: {
        user: { select: { name: true, email: true, phone: true } }
      },
      orderBy: { createdAt: 'desc' }
    });
  }

  async getAllKyc(filters: { status?: KycStatus; search?: string; userId?: string }) {
    this.logger.log(`Fetching all KYC with filters: ${JSON.stringify(filters)}`);
    const { status, search, userId } = filters;
    
    // 1. Build where clause
    const where: any = {
      role: 'LANDLORD',
      id: userId || undefined,
    };

    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { email: { contains: search, mode: 'insensitive' } }
      ];
    }

    // 2. Add status-specific filtering
    if (status?.toString() === 'APPROVED') {
      where.AND = [
        {
          OR: [
            { kyc: { status: 'APPROVED' as any } },
            { isVerifiedLandlord: true }
          ]
        }
      ];
    } else if (status) {
      where.kyc = { status: status as any };
    }

    const users = await this.prisma.user.findMany({
      where,
      include: { kyc: true },
      orderBy: { createdAt: 'desc' },
    });

    this.logger.log(`[KycService] Found ${users.length} users for filter: ${JSON.stringify(where)}`);

    return users.map(user => {
      // If there's no KYC record but they are verified, synthesize a record
      if (!user.kyc && user.isVerifiedLandlord) {
        return {
          id: `synth-${user.id}`,
          userId: user.id,
          status: 'APPROVED',
          idDocumentUrl: '',
          ownershipProofUrl: '',
          createdAt: user.createdAt,
          updatedAt: user.createdAt,
          user: {
            id: user.id,
            name: user.name,
            email: user.email,
            phone: user.phone,
            avatar: user.avatar
          }
        };
      }
      
      // Return the actual KYC record with user details
      if (user.kyc) {
        return {
          ...user.kyc,
          user: {
            id: user.id,
            name: user.name,
            email: user.email,
            phone: user.phone,
            avatar: user.avatar
          }
        };
      }

      return null;
    }).filter(Boolean);
  }

  async verifyKyc(id: string, approved: boolean, reason?: string) {
    const kyc = await this.prisma.landlordKyc.findUnique({
      where: { id },
      include: { user: true }
    });

    if (!kyc) throw new NotFoundException('KYC record not found');

    const status = approved ? KycStatus.APPROVED : KycStatus.REJECTED;

    await this.prisma.$transaction(async (prisma) => {
      await prisma.landlordKyc.update({
        where: { id },
        data: { status }
      });

      if (approved) {
        await prisma.user.update({
          where: { id: kyc.userId },
          data: { isVerifiedLandlord: true }
        });
      } else {
        await prisma.user.update({
          where: { id: kyc.userId },
          data: { isVerifiedLandlord: false }
        });
      }
    });

    if (approved) {
      await this.mailService.sendKycApprovedNotification(kyc.user.email, kyc.user.name);
    } else {
      // Optional: send rejection email if needed
      this.logger.log(`KYC rejected for ${kyc.user.email}. Reason: ${reason}`);
    }

    return { success: true, status };
  }

  private async scanKycDocumentsWithAI(urls: string[]) {
    try {
      const content: any[] = [
        {
          type: 'text',
          text: `You are a strict compliance officer. Analyze these uploaded KYC documents (National ID and Proof of Ownership) and extract the following details to verify the landlord.
          
          Return ONLY a valid JSON object:
          {
            "idName": "Full name on the ID card",
            "idNumber": "ID Number/Passport Number",
            "ownershipName": "Name on the title deed or utility bill",
            "ownershipAddress": "Address on the deed/bill",
            "namesMatch": boolean (true if the names on both documents refer to the same person),
            "confidence": number (0 to 1, how confident are you in the extraction),
            "flags": ["Any potential issues or mismatch warnings as an array of strings"]
          }
          
          If any value is missing, use null for strings and 0 for numbers.`
        }
      ];

      for (const url of urls) {
        if (url) {
          try {
            const base64 = await this.s3Service.getFileBase64(url);
            const mimeType = url.toLowerCase().endsWith('.pdf') ? 'application/pdf' : 'image/jpeg';
            content.push({ 
              type: 'image_url', 
              image_url: { 
                url: `data:${mimeType};base64,${base64}` 
              } 
            });
          } catch (e: any) {
            this.logger.warn(`Failed to get base64 for ${url}: ${e.message}`);
          }
        }
      }

      const rawResponse = await callOpenRouter(content, { responseFormat: 'json_object' });
      const parsed = parseAIJson<any>(rawResponse);

      if (parsed) {
        // Flag for manual review if confidence is low, names don't match, or there are flags
        parsed.needsManualReview = 
          (parsed.confidence < 0.7) || 
          (parsed.namesMatch === false) || 
          (Array.isArray(parsed.flags) && parsed.flags.length > 0);
        return parsed;
      }

      return { rawResponse, needsManualReview: true, error: 'Failed to parse AI response' };
    } catch (error: any) {
      this.logger.error('AI KYC Scan Error:', error.message);
      return { error: error.message, needsManualReview: true };
    }
  }
}
