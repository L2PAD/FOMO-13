import { Controller, Get, Param } from '@nestjs/common';
import { SpaceportNftService } from './spaceport-nft.service';

@Controller('spaceport-nft')
export class SpaceportNftController {
  constructor(private readonly spaceportNftService: SpaceportNftService) {}

  @Get('wallet/:walletAddress/count')
  async getWalletNftCount(@Param('walletAddress') walletAddress: string) {
    return this.spaceportNftService.getWalletNftCount(walletAddress);
  }
}
