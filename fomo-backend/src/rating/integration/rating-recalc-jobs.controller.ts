import { Body, Controller, Get, Post, Query, UseGuards } from "@nestjs/common";
import { JwtAuthGuard } from "src/auth/jwt.auth.guard";
import { Roles } from "src/auth/role.decorator";
import { RatingRecalculationQueueService } from "./rating-recalculation-queue.service";

/** Admin view + manual control of the rating recalculation queue. */
@Controller("admin/ratings/recalc-jobs")
@Roles("admin")
@UseGuards(JwtAuthGuard)
export class RatingRecalcJobsController {
  constructor(private readonly queue: RatingRecalculationQueueService) {}

  @Get()
  list(
    @Query("status") status?: string,
    @Query("entityType") entityType?: string,
    @Query("limit") limit?: string
  ) {
    return this.queue.list({ status, entityType, limit: limit ? Number(limit) : undefined });
  }

  @Get("stats")
  stats() {
    return this.queue.stats();
  }

  @Post("enqueue")
  enqueue(@Body() body: { entityType: string; entityId: string; reason?: string }) {
    return this.queue.enqueue(body.entityType, body.entityId, body.reason || "manual");
  }

  @Post("process")
  process(@Body() body: { limit?: number }) {
    return this.queue.processOnce(body?.limit || 25);
  }
}
