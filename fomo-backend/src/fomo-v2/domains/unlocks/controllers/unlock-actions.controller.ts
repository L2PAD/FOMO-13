import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Post,
  Query,
  Req,
  UseGuards,
} from "@nestjs/common";
import { Request } from "express";
import { JwtAuthGuard } from "src/auth/jwt.auth.guard";
import { Roles } from "src/auth/role.decorator";
import {
  FomoV2UnlockCalendarActionDto,
  FomoV2UnlockIdParamDto,
  FomoV2UnlockReminderActionDto,
  FomoV2UnlockUserActionsQueryDto,
} from "../dto";
import { FomoV2UnlockActionsService } from "../services";

@Controller("fomo-v2/unlocks")
export class FomoV2UnlockActionsController {
  constructor(
    private readonly unlockActionsService: FomoV2UnlockActionsService
  ) {}

  @Roles("any")
  @UseGuards(JwtAuthGuard)
  @Get("user-actions")
  async getUserActions(
    @Req() req: Request,
    @Query() query: FomoV2UnlockUserActionsQueryDto,
  ): Promise<
    Record<
      string,
      { inCalendar: boolean; reminderEnabled: boolean; notifyAt?: string }
    >
  > {
    return this.unlockActionsService.getUserActions(req.user._id, query.ids);
  }

  @Roles("any")
  @UseGuards(JwtAuthGuard)
  @Post(":unlockId/calendar")
  async addUnlockToCalendar(
    @Req() req: Request,
    @Param() params: FomoV2UnlockIdParamDto,
    @Body() body: FomoV2UnlockCalendarActionDto,
  ) {
    return this.unlockActionsService.addUnlockToCalendar(
      req.user._id,
      params.unlockId,
      body,
    );
  }

  @Roles("any")
  @UseGuards(JwtAuthGuard)
  @Delete(":unlockId/calendar")
  async removeUnlockFromCalendar(
    @Req() req: Request,
    @Param() params: FomoV2UnlockIdParamDto,
  ) {
    return this.unlockActionsService.removeUnlockFromCalendar(
      req.user._id,
      params.unlockId,
    );
  }

  @Roles("any")
  @UseGuards(JwtAuthGuard)
  @Post(":unlockId/reminder")
  async enableUnlockReminder(
    @Req() req: Request,
    @Param() params: FomoV2UnlockIdParamDto,
    @Body() body: FomoV2UnlockReminderActionDto,
  ) {
    return this.unlockActionsService.enableUnlockReminder(
      req.user._id,
      params.unlockId,
      body,
    );
  }

  @Roles("any")
  @UseGuards(JwtAuthGuard)
  @Delete(":unlockId/reminder")
  async disableUnlockReminder(
    @Req() req: Request,
    @Param() params: FomoV2UnlockIdParamDto,
  ) {
    return this.unlockActionsService.disableUnlockReminder(
      req.user._id,
      params.unlockId,
    );
  }
}
