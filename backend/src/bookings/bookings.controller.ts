import { Controller, Get, Post, Body, Param, Patch, UseGuards, Request, Query } from '@nestjs/common';
import { BookingsService } from './bookings.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { BookingStatus } from '@prisma/client';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';

@Controller('bookings')
@UseGuards(JwtAuthGuard, RolesGuard)
export class BookingsController {
  constructor(private readonly bookingsService: BookingsService) {}

  @Post()
  @Roles('STUDENT')
  async create(@Request() req: any, @Body() data: any) {
    return this.bookingsService.create(req.user.userId, data);
  }

  @Get('my-bookings')
  @Roles('STUDENT', 'ADMIN')
  async findMyBookings(@Request() req: any) {
    return this.bookingsService.findMyBookings(req.user.userId);
  }

  @Get('landlord')
  @Roles('LANDLORD', 'ADMIN')
  async findLandlordBookings(@Request() req: any) {
    return this.bookingsService.findLandlordBookings(req.user.userId);
  }

  @Get('admin/all')
  @Roles('ADMIN')
  async findAllAdmin(
    @Query('status') status?: string,
    @Query('search') search?: string,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    return this.bookingsService.findAllAdmin({
      status: status as any,
      search,
      page: page ? parseInt(page) : 1,
      limit: limit ? parseInt(limit) : 50,
    });
  }

  @Get('admin/stats')
  @Roles('ADMIN')
  async getAdminStats() {
    return this.bookingsService.getAdminStats();
  }

  @Get(':id')
  async findOne(@Param('id') id: string) {
    return this.bookingsService.findOne(id);
  }

  @Patch(':id/status')
  @Roles('LANDLORD', 'ADMIN')
  async updateStatus(@Param('id') id: string, @Body('status') status: BookingStatus, @Body('unitName') unitName?: string) {
    return this.bookingsService.updateStatus(id, status, unitName);
  }
}
