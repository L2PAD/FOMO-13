import {
  Injectable,
  Logger,
  OnModuleDestroy,
  OnModuleInit,
} from "@nestjs/common";
import { randomUUID } from "crypto";
import { hostname } from "os";
import { isCronEnabled } from "src/config/cron.config";
import {
  isFomoV2ParserControlWorkerEnabled,
  managedParserDefinition,
} from "../parser-control.constants";
import { FomoV2ParserControlPolicyService } from "./parser-control-policy.service";
import { FomoV2ParserControlRegistryService } from "./parser-control-registry.service";
import {
  FomoV2ParserControlLeaseLostError,
  FomoV2ParserControlService,
} from "./parser-control.service";

@Injectable()
export class FomoV2ParserControlWorkerService
  implements OnModuleInit, OnModuleDestroy
{
  private readonly logger = new Logger(FomoV2ParserControlWorkerService.name);
  private running = false;
  private wakeScheduled = false;
  private wakePending = false;
  private workerTimer?: ReturnType<typeof setInterval>;
  private readonly leaseOwner = `${hostname()}:${process.pid}:${randomUUID()}`;

  constructor(
    private readonly control: FomoV2ParserControlService,
    private readonly registry: FomoV2ParserControlRegistryService,
    private readonly policy: FomoV2ParserControlPolicyService
  ) {}

  onModuleInit(): void {
    if (!isFomoV2ParserControlWorkerEnabled()) return;
    // Manual queues and stale immutable-run recovery must keep working when
    // the app-wide CRON_ENABLED flag disables scheduled parser launches.
    this.workerTimer = setInterval(() => void this.tick(), 10_000);
    this.workerTimer.unref?.();
    const initialTimer = setTimeout(() => this.wake(), 1_000);
    initialTimer.unref?.();
  }

  onModuleDestroy(): void {
    if (this.workerTimer) clearInterval(this.workerTimer);
    this.workerTimer = undefined;
  }

  async tick(): Promise<void> {
    if (!isFomoV2ParserControlWorkerEnabled()) return;
    if (this.running) {
      this.wakePending = true;
      return;
    }
    this.running = true;
    try {
      // A manual wake must process its queued run even when CRON_ENABLED=false,
      // but it must not implicitly revive disabled schedules.
      if (isCronEnabled()) await this.control.queueDueRuns();
      await this.control.recoverExpiredSnapshotRuns();
      for (let processed = 0; processed < 25; processed += 1) {
        const run = await this.control.claimNextRun(this.leaseOwner);
        if (!run) break;
        const outcome = await this.executeClaimedRun(run);
        if (outcome === "deferred") break;
      }
    } catch (error: any) {
      this.logger.error(
        `Parser control worker tick failed: ${safeErrorMessage(error)}`
      );
    } finally {
      this.running = false;
      if (this.wakePending) {
        this.wakePending = false;
        this.wake();
      }
    }
  }

  /** Manual runs do not depend on CRON_ENABLED; the persisted queue remains authoritative. */
  wake(): void {
    if (!isFomoV2ParserControlWorkerEnabled()) return;
    if (this.wakeScheduled) return;
    this.wakeScheduled = true;
    const timer = setTimeout(() => {
      this.wakeScheduled = false;
      void this.tick();
    }, 0);
    timer.unref?.();
  }

  async executeClaimedRun(
    run: Record<string, any>
  ): Promise<"finished" | "deferred"> {
    const definition = managedParserDefinition(String(run.parserKey));
    if (!definition) {
      await this.control.finishRun(run, {
        status: "failed",
        error: `Managed parser adapter is not registered: ${run.parserKey}`,
      });
      return "finished";
    }

    let heartbeat: ReturnType<typeof setInterval> | undefined;
    let leaseLost: FomoV2ParserControlLeaseLostError | undefined;
    let ownsGlobalWriteLease = false;
    let write = false;
    try {
      await this.control.heartbeat(String(run._id), this.leaseOwner);
      let executionPolicy = await this.control.applyExecutionPolicy(run);
      if (!executionPolicy.canRun) {
        await this.control.finishRun(run, {
          status: "skipped",
          policyReason: executionPolicy.blockedReason,
          summary: {
            writesDomainData: false,
            reason: executionPolicy.blockedReason,
          },
        });
        return "finished";
      }

      write = executionPolicy.effectiveMode === "write";
      if (write) {
        const writeLease = await this.control.acquireGlobalWriteLease(
          String(run._id),
          definition.parserKey,
          this.leaseOwner
        );
        if (writeLease === "busy") {
          await this.control.deferClaimedRunForGlobalWriteLease(run);
          return "deferred";
        }
        if (writeLease === "blocked") {
          executionPolicy = await this.control.applyExecutionPolicy(run);
          if (!executionPolicy.canRun) {
            await this.control.finishRun(run, {
              status: "skipped",
              policyReason: executionPolicy.blockedReason,
              summary: {
                writesDomainData: false,
                reason: executionPolicy.blockedReason,
              },
            });
            return "finished";
          }
          write = executionPolicy.effectiveMode === "write";
          if (write) {
            throw new FomoV2ParserControlLeaseLostError(definition.parserKey);
          }
        } else {
          ownsGlobalWriteLease = true;
        }
      }
      if (write) {
        await this.policy.assertDomainWriteAllowed(definition.parserKey);
      }
      heartbeat = setInterval(() => {
        void this.control
          .heartbeat(String(run._id), this.leaseOwner, write)
          .catch((error: any) => {
            if (error instanceof FomoV2ParserControlLeaseLostError) {
              leaseLost = error;
            }
            this.logger.warn(
              `Parser control heartbeat failed runId=${
                run._id
              }: ${safeErrorMessage(error)}`
            );
          });
      }, 30_000);
      heartbeat.unref?.();

      await this.control.reportExecutionProgress(
        String(run._id),
        this.leaseOwner,
        { phase: "import" },
        write
      );
      const result = await this.registry.execute(definition, {
        write,
        limit: Number(run.limit || definition.defaultLimit),
        ...(run.snapshotId ? { snapshotId: run.snapshotId } : {}),
        ...(run.upstreamRunId ? { upstreamRunId: run.upstreamRunId } : {}),
        assertExecutionActive: async () => {
          if (leaseLost) throw leaseLost;
          await this.control.heartbeat(
            String(run._id),
            this.leaseOwner,
            write
          );
          if (write) {
            await this.policy.assertDomainWriteAllowed(definition.parserKey);
          }
        },
        onMaterializationProgress: async (progress) => {
          if (leaseLost) throw leaseLost;
          await this.control.reportExecutionProgress(
            String(run._id),
            this.leaseOwner,
            {
              ...progress,
              phase: "materialization",
            },
            write
          );
        },
      });
      if (leaseLost) throw leaseLost;
      await this.control.reportExecutionProgress(
        String(run._id),
        this.leaseOwner,
        { phase: "finalizing" },
        write
      );
      await this.control.heartbeat(String(run._id), this.leaseOwner, write);
      await this.control.finishRun(run, {
        status: result.partial ? "partial" : "completed",
        summary: {
          ...result.summary,
          effectiveMode: executionPolicy.effectiveMode,
          writesDomainData: write,
          ...(run.snapshotId ? { snapshotId: run.snapshotId } : {}),
          ...(run.upstreamRunId ? { upstreamRunId: run.upstreamRunId } : {}),
        },
      });
      return "finished";
    } catch (error: any) {
      if (leaseLost || error instanceof FomoV2ParserControlLeaseLostError) {
        this.logger.warn(
          `Managed parser ${
            run.parserKey
          } stopped after lease loss: ${safeErrorMessage(leaseLost || error)}`
        );
        return "finished";
      }
      try {
        await this.control.finishRun(run, {
          status: "failed",
          error: safeErrorMessage(error),
          summary: { writesDomainData: Boolean(run.writesDomainData) },
        });
      } catch (finishError: any) {
        if (finishError instanceof FomoV2ParserControlLeaseLostError) {
          this.logger.warn(
            `Managed parser ${
              run.parserKey
            } failed after ownership changed: ${safeErrorMessage(error)}`
          );
          return "finished";
        }
        throw finishError;
      }
      this.logger.error(
        `Managed parser ${run.parserKey} failed: ${safeErrorMessage(error)}`
      );
      return "finished";
    } finally {
      if (heartbeat) clearInterval(heartbeat);
      if (ownsGlobalWriteLease) {
        await this.control.releaseGlobalWriteLease(
          String(run._id),
          this.leaseOwner
        );
      }
    }
  }
}

function safeErrorMessage(error: any): string {
  return String(error?.message || error?.code || error || "Unknown error")
    .replace(/mongodb(\+srv)?:\/\/[^@]+@/gi, "mongodb://[redacted]@")
    .slice(0, 2_000);
}
