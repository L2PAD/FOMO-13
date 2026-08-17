import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import {
  SpaceportStakingEvent,
  SpaceportStakingEventSchema,
} from './model/spaceport-staking-event.model';
import { SpaceportStakingController } from './spaceport-staking.controller';
import { SpaceportStakingService } from './spaceport-staking.service';

@Module({
  imports: [
    MongooseModule.forFeature([
      {
        name: SpaceportStakingEvent.name,
        schema: SpaceportStakingEventSchema,
      },
    ]),
  ],
  controllers: [SpaceportStakingController],
  providers: [SpaceportStakingService],
  exports: [SpaceportStakingService],
})
export class SpaceportStakingModule {}
