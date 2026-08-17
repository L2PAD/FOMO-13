import { Injectable, Logger, OnModuleInit, OnModuleDestroy } from "@nestjs/common";
import { NewsAiService } from "./news-ai.service";

/**
 * Self-contained staggered scheduler for AI generation (isolated from parser).
 * Uses setInterval (global @Cron disabled). Enqueues generation when enabled &
 * budget allows; the queue/processor handle execution, retries and recovery.
 */
@Injectable()
export class NewsAiScheduler implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(NewsAiScheduler.name);
  private timer: NodeJS.Timeout | null = null;
  private ticking = false;
  private lastRunAt = 0;

  constructor(private readonly service: NewsAiService) {}

  onModuleInit() {
    if (process.env.NEWS_AI_SCHEDULER_ENABLED === "false") return;
    this.timer = setInterval(() => this.tick().catch(() => void 0), 60_000);
    this.logger.log("[NewsAI] scheduler started (60s tick)");
  }
  onModuleDestroy() { if (this.timer) clearInterval(this.timer); }

  private async tick() {
    if (this.ticking) return;
    this.ticking = true;
    try {
      const s = await this.service.getSettings();
      if (!s.enabled) return;
      const intervalMs = Math.max(Number(s.intervalMinutes) || 30, 1) * 60_000;
      if (Date.now() - this.lastRunAt < intervalMs) return;
      const budget = await this.service.budgetCheck();
      if (!budget.allowed) { this.logger.warn(`[NewsAI] scheduler skip: budget ${budget.status}`); return; }
      this.lastRunAt = Date.now();
      const res = await this.service.enqueueGeneration({ maxClusters: s.maxStoriesPerRun, windowLimit: s.windowLimit, minSources: s.minSources });
      this.logger.log(`[NewsAI] scheduler enqueued ${res.queued}/${res.selected}`);
    } finally {
      this.ticking = false;
    }
  }
}
