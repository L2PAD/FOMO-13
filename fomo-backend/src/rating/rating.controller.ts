import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Put,
  Post,
  Req,
  UseGuards,
} from "@nestjs/common";
import { Request } from "express";
import { JwtAuthGuard } from "src/auth/jwt.auth.guard";
import { Roles } from "src/auth/role.decorator";
import { RatingConfigService } from "./rating-config.service";
import { RatingRecalculationService } from "./rating-recalculation.service";
import { RatingSchedulerService } from "./rating-scheduler.service";
import { RATING_ENTITY_TYPES } from "./rating.types";
import { CurrentRatingAdminGuard } from "./current-rating-admin.guard";

@Controller("admin/ratings")
@Roles("admin")
@UseGuards(JwtAuthGuard)
export class RatingController {
  constructor(
    private readonly configService: RatingConfigService,
    private readonly recalculationService: RatingRecalculationService,
    private readonly schedulerService: RatingSchedulerService
  ) {}

  @Get("config")
  getConfig() {
    return this.configResponse();
  }

  @Put("config")
  @UseGuards(CurrentRatingAdminGuard)
  async updateConfig(@Req() req: Request, @Body() body: any) {
    await this.configService.save(body || {}, this.adminId(req));
    await this.schedulerService.reload();
    return this.configResponse();
  }

  @Get("status")
  async getStatus() {
    const document = await this.configService.getDocument();
    return {
      entities: this.runtimeResponse(document?.runtime),
      schedulerAvailable: this.schedulerService.isAvailable(),
    };
  }

  @Post("recalculate")
  @UseGuards(CurrentRatingAdminGuard)
  @HttpCode(HttpStatus.ACCEPTED)
  recalculate(@Body() body: { entityType?: string }) {
    return this.recalculationService.start(body?.entityType, "manual");
  }

  private async configResponse() {
    const [document, snapshot] = await Promise.all([
      this.configService.getDocument(),
      this.configService.getSnapshot(),
    ]);
    return {
      version: snapshot.version,
      updatedAt: snapshot.updatedAt,
      updatedBy: document?.updatedBy || "",
      entities: snapshot.entities,
      runtime: this.runtimeResponse(document?.runtime),
      schedulerAvailable: this.schedulerService.isAvailable(),
      catalog: this.configService.getCatalog(),
    };
  }

  private runtimeResponse(runtime: any) {
    return Object.fromEntries(
      RATING_ENTITY_TYPES.map((entityType) => [
        entityType,
        {
          ...this.configService.normalizeRuntime(runtime?.[entityType]),
          nextRunAt: this.schedulerService.nextRunAt(entityType),
        },
      ])
    );
  }

  private adminId(req: Request): string {
    return String(req.user?._id || req.user?.id || "");
  }
}
