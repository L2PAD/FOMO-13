import { Global, Module } from "@nestjs/common";
import { UnifiedRatingConfigService } from "./unified-rating-config.service";
import { RatingCanonicalService } from "./rating-canonical.service";

/**
 * GLOBAL provider of the canonical rating source so any module whose services
 * (RatingService, FundsRatingService, PersonsRatingService, ...) delegate their
 * score to the unified engine can inject `RatingCanonicalService` without every
 * consumer module having to wire the dependency manually.
 */
@Global()
@Module({
  providers: [UnifiedRatingConfigService, RatingCanonicalService],
  exports: [UnifiedRatingConfigService, RatingCanonicalService],
})
export class RatingCanonicalModule {}
