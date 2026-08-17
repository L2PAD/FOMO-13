import { UseGuards } from '@nestjs/common';
import { Server, Socket } from 'socket.io';
import { SocketAuthGuard } from 'src/auth/socket.auth.guard';
import { MessageDto } from 'src/message/dto/message.dto';
import { MessageService } from 'src/message/message.service';
import { ChatService } from './chat.service';
import {
  WebSocketGateway,
  WebSocketServer,
  SubscribeMessage,
  MessageBody,
  ConnectedSocket,
} from '@nestjs/websockets';

@WebSocketGateway({ cors: { origin: '*' } })
export class ChatGateway {
  @WebSocketServer()
  server: Server;

  constructor(
    private readonly messagesService: MessageService,
    private readonly chatService: ChatService
  ) { }

  private isStaffUser(user: any): boolean {
    const possibleRoleValues = [
      user?.role,
      user?.roles,
      user?.user?.role,
      user?.user?.roles,
    ];

    const roles = possibleRoleValues.flatMap((value) => {
      if (Array.isArray(value)) return value;
      if (typeof value === 'string') {
        return value.split(',').map((item) => item.trim()).filter(Boolean);
      }
      return [];
    });

    return roles.includes('admin') || roles.includes('moderator');
  }

  @UseGuards(SocketAuthGuard)
  @SubscribeMessage('sendMessage')
  async handleSendMessage(
    @MessageBody() data: MessageDto,
    @ConnectedSocket() client: Socket,
  ) {
    const user = client.data.auth;
    const isStaff = this.isStaffUser(user);

    try {
      const message: any = await this.messagesService.createMessage({
        ...data,
        from: user._id
      }, isStaff);

      const enriched = await this.messagesService.getMessageById(String(message?._id));
      this.server.to(data.chatId).emit('receiveMessage', enriched || message);
    } catch (error: any) {
      client.emit('messageError', {
        message: error.message || 'Failed to send message',
        statusCode: error.status || 500
      });
    }
  }

  @UseGuards(SocketAuthGuard)
  @SubscribeMessage('joinChat')
  handleJoinChat(@MessageBody() chatId: string, @ConnectedSocket() client: Socket) {
    if (!chatId || chatId === 'undefined') return;
    const user = client.data.auth;
    const isStaff = this.isStaffUser(user);

    this.chatService.canAccessChat(chatId, user._id, isStaff).then((canAccess) => {
      if (!canAccess) {
        client.emit('chatError', { message: 'Chat access denied' });
        return;
      }
      client.join(chatId);
      client.emit('joinedChat', chatId);
    });
  }

  @UseGuards(SocketAuthGuard)
  @SubscribeMessage('leaveChat')
  handleLeaveChat(@MessageBody() chatId: string, @ConnectedSocket() client: Socket) {
    if (!chatId || chatId === 'undefined') return;
    client.leave(chatId);
    client.emit('leftChat', chatId);
  }

  @UseGuards(SocketAuthGuard)
  @SubscribeMessage('getMessages')
  async handleGetMessages(
    @MessageBody() data: { chatId: string; limit?: number; skip?: number },
    @ConnectedSocket() client: Socket,
  ) {
    const user = client.data.auth;
    const { chatId, limit = 20, skip = 0 } = data;
    if (chatId === 'undefined') {
      client.emit('allMessages', { messages: [], total: 0, hasMore: false });
      return;
    }
    const isStaff = this.isStaffUser(user);
    try {
      const result = await this.messagesService.getCurrentChatMessages(chatId, user._id, isStaff, limit, skip);
      client.emit('allMessages', result);
    } catch (error) {
      client.emit('chatError', { message: 'Chat access denied' });
    }
  }

  @UseGuards(SocketAuthGuard)
  @SubscribeMessage('loadMoreMessages')
  async handleLoadMoreMessages(
    @MessageBody() data: { chatId: string; skip: number; limit?: number },
    @ConnectedSocket() client: Socket,
  ) {
    const user = client.data.auth;
    const { chatId, skip, limit = 20 } = data;

    if (chatId === 'undefined') {
      client.emit('moreMessages', { messages: [], total: 0, hasMore: false });
      return;
    }

    const isStaff = this.isStaffUser(user);
    try {
      const result = await this.messagesService.getCurrentChatMessages(chatId, user._id, isStaff, limit, skip);
      client.emit('moreMessages', result);
    } catch (error) {
      client.emit('chatError', { message: 'Chat access denied' });
    }
  }
}
