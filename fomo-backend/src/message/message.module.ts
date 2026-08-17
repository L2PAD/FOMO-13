import { Module } from '@nestjs/common';
import { MessageController } from './message.controller';
import { MessageService } from './message.service';
import { MongooseModule } from '@nestjs/mongoose';
import { User, UserSchema } from 'src/user/user.model';
import { ConfigModule } from '@nestjs/config';
import { JwtModule } from '@nestjs/jwt';
import { Message, MessageSchema } from './models/message.model';
import { Chat, ChatSchema } from 'src/chat/models/chat.model';
import { FilesModule } from 'src/files/files.module';
import { FilesService } from 'src/files/files.service';
import { NestjsFormDataModule } from 'nestjs-form-data';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: User.name, schema: UserSchema },
      { name: Message.name, schema: MessageSchema },
      { name: Chat.name, schema: ChatSchema },
    ]),
    FilesModule,
    NestjsFormDataModule,
    ConfigModule.forRoot(),
    JwtModule.register({}),
  ],
  controllers: [MessageController],
  providers: [MessageService, FilesService],
  exports: [
    MessageService,
    MongooseModule.forFeature([
      { name: Message.name, schema: MessageSchema }
    ])
  ]
})
export class MessageModule { }
