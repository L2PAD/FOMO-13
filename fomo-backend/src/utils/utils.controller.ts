import { Request } from 'express';
import { Controller, Get, Post, Req, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from 'src/auth/jwt.auth.guard';
import { UtilsService } from './utils.service';
import { Roles } from 'src/auth/role.decorator';

@Controller('utils')
export class UtilsController {
    constructor(
        private readonly utilsService : UtilsService
    ){}

    @Roles('any')
    @UseGuards(JwtAuthGuard)
    @Post('/alert')
    createAlert(@Req() req : Request) : Promise<any> {
        const userId : string = req.user._id 
        const data : any = req.body

        return this.utilsService.createAlert({...data,userId})
    }

    @Roles('any')
    @UseGuards(JwtAuthGuard)
    @Get('/alert-results/:projectId')
    getAlertResults(@Req() req : Request) : Promise<any> {
        const userId : string = req.user._id 
        const projectId : string = req.params.projectId

        return this.utilsService.getAiResults(userId,projectId)
    }
}
