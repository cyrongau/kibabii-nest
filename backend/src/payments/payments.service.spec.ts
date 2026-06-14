import { Test, TestingModule } from '@nestjs/testing';
import { PaymentsService } from './payments.service';
import { PrismaService } from '../prisma/prisma.service';
import { NotificationsService } from '../notifications/notifications.service';
import { S3Service } from '../uploads/s3.service';
import { PdfService } from '../tenancy/pdf.service';
import { PaymentRecordStatus } from '@prisma/client';
import { NotFoundException, BadRequestException } from '@nestjs/common';

describe('PaymentsService', () => {
  let service: PaymentsService;
  let prisma: PrismaService;
  let notifications: NotificationsService;

  const mockPrismaService = {
    tenancy: {
      findMany: jest.fn(),
    },
    payment: {
      findFirst: jest.fn(),
      findUnique: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      findMany: jest.fn(),
    },
    paymentReceipt: {
      upsert: jest.fn(),
      update: jest.fn(),
    },
    user: {
      update: jest.fn(),
      findUnique: jest.fn(),
    },
    walletTransaction: {
      create: jest.fn(),
    },
    $transaction: jest.fn((input) => {
      if (typeof input === 'function') {
        return input(mockPrismaService);
      }
      return Promise.all(input);
    }),
  };

  const mockNotificationsService = {
    sendNotification: jest.fn().mockResolvedValue(true),
  };

  const mockS3Service = {
    getFileBase64: jest.fn(),
  };

  const mockPdfService = {
    generateReceiptPdf: jest.fn().mockResolvedValue(Buffer.from('pdf')),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        PaymentsService,
        { provide: PrismaService, useValue: mockPrismaService },
        { provide: NotificationsService, useValue: mockNotificationsService },
        { provide: S3Service, useValue: mockS3Service },
        { provide: PdfService, useValue: mockPdfService },
      ],
    }).compile();

    service = module.get<PaymentsService>(PaymentsService);
    prisma = module.get<PrismaService>(PrismaService);
    notifications = module.get<NotificationsService>(NotificationsService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('generateMonthlyPayments', () => {
    it('should generate monthly payments for active tenancies', async () => {
      const mockTenancies = [
        {
          id: 'tenancy-1',
          status: 'ACTIVE',
          monthlyRent: 15000,
          paymentDeadlineDay: 5,
          breakPeriodEnabled: false,
        },
      ];

      mockPrismaService.tenancy.findMany.mockResolvedValue(mockTenancies);
      mockPrismaService.payment.findFirst.mockResolvedValue(null);
      mockPrismaService.payment.create.mockResolvedValue({});

      const result = await service.generateMonthlyPayments();

      expect(prisma.tenancy.findMany).toHaveBeenCalled();
      expect(prisma.payment.findFirst).toHaveBeenCalled();
      expect(prisma.payment.create).toHaveBeenCalled();
      expect(result.created).toBe(1);
    });

    it('should skip tenancy if payment already exists for the current month', async () => {
      const mockTenancies = [
        {
          id: 'tenancy-1',
          status: 'ACTIVE',
          monthlyRent: 15000,
          paymentDeadlineDay: 5,
        },
      ];

      mockPrismaService.tenancy.findMany.mockResolvedValue(mockTenancies);
      mockPrismaService.payment.findFirst.mockResolvedValue({ id: 'existing-payment' });

      const result = await service.generateMonthlyPayments();

      expect(prisma.payment.create).not.toHaveBeenCalled();
      expect(result.created).toBe(0);
    });

    it('should apply break period rent reduction if active', async () => {
      const now = new Date();
      const month = now.getMonth() + 1;
      const mockTenancies = [
        {
          id: 'tenancy-1',
          status: 'BREAK_HOLD',
          monthlyRent: 10000,
          paymentDeadlineDay: 5,
          breakPeriodEnabled: true,
          breakPeriodStart: month - 1 || 1,
          breakPeriodEnd: month + 1,
          breakPeriodRentPct: 40,
        },
      ];

      mockPrismaService.tenancy.findMany.mockResolvedValue(mockTenancies);
      mockPrismaService.payment.findFirst.mockResolvedValue(null);
      mockPrismaService.payment.create.mockResolvedValue({});

      const result = await service.generateMonthlyPayments();

      expect(prisma.payment.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          amountDue: 4000, // 40% of 10000
        }),
      });
      expect(result.created).toBe(1);
    });
  });

  describe('processOverduePayments', () => {
    it('should identify overdue payments and apply penalties', async () => {
      const mockOverduePayments = [
        {
          id: 'payment-1',
          status: PaymentRecordStatus.PENDING,
          dueDate: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000), // 2 days ago
          tenancy: {
            id: 'tenancy-1',
            latePenaltyPerDay: 100,
          },
        },
      ];

      mockPrismaService.payment.findMany.mockResolvedValue(mockOverduePayments);
      mockPrismaService.payment.update.mockResolvedValue({});

      const result = await service.processOverduePayments();

      expect(prisma.payment.findMany).toHaveBeenCalled();
      expect(prisma.payment.update).toHaveBeenCalledWith({
        where: { id: 'payment-1' },
        data: {
          status: PaymentRecordStatus.OVERDUE,
          penaltyAmount: 200, // 2 days late * 100 per day
        },
      });
      expect(result.processed).toBe(1);
    });
  });

  describe('verifyPayment', () => {
    it('should approve a submitted payment and update balances', async () => {
      const mockPayment = {
        id: 'payment-1',
        amountDue: 5000,
        status: PaymentRecordStatus.SUBMITTED,
        bookingId: 'booking-1',
        receipt: { id: 'receipt-1', aiAmount: 5000 },
        tenancy: null,
        booking: {
          id: 'booking-1',
          student: { id: 'student-123', name: 'Student' },
          propertyUnit: {
            property: { landlordId: 'landlord-456' },
          },
        },
      };

      mockPrismaService.payment.findUnique.mockResolvedValue(mockPayment);
      mockPrismaService.payment.update.mockResolvedValue({});
      mockPrismaService.paymentReceipt.update.mockResolvedValue({});
      mockPrismaService.user.update.mockResolvedValue({});

      const result = await service.verifyPayment('payment-1', true);

      expect(prisma.payment.findUnique).toHaveBeenCalledWith({
        where: { id: 'payment-1' },
        include: expect.any(Object),
      });
      expect(prisma.payment.update).toHaveBeenCalled();
      expect(prisma.user.update).toHaveBeenCalledWith({
        where: { id: 'landlord-456' },
        data: { balance: { increment: 4750 } }, // 5000 - 5% commission
      });
      expect(notifications.sendNotification).toHaveBeenCalledWith(
        'student-123',
        'Payment Verified',
        expect.stringContaining('Ksh 5000'),
        'PAYMENT',
        '/bookings',
      );
      expect(result.status).toBe('VERIFIED');
    });

    it('should reject a submitted payment', async () => {
      const mockPayment = {
        id: 'payment-1',
        amountDue: 5000,
        status: PaymentRecordStatus.SUBMITTED,
        bookingId: null,
        receipt: null,
        tenancy: {
          id: 'tenancy-1',
          tenant: { id: 'tenant-123', name: 'Tenant' },
          propertyUnit: {
            property: { landlordId: 'landlord-456' },
          },
        },
        booking: null,
      };

      mockPrismaService.payment.findUnique.mockResolvedValue(mockPayment);
      mockPrismaService.payment.update.mockResolvedValue({});

      const result = await service.verifyPayment('payment-1', false);

      expect(prisma.payment.update).toHaveBeenCalledWith({
        where: { id: 'payment-1' },
        data: { status: PaymentRecordStatus.REJECTED },
      });
      expect(notifications.sendNotification).toHaveBeenCalledWith(
        'tenant-123',
        'Payment Rejected',
        expect.stringContaining('rejected'),
        'PAYMENT',
        '/residency/tenancy',
      );
      expect(result.status).toBe('REJECTED');
    });

    it('should throw NotFoundException if payment not found', async () => {
      mockPrismaService.payment.findUnique.mockResolvedValue(null);

      await expect(service.verifyPayment('invalid-id', true)).rejects.toThrow(NotFoundException);
    });
  });

  describe('payWithWallet', () => {
    it('should deduct user balance and mark payment as paid', async () => {
      const mockPayment = {
        id: 'payment-1',
        amountDue: 3000,
        discountAmount: 200,
        penaltyAmount: 100,
        status: PaymentRecordStatus.PENDING,
        month: 6,
        year: 2026,
        tenancy: {
          id: 'tenancy-1',
          propertyUnit: {
            property: { landlordId: 'landlord-1' },
          },
        },
        booking: null,
      };

      const mockStudentUser = {
        balance: 5000,
      };

      mockPrismaService.payment.findUnique.mockResolvedValue(mockPayment);
      mockPrismaService.user.findUnique.mockResolvedValue(mockStudentUser);
      mockPrismaService.user.update.mockResolvedValue({});
      mockPrismaService.payment.update.mockResolvedValue({});

      await service.payWithWallet('payment-1', 'student-1');

      expect(prisma.user.findUnique).toHaveBeenCalledWith({
        where: { id: 'student-1' },
        select: { balance: true },
      });
      // amountPaid should be amountDue (3000) - discount (200) + penalty (100) = 2900
      expect(prisma.user.update).toHaveBeenCalledWith({
        where: { id: 'student-1' },
        data: { balance: { decrement: 2900 } },
      });
      expect(prisma.user.update).toHaveBeenCalledWith({
        where: { id: 'landlord-1' },
        data: { balance: { increment: 2755 } }, // 2900 - 5% commission
      });
    });

    it('should throw BadRequestException if balance is insufficient', async () => {
      const mockPayment = {
        id: 'payment-1',
        amountDue: 3000,
        discountAmount: 0,
        penaltyAmount: 0,
        status: PaymentRecordStatus.PENDING,
        tenancy: {
          id: 'tenancy-1',
          propertyUnit: {
            property: { landlordId: 'landlord-1' },
          },
        },
        booking: null,
      };

      const mockStudentUser = {
        balance: 1000,
      };

      mockPrismaService.payment.findUnique.mockResolvedValue(mockPayment);
      mockPrismaService.user.findUnique.mockResolvedValue(mockStudentUser);

      await expect(service.payWithWallet('payment-1', 'student-1')).rejects.toThrow(BadRequestException);
    });
  });
});
