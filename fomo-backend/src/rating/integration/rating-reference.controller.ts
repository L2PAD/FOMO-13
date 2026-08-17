import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Put,
  Req,
  UseGuards,
} from "@nestjs/common";
import { Request } from "express";
import { JwtAuthGuard } from "src/auth/jwt.auth.guard";
import { Roles } from "src/auth/role.decorator";
import { CurrentRatingAdminGuard } from "../current-rating-admin.guard";
import { RatingReferenceService } from "./rating-reference.service";
import { RatingRecalculationQueueService } from "./rating-recalculation-queue.service";
import { RatingCanonicalService } from "../unified/rating-canonical.service";

/** Admin CRUD for the rating reference directories (Phase 2). */
@Controller("admin/ratings/references")
@Roles("admin")
@UseGuards(JwtAuthGuard)
export class RatingReferenceController {
  constructor(
    private readonly references: RatingReferenceService,
    private readonly queue: RatingRecalculationQueueService,
    private readonly canonical: RatingCanonicalService
  ) {}

  @Get()
  catalogs() {
    return { catalogs: this.references.catalogs() };
  }

  @Get(":catalog")
  list(@Param("catalog") catalog: string) {
    return this.references.list(catalog);
  }

  @Put(":catalog/:code")
  @UseGuards(CurrentRatingAdminGuard)
  async upsert(
    @Param("catalog") catalog: string,
    @Param("code") code: string,
    @Body() body: any,
    @Req() req: Request
  ) {
    const adminId = String((req as any).user?._id || (req as any).user?.id || "");
    const saved = await this.references.upsert(catalog, code, body, adminId);
    // React: reload canonical config (e.g. resilience criteria) + enqueue recalc.
    await this.canonical.refresh().catch(() => undefined);
    const affected = await this.queue.enqueueAffectedByCatalog(catalog).catch(() => null);
    return { ...(saved as any), affected };
  }

  @Delete(":catalog/:code")
  @UseGuards(CurrentRatingAdminGuard)
  async remove(@Param("catalog") catalog: string, @Param("code") code: string) {
    const res = await this.references.remove(catalog, code);
    await this.canonical.refresh().catch(() => undefined);
    const affected = await this.queue.enqueueAffectedByCatalog(catalog).catch(() => null);
    return { ...(res as any), affected };
  }
}
