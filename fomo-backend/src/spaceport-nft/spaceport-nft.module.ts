import { Module } from '@nestjs/common';
import { SpaceportNftController } from './spaceport-nft.controller';
import { SpaceportNftService } from './spaceport-nft.service';

@Module({
  controllers: [SpaceportNftController],
  providers: [SpaceportNftService],
  exports: [SpaceportNftService],
})
export class SpaceportNftModule {}
