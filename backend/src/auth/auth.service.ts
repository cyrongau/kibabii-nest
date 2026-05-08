import { Injectable, UnauthorizedException, ConflictException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { PrismaService } from '../prisma/prisma.service';
import * as bcrypt from 'bcrypt';
import { OAuth2Client } from 'google-auth-library';
import { OtpService } from './otp.service';
import { MailService } from '../notifications/mail.service';
import axios from 'axios';
import 'dotenv/config';

@Injectable()
export class AuthService {
  private googleClient: OAuth2Client;

  constructor(
    private prisma: PrismaService,
    private jwtService: JwtService,
    private otpService: OtpService,
    private mailService: MailService,
  ) {
    this.googleClient = new OAuth2Client();
  }

  async register(data: any) {
    const { email, password, name, role } = data;
    
    const existingUser = await this.prisma.user.findUnique({ where: { email } });
    if (existingUser) {
      throw new ConflictException('Email already exists');
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    
    const user = await this.prisma.user.create({
      data: {
        email,
        password: hashedPassword,
        name,
        role,
      },
    });

    // Send notification email to admin about new registration
    this.mailService.sendNewUserNotification(user.name, user.email, user.role).catch(err => {
      console.warn('Failed to send new user notification:', err.message);
    });

    return this.generateToken(user);
  }

  async login(data: any) {
    const { email, password, requiredRole } = data;
    
    const user = await this.prisma.user.findUnique({ where: { email } });
    if (!user) {
      throw new UnauthorizedException('Invalid credentials');
    }

    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      throw new UnauthorizedException('Invalid credentials');
    }

    // Enforce role if required
    if (requiredRole && user.role !== requiredRole) {
      throw new UnauthorizedException(`Access denied. This portal requires ${requiredRole} credentials.`);
    }

    if (user.twoFactorEnabled && user.phone) {
      await this.otpService.generateAndSendOtp(user.id, user.phone);
      return { 
        require2FA: true, 
        userId: user.id,
        message: 'OTP sent to your registered phone number'
      };
    }

    return this.generateToken(user);
  }

  async verifyTwoFactor(userId: string, code: string) {
    const isValid = this.otpService.verifyOtp(userId, code);
    if (!isValid) {
      throw new UnauthorizedException('Invalid or expired OTP');
    }

    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    return this.generateToken(user);
  }

  async googleLogin(data: { idToken?: string; accessToken?: string; role?: string }) {
    const { idToken, accessToken, role } = data;
    let googleUser;

    console.log('AuthService: Attempting Google login...');
    if (idToken) {
      console.log('AuthService: Verifying ID Token...');
      try {
        const ticket = await this.googleClient.verifyIdToken({
          idToken,
          audience: [
            process.env.GOOGLE_WEB_CLIENT_ID as string,
            process.env.GOOGLE_ANDROID_CLIENT_ID as string,
          ],
        });
        const payload = ticket.getPayload();
        if (!payload) throw new UnauthorizedException('Invalid Google ID Token');
        
        googleUser = {
          email: payload.email,
          name: payload.name,
          picture: payload.picture,
          sub: payload.sub,
        };
      } catch (error) {
        console.error('AuthService: ID Token verification failed:', error.message);
        if (!accessToken) {
          throw new UnauthorizedException(`Google ID Token verification failed: ${error.message}`);
        }
      }
    }

    if (!googleUser && accessToken) {
      console.log('AuthService: Verifying Access Token via userinfo...');
      try {
        const response = await axios.get('https://www.googleapis.com/oauth2/v3/userinfo', {
          headers: { Authorization: `Bearer ${accessToken}` },
        });
        googleUser = response.data;
      } catch (error) {
        console.error('AuthService: Access Token verification failed:', error.response?.data || error.message);
        throw new UnauthorizedException('Google Access Token verification failed');
      }
    }

    if (!googleUser) {
      throw new UnauthorizedException('No valid Google tokens provided');
    }

    console.log('AuthService: Google user verified:', googleUser.email);
    const { email, name, picture, sub } = googleUser;

    if (!email) throw new UnauthorizedException('No email provided by Google');

    let user = await this.prisma.user.findUnique({ where: { email } });

    if (!user) {
      // Create new user for social login
      const targetRole = role === 'LANDLORD' ? 'LANDLORD' : 'STUDENT';
      console.log('AuthService: Creating new social user:', email, 'as', targetRole);
      user = await this.prisma.user.create({
        data: {
          email,
          name: name || 'Google User',
          googleId: sub,
          role: targetRole as any,
          avatar: picture,
          password: await bcrypt.hash(Math.random().toString(36), 10), // Random password for social users
        },
      });
    } else if (!user.googleId) {
      // Link existing account
      console.log('AuthService: Linking existing account to Google:', email);
      user = await this.prisma.user.update({
        where: { id: user.id },
        data: { googleId: sub, avatar: user.avatar || picture }
      });
    }

    return this.generateToken(user);
  }

  private generateToken(user: any) {
    const payload = { sub: user.id, email: user.email, role: user.role };
    return {
      access_token: this.jwtService.sign(payload),
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
        avatar: user.avatar,
        twoFactorEnabled: user.twoFactorEnabled,
      },
    };
  }
}
