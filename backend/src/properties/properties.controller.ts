import { Controller, Get, Post, Body, Param, Query, UseGuards, Request, Patch, Delete } from '@nestjs/common';
import { PropertiesService } from './properties.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';

@Controller('properties')
export class PropertiesController {
  constructor(private readonly propertiesService: PropertiesService) {}

  @Post()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('LANDLORD', 'ADMIN')
  async create(@Body() data: any) {
    return this.propertiesService.create(data);
  }

  @Patch(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('LANDLORD', 'ADMIN')
  async update(@Param('id') id: string, @Body() data: any) {
    return this.propertiesService.update(id, data);
  }

  @Get()
  async findAll(@Query() filters: any) {
    return this.propertiesService.findAll(filters);
  }

  @Get('stats/landlord')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('LANDLORD', 'ADMIN')
  async getStats(@Request() req: any) {
    return this.propertiesService.getLandlordStats(req.user.userId);
  }

  @Post('generate-description')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('LANDLORD', 'ADMIN')
  async generateDescription(@Body() attributes: { name: string; amenities: string[]; type: string; distance: number }) {
    const description = await this.propertiesService.generateAIDescription(attributes);
    return { description };
  }

  @Get('admin/all')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN')
  async findAllAdmin(
    @Query('search') search?: string,
    @Query('verified') verified?: string,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    return this.propertiesService.findAllAdmin({
      search,
      verified: verified === 'true' ? true : verified === 'false' ? false : undefined,
      page: page ? parseInt(page) : 1,
      limit: limit ? parseInt(limit) : 50,
    });
  }

  @Get('admin/stats')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN')
  async getAdminStats() {
    return this.propertiesService.getAdminStats();
  }

  @Get('landlord/all')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('LANDLORD', 'ADMIN')
  async findAllLandlord(@Request() req: any) {
    return this.propertiesService.findAllLandlord(req.user.userId);
  }

  // IMPORTANT: :id wildcard MUST come after all static paths to prevent route shadowing
  @Get(':id')
  async findOne(@Param('id') id: string) {
    return this.propertiesService.findOne(id);
  }

  @Patch(':id/verify')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN')
  async verifyProperty(@Param('id') id: string, @Body('status') status: boolean) {
    return this.propertiesService.verifyProperty(id, status);
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('LANDLORD', 'ADMIN')
  async remove(@Param('id') id: string) {
    return this.propertiesService.remove(id);
  }
}
