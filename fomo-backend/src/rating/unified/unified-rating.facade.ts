import { Injectable } from "@nestjs/common";
import { UnifiedRatingConfigService } from "./unified-rating-config.service";
import {
  calculateByEntity,
  calculateFundScore,
  calculatePersonScore,
  calculateProjectScore,
  calculateTradeReputation,
  calculateTwitterScore,
  calculateUserScore,
} from "./unified-rating.engine";
import { UnifiedScoreResult } from "./unified-rating.types";

/**
 * Canonical rating source. All rating consumers should ultimately resolve their
 * scores through this facade so there is a single source of truth. Legacy
 * RatingService will be reimplemented as a thin adapter on top of these methods
 * (see /app/memory/RATING_MIGRATION_MAP.md).
 */
@Injectable()
export class UnifiedRatingFacade {
  constructor(private readonly configService: UnifiedRatingConfigService) {}

  private async config() {
    return (await this.configService.getSnapshot()).config;
  }

  async fund(input: any): Promise<UnifiedScoreResult> {
    const config = await this.config();
    return calculateFundScore(input, config.funds, config.subFormulas);
  }

  async person(input: any): Promise<UnifiedScoreResult> {
    const config = await this.config();
    return calculatePersonScore(input, config.persons, config.twitter, config.subFormulas);
  }

  async project(input: any): Promise<UnifiedScoreResult> {
    const config = await this.config();
    return calculateProjectScore(input, config.projects, config.twitter, config.subFormulas);
  }

  async twitter(input: any): Promise<UnifiedScoreResult> {
    const config = await this.config();
    return calculateTwitterScore(input, config.twitter, config.subFormulas);
  }

  async user(input: any): Promise<UnifiedScoreResult> {
    return calculateUserScore(input, (await this.config()).users);
  }

  async tradeReputation(otc: any, p2p: any) {
    return calculateTradeReputation(otc, p2p, (await this.config()).users.trade);
  }

  async byEntity(entityType: string, input: any): Promise<UnifiedScoreResult> {
    return calculateByEntity(entityType, input, await this.config());
  }
}
