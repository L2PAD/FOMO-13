import { Body, Controller, Delete, Get, Param, Post, Query, Req, UseGuards } from "@nestjs/common";
import { TokenUnlocksService } from "./token-unlocks.service";
import { TokenUnlock } from "./models/token-unlock.model";
import { TokenUnlocksIntelSyncService } from "./token-unlocks-intel-sync.service";
import { Roles } from "src/auth/role.decorator";
import { JwtAuthGuard } from "src/auth/jwt.auth.guard";
import { Request } from "express";
import { ProjectIntelInternalSyncGuard } from "src/projects/intel-sync/project-intel-internal-sync.guard";
import { IntelSyncWorkerRunnerService } from "src/intel-sync/intel-sync-worker-runner.service";

@Controller("token-unlocks")
export class TokenUnlocksController {
  constructor(
    private readonly tokenUnlocksService: TokenUnlocksService,
    private readonly tokenUnlocksIntelSyncService: TokenUnlocksIntelSyncService,
    private readonly intelSyncWorkerRunnerService: IntelSyncWorkerRunnerService,
  ) {}

  @Get("categories")
  async getTokenUnlockCategories(@Query() query: any): Promise<{
    categories: Array<{ key: string; label: string; count: number }>;
  }> {
    return this.tokenUnlocksService.getTokenUnlockCategories(query);
  }

  @Roles("any")
  @UseGuards(JwtAuthGuard)
  @Get("user-actions")
  async getUserActions(
    @Req() req: Request,
    @Query("ids") ids: string | string[],
  ): Promise<Record<string, { inCalendar: boolean; reminderEnabled: boolean; notifyAt?: string }>> {
    const userId: string = req.user._id;

    return this.tokenUnlocksService.getUserActions(userId, ids);
  }

  @Get()
  async getTokenUnlocks(@Query() query: any): Promise<{
    total: number;
    totalCount: number;
    unlocks: TokenUnlock[];
    allocations: any[];
  }> {
    const result = await this.tokenUnlocksService.getTokenUnlocks(query);

    return {
      ...result,
      total: result.totalCount,
    };
  }

  @Roles("any")
  @UseGuards(JwtAuthGuard)
  @Post(":unlockId/calendar")
  async addUnlockToCalendar(
    @Req() req: Request,
    @Param("unlockId") unlockId: string,
    @Body() body: { notifyEnabled?: boolean; notifyBeforeMinutes?: number },
  ) {
    const userId: string = req.user._id;

    return this.tokenUnlocksService.addUnlockToCalendar(userId, unlockId, body);
  }

  @Roles("any")
  @UseGuards(JwtAuthGuard)
  @Delete(":unlockId/calendar")
  async removeUnlockFromCalendar(
    @Req() req: Request,
    @Param("unlockId") unlockId: string,
  ) {
    const userId: string = req.user._id;

    return this.tokenUnlocksService.removeUnlockFromCalendar(userId, unlockId);
  }

  @Roles("any")
  @UseGuards(JwtAuthGuard)
  @Post(":unlockId/reminder")
  async enableUnlockReminder(
    @Req() req: Request,
    @Param("unlockId") unlockId: string,
    @Body() body: { notifyBeforeMinutes?: number },
  ) {
    const userId: string = req.user._id;

    return this.tokenUnlocksService.enableUnlockReminder(userId, unlockId, body);
  }

  @Roles("any")
  @UseGuards(JwtAuthGuard)
  @Delete(":unlockId/reminder")
  async disableUnlockReminder(
    @Req() req: Request,
    @Param("unlockId") unlockId: string,
  ) {
    const userId: string = req.user._id;

    return this.tokenUnlocksService.disableUnlockReminder(userId, unlockId);
  }

  @Roles("admin")
  @UseGuards(ProjectIntelInternalSyncGuard)
  @Post("sync/intel")
  async syncIntelUnlocks(
    @Body() body: Record<string, any> = {},
    @Query() query: Record<string, any> = {},
  ): Promise<any> {
    const force = this.isTruthy(query.force ?? body.force ?? false);
    if (!force) {
      return this.intelSyncWorkerRunnerService.runJob("token-unlocks-intel-unlocks", "manual");
    }

    return this.tokenUnlocksIntelSyncService.executeSyncFromIntelUnlocks("manual", { force: true });
  }

  private isTruthy(value: any): boolean {
    return ["1", "true", "yes", "on"].includes(String(value ?? "").trim().toLowerCase());
  }
}
