import { Controller, Post, Body } from '@nestjs/common';
import { AuthService } from './auth.service';
import { Throttle } from '@nestjs/throttler';

@Controller('auth')
export class AuthController {
  constructor(private authService: AuthService) {}

  @Throttle({ short: { limit: 5, ttl: 10000 } })
  @Post('register')
  async register(@Body() data: any) {
    return this.authService.register(data);
  }

  @Throttle({ short: { limit: 5, ttl: 10000 } })
  @Post('login')
  async login(@Body() body) {
    return this.authService.login(body);
  }

  @Throttle({ short: { limit: 5, ttl: 10000 } })
  @Post('google')
  async googleLogin(@Body() body: { idToken?: string; accessToken?: string; role?: string }) {
    return this.authService.googleLogin(body);
  }

  @Throttle({ short: { limit: 5, ttl: 10000 } })
  @Post('2fa/verify')
  async verify2FA(@Body() body: { userId: string; code: string }) {
    return this.authService.verifyTwoFactor(body.userId, body.code);
  }

  @Throttle({ short: { limit: 3, ttl: 60000 } }) // strictly rate limit password reset attempts
  @Post('forgot-password')
  async forgotPassword(@Body() body: { email: string }) {
    return this.authService.forgotPassword(body.email);
  }

  @Throttle({ short: { limit: 3, ttl: 60000 } })
  @Post('reset-password')
  async resetPassword(@Body() body: { email: string; code: string; newPassword: string }) {
    return this.authService.resetPassword(body);
  }
}
