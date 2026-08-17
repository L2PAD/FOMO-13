import { Body, Controller, Get, Param, Post, Query } from '@nestjs/common';
import { CreateSpaceportFusionDto } from './dto/create-spaceport-fusion.dto';
import { SpaceportFusionsService } from './spaceport-fusions.service';

@Controller('spaceport-fusions')
export class SpaceportFusionsController {
  constructor(
    private readonly spaceportFusionsService: SpaceportFusionsService,
  ) {}

  @Post()
  async create(@Body() dto: CreateSpaceportFusionDto) {
    return await this.spaceportFusionsService.create(dto);
  }

  @Get('wallet/:walletAddress')
  async getWalletHistory(
    @Param('walletAddress') walletAddress: string,
    @Query('nftAddress') nftAddress?: string,
  ) {
    return await this.spaceportFusionsService.getWalletHistory(
      walletAddress,
      nftAddress,
    );
  }
}
