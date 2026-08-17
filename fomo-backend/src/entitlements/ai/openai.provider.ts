import { Injectable, Logger } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import OpenAI from "openai";
import {
  AiProvider,
  AiProviderCallInput,
  AiProviderResult,
  NormalizedUsage,
} from "./ai-provider.types";
import { AiProviderPricingService } from "./ai-provider-pricing.service";

/**
 * OpenAI low-level adapter (P3). Wraps the Responses API and returns a
 * normalized usage object. This is the ONLY place in the monetized path that
 * imports the OpenAI SDK. Never invents token counts: a field the API omits is
 * returned as null.
 *
 * Runtime credentials are resolved from admin-managed DB settings
 * (AiGlobalSettings) with a fallback to environment variables, so keys/models
 * and the active provider (openai | emergent | mock) can be switched from the
 * CRM Settings tab without a redeploy.
 */
@Injectable()
export class OpenAiProvider implements AiProvider {
  readonly name = "openai";
  private readonly logger = new Logger("OpenAiProvider");
  private client: OpenAI | null = null;
  private runtime: { key: string; baseUrl: string; mode: string } | null = null;

  constructor(
    private readonly config: ConfigService,
    private readonly settings: AiProviderPricingService,
  ) {}

  /** Refresh runtime provider config from DB (call once per request in the gateway). */
  async refresh(): Promise<void> {
    try {
      const s: any = await this.settings.getRawSettings();
      const mode = String(s.activeProvider || this.config.get<string>("AI_PROVIDER") || "openai");
      let key = "";
      let baseUrl = "";
      if (mode === "emergent") {
        key = String(s.emergentLlmKey || this.config.get<string>("EMERGENT_LLM_KEY") || "").trim();
        baseUrl = String(
          s.emergentBaseUrl ||
            this.config.get<string>("EMERGENT_LLM_BASE_URL") ||
            "https://integrations.emergentagent.com/llm",
        ).trim();
      } else if (mode === "mock") {
        key = "";
        baseUrl = "";
      } else {
        key = String(s.openAiApiKey || this.config.get<string>("OPEN_AI_SECRET_KEY") || "").trim();
        baseUrl = String(s.openAiBaseUrl || this.config.get<string>("OPEN_AI_API_BASE_URL") || "https://api.openai.com/v1").trim();
      }
      const changed = !this.runtime || this.runtime.key !== key || this.runtime.baseUrl !== baseUrl;
      this.runtime = { key, baseUrl, mode };
      if (changed) this.client = null;
    } catch (e: any) {
      this.logger.warn(`runtime refresh failed, using env fallback: ${e?.message || e}`);
    }
  }

  private effective(): { key: string; baseUrl: string; mode: string } {
    if (this.runtime) return this.runtime;
    return {
      key: String(this.config.get<string>("OPEN_AI_SECRET_KEY") || "").trim(),
      baseUrl: String(this.config.get<string>("OPEN_AI_API_BASE_URL") || "https://api.openai.com/v1"),
      mode: String(this.config.get<string>("AI_PROVIDER") || "openai"),
    };
  }

  private apiKey(): string {
    return this.effective().key;
  }

  isConfigured(): boolean {
    const e = this.effective();
    return e.mode !== "mock" && Boolean(e.key);
  }

  private getClient(): OpenAI {
    const e = this.effective();
    if (!this.client) {
      this.client = new OpenAI({
        apiKey: e.key,
        baseURL: e.baseUrl || "https://api.openai.com/v1",
        timeout: 120_000,
        maxRetries: 1,
      });
    }
    return this.client;
  }

  private normalizeUsage(u: any): NormalizedUsage {
    // OpenAI Responses API: usage.input_tokens / output_tokens / total_tokens,
    // input_tokens_details.cached_tokens, output_tokens_details.reasoning_tokens
    const num = (v: any): number | null =>
      typeof v === "number" && Number.isFinite(v) ? v : null;
    return {
      inputTokens: num(u?.input_tokens ?? u?.prompt_tokens),
      outputTokens: num(u?.output_tokens ?? u?.completion_tokens),
      cachedInputTokens: num(u?.input_tokens_details?.cached_tokens),
      reasoningTokens: num(u?.output_tokens_details?.reasoning_tokens),
      totalTokens: num(u?.total_tokens),
    };
  }

  async call(input: AiProviderCallInput): Promise<AiProviderResult> {
    const startedAt = Date.now();
    const client = this.getClient();

    const body: Record<string, any> = {
      model: input.model,
      input: input.input,
    };
    if (input.system) body.instructions = input.system;
    if (input.maxOutputTokens) body.max_output_tokens = input.maxOutputTokens;
    if (input.reasoningEffort && /^(gpt-5|o[0-9]|reasoning)/i.test(input.model)) {
      body.reasoning = { effort: input.reasoningEffort };
    }

    const response: any = await client.responses.create(body as any);
    const latencyMs = Date.now() - startedAt;

    const content =
      response?.output_text ||
      (Array.isArray(response?.output)
        ? response.output
            .flatMap((o: any) => o?.content || [])
            .map((c: any) => c?.text || "")
            .join("")
        : "") ||
      "";

    return {
      content,
      provider: this.name,
      model: response?.model || input.model,
      usage: this.normalizeUsage(response?.usage),
      latencyMs,
      providerRequestId: String(response?.id || ""),
      dataMode: "real",
      raw: { status: response?.status },
    };
  }

  /** STRUCTURED mode — JSON-schema constrained output (e.g. Activity AI Review). */
  async callStructured(input: AiProviderCallInput & { jsonSchema?: any }): Promise<AiProviderResult> {
    const startedAt = Date.now();
    const client = this.getClient();
    const body: Record<string, any> = { model: input.model, input: input.input };
    if (input.system) body.instructions = input.system;
    if (input.maxOutputTokens) body.max_output_tokens = input.maxOutputTokens;
    if (input.jsonSchema) {
      body.text = { format: { type: "json_schema", name: input.jsonSchema.name || "result", strict: true, schema: input.jsonSchema.schema || input.jsonSchema } };
    }
    if (input.reasoningEffort && /^(gpt-5|o[0-9]|reasoning)/i.test(input.model)) {
      body.reasoning = { effort: input.reasoningEffort };
    }
    const response: any = await client.responses.create(body as any);
    return {
      content: response?.output_text || "",
      provider: this.name,
      model: response?.model || input.model,
      usage: this.normalizeUsage(response?.usage),
      latencyMs: Date.now() - startedAt,
      providerRequestId: String(response?.id || ""),
      dataMode: "real",
      raw: { status: response?.status },
    };
  }

  /**
   * TOOL_LOOP mode — multi-round tool-calling loop. The OpenAI SDK is used ONLY
   * here; the feature keeps ownership of tool DEFINITIONS and EXECUTION by
   * passing `tools` and an `executeTool(name,args)` callback (which does its own
   * audit/redaction and returns the stringified output + optional cost/record).
   * Usage is aggregated across all rounds. A budget guard (maxToolCalls,
   * maxToolCostUsd) stops the loop early and lets the model summarize.
   */
  async callToolLoop(input: {
    model: string;
    system?: string;
    input: any[];
    tools: any[];
    executeTool: (name: string, args: any) => Promise<{ output: string; record?: any; costUsd?: number }>;
    maxIterations: number;
    maxToolCalls?: number;
    maxToolCostUsd?: number;
    reasoningEffort?: string;
    timeoutMs?: number;
    metadata?: Record<string, any>;
  }): Promise<AiProviderResult & { toolRecords: any[]; toolCostUsd: number; toolIterationLimitReached: boolean; budgetStopped: boolean }> {
    const startedAt = Date.now();
    const client = this.getClient();
    const requestIds: string[] = [];
    const toolRecords: any[] = [];
    let toolCostUsd = 0;
    let toolCallCount = 0;
    let responseData: any = null;
    let currentInput: any[] = [...input.input];
    let toolIterationLimitReached = false;
    let budgetStopped = false;
    const agg = { inputTokens: 0, outputTokens: 0, cached: 0, reasoning: 0, total: 0 };
    const maxToolCalls = input.maxToolCalls ?? 8;

    for (let step = 0; step <= input.maxIterations; step += 1) {
      const toolsEnabled = step < input.maxIterations && !budgetStopped;
      const body: Record<string, any> = { model: input.model, input: currentInput };
      if (input.system) body.instructions = input.system;
      if (input.metadata) body.metadata = input.metadata;
      if (input.reasoningEffort && /^(gpt-5|o[0-9]|reasoning)/i.test(input.model)) {
        body.reasoning = { effort: input.reasoningEffort };
      }
      if (toolsEnabled && input.tools?.length) {
        body.tools = input.tools;
        body.parallel_tool_calls = false;
        body.max_tool_calls = maxToolCalls;
      }
      const reqOpts: Record<string, any> = {};
      if (typeof input.timeoutMs === "number" && Number.isFinite(input.timeoutMs)) {
        reqOpts.timeout = input.timeoutMs;
      }
      const resp: any = await client.responses.create(body as any, reqOpts as any).withResponse();
      responseData = resp.data;
      requestIds.push(resp.request_id || resp.data?.id);
      const u = this.normalizeUsage(responseData?.usage);
      agg.inputTokens += u.inputTokens || 0;
      agg.outputTokens += u.outputTokens || 0;
      agg.cached += u.cachedInputTokens || 0;
      agg.reasoning += u.reasoningTokens || 0;
      agg.total += u.totalTokens || 0;

      const toolCalls = (responseData?.output || []).filter((o: any) => o?.type === "function_call").slice(0, maxToolCalls);
      if (!toolCalls.length) break;
      if (!toolsEnabled) { toolIterationLimitReached = true; break; }

      const toolOutputs: any[] = [];
      for (const tc of toolCalls) {
        let args: any = {};
        try { args = tc.arguments ? JSON.parse(tc.arguments) : {}; } catch { args = {}; }
        const r = await input.executeTool(tc.name, args);
        toolCallCount += 1;
        toolCostUsd += Number(r.costUsd) || 0;
        if (r.record) toolRecords.push(r.record);
        toolOutputs.push({ type: "function_call_output", call_id: tc.call_id, output: r.output });
        // Budget guard (P14): stop if tool-cost or call-count exceeded.
        if ((input.maxToolCostUsd && toolCostUsd > input.maxToolCostUsd) || toolCallCount >= maxToolCalls) {
          budgetStopped = true;
        }
      }
      currentInput = [...currentInput, ...responseData.output, ...toolOutputs];
    }

    const content = responseData?.output_text || "";
    return {
      content,
      provider: this.name,
      model: responseData?.model || input.model,
      usage: {
        inputTokens: agg.inputTokens || null,
        outputTokens: agg.outputTokens || null,
        cachedInputTokens: agg.cached || null,
        reasoningTokens: agg.reasoning || null,
        totalTokens: agg.total || null,
      },
      latencyMs: Date.now() - startedAt,
      providerRequestId: requestIds[0] || "",
      dataMode: "real",
      raw: { status: responseData?.status, requestIds },
      toolRecords,
      toolCostUsd,
      toolIterationLimitReached,
      budgetStopped,
    };
  }
}
