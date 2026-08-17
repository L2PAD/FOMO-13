import { Controller, Get, Post, UseGuards , Body, HttpStatus} from '@nestjs/common';
import { LayoutService } from './layout.service';
import { LayoutDto } from './dto/layout.dto';
import { Roles } from 'src/auth/role.decorator';
import { JwtAuthGuard } from 'src/auth/jwt.auth.guard';
import { FooterDto } from './dto/footer.dto';
import { SocialMediaDto } from './dto/socialmedia.dto';
import { BannerDto } from './dto/banner.dto';
import { IntelDto } from './dto/intel.dto';
import { Layout } from './models/layout.model';

@Controller('layout')
export class LayoutController {
    constructor(
        private readonly layoutService : LayoutService 
    ){}

    @Get()
    async getLayout() : Promise<LayoutDto> {
        return await this.layoutService.getLayout()
    }

    @Get('socialmedia')
    async getSocialMedia() : Promise<SocialMediaDto> {
        return this.layoutService.getSocialMedia()
    }

    @Roles('admin')
    @UseGuards(JwtAuthGuard)
    @Post()
    async editFooter(@Body() footer : FooterDto) : Promise<FooterDto> { 
        return this.layoutService.editFooter(footer)
    }

    @Roles('admin')
    @UseGuards(JwtAuthGuard)
    @Post('banner')
    async editBanner(@Body() banner : BannerDto) : Promise<BannerDto> { 
        return this.layoutService.editBanner(banner)
    }

    @Roles('admin')
    @UseGuards(JwtAuthGuard)
    @Post('intel')
    async editIntel(@Body() intel : IntelDto) : Promise<{ intelUrl: string }> {
        return this.layoutService.editIntel(intel.intelUrl)
    }

    @Roles('admin')
    @UseGuards(JwtAuthGuard)
    @Post('promo')
    async editPromo(@Body() promo : any) : Promise<any> {
        return this.layoutService.editPromo(promo)
    }

    @Roles('admin')
    @UseGuards(JwtAuthGuard)
    @Post('socialmedia')
    async editSocialMedia(@Body() socialMedia : SocialMediaDto) : Promise<SocialMediaDto> { 
        return this.layoutService.editSocialMedia(socialMedia)
    }
}
