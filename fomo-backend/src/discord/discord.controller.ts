import { Controller, Get, Post, Res, HttpStatus, Req } from '@nestjs/common';
import { Response, Request} from 'express';
import { DiscordService } from './discord.service';

@Controller('discord')
export class DiscordController {
    constructor(
        private readonly discordService:DiscordService
      ){}

    @Get()
    async auth(@Req() req: Request,@Res() res: Response) {
        const code : any = req.query.code

        const redirectLink : string = await this.discordService.discordAuth(code)

        return res.redirect(redirectLink)
    }
}
