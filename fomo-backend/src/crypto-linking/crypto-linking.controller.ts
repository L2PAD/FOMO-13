import { Body, Controller, Get, Param, Post, Query, UseGuards } from "@nestjs/common";
import { Throttle } from "@nestjs/throttler";
import { JwtAuthGuard } from "src/auth/jwt.auth.guard";
import { Roles } from "src/auth/role.decorator";
import { CryptoLinkingDiagnosticsService } from "./crypto-linking-diagnostics.service";
import { CryptoEntityLinkerService } from "./services/crypto-entity-linker.service";
import { CryptoLinkingProgressService } from "./services/crypto-linking-progress.service";

@Controller("admin/crypto-linking")
@Roles("admin")
@UseGuards(JwtAuthGuard)
@Throttle({ default: { limit: 20, ttl: 60_000 } })
export class CryptoLinkingController {
  constructor(
    private readonly diagnosticsService: CryptoLinkingDiagnosticsService,
    private readonly linkerService: CryptoEntityLinkerService,
    private readonly progressService: CryptoLinkingProgressService,
  ) {}

  @Get("audit")
  async audit(@Query() query: any = {}) {
    return this.diagnosticsService.audit({ ...query, dryRun: true });
  }

  @Get("project/:id")
  async project(@Param("id") id: string, @Query() query: any = {}) {
    return this.diagnosticsService.auditProject(id, query);
  }

  @Post("dry-run")
  async dryRun(@Query() query: any = {}, @Body() body: any = {}) {
    return this.diagnosticsService.audit({ ...query, ...body, dryRun: true });
  }

  @Post("apply")
  @Throttle({ default: { limit: 5, ttl: 60_000 } })
  async apply(@Query() query: any = {}, @Body() body: any = {}) {
    return this.linkerService.applyProposedUpdates({ ...query, ...body });
  }

  @Post("audit/start")
  @Throttle({ default: { limit: 5, ttl: 60_000 } })
  async startAudit(@Query() query: any = {}, @Body() body: any = {}) {
    const options = { ...query, ...body, dryRun: true };
    const job = this.progressService.createJob("audit", options);
    void this.runAuditJob(job.id, options);
    return job;
  }

  @Post("apply/start")
  @Throttle({ default: { limit: 3, ttl: 60_000 } })
  async startApply(@Query() query: any = {}, @Body() body: any = {}) {
    const options = { ...query, ...body };
    const job = this.progressService.createJob("apply", options);
    void this.runApplyJob(job.id, options);
    return job;
  }

  @Get("progress/:jobId")
  async progress(@Param("jobId") jobId: string) {
    return this.progressService.getJob(jobId);
  }

  @Get("history")
  async history(@Query() query: any = {}) {
    return {
      jobs: this.progressService.listJobs({
        limit: query.limit,
        type: query.type,
      }),
    };
  }

  @Get("batch/:batchId")
  async batch(@Param("batchId") batchId: string) {
    return this.linkerService.batchReport(batchId);
  }

  private async runAuditJob(jobId: string, options: any) {
    this.progressService.startJob(jobId, {
      progress: 1,
      stage: "starting",
      message: "Starting crypto linking audit",
    });

    try {
      const result = await this.diagnosticsService.audit({
        ...options,
        dryRun: true,
        onProgress: (update: any) => this.progressService.updateJob(jobId, update),
      });
      this.progressService.completeJob(jobId, result);
    } catch (error) {
      this.progressService.failJob(jobId, error);
    }
  }

  private async runApplyJob(jobId: string, options: any) {
    this.progressService.startJob(jobId, {
      progress: 1,
      stage: "starting",
      message: "Starting crypto linking apply engine",
    });

    try {
      const result = await this.linkerService.applyProposedUpdates({
        ...options,
        onProgress: (update: any) => this.progressService.updateJob(jobId, update),
      });
      this.progressService.completeJob(jobId, result);
    } catch (error) {
      this.progressService.failJob(jobId, error);
    }
  }
}
