import { Controller, Get, Post, Body, Param, UseGuards, Request, Query } from '@nestjs/common';
import { MessagesService } from './messages.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

@Controller('messages')
@UseGuards(JwtAuthGuard)
export class MessagesController {
  constructor(private readonly messagesService: MessagesService) {}

  @Post()
  async send(@Request() req, @Body() data: { receiverId: string; content: string }) {
    return this.messagesService.create(req.user.userId, data.receiverId, data.content);
  }

  @Get('contacts')
  async getContacts(@Request() req) {
    return this.messagesService.findMyContacts(req.user.userId);
  }

  @Get('conversations')
  async getConversations(@Request() req) {
    return this.messagesService.findMyContacts(req.user.userId);
  }

  @Get('conversation/:userId')
  async getConversation(
    @Request() req, 
    @Param('userId') otherUserId: string,
    @Query('category') category?: string,
    @Query('marketplaceItemId') marketplaceItemId?: string,
  ) {
    return this.messagesService.findConversation(req.user.userId, otherUserId, category, marketplaceItemId);
  }

  @Get('conversation-by-id/:conversationId')
  async getConversationById(@Request() req, @Param('conversationId') conversationId: string) {
    return this.messagesService.getConversationById(req.user.userId, conversationId);
  }

  @Get('search-users')
  async searchUsers(@Request() req, @Query('q') query: string) {
    return this.messagesService.searchUsersToChat(req.user.userId, query);
  }
}
