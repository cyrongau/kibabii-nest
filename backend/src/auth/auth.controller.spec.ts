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
    const result = await controller.register(data);
    expect(authService.register).toHaveBeenCalledWith(data);
    expect(result.id).toBe('user-1');
  });

  it('should call login', async () => {
    const body = { email: 'student@kibabii.ac.ke', password: 'password123' };
    const result = await controller.login(body);
    expect(authService.login).toHaveBeenCalledWith(body);
    expect(result.token).toBe('jwt-token');
  });

  it('should call googleLogin', async () => {
    const body = { idToken: 'google-token' };
    const result = await controller.googleLogin(body);
    expect(authService.googleLogin).toHaveBeenCalledWith(body);
    expect(result.token).toBe('google-jwt-token');
  });

  it('should call verify2FA', async () => {
    const body = { userId: 'user-1', code: '123456' };
    const result = await controller.verify2FA(body);
    expect(authService.verifyTwoFactor).toHaveBeenCalledWith('user-1', '123456');
    expect(result.verified).toBe(true);
  });
});
