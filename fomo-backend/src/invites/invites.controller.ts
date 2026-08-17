import { Controller, Get, Post, Put, Req, UseGuards } from '@nestjs/common';
import { Request } from 'express';
import { JwtAuthGuard } from 'src/auth/jwt.auth.guard';
import { Roles } from 'src/auth/role.decorator';
import { InvitesService } from './invites.service';
import { CreateInviteDto, InviteDto } from './dto/invite.dto';
import { Invite } from './models/invite.model';
import { ConfirmInviteDto } from './dto/confirm-invite.dto';
import { RejectInviteDto } from './dto/reject-invite.dto';
import { ExcludeInviteDto } from './dto/exclude-invite.dto';

@Controller('invites')
export class InvitesController {
    constructor(
        private readonly invitesService : InvitesService
    ){}

    @Roles('any')
    @UseGuards(JwtAuthGuard)
    @Get('')
    async getUserInvites(
        @Req() req : Request
    ) : Promise<Array<InviteDto>>{
        const inviterId : string = req.user._id 

        return this.invitesService.getInvites(inviterId)
    }
    
    @Roles('any')
    @UseGuards(JwtAuthGuard)
    @Post('')
    async createInvite(
        @Req() req : Request
    ) : Promise<Array<Invite>>{
        const data : {
            users:Array<string> 
            boardId:string 
        } = req.body
        const senderId : string = req.user._id 
 
        return this.invitesService.createInvites({
            ...data,
            senderId
        })
    }

    @Roles('any')
    @UseGuards(JwtAuthGuard)
    @Put('/confirm')
    async confirmInvite(
        @Req() req : Request
    ) : Promise<any>{
        const data : ConfirmInviteDto = req.body
        const inviterId : string = req.user._id 

        return this.invitesService.confirmInvite({
            ...data,
            inviterId
        })
    }

    @Roles('any')
    @UseGuards(JwtAuthGuard)
    @Put('/reject')
    async rejectInvite(
        @Req() req : Request
    ) : Promise<any>{
        const data : RejectInviteDto = req.body
        const inviterId : string = req.user._id 

        return this.invitesService.rejectInvite({
            ...data,
            inviterId
        })
    }

    @Roles('any')
    @UseGuards(JwtAuthGuard)
    @Put('/exclude')
    async excludeUser(
        @Req() req : Request
    ) : Promise<any>{
        const senderId : string = req.user._id 
        const data : ExcludeInviteDto = req.body

        return this.invitesService.excludeUser(senderId,data.boardId,data.inviterId)
    }

}
