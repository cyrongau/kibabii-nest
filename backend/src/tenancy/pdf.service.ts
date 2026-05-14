import { Injectable, Logger } from '@nestjs/common';
import * as PDFDocument from 'pdfkit';
import PDFKit = require('pdfkit');

@Injectable()
export class PdfService {
  private readonly logger = new Logger(PdfService.name);

  /**
   * Generates a branded tenancy agreement PDF and returns it as a Buffer.
   * If a base64 signature is provided, it embeds the signature at the bottom.
   */
  async generateTenancyAgreement(data: {
    tenantName: string;
    landlordName: string;
    propertyName: string;
    unitName: string;
    rentAmount: number;
    depositAmount: number;
    signatureBase64?: string; // e.g. "data:image/png;base64,iVBORw0..."
  }): Promise<Buffer> {
    return new Promise((resolve, reject) => {
      try {
        const doc = new PDFKit({ margin: 50 });
        const buffers: Buffer[] = [];

        doc.on('data', buffers.push.bind(buffers));
        doc.on('end', () => {
          resolve(Buffer.concat(buffers));
        });

        // Branding Header
        doc
          .fillColor('#003366') // Kibabii branding color
          .fontSize(24)
          .text('KIBABII NEST', { align: 'center' })
          .moveDown(0.5);

        doc
          .fillColor('#333333')
          .fontSize(16)
          .text('TENANCY AGREEMENT', { align: 'center', underline: true })
          .moveDown(2);

        // Agreement Body
        doc.fontSize(12).fillColor('#000000');
        const text = `This Tenancy Agreement is made between ${data.landlordName} (the "Landlord") and ${data.tenantName} (the "Tenant").\n\n` +
          `The Landlord agrees to let and the Tenant agrees to take the property known as ${data.unitName} at ${data.propertyName}.\n\n` +
          `FINANCIAL TERMS:\n` +
          `- Monthly Rent: Ksh ${data.rentAmount}\n` +
          `- Security Deposit: Ksh ${data.depositAmount}\n\n` +
          `The Tenant agrees to pay the rent on time and maintain the property in good condition. ` +
          `This agreement is governed by the laws of Kenya.\n\n`;

        doc.text(text, { align: 'justify' }).moveDown(2);

        // Signatures Section
        doc.fontSize(14).text('SIGNATURES').moveDown();

        doc.fontSize(12).text(`Landlord: ${data.landlordName}`);
        doc.moveDown(2);
        
        doc.text(`Tenant: ${data.tenantName}`);

        if (data.signatureBase64) {
          // Extract base64 part
          const base64Data = data.signatureBase64.replace(/^data:image\/\w+;base64,/, '');
          const imgBuffer = Buffer.from(base64Data, 'base64');
          // Add image
          doc.image(imgBuffer, {
            fit: [150, 50]
          });
        } else {
          doc.moveDown(2);
          doc.text('_____________________________'); // Signature line if no digital signature
        }

        doc.end();
      } catch (error) {
        this.logger.error('Failed to generate PDF', error);
        reject(error);
      }
    });
  }
}
