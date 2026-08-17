import { Injectable, NotFoundException } from "@nestjs/common";

export type CryptoLinkingJobType = "audit" | "apply";
export type CryptoLinkingJobStatus = "queued" | "running" | "completed" | "failed";

export type CryptoLinkingProgressUpdate = {
  progress?: number;
  stage?: string;
  message?: string;
  meta?: any;
};

export type CryptoLinkingProgressJob = {
  id: string;
  type: CryptoLinkingJobType;
  status: CryptoLinkingJobStatus;
  progress: number;
  stage: string;
  message: string;
  request?: any;
  result?: any;
  error?: string;
  meta?: any;
  createdAt: string;
  startedAt?: string;
  updatedAt: string;
  completedAt?: string;
};

@Injectable()
export class CryptoLinkingProgressService {
  private readonly jobs = new Map<string, CryptoLinkingProgressJob>();
  private readonly maxJobs = 100;

  createJob(type: CryptoLinkingJobType, request?: any): CryptoLinkingProgressJob {
    this.purgeOldJobs();

    const now = new Date().toISOString();
    const job: CryptoLinkingProgressJob = {
      id: this.generateJobId(type),
      type,
      status: "queued",
      progress: 0,
      stage: "queued",
      message: "Job queued",
      request,
      createdAt: now,
      updatedAt: now,
    };

    this.jobs.set(job.id, job);
    return this.snapshot(job);
  }

  startJob(id: string, update: CryptoLinkingProgressUpdate = {}) {
    const job = this.requireJob(id);
    const now = new Date().toISOString();
    job.status = "running";
    job.startedAt = job.startedAt || now;
    this.applyUpdate(job, {
      progress: update.progress ?? 1,
      stage: update.stage || "running",
      message: update.message || "Job started",
      meta: update.meta,
    });
    return this.snapshot(job);
  }

  updateJob(id: string, update: CryptoLinkingProgressUpdate) {
    const job = this.requireJob(id);
    if (job.status === "completed" || job.status === "failed") return this.snapshot(job);
    job.status = "running";
    this.applyUpdate(job, update);
    return this.snapshot(job);
  }

  completeJob(id: string, result: any) {
    const job = this.requireJob(id);
    const now = new Date().toISOString();
    job.status = "completed";
    job.progress = 100;
    job.stage = "completed";
    job.message = "Job completed";
    job.result = result;
    job.updatedAt = now;
    job.completedAt = now;
    return this.snapshot(job);
  }

  failJob(id: string, error: any) {
    const job = this.requireJob(id);
    const now = new Date().toISOString();
    job.status = "failed";
    job.stage = "failed";
    job.message = "Job failed";
    job.error = error?.message || String(error || "Unknown error");
    job.updatedAt = now;
    job.completedAt = now;
    return this.snapshot(job);
  }

  getJob(id: string) {
    return this.snapshot(this.requireJob(id));
  }

  listJobs(options: { limit?: any; type?: any } = {}) {
    const limit = this.normalizeLimit(options.limit);
    const type = String(options.type || "").trim();

    return Array.from(this.jobs.values())
      .filter((job) => !type || job.type === type)
      .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
      .slice(0, limit)
      .map((job) => this.historySnapshot(job));
  }

  private applyUpdate(job: CryptoLinkingProgressJob, update: CryptoLinkingProgressUpdate) {
    const progress = this.normalizeProgress(update.progress);
    if (progress !== null) {
      job.progress = Math.max(job.progress, progress);
    }
    if (update.stage) job.stage = update.stage;
    if (update.message) job.message = update.message;
    if (update.meta !== undefined) job.meta = update.meta;
    job.updatedAt = new Date().toISOString();
  }

  private normalizeProgress(value: any): number | null {
    const parsed = Number(value);
    if (!Number.isFinite(parsed)) return null;
    return Math.min(100, Math.max(0, Math.trunc(parsed)));
  }

  private normalizeLimit(value: any): number {
    const parsed = Number(value);
    if (!Number.isFinite(parsed)) return 25;
    return Math.min(100, Math.max(1, Math.trunc(parsed)));
  }

  private requireJob(id: string) {
    const job = this.jobs.get(id);
    if (!job) {
      throw new NotFoundException(`Crypto linking progress job not found: ${id}`);
    }
    return job;
  }

  private snapshot(job: CryptoLinkingProgressJob): CryptoLinkingProgressJob {
    return {
      ...job,
      request: job.request ? { ...job.request } : job.request,
      meta: job.meta ? { ...job.meta } : job.meta,
    };
  }

  private historySnapshot(job: CryptoLinkingProgressJob) {
    const { result, ...snapshot } = this.snapshot(job);
    return {
      ...snapshot,
      hasResult: result !== undefined,
      resultSummary: this.summarizeResult(job),
    };
  }

  private summarizeResult(job: CryptoLinkingProgressJob) {
    const result: any = job.result || {};
    if (job.type === "audit") {
      const proposed = result.proposedUpdates || {};
      return {
        proposedInvestors: this.arrayLength(proposed.investors),
        limits: result.limits,
      };
    }

    return {
      batchId: result.batchId,
      proposed: result.proposed,
      applied: result.applied,
      skipped: result.skipped,
      failed: result.failed,
    };
  }

  private arrayLength(value: any): number {
    return Array.isArray(value) ? value.length : 0;
  }

  private purgeOldJobs() {
    if (this.jobs.size < this.maxJobs) return;

    const jobs = Array.from(this.jobs.values()).sort((a, b) =>
      a.createdAt.localeCompare(b.createdAt),
    );
    for (const job of jobs.slice(0, Math.max(1, jobs.length - this.maxJobs + 1))) {
      this.jobs.delete(job.id);
    }
  }

  private generateJobId(type: CryptoLinkingJobType) {
    const stamp = new Date().toISOString().replace(/[-:.TZ]/g, "").slice(0, 14);
    const random = Math.random().toString(36).slice(2, 8);
    return `crypto-linking-${type}-${stamp}-${random}`;
  }
}
