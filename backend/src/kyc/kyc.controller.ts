import { Controller, Post, Get, Body, Param, UseGuards, Request, Patch, Query } from '@nestjs/common';
import { KycService } from './kyc.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';
import { KycStatus } from '@prisma/client';

@Controller('kyc')
@UseGuards(JwtAuthGuard, RolesGuard)
export class KycController {
  constructor(private readonly kycService: KycService) {}

  @Post('submit')
  @Roles('LANDLORD')
  async submitKyc(
    @Request() req,
    @Body() data: { idDocumentUrl: string; ownershipProofUrl: string; certificateUrl?: string }
  ) {
    return this.kycService.submitKyc(req.user.userId, data);
  }

  @Get('admin/pending')
  @Roles('ADMIN')
  async getPendingKyc() {
    return this.kycService.getPendingKyc();
  }

  @Get('admin/all')
  @Roles('ADMIN')
  async getAllKyc(
    @Query('status') status?: KycStatus,
    @Query('search') search?: string,
    @Query('userId') userId?: string,
  ) {
    return this.kycService.getAllKyc({ status, search, userId });
  }

  @Patch('admin/:id/verify')
  @Roles('ADMIN')
  async verifyKyc(
    @Param('id') id: string,
    @Body() data: { approved: boolean; reason?: string }
  ) {
    return this.kycService.verifyKyc(id, data.approved, data.reason);
  }
}