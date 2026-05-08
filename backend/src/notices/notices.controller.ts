import { Controller, Post, Get, Delete, Param, Body, UseGuards, Request } from '@nestjs/common';
import { NoticesService } from './notices.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';

@Controller('notices')
@UseGuards(JwtAuthGuard)
export class NoticesController {
  constructor(private readonly noticesService: NoticesService) {}

  @Post('property/:propertyId')
  async createNotice(
    @Param('propertyId') propertyId: string,
    @Request() req: any,
    @Body() data: any,
  ) {
    return this.noticesService.createPropertyNotice(propertyId, req.user.userId, data);
  }

  @Post('general')
  @UseGuards(RolesGuard)
  @Roles('ADMIN')
  async createGeneralNotice(
    @Request() req: any,
    @Body() data: any,
  ) {
    return this.noticesService.createGeneralNotice(req.user.userId, data);
  }

  @Get('property/:propertyId')
  async getPropertyNotices(@Param('propertyId') propertyId: string) {
    return this.noticesService.getPropertyNotices(propertyId);
  }

  @Get('my-notices')
  async getMyNotices(@Request() req: any) {
    return this.noticesService.getMyNotices(req.user.userId);
  }

  @Get('general')
  async getGeneralNotices() {
    return this.noticesService.getGeneralNotices();
  }

  @Delete(':id')
  async deleteNotice(@Param('id') id: string, @Request() req: any) {
    return this.noticesService.deleteNotice(id, req.user.userId);
  }
}
