import { Get,Req,UseGuards } from '@nestjs/common';
import { JwtWalletGuard } from 'src/auth/jwt.wallet.guard';
import { Controller } from '@nestjs/common';
import { LeaderboardService } from './leaderboard.service';
import { LeaderboardDto } from './dto/leaderboard.dto';
import { Request } from 'express';

@Controller('leaderboard')
export class LeaderboardController {
    constructor(
        private readonly leaderboardService : LeaderboardService
    ){}

    @UseGuards(JwtWalletGuard)
    @Get('/')
    getLeaderboard(@Req() req : Request) : Promise<Array<LeaderboardDto>> {
        return this.leaderboardService.getLeaderboard()
    }
}
