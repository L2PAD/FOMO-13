import { Injectable } from "@nestjs/common";
import { InjectModel } from "@nestjs/mongoose";
import { Model } from "mongoose";
import { CryptoLinkingDiagnosticsService } from "../crypto-linking-diagnostics.service";
import {
  CryptoLinkingAuditLog,
  CryptoLinkingAuditLogDocument,
} from "../models/crypto-linking-audit-log.model";

type LinkableEntityType = "investors";
type AllowedConfidence = "exact" | "high";
type ProgressReporter = (update: {
  progress?: number;
  stage?: string;
  message?: string;
  meta?: any;
}) => void;

type ApplyOptions = {
  dryRun?: boolean;
  apply?: boolean;
  scanLimit?: number;
  investorScanLimit?: number;
  sampleLimit?: number;
  applyLimit?: number;
  entityTypes?: LinkableEntityType[];
  allowedConfidence?: AllowedConfidence[];
  batchId?: string;
  onProgress?: ProgressReporter;
};

type InvestorLinkUpdate = {
  sourceEntityId: string;
  sourceEntity: string;
  operation: "linkInvestor";
  investorType: "fund" | "person";
  fundId?: string;
  personId?: string;
  confidence: AllowedConfidence;
  matchedBy: string;
  reason: string;
};

type OperationResponse = {
  entityType: "investor";
  entityId: string;
  operation: string;
  status: string;
  targetEntityType?: string;
  targetEntityId?: string;
  confidence: string;
  matchedBy: string;
  reason: string;
  before?: any;
  after?: any;
};

@Injectable()
export class CryptoEntityLinkerService {
  constructor(
    private readonly diagnosticsService: CryptoLinkingDiagnosticsService,
    @InjectModel(CryptoLinkingAuditLog.name)
    private readonly auditLogModel: Model<CryptoLinkingAuditLogDocument>
  ) {}

  async buildProposedUpdates(options: ApplyOptions = {}) {
    const normalized = this.normalizeOptions(options);
    this.reportProgress(normalized, {
      progress: 5,
      stage: "preparing-proposals",
      message: "Preparing proposed crypto linking updates",
    });

    const diagnosticReport = await this.diagnosticsService.audit({
      dryRun: true,
      scanLimit: normalized.scanLimit,
      investorScanLimit: normalized.investorScanLimit,
      sampleLimit: normalized.sampleLimit,
      onProgress: (update: any) =>
        this.reportProgress(normalized, {
          ...update,
          progress: this.scaleProgress(update?.progress, 8, 72),
        }),
    });
    const proposedUpdates = this.normalizeProposedUpdates(
      (diagnosticReport as any).proposedUpdates
    );

    this.reportProgress(normalized, {
      progress: 75,
      stage: "proposals-ready",
      message: "Proposed updates are ready",
      meta: { investors: proposedUpdates.investors.length },
    });

    return {
      dryRun: true,
      batchId: normalized.batchId,
      requested: this.requested(normalized),
      proposedUpdates,
      diagnostics: (diagnosticReport as any).diagnostics,
      samples: (diagnosticReport as any).samples,
    };
  }

  async applyProposedUpdates(options: ApplyOptions = {}) {
    const normalized = this.normalizeOptions(options);
    if (normalized.realApplyBlocked) {
      return this.blockedApplyResponse(normalized);
    }

    const proposedReport = await this.buildProposedUpdates(normalized);
    const proposed = proposedReport.proposedUpdates;
    const operations: OperationResponse[] = [];
    const skipped = {
      alreadyLinked: 0,
      conflict: 0,
      unsupported: 0,
      lowConfidence: 0,
      limitReached: 0,
    };

    if (normalized.entityTypes.includes("investors")) {
      for (const update of proposed.investors) {
        if (
          !this.isAllowedConfidence(
            update.confidence,
            normalized.allowedConfidence
          )
        ) {
          skipped.lowConfidence += 1;
          operations.push(this.toSkippedLowConfidenceResult(update));
          continue;
        }

        skipped.unsupported += 1;
        operations.push(
          await this.applyInvestorLink(update, {
            dryRun: true,
            batchId: normalized.batchId,
          })
        );
      }
    }

    this.reportProgress(normalized, {
      progress: 100,
      stage: "completed",
      message: "Investor linking preview completed",
      meta: { operations: operations.length },
    });

    return {
      dryRun: true,
      apply: false,
      batchId: normalized.batchId,
      requested: this.requested(normalized),
      safetyWarnings: normalized.safetyWarnings,
      proposed: { investors: proposed.investors.length },
      applied: { investors: 0 },
      skipped,
      failed: 0,
      operations,
    };
  }

  async applyInvestorLink(
    update: InvestorLinkUpdate,
    options: { dryRun: boolean; batchId: string }
  ): Promise<OperationResponse> {
    const targetEntityId = update.fundId || update.personId;
    return {
      entityType: "investor",
      entityId: update.sourceEntityId,
      operation: update.operation,
      status: "skippedUnsupportedInvestorApply",
      targetEntityType: update.investorType,
      targetEntityId,
      confidence: update.confidence,
      matchedBy: update.matchedBy,
      reason:
        "Investor apply is disabled; reverse links and investor metadata writes require a schema-safe implementation.",
      before: { sourceEntity: update.sourceEntity, dryRun: options.dryRun },
      after: { sourceEntity: update.sourceEntity, dryRun: options.dryRun },
    };
  }

  async batchReport(batchId: string) {
    const logs = await this.auditLogModel
      .find({ batchId })
      .sort({ createdAt: 1 })
      .limit(1000)
      .lean();
    const byStatus = this.countBy(logs, "status");
    const byEntityType = this.countBy(logs, "entityType");
    const failedOperations = logs.filter((log: any) => log.status === "failed");
    return {
      batchId,
      totals: {
        applied: byStatus.applied || 0,
        skipped: byStatus.skipped || 0,
        conflict: byStatus.conflict || 0,
        failed: byStatus.failed || 0,
      },
      byStatus,
      byEntityType,
      firstOperationAt: logs[0]?.createdAt || null,
      lastOperationAt: logs[logs.length - 1]?.createdAt || null,
      sampleOperations: logs.slice(0, 50),
      failedOperations,
      operations: logs,
    };
  }

  private normalizeProposedUpdates(value: any) {
    return {
      investors: Array.isArray(value?.investors) ? value.investors : [],
    } as { investors: InvestorLinkUpdate[] };
  }

  private normalizeOptions(options: ApplyOptions) {
    const safetyWarnings: string[] = [];
    const requestedConfidence = Array.isArray(options.allowedConfidence)
      ? options.allowedConfidence
      : [];
    const allowedConfidence: AllowedConfidence[] =
      requestedConfidence.includes("exact") &&
      requestedConfidence.includes("high")
        ? ["exact", "high"]
        : ["exact"];
    if (requestedConfidence.includes("high")) {
      safetyWarnings.push(
        "allowedConfidence includes high; high-confidence proposals must be explicitly reviewed."
      );
    }

    const entityTypes = this.normalizeEntityTypes(options.entityTypes);
    const requestedRealApply =
      options.apply === true && options.dryRun === false;
    if (options.apply === true && options.dryRun !== false) {
      safetyWarnings.push(
        "apply=true was ignored because dryRun=false was not provided."
      );
    }
    if (options.apply !== true) {
      safetyWarnings.push(
        "apply flag is not true; endpoint is running in dry-run mode."
      );
    }

    const realApplyErrors: string[] = [];
    if (
      requestedRealApply &&
      (!Array.isArray(options.entityTypes) || !options.entityTypes.length)
    ) {
      realApplyErrors.push(
        "Real apply requires an explicit non-empty entityTypes array."
      );
    }
    if (requestedRealApply && !entityTypes.length) {
      realApplyErrors.push(
        "Real apply requires at least one supported entity type."
      );
    }
    if (requestedRealApply && entityTypes.includes("investors")) {
      realApplyErrors.push("Real apply for investors is disabled.");
    }
    if (realApplyErrors.length) safetyWarnings.push(...realApplyErrors);

    return {
      dryRun: true,
      realApply: false,
      realApplyBlocked: requestedRealApply && realApplyErrors.length > 0,
      scanLimit: this.toAdminLimit(options.scanLimit),
      investorScanLimit: this.toAdminLimit(options.investorScanLimit),
      sampleLimit: this.toAdminLimit(options.sampleLimit),
      applyLimit: this.toAdminLimit(options.applyLimit),
      entityTypes,
      allowedConfidence,
      batchId: this.cleanBatchId(options.batchId) || this.generateBatchId(),
      onProgress:
        typeof options.onProgress === "function"
          ? options.onProgress
          : undefined,
      safetyWarnings,
    };
  }

  private normalizeEntityTypes(values: any): LinkableEntityType[] {
    if (!Array.isArray(values)) return ["investors"];
    return values.includes("investors") ? ["investors"] : [];
  }

  private requested(normalized: any) {
    return {
      scanLimit: normalized.scanLimit,
      investorScanLimit: normalized.investorScanLimit,
      sampleLimit: normalized.sampleLimit,
      applyLimit: normalized.applyLimit,
      entityTypes: normalized.entityTypes,
      allowedConfidence: normalized.allowedConfidence,
    };
  }

  private blockedApplyResponse(normalized: any) {
    return {
      dryRun: true,
      apply: false,
      batchId: normalized.batchId,
      requested: this.requested(normalized),
      safetyWarnings: normalized.safetyWarnings,
      proposed: { investors: 0 },
      applied: { investors: 0 },
      skipped: {
        alreadyLinked: 0,
        conflict: 0,
        unsupported: 0,
        lowConfidence: 0,
        limitReached: 0,
      },
      failed: 0,
      operations: [],
    };
  }

  private toSkippedLowConfidenceResult(
    update: InvestorLinkUpdate
  ): OperationResponse {
    return {
      entityType: "investor",
      entityId: update.sourceEntityId,
      operation: update.operation,
      status: "skippedLowConfidence",
      targetEntityType: update.investorType,
      targetEntityId: update.fundId || update.personId,
      confidence: update.confidence,
      matchedBy: update.matchedBy,
      reason: `Confidence ${update.confidence} is not allowed for this apply request.`,
    };
  }

  private reportProgress(
    options: any,
    update: Parameters<ProgressReporter>[0]
  ) {
    const reporter: ProgressReporter | undefined = options?.onProgress;
    if (typeof reporter !== "function") return;
    try {
      reporter(update);
    } catch {
      // Progress reporting is best-effort and must not affect diagnostics.
    }
  }

  private scaleProgress(value: any, start: number, end: number) {
    const parsed = Number(value);
    if (!Number.isFinite(parsed)) return start;
    const clamped = Math.min(100, Math.max(0, parsed));
    return Math.floor(start + ((end - start) * clamped) / 100);
  }

  private countBy(rows: any[], field: string): Record<string, number> {
    return rows.reduce((acc, row: any) => {
      const key = String(row?.[field] || "unknown");
      acc[key] = (acc[key] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);
  }

  private isAllowedConfidence(
    confidence: string,
    allowedConfidence: AllowedConfidence[]
  ) {
    return allowedConfidence.includes(confidence as AllowedConfidence);
  }

  private toAdminLimit(value: any) {
    const parsed = Number(value);
    if (!Number.isFinite(parsed)) return 0;
    return Math.max(0, Math.trunc(parsed));
  }

  private cleanBatchId(value: any): string {
    return String(value || "")
      .trim()
      .replace(/[^a-zA-Z0-9._:-]/g, "-")
      .slice(0, 120);
  }

  private generateBatchId() {
    const stamp = new Date()
      .toISOString()
      .replace(/[-:.TZ]/g, "")
      .slice(0, 14);
    const random = Math.random().toString(36).slice(2, 8);
    return `crypto-linking-${stamp}-${random}`;
  }
}
