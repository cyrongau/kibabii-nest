import { Controller, Get, Post, Body, UseGuards, Request, Param, Put } from '@nestjs/common';
import { Roles } from '../auth/roles.decorator';
import { RolesGuard } from '../auth/roles.guard';
import { WalletService } from './wallet.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

@Controller('wallet')
@UseGuards(JwtAuthGuard)
export class WalletController {
  constructor(private readonly walletService: WalletService) {}

  @Get('balance')
  async getBalance(@Request() req) {
    return { balance: await this.walletService.getBalance(req.user.id) };
  }

  @Get('history')
  async getHistory(@Request() req) {
    return this.walletService.getTransactionHistory(req.user.id);
  }

  @Post('withdraw')
  async withdraw(@Request() req, @Body() body: { amount: number; method: string; metadata?: any }) {
    return this.walletService.requestWithdrawal(req.user.id, body.amount, body.method, body.metadata);
  }

  @Post('topup')
  async initiateTopup(@Request() req, @Body() body: { amount: number }) {
    return this.walletService.initiateTopup(req.user.id, body.amount);
  }

  // --- Admin Endpoints ---

  @Get('admin/withdrawals')
  @Roles('ADMIN')
  @UseGuards(RolesGuard)
  async getAllWithdrawals() {
    return this.walletService.findAllWithdrawals();
  }

  @Put('admin/withdrawals/:id/approve')
  @Roles('ADMIN')
  @UseGuards(RolesGuard)
  async approveWithdrawal(@Param('id') id: string) {
    return this.walletService.approveWithdrawal(id);
  }

  @Put('admin/withdrawals/:id/reject')
  @Roles('ADMIN')
  @UseGuards(RolesGuard)
  async rejectWithdrawal(@Param('id') id: string, @Body() body: { reason: string }) {
    return this.walletService.rejectWithdrawal(id, body.reason);
  }

  @Get('admin/transactions')
  @Roles('ADMIN')
  @UseGuards(RolesGuard)
  async getAllTransactions() {
    return this.walletService.findAllTransactions();
  }
}
