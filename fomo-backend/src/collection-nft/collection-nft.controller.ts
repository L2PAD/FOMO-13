import { Body, Controller, Delete, Get, Param, Patch, Post, Query, Req, UseGuards } from '@nestjs/common';
import { Request } from 'express';
import { JwtAuthGuard } from 'src/auth/jwt.auth.guard';
import { Roles } from 'src/auth/role.decorator';
import { CollectionNftDto } from './dto/collection-nft.dto';
import { CompleteCollectionNftCheckoutDto } from './dto/complete-checkout.dto';
import { CollectionNftService } from './collection-nft.service';

@Controller('collectionNft')
export class CollectionNftController {
    constructor(
        private readonly collectionNftService : CollectionNftService
    ){}

    @Roles('admin,moderator')
    @UseGuards(JwtAuthGuard)
    @Get('/admin/stats')
    getAdminNftStats() {
        return this.collectionNftService.getAdminNftStats()
    }

    @Get('/market')
    getMarketNfts(
        @Query() query: Record<string, any>
    ): Promise<{ nfts: Array<any>; total: number; page: number; limit: number }> {
        return this.collectionNftService.getMarketNfts(query)
    }

    @Get('/market/sync')
    syncMarketNfts(
        @Query() query: Record<string, any>
    ): Promise<{
        mode: 'full' | 'statuses'
        nfts: Array<any>
        total: number
        page: number
        limit: number
        statuses: Array<{ _id: string; isActive: boolean }>
        missingIds: Array<string>
        inactiveIds: Array<string>
    }> {
        return this.collectionNftService.syncMarketNfts(query)
    }

    @Get('/stats/:address')
    getCollectionStatsByAddress(
        @Param('address') address: string,
        @Query('currency') currency?: string,
    ): Promise<any> {
        return this.collectionNftService.getCollectionStatsByAddress(address, currency)
    }

    @Get('/floor/:address/:nftId')
    getNftFloorPrice(
        @Param('address') address: string,
        @Param('nftId') nftId: string,
        @Query('currency') currency?: string,
    ): Promise<any> {
        return this.collectionNftService.getNftFloorPriceByAddress(address, nftId, currency)
    }

    @Roles('any')
    @UseGuards(JwtAuthGuard)
    @Get('/my-deals')
    getMyNftMarketplaceDeals(
        @Req() req: Request,
        @Query('limit') limit: string = '10',
        @Query('offset') offset: string = '0',
    ) {
        const userId: string = req.user._id

        return this.collectionNftService.getUserMarketplaceDeals(
            userId,
            parseInt(limit, 10) || 10,
            parseInt(offset, 10) || 0,
        )
    }

    @Get('/:id')
    getNft(@Param('id') id : string){
        return this.collectionNftService.getNftData(id)
    }

    @Roles('any')
    @UseGuards(JwtAuthGuard)
    @Post('/view/:id')
    addNftView(
        @Req() req: Request,
        @Param('id') id: string
    ) {
        const userId: string = req.user._id

        return this.collectionNftService.addView(id, userId)
    }

    @Roles('any')
    @UseGuards(JwtAuthGuard)
    @Post()
    addNftToCollection(
        @Req() req : Request
    ){
        const userId : string = req.user._id 
        const body : CollectionNftDto = req.body

        return this.collectionNftService.addNftToCollection({...body,ownerId:userId})
    }

    @Roles('any')
    @UseGuards(JwtAuthGuard)
    @Post('/checkout')
    completeCheckout(
        @Req() req : Request,
        @Body() body: CompleteCollectionNftCheckoutDto,
    ){
        const userId : string = req.user._id

        return this.collectionNftService.completeCheckout(userId, body)
    }

    @Roles('any')
    @UseGuards(JwtAuthGuard)
    @Delete('/:id')
    removeListNft(
        @Param('id') id : string
    ){
        return this.collectionNftService.removeNftFromCollection(id)
    }

    @Roles('any')
    @UseGuards(JwtAuthGuard)
    @Patch('/finalize')
    finalizeNftSale(
        @Body() body: { tokenAddress: string; nftId: number }
    ){
        return this.collectionNftService.finalizeNftSale(body?.tokenAddress, body?.nftId)
    }
}
