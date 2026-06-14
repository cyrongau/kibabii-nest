import { Test, TestingModule } from '@nestjs/testing';
import { AuthService } from './auth.service';
import { PrismaService } from '../prisma/prisma.service';
import { JwtService } from '@nestjs/jwt';
import { OtpService } from './otp.service';
import { MailService } from '../notifications/mail.service';
import { ConflictException, UnauthorizedException } from '@nestjs/common';
import * as bcrypt from 'bcrypt';

jest.mock('bcrypt');

describe('AuthService', () => {
  let service: AuthService;
  let prisma: PrismaService;
  let jwtService: JwtService;
  let otpService: OtpService;
  let mailService: MailService;

  const mockUser = {
    id: 'user-id-123',
    email: 'test@example.com',
    password: 'hashedpassword',
    name: 'Test User',
    role: 'STUDENT',
    avatar: null,
    twoFactorEnabled: false,
    phone: null,
  };

  const mockPrismaService = {
    user: {
      findUnique: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
    },
  };

  const mockJwtService = {
    sign: jest.fn(() => 'mock-jwt-token'),
  };

  const mockOtpService = {
    generateAndSendOtp: jest.fn(),
    verifyOtp: jest.fn(),
    generateAndSendPasswordResetOtp: jest.fn(),
    verifyPasswordResetOtp: jest.fn(),
  };

  const mockMailService = {
    sendNewUserNotification: jest.fn().mockResolvedValue(true),
    sendNotificationEmail: jest.fn().mockResolvedValue(true),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        { provide: PrismaService, useValue: mockPrismaService },
        { provide: JwtService, useValue: mockJwtService },
        { provide: OtpService, useValue: mockOtpService },
        { provide: MailService, useValue: mockMailService },
      ],
    }).compile();

    service = module.get<AuthService>(AuthService);
    prisma = module.get<PrismaService>(PrismaService);
    jwtService = module.get<JwtService>(JwtService);
    otpService = module.get<OtpService>(OtpService);
    mailService = module.get<MailService>(MailService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('register', () => {
    it('should register a new user successfully and return a token', async () => {
      mockPrismaService.user.findUnique.mockResolvedValue(null);
      (bcrypt.hash as jest.Mock).mockResolvedValue('hashedpassword');
      mockPrismaService.user.create.mockResolvedValue(mockUser);

      const result = await service.register({
        email: 'test@example.com',
        password: 'password123',
        name: 'Test User',
        role: 'STUDENT',
      });

      expect(prisma.user.findUnique).toHaveBeenCalledWith({ where: { email: 'test@example.com' } });
      expect(bcrypt.hash).toHaveBeenCalledWith('password123', 10);
      expect(prisma.user.create).toHaveBeenCalled();
      expect(mailService.sendNewUserNotification).toHaveBeenCalledWith('Test User', 'test@example.com', 'STUDENT');
      expect(jwtService.sign).toHaveBeenCalled();
      expect(result).toHaveProperty('access_token');
      expect(result.user.email).toBe('test@example.com');
    });

    it('should throw ConflictException if email exists', async () => {
      mockPrismaService.user.findUnique.mockResolvedValue(mockUser);

      await expect(
        service.register({
          email: 'test@example.com',
          password: 'password123',
          name: 'Test User',
          role: 'STUDENT',
        }),
      ).rejects.toThrow(ConflictException);
    });
  });

  describe('login', () => {
    it('should authenticate a user successfully and return a token', async () => {
      mockPrismaService.user.findUnique.mockResolvedValue(mockUser);
      (bcrypt.compare as jest.Mock).mockResolvedValue(true);

      const result = await service.login({
        email: 'test@example.com',
        password: 'password123',
      }) as any;

      expect(prisma.user.findUnique).toHaveBeenCalledWith({ where: { email: 'test@example.com' } });
      expect(bcrypt.compare).toHaveBeenCalledWith('password123', 'hashedpassword');
      expect(jwtService.sign).toHaveBeenCalled();
      expect(result).toHaveProperty('access_token');
      expect(result.user.id).toBe('user-id-123');
    });

    it('should throw UnauthorizedException if user not found', async () => {
      mockPrismaService.user.findUnique.mockResolvedValue(null);

      await expect(
        service.login({
          email: 'nonexistent@example.com',
          password: 'password123',
        }),
      ).rejects.toThrow(UnauthorizedException);
    });

    it('should throw UnauthorizedException if password comparison fails', async () => {
      mockPrismaService.user.findUnique.mockResolvedValue(mockUser);
      (bcrypt.compare as jest.Mock).mockResolvedValue(false);

      await expect(
        service.login({
          email: 'test@example.com',
          password: 'wrongpassword',
        }),
      ).rejects.toThrow(UnauthorizedException);
    });

    it('should throw UnauthorizedException if requiredRole doesn\'t match user role', async () => {
      mockPrismaService.user.findUnique.mockResolvedValue(mockUser);
      (bcrypt.compare as jest.Mock).mockResolvedValue(true);

      await expect(
        service.login({
          email: 'test@example.com',
          password: 'password123',
          requiredRole: 'LANDLORD',
        }),
      ).rejects.toThrow(UnauthorizedException);
    });

    it('should trigger OTP flow if twoFactorEnabled is true and phone exists', async () => {
      const userWith2FA = {
        ...mockUser,
        twoFactorEnabled: true,
        phone: '+254700000000',
      };
      mockPrismaService.user.findUnique.mockResolvedValue(userWith2FA);
      (bcrypt.compare as jest.Mock).mockResolvedValue(true);

      const result = await service.login({
        email: 'test@example.com',
        password: 'password123',
      });

      expect(otpService.generateAndSendOtp).toHaveBeenCalledWith(userWith2FA.id, userWith2FA.phone);
      expect(result).toHaveProperty('require2FA', true);
      expect(result).toHaveProperty('userId', userWith2FA.id);
    });
  });

  describe('verifyTwoFactor', () => {
    it('should generate a token for valid OTP code', async () => {
      mockOtpService.verifyOtp.mockReturnValue(true);
      mockPrismaService.user.findUnique.mockResolvedValue(mockUser);

      const result = await service.verifyTwoFactor('user-id-123', '123456');

      expect(otpService.verifyOtp).toHaveBeenCalledWith('user-id-123', '123456');
      expect(prisma.user.findUnique).toHaveBeenCalledWith({ where: { id: 'user-id-123' } });
      expect(jwtService.sign).toHaveBeenCalled();
      expect(result).toHaveProperty('access_token');
    });

    it('should throw UnauthorizedException for invalid OTP code', async () => {
      mockOtpService.verifyOtp.mockReturnValue(false);

      await expect(
        service.verifyTwoFactor('user-id-123', '000000'),
      ).rejects.toThrow(UnauthorizedException);
    });
  });

  describe('forgotPassword', () => {
    it('should call generateAndSendPasswordResetOtp', async () => {
      mockOtpService.generateAndSendPasswordResetOtp.mockResolvedValue(true);
      const result = await service.forgotPassword('test@example.com');
      expect(otpService.generateAndSendPasswordResetOtp).toHaveBeenCalledWith('test@example.com');
      expect(result).toBe(true);
    });
  });

  describe('resetPassword', () => {
    it('should reset password successfully when OTP is valid', async () => {
      mockOtpService.verifyPasswordResetOtp.mockReturnValue(true);
      mockPrismaService.user.findUnique.mockResolvedValue(mockUser);
      mockPrismaService.user.update.mockResolvedValue(mockUser);
      (bcrypt.hash as jest.Mock).mockResolvedValue('newhashedpassword');

      const result = await service.resetPassword({
        email: 'test@example.com',
        code: '123456',
        newPassword: 'newpassword123',
      });

      expect(otpService.verifyPasswordResetOtp).toHaveBeenCalledWith('test@example.com', '123456');
      expect(prisma.user.findUnique).toHaveBeenCalledWith({ where: { email: 'test@example.com' } });
      expect(bcrypt.hash).toHaveBeenCalledWith('newpassword123', 10);
      expect(prisma.user.update).toHaveBeenCalledWith({
        where: { id: 'user-id-123' },
        data: { password: 'newhashedpassword' },
      });
      expect(result).toHaveProperty('message', 'Password has been reset successfully');
    });

    it('should throw UnauthorizedException if OTP is invalid', async () => {
      mockOtpService.verifyPasswordResetOtp.mockReturnValue(false);

      await expect(
        service.resetPassword({
          email: 'test@example.com',
          code: 'invalid',
          newPassword: 'newpassword123',
        }),
      ).rejects.toThrow(UnauthorizedException);
    });

    it('should throw UnauthorizedException if user not found', async () => {
      mockOtpService.verifyPasswordResetOtp.mockReturnValue(true);
      mockPrismaService.user.findUnique.mockResolvedValue(null);

      await expect(
        service.resetPassword({
          email: 'test@example.com',
          code: '123456',
          newPassword: 'newpassword123',
        }),
      ).rejects.toThrow(UnauthorizedException);
    });
  });
});
