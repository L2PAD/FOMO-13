import mongoose from "mongoose";
import { ServiceUnavailableException } from "@nestjs/common";
import { AdminAiChatService } from "./admin-ai-chat.service";
import { AdminAiChatConfigService } from "./admin-ai-chat-config.service";
import { FomoV2AiRedactionService } from "./fomo-v2-context/fomo-v2-ai-redaction.service";

const adminId = new mongoose.Types.ObjectId().toString();
const threadId = new mongoose.Types.ObjectId();

function createService(env: Record<string, string | undefined>) {
  const folderModel = {
    create: jest.fn(async (payload) => ({ _id: new mongoose.Types.ObjectId(), ...payload })),
    findOne: jest.fn(async () => null),
  };
  const threadModel = {
    create: jest.fn(async (payload) => ({ _id: new mongoose.Types.ObjectId(), ...payload })),
  };
  const toolRunModel = {
    create: jest.fn(async (payload) => payload),
  };
  const configService = {
    get: jest.fn((key: string) => env[key]),
  };
  const adminAiConfig = new AdminAiChatConfigService(configService as any);

  return {
    service: new AdminAiChatService(
      folderModel as any,
      threadModel as any,
      {} as any,
      toolRunModel as any,
      adminAiConfig,
      {} as any,
      {} as any,
      new FomoV2AiRedactionService()
    ),
    folderModel,
    threadModel,
    toolRunModel,
  };
}

describe("AdminAiChatService DEV DB guard", () => {
  const safeAiEnv = {
    AI_ADMIN_CHAT_ENABLED: "true",
    AI_ADMIN_DB_TARGET: "development",
    AI_ADMIN_MONGO_URI:
      "mongodb://fomo_ai_dev_user:password@fomo-mongo:27017/fomo_dev?authSource=fomo_dev",
    AI_ADMIN_DB_NAME: "fomo_dev",
    AI_ADMIN_PARSER_DB_NAME: "parser_new_dev",
  };

  it("requires AI_ADMIN_DB_TARGET=development", async () => {
    const { service } = createService({
      AI_ADMIN_CHAT_ENABLED: "true",
      AI_ADMIN_MONGO_URI:
        "mongodb://fomo_ai_dev_user:password@fomo-mongo:27017/fomo_dev?authSource=fomo_dev",
      AI_ADMIN_DB_NAME: "fomo_dev",
      AI_ADMIN_PARSER_DB_NAME: "parser_new_dev",
    });

    await expect(service.createThread(adminId)).rejects.toBeInstanceOf(
      ServiceUnavailableException
    );
  });

  it("allows main DB_NAME=fomo_live when AI DB points to fomo_dev", async () => {
    const { service, threadModel } = createService({
      NODE_ENV: "production",
      DB_NAME: "fomo_live",
      DB_URL: "mongodb://example/fomo_live",
      ...safeAiEnv,
    });

    await expect(service.createThread(adminId)).resolves.toEqual(
      expect.objectContaining({ title: "New chat" })
    );
    expect(threadModel.create).toHaveBeenCalledTimes(1);
  });

  it("blocks AI_ADMIN_DB_NAME=fomo_live", async () => {
    const { service } = createService({
      ...safeAiEnv,
      AI_ADMIN_DB_NAME: "fomo_live",
    });

    await expect(service.createThread(adminId)).rejects.toBeInstanceOf(
      ServiceUnavailableException
    );
  });

  it("blocks AI_ADMIN_MONGO_URI containing fomo_live", async () => {
    const { service } = createService({
      ...safeAiEnv,
      AI_ADMIN_MONGO_URI:
        "mongodb://fomo_ai_dev_user:password@fomo-mongo:27017/fomo_live?authSource=fomo_live",
    });

    await expect(service.createThread(adminId)).rejects.toBeInstanceOf(
      ServiceUnavailableException
    );
  });

  it("blocks AI_ADMIN_MONGO_URI containing production-like markers", async () => {
    const productionLikeUris = [
      "mongodb://fomo_ai_dev_user:password@fomo-mongo:27017/fomo_prod?authSource=fomo_prod",
      "mongodb://fomo_ai_dev_user:password@fomo-mongo:27017/fomolive?authSource=fomolive",
      "mongodb://fomo_ai_dev_user:password@production-mongo:27017/fomo_dev?authSource=fomo_dev",
    ];

    for (const AI_ADMIN_MONGO_URI of productionLikeUris) {
      const { service } = createService({
        ...safeAiEnv,
        AI_ADMIN_MONGO_URI,
      });

      await expect(service.createThread(adminId)).rejects.toBeInstanceOf(
        ServiceUnavailableException
      );
    }
  });

  it("blocks AI_ADMIN_DB_TARGET=production", async () => {
    const { service } = createService({
      ...safeAiEnv,
      AI_ADMIN_DB_TARGET: "production",
    });

    await expect(service.createThread(adminId)).rejects.toBeInstanceOf(
      ServiceUnavailableException
    );
  });

  it("blocks missing AI_ADMIN_MONGO_URI with a controlled disabled response", async () => {
    const { service } = createService({
      ...safeAiEnv,
      AI_ADMIN_MONGO_URI: "",
    });

    await expect(service.createThread(adminId)).rejects.toBeInstanceOf(
      ServiceUnavailableException
    );
  });
});

describe("AdminAiChatService model options", () => {
  it("returns configured selectable models", () => {
    const configService = {
      get: jest.fn((key: string) => {
        const env: Record<string, string> = {
          AI_ADMIN_CHAT_ENABLED: "true",
          AI_ADMIN_DB_TARGET: "development",
          AI_ADMIN_MONGO_URI:
            "mongodb://fomo_ai_dev_user:password@fomo-mongo:27017/fomo_dev?authSource=fomo_dev",
          AI_ADMIN_DB_NAME: "fomo_dev",
          AI_ADMIN_PARSER_DB_NAME: "parser_new_dev",
        };
        return env[key];
      }),
    };
    const openAiService = {
      getAvailableModels: jest.fn(() => ["gpt-4.1-mini", "gpt-5.5"]),
      getDefaultModel: jest.fn(() => "gpt-4.1-mini"),
      getModelPresets: jest.fn(() => [
        {
          key: "review",
          label: "Review High Quality",
          model: "gpt-5.5",
          reasoningEffort: "high",
          maxToolIterations: 10,
          timeoutMs: 90000,
        },
      ]),
      getDefaultModelPreset: jest.fn(() => "review"),
    };
    const service = new AdminAiChatService(
      {} as any,
      {} as any,
      {} as any,
      {} as any,
      new AdminAiChatConfigService(configService as any),
      openAiService as any,
      {} as any,
      new FomoV2AiRedactionService()
    );

    expect(service.getModels()).toEqual({
      models: ["gpt-4.1-mini", "gpt-5.5"],
      defaultModel: "gpt-4.1-mini",
      presets: [
        {
          key: "review",
          label: "Review High Quality",
          model: "gpt-5.5",
          reasoningEffort: "high",
          maxToolIterations: 10,
          timeoutMs: 90000,
        },
      ],
      defaultPreset: "review",
    });
  });
});

describe("AdminAiChatService export artifact metadata", () => {
  it("stores only a compact artifact descriptor on the assistant message", () => {
    const { service } = createService({
      AI_ADMIN_CHAT_ENABLED: "true",
      AI_ADMIN_DB_TARGET: "development",
      AI_ADMIN_MONGO_URI:
        "mongodb://fomo_ai_dev_user:password@fomo-mongo:27017/fomo_dev?authSource=fomo_dev",
      AI_ADMIN_DB_NAME: "fomo_dev",
      AI_ADMIN_PARSER_DB_NAME: "parser_new_dev",
    });
    const artifactId = new mongoose.Types.ObjectId().toString();

    const metadata = (service as any).buildAssistantMetadata({
      provider: "openai",
      toolCalls: [
        {
          name: "fomoDevCreateJsonExport",
          status: "done",
          arguments: { collectionName: "canonical_projects" },
          durationMs: 5,
          resultSummary: {
            artifact: {
              id: artifactId,
              kind: "collection",
              collectionName: "canonical_projects",
              filename: "canonical-projects.jsonl.gz",
              format: "jsonl",
              compression: "gzip",
              status: "queued",
              progress: 0,
              secret: "must-not-be-copied",
            },
          },
        },
      ],
    });

    expect(metadata.artifacts).toEqual([
      expect.objectContaining({
        id: artifactId,
        collectionName: "canonical_projects",
        status: "queued",
      }),
    ]);
    expect(JSON.stringify(metadata)).not.toContain("must-not-be-copied");
  });
});

describe("AdminAiChatService message storage", () => {
  it("saves user and assistant fallback messages when OpenAI is unavailable", async () => {
    const thread = {
      _id: threadId,
      title: "New chat",
    };
    const createdMessages: any[] = [];
    const threadModel = {
      findOne: jest.fn(async () => thread),
      updateOne: jest.fn(async () => ({ modifiedCount: 1 })),
    };
    const messageModel = {
      create: jest.fn(async (payload) => {
        const message = {
          _id: new mongoose.Types.ObjectId(),
          createdAt: new Date(),
          ...payload,
        };
        createdMessages.push(message);
        return message;
      }),
      find: jest.fn(() => ({
        sort: jest.fn().mockReturnThis(),
        limit: jest.fn().mockReturnThis(),
        lean: jest.fn(async () => []),
      })),
    };
    const toolRunModel = {
      create: jest.fn(async (payload) => payload),
    };
    const openAiService = {
      resolveModelPresetKey: jest.fn((preset?: string) => preset || "review"),
      resolveModel: jest.fn((model?: string) => model || "gpt-4.1-mini"),
      createResponse: jest.fn(async () => ({
        content: "OpenAI is unavailable. Message saved.",
        status: "error",
        metadata: {
          provider: "openai",
          model: "gpt-4.1-mini",
          modelPreset: "review",
          modelPresetLabel: "Review High Quality",
          durationMs: 12,
          status: "error",
          errorCode: "missing_api_key",
        },
      })),
    };
    const fomoV2ContextService = {
      getDefaultContext: jest.fn(async () => ({ scope: "test" })),
    };
    const configService = {
      get: jest.fn((key: string) => {
        const env: Record<string, string> = {
          AI_ADMIN_CHAT_ENABLED: "true",
          AI_ADMIN_DB_TARGET: "development",
          AI_ADMIN_MONGO_URI:
            "mongodb://fomo_ai_dev_user:password@fomo-mongo:27017/fomo_dev?authSource=fomo_dev",
          AI_ADMIN_DB_NAME: "fomo_dev",
          AI_ADMIN_PARSER_DB_NAME: "parser_new_dev",
        };
        return env[key];
      }),
    };
    const service = new AdminAiChatService(
      {} as any,
      threadModel as any,
      messageModel as any,
      toolRunModel as any,
      new AdminAiChatConfigService(configService as any),
      openAiService as any,
      fomoV2ContextService as any,
      new FomoV2AiRedactionService()
    );

    const result = await service.sendMessage(adminId, String(threadId), {
      message: "Show collection stats",
      model: "gpt-5.5",
      modelPreset: "deepReview",
    });

    expect(result.userMessage).toEqual(
      expect.objectContaining({ role: "user", status: "done" })
    );
    expect(result.assistantMessage).toEqual(
      expect.objectContaining({
        role: "assistant",
        status: "error",
        metadata: expect.objectContaining({
          provider: "openai",
          model: "gpt-4.1-mini",
          modelPreset: "review",
          modelPresetLabel: "Review High Quality",
          durationMs: 12,
          status: "error",
          errorCode: "missing_api_key",
          scope: "fomo-v2-crypto-data",
          dbTarget: "fomo_dev",
        }),
      })
    );
    expect(messageModel.create).toHaveBeenCalledTimes(2);
    expect(createdMessages[0].metadata).toEqual(
      expect.objectContaining({
        requestedModel: "gpt-5.5",
        requestedModelPreset: "deepReview",
      })
    );
    expect(openAiService.createResponse).toHaveBeenCalledWith(
      expect.objectContaining({
        model: "gpt-5.5",
        modelPreset: "deepReview",
      })
    );
    expect(toolRunModel.create).not.toHaveBeenCalled();
    expect(createdMessages.map((message) => message.role)).toEqual([
      "user",
      "assistant",
    ]);
  });
});

describe("AdminAiChatService tool runs", () => {
  it("returns safe tool runs scoped to owned thread and message", async () => {
    const messageId = new mongoose.Types.ObjectId();
    const thread = {
      _id: threadId,
      createdBy: new mongoose.Types.ObjectId(adminId),
      title: "Tool run thread",
    };
    const messageFindOneChain = {
      select: jest.fn().mockReturnThis(),
      lean: jest.fn(async () => ({
        _id: messageId,
        threadId,
        role: "assistant",
      })),
    };
    const toolRunFindChain = {
      select: jest.fn().mockReturnThis(),
      sort: jest.fn().mockReturnThis(),
      lean: jest.fn(async () => [
        {
          _id: new mongoose.Types.ObjectId(),
          threadId,
          messageId,
          name: "fomoV2FindProject",
          status: "done",
          durationMs: 382,
          provider: "openai",
          model: "gpt-5.5",
          trackingId: "trace-1",
          arguments: { password: "must-not-leak" },
          resultSummary: {
            collectionsRead: ["canonical_projects"],
            secret: "must-redact",
          },
          createdAt: new Date("2026-07-02T00:00:00.000Z"),
        },
      ]),
    };
    const threadModel = {
      findOne: jest.fn(async () => thread),
    };
    const messageModel = {
      findOne: jest.fn(() => messageFindOneChain),
    };
    const toolRunModel = {
      find: jest.fn(() => toolRunFindChain),
    };
    const configService = {
      get: jest.fn((key: string) => {
        const env: Record<string, string> = {
          AI_ADMIN_CHAT_ENABLED: "true",
          AI_ADMIN_DB_TARGET: "development",
          AI_ADMIN_MONGO_URI:
            "mongodb://fomo_ai_dev_user:password@fomo-mongo:27017/fomo_dev?authSource=fomo_dev",
          AI_ADMIN_DB_NAME: "fomo_dev",
          AI_ADMIN_PARSER_DB_NAME: "parser_new_dev",
        };
        return env[key];
      }),
    };
    const service = new AdminAiChatService(
      {} as any,
      threadModel as any,
      messageModel as any,
      toolRunModel as any,
      new AdminAiChatConfigService(configService as any),
      {} as any,
      {} as any,
      new FomoV2AiRedactionService()
    );

    const result = await service.getToolRuns(adminId, String(threadId), String(messageId));

    expect(messageModel.findOne).toHaveBeenCalledWith({
      _id: messageId,
      threadId,
    });
    expect(toolRunModel.find).toHaveBeenCalledWith({ threadId, messageId });
    expect(result).toHaveLength(1);
    expect(result[0]).toEqual(
      expect.objectContaining({
        name: "fomoV2FindProject",
        status: "done",
        durationMs: 382,
        provider: "openai",
          model: "gpt-5.5",
        trackingId: "trace-1",
        resultSummary: expect.objectContaining({
          collectionsRead: ["canonical_projects"],
          secret: "[REDACTED]",
        }),
      })
    );
    expect(JSON.stringify(result)).not.toContain("must-not-leak");
  });
});

describe("AdminAiChatService tool run approvals", () => {
  const safeAiEnv = {
    AI_ADMIN_CHAT_ENABLED: "true",
    AI_ADMIN_DB_TARGET: "development",
    AI_ADMIN_MONGO_URI:
      "mongodb://fomo_ai_dev_user:password@fomo-mongo:27017/fomo_dev?authSource=fomo_dev",
    AI_ADMIN_DB_NAME: "fomo_dev",
    AI_ADMIN_PARSER_DB_NAME: "parser_new_dev",
    AI_ADMIN_WRITE_TOOLS_ENABLED: "true",
    AI_ADMIN_ALLOW_FULL_ACCESS_MODE: "true",
  };

  it("approves and executes a pending tool run", async () => {
    const auditRunId = new mongoose.Types.ObjectId().toString();
    const messageId = new mongoose.Types.ObjectId();
    const toolRunModel = {
      updateOne: jest.fn(async () => ({ modifiedCount: 1 })),
    };
    const openAiService = {
      executeTool: jest.fn(async () => ({
        tool: "fomoDevInsertOne",
        data: {
          status: "done",
          createdCount: 1,
          updatedCount: 0,
          modifiedCount: 0,
          affectedIds: ["created-1"],
        },
      })),
    };
    const toolAuditService = {
      getToolRun: jest.fn(async () => ({
        _id: auditRunId,
        approvalStatus: "pending",
        toolName: "fomoDevInsertOne",
        input: { collectionName: "ai_scratch", document: { name: "Draft" } },
        chatId: threadId,
        messageId,
      })),
      markApprovedExecuting: jest.fn(async () => ({ approvalStatus: "approved" })),
      markExecuted: jest.fn(async () => ({
        resultSummary: { status: "done", createdCount: 1 },
        createdCount: 1,
        updatedCount: 0,
        modifiedCount: 0,
        affectedIds: ["created-1"],
      })),
    };
    const configService = {
      get: jest.fn((key: string) => safeAiEnv[key as keyof typeof safeAiEnv]),
    };
    const service = new AdminAiChatService(
      {} as any,
      {} as any,
      {} as any,
      toolRunModel as any,
      new AdminAiChatConfigService(configService as any),
      openAiService as any,
      {} as any,
      new FomoV2AiRedactionService(),
      toolAuditService as any
    );

    const result = await service.approveToolRun(adminId, auditRunId);

    expect(openAiService.executeTool).toHaveBeenCalledWith(
      "fomoDevInsertOne",
      expect.objectContaining({ dryRun: false, confirm: true }),
      expect.objectContaining({ accessMode: "full_access", approvalExecution: true })
    );
    expect(toolAuditService.markApprovedExecuting).toHaveBeenCalledWith(
      auditRunId,
      adminId,
      {}
    );
    expect(toolAuditService.markExecuted).toHaveBeenCalledWith(
      auditRunId,
      expect.any(Object),
      "done"
    );
    expect(toolRunModel.updateOne).toHaveBeenCalledWith(
      {
        messageId,
        "resultSummary.toolRunId": auditRunId,
      },
      expect.objectContaining({
        $set: expect.objectContaining({
          status: "done",
          resultSummary: expect.objectContaining({
            approvalStatus: "approved",
            toolRunId: auditRunId,
          }),
        }),
      })
    );
    expect(result).toEqual(
      expect.objectContaining({
        toolRunId: auditRunId,
        approvalStatus: "approved",
        status: "done",
        createdCount: 1,
      })
    );
  });

  it("approves a pending tool run with edited payload", async () => {
    const auditRunId = new mongoose.Types.ObjectId().toString();
    const messageId = new mongoose.Types.ObjectId();
    const editedPayload = {
      tokenAllocation: [
        { name: "Private Round", percent: 100, amount: 1000, saleId: 1, normalizedCategory: "private" },
      ],
      vestingRounds: [],
      vestingSummary: {},
      vestingSchedule: [],
      vestingTimeline: [],
    };
    const toolRunModel = {
      updateOne: jest.fn(async () => ({ modifiedCount: 1 })),
    };
    const openAiService = {
      executeTool: jest.fn(async () => ({
        tool: "fomoV2BuildVestingReviewProposal",
        data: {
          status: "done",
          responseType: "vesting_review_compare",
          editedPayloadApplied: true,
          modifiedCount: 1,
          affectedIds: ["vesting-1"],
        },
      })),
    };
    const toolAuditService = {
      getToolRun: jest.fn(async () => ({
        _id: auditRunId,
        approvalStatus: "pending",
        toolName: "fomoV2BuildVestingReviewProposal",
        input: { outputMode: "write_proposal", dryRun: true },
        plannedChanges: [{ collectionName: "token_allocations", operation: "updateOne" }],
        chatId: threadId,
        messageId,
      })),
      markApprovedExecuting: jest.fn(async () => ({ approvalStatus: "approved" })),
      markExecuted: jest.fn(async () => ({
        resultSummary: { status: "done", responseType: "vesting_review_compare", editedPayloadApplied: true },
        createdCount: 0,
        updatedCount: 0,
        modifiedCount: 1,
        affectedIds: ["vesting-1"],
      })),
    };
    const configService = {
      get: jest.fn((key: string) => safeAiEnv[key as keyof typeof safeAiEnv]),
    };
    const service = new AdminAiChatService(
      {} as any,
      {} as any,
      {} as any,
      toolRunModel as any,
      new AdminAiChatConfigService(configService as any),
      openAiService as any,
      {} as any,
      new FomoV2AiRedactionService(),
      toolAuditService as any
    );

    const result = await service.approveToolRun(adminId, auditRunId, {
      editedPayload,
      adminNote: "approved edited",
    });

    expect(toolAuditService.markApprovedExecuting).toHaveBeenCalledWith(
      auditRunId,
      adminId,
      { editedPayload, adminNote: "approved edited" }
    );
    expect(openAiService.executeTool).toHaveBeenCalledWith(
      "fomoV2BuildVestingReviewProposal",
      expect.objectContaining({
        editedPayload,
        adminNote: "approved edited",
        dryRun: false,
        confirm: true,
      }),
      expect.objectContaining({ approvalExecution: true })
    );
    expect(result).toEqual(
      expect.objectContaining({
        toolRunId: auditRunId,
        status: "done",
        modifiedCount: 1,
      })
    );
  });

  it("rejects a pending tool run without executing it", async () => {
    const auditRunId = new mongoose.Types.ObjectId().toString();
    const messageId = new mongoose.Types.ObjectId();
    const toolRunModel = {
      updateOne: jest.fn(async () => ({ modifiedCount: 1 })),
    };
    const openAiService = {
      executeTool: jest.fn(),
    };
    const toolAuditService = {
      getToolRun: jest.fn(async () => ({
        _id: auditRunId,
        approvalStatus: "pending",
        toolName: "fomoDevInsertOne",
        input: {},
        chatId: threadId,
        messageId,
      })),
      markRejected: jest.fn(async () => ({ status: "blocked" })),
    };
    const configService = {
      get: jest.fn((key: string) => safeAiEnv[key as keyof typeof safeAiEnv]),
    };
    const service = new AdminAiChatService(
      {} as any,
      {} as any,
      {} as any,
      toolRunModel as any,
      new AdminAiChatConfigService(configService as any),
      openAiService as any,
      {} as any,
      new FomoV2AiRedactionService(),
      toolAuditService as any
    );

    const result = await service.rejectToolRun(adminId, auditRunId);

    expect(openAiService.executeTool).not.toHaveBeenCalled();
    expect(toolAuditService.markRejected).toHaveBeenCalledWith(auditRunId, adminId);
    expect(toolRunModel.updateOne).toHaveBeenCalledWith(
      {
        messageId,
        "resultSummary.toolRunId": auditRunId,
      },
      expect.objectContaining({
        $set: expect.objectContaining({
          status: "blocked",
          "resultSummary.approvalStatus": "rejected",
        }),
      })
    );
    expect(result).toEqual({
      toolRunId: auditRunId,
      approvalStatus: "rejected",
      status: "blocked",
    });
  });
});
