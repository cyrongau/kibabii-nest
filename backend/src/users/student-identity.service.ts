import { Injectable, Logger, NotFoundException, BadRequestException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { S3Service } from '../uploads/s3.service';
import axios from 'axios';

@Injectable()
export class StudentIdentityService {
  private readonly logger = new Logger(StudentIdentityService.name);

  constructor(
    private prisma: PrismaService,
    private s3Service: S3Service,
  ) {}

  async submitIdentity(userId: string, data: { documentUrl: string; documentType?: string; universityRegNo?: string }) {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user) throw new NotFoundException('User not found');

    // Run AI OCR to extract student ID data
    let aiAnalysis: any = {};
    let aiConfidence = 0;
    try {
      aiAnalysis = await this.scanDocumentWithAI(data.documentUrl);
      aiConfidence = aiAnalysis?.confidence || 0;
    } catch (error) {
      this.logger.error('Failed to run AI OCR on student document', error);
      aiAnalysis = { error: 'Failed to extract data via AI' };
    }

    const existing = await this.prisma.studentIdentity.findUnique({ where: { userId } });

    const identityData = {
      documentUrl: data.documentUrl,
      documentType: data.documentType || 'NATIONAL_ID',
      fullName: aiAnalysis?.fullName || null,
      idNumber: aiAnalysis?.idNumber || null,
      dateOfBirth: aiAnalysis?.dateOfBirth || null,
      universityRegNo: data.universityRegNo || aiAnalysis?.universityRegNo || null,
      aiAnalysis,
      aiConfidence,
      verified: aiConfidence > 0.7,
    };

    if (existing) {
      return this.prisma.studentIdentity.update({
        where: { userId },
        data: identityData,
      });
    }

    return this.prisma.studentIdentity.create({
      data: {
        userId,
        ...identityData,
      },
    });
  }

  async getIdentity(userId: string) {
    return this.prisma.studentIdentity.findUnique({
      where: { userId },
    });
  }

  async getIdentityForLandlord(studentId: string, landlordId: string) {
    // Verify the landlord has a booking relationship with this student
    const booking = await this.prisma.booking.findFirst({
      where: {
        studentId,
        propertyUnit: {
          property: { landlordId },
        },
      },
    });

    if (!booking) {
      throw new ForbiddenException('You can only view identity documents for students who have booked your properties');
    }

    const identity = await this.prisma.studentIdentity.findUnique({
      where: { userId: studentId },
    });

    if (!identity) {
      throw new NotFoundException('Student has not uploaded an identity document');
    }

    return identity;
  }

  private async scanDocumentWithAI(imageUrl: string) {
    const apiKey = process.env.OPENROUTER_API_KEY;
    if (!apiKey) return { error: 'No AI Key' };

    try {
      let base64Image = '';
      try {
        base64Image = await this.s3Service.getFileBase64(imageUrl);
      } catch (e) {
        this.logger.error(`Failed to get base64 for ${imageUrl}: ${e.message}`);
        throw e;
      }

      const mimeType = imageUrl.toLowerCase().endsWith('.pdf') ? 'application/pdf' : 'image/jpeg';
      this.logger.log(`Scanning document: ${imageUrl} (Base64 length: ${base64Image.length})`);

      const content: any[] = [
        {
          type: 'text',
          text: `You are a high-accuracy OCR specialist for Identification Documents. 
          Analyze the provided image of an Identification Document (Kenyan National ID, Passport, or University Student ID).
          
          CRITICAL INSTRUCTIONS for Kibabii University Student IDs:
          1. "fullName": Look for the label "NAME:" or "Names:". Extract ALL names following it (e.g., "Sarah Juma Wafula"). 
             (On National IDs, look for "SURNAME" and "OTHER NAMES" and concatenate them).
          2. "idNumber": Look for "ID NO:" or "ID/Passport No:". Extract the number (usually 8 digits).
          3. "dateOfBirth": Look for "D.O.B:" or "DATE OF BIRTH". Format strictly as YYYY-MM-DD.
          4. "universityRegNo": Look for "REG NO:", "Reg No:", or "ADMISSION NO".
          
          General extraction rules:
          - USE FUZZY MATCHING: Labels might be slightly obscured or missing colons. If you see "NAME" followed by text, treat it as the name.
          - Handle labels with varied capitalization (e.g., "NAME:", "Name:", "names:").
          - If multiple names are found, concatenate them logically.
          - Return ONLY a valid JSON object. If a field is not found, use null.
          
          JSON Structure:
          {
            "fullName": "...",
            "idNumber": "...",
            "dateOfBirth": "...",
            "universityRegNo": "...",
            "documentType": "NATIONAL_ID" | "PASSPORT" | "STUDENT_ID",
            "confidence": 0.0 to 1.0,
            "flags": []
          }`
        },
        {
          type: 'image_url',
          image_url: { url: `data:${mimeType};base64,${base64Image}` }
        }
      ];

      const response = await axios.post(
        'https://openrouter.ai/api/v1/chat/completions',
        {
          model: 'google/gemini-2.0-flash-exp:free',
          messages: [{ role: 'user', content }],
          temperature: 0.1,
          response_format: { type: 'json_object' }
        },
        {
          headers: {
            Authorization: `Bearer ${apiKey}`,
            'Content-Type': 'application/json',
            'HTTP-Referer': 'https://kibabiinest.com',
            'X-Title': 'Kibabii Nest ID Scan'
          },
          timeout: 45000 // 45 seconds timeout
        }
      );

      const aiContent = response.data.choices[0].message.content;
      this.logger.log(`AI Response: ${aiContent}`);

      // Try to parse JSON directly or find it in the response
      let parsed: any = null;
      try {
        parsed = JSON.parse(aiContent);
      } catch (e) {
        const jsonMatch = aiContent.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
          try {
            parsed = JSON.parse(jsonMatch[0]);
          } catch (innerE) {
            this.logger.error('Failed to parse matched JSON block', innerE);
          }
        }
      }

      if (!parsed) {
        this.logger.warn('AI returned non-JSON response or parsing failed');
        return { error: 'Failed to parse AI response', raw: aiContent };
      }

      return parsed;
    } catch (error: any) {
      this.logger.error('AI Student ID Scan Error:', error.message);
      return { error: error.message };
    }
  }
}
