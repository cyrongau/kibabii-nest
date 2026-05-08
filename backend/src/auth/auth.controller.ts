import { Controller, Post, Body } from '@nestjs/common';
import { AuthService } from './auth.service';

@Controller('auth')
export class AuthController {
  constructor(private authService: AuthService) {}

  @Post('register')
  async register(@Body() data: any) {
    return this.authService.register(data);
  }

  @Post('login')
  async login(@Body() body) {
    return this.authService.login(body);
  }

  @Post('google')
  async googleLogin(@Body() body: { idToken?: string; accessToken?: string; role?: string }) {
    return this.authService.googleLogin(body);
  }

  @Post('2fa/verify')
  async verify2FA(@Body() body: { userId: string; code: string }) {
    return this.authService.verifyTwoFactor(body.userId, body.code);
  }
}
