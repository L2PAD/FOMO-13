import {
  Body,
  BadGatewayException,
  Controller,
  Get,
  HttpCode,
  Param,
  Patch,
  Post,
  Query,
  Req,
  UseGuards,
} from "@nestjs/common";
import { Request } from "express";
import { JwtAuthGuard } from "src/auth/jwt.auth.guard";
import { Roles } from "src/auth/role.decorator";
import {
  RunFomoV2ParserDto,
  UpdateFomoV2ParserControlDto,
  UpdateFomoV2ParserGlobalControlDto,
} from "../dto/parser-control.dto";
import { FomoV2ParserControlService } from "../services/parser-control.service";
import { FomoV2ParserControlWorkerService } from "../services/parser-control-worker.service";
import { FomoV2UpstreamParserOrchestrationService } from "../services/upstream-parser-orchestration.service";

@Controller("admin-data-sync/parsers")
@Roles("admin")
@UseGuards(JwtAuthGuard)
export class FomoV2ParserControlAdminController {
  constructor(
    private readonly control: FomoV2ParserControlService,
    private readonly worker: FomoV2ParserControlWorkerService,
    private readonly upstream: FomoV2UpstreamParserOrchestrationService
  ) {}

  @Get()
  getSnapshot() {
    return this.control.getSnapshot();
  }

  @Get("runs")
  listRuns(
    @Query("limit") limit?: string,
    @Query("parserKey") parserKey?: string
  ) {
    return this.control.listRuns(Number(limit) || 20, parserKey);
  }

  @Patch("global")
  async updateGlobal(
    @Req() req: Request,
    @Body() body: UpdateFomoV2ParserGlobalControlDto
  ) {
    const result = await this.control.updateGlobal(
      this.adminId(req),
      body || {}
    );
    this.worker.wake();
    if (body.enabled === false || body.mode !== undefined) {
      const upstreamPause = await this.upstream.pauseAllForGlobalOff();
      if (!upstreamPause.connected || upstreamPause.failures?.length) {
        throw new BadGatewayException({
          message:
            "Local global parser state was applied, but apiintel parser safety pause was not fully applied.",
          localApplied: true,
          localState: result,
          upstreamPause,
        });
      }
      return { ...result, upstreamPause };
    }
    return result;
  }

  @Patch(":parserKey")
  updateParser(
    @Req() req: Request,
    @Param("parserKey") parserKey: string,
    @Body() body: UpdateFomoV2ParserControlDto
  ) {
    return this.control.updateParser(this.adminId(req), parserKey, body || {});
  }

  @Post(":parserKey/run")
  @HttpCode(202)
  async runParser(
    @Req() req: Request,
    @Param("parserKey") parserKey: string,
    @Body() body: RunFomoV2ParserDto
  ) {
    const run = await this.control.queueManualRun(
      this.adminId(req),
      parserKey,
      body.mode,
      body.limit
    );
    this.worker.wake();
    return run;
  }

  private adminId(req: Request): string {
    return String(req.user?._id || req.user?.id || "");
  }
}
