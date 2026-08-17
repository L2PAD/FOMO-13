import { Controller, Post, Body, Get, Param, UseGuards, Req, Put } from '@nestjs/common';
import { ChatService } from './chat.service';
import { Chat } from './models/chat.model';
import { Roles } from 'src/auth/role.decorator';
import { JwtAuthGuard } from 'src/auth/jwt.auth.guard';
import { Request } from 'express';

@Controller('chats')
export class ChatController {
  constructor(private readonly chatService: ChatService) { }

  @Roles('any')
  @UseGuards(JwtAuthGuard)
  @Post()
  async createChat(
    @Req() req: Request,
    @Body() body: { users: string[] }
  ): Promise<Chat> {
    const userId: string = req.user._id

    return this.chatService.createChat([...body.users, userId], userId);
  }

  @Roles('any')
  @UseGuards(JwtAuthGuard)
  @Get()
  async getUserChats(@Req() req: Request): Promise<Array<Chat>> {
    const userId: string = req.user._id

    return this.chatService.getChats(userId)
  }

  @Roles('any')
  @UseGuards(JwtAuthGuard)
  @Get(':id')
  async getChat(
    @Req() req: Request,
    @Param('id') chatId: string
  ): Promise<Chat> {
    const userId: string = req.user._id
    const rawRole = (req.user as any)?.role;
    const roles = Array.isArray(rawRole)
      ? rawRole
      : typeof rawRole === 'string'
        ? rawRole.split(',').map((item) => item.trim()).filter(Boolean)
        : [];
    const isStaff = roles.includes('admin') || roles.includes('moderator');

    return this.chatService.getChat(chatId, userId, isStaff);
  }

  @Roles('any')
  @UseGuards(JwtAuthGuard)
  @Put('pin/:id')
  async pinChat(
    @Req() req: Request,
    @Param('id') chatId: string
  ): Promise<Chat> {
    const currentUserId: string = req.user._id
    return this.chatService.pinChat(chatId, currentUserId);
  }

  @Roles('any')
  @UseGuards(JwtAuthGuard)
  @Put('unpin/:id')
  async unpinChat(
    @Req() req: Request,
    @Param('id') chatId: string
  ): Promise<Chat> {
    const currentUserId: string = req.user._id
    return this.chatService.unpinChat(chatId, currentUserId);
  }
}
