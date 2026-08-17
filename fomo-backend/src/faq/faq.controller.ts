import { Controller,Get,Post,Put,Delete,Req, UseGuards, Body, Param } from '@nestjs/common';
import { JwtAuthGuard } from 'src/auth/jwt.auth.guard';
import { Roles } from 'src/auth/role.decorator';
import { FaqService } from './faq.service';
import { FaqDto } from './dto/faq.dto';

@Controller('faq')
export class FaqController {
    constructor(
        private readonly faqService : FaqService
    ){}

    @Get()
    getFagItems() : Promise<Array<FaqDto>>{
        return this.faqService.getFaqItems()
    }

    @Roles('admin,moderator')
    @UseGuards(JwtAuthGuard)
    @Post()
    createFagItem(@Body() body : FaqDto) : Promise<FaqDto>{
        return this.faqService.createFaqItem(body)
    }

    @Roles('admin,moderator')
    @UseGuards(JwtAuthGuard)
    @Put('/:id')
    updateFagItem(@Param('id') id : string,@Body() body : FaqDto) : Promise<FaqDto>{
        return this.faqService.updateFaqItem(id,body)
    }

    @Roles('admin,moderator')
    @UseGuards(JwtAuthGuard)
    @Delete('/:id')
    deleteFagItem(@Param('id') id : string) : Promise<FaqDto>{
        return this.faqService.deleteFaqItem(id)
    }
}
