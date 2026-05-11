import { Injectable, Inject, forwardRef } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { TicketStatus } from '@prisma/client';
import { ChatGateway } from '../messages/chat.gateway';

@Injectable()
export class SupportService {
  constructor(
    private prisma: PrismaService,
    @Inject(forwardRef(() => ChatGateway))
    private chatGateway: ChatGateway,
  ) {}

  async createTicket(userId: string, data: { subject: string; description: string; category?: string }) {
    return this.prisma.supportTicket.create({
      data: {
        userId,
        subject: data.subject,
        description: data.description,
        category: data.category || 'GENERAL',
      },
    });
  }

  async findAllTickets() {
    return this.prisma.supportTicket.findMany({
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            avatar: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async findMyTickets(userId: string) {
    return this.prisma.supportTicket.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
    });
  }

  async findOneTicket(id: string) {
    return this.prisma.supportTicket.findUnique({
      where: { id },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            avatar: true,
          },
        },
        conversation: {
          include: {
            messages: {
              include: {
                sender: { select: { id: true, name: true, avatar: true, role: true } },
              },
              orderBy: { createdAt: 'asc' },
            },
          },
        },
      },
    });
  }

  async updateTicketStatus(id: string, status: TicketStatus) {
    return this.prisma.supportTicket.update({
      where: { id },
      data: { status },
    });
  }

  async respondToTicket(adminId: string, data: { ticketId: string; text: string; receiverId: string }) {
    const ticket = await this.prisma.supportTicket.findUnique({
      where: { id: data.ticketId },
      include: { conversation: true },
    });

    if (!ticket) throw new Error('Ticket not found');

    let conversationId = ticket.conversation?.id;

    if (!conversationId) {
      const conversation = await this.prisma.conversation.create({
        data: {
          ticketId: ticket.id,
          participants: {
            connect: [{ id: adminId }, { id: data.receiverId }],
          },
        },
      });
      conversationId = conversation.id;
      
      await this.prisma.supportTicket.update({
        where: { id: ticket.id },
        data: { status: TicketStatus.IN_PROGRESS },
      });
    } else {
      if (ticket.status === TicketStatus.OPEN) {
        await this.prisma.supportTicket.update({
          where: { id: ticket.id },
          data: { status: TicketStatus.IN_PROGRESS },
        });
      }
    }

    const message = await this.prisma.message.create({
      data: {
        senderId: adminId,
        receiverId: data.receiverId,
        conversationId,
        text: data.text,
      },
      include: {
        sender: { select: { id: true, name: true, avatar: true, role: true } },
      },
    });

    // Emit via socket for real-time updates
    if (this.chatGateway && this.chatGateway.server) {
      this.chatGateway.server.to(conversationId).emit('new_message', message);
    }

    return message;
  }
}
