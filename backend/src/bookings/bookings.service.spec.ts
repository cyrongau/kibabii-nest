import { Test, TestingModule } from '@nestjs/testing';
import { BookingsService } from './bookings.service';
import { PrismaService } from '../prisma/prisma.service';
import { NotificationsService } from '../notifications/notifications.service';
import { BookingStatus } from '@prisma/client';
import { NotFoundException, BadRequestException } from '@nestjs/common';

describe('BookingsService', () => {
  let service: BookingsService;
  let prisma: PrismaService;
  let notifications: NotificationsService;

  const mockPropertyUnit = {
    id: 'unit-1',
    price: 12000,
    totalUnits: 5,
    property: {
      id: 'property-1',
      name: 'Kibabii Heights',
      landlordId: 'landlord-123',
    },
    type: {
      name: 'Single Room',
    },
  };

  const mockBooking = {
    id: 'booking-1',
    studentId: 'student-123',
    propertyUnitId: 'unit-1',
    amount: 12000,
    months: 1,
    status: BookingStatus.PENDING,
    student: {
      name: 'Jane Doe',
    },
    propertyUnit: mockPropertyUnit,
  };

  const mockPrismaService = {
    propertyUnit: {
      findUnique: jest.fn(),
    },
    tenancy: {
      count: jest.fn(),
      create: jest.fn(),
    },
    booking: {
      count: jest.fn(),
      create: jest.fn(),
      findUnique: jest.fn(),
      findMany: jest.fn(),
      update: jest.fn(),
    },
    payment: {
      create: jest.fn(),
    },
    user: {
      update: jest.fn(),
    },
    $transaction: jest.fn(async (cb) => {
      if (typeof cb === 'function') {
        return cb(mockPrismaService);
      }
      return Promise.all(cb);
    }),
  };

  const mockNotificationsService = {
    sendNotification: jest.fn().mockResolvedValue(true),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        BookingsService,
        { provide: PrismaService, useValue: mockPrismaService },
        { provide: NotificationsService, useValue: mockNotificationsService },
      ],
    }).compile();

    service = module.get<BookingsService>(BookingsService);
    prisma = module.get<PrismaService>(PrismaService);
    notifications = module.get<NotificationsService>(NotificationsService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('create', () => {
    it('should create a new booking request successfully', async () => {
      mockPrismaService.propertyUnit.findUnique.mockResolvedValue(mockPropertyUnit);
      mockPrismaService.tenancy.count.mockResolvedValue(1);
      mockPrismaService.booking.count.mockResolvedValue(1);
      mockPrismaService.booking.create.mockResolvedValue(mockBooking);

      const result = await service.create('student-123', {
        propertyUnitId: 'unit-1',
        amount: 12000,
        months: 1,
      });

      expect(prisma.propertyUnit.findUnique).toHaveBeenCalledWith({
        where: { id: 'unit-1' },
        include: { property: true, type: true },
      });
      expect(prisma.tenancy.count).toHaveBeenCalled();
      expect(prisma.booking.count).toHaveBeenCalled();
      expect(prisma.booking.create).toHaveBeenCalled();
      expect(notifications.sendNotification).toHaveBeenCalledWith(
        'landlord-123',
        'New Booking Request',
        expect.stringContaining('Jane Doe has requested to book'),
        'BOOKING',
        expect.stringContaining('/bookings/booking-1'),
      );
      expect(result).toEqual(mockBooking);
    });

    it('should throw NotFoundException if property unit is not found', async () => {
      mockPrismaService.propertyUnit.findUnique.mockResolvedValue(null);

      await expect(
        service.create('student-123', {
          propertyUnitId: 'invalid-unit',
          amount: 12000,
        }),
      ).rejects.toThrow(NotFoundException);
    });

    it('should throw BadRequestException if unit capacity is full', async () => {
      mockPrismaService.propertyUnit.findUnique.mockResolvedValue(mockPropertyUnit);
      mockPrismaService.tenancy.count.mockResolvedValue(3);
      mockPrismaService.booking.count.mockResolvedValue(2); // total capacity 5 is reached (3+2 = 5)

      await expect(
        service.create('student-123', {
          propertyUnitId: 'unit-1',
          amount: 12000,
        }),
      ).rejects.toThrow(BadRequestException);
    });
  });

  describe('updateStatus', () => {
    it('should approve a booking, create a tenancy, create initial payment, and credit landlord', async () => {
      mockPrismaService.booking.findUnique.mockResolvedValue(mockBooking);
      mockPrismaService.tenancy.count.mockResolvedValue(0);
      mockPrismaService.booking.update.mockResolvedValue({
        ...mockBooking,
        status: BookingStatus.APPROVED,
      });
      mockPrismaService.tenancy.create.mockResolvedValue({ id: 'tenancy-123' });
      mockPrismaService.payment.create.mockResolvedValue({});
      mockPrismaService.user.update.mockResolvedValue({});

      const result = await service.updateStatus('booking-1', BookingStatus.APPROVED, 'Room 101');

      expect(prisma.booking.findUnique).toHaveBeenCalledWith({
        where: { id: 'booking-1' },
        include: {
          propertyUnit: { include: { property: true, type: true } },
          student: { select: { id: true, name: true } },
        },
      });
      expect(prisma.booking.update).toHaveBeenCalledWith({
        where: { id: 'booking-1' },
        data: { status: BookingStatus.APPROVED },
      });
      expect(prisma.tenancy.create).toHaveBeenCalledWith({
        data: {
          tenantId: 'student-123',
          propertyUnitId: 'unit-1',
          unitName: 'Room 101',
          monthlyRent: 12000,
          depositAmount: 0,
          status: 'ACTIVE',
        },
      });
      expect(prisma.payment.create).toHaveBeenCalled();
      expect(prisma.user.update).toHaveBeenCalledWith({
        where: { id: 'landlord-123' },
        data: { balance: { increment: 12000 } },
      });
      expect(notifications.sendNotification).toHaveBeenCalledWith(
        'student-123',
        'Booking Approved!',
        expect.stringContaining('approved'),
        'BOOKING',
        '/dashboard/student',
      );
      expect(result).toEqual(expect.objectContaining({ status: BookingStatus.APPROVED, tenancyId: 'tenancy-123' }));
    });

    it('should decline or cancel a booking without creating tenancy/payment', async () => {
      mockPrismaService.booking.findUnique.mockResolvedValue(mockBooking);
      mockPrismaService.booking.update.mockResolvedValue({
        ...mockBooking,
        status: BookingStatus.REJECTED,
      });

      const result = await service.updateStatus('booking-1', BookingStatus.REJECTED);

      expect(prisma.booking.update).toHaveBeenCalledWith({
        where: { id: 'booking-1' },
        data: { status: BookingStatus.REJECTED },
      });
      expect(prisma.tenancy.create).not.toHaveBeenCalled();
      expect(prisma.payment.create).not.toHaveBeenCalled();
      expect(result.status).toBe(BookingStatus.REJECTED);
    });

    it('should throw NotFoundException if booking not found', async () => {
      mockPrismaService.booking.findUnique.mockResolvedValue(null);

      await expect(service.updateStatus('invalid-id', BookingStatus.APPROVED)).rejects.toThrow(NotFoundException);
    });

    it('should throw BadRequestException on approval if unit is already at maximum capacity', async () => {
      mockPrismaService.booking.findUnique.mockResolvedValue(mockBooking);
      // Already 5 active tenancies (totalUnits is 5)
      mockPrismaService.tenancy.count.mockResolvedValue(5);

      await expect(service.updateStatus('booking-1', BookingStatus.APPROVED)).rejects.toThrow(BadRequestException);
    });
  });
});
