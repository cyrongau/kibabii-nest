import { Controller, Get, Patch, Param, Body, Delete, UseGuards, Post, Request, Query } from '@nestjs/common';
import { UsersService } from './users.service';
import { StudentIdentityService } from './student-identity.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';

@Controller('users')
@UseGuards(JwtAuthGuard, RolesGuard)
export class UsersController {
  constructor(
    private readonly usersService: UsersService,
    private readonly studentIdentityService: StudentIdentityService,
  ) {}

  @Get()
  @Roles('ADMIN')
  async findAll(
    @Query('role') role?: string,
    @Query('search') search?: string,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    return this.usersService.findAll({
      role: role as any,
      search,
      page: page ? parseInt(page) : 1,
      limit: limit ? parseInt(limit) : 50,
    });
  }

  @Get('stats')
  async getStats() {
    return this.usersService.getStats();
  }

  @Get('profile/me')
  async getMyProfile(@Request() req) {
    return this.usersService.findOneById(req.user.userId);
  }

  @Get(':id')
  async findOne(@Param('id') id: string) {
    return this.usersService.findOneById(id);
  }

  @Patch(':id/role')
  async updateRole(@Param('id') id: string, @Body('role') role: string) {
    return this.usersService.updateRole(id, role);
  }

  @Patch(':id/suspend')
  @Roles('ADMIN')
  async suspend(@Param('id') id: string) {
    return this.usersService.suspend(id);
  }

  @Patch(':id/activate')
  @Roles('ADMIN')
  async activate(@Param('id') id: string) {
    return this.usersService.activate(id);
  }

  @Patch(':id')
  async update(@Param('id') id: string, @Body() data: any) {
    return this.usersService.update(id, data);
  }

  @Delete(':id')
  @Roles('ADMIN')
  async delete(@Param('id') id: string) {
    return this.usersService.delete(id);
  }

  @Patch(':id/verify-landlord')
  @Roles('ADMIN')
  async verifyLandlord(@Param('id') id: string, @Body('verified') verified: boolean) {
    return this.usersService.verifyLandlord(id, verified);
  }

  // ── Student Identity Endpoints ──

  @Post('identity/upload')
  async submitIdentity(
    @Request() req,
    @Body() data: { documentUrl: string; documentType?: string; universityRegNo?: string },
  ) {
    return this.studentIdentityService.submitIdentity(req.user.userId, data);
  }

  @Get('identity/me')
  async getMyIdentity(@Request() req) {
    return this.studentIdentityService.getIdentity(req.user.userId);
  }

  @Get(':id/identity')
  async getStudentIdentity(@Param('id') studentId: string, @Request() req) {
    return this.studentIdentityService.getIdentityForLandlord(studentId, req.user.userId);
  }

  @Post('marketplace/accept-terms')
  async acceptMarketplaceTerms(@Request() req) {
    return this.usersService.update(req.user.userId, { hasAcceptedMarketplaceTerms: true });
  }
}
