import { Body, Controller, Get, Param, Post, Query } from '@nestjs/common';
import { CreateSpaceportOpeningDto } from './dto/create-spaceport-opening.dto';
import { SpaceportOpeningsService } from './spaceport-openings.service';

@Controller('spaceport-openings')
export class SpaceportOpeningsController {
  constructor(
    private readonly spaceportOpeningsService: SpaceportOpeningsService,
  ) {}

  @Post()
  async create(@Body() dto: CreateSpaceportOpeningDto) {
    return await this.spaceportOpeningsService.create(dto);
  }

  @Get('wallet/:walletAddress')
  async getWalletOpenings(
    @Param('walletAddress') walletAddress: string,
    @Query('nftAddress') nftAddress?: string,
  ) {
    return await this.spaceportOpeningsService.getWalletOpenings(
      walletAddress,
      nftAddress,
    );
  }
}
