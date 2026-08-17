import { Logger } from "@nestjs/common";
import { Process, Processor } from "@nestjs/bull";
import { Job } from "bull";
import { NewsParserService } from "./news-parser.service";
import {
  NEWS_PARSER_JOBS,
  NEWS_PARSER_QUEUE,
  NewsPollJobPayload,
} from "./news-parser.constants";

@Processor(NEWS_PARSER_QUEUE)
export class NewsParserProcessor {
  private readonly logger = new Logger(NewsParserProcessor.name);

  constructor(private readonly service: NewsParserService) {}

  @Process({ name: NEWS_PARSER_JOBS.POLL_SOURCE, concurrency: 4 })
  async pollSource(job: Job<NewsPollJobPayload>): Promise<any> {
    const { sourceId, trigger, limit, requestedBy } = job.data;
    try {
      return await this.service.runSource(sourceId, {
        trigger: trigger || "schedule",
        limit,
        requestedBy,
        workerId: `bull:${process.pid}:${job.id}`,
      });
    } catch (e: any) {
      this.logger.error(`[NewsParser] poll ${sourceId} failed: ${e?.message || e}`);
      // ingestion failure is isolated per-source (P42); do not throw to keep queue healthy
      return { source: sourceId, status: "FAILED", error: String(e?.message || e) };
    }
  }
}
