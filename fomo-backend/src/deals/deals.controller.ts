import { Body, Controller, Delete, Get, Param, Patch, Post, Put, Query, Req, UseGuards } from '@nestjs/common';
import { Request } from 'express';
import { JwtAuthGuard } from 'src/auth/jwt.auth.guard';
import { Roles } from 'src/auth/role.decorator';
import { Deal, DealAction, DealDocument, DealSection, DealStatus, DealType } from './model/deal.model';
import { CreateDealDto } from './dto/create-deal.dto';
import { CreateAppealDto } from './dto/create-appeal.dto';
import { ResolveAppealDto } from './dto/resolve-appeal.dto';
import { DealsService } from './deals.service';
import { FormDataRequest, MemoryStoredFile } from 'nestjs-form-data';
import { LimitGuard } from 'src/limits/limit.guard';
import { Limits } from 'src/limits/limit.decorator';
import { CreatePaymentMethodDto } from './dto/create-payment-method.dto';

@Controller('deals')
export class DealsController {
    constructor(
        private readonly dealsService: DealsService
    ) { }

    @Roles('any')
    @UseGuards(JwtAuthGuard)
    @Get('promoted/:type')
    async getPromotedDealsList(
        @Req() req: Request,
        @Param('type') type: DealType | 'all',
        @Query() query: Record<string, string | undefined>,
    ): Promise<{ deals: Array<Deal>, total: number }> {
        const userId: string = req.user._id;
        return this.dealsService.getPromotedDeals(
            query.offset ? parseInt(query.offset, 10) : 0,
            query.limit ? parseInt(query.limit, 10) : 10,
            { userId }
        );
    }

    @Roles('any')
    @UseGuards(JwtAuthGuard)
    @Get('payment-methods')
    async getPaymentMethods(@Req() req: Request) {
        const userId: string = req.user._id;
        return this.dealsService.getPaymentMethods(userId);
    }

    @Roles('any')
    @UseGuards(JwtAuthGuard)
    @Post('payment-methods')
    async createPaymentMethod(@Req() req: Request, @Body() dto: CreatePaymentMethodDto) {
        const userId: string = req.user._id;
        return this.dealsService.createPaymentMethod(userId, dto);
    }

    @Roles('any')
    @UseGuards(JwtAuthGuard)
    @Delete('payment-methods/:id')
    async deletePaymentMethod(@Req() req: Request, @Param('id') id: string) {
        const userId: string = req.user._id;
        return this.dealsService.deletePaymentMethod(userId, id);
    }

    @Roles('any')
    @UseGuards(JwtAuthGuard)
    @Get('item/:id')
    async getDealById(@Req() req: Request, @Param('id') id: string) {
        const userId: string = req.user._id;
        return this.dealsService.getDealById(id, userId);
    }

    @Roles('any')
    @UseGuards(JwtAuthGuard)
    @Post('statuses')
    async getDealsStatuses(@Body() body: { ids?: string[] }) {
        return this.dealsService.getDealsStatuses(body?.ids || []);
    }

    @Roles('admin,moderator')
    @UseGuards(JwtAuthGuard)
    @Get('admin/item/:id')
    async getDealByIdForStaff(@Param('id') id: string) {
        return this.dealsService.getDealByIdForStaff(id);
    }

    @Roles('any')
    @UseGuards(JwtAuthGuard)
    @Get('member/:id')
    async getMemberById(@Param('id') id: string) {
        return this.dealsService.getMemberById(id);
    }

    @Roles('any')
    @UseGuards(JwtAuthGuard)
    @Get('promote/current/:section')
    async getPromoted(@Param('section') section: DealSection): Promise<DealDocument> {
        return this.dealsService.getCurrentPromotedDeal(section);
    }

    @Roles('any')
    @UseGuards(JwtAuthGuard)
    @Get('otc/:type')
    async getOtcDealsList(
        @Req() req: Request,
        @Param('type') type: DealType | 'all',
        @Query() query: Record<string, string | undefined>,
    ): Promise<{ deals: Array<Deal>, total: number }> {
        const parsedLimit = parseInt(query.limit || '10', 10);
        const parsedOffset = parseInt(query.offset || '0', 10);
        const userId: string = req.user._id;

        const filters: Record<string, any> = {};

        const queryKeys: Record<string, (value: string) => any> = {
            serviceType: (value) => value.split(','),
            userStatus: (value) => value.split(','),
            isRealAsset: (value) => value.split(','),
            dealStatus: (value) => value.split(','),
            tickers: (value) => value.split(','),
            risk: (value) => value.split(','),
            dealId: (value) => value,
            searchValue: (value) => value,
            startDate: (value) => new Date(value),
            endDate: (value) => new Date(value),
            minPriceEth: (value) => parseFloat(value),
            maxPriceEth: (value) => parseFloat(value),
            minPriceUsdc: (value) => parseFloat(value),
            maxPriceUsdc: (value) => parseFloat(value),
            minAmount: (value) => parseFloat(value),
            maxAmount: (value) => parseFloat(value),
            minRating: (value) => parseFloat(value),
            maxRating: (value) => parseFloat(value),
            sortField: (value) => value,
            userDeals: (value) => value,
        };

        for (const [key, transformer] of Object.entries(queryKeys)) {
            if (query[key]) {
                filters[key] = transformer(query[key]!);
            }
        }

        filters.userId = userId;

        if (filters.userDeals) {
            return this.dealsService.getUserDealList(type, userId, parsedLimit, parsedOffset, filters);
        }

        filters.section = 'otc'
        return this.dealsService.getDealList(type, parsedLimit, parsedOffset, filters);
    }

    @Roles('any')
    @UseGuards(JwtAuthGuard)
    @Get('p2p/:type')
    async getP2PDealsList(
        @Req() req: Request,
        @Param('type') type: DealType | 'all',
        @Query() query: Record<string, string | undefined>,
    ): Promise<{ deals: Array<Deal>, total: number }> {
        const parsedLimit = parseInt(query.limit || '10', 10);
        const parsedOffset = parseInt(query.offset || '0', 10);
        const userId: string = req.user._id;

        const filters: Record<string, any> = {};

        const queryKeys: Record<string, (value: string) => any> = {
            serviceType: (value) => value.split(','),
            userStatus: (value) => value.split(','),
            movingTokens: (value) => value.split(','),
            dealStatus: (value) => value.split(','),
            tickers: (value) => value.split(','),
            risk: (value) => value.split(','),
            paymentMethods: (value) => value.split(','),
            dealId: (value) => value,
            searchValue: (value) => value,
            startDate: (value) => new Date(value),
            endDate: (value) => new Date(value),
            minPriceEth: (value) => parseFloat(value),
            maxPriceEth: (value) => parseFloat(value),
            minPriceUsdc: (value) => parseFloat(value),
            maxPriceUsdc: (value) => parseFloat(value),
            minAmount: (value) => parseFloat(value),
            maxAmount: (value) => parseFloat(value),
            minRating: (value) => parseFloat(value),
            maxRating: (value) => parseFloat(value),
            transactionAmount: (value) => parseFloat(value),
            sortField: (value) => value,
            userDeals: (value) => value,
            currency: (value) => value,
        };

        for (const [key, transformer] of Object.entries(queryKeys)) {
            if (query[key]) {
                filters[key] = transformer(query[key]!);
            }
        }

        filters.userId = userId;

        if (filters.userDeals) {
            return this.dealsService.getUserDealList(type, userId, parsedLimit, parsedOffset, filters);
        }

        filters.section = 'p2p'
        return this.dealsService.getDealList(type, parsedLimit, parsedOffset, filters);
    }

    @Roles('any')
    @UseGuards(JwtAuthGuard)
    @Get('otc/all/members')
    async getMembersStats(
        @Query() query: Record<string, string | undefined>,
        @Query('limit') limit: string = '10',
        @Query('offset') offset: string = '0',

    ) {
        const filters: Record<string, any> = {};

        const parsedLimit = parseInt(limit, 10) || 10;
        const parsedOffset = parseInt(offset, 10) || 0;

        const queryKeys: Record<string, (value: string) => any> = {
            userStatus: (value) => value.split(','),
            risk: (value) => value.split(','),
            searchValue: (value) => value,
            completedDealsMin: (value) => parseFloat(value),
            completedDealsMax: (value) => parseFloat(value),
            salesMin: (value) => parseFloat(value),
            salesMax: (value) => parseFloat(value),
            purchasesMin: (value) => parseFloat(value),
            purchasesMax: (value) => parseFloat(value),
            sortField: (value) => value,
            memberId: (value) => value,
        };

        for (const [key, transformer] of Object.entries(queryKeys)) {
            if (query[key]) {
                filters[key] = transformer(query[key]!);
            }
        }

        const sortBy: 'deals-desc' | 'purchases-desc' | 'sales-desc' | 'all' = filters.sortField || 'all'

        return this.dealsService.getAllMembers(parsedLimit, parsedOffset, filters, sortBy);
    }

    @Roles('any')
    @UseGuards(JwtAuthGuard)
    @Get('bazaar-activity')
    async getBazaarActivity(@Req() req: Request) {
        const userId: string = req.user._id

        return this.dealsService.getUserBazaarActivity(userId);
    }

    @Roles('any')
    @UseGuards(JwtAuthGuard)
    @Get('user')
    async getUserStatistics(
        @Req() req: Request
    ) {
        const userId: string = req.user._id

        return this.dealsService.getUserStatistics(userId);
    }

    // @Roles('any')
    // @UseGuards(JwtAuthGuard)
    // @Get('otc/all/comments')


    @Roles('any')
    @UseGuards(JwtAuthGuard)
    @Post()
    async createDeal(@Req() req: Request): Promise<Deal> {
        const id: string = req.user._id
        const data: CreateDealDto = req.body

        return this.dealsService.createDeal({
            ...data,
            creator: id
        })
    }

    @Roles('any')
    @UseGuards(JwtAuthGuard)
    @Post('/offer/:dealId')
    async createOffer(@Req() req: Request): Promise<Deal> {
        const id: string = req.user._id
        const data: CreateDealDto = req.body
        const dealId: string = req.params.dealId

        return this.dealsService.createOffer(dealId, {
            ...data,
            creator: id
        })
    }

    @Roles('admin')
    @UseGuards(JwtAuthGuard)
    @Post('/complete/forcedly/:dealId')
    async completeByAdmin(@Req() req: Request): Promise<Deal> {
        const dealId: string = req.params.dealId

        return this.dealsService.completeByAdmin(dealId, String(req.user?._id || ''))
    }

    @Roles('any')
    @UseGuards(JwtAuthGuard)
    @Put('/block/:id')
    async blockDeal(@Req() req: Request, @Query('dealIdSmart') dealIdSmart?: string): Promise<Deal> {
        const id: string = req.user._id
        const dealId: string = req.params.id
        const parsedDealIdSmart = dealIdSmart ? Number(dealIdSmart) : undefined;

        return this.dealsService.blockDeal(id, dealId, parsedDealIdSmart)
    }

    @Roles('any')
    @UseGuards(JwtAuthGuard)
    @Put('/block/:action/:id')
    async updateBlockedDeal(@Req() req: Request): Promise<Deal> {
        const id: string = req.user._id
        const dealId: string = req.params.id
        const action: DealAction = req.params.action === 'confirm' ? 'confirm' : 'reject'

        return this.dealsService.updateBlockedDeal(id, dealId, action)
    }

    @Roles('any')
    @UseGuards(JwtAuthGuard)
    @Put('/close/:id')
    async closeDeal(@Req() req: Request): Promise<Deal> {
        const id: string = req.user._id
        const dealId: string = req.params.id

        return this.dealsService.closeDeal(dealId, id)
    }

    @Roles('any')
    @UseGuards(JwtAuthGuard)
    @Put('/reserve/:id')
    async reserveFunds(@Req() req: Request): Promise<Deal> {
        const id: string = req.user._id
        const dealId: string = req.params.id

        return this.dealsService.reserveFunds(dealId, id)
    }

    @Roles('any')
    @UseGuards(JwtAuthGuard)
    @Put('/mark-payment/:id')
    async markPaymentMade(@Req() req: Request): Promise<Deal> {
        const id: string = req.user._id
        const dealId: string = req.params.id

        return this.dealsService.markPaymentMade(dealId, id)
    }

    @Roles('any')
    @UseGuards(JwtAuthGuard)
    @Put('/return/:id')
    async returnReservedP2PSellFunds(@Req() req: Request): Promise<Deal> {
        const id: string = req.user._id
        const dealId: string = req.params.id

        return this.dealsService.returnReservedP2PSellFunds(dealId, id)
    }

    @Roles('any')
    @UseGuards(JwtAuthGuard)
    @Patch('/p2p/start/:id')
    async startDealP2P2(@Req() req: Request): Promise<Deal> {
        const id: string = req.user._id
        const dealId: string = req.params.id

        return this.dealsService.startDealP2P(dealId, id)
    }

    @Roles('any')
    @UseGuards(JwtAuthGuard)
    @Put('feedback/:type/:id')
    async addFeedback(
        @Req() req: Request,
        @Body() body: { text: string },
        @Param('id') dealId: string,
        @Param('type') type: 'like' | 'dislike',
    ) {
        if (!['like', 'dislike'].includes(type)) {
            throw new Error('Invalid feedback type');
        }

        const userId = req.user._id

        return this.dealsService.addFeedback(dealId, userId, type, body.text)
    }

    @Roles('any')
    @UseGuards(JwtAuthGuard)
    @Patch('confirm/sell/:id')
    async confirmSell(
        @Req() req: Request,
        @Param('id') id: string,
        @Body() body: { dealId?: number; paymentMethods?: string[] },
    ) {
        const userId = req.user._id

        return this.dealsService.updateDealSmartID(id, userId, body || {})
    }

    @Roles('any')
    @UseGuards(JwtAuthGuard)
    @Post('appeal/:id')
    async createAppeal(
        @Req() req: Request,
        @Param('id') dealId: string,
        @Body() dto: CreateAppealDto,
    ) {
        const userId = req.user._id;
        return this.dealsService.createAppeal(dealId, userId, dto);
    }

    @Roles('admin')
    @UseGuards(JwtAuthGuard)
    @Post('admin/seed-demo')
    async seedDemoDisputes() {
        return this.dealsService.seedDemoDisputes();
    }

    @Roles('admin')
    @UseGuards(JwtAuthGuard)
    @Post('admin/reset-demo')
    async resetDemoDisputes() {
        return this.dealsService.resetDemoDisputes();
    }

    @Roles('admin,moderator')
    @UseGuards(JwtAuthGuard)
    @Get('admin/market-stats')
    async getMarketStats() {
        return this.dealsService.getMarketStats();
    }

    @Roles('admin,moderator')
    @UseGuards(JwtAuthGuard)
    @Get('admin/contracts-health')
    async getContractsHealth(@Query('dataMode') dataMode: 'demo' | 'production') {
        return this.dealsService.getContractsHealth(dataMode === 'production' ? 'production' : 'demo');
    }

    @Roles('admin,moderator')
    @UseGuards(JwtAuthGuard)
    @Get('admin/p2p-stats')
    async getP2PStats() {
        return this.dealsService.getP2PStats();
    }

    @Roles('admin,moderator')
    @UseGuards(JwtAuthGuard)
    @Get('appeals')
    async getAppealsForStaff(
        @Query('limit') limit: string = '20',
        @Query('offset') offset: string = '0',
        @Query('status') status: 'open' | 'in_review' | 'resolved' | 'all' = 'open',
    ) {
        const parsedLimit = parseInt(limit, 10) || 20;
        const parsedOffset = parseInt(offset, 10) || 0;

        return this.dealsService.getAppealsForStaff(parsedLimit, parsedOffset, status);
    }

    @Roles('admin,moderator')
    @UseGuards(JwtAuthGuard)
    @Post('appeal/support-chat/:id')
    async createAppealSupportChat(
        @Req() req: Request,
        @Param('id') appealId: string,
    ) {
        const userId = req.user._id;
        return this.dealsService.createAppealSupportChat(appealId, userId);
    }

    @Roles('admin,moderator')
    @UseGuards(JwtAuthGuard)
    @Post('appeal/resolve/:id')
    async resolveAppeal(
        @Req() req: Request,
        @Param('id') appealId: string,
        @Body() dto: ResolveAppealDto,
    ) {
        const userId = req.user._id;
        return this.dealsService.resolveAppeal(appealId, userId, dto || {});
    }

    @Roles('any')
    @UseGuards(JwtAuthGuard)
    @Patch('reaction/:type/:id')
    async addReaction(
        @Req() req: Request,
        @Param('id') dealId: string,
        @Param('type') type: 'like' | 'dislike',
    ) {
        if (!['like', 'dislike'].includes(type)) {
            throw new Error('Invalid feedback type');
        }

        const userId = req.user._id

        return (
            type === 'like'
                ?
                this.dealsService.updateLikes(dealId, userId)
                :
                this.dealsService.updateDislikes(dealId, userId)
        )
    }

    @Roles('any')
    @UseGuards(JwtAuthGuard)
    @Post('pin/:dealId')
    async pinDeal(
        @Param('dealId') dealId: string,
        @Req() req: Request,
    ) {
        const userId = req.user._id

        return this.dealsService.pinDeal(userId, dealId);
    }

    @Roles('any')
    @UseGuards(JwtAuthGuard)
    @Post('unpin/:dealId')
    async unpinDeal(
        @Param('dealId') dealId: string,
        @Req() req: Request,
    ) {
        const userId = req.user._id

        return this.dealsService.unpinDeal(userId, dealId);
    }

    @Roles('any')
    @Limits("shareLimit")
    @UseGuards(JwtAuthGuard, LimitGuard)
    @Post('upload-screenshot')
    @FormDataRequest()
    async uploadScreenshot(
        @Body('file') file: MemoryStoredFile,
        @Req() req: Request,
    ) {
        return this.dealsService.uploadScreenshotBuffer(
            file.buffer,
            file.originalName,
            req.user._id
        );
    }
}
