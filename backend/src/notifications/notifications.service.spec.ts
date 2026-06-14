import { Test, TestingModule } from '@nestjs/testing';
import { NotificationsService } from './notifications.service';
import { PrismaService } from '../prisma/prisma.service';
import * as admin from 'firebase-admin';
import { Twilio } from 'twilio';

// Create a mock list variable prefixed with "mock" so Jest allows it in the mock factory
const mockAppsList: any[] = [];

// Mock firebase-admin
jest.mock('firebase-admin', () => {
  const mockSend = jest.fn().mockResolvedValue('message-id-123');
  return {
    get apps() {
      return mockAppsList;
    },
    initializeApp: jest.fn().mockImplementation(() => {
      mockAppsList.push({ name: '[default]', delete: jest.fn().mockResolvedValue(true) });
    }),
    credential: {
      cert: jest.fn().mockReturnValue({}),
    },
    messaging: jest.fn(() => ({
      send: mockSend,
    })),
  };
});

// Mock Twilio
jest.mock('twilio', () => {
  const mockCreate = jest.fn().mockResolvedValue({ sid: 'sms-sid-123' });
  return {
    Twilio: jest.fn().mockImplementation(() => ({
      messages: {
        create: mockCreate,
      },
    })),
  };
});

describe('NotificationsService', () => {
  let service: NotificationsService;
  let prisma: PrismaService;

  const mockSystemConfig = {
    id: 'default',
    firebaseConfig: { projectId: 'test' },
    smsProvider: 'TWILIO',
    twilioSid: 'sid',
    twilioAuthToken: 'token',
    twilioPhoneNumber: '+1234567890',
  };

  const mockUser = {
    id: 'user-123',
    name: 'Jane Student',
    phone: '+254700000000',
  };

  const mockPrismaService = {
    systemConfig: {
      findUnique: jest.fn().mockResolvedValue(mockSystemConfig),
      upsert: jest.fn().mockResolvedValue(mockSystemConfig),
    },
    user: {
      findUnique: jest.fn().mockResolvedValue(mockUser),
    },
    notification: {
      create: jest.fn().mockImplementation(({ data }) => ({ id: 'notif-1', ...data })),
      update: jest.fn().mockResolvedValue({ id: 'notif-1', isRead: true }),
      updateMany: jest.fn().mockResolvedValue({ count: 5 }),
      findMany: jest.fn().mockResolvedValue([]),
    },
  };

  beforeEach(async () => {
    // Clear mock histories
    jest.clearAllMocks();
    mockAppsList.length = 0; // reset apps array

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        NotificationsService,
        { provide: PrismaService, useValue: mockPrismaService },
      ],
    }).compile();

    service = module.get<NotificationsService>(NotificationsService);
    prisma = module.get<PrismaService>(PrismaService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('onModuleInit', () => {
    it('should initialize firebase if config exists', async () => {
      await service.onModuleInit();
      expect(admin.initializeApp).toHaveBeenCalled();
    });
  });

  describe('sendNotification', () => {
    it('should create notification in DB and dispatch external push and SMS', async () => {
      // Setup firebase apps so it acts as initialized
      mockAppsList.push({ name: 'default' });

      const result = await service.sendNotification('user-123', 'Rent Due', 'Your rent is due', 'payment', '/payments');

      expect(prisma.notification.create).toHaveBeenCalledWith({
        data: {
          userId: 'user-123',
          title: 'Rent Due',
          message: 'Your rent is due',
          type: 'payment',
          link: '/payments',
        },
      });

      expect(admin.messaging().send).toHaveBeenCalledWith({
        topic: 'user_user-123',
        notification: { title: 'Rent Due', body: 'Your rent is due' },
        data: {
          click_action: 'FLUTTER_NOTIFICATION_CLICK',
          link: '/payments',
          type: 'notification',
        },
      });

      expect(result!.id).toBe('notif-1');
      expect(result!.title).toBe('Rent Due');
    });
  });

  describe('updateConfig', () => {
    it('should upsert the config and re-initialize Firebase admin', async () => {
      mockAppsList.push({ name: 'default', delete: jest.fn().mockResolvedValue(true) });

      const newConfig = {
        firebaseConfig: { projectId: 'new-project' },
        twilioSid: 'new-sid',
      };

      await service.updateConfig(newConfig);

      expect(prisma.systemConfig.upsert).toHaveBeenCalled();
      expect(admin.initializeApp).toHaveBeenCalled();
    });
  });
});
