import { Body, Controller, Get, Post, Req, UseGuards } from '@nestjs/common';
import { TradingService } from './trading.service';
import { JwtAuthGuard } from 'src/auth/jwt.auth.guard';
import { Roles } from 'src/auth/role.decorator';
import { CreateTradingDto } from './dto/create-dto';

@Controller('trading')
export class TradingController {
    constructor(private readonly tradingService: TradingService) { }

    @Roles("any")
    @UseGuards(JwtAuthGuard)
    @Post()
    async createTrading(@Body() dto: CreateTradingDto, @Req() req) {
        const userId: string = req.user._id;

        return await this.tradingService.createTradingByUser(userId, dto);
    }

    @Roles("any")
    @UseGuards(JwtAuthGuard)
    @Get('private')
    async getPrivateTradings(@Req() req) {
        const userId: string = req.user._id;
        return await this.tradingService.getPrivateTradings(userId);
    }

    @Get('public')
    async getPublicTradings() {
        return await this.tradingService.getPublicTradings();
    }
}
