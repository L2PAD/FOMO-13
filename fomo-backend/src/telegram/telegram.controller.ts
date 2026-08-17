import { Controller, Post, Body, UseGuards, Param } from '@nestjs/common';
import { HttpService } from '@nestjs/axios/dist';
import { ConfigService } from '@nestjs/config';

import { TelegramService } from './telegram.service';
import { Roles } from 'src/auth/role.decorator';
import { JwtAuthGuard } from 'src/auth/jwt.auth.guard';
import { MessageTelegramDto } from './dto/message.dto';
import { FormDataRequest } from 'nestjs-form-data';

@Controller('webhook')
export class TelegramController {
    botToken : string;

  constructor(
    private readonly configService : ConfigService,
    private readonly telegramService : TelegramService
  ) {
    this.botToken = this.configService.get('TELEGRAM_BOT_TOKEN')
  }

  @Roles('moderator,admin')
  @UseGuards(JwtAuthGuard)
  @FormDataRequest()
  @Post('telegram/:id')
  sendMessage(@Body() body : MessageTelegramDto,@Param('id') id : string) {
    return this.telegramService.sendMessageToUser(id,body)
  }
  
}