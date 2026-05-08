import { Injectable, OnModuleInit } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import * as admin from 'firebase-admin';
import { Twilio } from 'twilio';

@Injectable()
export class NotificationsService implements OnModuleInit {
  private twilioClient: Twilio | null = null;

  constructor(private prisma: PrismaService) {}

  async onModuleInit() {
    // Initialize Firebase Admin if credentials exist
    try {
      const config = await this.prisma.systemConfig.findUnique({ where: { id: 'default' } });
      if (config?.firebaseConfig && admin.apps.length === 0) {
        admin.initializeApp({
          credential: admin.credential.cert(config.firebaseConfig as any),
        });
      }
    } catch (error) {
      console.warn('Firebase initialization skipped: No config found');
    }
  }

  async sendNotification(userId: string, title: string, message: string, type: string = 'info', link?: string) {
    // 1. Save to Database (In-app)
    const notification = await this.prisma.notification.create({
      data: { userId, title, message, type, link }
    });

    // 2. Dispatch externally (Push/SMS)
    await this.dispatchExternal(userId, title, message, link);

    return notification;
  }

  private async dispatchExternal(userId: string, title: string, message: string, link?: string) {
    const config = await this.prisma.systemConfig.findUnique({ where: { id: 'default' } });
    const user = await this.prisma.user.findUnique({ where: { id: userId } });

    if (!config || !user) return;

    // 1. Attempt Push Notification if user has a token (stored in a future field or for all active devices)
    // For now we assume push is default via Firebase if configured
    if (config.firebaseConfig) {
      await this.sendPushNotification(userId, title, message, link);
    }

    // 2. Attempt SMS if provider is set
    if (user.phone) {
      if (config.smsProvider === 'TWILIO' && config.twilioSid && config.twilioAuthToken) {
        await this.sendTwilioSms(config, user.phone, message);
      } else if (config.smsProvider === 'FIREBASE') {
        await this.sendFirebaseSms(user.phone, message);
      }
    }
  }

  private async sendPushNotification(userId: string, title: string, message: string, link?: string) {
    if (admin.apps.length === 0) return;

    try {
      // In a production app, you'd fetch the user's FCM tokens from a 'UserDevice' table
      // For this implementation, we broadcast to a topic named after the userId
      // The mobile app will subscribe to 'user_[userId]' topic on login
      await admin.messaging().send({
        topic: `user_${userId}`,
        notification: { title, body: message },
        data: { 
          click_action: 'FLUTTER_NOTIFICATION_CLICK',
          link: link || '',
          type: 'notification'
        },
      });
      console.log(`[Firebase Push] Sent to topic: user_${userId}`);
    } catch (error) {
      console.error('Firebase Push Error:', error.message);
    }
  }

  private async sendFirebaseSms(phone: string, message: string) {
    console.log(`[Firebase SMS Proxy] To: ${phone} | Msg: ${message}`);
  }

  private async sendTwilioSms(config: any, phone: string, message: string) {
    try {
      if (!this.twilioClient) {
        this.twilioClient = new Twilio(config.twilioSid, config.twilioAuthToken);
      }
      await this.twilioClient.messages.create({
        body: message,
        from: config.twilioPhoneNumber,
        to: phone,
      });
    } catch (error) {
      console.error('Twilio SMS Error:', error.message);
    }
  }

  async getNotifications(userId: string, role?: string) {
    const where: any = { userId };
    
    // If admin, filter out landlord announcements to tenants or tenant-specific reactions
    if (role === 'ADMIN') {
      where.type = {
        in: ['support', 'kyc', 'payment', 'system', 'admin_alert']
      };
    }

    return this.prisma.notification.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      take: 20,
    });
  }

  async markAsRead(id: string, userId: string) {
    return this.prisma.notification.update({
      where: { id, userId },
      data: { isRead: true }
    });
  }

  async markAllAsRead(userId: string) {
    return this.prisma.notification.updateMany({
      where: { userId },
      data: { isRead: true }
    });
  }

  async getConfig() {
    return this.prisma.systemConfig.findUnique({ where: { id: 'default' } });
  }

  async updateConfig(data: any) {
    const updated = await this.prisma.systemConfig.upsert({
      where: { id: 'default' },
      update: data,
      create: { ...data, id: 'default' }
    });

    // Re-initialize Firebase if config changed
    if (data.firebaseConfig) {
      try {
        if (admin.apps.length > 0) {
          await Promise.all(admin.apps.map(app => app?.delete()));
        }
        admin.initializeApp({
          credential: admin.credential.cert(data.firebaseConfig as any),
        });
        console.log('✅ Firebase Admin re-initialized with new config');
      } catch (e) {
        console.error('❌ Failed to re-initialize Firebase:', e.message);
      }
    }

    // Reset Twilio client to force re-init with new credentials
    if (data.twilioSid || data.twilioAuthToken) {
      this.twilioClient = null;
    }

    return updated;
  }
}
