import { Injectable, Logger, OnModuleInit, OnModuleDestroy } from "@nestjs/common";
import { NewsParserService } from "./news-parser.service";
import { schedulerEnabled } from "./news-parser.constants";

// Self-contained scheduler (P3). Independent of global CRON_ENABLED/ScheduleModule:
// uses setInterval and enqueues DUE sources onto the Bull queue every tick.
@Injectable()
export class NewsParserScheduler implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(NewsParserScheduler.name);
  private timer: NodeJS.Timeout | null = null;
  private ticking = false;

  constructor(private readonly service: NewsParserService) {}

  onModuleInit(): void {
    if (!schedulerEnabled()) {
      this.logger.log("[NewsParser] scheduler disabled (NEWS_PARSER_SCHEDULER_ENABLED=false)");
      return;
    }
    // first tick after 30s (let app + redis settle), then every 60s
    setTimeout(() => this.safeTick(), 30000);
    this.timer = setInterval(() => this.safeTick(), 60000);
    this.logger.log("[NewsParser] scheduler started (staggered per-source polling)");
  }

  onModuleDestroy(): void {
    if (this.timer) clearInterval(this.timer);
  }

  private async safeTick(): Promise<void> {
    if (this.ticking) return;
    this.ticking = true;
    try {
      await this.service.touchSchedulerHeartbeat();
      await this.service.recoverStaleRuns(10);
      const due = await this.service.findDueSources(new Date());
      let queued = 0;
      for (const s of due) {
        await this.service.enqueueSource(s.id, "schedule");
        queued++;
      }
      if (queued) this.logger.log(`[NewsParser] scheduled ${queued} due source(s)`);
    } catch (e: any) {
      this.logger.warn(`[NewsParser] scheduler tick error: ${e?.message || e}`);
    } finally {
      this.ticking = false;
    }
  }
}
