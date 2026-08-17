import { Body, Get,Post,Controller, UseGuards, Req, Patch, Query } from '@nestjs/common';
import { Request } from 'express';
import { Roles } from 'src/auth/role.decorator';
import { OrdersService } from './orders.service';
import { JwtAuthGuard } from 'src/auth/jwt.auth.guard';
import { CreateOrderDto } from './dto/order.dto';

@Controller('orders')
export class OrdersController {
    constructor(
        private readonly ordersService : OrdersService
    ){}

    @Roles('any')
    @UseGuards(JwtAuthGuard)
    @Get('')
    async getUsersOrders(
        @Req() req : Request,
        @Query() query: Record<string, string | undefined>
    ) : Promise<any> {
        const userId : string = req.user._id

        return this.ordersService.getUserOrders(userId, query)
    }

    @Get('active/:id')
    async getNftActiveOrders(
        @Req() req : Request
    ) : Promise<any> {
        const nftId : string = req.params.id

        return this.ordersService.getNftOrders(true,false,nftId)
    }

    @Get('history/:id')
    async getNftOrdersHistory(
        @Req() req : Request
    ) : Promise<any> {
        const nftId : string = req.params.id

        return this.ordersService.getNftOrders(false,false,nftId)
    }
    
    @Roles('any')
    @UseGuards(JwtAuthGuard)
    @Post('')
    async createOrder(
        @Req() req : Request
    ) : Promise<any> {
        const userId : string = req.user._id
        const orderData : CreateOrderDto = req.body 

        return this.ordersService.createOrder({...orderData,userId})
    }

    @Roles('any')
    @UseGuards(JwtAuthGuard)
    @Patch('/confirm/:id')
    async confirmOrder(
        @Req() req : Request,
        @Body() body: { smartOrderId?: number }
    ) : Promise<any> {
        const userId : string = req.user._id
        const orderId : string = req.params.id

        return this.ordersService.confirmOrder(userId,orderId,body?.smartOrderId)
    }
    
    @Roles('any')
    @UseGuards(JwtAuthGuard)
    @Patch('/deactivate/:id')
    async deactivateOrder(
        @Req() req : Request
    ) : Promise<any> {
        const userId : string = req.user._id
        const orderId : string = req.params.id

        return this.ordersService.deactivateOrder(userId,orderId)
    }
}
