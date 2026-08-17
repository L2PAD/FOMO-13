import { Controller,Get,Post,Put,Delete,UseGuards, Param, Body} from '@nestjs/common';
import { FormDataRequest } from 'nestjs-form-data';
import { JwtAuthGuard } from 'src/auth/jwt.auth.guard';
import { Banner } from './models/banner.model';
import { BannerService } from './banner.service';
import { Roles } from 'src/auth/role.decorator';
import { BannerDto } from './dto/banner.dto';

@Controller('banner')
export class BannerController {
    constructor(
        private readonly bannerService: BannerService,
    ){}
    
    @Get('/:page')
    getBanners(@Param('page') page : string) : Promise<Array<Banner>> {
        return this.bannerService.getBanners(page)
    }

    @Roles('admin')
    @UseGuards(JwtAuthGuard)
    @Post('')
    @FormDataRequest()
    createBanner(@Body() bannerData : BannerDto) : Promise<Banner> {
        return this.bannerService.createBanner(bannerData)
    }

    @Roles('admin')
    @UseGuards(JwtAuthGuard)
    @Put('/:id')
    @FormDataRequest()
    updateBanner(@Param('id') id : string,@Body() bannerData : BannerDto) : Promise<Banner> {
        return this.bannerService.updateBanner(id,bannerData)
    }

    @Roles('admin')
    @UseGuards(JwtAuthGuard)
    @Delete('/:id')
    deleteBanner(@Param('id') id : string) : Promise<Banner> {
        return this.bannerService.deleteBanner(id)
    }
}
