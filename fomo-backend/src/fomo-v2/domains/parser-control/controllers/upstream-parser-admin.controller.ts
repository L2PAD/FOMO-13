import {
  Body,
  Controller,
  Get,
  HttpCode,
  Param,
  Post,
  Patch,
  Query,
  Req,
  UseGuards,
} from "@nestjs/common";
import { Request } from "express";
import { JwtAuthGuard } from "src/auth/jwt.auth.guard";
import { Roles } from "src/auth/role.decorator";
import {
  ImportParserSnapshotDto,
  ListUpstreamRunsQueryDto,
  StartUpstreamParserRunDto,
  UpdateUpstreamAutoImportPolicyDto,
  UpdateUpstreamParserDto,
} from "../dto/parser-control.dto";
import { FomoV2UpstreamParserOrchestrationService } from "../services/upstream-parser-orchestration.service";

@Controller("admin-data-sync")
@Roles("admin")
@UseGuards(JwtAuthGuard)
export class FomoV2UpstreamParserAdminController {
  constructor(
    private readonly orchestration: FomoV2UpstreamParserOrchestrationService
  ) {}

  @Get("upstream-parsers")
  dashboard() {
    return this.orchestration.dashboard();
  }

  @Post("upstream-parsers/:parserKey/runs")
  @HttpCode(202)
  startRun(
    @Req() req: Request,
    @Param("parserKey") parserKey: string,
    @Body() body: StartUpstreamParserRunDto
  ) {
    return this.orchestration.startRun(this.adminId(req), parserKey, body);
  }

  @Patch("upstream-parsers/:parserKey")
  updateParser(
    @Param("parserKey") parserKey: string,
    @Body() body: UpdateUpstreamParserDto
  ) {
    return this.orchestration.updateParser(parserKey, body);
  }

  @Patch("upstream-parsers/:parserKey/import-policy")
  updateImportPolicy(
    @Req() req: Request,
    @Param("parserKey") parserKey: string,
    @Body() body: UpdateUpstreamAutoImportPolicyDto
  ) {
    return this.orchestration.updateAutoImportPolicy(
      this.adminId(req),
      parserKey,
      body
    );
  }

  @Get("upstream-runs")
  listRuns(@Query() query: ListUpstreamRunsQueryDto) {
    return this.orchestration.listRuns(query.limit, query.parserKey);
  }

  @Get("upstream-runs/:runId")
  getRun(@Param("runId") runId: string) {
    return this.orchestration.getRun(runId);
  }

  @Post("upstream-runs/:runId/pause")
  pause(@Param("runId") runId: string) {
    return this.orchestration.controlRun(runId, "pause");
  }

  @Post("upstream-runs/:runId/resume")
  resume(@Param("runId") runId: string) {
    return this.orchestration.controlRun(runId, "resume");
  }

  @Post("upstream-runs/:runId/cancel")
  cancel(@Param("runId") runId: string) {
    return this.orchestration.controlRun(runId, "cancel");
  }

  @Post("parser-snapshots/:snapshotId/imports")
  @HttpCode(202)
  importSnapshot(
    @Req() req: Request,
    @Param("snapshotId") snapshotId: string,
    @Body() body: ImportParserSnapshotDto
  ) {
    return this.orchestration.importSnapshot(
      this.adminId(req),
      snapshotId,
      body
    );
  }

  private adminId(req: Request): string {
    return String(req.user?._id || req.user?.id || "");
  }
}
