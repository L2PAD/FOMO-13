import { UseGuards,Req } from '@nestjs/common';
import { JwtWalletGuard } from 'src/auth/jwt.wallet.guard';
import { Request } from 'express';
import { Controller, Get, Param, Post } from '@nestjs/common';
import { RefService } from './ref.service';
import { JwtAuthGuard } from 'src/auth/jwt.auth.guard';
import { Roles } from 'src/auth/role.decorator';

@Controller('ref')
export class RefController {
    constructor(
        private readonly refService : RefService,
    ){}

    @UseGuards(JwtWalletGuard)
    @Get()
    getRefCode(@Req() req : Request){
        const wallet : string = req.user.wallet 

        return this.refService.getUserRefCode(wallet) 
    }

    @Roles('any')
    @UseGuards(JwtAuthGuard)
    @Get('list/:type')
    getRefList(@Req() req : Request) {
        const id : string = req.user._id 
        const type : 'refLvlOne' | 'refLvlTwo' = req.params.type === 'refLvlOne' ? 'refLvlOne' : 'refLvlTwo'

        return this.refService.getRefList(id,type)
    }    

    @Post('/check/:code')
    checkRefCode(@Param('code') code : string){
        return this.refService.checkUserRefCode(code) 
    }

    // @UseGuards(JwtWalletGuard)
    // @Post('/activate/:code')
    // activateRefCode(@Req() req : Request ){
    //     const code : string = req.params.code
    //     const wallet : string = req.user.wallet 

    //     return this.refService.activateUserRefCode(code,wallet) 
    // }

}
