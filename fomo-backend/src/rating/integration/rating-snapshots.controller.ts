import { Controller, Get, HttpCode, Param, Post, Query, UseGuards } from "@nestjs/common";
import { JwtAuthGuard } from "src/auth/jwt.auth.guard";
import { Roles } from "src/auth/role.decorator";
import { RatingInputSnapshotService } from "./rating-input-snapshot.service";
import { RatingResultsService } from "./rating-results.service";
import { RatingIngestionService } from "./rating-ingestion.service";

/**
 * Admin Snapshot Explorer: inspect the RAW ingested rating input snapshots
 * (entity/source/mode/freshness/validation/checksum/idempotencyKey/payload),
 * see the related current rating result, recompute from a snapshot, and compare
 * two snapshots.
 */
@Controller("admin/ratings/snapshots")
@Roles("admin")
@UseGuards(JwtAuthGuard)
export class RatingSnapshotsController {
  constructor(
    private readonly snapshots: RatingInputSnapshotService,
    private readonly results: RatingResultsService,
    private readonly ingestion: RatingIngestionService
  ) {}

  @Get()
  list(
    @Query("entityType") entityType?: string,
    @Query("entityId") entityId?: string,
    @Query("source") source?: string,
    @Query("validationStatus") validationStatus?: string,
    @Query("from") from?: string,
    @Query("to") to?: string,
    @Query("limit") limit?: string,
    @Query("skip") skip?: string
  ) {
    return this.snapshots.list({
      entityType,
      entityId,
      source,
      validationStatus,
      from,
      to,
      limit: limit ? Number(limit) : undefined,
      skip: skip ? Number(skip) : undefined,
    });
  }

  @Get("sources")
  sources() {
    return this.snapshots.sources();
  }

  @Get(":id")
  async detail(@Param("id") id: string) {
    const snapshot = await this.snapshots.byId(id);
    if (!snapshot) return { snapshot: null, currentResult: null };
    const currentResult = await this.results.current(
      snapshot.entityType,
      snapshot.entityId
    );
    return { snapshot, currentResult };
  }

  @Post(":id/recalculate")
  @HttpCode(200)
  recalculate(@Param("id") id: string) {
    return this.ingestion.recomputeFromSnapshotId(id);
  }

  @Get("compare/:a/:b")
  async compare(@Param("a") a: string, @Param("b") b: string) {
    const [left, right] = await Promise.all([
      this.snapshots.byId(a),
      this.snapshots.byId(b),
    ]);
    return { left, right };
  }
}
