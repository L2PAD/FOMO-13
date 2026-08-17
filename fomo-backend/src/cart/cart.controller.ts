import { Controller, Delete, Get, Post, Req, UseGuards } from '@nestjs/common';
import { CartService } from './cart.service';
import { Roles } from 'src/auth/role.decorator';
import { JwtAuthGuard } from 'src/auth/jwt.auth.guard';
import { Request } from 'express';

@Controller('cart')
export class CartController {
    constructor(
        private readonly cartService : CartService
    ){}

    @Roles('any')
    @UseGuards(JwtAuthGuard)
    @Get('')
    getCartData(
        @Req() req : Request
    ){
        const ownerId : string = req.user._id 

        return this.cartService.getUserCart(ownerId)
    }

    @Roles('any')
    @UseGuards(JwtAuthGuard)
    @Post('/:itemId')
    addNftToCart(
        @Req() req : Request
    ){
        const ownerId : string = req.user._id 
        const nftId : string = req.params.itemId
        const data : {ownerId:string,nftId:string} = {ownerId,nftId}

        return this.cartService.addNft(data)
    }
    
    @Roles('any')
    @UseGuards(JwtAuthGuard)
    @Delete('/:itemId')
    removeNftFromCart(
        @Req() req : Request
    ){
        const ownerId : string = req.user._id 
        const nftId : string = req.params.itemId
        const data : {ownerId:string,nftId:string} = {ownerId,nftId}

        return this.cartService.removeNft(data)
    }
}
