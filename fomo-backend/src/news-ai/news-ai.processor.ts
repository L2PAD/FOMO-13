import { Logger } from "@nestjs/common";
import { Process, Processor } from "@nestjs/bull";
import { Job } from "bull";
import { NewsAiService } from "./news-ai.service";
import { NEWS_AI_QUEUE, NEWS_AI_JOBS, NewsAiGenerateJob } from "./news-ai.constants";

@Processor(NEWS_AI_QUEUE)
export class NewsAiProcessor {
  private readonly logger = new Logger(NewsAiProcessor.name);
  constructor(private readonly service: NewsAiService) {}

  @Process({ name: NEWS_AI_JOBS.GENERATE, concurrency: 2 })
  async generate(job: Job<NewsAiGenerateJob>): Promise<any> {
    const { fingerprint, sourceArticleIds } = job.data;
    // Errors here propagate to Bull for retry/backoff (retryable, never fabricates content).
    return this.service.processGenerationJob(fingerprint, sourceArticleIds || []);
  }
}
