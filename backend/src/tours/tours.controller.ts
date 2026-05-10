import { Controller, Get, Post, Body, Param, Patch, UseGuards, Request } from '@nestjs/common';
import { ToursService } from './tours.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { TourStatus } from '@prisma/client';

@Controller('tours')
@UseGuards(JwtAuthGuard)
export class ToursController {
  constructor(private readonly toursService: ToursService) {}

  @Post('request')
  async createTourRequest(@Request() req, @Body() data: { propertyId: string; tourDate: string }) {
    return this.toursService.createTourRequest(req.user.id, {
      propertyId: data.propertyId,
      tourDate: new Date(data.tourDate),
    });
  }

  @Patch(':id/status')
  async updateTourStatus(
    @Param('id') id: string,
    @Body() data: { status: TourStatus; feedback?: string },
  ) {
    return this.toursService.updateTourStatus(id, data.status, data.feedback);
  }

  @Get('student')
  async getStudentTours(@Request() req) {
    return this.toursService.getStudentTours(req.user.id);
  }

  @Get('landlord')
  async getLandlordTours(@Request() req) {
    return this.toursService.getLandlordTours(req.user.id);
  }

  @Post('open-days')
  async createOpenDay(@Request() req, @Body() data: { propertyId: string; date: string; startTime: string; endTime: string; description?: string }) {
    return this.toursService.createOpenDay(req.user.id, {
      ...data,
      date: new Date(data.date),
    });
  }

  @Get('property/:propertyId/open-days')
  async getPropertyOpenDays(@Param('propertyId') propertyId: string) {
    return this.toursService.getPropertyOpenDays(propertyId);
  }
}
