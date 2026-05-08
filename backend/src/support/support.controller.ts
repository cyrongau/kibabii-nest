import { Controller, Get, Post, Body, Patch, Param, UseGuards, Req } from '@nestjs/common';
import { SupportService } from './support.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';
import { Role, TicketStatus } from '@prisma/client';

@Controller('support')
@UseGuards(JwtAuthGuard, RolesGuard)
export class SupportController {
  constructor(private readonly supportService: SupportService) {}

  @Post('tickets')
  create(@Req() req: any, @Body() body: { subject: string; description: string; category?: string }) {
    return this.supportService.createTicket(req.user.userId, body);
  }

  @Get('my-tickets')
  findMy(@Req() req: any) {
    return this.supportService.findMyTickets(req.user.userId);
  }

  @Get('tickets')
  @Roles(Role.ADMIN)
  findAll() {
    return this.supportService.findAllTickets();
  }

  @Get('tickets/:id')
  findOne(@Param('id') id: string) {
    return this.supportService.findOneTicket(id);
  }

  @Patch('tickets/:id/status')
  @Roles(Role.ADMIN)
  updateStatus(@Param('id') id: string, @Body('status') status: TicketStatus) {
    return this.supportService.updateTicketStatus(id, status);
  }

  @Post('tickets/respond')
  @Roles(Role.ADMIN)
  respond(@Req() req: any, @Body() body: { ticketId: string; text: string; receiverId: string }) {
    return this.supportService.respondToTicket(req.user.userId, body);
  }
}
