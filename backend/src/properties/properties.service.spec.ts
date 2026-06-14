import { Test, TestingModule } from '@nestjs/testing';
import { PropertiesService } from './properties.service';
import { PrismaService } from '../prisma/prisma.service';
import { MailService } from '../notifications/mail.service';

describe('PropertiesService', () => {
  let service: PropertiesService;

  const mockPrismaService = {
    category: {
      upsert: jest.fn(),
    },
    propertyType: {
      upsert: jest.fn(),
    },
    property: {
      create: jest.fn(),
      update: jest.fn(),
      findUnique: jest.fn(),
      findMany: jest.fn(),
      count: jest.fn(),
      delete: jest.fn(),
    },
    propertyUnit: {
      deleteMany: jest.fn(),
      upsert: jest.fn(),
    },
    user: {
      findUnique: jest.fn(),
      update: jest.fn(),
    },
    tenancy: {
      count: jest.fn(),
    },
    booking: {
      count: jest.fn(),
    },
    payment: {
      findMany: jest.fn(),
      count: jest.fn(),
    },
    withdrawal: {
      findMany: jest.fn(),
    },
    $transaction: jest.fn((input) => {
      if (typeof input === 'function') {
        return input(mockPrismaService);
      }
      return Promise.all(input);
    }),
  };

  const mockMailService = {
    sendNewPropertyNotification: jest.fn().mockResolvedValue(true),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        PropertiesService,
        { provide: PrismaService, useValue: mockPrismaService },
        { provide: MailService, useValue: mockMailService },
      ],
    }).compile();

    service = module.get<PropertiesService>(PropertiesService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
