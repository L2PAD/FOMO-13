import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { HttpModule } from '@nestjs/axios';

import { DiscordController } from './discord.controller';

import { DiscordService } from './discord.service';
import { AuthModule } from 'src/auth/auth.module';

@Module({
  imports: [
    AuthModule,
    HttpModule,
    ConfigModule.forRoot(),
  ],
  controllers: [DiscordController],
  providers: [DiscordService]
})
export class DiscordModule { }
