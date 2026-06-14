import { Test, TestingModule } from '@nestjs/testing';
import { NotificationsController } from './notifications.controller';
import { NotificationsService } from './notifications.service';
import { MailService } from './mail.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { ExecutionContext } from '@nestjs/common';

describe('NotificationsController', () => {
  let controller: NotificationsController;
  let service: NotificationsService;
  let mailService: MailService;

  const mockNotificationsService = {
    getNotifications: jest.fn().mockResolvedValue([{ id: 'notif-1', title: 'Hello' }]),
    markAsRead: jest.fn().mockResolvedValue({ id: 'notif-1', isRead: true }),
    markAllAsRead: jest.fn().mockResolvedValue({ count: 1 }),
    getConfig: jest.fn().mockResolvedValue({ id: 'default' }),
    updateConfig: jest.fn().mockResolvedValue({ id: 'default', updated: true }),
  };

  const mockMailService = {
    sendTestEmail: jest.fn().mockResolvedValue({ success: true }),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [NotificationsController],
      providers: [
        { provide: NotificationsService, useValue: mockNotificationsService },
        { provide: MailService, useValue: mockMailService },
      ],
    })
      .overrideGuard(JwtAuthGuard)
      .useValue({
        canActivate: (context: ExecutionContext) => true,
      })
      .compile();

    controller = module.get<NotificationsController>(NotificationsController);
    service = module.get<NotificationsService>(NotificationsService);
    mailService = module.get<MailService>(MailService);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  it('should get notifications for current user', async () => {
    const req = { user: { id: 'user-123', role: 'STUDENT' } };
    const result = await controller.getNotifications(req);
    expect(service.getNotifications).toHaveBeenCalledWith('user-123', 'STUDENT');
    expect(result).toEqual([{ id: 'notif-1', title: 'Hello' }]);
  });

  it('should mark notification as read', async () => {
    const req = { user: { id: 'user-123' } };
    const result = await controller.markAsRead('notif-1', req);
    expect(service.markAsRead).toHaveBeenCalledWith('notif-1', 'user-123');
    expect(result.isRead).toBe(true);
  });

  it('should mark all notifications as read', async () => {
    const req = { user: { id: 'user-123' } };
    const result = await controller.markAllAsRead(req);
    expect(service.markAllAsRead).toHaveBeenCalledWith('user-123');
    expect(result.count).toBe(1);
  });

  it('should get config', async () => {
    const result = await controller.getConfig() as any;
    expect(service.getConfig).toHaveBeenCalled();
    expect(result.id).toBe('default');
  });

  it('should update config', async () => {
    const req = { body: { twilioSid: 'new-sid' } };
    const result = await controller.updateConfig(req) as any;
    expect(service.updateConfig).toHaveBeenCalledWith({ twilioSid: 'new-sid' });
    expect(result.updated).toBe(true);
  });

  it('should send test email', async () => {
    const result = await controller.testEmail('test@test.com');
    expect(mailService.sendTestEmail).toHaveBeenCalledWith('test@test.com');
    expect(result.success).toBe(true);
  });
});
