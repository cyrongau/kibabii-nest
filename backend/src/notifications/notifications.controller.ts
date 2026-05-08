import { 
  Controller, 
  Get, 
  Patch, 
  Post,
  Param, 
  UseGuards, 
  Request,
  Body
} from '@nestjs/common';
import { NotificationsService } from './notifications.service';
import { MailService } from './mail.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

@Controller('notifications')
@UseGuards(JwtAuthGuard)
export class NotificationsController {
  constructor(
    private readonly notificationsService: NotificationsService,
    private readonly mailService: MailService,
  ) {}

  @Get()
  async getNotifications(@Request() req) {
    return this.notificationsService.getNotifications(req.user.id, req.user.role);
  }

  @Patch(':id/read')
  async markAsRead(@Param('id') id: string, @Request() req) {
    return this.notificationsService.markAsRead(id, req.user.id);
  }

  @Patch('read-all')
  async markAllAsRead(@Request() req) {
    return this.notificationsService.markAllAsRead(req.user.id);
  }

  @Get('config')
  async getConfig() {
    return this.notificationsService.getConfig();
  }

  @Patch('config')
  async updateConfig(@Request() req) {
    // In a real app, check for ADMIN role here
    return this.notificationsService.updateConfig(req.body);
  }

  @Post('email/test')
  async testEmail(@Body('to') to: string) {
    return this.mailService.sendTestEmail(to);
  }
}
