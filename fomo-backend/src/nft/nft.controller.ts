import { UseGuards, Controller, Get, Post,Put, Body, Patch, Param, Delete, HttpCode, HttpStatus} from '@nestjs/common';
import { NftService } from './nft.service';
import { FormDataRequest } from 'nestjs-form-data/dist/decorators';
import { Roles } from 'src/auth/role.decorator';
import { JwtAuthGuard } from 'src/auth/jwt.auth.guard';
import { CreateNftDto } from './dto/create-nft.dto';
import commentDto from 'src/comments/dto/comment.dto';

@Controller('nft')
export class NftController {
    constructor(
        private readonly nftService:NftService
      ){}
    
      @Get()
      getNft():Promise<Array<any>>{
        return this.nftService.getNft();
      }
    
      @Roles('moderator')
      @UseGuards(JwtAuthGuard)
      @Get('moderator')
      getModeratorNft():Promise<Array<any>> {
        return this.nftService.getModeratorNft();
      }
    
      @Roles('admin')
      @UseGuards(JwtAuthGuard)
      @Get('admin')
      getAdminNft():Promise<Array<any>>{
        return this.nftService.getAdminNft()
      }
    
      @Roles('admin')
      @UseGuards(JwtAuthGuard)
      @Post()
      @FormDataRequest()
      @HttpCode(HttpStatus.CREATED)
      createNft(@Body() createNftDto:CreateNftDto){
        return this.nftService.createNft(createNftDto)
      }

      @Roles('moderator')
      @UseGuards(JwtAuthGuard)
      @Post(':initiator')
      @FormDataRequest()
      @HttpCode(HttpStatus.CREATED)
      createNftByModerator(@Body() createNftDto:CreateNftDto,@Param('initiator') initiator:string){
        return this.nftService.createNftByModerator(createNftDto,initiator)
      }
    
      @Roles('admin')
      @UseGuards(JwtAuthGuard)
      @Put(':id')
      @FormDataRequest()
      updateNft(@Body() updateNftDto:CreateNftDto,@Param('id') id:string){
        return this.nftService.editNft(id,updateNftDto)
      }

      @Roles('any')
      @UseGuards(JwtAuthGuard)
      @Post('comment/:id')
      addComment(@Param('id') id:string,@Body() body){
        const comment: commentDto = body
        return this.nftService.addComment(id,comment)
      }
    
      @Roles('admin')
      @UseGuards(JwtAuthGuard)
      @Delete('comment/:id/:comment')
      removeComment(@Param() params){
        const {id,comment} = params
        return this.nftService.removeComment(id,comment)
      }

      @Roles('admin')
      @UseGuards(JwtAuthGuard)
      @Delete(':id')
      removeProject(@Param() params){
        const {id} = params
        return this.nftService.removeProject(id)
      }
    
      @Roles('admin')
      @UseGuards(JwtAuthGuard)
      @Patch(':id')
      changeRedStatus(@Param() params){
        const {id} = params
        return this.nftService.toggleRedStatus(id)
      }
    
      @Roles('admin')
      @UseGuards(JwtAuthGuard)
      @Patch('/:status/:id')
      changeStatus(@Param() params){
        const {id,status}:{id:string,status:string} = params
        return this.nftService.changeStatus(id,status)
      }
}
