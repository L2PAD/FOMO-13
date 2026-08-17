import {
    Controller,
    Post,
    Get,
    Delete,
    Body,
    Param,
    Query,
    UseGuards,
    Req,
    HttpCode,
    HttpStatus,
    Patch,
    ParseIntPipe,
    BadRequestException,
} from '@nestjs/common';
import { Request } from 'express';
import { JwtAuthGuard } from 'src/auth/jwt.auth.guard';
import { Roles } from 'src/auth/role.decorator';
import { WithdrawsService } from './withdraws.service';
import { CreateWithdrawDto, QueryWithdrawDto } from './dto/withdraw.dto';
import { AuthenticatedRequest } from 'src/auth/auth.controller';


@Controller('withdraws')
export class WithdrawsController {
    constructor(private readonly withdrawsService: WithdrawsService) { }

    @Roles('user')
    @UseGuards(JwtAuthGuard)
    @Post()
    @HttpCode(HttpStatus.CREATED)
    async createWithdraw(
        @Req() req: AuthenticatedRequest,
        @Body() createWithdrawDto: CreateWithdrawDto,
    ) {
        return this.withdrawsService.createWithdraw(createWithdrawDto, req.user._id);
    }

    @Roles('admin,moderator')
    @UseGuards(JwtAuthGuard)
    @Get()
    async findAll(
        @Query() query: QueryWithdrawDto,
    ) {
        return this.withdrawsService.findAll(query);
    }

    @Roles('admin,moderator')
    @UseGuards(JwtAuthGuard)
    @Get('statistics')
    async getStatistics() {
        return this.withdrawsService.getStatistics();
    }

    @Roles('any')
    @UseGuards(JwtAuthGuard)
    @Get(':id')
    async findOne(
        @Req() req: AuthenticatedRequest,
        @Param('id') id: string,
    ) {
        return this.withdrawsService.findOne(id, req.user.role, req.user._id);
    }

    @Roles('user')
    @UseGuards(JwtAuthGuard)
    @Delete(':id')
    @HttpCode(HttpStatus.OK)
    async remove(
        @Req() req: AuthenticatedRequest,
        @Param('id') id: string,
    ) {
        return this.withdrawsService.remove(id, req.user._id);
    }

    @Roles('user')
    @UseGuards(JwtAuthGuard)
    @Patch(':id/complete')
    @HttpCode(HttpStatus.OK)
    async completeWithdraw(
        @Req() req: AuthenticatedRequest,
        @Param('id') id: string,
        @Body('transactionHash') transactionHash: string,
    ) {

        return this.withdrawsService.completeWithdraw(id, req.user._id, transactionHash);
    }

    @Roles('admin,moderator')
    @UseGuards(JwtAuthGuard)
    @Patch(':id/approve')
    @HttpCode(HttpStatus.OK)
    async approveWithdraw(
        @Req() req: AuthenticatedRequest,
        @Param('id') id: string,
    ) {
        return this.withdrawsService.approveWithdraw(id, req.user._id);
    }

    @Roles('admin,moderator')
    @UseGuards(JwtAuthGuard)
    @Patch(':id/reject')
    @HttpCode(HttpStatus.OK)
    async rejectWithdraw(
        @Req() req: AuthenticatedRequest,
        @Param('id') id: string,
        @Body('reason') reason: string,
    ) {
        return this.withdrawsService.rejectWithdraw(id, req.user._id, reason || '');
    }
}