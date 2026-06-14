import { Test, TestingModule } from '@nestjs/testing';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';

describe('AuthController', () => {
  let controller: AuthController;
  let authService: AuthService;

  const mockAuthService = {
    register: jest.fn().mockResolvedValue({ id: 'user-1', email: 'student@kibabii.ac.ke' }),
    login: jest.fn().mockResolvedValue({ token: 'jwt-token' }),
    googleLogin: jest.fn().mockResolvedValue({ token: 'google-jwt-token' }),
    verifyTwoFactor: jest.fn().mockResolvedValue({ verified: true }),
    forgotPassword: jest.fn().mockResolvedValue({ success: true }),
    resetPassword: jest.fn().mockResolvedValue({ message: 'Password has been reset successfully' }),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [AuthController],
      providers: [
        { provide: AuthService, useValue: mockAuthService },
      ],
    }).compile();

    controller = module.get<AuthController>(AuthController);
    authService = module.get<AuthService>(AuthService);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  it('should call register', async () => {
    const data = { email: 'student@kibabii.ac.ke', password: 'password123' };
    const result = await controller.register(data) as any;
    expect(authService.register).toHaveBeenCalledWith(data);
    expect(result.id).toBe('user-1');
  });

  it('should call login', async () => {
    const body = { email: 'student@kibabii.ac.ke', password: 'password123' };
    const result = await controller.login(body) as any;
    expect(authService.login).toHaveBeenCalledWith(body);
    expect(result.token).toBe('jwt-token');
  });

  it('should call googleLogin', async () => {
    const body = { idToken: 'google-token' };
    const result = await controller.googleLogin(body) as any;
    expect(authService.googleLogin).toHaveBeenCalledWith(body);
    expect(result.token).toBe('google-jwt-token');
  });

  it('should call verify2FA', async () => {
    const body = { userId: 'user-1', code: '123456' };
    const result = await controller.verify2FA(body) as any;
    expect(authService.verifyTwoFactor).toHaveBeenCalledWith('user-1', '123456');
    expect(result.verified).toBe(true);
  });

  it('should call forgotPassword', async () => {
    const body = { email: 'student@kibabii.ac.ke' };
    const result = await controller.forgotPassword(body) as any;
    expect(authService.forgotPassword).toHaveBeenCalledWith('student@kibabii.ac.ke');
    expect(result.success).toBe(true);
  });

  it('should call resetPassword', async () => {
    const body = { email: 'student@kibabii.ac.ke', code: '123456', newPassword: 'newpassword123' };
    const result = await controller.resetPassword(body) as any;
    expect(authService.resetPassword).toHaveBeenCalledWith(body);
    expect(result.message).toBe('Password has been reset successfully');
  });
});
