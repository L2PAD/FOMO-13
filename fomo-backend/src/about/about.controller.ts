import {Get,Post,Delete,Put,Controller,Body,Param,UseGuards,HttpCode,HttpStatus} from '@nestjs/common';
import { FormDataRequest } from 'nestjs-form-data';
import { Roles } from 'src/auth/role.decorator';
import { JwtAuthGuard } from 'src/auth/jwt.auth.guard';
import { AboutService } from './about.service';
import { AddPartnerDto } from './dto/add-partner.dto';
import { PartnerDto } from './dto/partner.dto';
import { MemberDto } from './dto/member.dto';
import { AddMemberDto } from './dto/add-member.dto';
import { AboutDto } from './dto/about.dto';
import { EditAboutDto } from './dto/edit-about.dto';

@Controller('about')
export class AboutController {
    constructor(
        private readonly aboutService : AboutService
    ){}

    @Get()
    async getAbout() : Promise<AboutDto>{
        return await this.aboutService.getAbout()
    }

    @Roles('admin')
    @UseGuards(JwtAuthGuard)
    @Put()
    @FormDataRequest()
    @HttpCode(HttpStatus.CREATED)
    async editAbout(@Body() body : {text:string}) : Promise<EditAboutDto> {
        return await this.aboutService.editAbout(body.text)
    }

    @Roles('admin')
    @UseGuards(JwtAuthGuard)
    @Post('member')
    @FormDataRequest()
    @HttpCode(HttpStatus.CREATED)
    async addMember(@Body() member:AddMemberDto) : Promise<MemberDto>{
        return await this.aboutService.addMember(member)
    }

    @Roles('admin')
    @UseGuards(JwtAuthGuard)
    @Put('member/:id')
    @FormDataRequest()
    @HttpCode(HttpStatus.CREATED)
    async editMember(@Param('id') id : string,@Body() member:AddMemberDto) : Promise<MemberDto> {
        return await this.aboutService.editMember(id,member)
    }

    @Roles('admin')
    @UseGuards(JwtAuthGuard)
    @Delete('member/:id')
    @HttpCode(HttpStatus.OK)
    async deleteMember(@Param('id') id : string) : Promise<MemberDto>{
        return await this.aboutService.deleteMember(id)
    }

    @Roles('admin')
    @UseGuards(JwtAuthGuard)
    @Post('team')
    @FormDataRequest()
    @HttpCode(HttpStatus.CREATED)
    async addTeamItem(@Body() team:AddMemberDto) : Promise<MemberDto>{
        return await this.aboutService.addTeamItem(team)
    }

    @Roles('admin')
    @UseGuards(JwtAuthGuard)
    @Put('team/:id')
    @FormDataRequest()
    @HttpCode(HttpStatus.CREATED)
    async editTeamItem(@Param('id') id : string,@Body() team:AddMemberDto) : Promise<MemberDto> {
        return await this.aboutService.editTeamItem(id,team)
    }

    @Roles('admin')
    @UseGuards(JwtAuthGuard)
    @Delete('team/:id')
    @HttpCode(HttpStatus.OK)
    async deleteTeamItem(@Param('id') id : string) : Promise<MemberDto>{
        return await this.aboutService.deleteTeamItem(id)
    }


    @Roles('admin')
    @UseGuards(JwtAuthGuard)
    @Post('partner')
    @FormDataRequest()
    @HttpCode(HttpStatus.CREATED)
    async addPartner(@Body() partner:AddPartnerDto) : Promise<PartnerDto> {
        return await this.aboutService.addPartner(partner)
    }

    @Roles('admin')
    @UseGuards(JwtAuthGuard)
    @Put('partner/:id')
    @FormDataRequest()
    @HttpCode(HttpStatus.CREATED)
    async editPartner(@Param('id') id : string,@Body() partner:AddPartnerDto) : Promise<PartnerDto> {
        return await this.aboutService.editPartner(id,partner)
    }

    @Roles('admin')
    @UseGuards(JwtAuthGuard)
    @Delete('partner/:id')
    @HttpCode(HttpStatus.OK)
    async deletePartner(@Param('id') id : string) : Promise<PartnerDto> {
        return await this.aboutService.deletePartner(id)
    }

}
