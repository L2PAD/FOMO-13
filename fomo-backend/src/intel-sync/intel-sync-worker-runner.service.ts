import { Injectable, Logger } from "@nestjs/common";
import { ChildProcess, fork } from "child_process";
import * as fs from "fs";
import * as path from "path";
import {
  IntelSyncJobName,
  IntelSyncTrigger,
  IntelSyncWorkerLaunchResult,
} from "./intel-sync.types";

@Injectable()
export class IntelSyncWorkerRunnerService {
  private readonly logger = new Logger(IntelSyncWorkerRunnerService.name);
  private readonly activeWorkers = new Map<IntelSyncJobName, ChildProcess>();

  runJob(
    job: IntelSyncJobName,
    trigger: IntelSyncTrigger,
    options: Record<string, any> = {},
  ): IntelSyncWorkerLaunchResult {
    const existingWorker = this.activeWorkers.get(job);

    if (existingWorker && !existingWorker.killed) {
      this.logger.warn(
        `Intel sync worker for ${job} is already running with PID ${existingWorker.pid}`,
      );

      return {
        job,
        trigger,
        skipped: true,
        started: false,
        pid: existingWorker.pid,
        reason: "already_running",
      };
    }

    const { modulePath, execArgv } = this.resolveWorkerEntry();
    const child = fork(modulePath, [job, trigger], {
      cwd: process.cwd(),
      env: {
        ...process.env,
        INTEL_SYNC_WORKER_PROCESS: "true",
        INTEL_SYNC_WORKER_OPTIONS: JSON.stringify(options || {}),
      },
      execArgv,
      stdio: "inherit",
    });

    this.activeWorkers.set(job, child);

    child.on("exit", (code, signal) => {
      this.activeWorkers.delete(job);

      if (code === 0) {
        this.logger.log(
          `Intel sync worker ${job} finished successfully (pid=${child.pid})`,
        );
        return;
      }

      this.logger.error(
        `Intel sync worker ${job} exited with code=${code} signal=${signal} (pid=${child.pid})`,
      );
    });

    child.on("error", (error) => {
      this.activeWorkers.delete(job);
      this.logger.error(
        `Intel sync worker ${job} failed to start: ${error.message}`,
        error.stack,
      );
    });

    this.logger.log(
      `Started intel sync worker ${job} (${trigger}) with PID ${child.pid}`,
    );

    return {
      job,
      trigger,
      skipped: false,
      started: true,
      pid: child.pid,
      options,
    };
  }

  private resolveWorkerEntry(): { modulePath: string; execArgv: string[] } {
    const distWorkerPath = path.resolve(
      process.cwd(),
      "dist",
      "intel-sync",
      "intel-sync.worker.js",
    );

    if (process.env.NODE_ENV === "production" && fs.existsSync(distWorkerPath)) {
      return {
        modulePath: distWorkerPath,
        execArgv: [],
      };
    }

    return {
      modulePath: path.resolve(
        process.cwd(),
        "src",
        "intel-sync",
        "intel-sync.worker.ts",
      ),
      execArgv: ["-r", "ts-node/register", "-r", "tsconfig-paths/register"],
    };
  }
}
