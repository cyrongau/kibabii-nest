import { Injectable } from '@nestjs/common';
import { NotificationsService } from '../notifications/notifications.service';
import { MailService } from '../notifications/mail.service';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class OtpService {
  private otps = new Map<string, { code: string; expires: number }>();
  private resetOtps = new Map<string, { code: string; expires: number }>();

  constructor(
    private prisma: PrismaService,
    private notificationsService: NotificationsService,
    private mailService: MailService,
  ) {}

  async generateAndSendOtp(userId: string, phone?: string) {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user) return false;

    const code = Math.floor(100000 + Math.random() * 900000).toString();
    const expires = Date.now() + 10 * 60 * 1000; // 10 minutes

    this.otps.set(userId, { code, expires });

    // 1. Send via Email (Primary 2FA channel)
    try {
      await this.mailService.sendNotificationEmail(
        user.email,
        'Your 2FA Verification Code',
        `Hello ${user.name},<br/><br/>Your Kibabii Nest two-factor authentication verification code is:`,
        `<strong style="font-size: 24px; letter-spacing: 2px; color: #3b82f6;">${code}</strong><br/><br/>This code is valid for 10 minutes. If you did not request this, please secure your account.`,
        'Verify Login'
      );
    } catch (error) {
      console.error('Failed to send 2FA email:', error.message);
    }

    // 2. Send via In-app / SMS if phone is available
    const recipientPhone = phone || user.phone;
    if (recipientPhone) {
      try {
        await this.notificationsService.sendNotification(
          userId,
          'Your Verification Code',
          `Your Kibabii Nest verification code is: ${code}. Valid for 10 minutes.`,
          'security'
        );
      } catch (error) {
        console.error('Failed to send 2FA SMS/Push:', error.message);
      }
    }

    return true;
  }

  verifyOtp(userId: string, code: string): boolean {
    const stored = this.otps.get(userId);
    if (!stored) return false;

    if (Date.now() > stored.expires) {
      this.otps.delete(userId);
      return false;
    }

    if (stored.code === code) {
      this.otps.delete(userId);
      return true;
    }

    return false;
  }

  // --- Password Reset OTP Registry ---

  async generateAndSendPasswordResetOtp(email: string) {
    const user = await this.prisma.user.findUnique({ where: { email } });
    if (!user) {
      // Do not disclose user existence (prevent user enumeration)
      return true;
    }

    const code = Math.floor(100000 + Math.random() * 900000).toString();
    const expires = Date.now() + 15 * 60 * 1000; // 15 minutes

    this.resetOtps.set(email, { code, expires });

    try {
      await this.mailService.sendNotificationEmail(
        email,
        'Password Reset Code',
        `Hello ${user.name},<br/><br/>You requested to reset your password. Your password reset verification code is:`,
        `<strong style="font-size: 24px; letter-spacing: 2px; color: #e11d48;">${code}</strong><br/><br/>This code is valid for 15 minutes. If you did not request this, please ignore this email.`,
        'Reset Password'
      );
    } catch (error) {
      console.error('Failed to send password reset email:', error.message);
    }

    return true;
  }

  verifyPasswordResetOtp(email: string, code: string): boolean {
    const stored = this.resetOtps.get(email);
    if (!stored) return false;

    if (Date.now() > stored.expires) {
      this.resetOtps.delete(email);
      return false;
    }

    if (stored.code === code) {
      this.resetOtps.delete(email);
      return true;
    }

    return false;
  }
}

