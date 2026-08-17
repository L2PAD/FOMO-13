import { Injectable, Logger } from "@nestjs/common";
import { InjectModel } from "@nestjs/mongoose";
import mongoose, { Model } from "mongoose";
import { ADMIN_AI_CONNECTION_NAME } from "./admin-ai-chat.constants";
import { FomoV2AiRedactionService } from "./fomo-v2-context/fomo-v2-ai-redaction.service";
import { AdminAiToolExecutionContext } from "./fomo-v2-context/fomo-v2-ai-types";
import {
  AiAdminToolRun,
  AiAdminToolRunDocument,
} from "./models/ai-admin-tool-run.model";

type RecordToolRunInput = {
  context?: AdminAiToolExecutionContext;
  toolName: string;
  input: Record<string, unknown>;
  result: any;
  status: "done" | "error" | "blocked" | "pending";
  startedAt: Date;
  finishedAt: Date;
};

@Injectable()
export class AdminAiToolAuditService {
  private readonly logger = new Logger(AdminAiToolAuditService.name);

  constructor(
    @InjectModel(AiAdminToolRun.name, ADMIN_AI_CONNECTION_NAME)
    private readonly auditModel: Model<AiAdminToolRunDocument>,
    private readonly redactionService: FomoV2AiRedactionService
  ) {}

  async recordToolRun(input: RecordToolRunInput) {
    try {
      const data = input.result?.data || {};
      const limits = input.result?.limits || {};
      const collectionsRead = Array.isArray(data.collectionsRead)
        ? data.collectionsRead
        : Array.isArray(limits.collectionsRead)
          ? limits.collectionsRead
          : [];

      const created = await this.auditModel.create({
        userId: input.context?.userId,
        chatId: input.context?.chatId,
        messageId: input.context?.messageId,
        toolName: input.toolName,
        dbName: String(limits.dbTarget || data.dbName || "unknown"),
        targetDb: String(data.targetDb || limits.writeDbTarget || limits.dbTarget || data.dbName || "unknown"),
        accessMode: input.context?.accessMode,
        requiresApproval: Boolean(data.requiresApproval),
        approvalStatus: data.requiresApproval ? "pending" : "not_required",
        collectionName: collectionsRead.slice(0, 30),
        operation: String(data.operation || ""),
        input: this.redactionService.redact(input.input || {}, {
          maxDepth: 4,
          maxArrayLength: 20,
          maxStringLength: 1000,
        }) as Record<string, unknown>,
        plannedChanges: this.redactionService.redact(data.plannedChanges, {
          maxDepth: 5,
          maxArrayLength: 50,
          maxStringLength: 1000,
        }),
        dryRun: Boolean(input.input?.dryRun),
        confirm: Boolean(input.input?.confirm),
        status: input.status,
        resultSummary: this.resultSummary(input.result),
        createdCount: Number(data.createdCount || 0),
        updatedCount: Number(data.updatedCount || 0),
        modifiedCount: Number(data.modifiedCount || 0),
        affectedIds: Array.isArray(data.affectedIds)
          ? data.affectedIds.map((item: unknown) => String(item)).slice(0, 100)
          : [],
        error: data.error ? String(data.error).slice(0, 1000) : undefined,
        startedAt: input.startedAt,
        finishedAt: input.finishedAt,
      });

      return String(created._id);
    } catch (error: any) {
      this.logger.warn(
        `Admin AI tool audit write failed: ${error?.name || "MongoError"}`
      );
      return undefined;
    }
  }

  async getToolRun(id: string) {
    if (!mongoose.Types.ObjectId.isValid(id)) return null;
    return this.auditModel.findById(id).lean();
  }

  async markRejected(id: string, adminId: string) {
    if (!mongoose.Types.ObjectId.isValid(id)) return null;
    return this.auditModel
      .findOneAndUpdate(
        { _id: new mongoose.Types.ObjectId(id), approvalStatus: "pending" },
        {
          $set: {
            status: "blocked",
            approvalStatus: "rejected",
            rejectedBy: adminId,
            rejectedAt: new Date(),
            finishedAt: new Date(),
          },
        },
        { new: true }
      )
      .lean();
  }

  async markApprovedExecuting(
    id: string,
    adminId: string,
    approvalInput: { editedPayload?: unknown; adminNote?: string } = {}
  ) {
    if (!mongoose.Types.ObjectId.isValid(id)) return null;
    const set: Record<string, unknown> = {
      approvalStatus: "approved",
      approvedBy: adminId,
      approvedAt: new Date(),
    };
    if (approvalInput.editedPayload !== undefined) {
      set.editedPayload = this.redactionService.redact(approvalInput.editedPayload, {
        maxDepth: 5,
        maxArrayLength: 100,
        maxStringLength: 1000,
      });
      set.editedPayloadAt = new Date();
    }
    if (approvalInput.adminNote) {
      set.adminNote = String(approvalInput.adminNote).slice(0, 1000);
    }

    return this.auditModel
      .findOneAndUpdate(
        { _id: new mongoose.Types.ObjectId(id), approvalStatus: "pending" },
        {
          $set: set,
        },
        { new: true }
      )
      .lean();
  }

  async markExecuted(id: string, result: any, status: "done" | "error" | "blocked") {
    if (!mongoose.Types.ObjectId.isValid(id)) return null;
    const data = result?.data || {};
    return this.auditModel
      .findByIdAndUpdate(
        id,
        {
          $set: {
            status,
            executedAt: new Date(),
            finishedAt: new Date(),
            resultSummary: this.resultSummary(result),
            createdCount: Number(data.createdCount || 0),
            updatedCount: Number(data.updatedCount || 0),
            modifiedCount: Number(data.modifiedCount || 0),
            affectedIds: Array.isArray(data.affectedIds)
              ? data.affectedIds.map((item: unknown) => String(item)).slice(0, 100)
              : [],
            error: data.error ? String(data.error).slice(0, 1000) : undefined,
          },
        },
        { new: true }
      )
      .lean();
  }

  private resultSummary(result: any) {
    const data = result?.data || {};
    const comparePayload = data.responseType === "vesting_review_compare"
      ? {
          responseType: data.responseType,
          project: data.project,
          recommendation: data.recommendation,
          confidence: data.confidence,
          currentJson: data.currentJson,
          proposedJson: data.proposedJson,
          originalProposedJson: data.originalProposedJson,
          diffSummary: data.diffSummary,
          issues: data.issues,
          saleIdMap: data.saleIdMap,
          nameChanges: data.nameChanges,
          sourcesUsed: data.sourcesUsed,
          validation: data.validation,
          editedPayloadApplied: data.editedPayloadApplied,
          adminNote: data.adminNote,
        }
      : {};
    const summary = {
      tool: result?.tool,
      generatedAt: result?.generatedAt,
      status: data.status,
      requiresApproval: data.requiresApproval,
      accessMode: data.accessMode,
      approvalStatus: data.approvalStatus,
      toolRunId: data.toolRunId,
      toolName: data.toolName,
      targetDb: data.targetDb,
      dbName: data.dbName,
      collectionName: data.collectionName,
      operation: data.operation,
      plannedChanges: data.plannedChanges,
      summary: data.summary,
      collectionsRead: Array.isArray(data.collectionsRead)
        ? data.collectionsRead.slice(0, 30)
        : undefined,
      createdCount: data.createdCount,
      updatedCount: data.updatedCount,
      modifiedCount: data.modifiedCount,
      affectedIds: Array.isArray(data.affectedIds)
        ? data.affectedIds.slice(0, 50)
        : undefined,
      warnings: Array.isArray(data.warnings) ? data.warnings.slice(0, 20) : undefined,
      toolSuggestions: Array.isArray(data.toolSuggestions)
        ? data.toolSuggestions.slice(0, 10)
        : undefined,
      ...comparePayload,
      error: data.error,
      errorCode: data.errorCode,
    };

    return this.redactionService.redact(summary, {
      maxDepth: 4,
      maxArrayLength: 50,
      maxStringLength: 1000,
    }) as Record<string, unknown>;
  }
}
