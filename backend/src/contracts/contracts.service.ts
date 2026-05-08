import { Injectable } from '@nestjs/common';
import { S3Service } from '../uploads/s3.service';
import axios from 'axios';

@Injectable()
export class ContractsService {
  constructor(private readonly s3Service: S3Service) {}

  async processContract(file: Express.Multer.File) {
    // 1. Upload to S3
    const url = await this.s3Service.uploadFile(file, 'contracts');

    // 2. Extract data using AI (OpenRouter + Gemini 1.5 Pro)
    const extractedData = await this.extractWithAI(file);

    return { url, extractedData };
  }

  private async extractWithAI(file: Express.Multer.File) {
    const base64File = file.buffer.toString('base64');
    const mimeType = file.mimetype;

    try {
      console.log(`Starting AI extraction for file type: ${mimeType}`);
      const response = await axios.post(
        'https://openrouter.ai/api/v1/chat/completions',
        {
          model: 'google/gemini-2.0-flash-exp:free',
          messages: [
            {
              role: 'user',
              content: [
                {
                  type: 'text',
                  text: `Analyze this tenancy agreement carefully and extract details for a property listing. 
                  
                  1. Monthly Rent: Look for "Monthly rent" or "Rent". Capture the numeric value only (e.g., from "Ksh 4,500" extract 4500).
                  2. Security Deposit: Look for "refundable deposit" or "Security Deposit". Capture the numeric value only.
                  3. Rules: Extract a concise list of rules and tenant obligations from sections 4, 5, 6, and 7.
                  
                  Return ONLY a valid JSON object:
                  {
                    "rent": number,
                    "deposit": number,
                    "rules": ["rule 1", "rule 2", ...],
                    "suggestedName": "A catchy name for this property",
                    "suggestedDescription": "A professional 2-sentence description based on the agreement"
                  }
                  
                  If any value is missing, use default values (0 for numbers, empty array for rules).`,
                },
                {
                  type: 'image_url',
                  image_url: {
                    url: `data:${mimeType};base64,${base64File}`,
                  },
                },
              ],
            },
          ],
        },
        {
          headers: {
            Authorization: `Bearer ${process.env.OPENROUTER_API_KEY}`,
            'Content-Type': 'application/json',
          },
        },
      );

      const content = response.data.choices[0].message.content;
      console.log('AI Raw Response:', content);
      
      const jsonMatch = content.match(/\{[\s\S]*\}/);
      const parsed = jsonMatch ? JSON.parse(jsonMatch[0]) : null;
      
      return {
        rent: parsed?.rent || 0,
        deposit: parsed?.deposit || 0,
        rules: parsed?.rules || [],
        suggestedName: parsed?.suggestedName || '',
        suggestedDescription: parsed?.suggestedDescription || ''
      };
    } catch (error) {
      console.error('AI Extraction Error:', error.response?.data || error.message);
      return {
        rent: 0,
        deposit: 0,
        rules: ['Failed to extract rules'],
        suggestedName: '',
        suggestedDescription: ''
      };
    }
  }
}
