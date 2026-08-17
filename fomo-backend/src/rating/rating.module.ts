import { Module } from "@nestjs/common";
import { JwtModule } from "@nestjs/jwt";
import { ConfigModule } from "@nestjs/config";
import { MongooseModule } from "@nestjs/mongoose";
import { FundsRatingService } from "src/funds/funds-rating.service";
import { RatingConfigService } from "./rating-config.service";
import { RatingController } from "./rating.controller";
import { RatingFormulaService } from "./rating-formula.service";
import { RatingRecalculationService } from "./rating-recalculation.service";
import { RatingSchedulerService } from "./rating-scheduler.service";
import { RatingService } from "./rating.service";
import { RatingConfig, RatingConfigSchema } from "./models/rating-config.model";
import { CurrentRatingAdminGuard } from "./current-rating-admin.guard";
import { UnifiedRatingController } from "./unified/unified-rating.controller";
import { UnifiedRatingConfigService } from "./unified/unified-rating-config.service";
import { UnifiedRatingRecalculationService } from "./unified/unified-rating-recalculation.service";
import { UnifiedRatingFacade } from "./unified/unified-rating.facade";
import { RatingInputSnapshotService } from "./integration/rating-input-snapshot.service";
import { RatingReferenceService } from "./integration/rating-reference.service";
import { RatingIngestionService } from "./integration/rating-ingestion.service";
import { RatingResultsService } from "./integration/rating-results.service";
import { RatingServiceTokenGuard } from "./integration/rating-service-token.guard";
import { RatingIngestionController } from "./integration/rating-ingestion.controller";
import { RatingReferenceController } from "./integration/rating-reference.controller";
import { RatingResultsController } from "./integration/rating-results.controller";
import { RatingSnapshotsController } from "./integration/rating-snapshots.controller";
import { RatingRecalcJobsController } from "./integration/rating-recalc-jobs.controller";
import { RatingRecalculationQueueService } from "./integration/rating-recalculation-queue.service";

@Module({
  imports: [
    ConfigModule,
    JwtModule.register({}),
    MongooseModule.forFeature([
      { name: RatingConfig.name, schema: RatingConfigSchema },
    ]),
  ],
  controllers: [
    RatingController,
    UnifiedRatingController,
    RatingIngestionController,
    RatingReferenceController,
    RatingResultsController,
    RatingSnapshotsController,
    RatingRecalcJobsController,
  ],
  providers: [
    RatingService,
    FundsRatingService,
    RatingConfigService,
    RatingFormulaService,
    RatingRecalculationService,
    RatingSchedulerService,
    CurrentRatingAdminGuard,
    UnifiedRatingConfigService,
    UnifiedRatingRecalculationService,
    UnifiedRatingFacade,
    RatingInputSnapshotService,
    RatingReferenceService,
    RatingIngestionService,
    RatingResultsService,
    RatingServiceTokenGuard,
    RatingRecalculationQueueService,
  ],
  exports: [RatingService, UnifiedRatingFacade],
})
export class RatingModule {}
