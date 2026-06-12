import { Test, TestingModule } from '@nestjs/testing';
import { TenancyService } from './tenancy.service';
import { PrismaService } from '../prisma/prisma.service';
import { PdfService } from './pdf.service';
import { S3Service } from '../uploads/s3.service';
import { TenancyStatus } from '@prisma/client';
import { NotFoundException, BadRequestException } from '@nestjs/common';

describe('TenancyService', () => {
  let service: TenancyService;
  let prisma: PrismaService;
  let pdfService: PdfService;
  let s3Service: S3Service;

  const mockBooking = {
    id: 'booking-123',
    studentId: 'student-1',
    propertyUnitId: 'unit-1',
    status: 'APPROVED',
    propertyUnit: { id: 'unit-1', price: 10000 },
    student: { id: 'student-1', name: 'Jane' },
  };

  const mockTenancy = {
    id: 'tenancy-123',
    tenantId: 'student-1',
    propertyUnitId: 'unit-1',
    status: 'ACTIVE',
    monthlyRent: 10000,
    depositAmount: 5000,
    breakPeriodEnabled: true,
    vacationNotice: null,
    tenant: { id: 'student-1', name: 'Jane' },
    propertyUnit: {
      id: 'unit-1',
      property: {
        id: 'prop-1',
        name: 'Uni Village',
        landlord: { name: 'John Landlord' },
      },
    },
  };

  const mockPrismaService = {
    booking: {
      findUnique: jest.fn(),
    },
    tenancy: {
      findFirst: jest.fn(),
      findUnique: jest.fn(),
      findMany: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
    },
    vacationNotice: {
      create: jest.fn(),
      update: jest.fn(),
    },
    $transaction: jest.fn(async (input) => {
      if (typeof input === 'function') {
        return input(mockPrismaService);
      }
      return Promise.all(input);
    }),
  };

  const mockPdfService = {
    generateTenancyAgreement: jest.fn().mockResolvedValue(Buffer.from('pdf content')),
  };

  const mockS3Service = {
    uploadBuffer: jest.fn().mockResolvedValue('https://s3.url/agreement.pdf'),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        TenancyService,
        { provide: PrismaService, useValue: mockPrismaService },
        { provide: PdfService, useValue: mockPdfService },
        { provide: S3Service, useValue: mockS3Service },
      ],
    }).compile();

    service = module.get<TenancyService>(TenancyService);
    prisma = module.get<PrismaService>(PrismaService);
    pdfService = module.get<PdfService>(PdfService);
    s3Service = module.get<S3Service>(S3Service);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('createFromBooking', () => {
    it('should create tenancy from approved booking successfully', async () => {
      mockPrismaService.booking.findUnique.mockResolvedValue(mockBooking);
      mockPrismaService.tenancy.findFirst.mockResolvedValue(null);
      mockPrismaService.tenancy.create.mockResolvedValue(mockTenancy);

      const result = await service.createFromBooking('booking-123', {
        monthlyRent: 10000,
        depositAmount: 5000,
      });

      expect(prisma.booking.findUnique).toHaveBeenCalledWith({
        where: { id: 'booking-123' },
        include: { propertyUnit: true, student: true },
      });
      expect(prisma.tenancy.create).toHaveBeenCalled();
      expect(result).toEqual(mockTenancy);
    });

    it('should throw BadRequestException if booking is not approved', async () => {
      mockPrismaService.booking.findUnique.mockResolvedValue({
        ...mockBooking,
        status: 'PENDING',
      });

      await expect(
        service.createFromBooking('booking-123', { monthlyRent: 10000 }),
      ).rejects.toThrow(BadRequestException);
    });

    it('should throw BadRequestException if student already has active tenancy', async () => {
      mockPrismaService.booking.findUnique.mockResolvedValue(mockBooking);
      mockPrismaService.tenancy.findFirst.mockResolvedValue({ id: 'active-tenancy' });

      await expect(
        service.createFromBooking('booking-123', { monthlyRent: 10000 }),
      ).rejects.toThrow(BadRequestException);
    });
  });

  describe('fileVacationNotice', () => {
    it('should create notice and update status to NOTICE_GIVEN', async () => {
      mockPrismaService.tenancy.findUnique.mockResolvedValue(mockTenancy);
      mockPrismaService.vacationNotice.create.mockResolvedValue({ id: 'notice-1' });
      mockPrismaService.tenancy.update.mockResolvedValue({});

      const result = await service.fileVacationNotice('tenancy-123');

      expect(prisma.vacationNotice.create).toHaveBeenCalled();
      expect(prisma.tenancy.update).toHaveBeenCalledWith({
        where: { id: 'tenancy-123' },
        data: { status: TenancyStatus.NOTICE_GIVEN },
      });
      expect(result).toEqual({ id: 'notice-1' });
    });

    it('should throw BadRequestException if already filed vacation notice', async () => {
      mockPrismaService.tenancy.findUnique.mockResolvedValue({
        ...mockTenancy,
        vacationNotice: { id: 'some-notice' },
      });

      await expect(service.fileVacationNotice('tenancy-123')).rejects.toThrow(BadRequestException);
    });
  });

  describe('activateBreakHold', () => {
    it('should change status to BREAK_HOLD if breakPeriodEnabled is true', async () => {
      mockPrismaService.tenancy.findUnique.mockResolvedValue(mockTenancy);
      mockPrismaService.tenancy.update.mockResolvedValue({
        ...mockTenancy,
        status: TenancyStatus.BREAK_HOLD,
      });

      const result = await service.activateBreakHold('tenancy-123');

      expect(prisma.tenancy.update).toHaveBeenCalledWith({
        where: { id: 'tenancy-123' },
        data: { status: TenancyStatus.BREAK_HOLD },
      });
      expect(result.status).toBe(TenancyStatus.BREAK_HOLD);
    });

    it('should throw BadRequestException if breakPeriodEnabled is false', async () => {
      mockPrismaService.tenancy.findUnique.mockResolvedValue({
        ...mockTenancy,
        breakPeriodEnabled: false,
      });

      await expect(service.activateBreakHold('tenancy-123')).rejects.toThrow(BadRequestException);
    });
  });

  describe('signAgreement', () => {
    it('should generate, upload PDF and update signedAt details on tenancy', async () => {
      mockPrismaService.tenancy.findUnique.mockResolvedValue(mockTenancy);
      mockPrismaService.tenancy.update.mockResolvedValue({
        ...mockTenancy,
        agreementUrl: 'https://s3.url/agreement.pdf',
      });

      const result = await service.signAgreement('tenancy-123', 'signature-data');

      expect(pdfService.generateTenancyAgreement).toHaveBeenCalled();
      expect(s3Service.uploadBuffer).toHaveBeenCalled();
      expect(prisma.tenancy.update).toHaveBeenCalledWith({
        where: { id: 'tenancy-123' },
        data: expect.objectContaining({
          agreementUrl: 'https://s3.url/agreement.pdf',
          signedAt: expect.any(Date),
        }),
      });
      expect(result.agreementUrl).toBe('https://s3.url/agreement.pdf');
    });
  });
});
