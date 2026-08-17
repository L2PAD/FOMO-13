import { Post,Get, Controller, UseGuards, Req } from '@nestjs/common';
import { Request } from 'express';
import { JwtAuthGuard } from 'src/auth/jwt.auth.guard';
import { Roles } from 'src/auth/role.decorator';
import { SupportService } from './support.service';
import { FormDataRequest } from 'nestjs-form-data';
import { SupportDto } from './dto/support.dto';
import { JwtWalletGuard } from 'src/auth/jwt.wallet.guard';

@Controller('support')
export class SupportController {
    constructor(
        private readonly supportService : SupportService
    ){}

    @Roles('admin,moderator')
    @UseGuards(JwtAuthGuard)
    @Get()
    async getMessages() : Promise<Array<SupportDto>> {
        return this.supportService.getMessages()
    }

    @UseGuards(JwtWalletGuard)
    @Post()
    @FormDataRequest()
    async sendSupportMessage(@Req() req : Request ) : Promise<any> {
        const wallet : string = req.user.wallet
        const body : SupportDto = {...req.body}

        return this.supportService.sendMessage(body,wallet)
    }
}
