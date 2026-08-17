import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { MetadataModule } from 'src/metadata/metadata.module';
import {
  SpaceportOpening,
  SpaceportOpeningSchema,
} from './model/spaceport-opening.model';
import { SpaceportOpeningsController } from './spaceport-openings.controller';
import { SpaceportOpeningsService } from './spaceport-openings.service';

@Module({
  imports: [
    MetadataModule,
    MongooseModule.forFeature([
      {
        name: SpaceportOpening.name,
        schema: SpaceportOpeningSchema,
      },
    ]),
  ],
  controllers: [SpaceportOpeningsController],
  providers: [SpaceportOpeningsService],
  exports: [SpaceportOpeningsService],
})
export class SpaceportOpeningsModule {}
