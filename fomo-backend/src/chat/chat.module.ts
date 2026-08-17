import { Module } from '@nestjs/common';
import { ChatController } from './chat.controller';
import { ChatService } from './chat.service';
import { ChatGateway } from './chat.gateway';
import { MessageModule } from 'src/message/message.module';
import { MessageService } from 'src/message/message.service';
import { HttpModule } from '@nestjs/axios';
import { JwtModule } from '@nestjs/jwt';
import { ConfigModule } from '@nestjs/config';
import { MongooseModule } from '@nestjs/mongoose';
import { Message, MessageSchema } from 'src/message/models/message.model';
import { User, UserSchema } from 'src/user/user.model';
import { Chat, ChatSchema } from './models/chat.model';
import { FilesModule } from 'src/files/files.module';

@Module({
  imports: [
    HttpModule,
    JwtModule.register({}),
    ConfigModule.forRoot(),
    MongooseModule.forFeature([
      { name: Message.name, schema: MessageSchema },
      { name: User.name, schema: UserSchema },
      { name: Chat.name, schema: ChatSchema },
    ]),
    MessageModule,
    FilesModule,
  ],
  controllers: [ChatController],
  providers: [ChatService,ChatGateway,MessageService],
  exports: [ChatGateway]
})
export class ChatModule {}
