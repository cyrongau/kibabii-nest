import { Injectable, Logger } from '@nestjs/common';
import * as nodemailer from 'nodemailer';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class MailService {
  private readonly logger = new Logger(MailService.name);

  constructor(private prisma: PrismaService) {}

  private async getConfig() {
    return this.prisma.systemConfig.findUnique({ where: { id: 'default' } });
  }

  private async getTransporter() {
    const config = await this.getConfig();
    if (!config?.smtpHost || !config?.smtpPort || !config?.smtpUser || !config?.smtpPass) {
      throw new Error('SMTP Configuration is missing or incomplete.');
    }
    return nodemailer.createTransport({
      host: config.smtpHost,
      port: config.smtpPort,
      secure: config.smtpSecure,
      auth: { user: config.smtpUser, pass: config.smtpPass },
    });
  }

  /**
   * Build the branded HTML email wrapper.
   */
  private async buildTemplate(heading: string, bodyHtml: string, ctaText?: string, ctaUrl?: string): Promise<{ html: string; fromEmail: string; fromName: string }> {
    const config = await this.getConfig();
    const brandName = config?.brandName || 'Kibabii Nest';
    const primaryColor = config?.brandPrimaryColor || '#3b82f6';
    const fromEmail = config?.smtpFromEmail || config?.smtpUser || 'noreply@kibabiinest.com';
    const fromName = config?.smtpFromName || brandName;

    const logoHtml = config?.brandLogoUrl
      ? `<img src="${config.brandLogoUrl}" alt="${brandName}" style="max-height: 50px;" />`
      : `<h1 style="color: ${primaryColor}; margin: 0; font-size: 24px; font-weight: 900; letter-spacing: -1px;">${brandName}</h1>`;

    const socialLinks: string[] = [];
    if (config?.socialFacebook) socialLinks.push(`<a href="${config.socialFacebook}" style="margin: 0 8px; color: #94a3b8; text-decoration: none; font-size: 13px;">Facebook</a>`);
    if (config?.socialInstagram) socialLinks.push(`<a href="${config.socialInstagram}" style="margin: 0 8px; color: #94a3b8; text-decoration: none; font-size: 13px;">Instagram</a>`);
    if (config?.socialTwitter) socialLinks.push(`<a href="${config.socialTwitter}" style="margin: 0 8px; color: #94a3b8; text-decoration: none; font-size: 13px;">X</a>`);
    if (config?.socialYoutube) socialLinks.push(`<a href="${config.socialYoutube}" style="margin: 0 8px; color: #94a3b8; text-decoration: none; font-size: 13px;">YouTube</a>`);
    if (config?.socialTiktok) socialLinks.push(`<a href="${config.socialTiktok}" style="margin: 0 8px; color: #94a3b8; text-decoration: none; font-size: 13px;">TikTok</a>`);

    const ctaHtml = ctaText ? `
      <div style="margin-top: 30px; text-align: center;">
        <a href="${ctaUrl || '#'}" style="background-color: ${primaryColor}; color: #ffffff; padding: 14px 32px; text-decoration: none; border-radius: 10px; font-weight: 700; display: inline-block; font-size: 14px;">
          ${ctaText}
        </a>
      </div>
    ` : '';

    const html = `
    <!DOCTYPE html>
    <html>
    <head><meta charset="utf-8" /><meta name="viewport" content="width=device-width, initial-scale=1.0" /></head>
    <body style="margin: 0; padding: 0; background-color: #f1f5f9; font-family: 'Inter', 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;">
      <div style="max-width: 600px; margin: 40px auto; border-radius: 16px; overflow: hidden; border: 1px solid #e2e8f0; background-color: #ffffff;">
        <!-- Header -->
        <div style="background-color: #f8fafc; padding: 24px 30px; text-align: center; border-bottom: 1px solid #e2e8f0;">
          ${logoHtml}
        </div>
        <!-- Body -->
        <div style="padding: 36px 30px;">
          <h2 style="color: #0f172a; margin: 0 0 20px 0; font-size: 22px; font-weight: 800;">${heading}</h2>
          <div style="color: #475569; line-height: 1.7; font-size: 15px;">
            ${bodyHtml}
          </div>
          ${ctaHtml}
        </div>
        <!-- Footer -->
        <div style="background-color: #f8fafc; padding: 24px 30px; text-align: center; border-top: 1px solid #e2e8f0;">
          ${socialLinks.length > 0 ? `<div style="margin-bottom: 16px;">${socialLinks.join(' · ')}</div>` : ''}
          <p style="color: #94a3b8; font-size: 11px; margin: 0; font-weight: 600;">
            &copy; ${new Date().getFullYear()} ${brandName}. All rights reserved.
          </p>
          <p style="color: #cbd5e1; font-size: 10px; margin: 8px 0 0 0;">
            Kibabii University · Bungoma, Kenya
          </p>
        </div>
      </div>
    </body>
    </html>
    `;

    return { html, fromEmail, fromName };
  }

  /**
   * Send a generic branded notification email.
   */
  async sendNotificationEmail(to: string, subject: string, mainContent: string, secondaryContent?: string, ctaText?: string, ctaUrl?: string) {
    try {
      const transporter = await this.getTransporter();
      const bodyHtml = `
        <p>${mainContent}</p>
        ${secondaryContent ? `<p style="margin-top: 16px;">${secondaryContent}</p>` : ''}
      `;
      const { html, fromEmail, fromName } = await this.buildTemplate(subject, bodyHtml, ctaText, ctaUrl);

      await transporter.sendMail({
        from: `"${fromName}" <${fromEmail}>`,
        to,
        subject,
        html,
      });

      this.logger.log(`Email sent: "${subject}" → ${to}`);
    } catch (error: any) {
      this.logger.error(`Failed to send email to ${to}: ${error.message}`);
    }
  }

  /**
   * Send new user registration notice to admin.
   */
  async sendNewUserNotification(userName: string, userEmail: string, userRole: string) {
    const admins = await this.prisma.user.findMany({ where: { role: 'ADMIN' } });
    for (const admin of admins) {
      await this.sendNotificationEmail(
        admin.email,
        `New ${userRole} Registration`,
        `A new user has registered on the platform:`,
        `<strong>Name:</strong> ${userName}<br/><strong>Email:</strong> ${userEmail}<br/><strong>Role:</strong> ${userRole}`,
        'View Users'
      );
    }
  }

  /**
   * Send new property submission notice to admin.
   */
  async sendNewPropertyNotification(propertyName: string, landlordName: string, address: string, unitCount: number) {
    const admins = await this.prisma.user.findMany({ where: { role: 'ADMIN' } });
    for (const admin of admins) {
      await this.sendNotificationEmail(
        admin.email,
        'New Property Submitted for Approval',
        `A new property has been submitted and is awaiting your review:`,
        `<strong>Property:</strong> ${propertyName}<br/><strong>Landlord:</strong> ${landlordName}<br/><strong>Location:</strong> ${address}<br/><strong>Unit Types:</strong> ${unitCount}`,
        'Review Property'
      );
    }
  }

  /**
   * Send booking confirmation email.
   */
  async sendBookingNotification(tenantEmail: string, tenantName: string, propertyName: string, unitType: string, amount: number, status: string) {
    await this.sendNotificationEmail(
      tenantEmail,
      `Booking ${status}`,
      `Hi <strong>${tenantName}</strong>, your booking request for <strong>${propertyName}</strong> (${unitType}) has been <strong>${status.toLowerCase()}</strong>.`,
      status === 'APPROVED'
        ? `Amount: <strong>Ksh ${amount.toLocaleString()}</strong>. Your landlord will set up your tenancy shortly.`
        : `If you have questions, please contact your landlord or our support team.`,
      'View Booking'
    );
  }

  /**
   * Send vacation notice notification to landlord.
   */
  async sendVacationNoticeNotification(landlordEmail: string, tenantName: string, propertyName: string, unitName: string, vacationDate: Date) {
    await this.sendNotificationEmail(
      landlordEmail,
      '📋 Vacation Notice Received',
      `<strong>${tenantName}</strong> has filed a 30-day vacation notice for <strong>${unitName || 'their unit'}</strong> at <strong>${propertyName}</strong>.`,
      `The unit will be vacated on <strong>${vacationDate.toLocaleDateString()}</strong>. It will automatically appear in live listings with a countdown timer.`,
      'View Tenancy'
    );
  }

  /**
   * Send payment receipt submitted notification to landlord.
   */
  async sendReceiptSubmittedNotification(landlordEmail: string, tenantName: string, propertyName: string, amount: number, monthYear: string) {
    await this.sendNotificationEmail(
      landlordEmail,
      '💳 Payment Receipt Submitted',
      `<strong>${tenantName}</strong> has submitted a payment receipt for <strong>${propertyName}</strong>.`,
      `<strong>Amount:</strong> Ksh ${amount.toLocaleString()}<br/><strong>Period:</strong> ${monthYear}<br/><br/>Please review and verify the payment in your dashboard.`,
      'Verify Payment'
    );
  }

  /**
   * Send payment verified notification to tenant.
   */
  async sendPaymentVerifiedNotification(tenantEmail: string, tenantName: string, propertyName: string, amount: number, monthYear: string) {
    await this.sendNotificationEmail(
      tenantEmail,
      '✅ Payment Verified',
      `Hi <strong>${tenantName}</strong>, your payment for <strong>${propertyName}</strong> has been verified by your landlord.`,
      `<strong>Amount:</strong> Ksh ${amount.toLocaleString()}<br/><strong>Period:</strong> ${monthYear}<br/><br/>Thank you for your timely payment!`,
      'View Receipt'
    );
  }

  /**
   * Send service request notification to landlord.
   */
  async sendServiceRequestNotification(landlordEmail: string, tenantName: string, propertyName: string, title: string, priority: string) {
    await this.sendNotificationEmail(
      landlordEmail,
      `🔧 Service Request: ${title}`,
      `<strong>${tenantName}</strong> has filed a service request at <strong>${propertyName}</strong>.`,
      `<strong>Issue:</strong> ${title}<br/><strong>Priority:</strong> ${priority}<br/><br/>Please attend to this request as soon as possible.`,
      'View Request'
    );
  }

  /**
   * Send KYC approval notification to landlord.
   */
  async sendKycApprovedNotification(landlordEmail: string, landlordName: string) {
    await this.sendNotificationEmail(
      landlordEmail,
      `✅ Account Verified Successfully`,
      `Hi <strong>${landlordName}</strong>, your account verification is complete!`,
      `<p>We have reviewed your KYC documents and your account has been fully verified.</p><p>You now have full access to post and manage your properties on Kibabii Nest.</p>`,
      'Go to Dashboard'
    );
  }

  /**
   * Send test email.
   */
  async sendTestEmail(to: string) {
    try {
      const transporter = await this.getTransporter();
      const { html, fromEmail, fromName } = await this.buildTemplate(
        'Connection Successful! ✨',
        `<p>This is a test email to verify your SMTP configuration.</p>
         <p>If you received this, your custom email settings and branding are working perfectly!</p>`,
        'Return to Dashboard'
      );

      await transporter.sendMail({
        from: `"${fromName}" <${fromEmail}>`,
        to,
        subject: `Test Email from ${fromName}`,
        html,
      });

      return { success: true, message: 'Test email sent successfully' };
    } catch (error: any) {
      this.logger.error('Failed to send test email', error.stack);
      throw new Error(`Failed to send test email: ${error.message}`);
    }
  }
}
