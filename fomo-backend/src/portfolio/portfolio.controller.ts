// src/portfolio/portfolio.controller.ts
import { Body, Controller, Delete, Get, Param, Patch, Post, Put, Query, Req, UseGuards } from '@nestjs/common';
import { PortfolioService } from './portfolio.service';
import { CreatePortfolioDto, ToggleBattleDto } from './dto/create-portfolio.dto';
import { QueryBattleBoardDto } from './dto/query-battle-board.dto';
import { QueryPublicPortfolioMoversDto } from './dto/query-public-portfolio-movers.dto';
import { QueryPortfolioRoiCompareDto } from './dto/query-portfolio-roi-compare.dto';
import { AddAssetDto } from './dto/add-asset.dto';
import { UpdateAssetDto, UpdateAssetOrderDto } from './dto/update-asset.dto';
import { Roles } from 'src/auth/role.decorator';
import { JwtAuthGuard } from 'src/auth/jwt.auth.guard';
import { Request } from 'express';
import { ShareTypes } from './model/portfolio.model';
import { ChartTypes } from 'src/analytics/models/chart.model';

@Controller('portfolio')
export class PortfolioController {
    constructor(private readonly portfolioService: PortfolioService) { }

    @Roles("any")
    @UseGuards(JwtAuthGuard)
    @Post()
    create(@Body() dto: CreatePortfolioDto, @Req() req: Request) {
        return this.portfolioService.create(dto, req.user._id);
    }

    @Roles("any")
    @UseGuards(JwtAuthGuard)
    @Put('/:id')
    update(@Param('id') id: string, @Body() dto: CreatePortfolioDto, @Req() req: Request) {
        return this.portfolioService.update(id, dto, req.user._id);
    }


    @Roles("any")
    @UseGuards(JwtAuthGuard)
    @Get()
    getAll(@Req() req: Request) {
        return this.portfolioService.getUserPortfolios(req.user._id);
    }

    @Roles("any")
    @UseGuards(JwtAuthGuard)
    @Get('stats/:portfolioId/:chartType')
    async getPortfolioChart(
        @Param('portfolioId') portfolioId: string,
        @Param('chartType') chartType: ChartTypes,
        @Req() req: Request,
    ) {
        const userId = req.user._id;
        return this.portfolioService.getPortfolioChart(portfolioId, chartType, userId);
    }


    @Roles("any")
    @UseGuards(JwtAuthGuard)
    @Get('assets/:id')
    getPortfolioAssets(@Param('id') portfolioId: string, @Req() req: Request) {
        return this.portfolioService.getPortfolioAssets(portfolioId, req.user._id);
    }

    @Roles("any")
    @UseGuards(JwtAuthGuard)
    @Get('movers/:id')
    getPortfolioMovers(@Param('id') portfolioId: string, @Req() req: Request) {
        return this.portfolioService.getPortfolioMovers(portfolioId, req.user._id);
    }

    @Get('share/:code')
    async getSharedPortfolio(
        @Param('code') code: string
    ) {
        return this.portfolioService.getPortfolioByCode(code);
    }

    @Get('public/search')
    async searchPublicPortfolios(
        @Query('query') query?: string,
        @Query('limit') limit?: string,
    ): Promise<any> {
        return this.portfolioService.searchPublicPortfolios(query, limit);
    }

    @Get('public/movers')
    async getPublicPortfolioMovers(@Query() query: QueryPublicPortfolioMoversDto) {
        return this.portfolioService.getPublicPortfolioMovers(query);
    }

    @Get('public/user/:userId')
    async getPublicPortfolioByUserId(@Param('userId') userId: string) {
        return this.portfolioService.getPublicPortfolioByUserId(userId);
    }

    @Get('public/compare-roi')
    async getPublicPortfolioRoiCompare(@Query() query: QueryPortfolioRoiCompareDto) {
        return this.portfolioService.getPublicPortfolioRoiCompare(query);
    }

    @Get('public/:portfolioId/stats/:chartType')
    async getPublicPortfolioChart(
        @Param('portfolioId') portfolioId: string,
        @Param('chartType') chartType: ChartTypes,
    ) {
        return this.portfolioService.getPublicPortfolioChart(portfolioId, chartType);
    }

    @Get('public/:portfolioId/assets')
    async getPublicPortfolioAssets(@Param('portfolioId') portfolioId: string) {
        return this.portfolioService.getPublicPortfolioAssets(portfolioId);
    }

    @Get('public/:portfolioId/transactions')
    async getPublicPortfolioTransactions(@Param('portfolioId') portfolioId: string) {
        return this.portfolioService.getPublicPortfolioTransactions(portfolioId);
    }

    @Get('battle-board')
    async getBattleBoard(@Query() query: QueryBattleBoardDto) {
        return this.portfolioService.getBattleBoard(query);
    }

    @Roles("any")
    @UseGuards(JwtAuthGuard)
    @Get(':id')
    getOne(@Param('id') id: string, @Req() req) {
        return this.portfolioService.getOne(id, req.user._id);
    }

    @Roles("any")
    @UseGuards(JwtAuthGuard)
    @Delete(':id')
    delete(@Param('id') id: string, @Req() req) {
        return this.portfolioService.delete(id, req.user._id);
    }

    @Roles("any")
    @UseGuards(JwtAuthGuard)
    @Post('assets')
    addAsset(@Body() dto: AddAssetDto, @Req() req: Request, @Query('id') id: string | undefined) {
        return this.portfolioService.addAsset(id, dto, req.user._id);
    }

    @Roles("any")
    @UseGuards(JwtAuthGuard)
    @Patch('assets/reorder')
    async updateAssetOrder(
        @Body() dto: UpdateAssetOrderDto,
        @Req() req: Request
    ) {
        return this.portfolioService.reorderAssetsBulk(dto.portfolioId, dto.assets, req.user._id);
    }

    @Roles("any")
    @UseGuards(JwtAuthGuard)
    @Delete('assets/:id')
    removeAssets(
        @Param('id') id: string,
        @Body() body: { projectIds: string[] },
        @Req() req: Request
    ) {
        return this.portfolioService.removeAssets(id, body.projectIds, req.user._id);
    }

    @Roles("any")
    @UseGuards(JwtAuthGuard)
    @Get(':id/stats')
    stats(@Param('id') id: string, @Req() req) {
        return this.portfolioService.stats(id, req.user._id);
    }

    @Roles("any")
    @UseGuards(JwtAuthGuard)
    @Get(':id/history')
    history(@Param('id') id: string, @Req() req) {
        return this.portfolioService.getOne(id, req.user._id).then(p => p.history);
    }

    @Roles("any")
    @UseGuards(JwtAuthGuard)
    @Post('/duplicate/:id')
    duplicate(@Param('id') id: string, @Req() req: Request) {
        return this.portfolioService.duplicate(id, req.user._id);
    }

    @Roles("any")
    @UseGuards(JwtAuthGuard)
    @Post('toggle-battle')
    async toggleBattle(@Body() dto: ToggleBattleDto, @Req() req) {
        return this.portfolioService.toggleBattle(dto.portfolioId, req.user._id, dto.state);
    }

    @Roles("any")
    @UseGuards(JwtAuthGuard)
    @Patch(':id/share')
    async toggleShare(
        @Param('id') id: string,
        @Req() req: Request,
        @Body() body: { isShare: boolean; shareType?: ShareTypes }
    ) {
        return this.portfolioService.toggleShare(id, req.user._id, body.isShare, body.shareType);
    }

    @Roles("any")
    @UseGuards(JwtAuthGuard)
    @Get('transactions/:id')
    async getPortfolioTransactions(
        @Param('id') portfolioId: string,
        @Req() req: any
    ) {
        return this.portfolioService.getPortfolioTransactions(portfolioId, req.user._id);
    }
}
