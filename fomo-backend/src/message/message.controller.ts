import { Body, Controller, Get, Param, Patch, Post, Put, Req, UseGuards } from '@nestjs/common';
import { FormDataRequest, MemoryStoredFile } from 'nestjs-form-data';
import { MessageDto } from './dto/message.dto';
import { Request } from 'express';
import { MessageService } from './message.service';
import { Roles } from 'src/auth/role.decorator';
import { JwtAuthGuard } from 'src/auth/jwt.auth.guard';

@Controller('messages')
export class MessageController {
    constructor(
        private readonly messageService : MessageService
    ){}

    @Roles('any')
    @UseGuards(JwtAuthGuard)
    @Get('/new')
    getNewMessages(@Req() req : Request){
        const id : string = req.user._id
       
        return this.messageService.getNewMessages(id)
    }

    @Roles('any')
    @UseGuards(JwtAuthGuard)
    @Get('/all')
    getAllUserMessages(@Req() req : Request){
        const id : string = req.user._id
       
        return this.messageService.getAllMessages(id)
    }

    @Roles('any')
    @UseGuards(JwtAuthGuard)
    @Get('/all/:recipientId')
    getCurrentMessages(@Req() req : Request){
        const userId : string = req.user._id
        const recipientId : string = req.params.recipientId
       
        return this.messageService.getCurrentUserMessages(userId,recipientId)
    }

    @Roles('any')
    @UseGuards(JwtAuthGuard)
    @Post()
    createMessage(@Req() req : Request){
        const id : string = req.user._id
        const roles: string[] = Array.isArray(req.user.role) ? req.user.role : []
        const isStaff = roles.includes('admin') || roles.includes('moderator');
        const messageData : MessageDto = {...req.body,from:id} 

        return this.messageService.createMessage(messageData, isStaff)
    }

    @Roles('any')
    @UseGuards(JwtAuthGuard)
    @Post('/upload')
    @FormDataRequest()
    uploadMessageFile(@Body('file') file: MemoryStoredFile) {
        return this.messageService.uploadMessageFile({
            buffer: file.buffer,
            originalName: file.originalName
        });
    }

    @Roles('any')
    @UseGuards(JwtAuthGuard)
    @Put('/:chatId')
    updateMessages(@Req() req : Request){
        const id : string = req.user._id
        const chatId : string = req.params.chatId

        return this.messageService.updateMessages(id,chatId)
    }

    @Roles('any')
    @UseGuards(JwtAuthGuard)
    @Patch('report/:id')
    addReport(@Req() req: Request, @Param('id') messageId: string) {
        const userId: string = req.user._id;

        return this.messageService.addReport(messageId, userId);
    }

    @Roles('any')
    @UseGuards(JwtAuthGuard)
    @Get('/admin/reported')
    getReportedMessages() {
        return this.messageService.getReportedMessages();
    }
}
