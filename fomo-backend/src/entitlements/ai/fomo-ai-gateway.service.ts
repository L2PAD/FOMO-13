import { Injectable, Logger, ServiceUnavailableException } from "@nestjs/common";
import { InjectModel } from "@nestjs/mongoose";
import { Model, Types } from "mongoose";
import { randomUUID } from "crypto";
import { AccessResolverService } from "../access-resolver.service";
import { AiCreditsService } from "../ai-credits.service";
import { AiCreditRule, AiUsageEvent } from "../models/ai-credit.model";
import { AiProviderPricingService } from "./ai-provider-pricing.service";
import { CreditPricingService } from "./credit-pricing.service";
import { OpenAiProvider } from "./openai.provider";
import { MockAiProvider } from "./mock.provider";
import { AiProvider } from "./ai-provider.types";

export type BillingContext = "USER" | "INTERNAL" | "SYSTEM";

export interface GatewayInput {
  userId: string;
  operation: string;
  input: string | Array<Record<string, any>>;
  capability?: string;
  billingContext?: BillingContext;
  modelPolicy?: Record<string, any>;
  system?: string;
  idempotencyKey?: string;
  context?: Record<string, any>;
  forceMock?: boolean;
  // P9 execution modes
  mode?: "CHAT" | "STRUCTURED" | "TOOL_LOOP";
  jsonSchema?: any;
  tools?: any[];
  executeTool?: (name: string, args: any) => Promise<{ output: string; record?: any; costUsd?: number }>;
  maxIterations?: number;
  reasoningEffort?: string;
  model?: string;
  // P14 budget guard
  budget?: { maxToolCalls?: number; maxToolCostUsd?: number; maxRequestCostUsd?: number };
}

// Default model per model-class (used when a rule has no explicit modelPolicy.model).
const MODEL_CLASS_DEFAULTS: Record<string, string> = {
  FAST: "gpt-4.1-mini",
  STANDARD: "gpt-4.1",
  REASONING: "gpt-5.5",
  DEEP_RESEARCH: "gpt-5.5",
};

/**
 * FomoAiGateway (P2/P7/P8) — the SINGLE entry point for every monetized AI call.
 *
 * Pipeline: access -> rule -> model -> estimate -> reserve -> provider ->
 * real usage -> real cost -> capture/release -> AiUsageEvent -> metadata.
 *
 * No AI feature may call a provider, compute credits or move the ledger on its
 * own. billingContext splits USER (spends credits, needs capability) from
 * INTERNAL/SYSTEM (no user credits; provider cost still logged as COGS).
 * Idempotency is ironclad: the usage event is CLAIMED (unique key) before any
 * provider call, so concurrent retries produce exactly one billable execution.
 */
@Injectable()
export class FomoAiGateway {
  private readonly logger = new Logger("FomoAiGateway");

  constructor(
    @InjectModel(AiCreditRule.name) private readonly ruleModel: Model<any>,
    @InjectModel(AiUsageEvent.name) private readonly usageModel: Model<any>,
    private readonly access: AccessResolverService,
    private readonly credits: AiCreditsService,
    private readonly providerPricing: AiProviderPricingService,
    private readonly creditPricing: CreditPricingService,
    private readonly openai: OpenAiProvider,
    private readonly mock: MockAiProvider,
  ) {}

  private resolveModel(rule: any, modelPolicy?: Record<string, any>, defaultModel?: string): string {
    return (
      modelPolicy?.model ||
      rule?.modelPolicy?.model ||
      MODEL_CLASS_DEFAULTS[rule?.modelClass] ||
      (defaultModel && defaultModel.trim()) ||
      "gpt-4.1"
    );
  }

  /**
   * Provider selection (spec §2: no silent fallback).
   * - forceMock (dev/test) or activeProvider='mock' → MOCK (clearly marked).
   * - selected real provider configured → REAL.
   * - selected real provider NOT configured → throw Provider unavailable
   *   (unless fallback is explicitly enabled).
   */
  private async pickProvider(forceMock?: boolean): Promise<{ provider: AiProvider; dataMode: "real" | "mock" }> {
    let raw: any = {};
    try {
      raw = await this.providerPricing.getRawSettings();
    } catch {
      raw = {};
    }
    const mode = String(raw.activeProvider || process.env.AI_PROVIDER || "openai");
    if (forceMock || mode === "mock") return { provider: this.mock, dataMode: "mock" };

    await this.openai.refresh();
    if (this.openai.isConfigured()) return { provider: this.openai, dataMode: "real" };

    const fallbackEnabled = raw.fallbackEnabled === true;
    if (fallbackEnabled) return { provider: this.mock, dataMode: "mock" };

    throw new ServiceUnavailableException({
      error: "provider_unavailable",
      reason: mode === "emergent" ? "EMERGENT_KEY_MISSING" : "OPENAI_API_KEY_MISSING",
      message:
        mode === "emergent"
          ? "Провайдер Emergent LLM недоступен: ключ не задан."
          : "Провайдер OpenAI недоступен: API-ключ не задан. Переключитесь на Emergent или задайте ключ OpenAI.",
    });
  }

  /**
   * Admin "Проверить ключ" — live connectivity probe for the active provider.
   * Syncs runtime config from DB, then makes a minimal, UNBILLED provider call
   * (no ledger, no usage event) and reports the real connection status.
   * Never throws: always returns a structured { ok, ... } result.
   */
  async testConnection(preferModel?: string): Promise<{
    ok: boolean;
    mode: string;
    provider?: string;
    model?: string;
    latencyMs?: number;
    sample?: string;
    reason?: string;
    message: string;
    status?: number | null;
  }> {
    await this.openai.refresh();
    let raw: any = {};
    try {
      raw = await this.providerPricing.getRawSettings();
    } catch {
      raw = {};
    }
    const mode = String(raw.activeProvider || process.env.AI_PROVIDER || "openai");

    if (mode === "mock") {
      return { ok: true, mode, message: "Mock-режим активен: реальные запросы к провайдеру не выполняются, списаний нет." };
    }
    if (!this.openai.isConfigured()) {
      return {
        ok: false,
        mode,
        reason: "no_key",
        message:
          mode === "emergent"
            ? "Ключ Emergent LLM не задан. Укажите ключ и base URL, сохраните настройки и повторите."
            : "API-ключ OpenAI не задан. Укажите ключ (или задайте OPEN_AI_SECRET_KEY в окружении), сохраните и повторите.",
      };
    }

    const model = String(preferModel || raw.defaultChatModel || "gpt-4.1-mini").trim() || "gpt-4.1-mini";
    const started = Date.now();
    try {
      const res: any = await this.openai.call({
        model,
        input: "ping",
        system: "You are a connectivity health-check. Reply with the single word: pong",
        maxOutputTokens: 16,
      });
      const latencyMs = Date.now() - started;
      const sample = String(res?.content || "").trim().slice(0, 120);
      return {
        ok: true,
        mode,
        provider: "openai",
        model: String(res?.model || model),
        latencyMs,
        sample,
        message: `Подключение успешно · модель ${res?.model || model} · ${latencyMs} мс`,
      };
    } catch (e: any) {
      const latencyMs = Date.now() - started;
      const status = e?.status ?? e?.response?.status ?? null;
      const detail = String(e?.message || e?.error?.message || e || "Неизвестная ошибка").slice(0, 300);
      return {
        ok: false,
        mode,
        provider: "openai",
        model,
        latencyMs,
        status,
        reason: "provider_error",
        message: `Ошибка подключения${status ? ` (HTTP ${status})` : ""}: ${detail}`,
      };
    }
  }

  private present(event: any) {
    return {
      requestId: event.requestId,
      operation: event.operationType,
      status: event.status,
      billingContext: event.billingContext,
      dataMode: event.dataMode,
      model: event.model,
      provider: event.modelProvider,
      content: event.metadata?.content ?? null,
      usage: {
        inputTokens: event.inputTokens,
        outputTokens: event.outputTokens,
        cachedInputTokens: event.cachedInputTokens,
        reasoningTokens: event.reasoningTokens,
        totalTokens: event.totalTokens,
      },
      cost: {
        providerCostUsd: event.providerCostUsd,
        infrastructureCostUsd: event.infrastructureCostUsd,
        totalCostUsd: event.totalCostUsd,
        costStatus: event.costStatus,
      },
      credits: {
        estimated: event.creditsEstimated,
        reserved: event.creditsReserved,
        captured: event.creditsCaptured,
        released: event.creditsReleased,
      },
      errorCode: event.errorCode || null,
      latencyMs: event.latencyMs,
      // P9 TOOL_LOOP extras
      toolRecords: event.toolUsage || [],
      requestIds: event.metadata?.requestIds || [],
      providerStatus: event.metadata?.providerStatus || "completed",
      toolIterationLimitReached: event.metadata?.toolIterationLimitReached || false,
      budgetStopped: event.metadata?.budgetStopped || false,
      costBreakdown: event.costBreakdown || null,
    };
  }

  async execute(inp: GatewayInput) {
    const billingContext: BillingContext = inp.billingContext || "USER";
    // Sync runtime provider config (key/baseURL/active provider) from DB first.
    await this.openai.refresh();
    const idempotencyKey = inp.idempotencyKey || `auto:${randomUUID()}`;
    const requestId = randomUUID();
    const SYSTEM_UID = new Types.ObjectId("000000000000000000000000");
    const userIdOid = Types.ObjectId.isValid(inp.userId)
      ? new Types.ObjectId(inp.userId)
      : billingContext !== "USER"
        ? SYSTEM_UID
        : null;

    // ---- Load operation rule ----
    const rule: any = await this.ruleModel.findOne({ operationType: inp.operation, active: true }).lean();
    if (!rule) {
      return { ok: false, status: "FAILED", errorCode: "unknown_operation", operation: inp.operation };
    }
    const capability = inp.capability || rule.capabilityRequired || "";

    // ---- Access gate (USER only). Denied => NO event, NO reserve. ----
    if (billingContext === "USER") {
      const decision = await this.access.resolveAccess({ userId: inp.userId, capability });
      const allowed = capability ? decision.allowed : true;
      if (!allowed) {
        return {
          ok: false,
          status: "ACCESS_DENIED",
          errorCode: "access_denied",
          capability,
          reason: decision.reason,
          requirements: decision.requirements,
        };
      }
    }

    if (!userIdOid) {
      return { ok: false, status: "FAILED", errorCode: "invalid_user" };
    }

    // ---- Claim the usage event (ironclad idempotency, P8) ----
    let event: any;
    try {
      event = await this.usageModel.create({
        userId: userIdOid,
        requestId,
        operationType: inp.operation,
        capability,
        billingContext,
        idempotencyKey,
        status: "RESERVED",
        startedAt: new Date(),
      });
    } catch (e: any) {
      if (e?.code === 11000) {
        const existing: any = await this.usageModel.findOne({ idempotencyKey }).lean();
        return {
          ok: existing?.status === "COMPLETED",
          duplicate: true,
          inFlight: existing?.status === "RESERVED",
          ...(existing ? this.present(existing) : {}),
        };
      }
      throw e;
    }

    const settings = await this.providerPricing.getSettings();
    const model = this.resolveModel(rule, inp.modelPolicy, settings.defaultChatModel);
    const providerName = (!inp.forceMock && this.openai.isConfigured()) ? "openai" : "mock";
    const infraCost = Number(settings.infrastructureCostPerRequestUsd) || 0;

    const fail = async (errorCode: string, extra: Record<string, any> = {}) => {
      event.status = "FAILED";
      event.errorCode = errorCode;
      event.completedAt = new Date();
      event.metadata = { ...(event.metadata || {}), ...extra };
      await event.save();
      return { ok: false, ...this.present(event), reason: extra.reason };
    };

    // ---- Estimate provider cost + credits (pre-call) ----
    const estUsage = {
      inputTokens: Number(rule.estInputTokens) || 1500,
      outputTokens: Number(rule.estOutputTokens) || 800,
      cachedInputTokens: 0,
      reasoningTokens: null,
      totalTokens: (Number(rule.estInputTokens) || 1500) + (Number(rule.estOutputTokens) || 800),
    };
    const estCost = await this.providerPricing.computeProviderCost(providerName, model, estUsage, false);
    const rpc = await this.creditPricing.revenuePerCredit(inp.userId);
    const mcpc = await this.creditPricing.deriveMaxCostPerCredit(inp.userId);
    const estTotalCostUsd = estCost.providerCostUsd + infraCost;
    const estCredits = this.creditPricing.computeCredits({
      rule,
      costUsd: estTotalCostUsd,
      revenuePerCreditUsd: rpc.value,
      maxCostPerCreditUsd: mcpc.value,
    });

    event.model = model;
    event.modelProvider = providerName;
    event.credentialId = settings.activeCredentialId || "";
    event.planId = rpc.planId || "";
    event.subscriptionId = rpc.subscriptionId || "";
    event.creditsEstimated = estCredits.credits;

    // ---- Unpriced-model guard (USER + REAL provider + production) ----
    // In mock mode (no key) we intentionally allow the pipeline to run so the
    // full USER flow is testable; such requests are tagged dataMode:"mock" and
    // never enter real financial analytics.
    if (
      billingContext === "USER" &&
      providerName === "openai" &&
      estCost.costStatus === "UNPRICED" &&
      !settings.allowUnpricedModels
    ) {
      return fail("unpriced_model", {
        reason: `No pricing configured for ${providerName}/${model} and allowUnpricedModels is off`,
      });
    }

    // ---- Reserve credits (USER only). Insufficient => provider NOT called. ----
    let reservationId: string | null = null;
    if (billingContext === "USER") {
      try {
        const r: any = await this.credits.reserve(
          inp.userId,
          inp.operation,
          estCredits.credits,
          `${idempotencyKey}:reserve`,
        );
        reservationId = String(r.reservation._id);
        event.reservationId = reservationId;
        event.creditsReserved = estCredits.credits;
      } catch (e: any) {
        const detail = e?.response || e?.message || {};
        return fail("insufficient_credits", {
          reason: "insufficient_credits",
          detail: typeof detail === "object" ? detail : { message: String(detail) },
        });
      }
    }
    await event.save();

    // ---- Provider call (dispatch by execution mode) ----
    const { provider, dataMode } = await this.pickProvider(inp.forceMock);
    const mode = inp.mode || "CHAT";
    const maxOutputTokens = inp.modelPolicy?.maxOutputTokens || rule.modelPolicy?.maxOutputTokens || rule.estOutputTokens || 800;
    let result: any;
    let toolCostUsd = 0;
    let toolRecords: any[] = [];
    try {
      if (mode === "TOOL_LOOP") {
        result = await (provider as any).callToolLoop({
          model,
          system: inp.system,
          input: Array.isArray(inp.input) ? inp.input : [{ role: "user", content: String(inp.input) }],
          tools: inp.tools || [],
          executeTool: inp.executeTool || (async () => ({ output: "{}" })),
          maxIterations: inp.maxIterations ?? 4,
          maxToolCalls: inp.budget?.maxToolCalls,
          maxToolCostUsd: inp.budget?.maxToolCostUsd,
          reasoningEffort: inp.reasoningEffort || rule.modelPolicy?.reasoningEffort,
        });
        toolCostUsd = Number(result.toolCostUsd) || 0;
        toolRecords = result.toolRecords || [];
      } else if (mode === "STRUCTURED") {
        result = await (provider as any).callStructured({
          model,
          input: inp.input,
          system: inp.system,
          jsonSchema: inp.jsonSchema,
          maxOutputTokens,
          reasoningEffort: inp.reasoningEffort || rule.modelPolicy?.reasoningEffort,
        });
      } else {
        result = await provider.call({
          model,
          input: inp.input,
          system: inp.system,
          maxOutputTokens,
          reasoningEffort: inp.reasoningEffort || rule.modelPolicy?.reasoningEffort,
        });
      }
    } catch (e: any) {
      // Provider failure -> release the full reservation.
      this.logger.error(`PROVIDER_CALL_FAILED mode=${mode} model=${model} status=${e?.status} code=${e?.code} msg=${String(e?.message || e).slice(0, 500)} err=${JSON.stringify(e?.error || e?.response?.data || {}).slice(0, 500)}`);
      if (reservationId) {
        await this.credits.release(reservationId, "provider_error").catch(() => undefined);
        event.creditsReleased = event.creditsReserved;
        event.creditsCaptured = 0;
      }
      return fail("provider_error", { reason: String(e?.code || e?.message || "provider_error") });
    }

    // ---- Real usage -> real cost (all-in: model + tools, P13) ----
    const usageIsReal = result.dataMode === "real";
    const cost = await this.providerPricing.computeProviderCost(
      result.provider,
      result.model,
      result.usage,
      usageIsReal,
    );
    const modelUsd = cost.providerCostUsd;
    const totalCostUsd = modelUsd + toolCostUsd + infraCost;
    const costBreakdown = {
      modelUsd,
      embeddingsUsd: 0,
      searchUsd: 0,
      toolsUsd: toolCostUsd,
      otherUsd: infraCost,
      totalUsd: Math.round(totalCostUsd * 1e8) / 1e8,
    };

    // record token telemetry (null preserved where provider omitted)
    event.dataMode = dataMode;
    event.modelProvider = result.provider;
    event.model = result.model;
    event.providerRequestId = result.providerRequestId;
    event.inputTokens = result.usage.inputTokens ?? 0;
    event.outputTokens = result.usage.outputTokens ?? 0;
    event.cachedInputTokens = result.usage.cachedInputTokens;
    event.reasoningTokens = result.usage.reasoningTokens;
    event.totalTokens = result.usage.totalTokens ?? (event.inputTokens + event.outputTokens);
    event.providerCostUsd = cost.providerCostUsd;
    event.infrastructureCostUsd = infraCost;
    event.totalCostUsd = totalCostUsd;
    event.costBreakdown = costBreakdown;
    event.toolUsage = toolRecords;
    event.costStatus = cost.costStatus;
    event.pricingSnapshot = cost.pricingSnapshot;
    event.latencyMs = result.latencyMs;
    event.metadata = {
      ...(event.metadata || {}),
      content: result.content,
      mode,
      requestIds: result.raw?.requestIds || (result.providerRequestId ? [result.providerRequestId] : []),
      providerStatus: result.raw?.status || "completed",
      toolIterationLimitReached: result.toolIterationLimitReached || false,
      budgetStopped: result.budgetStopped || false,
    };

    // ---- Capture / release (USER only) ----
    if (billingContext === "USER" && reservationId) {
      // Credits reflect ALL-IN cost (model + paid tools), not just model.
      const actual = this.creditPricing.computeCredits({
        rule,
        costUsd: modelUsd + toolCostUsd,
        revenuePerCreditUsd: rpc.value,
        maxCostPerCreditUsd: mcpc.value,
      });
      // Never exceed the reservation (overage cap = reserved credits).
      const captureCredits = Math.min(actual.credits, event.creditsReserved);
      await this.credits.capture(reservationId, captureCredits);
      event.creditsCaptured = captureCredits;
      event.creditsReleased = Math.max(0, event.creditsReserved - captureCredits);
      event.creditsCharged = captureCredits;
    }

    event.status = "COMPLETED";
    event.completedAt = new Date();
    await event.save();

    return { ok: true, ...this.present(event) };
  }

  /**
   * recordUsage (P4 metering hook) — for AI calls that already happened via a
   * low-level provider adapter (e.g. Activity AI Review's structured-output call
   * or Admin AI Chat's multi-round tool loop, which are intentionally NOT
   * rewritten). It is the single authority that turns provider-reported usage
   * into a costed, snapshotted AiUsageEvent. INTERNAL/SYSTEM contexts log
   * provider COGS but never move user credits.
   */
  async recordUsage(params: {
    userId?: string;
    operation: string;
    capability?: string;
    billingContext?: BillingContext;
    provider: string;
    model: string;
    providerRequestId?: string;
    usage: Partial<{
      inputTokens: number | null;
      outputTokens: number | null;
      cachedInputTokens: number | null;
      reasoningTokens: number | null;
      totalTokens: number | null;
    }>;
    dataMode?: "real" | "mock";
    latencyMs?: number;
    status?: "COMPLETED" | "FAILED";
    errorCode?: string;
    idempotencyKey?: string;
  }) {
    const billingContext: BillingContext = params.billingContext || "INTERNAL";
    const dataMode = params.dataMode || "real";
    const userIdOid =
      params.userId && Types.ObjectId.isValid(params.userId)
        ? new Types.ObjectId(params.userId)
        : new Types.ObjectId("000000000000000000000000"); // SYSTEM sentinel
    const settings = await this.providerPricing.getSettings();
    const infraCost = Number(settings.infrastructureCostPerRequestUsd) || 0;
    const cost = await this.providerPricing.computeProviderCost(
      params.provider,
      params.model,
      params.usage,
      dataMode === "real",
    );
    try {
      const event = await this.usageModel.create({
        userId: userIdOid,
        requestId: randomUUID(),
        operationType: params.operation,
        capability: params.capability || "",
        billingContext,
        modelProvider: params.provider,
        model: params.model,
        providerRequestId: params.providerRequestId || "",
        inputTokens: params.usage.inputTokens ?? 0,
        outputTokens: params.usage.outputTokens ?? 0,
        cachedInputTokens: params.usage.cachedInputTokens ?? null,
        reasoningTokens: params.usage.reasoningTokens ?? null,
        totalTokens: params.usage.totalTokens ?? ((params.usage.inputTokens ?? 0) + (params.usage.outputTokens ?? 0)),
        providerCostUsd: cost.providerCostUsd,
        infrastructureCostUsd: infraCost,
        totalCostUsd: cost.providerCostUsd + infraCost,
        costStatus: cost.costStatus,
        pricingSnapshot: cost.pricingSnapshot,
        creditsCaptured: 0,
        creditsCharged: 0,
        status: params.status || "COMPLETED",
        errorCode: params.errorCode || "",
        startedAt: params.latencyMs ? new Date(Date.now() - params.latencyMs) : new Date(),
        completedAt: new Date(),
        latencyMs: params.latencyMs || 0,
        dataMode,
        ...(params.idempotencyKey ? { idempotencyKey: params.idempotencyKey } : {}),
      });
      return { ok: true, eventId: String(event._id), costStatus: cost.costStatus };
    } catch (e: any) {
      if (e?.code === 11000) return { ok: true, duplicate: true };
      this.logger.warn(`recordUsage failed: ${e?.message || e}`);
      return { ok: false };
    }
  }

  // ---------- Estimate-only (for public "~N credits" preview, no charge) ----------
  async estimateOnly(params: { userId: string; operation: string; forceMock?: boolean }) {
    await this.openai.refresh();
    const rule: any = await this.ruleModel.findOne({ operationType: params.operation, active: true }).lean();
    if (!rule) return { ok: false, errorCode: "unknown_operation" };
    const settings = await this.providerPricing.getSettings();
    const model = this.resolveModel(rule, undefined, settings.defaultChatModel);
    const providerName = (!params.forceMock && this.openai.isConfigured()) ? "openai" : "mock";
    const estUsage = {
      inputTokens: Number(rule.estInputTokens) || 1500,
      outputTokens: Number(rule.estOutputTokens) || 800,
      cachedInputTokens: 0,
      reasoningTokens: null,
      totalTokens: 0,
    };
    const estCost = await this.providerPricing.computeProviderCost(providerName, model, estUsage, false);
    const rpc = await this.creditPricing.revenuePerCredit(params.userId);
    const mcpc = await this.creditPricing.deriveMaxCostPerCredit(params.userId);
    const estCredits = this.creditPricing.computeCredits({
      rule,
      costUsd: estCost.providerCostUsd + (Number(settings.infrastructureCostPerRequestUsd) || 0),
      revenuePerCreditUsd: rpc.value,
      maxCostPerCreditUsd: mcpc.value,
    });
    return {
      ok: true,
      operation: params.operation,
      model,
      estimatedCredits: estCredits.credits,
      costStatus: estCost.costStatus,
      pricingMode: estCredits.pricingMode,
    };
  }
}
