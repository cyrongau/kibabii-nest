import { Controller, Get, Post, Body, UseGuards, Request, Patch, Param, Query } from '@nestjs/common';
import { CommunityService } from './community.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';

@Controller('community')
export class CommunityController {
  constructor(private readonly communityService: CommunityService) {}

  @Get('testimonials/featured')
  async getFeatured() {
    return this.communityService.getFeaturedTestimonials();
  }

  @Get('testimonials/approved')
  async getApproved() {
    return this.communityService.getAllApprovedTestimonials();
  }

  @Post('testimonials')
  @UseGuards(JwtAuthGuard)
  async submitTestimonial(@Request() req, @Body() data: { content: string; rating?: number }) {
    return this.communityService.submitTestimonial(req.user.userId, data);
  }

  @Get('testimonials/me')
  @UseGuards(JwtAuthGuard)
  async getMyTestimonials(@Request() req) {
    return this.communityService.getStudentTestimonials(req.user.userId);
  }

  @Patch('admin/testimonials/:id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN')
  async moderateTestimonial(@Param('id') id: string, @Body() data: { status: string; isFeatured: boolean }) {
    return this.communityService.moderateTestimonial(id, data.status, data.isFeatured);
  }

  @Get('matching')
  @UseGuards(JwtAuthGuard)
  async getMatches(@Request() req) {
    return this.communityService.findMatches(req.user.userId);
  }

  @Patch('profile')
  @UseGuards(JwtAuthGuard)
  async updateProfile(@Request() req, @Body() data: { faculty?: string; yearOfStudy?: number; hobbies?: string; bio?: string }) {
    return this.communityService.updateStudentProfile(req.user.userId, data);
  }

  @Get('profile/me')
  @UseGuards(JwtAuthGuard)
  async getMyProfile(@Request() req) {
    return this.communityService.getStudentProfile(req.user.userId);
  }

  @Get('study-buddies')
  @UseGuards(JwtAuthGuard)
  async getStudyPosts(@Query('faculty') faculty?: string) {
    return this.communityService.getStudyPosts(faculty);
  }

  @Post('study-buddies')
  @UseGuards(JwtAuthGuard)
  async createStudyPost(@Request() req, @Body() data: { title: string; content: string; faculty?: string; tags?: string[] }) {
    return this.communityService.createStudyPost(req.user.userId, data);
  }

  @Get('study-buddies/:id')
  @UseGuards(JwtAuthGuard)
  async getStudyPostDetails(@Param('id') id: string) {
    return this.communityService.getStudyPostDetails(id);
  }

  @Post('study-buddies/:id/reply')
  @UseGuards(JwtAuthGuard)
  async addReply(@Request() req, @Param('id') id: string, @Body('content') content: string) {
    return this.communityService.addReply(req.user.userId, id, content);
  }
}
