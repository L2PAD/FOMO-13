import { Body, Controller, Delete, Get, Param, Post, Query, Req, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from 'src/auth/jwt.auth.guard';
import { Roles } from 'src/auth/role.decorator';
import { NotificationsService } from './notifications.service';
import { SocialNotificationsService } from './social-notifications.service';
import { Request } from 'express';

@Controller('notifications')
export class NotificationsController {
    constructor(
        private readonly notificationsService : NotificationsService,
        private readonly social : SocialNotificationsService
    ){}

    // ── Social notifications (repost / reply / like / follow) ─────────────────
    @Roles('any')
    @UseGuards(JwtAuthGuard)
    @Get('/social')
    listSocial(@Req() req: Request, @Query('limit') limit?: string) {
        return this.social.list(String(req.user._id), limit ? Number(limit) : 30);
    }

    @Roles('any')
    @UseGuards(JwtAuthGuard)
    @Get('/social/unread-count')
    async unreadSocial(@Req() req: Request) {
        return { unread: await this.social.unreadCount(String(req.user._id)) };
    }

    @Roles('any')
    @UseGuards(JwtAuthGuard)
    @Post('/social/read')
    markSocialRead(@Req() req: Request, @Body() body: { ids?: string[] }) {
        return this.social.markRead(String(req.user._id), body?.ids);
    }

    @Roles('any')
    @UseGuards(JwtAuthGuard)
    @Post('/:id')
    async createNotification(
        @Req() req : Request,
        @Param('id') itemId: string
    ) : Promise<any> {
        const userId : string = req.user._id 

        return this.notificationsService.createNotification(itemId,userId)
    }

    
    @Roles('any')
    @UseGuards(JwtAuthGuard)
    @Delete('/:id')
    async deleteNotification(
        @Req() req : Request,
        @Param('id') itemId: string
    ) : Promise<any> {
        const userId : string = req.user._id 
        
        return this.notificationsService.removeNotification(itemId,userId)
    }
}
