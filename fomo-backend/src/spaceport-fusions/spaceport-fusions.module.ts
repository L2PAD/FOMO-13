import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import {
  SpaceportFusion,
  SpaceportFusionSchema,
} from './model/spaceport-fusion.model';
import { SpaceportFusionsController } from './spaceport-fusions.controller';
import { SpaceportFusionsService } from './spaceport-fusions.service';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: SpaceportFusion.name, schema: SpaceportFusionSchema },
    ]),
  ],
  controllers: [SpaceportFusionsController],
  providers: [SpaceportFusionsService],
  exports: [SpaceportFusionsService],
})
export class SpaceportFusionsModule {}
