import {
  Injectable,
  Logger,
  OnModuleDestroy,
  OnModuleInit,
  Optional,
} from "@nestjs/common";
import { SchedulerRegistry } from "@nestjs/schedule";
import { CronJob } from "cron";
import { isCronEnabled } from "src/config/cron.config";
import { RatingConfigService } from "./rating-config.service";
import { RatingRecalculationService } from "./rating-recalculation.service";
import { RATING_ENTITY_TYPES, RatingEntityType } from "./rating.types";

const JOB_PREFIX = "rating-recalculation-";

@Injectable()
export class RatingSchedulerService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(RatingSchedulerService.name);
  private readonly jobs = new Map<RatingEntityType, CronJob>();
  private reconcileTimer?: NodeJS.Timeout;
  private loadedVersion = 0;
  private reloading = false;

  constructor(
    private readonly configService: RatingConfigService,
    private readonly recalculationService: RatingRecalculationService,
    @Optional() private readonly schedulerRegistry?: SchedulerRegistry
  ) {}

  async onModuleInit(): Promise<void> {
    if (!this.isAvailable()) {
      this.logger.log(
        "Rating schedules are disabled because cron is unavailable"
      );
      return;
    }
    await this.reload();
    this.reconcileTimer = setInterval(() => {
      void this.reconcile().catch((error) =>
        this.logger.warn(
          `Rating schedule reconciliation failed: ${error.message}`
        )
      );
    }, 5_000);
    this.reconcileTimer.unref?.();
  }

  onModuleDestroy(): void {
    if (this.reconcileTimer) clearInterval(this.reconcileTimer);
    for (const entityType of RATING_ENTITY_TYPES) this.remove(entityType);
  }

  async reload(): Promise<void> {
    if (!this.isAvailable() || this.reloading) return;
    this.reloading = true;
    try {
      const snapshot = await this.configService.getSnapshot();
      for (const entityType of RATING_ENTITY_TYPES) {
        this.remove(entityType);
        const config = snapshot.entities[entityType];
        if (!config.enabled || !config.schedule.enabled) continue;

        const job = new CronJob(
          config.schedule.cron,
          () => {
            void this.recalculationService
              .start(entityType, "schedule")
              .catch((error) =>
                this.logger.error(
                  `Scheduled rating start failed entity=${entityType}: ${error.message}`
                )
              );
          },
          null,
          false,
          config.schedule.timezone
        );
        this.schedulerRegistry.addCronJob(this.jobName(entityType), job);
        this.jobs.set(entityType, job);
        job.start();
      }
      this.loadedVersion = snapshot.version;
    } finally {
      this.reloading = false;
    }
  }

  isAvailable(): boolean {
    return isCronEnabled() && Boolean(this.schedulerRegistry);
  }

  nextRunAt(entityType: RatingEntityType): Date | null {
    const job = this.jobs.get(entityType);
    if (!job) return null;
    try {
      const next: any = job.nextDate();
      if (next && typeof next.toJSDate === "function") return next.toJSDate();
      const date = new Date(next);
      return Number.isNaN(date.getTime()) ? null : date;
    } catch (error) {
      return null;
    }
  }

  private async reconcile(): Promise<void> {
    const snapshot = await this.configService.getSnapshot();
    if (snapshot.version !== this.loadedVersion) await this.reload();
  }

  private remove(entityType: RatingEntityType): void {
    const job = this.jobs.get(entityType);
    if (job) job.stop();
    this.jobs.delete(entityType);
    if (!this.schedulerRegistry) return;
    try {
      this.schedulerRegistry.deleteCronJob(this.jobName(entityType));
    } catch (error) {
      // The job was not registered on this replica.
    }
  }

  private jobName(entityType: RatingEntityType): string {
    return `${JOB_PREFIX}${entityType}`;
  }
}
