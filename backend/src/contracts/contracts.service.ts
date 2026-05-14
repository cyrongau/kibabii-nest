import { Injectable } from '@nestjs/common';
import { S3Service } from '../uploads/s3.service';
import { callOpenRouter, parseAIJson } from '../common/ai-utils';

@Injectable()
export class ContractsService {
  constructor(private readonly s3Service: S3Service) {}

  async processContract(file: Express.Multer.File) {
    // 1. Upload to S3
    const url = await this.s3Service.uploadFile(file, 'contracts');

    // 2. Extract data using AI
    const extractedData = await this.extractWithAI(file);

    return { url, extractedData };
  }

  private async extractWithAI(file: Express.Multer.File) {
    const base64File = file.buffer.toString('base64');
    const mimeType = file.mimetype;

    try {
      console.log(`Starting AI extraction for file type: ${mimeType}`);
      const messages = [
        {
          role: 'user',
          content: [
            {
              type: 'text',
              text: `Analyze this tenancy agreement carefully and extract details for a property listing. 
              
              1. Monthly Rent: Look for "Monthly rent" or "Rent". Capture the numeric value only.
              2. Security Deposit: Look for "refundable deposit" or "Security Deposit". Capture the numeric value only.
              3. Rules: Extract a concise list of rules and tenant obligations.
              4. Signatures: Check if there are signature lines or signed names for both "Landlord" and "Tenant".
              
              Return ONLY a valid JSON object:
              {
                "rent": number,
                "deposit": number,
                "rules": ["rule 1", "rule 2", ...],
                "suggestedName": "A catchy name for this property",
                "suggestedDescription": "A professional description",
                "signaturesDetected": boolean,
                "partiesIdentified": string[]
              }
              
              If any value is missing, use default values.`,
            },
            {
              type: 'image_url',
              image_url: {
                url: `data:${mimeType};base64,${base64File}`,
              },
            },
          ],
        },
      ];

      const rawResponse = await callOpenRouter(messages, { responseFormat: 'json_object' });
      console.log('AI Raw Response:', rawResponse);
      
      const parsed = parseAIJson<any>(rawResponse);
      
      return {
        rent: parsed?.rent || 0,
        deposit: parsed?.deposit || 0,
        rules: parsed?.rules || [],
        suggestedName: parsed?.suggestedName || '',
        suggestedDescription: parsed?.suggestedDescription || '',
        signaturesDetected: parsed?.signaturesDetected || false,
        partiesIdentified: parsed?.partiesIdentified || []
      };
    } catch (error: any) {
      console.error('AI Extraction Error:', error.message);
      return {
        rent: 0,
        deposit: 0,
        rules: ['Failed to extract rules'],
        suggestedName: '',
        suggestedDescription: '',
        signaturesDetected: false,
        partiesIdentified: []
      };
    }
  }
}
