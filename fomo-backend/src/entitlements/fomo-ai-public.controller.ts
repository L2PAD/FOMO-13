import { Body, Controller, Get, Param, Post, Query, Req, UseGuards } from "@nestjs/common";
import { InjectModel } from "@nestjs/mongoose";
import { Model, Types } from "mongoose";
import { Request } from "express";
import { JwtAuthGuard } from "src/auth/jwt.auth.guard";
import { AccessResolverService } from "./access-resolver.service";
import { AiCreditsService } from "./ai-credits.service";
import { FomoAiService } from "./ai/fomo-ai.service";
import { AiConversation } from "./models/ai-conversation.model";
import { AiMessage } from "./models/ai-conversation.model";
import { AiUsageEvent } from "./models/ai-credit.model";

// User-facing catalog of AI operations (labels + capability). Model choice is a
// backend concern and is intentionally NOT exposed to the user.
const OPERATIONS = [
  { operation: "ask_fomo", label: "Ask FOMO", description: "Ask anything about crypto using FOMO data.", capability: "fomo_ai.access" },
  { operation: "token_analysis", label: "Analyze Project", description: "Deep analysis of a single project using FOMO data.", capability: "fomo_ai.access" },
  { operation: "compare_projects", label: "Compare Projects", description: "Compare projects side by side.", capability: "fomo_ai.access" },
  { operation: "market_brief", label: "Market Brief", description: "What changed in crypto today.", capability: "fomo_ai.access" },
  { operation: "portfolio_analysis", label: "Portfolio Review", description: "Review your portfolio with market context.", capability: "fomo_ai.portfolio_analysis" },
  { operation: "deep_research", label: "Deep Research", description: "Broad research across all FOMO data.", capability: "fomo_ai.deep_research" },
];

/**
 * Public FOMO AI product surface. Every request goes through the canonical
 * FomoAiGateway (access -> reserve -> knowledge/tools -> provider -> capture)
 * and FomoKnowledgeProvider. Presentation-only conversation storage is kept
 * separate from the usage/credit ledger.
 */
@Controller("fomo-ai")
@UseGuards(JwtAuthGuard)
export class FomoAiPublicController {
  constructor(
    @InjectModel(AiConversation.name) private readonly convModel: Model<any>,
    @InjectModel(AiMessage.name) private readonly msgModel: Model<any>,
    @InjectModel(AiUsageEvent.name) private readonly usageModel: Model<any>,
    private readonly access: AccessResolverService,
    private readonly credits: AiCreditsService,
    private readonly fomoAi: FomoAiService,
  ) {}

  // Friendly labels for operations shown in the charge-history feed.
  private readonly OP_LABELS: Record<string, string> = {
    ask_fomo: "Ask FOMO",
    token_analysis: "Analyze Project",
    compare_projects: "Compare Projects",
    market_brief: "Market Brief",
    portfolio_analysis: "Portfolio Review",
    deep_research: "Deep Research",
  };

  private uid(req: Request): string {
    const u = req.user as any;
    return String(u?._id || u?.id || "");
  }

  /** Membership + credit context for the FOMO AI screen. */
  @Get("context")
  async context(@Req() req: Request) {
    const userId = this.uid(req);
    const [aiAccess, balances] = await Promise.all([
      this.access.resolveAccess({ userId, capability: "fomo_ai.access" }),
      this.credits.getBalances(userId).catch(() => null),
    ]);
    // Per-operation access + estimate (transparent credit preview).
    const operations = await Promise.all(
      OPERATIONS.map(async (op) => {
        const [dec, est] = await Promise.all([
          this.access.resolveAccess({ userId, capability: op.capability }),
          this.fomoAi.estimate(userId, op.operation).catch(() => null),
        ]);
        return {
          ...op,
          allowed: !!dec.allowed,
          estimatedCredits: (est as any)?.estimatedCredits ?? null,
        };
      }),
    );
    return {
      access: {
        allowed: !!aiAccess.allowed,
        capability: "fomo_ai.access",
        reason: aiAccess.reason || null,
        source: (aiAccess as any).source || null,
        expiresAt: (aiAccess as any).validUntil || null,
        requirements: (aiAccess as any).requirements || [],
      },
      credits: balances
        ? { available: balances.available, monthly: balances.monthly, topup: balances.topup, reserved: balances.reserved, total: balances.total }
        : { available: 0, monthly: 0, topup: 0, reserved: 0, total: 0 },
      operations,
    };
  }

  @Get("estimate")
  async estimate(@Req() req: Request, @Query("operation") operation: string) {
    return this.fomoAi.estimate(this.uid(req), operation || "ask_fomo");
  }

  /**
   * Transparent per-request credit charge history for the signed-in user.
   * One row per monetized request (from the AiUsageEvent ledger). Shows how many
   * credits each request cost, the operation, tokens and whether it was a live or
   * demo answer. Only the user's own USER-billed events are returned.
   */
  @Get("usage")
  async usage(@Req() req: Request, @Query("limit") limit?: string) {
    const userId = this.uid(req);
    if (!Types.ObjectId.isValid(userId)) return { items: [], total: 0, totalCreditsSpent: 0 };
    const userOid = new Types.ObjectId(userId);
    const max = Math.min(Math.max(Number(limit) || 50, 1), 200);
    const events = await this.usageModel
      .find({ userId: userOid, billingContext: "USER" })
      .sort({ createdAt: -1 })
      .limit(max)
      .lean();

    const items = events.map((e: any) => {
      const credits = Number(e.creditsCaptured ?? e.creditsCharged ?? 0);
      return {
        id: String(e._id),
        createdAt: e.createdAt || e.completedAt || e.startedAt || null,
        operation: e.operationType || "",
        operationLabel: this.OP_LABELS[e.operationType] || e.operationType || "AI request",
        status: e.status || "",
        credits,
        creditsReserved: Number(e.creditsReserved ?? 0),
        inputTokens: Number(e.inputTokens ?? 0),
        outputTokens: Number(e.outputTokens ?? 0),
        totalTokens: Number(e.totalTokens ?? 0),
        model: e.model || "",
        dataMode: e.dataMode || "real",
        latencyMs: Number(e.latencyMs ?? 0),
      };
    });

    const totalCreditsSpent = items
      .filter((i) => i.status === "COMPLETED")
      .reduce((s, i) => s + (i.credits || 0), 0);

    return { items, total: items.length, totalCreditsSpent };
  }

  @Get("conversations")
  async conversations(@Req() req: Request) {
    const userId = new Types.ObjectId(this.uid(req));
    const items = await this.convModel
      .find({ userId, archivedAt: null })
      .sort({ lastMessageAt: -1 })
      .limit(50)
      .lean();
    return { items };
  }

  @Get("conversations/:id/messages")
  async messages(@Req() req: Request, @Param("id") id: string) {
    const userId = new Types.ObjectId(this.uid(req));
    if (!Types.ObjectId.isValid(id)) return { items: [] };
    const conv = await this.convModel.findOne({ _id: new Types.ObjectId(id), userId }).lean();
    if (!conv) return { items: [], notFound: true };
    const items = await this.msgModel.find({ conversationId: conv._id, userId }).sort({ createdAt: 1 }).lean();
    return { conversation: conv, items };
  }

  @Post("conversations/:id/archive")
  async archive(@Req() req: Request, @Param("id") id: string) {
    const userId = new Types.ObjectId(this.uid(req));
    await this.convModel.updateOne({ _id: new Types.ObjectId(id), userId }, { $set: { archivedAt: new Date() } });
    return { ok: true };
  }

  @Post("conversations/:id/rename")
  async rename(@Req() req: Request, @Param("id") id: string, @Body() body: { title?: string }) {
    const userId = new Types.ObjectId(this.uid(req));
    await this.convModel.updateOne({ _id: new Types.ObjectId(id), userId }, { $set: { title: String(body?.title || "Chat").slice(0, 120) } });
    return { ok: true };
  }

  /** Send a question. Creates a conversation on first message, runs the grounded
   *  gateway pipeline (USER billing), and persists both messages. */
  @Post("ask")
  async ask(@Req() req: Request, @Body() body: any) {
    const userId = this.uid(req);
    const userOid = new Types.ObjectId(userId);
    const operation = String(body?.operation || "ask_fomo");
    const query = String(body?.query || "").trim();
    if (!query) return { ok: false, errorCode: "empty_query" };
    const context = body?.context || null;

    // Resolve or create the conversation.
    let conv: any = null;
    if (body?.conversationId && Types.ObjectId.isValid(body.conversationId)) {
      conv = await this.convModel.findOne({ _id: new Types.ObjectId(body.conversationId), userId: userOid });
    }
    if (!conv) {
      conv = await this.convModel.create({
        userId: userOid,
        title: query.slice(0, 60),
        operation,
        context,
        lastMessageAt: new Date(),
      });
    }

    // Persist the user message first.
    await this.msgModel.create({ conversationId: conv._id, userId: userOid, role: "user", content: query, operation });

    // Run the canonical grounded pipeline (USER billing, capability-gated).
    const idempotencyKey = body?.idempotencyKey ? String(body.idempotencyKey) : `chat:${conv._id}:${Date.now()}`;
    const result: any = await this.fomoAi.ask({ userId, operation, query, idempotencyKey, billingContext: "USER" });

    if (result?.ok === false) {
      // Do NOT persist an assistant message on access/credit failure.
      return { ok: false, conversationId: String(conv._id), status: result.status, errorCode: result.errorCode, reason: result.reason, requirements: result.requirements, credits: result.credits };
    }

    const assistant = await this.msgModel.create({
      conversationId: conv._id,
      userId: userOid,
      role: "assistant",
      content: result.answer || "",
      operation,
      sections: result.sections || null,
      sources: result.presentationSources || result.sources || [],
      coverage: result.coverage || "",
      confidence: result.confidence || "",
      grounding: result.grounding || null,
      limitations: result.limitations || [],
      dataMode: result.dataMode || "",
      creditsCharged: result.usage?.creditsCharged ?? 0,
    });
    await this.convModel.updateOne({ _id: conv._id }, { $set: { lastMessageAt: new Date(), operation } });

    return {
      ok: true,
      conversationId: String(conv._id),
      message: {
        _id: String(assistant._id),
        role: "assistant",
        content: result.answer,
        sections: result.sections,
        grounding: result.grounding,
        confidence: result.confidence,
        sources: result.presentationSources || result.sources,
        coverage: result.coverage,
        limitations: result.limitations,
        dataMode: result.dataMode,
        provider: result.provider,
        retrieval: result.retrieval,
        dataFreshness: result.dataFreshness,
        usage: result.usage,
      },
    };
  }
}
