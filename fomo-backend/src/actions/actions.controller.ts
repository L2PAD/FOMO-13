import { Controller ,Get, Delete,Post, HttpCode, HttpStatus ,UseGuards, Param,Body,Req, Patch, Put} from '@nestjs/common';
import { Request } from 'express';
import { ActionsService } from './actions.service';
import { Roles } from 'src/auth/role.decorator';
import { JwtAuthGuard } from 'src/auth/jwt.auth.guard';
import { ActionDto } from './dto/action.dto';
import { DeleteActionsDto } from './dto/delete-actions.dto';
import { AddActionDto } from './dto/add-action.dto';
import { ActionsDto } from './dto/actions.dto';

@Controller('actions')
export class ActionsController {
    constructor(
        private readonly actionsService : ActionsService
    ){}
    
    @Roles('moderator')
    @UseGuards(JwtAuthGuard)
    @HttpCode(HttpStatus.OK)
    @Get('/moderator')
    async getModeratorActions(@Req() req : Request) : Promise<Array<ActionsDto>>{ 
        const id : string = req.user._id
        const status : 'moderator' = 'moderator'

        return this.actionsService.getActions(id,status)
    }

    @Roles('admin')
    @UseGuards(JwtAuthGuard)
    @HttpCode(HttpStatus.OK)
    @Get('/admin')
    async getAdminActions(@Req() req : Request) : Promise<Array<ActionsDto>>{ 
        const id : string = req.user._id
        const status : 'admin' = 'admin'

        return this.actionsService.getActions(id,status)
    }

    @Roles('moderator')
    @UseGuards(JwtAuthGuard)
    @HttpCode(HttpStatus.OK)
    @Put('moderator/confirm/:id')
    async confirmActionByModerator(@Req() req : Request) : Promise<any>{ 
        const id : string = req.params.id
        const moderatorId : string = req.user._id

        return this.actionsService.confirmActionByModerator(id,moderatorId)
    }

    @Roles('moderator')
    @UseGuards(JwtAuthGuard)
    @HttpCode(HttpStatus.OK)
    @Put('moderator/reject/:id')
    async rejectActionByModerator(@Param('id') actionId : string) : Promise<any>{
        const actionIdList : Array<string> = [actionId]

        return this.actionsService.deleteActions(actionIdList,'moderator')
    }

    @Roles('admin')
    @UseGuards(JwtAuthGuard)
    @HttpCode(HttpStatus.OK)
    @Put('admin/confirm/:id')
    async confirmActionByAdmin(@Param('id') actionId : string) : Promise<any>{ 
        return this.actionsService.confirmActionByAdmin(actionId)
    }

    @Roles('admin')
    @UseGuards(JwtAuthGuard)
    @HttpCode(HttpStatus.OK)
    @Put('admin/reject/:id')
    async rejectActionByAdmin(@Param('id') actionId : string) : Promise<any>{ 
        return this.actionsService.rejectActionByAdmin(actionId)
    }

    @Roles('moderator')
    @UseGuards(JwtAuthGuard)
    @HttpCode(HttpStatus.OK)
    @Post('moderator/confirm')
    async confirmManyActionsByModerator(
        @Req() req : Request,
        @Body() body : any
    ) : Promise<any>{
        const actionIdList : Array<string> = body.actions
        const moderatorId : string = req.user._id

        return this.actionsService.confirmManyActionsByModerator(actionIdList,moderatorId)
    }

    @Roles('moderator')
    @UseGuards(JwtAuthGuard)
    @HttpCode(HttpStatus.OK)
    @Post('moderator/reject')
    async rejectManyActionsByModerator(@Body() body : any) : Promise<any>{
        const actionIdList : Array<string> = body.actions

        return this.actionsService.deleteActions(actionIdList,'moderator')
    }

    @Roles('admin')
    @UseGuards(JwtAuthGuard)
    @HttpCode(HttpStatus.OK)
    @Post('admin/confirm')
    async confirmManyActionsByAdmin(@Body() body : any) : Promise<any>{
        const actionIdList : Array<string> = body.actions

        return this.actionsService.confirmManyActionsByAdmin(actionIdList)
    }
    
    @Roles('admin')
    @UseGuards(JwtAuthGuard)
    @HttpCode(HttpStatus.OK)
    @Post('admin/reject')
    async rejectManyActionsByAdmin(@Body() body : any) : Promise<any>{
        const actionIdList : Array<string> = body.actions

        return this.actionsService.rejectManyActionsByAdmin(actionIdList)
    }

    @Roles('user')
    @UseGuards(JwtAuthGuard)
    @HttpCode(HttpStatus.OK)
    @Delete('/:id')
    async deleteAction(
        @Req() req : Request,
        @Param('id') id : string
    ) : Promise<any>{
        const actionId : string = id 
        const userId : string = req.user._id 

        return this.actionsService.deleteActionByUser(actionId,userId)
    }
}
