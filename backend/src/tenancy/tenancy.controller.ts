import { Controller, Post, Get, Patch, Param, Body, UseGuards, Request } from '@nestjs/common';
import { TenancyService } from './tenancy.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

@Controller('tenancy')
@UseGuards(JwtAuthGuard)
export class TenancyController {
  constructor(private readonly tenancyService: TenancyService) {}

  @Post('from-booking/:bookingId')
  async createFromBooking(
    @Param('bookingId') bookingId: string,
    @Body() config: any,
  ) {
    return this.tenancyService.createFromBooking(bookingId, config);
  }

  @Post(':id/vacation-notice')
  async fileVacationNotice(@Param('id') id: string) {
    return this.tenancyService.fileVacationNotice(id);
  }

  @Post(':id/break-hold')
  async activateBreakHold(@Param('id') id: string) {
    return this.tenancyService.activateBreakHold(id);
  }

  @Post(':id/end-break-hold')
  async deactivateBreakHold(@Param('id') id: string) {
    return this.tenancyService.deactivateBreakHold(id);
  }

  @Get('my-tenancies')
  async getMyTenancies(@Request() req: any) {
    return this.tenancyService.findByTenant(req.user.userId);
  }

  @Get('landlord')
  async getLandlordTenancies(@Request() req: any) {
    return this.tenancyService.findByLandlord(req.user.userId);
  }

  @Get(':id')
  async getOne(@Param('id') id: string) {
    return this.tenancyService.findOne(id);
  }

  @Patch(':id/config')
  async updateConfig(@Param('id') id: string, @Body() data: any) {
    return this.tenancyService.updateConfig(id, data);
  }

  @Post(':id/sign')
  async signAgreement(@Param('id') id: string, @Body('agreementUrl') agreementUrl: string) {
    return this.tenancyService.signAgreement(id, agreementUrl);
  }
}
