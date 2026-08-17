import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Post,
  Put,
  Query,
  Req,
  UseGuards,
} from "@nestjs/common";
import { Request } from "express";
import { JwtAuthGuard } from "src/auth/jwt.auth.guard";
import { Roles } from "src/auth/role.decorator";
import { CurrentRatingAdminGuard } from "../current-rating-admin.guard";
import { UnifiedRatingConfigService } from "./unified-rating-config.service";
import { UnifiedRatingRecalculationService } from "./unified-rating-recalculation.service";
import { RatingIngestionService } from "../integration/rating-ingestion.service";
import { RatingRecalculationQueueService } from "../integration/rating-recalculation-queue.service";
import { RatingCanonicalService } from "./rating-canonical.service";
import { RATING_ENTITY_TYPES, RATING_SCHEMA_VERSION } from "../integration/rating-raw-dto";
import { buildDefaultUnifiedRatingConfig } from "./unified-rating.defaults";
import { calculateByEntity } from "./unified-rating.engine";
import { UNIFIED_ENTITY_TYPES } from "./unified-rating.types";

@Controller("admin/ratings/unified")
@Roles("admin")
@UseGuards(JwtAuthGuard)
export class UnifiedRatingController {
  constructor(
    private readonly configService: UnifiedRatingConfigService,
    private readonly recalculationService: UnifiedRatingRecalculationService,
    private readonly ingestionService: RatingIngestionService,
    private readonly canonical: RatingCanonicalService,
    private readonly queue: RatingRecalculationQueueService
  ) {}

  @Get("resilience-criteria")
  resilienceCriteria() {
    return { criteria: this.canonical.getResilienceCriteria() };
  }

  @Get("config")
  async getConfig() {
    const snapshot = await this.configService.getSnapshot();
    return {
      version: snapshot.version,
      updatedAt: snapshot.updatedAt,
      updatedBy: snapshot.updatedBy,
      config: snapshot.config,
      runtime: snapshot.runtime,
      entityTypes: UNIFIED_ENTITY_TYPES,
      defaults: buildDefaultUnifiedRatingConfig(),
      formulaVersion: snapshot.config.formulaVersion,
    };
  }

  @Put("config")
  @UseGuards(CurrentRatingAdminGuard)
  async updateConfig(@Req() req: Request, @Body() body: any) {
    await this.configService.save(body || {}, this.adminId(req));
    // React: reload canonical config + mark all rated entities for recalc.
    await this.canonical.refresh().catch(() => undefined);
    await this.queue.enqueueAllAfterConfig().catch(() => undefined);
    return this.getConfig();
  }

  @Get("status")
  async getStatus() {
    const snapshot = await this.configService.getSnapshot();
    return { runtime: snapshot.runtime, version: snapshot.version };
  }

  @Post("recalculate")
  @UseGuards(CurrentRatingAdminGuard)
  @HttpCode(HttpStatus.ACCEPTED)
  recalculate(@Body() body: { entityType?: string; entityId?: string }) {
    return this.recalculationService.start(body?.entityType, body?.entityId);
  }

  @Get("search")
  async search(
    @Query("entityType") entityType: string,
    @Query("q") q: string
  ) {
    return this.recalculationService.search(entityType, q);
  }

  @Post("preview")
  @HttpCode(HttpStatus.OK)
  async preview(
    @Body() body: { entityType?: string; input?: any; config?: any }
  ) {
    const entityType = String(body?.entityType || "");
    const config = body?.config
      ? this.configService.mergeConfig(body.config)
      : (await this.configService.getSnapshot()).config;
    const result = calculateByEntity(entityType, body?.input || {}, config);
    return { entityType, result };
  }

  /**
   * Per-entity preview. Accepts EITHER a raw DTO (`raw`, integration-ready path:
   * normalized via the same adapter as ingestion, returns provenance) OR a
   * direct engine `input` (manual mode). NEVER persists a production result.
   */
  @Post("preview/:entityType")
  @HttpCode(HttpStatus.OK)
  async previewEntity(
    @Param("entityType") entityType: string,
    @Body() body: { raw?: any; input?: any; source?: string; observedAt?: string }
  ) {
    if (!RATING_ENTITY_TYPES.includes(entityType as any)) {
      return { entityType, error: `Unknown entityType "${entityType}"` };
    }
    if (body?.raw !== undefined) {
      const env = {
        source: body.source || "admin-preview",
        observedAt: body.observedAt,
        schemaVersion: RATING_SCHEMA_VERSION,
        payload: body.raw,
      };
      const { input, result, provenance } =
        await this.ingestionService.computeFromEnvelope(entityType, env);
      return { entityType, mode: "raw", input, result, provenance };
    }
    const config = (await this.configService.getSnapshot()).config;
    const input = body?.input || {};
    const result =
      entityType === "trade"
        ? calculateByEntity("users", { otc: input.otc, p2p: input.p2p }, config)
        : calculateByEntity(entityType, input, config);
    return { entityType, mode: "manual", result };
  }

  private adminId(req: Request): string {
    return String((req as any).user?._id || (req as any).user?.id || "");
  }
}
