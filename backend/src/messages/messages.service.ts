import { Injectable, NotFoundException, Inject, forwardRef } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { MessageType } from '@prisma/client';
import { ChatGateway } from './chat.gateway';

@Injectable()
export class MessagesService {
  constructor(
    private prisma: PrismaService,
    @Inject(forwardRef(() => ChatGateway))
    private chatGateway: ChatGateway,
  ) {}

  async create(senderId: string, receiverId: string, text: string) {
    // 1. Find or create conversation
    let conversation = await this.prisma.conversation.findFirst({
      where: {
        participants: { every: { id: { in: [senderId, receiverId] } } },
        ticketId: null,
        marketplaceItemId: null
      }
    });

    if (!conversation) {
      conversation = await this.prisma.conversation.create({
        data: {
          participants: { connect: [{ id: senderId }, { id: receiverId }] },
          category: 'GENERAL'
        }
      });
    }

    // 2. Create message
    const message = await this.prisma.message.create({
      data: {
        senderId,
        receiverId,
        conversationId: conversation.id,
        text,
      },
      include: {
        sender: { select: { id: true, name: true, avatar: true, role: true } },
      },
    });

    // 3. Emit via socket
    if (this.chatGateway && this.chatGateway.server) {
      this.chatGateway.server.to(conversation.id).emit('new_message', message);
    }

    return message;
  }

  async findMyContacts(userId: string) {
    // Contacts are users who have a conversation with this user
    const conversations = await this.prisma.conversation.findMany({
      where: {
        participants: { some: { id: userId } },
        ticketId: null
      },
      include: {
        participants: {
          where: { id: { not: userId } },
          select: { id: true, name: true, avatar: true, role: true }
        },
        messages: {
          orderBy: { createdAt: 'desc' },
          take: 1
        },
        marketplaceItem: true
      }
    });

    return conversations;
  }

  async findConversation(userId: string, otherUserId: string, category: any = 'GENERAL', marketplaceItemId?: string) {
    let conversation = await this.prisma.conversation.findFirst({
      where: {
        AND: [
          { participants: { some: { id: userId } } },
          { participants: { some: { id: otherUserId } } },
          { category: category },
          { marketplaceItemId: marketplaceItemId || null },
          { ticketId: null }
        ]
      },
      include: {
        messages: {
          orderBy: { createdAt: 'asc' },
          include: {
            sender: { select: { id: true, name: true, avatar: true, role: true } }
          }
        },
        participants: {
          where: { id: { not: userId } },
          select: { id: true, name: true, avatar: true, role: true }
        },
        marketplaceItem: true
      }
    });

    if (!conversation) {
      console.log(`Creating new ${category} conversation between ${userId} and ${otherUserId}`);
      try {
        conversation = await this.prisma.conversation.create({
          data: {
            participants: { connect: [{ id: userId }, { id: otherUserId }] },
            category: category,
            marketplaceItemId: marketplaceItemId
          },
          include: {
            messages: true,
            participants: {
              where: { id: { not: userId } },
              select: { id: true, name: true, avatar: true, role: true }
            },
            marketplaceItem: true
          }
        }) as any;
      } catch (e) {
        console.error(`Failed to create conversation: ${e.message}. Participants:`, { userId, otherUserId });
        throw e;
      }
    }

    return conversation;
  }

  async createMessage(data: {
    senderId: string;
    receiverId: string;
    conversationId: string;
    text?: string;
    mediaUrl?: string;
    type?: MessageType;
  }) {
    return this.prisma.message.create({
      data: {
        sender: { connect: { id: data.senderId } },
        receiver: { connect: { id: data.receiverId } },
        conversation: { connect: { id: data.conversationId } },
        text: data.text,
        mediaUrl: data.mediaUrl,
        type: data.type || MessageType.TEXT,
      },
      include: {
        sender: { select: { id: true, name: true, avatar: true, role: true } },
      },
    });
  }

  async getConversationMessages(conversationId: string) {
    return this.prisma.message.findMany({
      where: { conversationId },
      orderBy: { createdAt: 'asc' },
      include: {
        sender: { select: { id: true, name: true, avatar: true, role: true } },
      },
    });
  }

  async getConversationById(userId: string, conversationId: string) {
    const conversation = await this.prisma.conversation.findUnique({
      where: { id: conversationId },
      include: {
        messages: {
          orderBy: { createdAt: 'asc' },
          include: {
            sender: { select: { id: true, name: true, avatar: true, role: true } }
          }
        },
        participants: {
          where: { id: { not: userId } },
          select: { id: true, name: true, avatar: true, role: true }
        }
      }
    });

    if (!conversation) throw new NotFoundException('Conversation not found');
    return conversation;
  }

  async searchUsersToChat(userId: string, query: string) {
    if (!query || query.length < 2) return [];

    // Find users by name or email
    // Exclude the current user
    const users = await this.prisma.user.findMany({
      where: {
        id: { not: userId },
        OR: [
          { name: { contains: query, mode: 'insensitive' } },
          { email: { contains: query, mode: 'insensitive' } },
        ]
      },
      select: {
        id: true,
        name: true,
        email: true,
        avatar: true,
        role: true,
      },
      take: 20
    });

    return users;
  }

  async markAsRead(messageIds: string[]) {
    return this.prisma.message.updateMany({
      where: { id: { in: messageIds } },
      data: { isRead: true },
    });
  }
}
