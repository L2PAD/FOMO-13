import {
  BadRequestException,
  Injectable,
  NotFoundException,
  Optional,
} from "@nestjs/common";
import { InjectModel } from "@nestjs/mongoose";
import mongoose, { Model } from "mongoose";
import { ADMIN_AI_CONNECTION_NAME } from "./admin-ai-chat.constants";
import { AdminAiChatConfigService } from "./admin-ai-chat-config.service";
import { AdminAiOpenAiService } from "./admin-ai-openai.service";
import { AdminAiToolAuditService } from "./admin-ai-tool-audit.service";
import { FomoV2AiRedactionService } from "./fomo-v2-context/fomo-v2-ai-redaction.service";
import { FomoV2AiContextService } from "./fomo-v2-context/fomo-v2-ai-context.service";
import {
  AdminAiAccessMode,
  FomoV2AiToolCallRecord,
} from "./fomo-v2-context/fomo-v2-ai-types";
import {
  AdminAiChatFolder,
  AdminAiChatFolderDocument,
} from "./models/admin-ai-chat-folder.model";
import {
  AdminAiChatMessage,
  AdminAiChatMessageDocument,
} from "./models/admin-ai-chat-message.model";
import {
  AdminAiChatThread,
  AdminAiChatThreadDocument,
} from "./models/admin-ai-chat-thread.model";
import {
  AdminAiChatToolRun,
  AdminAiChatToolRunDocument,
} from "./models/admin-ai-chat-tool-run.model";

type CreateThreadInput = {
  title?: string;
  folderId?: string | null;
};

type SendMessageInput = {
  message?: string;
  model?: string;
  modelPreset?: string;
  accessMode?: AdminAiAccessMode;
};

type UpdateThreadInput = {
  title?: string;
  folderId?: string | null;
  isPinned?: boolean;
};

type FolderInput = {
  name?: string;
};

@Injectable()
export class AdminAiChatService {
  constructor(
    @InjectModel(AdminAiChatFolder.name, ADMIN_AI_CONNECTION_NAME)
    private readonly folderModel: Model<AdminAiChatFolderDocument>,
    @InjectModel(AdminAiChatThread.name, ADMIN_AI_CONNECTION_NAME)
    private readonly threadModel: Model<AdminAiChatThreadDocument>,
    @InjectModel(AdminAiChatMessage.name, ADMIN_AI_CONNECTION_NAME)
    private readonly messageModel: Model<AdminAiChatMessageDocument>,
    @InjectModel(AdminAiChatToolRun.name, ADMIN_AI_CONNECTION_NAME)
    private readonly toolRunModel: Model<AdminAiChatToolRunDocument>,
    private readonly adminAiConfig: AdminAiChatConfigService,
    private readonly openAiService: AdminAiOpenAiService,
    private readonly fomoV2ContextService: FomoV2AiContextService,
    private readonly redactionService: FomoV2AiRedactionService,
    @Optional()
    private readonly toolAuditService?: AdminAiToolAuditService
  ) {}

  async createThread(adminId: string, input: CreateThreadInput = {}) {
    this.ensureChatEnabled();

    const createdBy = this.parseObjectId(adminId, "Invalid admin id");
    const title = this.normalizeTitle(input.title);
    const folderId = await this.resolveFolderId(adminId, input.folderId);

    return this.threadModel.create({
      title,
      createdBy,
      folderId,
    });
  }

  getModels() {
    this.ensureChatEnabled();

    return {
      models: this.openAiService.getAvailableModels(),
      defaultModel: this.openAiService.getDefaultModel(),
      presets: this.openAiService.getModelPresets(),
      defaultPreset: this.openAiService.getDefaultModelPreset(),
    };
  }

  async getFolders(adminId: string) {
    this.ensureChatEnabled();

    const createdBy = this.parseObjectId(adminId, "Invalid admin id");

    return this.folderModel
      .find({ createdBy })
      .sort({ updatedAt: -1, _id: -1 })
      .lean();
  }

  async createFolder(adminId: string, input: FolderInput = {}) {
    this.ensureChatEnabled();

    const createdBy = this.parseObjectId(adminId, "Invalid admin id");
    const name = this.normalizeFolderName(input.name);

    return this.folderModel.create({
      name,
      createdBy,
    });
  }

  async updateFolder(adminId: string, folderId: string, input: FolderInput = {}) {
    this.ensureChatEnabled();

    const folder = await this.getFolderForAdmin(adminId, folderId);
    const name = this.normalizeFolderName(input.name);

    const updated = await this.folderModel
      .findOneAndUpdate(
        { _id: folder._id, createdBy: folder.createdBy },
        { $set: { name, updatedAt: new Date() } },
        { new: true }
      )
      .lean();

    return updated || folder;
  }

  async deleteFolder(adminId: string, folderId: string) {
    this.ensureChatEnabled();

    const folder = await this.getFolderForAdmin(adminId, folderId);
    const threadUpdate = await this.threadModel.updateMany(
      { createdBy: folder.createdBy, folderId: folder._id },
      { $set: { folderId: null, updatedAt: new Date() } }
    );
    await this.folderModel.deleteOne({ _id: folder._id, createdBy: folder.createdBy });

    return {
      deleted: true,
      folderId: folder._id,
      movedThreads: threadUpdate.modifiedCount || 0,
    };
  }

  async getThreads(adminId: string) {
    this.ensureChatEnabled();

    const createdBy = this.parseObjectId(adminId, "Invalid admin id");

    return this.threadModel.aggregate([
      { $match: { createdBy } },
      { $sort: { isPinned: -1, updatedAt: -1, _id: -1 } },
      { $limit: 50 },
      {
        $lookup: {
          from: this.messageModel.collection.name,
          let: { threadId: "$_id" },
          pipeline: [
            {
              $match: {
                $expr: { $eq: ["$threadId", "$$threadId"] },
              },
            },
            { $sort: { createdAt: -1, _id: -1 } },
            { $limit: 1 },
            {
              $project: {
                role: 1,
                content: 1,
                status: 1,
                createdAt: 1,
              },
            },
          ],
          as: "lastMessage",
        },
      },
      {
        $unwind: {
          path: "$lastMessage",
          preserveNullAndEmptyArrays: true,
        },
      },
    ]);
  }

  async getMessages(adminId: string, threadId: string) {
    this.ensureChatEnabled();

    const thread = await this.getThreadForAdmin(adminId, threadId);

    return this.messageModel
      .find({ threadId: thread._id })
      .sort({ createdAt: 1, _id: 1 })
      .lean();
  }

  async updateThread(adminId: string, threadId: string, input: UpdateThreadInput = {}) {
    this.ensureChatEnabled();

    const thread = await this.getThreadForAdmin(adminId, threadId);
    const $set: Record<string, unknown> = {
      updatedAt: new Date(),
    };

    if (Object.prototype.hasOwnProperty.call(input, "title")) {
      $set.title = this.normalizeTitle(input.title);
    }

    if (Object.prototype.hasOwnProperty.call(input, "folderId")) {
      $set.folderId = await this.resolveFolderId(adminId, input.folderId);
    }

    if (typeof input.isPinned === "boolean") {
      $set.isPinned = input.isPinned;
    }

    const updated = await this.threadModel
      .findOneAndUpdate(
        { _id: thread._id, createdBy: thread.createdBy },
        { $set },
        { new: true }
      )
      .lean();

    return updated || thread;
  }

  async deleteThread(adminId: string, threadId: string) {
    this.ensureChatEnabled();

    const thread = await this.getThreadForAdmin(adminId, threadId);

    await Promise.all([
      this.messageModel.deleteMany({ threadId: thread._id }),
      this.toolRunModel.deleteMany({ threadId: thread._id }),
    ]);
    await this.threadModel.deleteOne({ _id: thread._id, createdBy: thread.createdBy });

    return {
      deleted: true,
      threadId: thread._id,
    };
  }

  async sendMessage(adminId: string, threadId: string, input: SendMessageInput) {
    this.ensureChatEnabled();

    const thread = await this.getThreadForAdmin(adminId, threadId);
    const prompt = String(input.message || "").trim();
    const modelPreset = this.openAiService.resolveModelPresetKey(input.modelPreset);
    const model = this.openAiService.resolveModel(input.model, modelPreset);
    const accessMode = this.adminAiConfig.normalizeAccessMode(input.accessMode);

    if (!prompt) {
      throw new BadRequestException("Message is required");
    }

    const userMessage = await this.messageModel.create({
      threadId: thread._id,
      role: "user",
      content: prompt,
      status: "done",
      metadata: {
        source: "admin-ai-chat",
        scope: "fomo-v2-crypto-data",
        dbTarget: this.adminAiConfig.getDbName(),
        requestedModel: model,
        requestedModelPreset: modelPreset,
        accessMode,
      },
    });

    const history = await this.messageModel
      .find({ threadId: thread._id, _id: { $ne: userMessage._id } })
      .sort({ createdAt: -1, _id: -1 })
      .limit(12)
      .lean();
    const cryptoContext = await this.fomoV2ContextService.getDefaultContext();
    const assistantResponse = await this.openAiService.createResponse({
      prompt,
      history: history.reverse().map((message) => ({
        role: message.role,
        content: message.content,
        createdAt: message.createdAt,
      })),
      cryptoContext,
      model,
      modelPreset,
      toolContext: {
        userId: String(adminId),
        chatId: String(thread._id),
        messageId: String(userMessage._id),
        accessMode,
      },
    });

    const assistantMetadata = this.buildAssistantMetadata(assistantResponse.metadata);
    const assistantMessage = await this.messageModel.create({
      threadId: thread._id,
      role: "assistant",
      content: assistantResponse.content,
      status: assistantResponse.status,
      metadata: assistantMetadata,
    });
    await this.saveToolRuns(thread._id, assistantMessage._id, assistantResponse.metadata);

    await this.threadModel.updateOne(
      { _id: thread._id },
      {
        $set: {
          title: thread.title === "New chat" ? this.normalizeTitle(prompt) : thread.title,
          updatedAt: new Date(),
        },
      }
    );

    return {
      threadId: thread._id,
      userMessage,
      assistantMessage,
    };
  }

  private async getThreadForAdmin(adminId: string, threadId: string) {
    const createdBy = this.parseObjectId(adminId, "Invalid admin id");
    const _id = this.parseObjectId(threadId, "Invalid thread id");
    const thread = await this.threadModel.findOne({ _id, createdBy });

    if (!thread) {
      throw new NotFoundException("AI chat thread not found");
    }

    return thread;
  }

  async getToolRuns(adminId: string, threadId: string, messageId: string) {
    this.ensureChatEnabled();

    const thread = await this.getThreadForAdmin(adminId, threadId);
    const _id = this.parseObjectId(messageId, "Invalid message id");
    const message = await this.messageModel
      .findOne({ _id, threadId: thread._id })
      .select("_id threadId role")
      .lean();

    if (!message) {
      throw new NotFoundException("AI chat message not found");
    }

    const toolRuns = await this.toolRunModel
      .find({ threadId: thread._id, messageId: _id })
      .select(
        "_id name status durationMs resultSummary errorCode provider model trackingId createdAt updatedAt"
      )
      .sort({ createdAt: 1, _id: 1 })
      .lean();

    return toolRuns.map((toolRun) => ({
      _id: String(toolRun._id),
      name: toolRun.name,
      status: toolRun.status,
      durationMs: Number(toolRun.durationMs || 0),
      provider: toolRun.provider,
      model: toolRun.model,
      trackingId: toolRun.trackingId,
      errorCode: toolRun.errorCode,
      resultSummary: this.redactionService.redact(toolRun.resultSummary || {}, {
        maxDepth: 4,
        maxArrayLength: 30,
        maxStringLength: 1000,
      }) as Record<string, unknown>,
      createdAt: toolRun.createdAt,
      updatedAt: toolRun.updatedAt,
    }));
  }

  async approveToolRun(
    adminId: string,
    toolRunId: string,
    approvalInput: { editedPayload?: unknown; adminNote?: string } = {}
  ) {
    this.ensureChatEnabled();
    this.parseObjectId(adminId, "Invalid admin id");

    if (!this.toolAuditService) {
      throw new BadRequestException("Tool audit service is unavailable");
    }

    const existing = await this.toolAuditService.getToolRun(toolRunId);
    if (!existing) {
      throw new NotFoundException("AI tool run not found");
    }

    if (existing.approvalStatus !== "pending") {
      throw new BadRequestException("AI tool run is not pending approval");
    }

    const approved = await this.toolAuditService.markApprovedExecuting(
      toolRunId,
      adminId,
      approvalInput
    );
    if (!approved) {
      throw new BadRequestException("AI tool run could not be approved");
    }

    const executionInput = {
      ...((existing.input || {}) as Record<string, unknown>),
      approvedPlannedChanges: existing.plannedChanges,
      editedPayload: approvalInput.editedPayload,
      adminNote: approvalInput.adminNote,
      dryRun: false,
      confirm: true,
    };
    const result = await this.openAiService.executeTool(
      existing.toolName,
      executionInput,
      {
        userId: adminId,
        chatId: existing.chatId,
        messageId: existing.messageId,
        accessMode: "full_access",
        approvalExecution: true,
      }
    );
    const status = (result as any)?.data?.error
      ? "error"
      : (result as any)?.data?.status === "blocked"
        ? "blocked"
        : "done";
    const updated = await this.toolAuditService.markExecuted(
      toolRunId,
      result,
      status
    );
    await this.toolRunModel.updateOne(
      {
        messageId: existing.messageId,
        "resultSummary.toolRunId": toolRunId,
      },
      {
        $set: {
          status,
          resultSummary: {
            ...(updated?.resultSummary || {}),
            toolRunId,
            approvalStatus: "approved",
          },
          errorCode: (result as any)?.data?.errorCode,
        },
      }
    );

    return {
      toolRunId,
      approvalStatus: "approved",
      status,
      resultSummary: updated?.resultSummary || {},
      createdCount: updated?.createdCount || 0,
      updatedCount: updated?.updatedCount || 0,
      modifiedCount: updated?.modifiedCount || 0,
      affectedIds: updated?.affectedIds || [],
      error: updated?.error,
    };
  }

  async rejectToolRun(adminId: string, toolRunId: string) {
    this.ensureChatEnabled();
    this.parseObjectId(adminId, "Invalid admin id");

    if (!this.toolAuditService) {
      throw new BadRequestException("Tool audit service is unavailable");
    }

    const existing = await this.toolAuditService.getToolRun(toolRunId);
    if (!existing) {
      throw new NotFoundException("AI tool run not found");
    }

    if (existing.approvalStatus !== "pending") {
      throw new BadRequestException("AI tool run is not pending approval");
    }

    const updated = await this.toolAuditService.markRejected(toolRunId, adminId);
    await this.toolRunModel.updateOne(
      {
        messageId: existing.messageId,
        "resultSummary.toolRunId": toolRunId,
      },
      {
        $set: {
          status: "blocked",
          "resultSummary.status": "rejected",
          "resultSummary.approvalStatus": "rejected",
        },
      }
    );
    return {
      toolRunId,
      approvalStatus: "rejected",
      status: updated?.status || "blocked",
    };
  }

  private async getFolderForAdmin(adminId: string, folderId: string) {
    const createdBy = this.parseObjectId(adminId, "Invalid admin id");
    const _id = this.parseObjectId(folderId, "Invalid folder id");
    const folder = await this.folderModel.findOne({ _id, createdBy });

    if (!folder) {
      throw new NotFoundException("AI chat folder not found");
    }

    return folder;
  }

  private async resolveFolderId(adminId: string, folderId?: string | null) {
    if (!folderId) return null;

    const folder = await this.getFolderForAdmin(adminId, folderId);

    return folder._id;
  }

  private parseObjectId(value: string, errorMessage: string): mongoose.Types.ObjectId {
    if (!mongoose.Types.ObjectId.isValid(value)) {
      throw new BadRequestException(errorMessage);
    }

    return new mongoose.Types.ObjectId(value);
  }

  private normalizeTitle(value?: string): string {
    const title = String(value || "").trim();

    if (!title) return "New chat";

    return title.length > 90 ? `${title.slice(0, 87)}...` : title;
  }

  private normalizeFolderName(value?: string): string {
    const name = String(value || "").trim();

    if (!name) {
      throw new BadRequestException("Folder name is required");
    }

    return name.length > 64 ? name.slice(0, 64) : name;
  }

  private ensureChatEnabled() {
    this.adminAiConfig.ensureChatEnabled();
  }

  private buildAssistantMetadata(metadata: Record<string, unknown>) {
    const toolCalls = this.extractToolCalls(metadata);
    const artifacts = toolCalls
      .map((toolCall) => toolCall.resultSummary?.artifact)
      .filter(
        (artifact): artifact is Record<string, unknown> =>
          Boolean(artifact) &&
          typeof artifact === "object" &&
          typeof (artifact as Record<string, unknown>).id === "string"
      )
      .filter(
        (artifact, index, items) =>
          items.findIndex((item) => item.id === artifact.id) === index
      )
      .slice(0, 10)
      .map((artifact) => ({
        id: this.stringValue(artifact.id),
        kind: this.stringValue(artifact.kind),
        collectionName: this.stringValue(artifact.collectionName),
        filename: this.stringValue(artifact.filename),
        format: this.stringValue(artifact.format),
        compression: this.stringValue(artifact.compression),
        status: this.stringValue(artifact.status),
        progress: Number(artifact.progress || 0),
        documentCount: Number(artifact.documentCount || 0),
        bytes: Number(artifact.bytes || 0),
        expiresAt: artifact.expiresAt,
      }));

    return {
      provider: this.stringValue(metadata.provider),
      model: this.stringValue(metadata.model),
      requestId: this.optionalString(metadata.requestId),
      requestIds: Array.isArray(metadata.requestIds)
        ? metadata.requestIds.map((item) => this.stringValue(item)).filter(Boolean).slice(0, 10)
        : [],
      durationMs: Number(metadata.durationMs || 0),
      status: this.stringValue(metadata.status),
      errorCode: this.optionalString(metadata.errorCode),
      trackingId: this.stringValue(metadata.trackingId),
      accessMode: this.stringValue(metadata.accessMode),
      modelPreset: this.optionalString(metadata.modelPreset),
      modelPresetLabel: this.optionalString(metadata.modelPresetLabel),
      reasoningEffort: this.optionalString(metadata.reasoningEffort),
      maxToolIterations: Number(metadata.maxToolIterations || 0),
      timeoutMs: Number(metadata.timeoutMs || 0),
      toolCallsSummary: {
        count: toolCalls.length,
        names: Array.from(new Set(toolCalls.map((toolCall) => toolCall.name))).slice(0, 20),
        statuses: toolCalls.reduce(
          (acc, toolCall) => ({
            ...acc,
            [toolCall.status]: Number((acc as any)[toolCall.status] || 0) + 1,
          }),
          {} as Record<string, number>
        ),
      },
      artifacts,
      scope: "fomo-v2-crypto-data",
      dbTarget: this.adminAiConfig.getDbName(),
    };
  }

  private async saveToolRuns(
    threadId: mongoose.Types.ObjectId,
    messageId: mongoose.Types.ObjectId,
    metadata: Record<string, unknown>
  ) {
    const toolCalls = this.extractToolCalls(metadata);
    if (!toolCalls.length) return;

    const provider = this.stringValue(metadata.provider);
    const model = this.stringValue(metadata.model);
    const trackingId = this.stringValue(metadata.trackingId);

    await this.toolRunModel.create(
      toolCalls.map((toolCall) => ({
        threadId,
        messageId,
        name: toolCall.name,
        arguments: toolCall.arguments || {},
        status: toolCall.status,
        durationMs: toolCall.durationMs,
        resultSummary: toolCall.resultSummary || {},
        errorCode: toolCall.errorCode,
        provider,
        model,
        trackingId,
      }))
    );
  }

  private extractToolCalls(metadata: Record<string, unknown>): FomoV2AiToolCallRecord[] {
    const value = metadata.toolCalls;
    if (!Array.isArray(value)) return [];

    return value
      .filter((item): item is FomoV2AiToolCallRecord => {
        return (
          Boolean(item) &&
          typeof item === "object" &&
            typeof (item as any).name === "string" &&
          ["done", "error", "blocked", "pending"].includes(String((item as any).status))
        );
      })
      .slice(0, 50);
  }

  private stringValue(value: unknown): string {
    return String(value || "").trim();
  }

  private optionalString(value: unknown): string | undefined {
    const normalized = this.stringValue(value);
    return normalized || undefined;
  }
}
