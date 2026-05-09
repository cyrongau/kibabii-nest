import { Controller, Post, Get, Patch, Param, Body, UseGuards, Request, Query } from '@nestjs/common';
import { PaymentsService } from './payments.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';

@Controller('payments')
export class PaymentsController {
  constructor(private readonly paymentsService: PaymentsService) {}

  @Post('generate-monthly')
  @UseGuards(JwtAuthGuard)
  async generateMonthly() {
    return this.paymentsService.generateMonthlyPayments();
  }

  @Post(':id/receipt')
  @UseGuards(JwtAuthGuard)
  async submitReceipt(@Param('id') id: string, @Body() data: { fileUrl?: string; rawText?: string }) {
    return this.paymentsService.submitReceipt(id, data);
  }

  @Patch(':id/verify')
  @UseGuards(JwtAuthGuard)
  async verifyPayment(@Param('id') id: string, @Body('approved') approved: boolean) {
    return this.paymentsService.verifyPayment(id, approved);
  }

  @Post('upfront/:tenancyId')
  @UseGuards(JwtAuthGuard)
  async payUpfront(@Param('tenancyId') tenancyId: string, @Body('months') months: number) {
    return this.paymentsService.payUpfront(tenancyId, months);
  }

  @Post(':id/mpesa')
  @UseGuards(JwtAuthGuard)
  async initiateMpesa(@Param('id') id: string, @Body('phoneNumber') phoneNumber: string) {
    return this.paymentsService.initiateMpesa(id, phoneNumber);
  }

  @Post('wallet-topup-stk')
  @UseGuards(JwtAuthGuard)
  async walletTopupStk(@Request() req: any, @Body() body: { amount: number; phoneNumber: string }) {
    return this.paymentsService.initiateWalletTopup(req.user.userId, body.amount, body.phoneNumber);
  }

  @Post(':id/wallet-pay')
  @UseGuards(JwtAuthGuard)
  async walletPay(@Param('id') id: string, @Request() req: any) {
    return this.paymentsService.payWithWallet(id, req.user.userId);
  }

  @Post('mpesa/callback')
  async mpesaCallback(@Body() data: any) {
    return this.paymentsService.handleMpesaCallback(data);
  }

  @Get('mpesa/stk-query/:id')
  @UseGuards(JwtAuthGuard)
  async queryMpesa(@Param('id') id: string) {
    return this.paymentsService.queryMpesaStatus(id);
  }

  @Get('tenancy/:tenancyId')
  @UseGuards(JwtAuthGuard)
  async getByTenancy(@Param('tenancyId') tenancyId: string) {
    return this.paymentsService.findByTenancy(tenancyId);
  }

  @Get('landlord')
  @UseGuards(JwtAuthGuard)
  async getLandlordPayments(@Request() req: any) {
    return this.paymentsService.findByLandlord(req.user.userId);
  }

  @Get('landlord/summary')
  @UseGuards(JwtAuthGuard)
  async getLandlordSummary(@Request() req: any) {
    return this.paymentsService.getLandlordFinanceSummary(req.user.userId);
  }

  @Get('admin/summary')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN')
  async getAdminSummary() {
    return this.paymentsService.getAdminFinanceSummary();
  }

  @Get('admin/history')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN')
  async getAdminHistory() {
    return this.paymentsService.findAllAdmin();
  }

  @Post('process-overdue')
  @UseGuards(JwtAuthGuard)
  async processOverdue() {
    return this.paymentsService.processOverduePayments();
  }

  @Post('manual')
  @UseGuards(JwtAuthGuard)
  async createManualPayment(@Request() req: any, @Body() data: any) {
    return this.paymentsService.createManualPayment(req.user.userId, data);
  }

  @Get('history')
  @UseGuards(JwtAuthGuard)
  async getHistory(@Request() req: any) {
    return this.paymentsService.findHistoryByUser(req.user.userId);
  }
}
