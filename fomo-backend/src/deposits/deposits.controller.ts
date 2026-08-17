import {
    Controller,
    Post,
    Body,
    UseGuards,
    Req,
    HttpCode,
    HttpStatus,
    Get,
    Query,
} from '@nestjs/common';
import { Request } from 'express';
import { JwtAuthGuard } from 'src/auth/jwt.auth.guard';
import { DepositsService } from './deposits.service';
import { CreateDepositDto, QueryDepositDto } from './dto/deposit.dto';
import { Roles } from 'src/auth/role.decorator';

@Controller('deposits')
export class DepositsController {
    constructor(private readonly depositsService: DepositsService) { }

    @Roles('admin,moderator')
    @UseGuards(JwtAuthGuard)
    @Get()
    async findAll(
        @Query() query: QueryDepositDto,
    ) {
        return this.depositsService.findAll(query);
    }


    @Roles('any')
    @UseGuards(JwtAuthGuard)
    @Post()
    @HttpCode(HttpStatus.CREATED)
    async createDeposit(
        @Req() req: Request,
        @Body() createDepositDto: CreateDepositDto,
    ) {
        const userId = req.user._id;
        return this.depositsService.createDepositFromBlockchain(createDepositDto, userId);
    }
}