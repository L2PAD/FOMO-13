import { Body, Controller, Get, Param, Post, Query } from '@nestjs/common';
import { CreateSpaceportStakingEventDto } from './dto/create-spaceport-staking-event.dto';
import { SpaceportStakingService } from './spaceport-staking.service';

@Controller('spaceport-staking')
export class SpaceportStakingController {
  constructor(
    private readonly spaceportStakingService: SpaceportStakingService,
  ) {}

  @Post()
  async create(@Body() createDto: CreateSpaceportStakingEventDto) {
    return await this.spaceportStakingService.create(createDto);
  }

  @Get('wallet/:walletAddress')
  async getWalletHistory(
    @Param('walletAddress') walletAddress: string,
    @Query('tokenIds') tokenIds?: string,
  ) {
    return await this.spaceportStakingService.getWalletHistory(
      walletAddress,
      this.spaceportStakingService.parseTokenIds(tokenIds),
    );
  }
}
