import { Get, Post, Delete, Controller, Body, UseGuards, Param, Patch, Req } from '@nestjs/common';
import { Request } from 'express';
import { JwtAuthGuard } from 'src/auth/jwt.auth.guard';
import { Roles } from 'src/auth/role.decorator';
import { WatchlistService } from './watchlist.service';
import { CreateWatchlistDto } from './dto/create-watchlist.dto';
import { WatchlistDto } from './dto/watchlist.dto';


@Controller('watchlist')
export class WatchlistController {
    constructor(
        private readonly watchlistService : WatchlistService,
    ){}

    @Roles('any')
    @UseGuards(JwtAuthGuard)
    @Get('/:page')
    async getWatchlist(@Req() req : Request) : Promise<WatchlistDto> {
        const page : string = req.params.page
        const id : string = req.user._id 

        return this.watchlistService.getWatchlist(page,id)
    }

    @Roles('any')
    @UseGuards(JwtAuthGuard)
    @Post(':page/:projectId')
    async addToWatchlist(
        @Req() req : Request
    ) 
    : Promise<WatchlistDto> {
        const id : string = req.user._id 
        const page : string = req.params.page
        const projectId : string = req.params.projectId
        
        return this.watchlistService.addToWatchlist(page,id,projectId)
    }

    @Roles('any')
    @UseGuards(JwtAuthGuard)
    @Delete(':page/:projectId')
    async removeFromWatchlist(
        @Req() req : Request
    ) 
    : Promise<WatchlistDto> {
        const id : string = req.user._id 
        const page : string = req.params.page
        const projectId : string = req.params.projectId

        return this.watchlistService.removeFromWatchlist(page,id,projectId)
    }       
}
