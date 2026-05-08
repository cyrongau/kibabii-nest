import { Injectable } from '@nestjs/common';
import { NotificationsService } from '../notifications/notifications.service';
import * as crypto from 'crypto';

@Injectable()
export class OtpService {
  private otps = new Map<string, { code: string; expires: number }>();

  constructor(private notificationsService: NotificationsService) {}

  async generateAndSendOtp(userId: string, phone: string) {
    const code = Math.floor(100000 + Math.random() * 900000).toString();
    const expires = Date.now() + 10 * 60 * 1000; // 10 minutes

    this.otps.set(userId, { code, expires });

    await this.notificationsService.sendNotification(
      userId,
      'Your Verification Code',
      `Your Kibabii Nest verification code is: ${code}. Valid for 10 minutes.`,
      'security'
    );

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
}
