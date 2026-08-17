import { Controller, Get, HttpCode, HttpStatus, Req, UseGuards } from '@nestjs/common';
import { ActivityService } from './activity.service';
import { Roles } from 'src/auth/role.decorator';
import { JwtAuthGuard } from 'src/auth/jwt.auth.guard';
import { Request } from 'express';
import { Activity, ActivityTypes } from './models/activity.model';

@Controller('activity')
export class ActivityController {
    constructor(
        private readonly activityService:ActivityService
    ){}

        @Roles('any')
        @UseGuards(JwtAuthGuard)
        @HttpCode(HttpStatus.OK)
        @Get('/:type')
        async getModeratorActions(@Req() req : Request) : Promise<{ activities: Activity[]; totalCount: number }>{ 
            const id : string = req.user._id
            const type : ActivityTypes | 'all' | string = req.params.type
            const query : any = req.query
    
            return this.activityService.getActivities(id,type,query)
        }
    
}
