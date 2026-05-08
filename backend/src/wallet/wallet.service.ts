import { Injectable, BadRequestException, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { TransactionType, TransactionStatus } from '@prisma/client';

@Injectable()
export class WalletService {
  constructor(private prisma: PrismaService) {}

  async getBalance(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { balance: true }
    });
    if (!user) throw new NotFoundException('User not found');
    return user.balance;
  }

  async deposit(userId: string, amount: number, reference: string, description: string, metadata?: any) {
    if (amount <= 0) throw new BadRequestException('Amount must be greater than zero');

    return this.prisma.$transaction(async (tx) => {
      // 1. Update User Balance
      await tx.user.update({
        where: { id: userId },
        data: { balance: { increment: amount } }
      });

      // 2. Create Transaction Record
      return tx.walletTransaction.create({
        data: {
          userId,
          amount,
          type: TransactionType.DEPOSIT,
          status: TransactionStatus.COMPLETED,
          reference,
          description,
          metadata
        }
      });
    });
  }

  async transfer(fromUserId: string, toUserId: string, amount: number, description: string, type: TransactionType = TransactionType.TRANSFER) {
    if (amount <= 0) throw new BadRequestException('Amount must be greater than zero');

    return this.prisma.$transaction(async (tx) => {
      // 1. Check sender balance
      const sender = await tx.user.findUnique({
        where: { id: fromUserId },
        select: { balance: true }
      });

      if (!sender || sender.balance < amount) {
        throw new BadRequestException('Insufficient wallet balance');
      }

      // 2. Deduct from sender
      await tx.user.update({
        where: { id: fromUserId },
        data: { balance: { decrement: amount } }
      });

      // 3. Add to receiver
      await tx.user.update({
        where: { id: toUserId },
        data: { balance: { increment: amount } }
      });

      // 4. Create Transaction Records (One for each party)
      const debit = await tx.walletTransaction.create({
        data: {
          userId: fromUserId,
          amount: -amount,
          type,
          status: TransactionStatus.COMPLETED,
          description: `Sent to ${toUserId}: ${description}`,
          reference: `TRF-OUT-${Date.now()}`
        }
      });

      await tx.walletTransaction.create({
        data: {
          userId: toUserId,
          amount,
          type,
          status: TransactionStatus.COMPLETED,
          description: `Received from ${fromUserId}: ${description}`,
          reference: `TRF-IN-${Date.now()}`
        }
      });

      return debit;
    });
  }

  async requestWithdrawal(userId: string, amount: number, method: string, metadata?: any) {
    if (amount <= 0) throw new BadRequestException('Amount must be greater than zero');

    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { balance: true }
    });

    if (!user || user.balance < amount) {
      throw new BadRequestException('Insufficient balance for withdrawal');
    }

    return this.prisma.$transaction(async (tx) => {
      // 1. Deduct balance (Lock funds)
      await tx.user.update({
        where: { id: userId },
        data: { balance: { decrement: amount } }
      });

      // 2. Create Withdrawal Record
      const withdrawal = await tx.withdrawal.create({
        data: {
          landlordId: userId,
          amount,
          status: 'PENDING',
          method
        }
      });

      // 3. Create Transaction Record
      await tx.walletTransaction.create({
        data: {
          userId,
          amount: -amount,
          type: TransactionType.WITHDRAWAL,
          status: TransactionStatus.PENDING,
          reference: withdrawal.id,
          description: `Withdrawal request via ${method}`,
          metadata
        }
      });

      return withdrawal;
    });
  }

  async initiateTopup(userId: string, amount: number) {
    if (amount <= 0) throw new BadRequestException('Amount must be greater than zero');
    
    // Create a pending transaction
    return this.prisma.walletTransaction.create({
      data: {
        userId,
        amount,
        type: TransactionType.DEPOSIT,
        status: TransactionStatus.PENDING,
        description: 'Wallet Top-up initiation',
      }
    });
  }

  async getTransactionHistory(userId: string) {
    return this.prisma.walletTransaction.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      take: 50
    });
  }

  // --- Admin Methods ---

  async findAllWithdrawals() {
    return this.prisma.withdrawal.findMany({
      include: {
        landlord: {
          select: { name: true, email: true, phone: true, bankName: true, accountName: true, accountNumber: true }
        }
      },
      orderBy: { createdAt: 'desc' }
    });
  }

  async approveWithdrawal(id: string) {
    const withdrawal = await this.prisma.withdrawal.findUnique({
      where: { id }
    });

    if (!withdrawal) throw new NotFoundException('Withdrawal request not found');
    if (withdrawal.status !== 'PENDING') throw new BadRequestException('Only pending withdrawals can be approved');

    return this.prisma.$transaction(async (tx) => {
      // 1. Update Withdrawal Status
      const updated = await tx.withdrawal.update({
        where: { id },
        data: {
          status: 'COMPLETED',
          processedAt: new Date()
        }
      });

      // 2. Update Transaction Status
      await tx.walletTransaction.update({
        where: { reference: id },
        data: { status: TransactionStatus.COMPLETED }
      });

      return updated;
    });
  }

  async rejectWithdrawal(id: string, reason: string) {
    const withdrawal = await this.prisma.withdrawal.findUnique({
      where: { id }
    });

    if (!withdrawal) throw new NotFoundException('Withdrawal request not found');
    if (withdrawal.status !== 'PENDING') throw new BadRequestException('Only pending withdrawals can be rejected');

    return this.prisma.$transaction(async (tx) => {
      // 1. Update Withdrawal Status
      const updated = await tx.withdrawal.update({
        where: { id },
        data: {
          status: 'REJECTED',
          processedAt: new Date()
        }
      });

      // 2. Refund User Balance
      await tx.user.update({
        where: { id: withdrawal.landlordId },
        data: { balance: { increment: withdrawal.amount } }
      });

      // 3. Update Transaction Record
      await tx.walletTransaction.update({
        where: { reference: id },
        data: {
          status: TransactionStatus.FAILED,
          description: `Withdrawal rejected: ${reason}`
        }
      });

      // 4. Create Refund Transaction Record
      await tx.walletTransaction.create({
        data: {
          userId: withdrawal.landlordId,
          amount: withdrawal.amount,
          type: TransactionType.REFUND,
          status: TransactionStatus.COMPLETED,
          description: `Refund for rejected withdrawal ${id}: ${reason}`,
          reference: `REF-${id}`
        }
      });

      return updated;
    });
  }

  async findAllTransactions() {
    return this.prisma.walletTransaction.findMany({
      include: {
        user: {
          select: { name: true, email: true, role: true }
        }
      },
      orderBy: { createdAt: 'desc' },
      take: 100
    });
  }
}
