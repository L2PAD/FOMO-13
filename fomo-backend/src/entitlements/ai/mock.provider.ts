import { Injectable } from "@nestjs/common";
import {
  AiProvider,
  AiProviderCallInput,
  AiProviderResult,
  NormalizedUsage,
} from "./ai-provider.types";

/**
 * Mock AI provider (P3 / acceptance). Used when no real provider key is
 * configured OR when a caller explicitly requests mock mode. It returns
 * synthetic-but-plausible token usage so the FULL pipeline (estimate ->
 * reserve -> usage -> cost -> capture -> AiUsageEvent) can be exercised and
 * tested end-to-end. Everything it produces is tagged dataMode:"mock" so it is
 * NEVER mixed into real financial analytics.
 */
@Injectable()
export class MockAiProvider implements AiProvider {
  readonly name = "mock";

  isConfigured(): boolean {
    return true;
  }

  async call(input: AiProviderCallInput): Promise<AiProviderResult> {
    const startedAt = Date.now();
    const promptLen =
      typeof input.input === "string"
        ? input.input.length
        : JSON.stringify(input.input || []).length;

    // Deterministic-ish synthetic usage derived from prompt size + caps.
    const inputTokens = Math.max(50, Math.round(promptLen / 4));
    const outputTokens = Math.min(input.maxOutputTokens || 500, 400);
    const totalTokens = inputTokens + outputTokens;
    const usage: NormalizedUsage = {
      inputTokens,
      outputTokens,
      cachedInputTokens: 0,
      reasoningTokens: /^(gpt-5|o[0-9]|reasoning)/i.test(input.model) ? Math.round(outputTokens * 0.3) : null,
      totalTokens,
    };

    // Simulate small latency without blocking tests meaningfully.
    await new Promise((r) => setTimeout(r, 5));

    return {
      content:
        "[MOCK AI RESPONSE] No real provider key is configured, so this is a synthetic answer used to exercise the metering pipeline. Real cost metrics are not yet available.",
      provider: "mock",
      model: input.model,
      usage,
      latencyMs: Date.now() - startedAt,
      providerRequestId: `mock_${Date.now()}`,
      dataMode: "mock",
      raw: { mock: true },
    };
  }

  async callStructured(input: AiProviderCallInput & { jsonSchema?: any }): Promise<AiProviderResult> {
    const r = await this.call(input);
    return { ...r, content: '{"mock":true,"note":"structured mock output"}' };
  }

  async callToolLoop(input: any): Promise<AiProviderResult & { toolRecords: any[]; toolCostUsd: number; toolIterationLimitReached: boolean; budgetStopped: boolean }> {
    const startedAt = Date.now();
    const tools: any[] = Array.isArray(input.tools) ? input.tools : [];
    const executeTool = input.executeTool || (async () => ({ output: "{}" }));
    const maxToolCalls = Number.isFinite(input.maxToolCalls) ? input.maxToolCalls : tools.length;

    // Derive a retrieval keyword from the last user message (e.g. "Monad").
    const userText = Array.isArray(input.input)
      ? String((input.input.filter((m: any) => m.role === "user").pop() || {}).content || "")
      : String(input.input || "");
    const STOP = new Set(["analyze", "analyse", "compare", "review", "research", "get", "tell", "what", "which", "about", "the", "a", "an", "for", "of", "and", "me", "on", "is", "are", "do", "does", "project", "token", "give", "show", "fomo", "early", "crypto", "opportunities", "does", "track"]);
    const words = userText.replace(/[^A-Za-z0-9 ]/g, " ").split(/\s+/).filter((w) => w && !STOP.has(w.toLowerCase()));
    const cap = words.find((w) => /^[A-Z]/.test(w));
    const keyword = cap || words[0] || userText.slice(0, 40);

    // Deterministically exercise the FOMO Tool Registry against REAL knowledge.
    // The DATA is real; only the narrative below is synthetic (dataMode:mock).
    const toolRecords: any[] = [];
    let toolCostUsd = 0;
    const grounded: string[] = [];
    let budgetStopped = false;
    let calls = 0;
    for (const t of tools) {
      if (calls >= maxToolCalls) { budgetStopped = true; break; }
      calls += 1;
      const name = t.name || t.function?.name;
      const props = (t.parameters || t.function?.parameters || {}).properties || {};
      const args: any = {};
      if ("query" in props) args.query = keyword;
      if ("id" in props) args.id = keyword;
      try {
        const res = await executeTool(name, args);
        if (res?.record) toolRecords.push(res.record);
        toolCostUsd += Number(res?.costUsd) || 0;
        try {
          const parsed = JSON.parse(res?.output || "{}");
          if (parsed?.status === "ok" && Array.isArray(parsed.data)) {
            for (const d of parsed.data.slice(0, 2)) grounded.push(`${d.title} (${name})`);
          }
        } catch { /* ignore */ }
      } catch { /* tool errors are handled by the caller's telemetry */ }
    }

    const inputTokens = Math.max(50, Math.round(JSON.stringify(input.input || []).length / 4));
    const outputTokens = 260;
    const usage: NormalizedUsage = {
      inputTokens,
      outputTokens,
      cachedInputTokens: 0,
      reasoningTokens: /^(gpt-5|o[0-9]|reasoning)/i.test(input.model) ? Math.round(outputTokens * 0.3) : null,
      totalTokens: inputTokens + outputTokens,
    };

    const factLines = grounded.length
      ? `FOMO DATA (real facts retrieved via tools):\n- ${[...new Set(grounded)].join("\n- ")}`
      : "FOMO DATA: no matching real records were connected for this query.";
    const content = [
      "[MOCK NARRATION] No real LLM key is configured, so the narrative text is synthetic — but the tool retrieval and sources below are REAL FOMO data.",
      factLines,
      "Analysis: (model inference placeholder) a real LLM would reason over the FOMO facts above and flag risk/uncertainty here.",
    ].join("\n\n");

    return {
      content,
      provider: "mock",
      model: input.model,
      usage,
      latencyMs: Date.now() - startedAt,
      providerRequestId: `mock_${Date.now()}`,
      dataMode: "mock",
      raw: { mock: true, toolCalls: calls },
      toolRecords,
      toolCostUsd,
      toolIterationLimitReached: false,
      budgetStopped,
    };
  }
}
