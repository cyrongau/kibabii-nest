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

  /**
   * Generates a payment receipt PDF.
   */
  async generatePaymentReceipt(data: {
    receiptNumber: string;
    tenantName: string;
    propertyName: string;
    unitName: string;
    amountPaid: number;
    paymentDate: Date;
    month: number;
    year: number;
    mpesaReceipt?: string;
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
          .moveDown(0.2);

        doc
          .fillColor('#666666')
          .fontSize(10)
          .text('Campus Housing Made Simple', { align: 'center' })
          .moveDown(1.5);

        doc
          .fillColor('#333333')
          .fontSize(16)
          .text('OFFICIAL PAYMENT RECEIPT', { align: 'center', underline: true })
          .moveDown(2);

        // Receipt Details
        doc.fontSize(12).fillColor('#000000');
        
        doc.text(`Receipt Reference: ${data.receiptNumber}`);
        doc.text(`Date of Issue: ${new Date(data.paymentDate).toLocaleDateString('en-GB')}`);
        doc.moveDown();

        doc.text(`Received From: ${data.tenantName}`);
        doc.text(`For Premises: Unit ${data.unitName}, ${data.propertyName}`);
        doc.text(`Period: ${['', 'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'][data.month]} ${data.year}`);
        doc.moveDown();

        doc.fontSize(14).font('Helvetica-Bold').text(`Amount Settled: Ksh ${data.amountPaid.toLocaleString()}`);
        doc.font('Helvetica').fontSize(12).moveDown();

        if (data.mpesaReceipt) {
          doc.text(`Payment Gateway Reference: M-Pesa (${data.mpesaReceipt})`);
        } else {
          doc.text('Payment Gateway Reference: Wallet / Manual Verify');
        }

        doc.moveDown(3);
        doc.fontSize(10).fillColor('#888888').text('Thank you for choosing Kibabii Nest. This is a system-generated electronic receipt and does not require a physical stamp.', { align: 'center' });

        doc.end();
      } catch (error) {
        this.logger.error('Failed to generate receipt PDF', error);
        reject(error);
      }
    });
  }

  /**
   * Generates a monthly financial report PDF.
   */
  async generateFinancialReport(data: {
    title: string;
    payments: any[];
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
          .moveDown(0.2);

        doc
          .fillColor('#333333')
          .fontSize(16)
          .text(data.title.toUpperCase(), { align: 'center', underline: true })
          .moveDown(1.5);

        // Date generated
        doc
          .fontSize(10)
          .fillColor('#666666')
          .text(`Report Generated: ${new Date().toLocaleDateString('en-GB')} at ${new Date().toLocaleTimeString('en-GB')}`)
          .moveDown(1.5);

        // Column Headers
        doc.fontSize(10).fillColor('#000000');
        const startY = doc.y;
        doc.text('Date', 50, startY, { width: 70 });
        doc.text('Tenant', 120, startY, { width: 100 });
        doc.text('Property/Unit', 220, startY, { width: 150 });
        doc.text('Status', 370, startY, { width: 60 });
        doc.text('Amount (Ksh)', 450, startY, { width: 90, align: 'right' });
        
        doc.moveTo(50, startY + 15).lineTo(550, startY + 15).strokeColor('#cccccc').stroke().moveDown(1.5);

        // Rows
        let currentY = startY + 25;
        data.payments.forEach(p => {
          if (currentY > 700) {
            doc.addPage();
            currentY = 50;
            // Redraw columns
            doc.fontSize(10).fillColor('#000000');
            doc.text('Date', 50, currentY, { width: 70 });
            doc.text('Tenant', 120, currentY, { width: 100 });
            doc.text('Property/Unit', 220, currentY, { width: 150 });
            doc.text('Status', 370, currentY, { width: 60 });
            doc.text('Amount (Ksh)', 450, currentY, { width: 90, align: 'right' });
            doc.moveTo(50, currentY + 15).lineTo(550, currentY + 15).strokeColor('#cccccc').stroke();
            currentY += 25;
          }

          const tenantName = p.tenancy?.tenant?.name || 'N/A';
          const propertyUnitName = p.tenancy?.propertyUnit 
            ? `${p.tenancy.propertyUnit.property.name} - Unit ${p.tenancy.propertyUnit.name}`
            : 'N/A';
          const dateStr = p.paidDate ? new Date(p.paidDate).toLocaleDateString('en-GB') : 'N/A';
          const amountStr = `Ksh ${(p.amountPaid || 0).toLocaleString()}`;

          doc.text(dateStr, 50, currentY, { width: 70 });
          doc.text(tenantName, 120, currentY, { width: 100 });
          doc.text(propertyUnitName, 220, currentY, { width: 150 });
          doc.text(p.status, 370, currentY, { width: 60 });
          doc.text(amountStr, 450, currentY, { width: 90, align: 'right' });

          currentY += 20;
        });

        doc.end();
      } catch (error) {
        reject(error);
      }
    });
  }
}
