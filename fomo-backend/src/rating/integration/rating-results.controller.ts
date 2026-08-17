import { Controller, Get, Param, Post, Query, UseGuards } from "@nestjs/common";
import { JwtAuthGuard } from "src/auth/jwt.auth.guard";
import { Roles } from "src/auth/role.decorator";
import { RatingResultsService } from "./rating-results.service";
import { RatingIngestionService } from "./rating-ingestion.service";

/**
 * Read + recalculate the stored (current/historical) rating results. Recalc
 * recomputes from the LATEST stored input snapshot (no raw ID guesswork), writes
 * a new result version and returns before/after + provenance.
 */
@Controller("ratings")
@Roles("admin")
@UseGuards(JwtAuthGuard)
export class RatingResultsController {
  constructor(
    private readonly results: RatingResultsService,
    private readonly ingestion: RatingIngestionService
  ) {}

  @Get(":entityType/:id")
  current(@Param("entityType") entityType: string, @Param("id") id: string) {
    return this.results.current(entityType, id);
  }

  @Get(":entityType/:id/history")
  history(
    @Param("entityType") entityType: string,
    @Param("id") id: string,
    @Query("limit") limit?: string
  ) {
    return this.results.history(entityType, id, limit ? Number(limit) : 50);
  }

  @Post(":entityType/:id/recalculate")
  recalculate(@Param("entityType") entityType: string, @Param("id") id: string) {
    return this.ingestion.recomputeFromLatestSnapshot(entityType, id);
  }
}
