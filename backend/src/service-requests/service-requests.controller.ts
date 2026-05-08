import { Controller, Post, Get, Patch, Param, Body, UseGuards, Request } from '@nestjs/common';
import { ServiceRequestsService } from './service-requests.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { ServiceRequestStatus } from '@prisma/client';

@Controller('service-requests')
@UseGuards(JwtAuthGuard)
export class ServiceRequestsController {
  constructor(private readonly service: ServiceRequestsService) {}

  @Post()
  async create(@Request() req: any, @Body() data: any) {
    return this.service.create(req.user.id, data);
  }

  @Get('my-requests')
  async getMyRequests(@Request() req: any) {
    return this.service.findByTenant(req.user.id);
  }

  @Get('landlord')
  async getLandlordRequests(@Request() req: any) {
    return this.service.findByLandlord(req.user.id);
  }

  @Get(':id')
  async getOne(@Param('id') id: string) {
    return this.service.findOne(id);
  }

  @Patch(':id/status')
  async updateStatus(@Param('id') id: string, @Body('status') status: ServiceRequestStatus) {
    return this.service.updateStatus(id, status);
  }
}
