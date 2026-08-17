import { Controller, Post, Body, UseGuards } from '@nestjs/common';
import { SearchService } from './search.service';
import { SearchDto } from './dto/search.dto';
import { Roles } from 'src/auth/role.decorator';
import { JwtWalletGuard } from 'src/auth/jwt.wallet.guard';

@Controller('search')
export class SearchController {
  constructor(
    private readonly searchService: SearchService
  ) {}


  @Post()
  async search(@Body() searchDto: SearchDto) {
    return await this.searchService.search(searchDto);
  }
}