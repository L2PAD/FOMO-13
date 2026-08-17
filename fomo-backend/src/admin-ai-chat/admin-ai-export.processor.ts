import { Logger } from "@nestjs/common";
import { Process, Processor } from "@nestjs/bull";
import { Job } from "bull";
import {
  ADMIN_AI_EXPORT_JOB,
  ADMIN_AI_EXPORT_QUEUE,
  AdminAiExportJobPayload,
} from "./admin-ai-export.constants";
import { AdminAiExportService } from "./admin-ai-export.service";

@Processor(ADMIN_AI_EXPORT_QUEUE)
export class AdminAiExportProcessor {
  private readonly logger = new Logger(AdminAiExportProcessor.name);

  constructor(private readonly exportService: AdminAiExportService) {}

  @Process(ADMIN_AI_EXPORT_JOB)
  async generate(job: Job<AdminAiExportJobPayload>) {
    this.logger.log(`Admin AI export job started id=${job.id} artifact=${job.data.artifactId}`);
    try {
      await this.exportService.processArtifact(job.data.artifactId);
    } catch (error) {
      const configuredAttempts = Number(job.opts.attempts || 1);
      if (job.attemptsMade + 1 < configuredAttempts) {
        await this.exportService.markArtifactQueuedForRetry(job.data.artifactId);
      }
      throw error;
    }
  }
}
