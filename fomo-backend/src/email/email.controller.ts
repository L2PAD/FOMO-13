import { Body, Controller, Param, Post, UseGuards } from '@nestjs/common';
import { EmailService } from './email.service';
import { MessageTelegramDto } from 'src/telegram/dto/message.dto';
import { Roles } from 'src/auth/role.decorator';
import { JwtAuthGuard } from 'src/auth/jwt.auth.guard';
import { FormDataRequest } from 'nestjs-form-data';

@Controller('email')
export class EmailController {
    constructor(
        private readonly emailService : EmailService
    ){}

    @Roles('admin,moderator')
    @UseGuards(JwtAuthGuard)
    @FormDataRequest()
    @Post('/:email')
    sendMessage(@Body() body : MessageTelegramDto,@Param('email') email : string){
        return this.emailService.sendMessage(email,body)
    }
}
