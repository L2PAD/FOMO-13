import { Module } from '@nestjs/common';
import { HttpModule } from '@nestjs/axios';
import { JwtModule } from '@nestjs/jwt';
import { TelegramController } from './telegram.controller';
import { TelegramService } from './telegram.service';
import { ConfigService,ConfigModule } from '@nestjs/config';
import { NestjsFormDataModule } from 'nestjs-form-data';
import { AuthModule } from 'src/auth/auth.module';
import { MongooseModule } from '@nestjs/mongoose';
import { TelegramBotLock, TelegramBotLockSchema } from './model/telegram-bot-lock.model';

@Module({
  imports: [
    NestjsFormDataModule,
    HttpModule,
    MongooseModule.forFeature([
      { name: TelegramBotLock.name, schema: TelegramBotLockSchema },
    ]),
    ConfigModule.forRoot(),
    JwtModule.register({}),
    AuthModule,
  ],
  controllers: [TelegramController],
  providers: [TelegramService, ConfigService],
  exports:[TelegramService]
})
export class TelegramModule {}
