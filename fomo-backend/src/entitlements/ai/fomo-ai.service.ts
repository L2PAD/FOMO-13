import { Injectable, Logger } from "@nestjs/common";
import { FomoKnowledgeProvider, KnowledgeResult } from "./fomo-knowledge.provider";
import { FomoAiGateway } from "./fomo-ai-gateway.service";

interface ToolDef {
  name: string;
  description: string;
  domain: string;
  mode: "search" | "get";
  parameters: any;
}

// Canonical, schema-validated, READ-ONLY FOMO tool catalog (P11). The model can
// ONLY call these — never arbitrary Mongo. Each maps to a knowledge domain.
const TOOLS: ToolDef[] = [
  { name: "search_projects", domain: "projects", mode: "search", description: "Search FOMO crypto projects/ICOs by name or symbol.", parameters: { type: "object", properties: { query: { type: "string" } }, required: ["query"] } },
  { name: "get_project", domain: "projects", mode: "get", description: "Get a FOMO project by id/slug/symbol.", parameters: { type: "object", properties: { id: { type: "string" } }, required: ["id"] } },
  { name: "compare_projects", domain: "projects", mode: "search", description: "Look up a project (call once per project) to compare FOMO projects side by side.", parameters: { type: "object", properties: { query: { type: "string" } }, required: ["query"] } },
  { name: "search_funds", domain: "funds", mode: "search", description: "Search crypto funds/VCs tracked by FOMO.", parameters: { type: "object", properties: { query: { type: "string" } }, required: ["query"] } },
  { name: "get_fund", domain: "funds", mode: "get", description: "Get a FOMO fund/VC by id/slug/name.", parameters: { type: "object", properties: { id: { type: "string" } }, required: ["id"] } },
  { name: "search_persons", domain: "persons", mode: "search", description: "Search notable persons/KOLs tracked by FOMO.", parameters: { type: "object", properties: { query: { type: "string" } }, required: ["query"] } },
  { name: "get_person", domain: "persons", mode: "get", description: "Get a FOMO person/KOL by id/handle/username.", parameters: { type: "object", properties: { id: { type: "string" } }, required: ["id"] } },
  { name: "get_project_rating", domain: "ratings", mode: "search", description: "Get FOMO rating inputs for a project/entity.", parameters: { type: "object", properties: { query: { type: "string" } }, required: ["query"] } },
  { name: "get_fund_rating", domain: "ratings", mode: "search", description: "Get FOMO rating inputs for a fund/VC.", parameters: { type: "object", properties: { query: { type: "string" } }, required: ["query"] } },
  { name: "get_person_rating", domain: "ratings", mode: "search", description: "Get FOMO rating inputs for a person/KOL.", parameters: { type: "object", properties: { query: { type: "string" } }, required: ["query"] } },
  { name: "get_fomo_score", domain: "ratings", mode: "search", description: "Get the FOMO Score / rating snapshot for an entity.", parameters: { type: "object", properties: { query: { type: "string" } }, required: ["query"] } },
  { name: "get_market_signals", domain: "signals", mode: "search", description: "Get market signals/ROI metrics for a symbol/project.", parameters: { type: "object", properties: { query: { type: "string" } }, required: ["query"] } },
  { name: "get_unlocks", domain: "unlocks", mode: "search", description: "Get token unlock events for a project/symbol.", parameters: { type: "object", properties: { query: { type: "string" } }, required: ["query"] } },
  { name: "get_earlyland_activity", domain: "earlyland", mode: "search", description: "Get EarlyLand activities (early crypto opportunities, incl. project name/symbol/score/ecosystem).", parameters: { type: "object", properties: { query: { type: "string" } }, required: ["query"] } },
  { name: "get_market_context", domain: "market", mode: "search", description: "Get market/CMC context for a coin.", parameters: { type: "object", properties: { query: { type: "string" } }, required: ["query"] } },
  { name: "get_user_portfolio_context", domain: "portfolio", mode: "search", description: "Get the CURRENT user's own portfolio context (private, ownership-gated).", parameters: { type: "object", properties: {} } },
];

// Operation-aware retrieval (P13): don't run every tool on every question.
// Order matters — highest-signal FOMO sources first so tool budgets are spent
// on data that actually exists.
const OPERATION_TOOLS: Record<string, string[]> = {
  ask_fomo: ["get_earlyland_activity", "search_projects", "get_project", "search_funds", "search_persons", "get_market_signals", "get_market_context"],
  token_analysis: ["get_earlyland_activity", "get_project", "search_projects", "get_project_rating", "get_fomo_score", "get_market_signals", "get_unlocks", "search_funds", "search_persons"],
  compare_projects: ["get_earlyland_activity", "compare_projects", "search_projects", "get_project", "get_project_rating", "get_fomo_score", "get_market_signals", "search_funds"],
  market_brief: ["get_earlyland_activity", "get_market_signals", "search_projects", "search_funds", "get_unlocks", "get_market_context"],
  portfolio_analysis: ["get_user_portfolio_context", "get_market_signals", "search_projects", "get_market_context"],
  deep_research: ["get_earlyland_activity", ...TOOLS.map((t) => t.name).filter((n) => n !== "get_earlyland_activity")],
};

export interface GroundedSource {
  sourceType: "FOMO" | "EXTERNAL";
  entityType: string;
  entityId: string;
  title: string;
  updatedAt: string | null;
  dataMode: "real" | "mock";
}

@Injectable()
export class FomoAiService {
  private readonly logger = new Logger("FomoAiService");
  constructor(
    private readonly knowledge: FomoKnowledgeProvider,
    private readonly gateway: FomoAiGateway,
  ) {}

  private toolDefsFor(operation: string) {
    const allowed = OPERATION_TOOLS[operation] || OPERATION_TOOLS.ask_fomo;
    return allowed
      .map((name) => TOOLS.find((t) => t.name === name))
      .filter((t): t is ToolDef => !!t)
      .map((t) => ({ type: "function", name: t.name, description: t.description, parameters: t.parameters }));
  }

  /**
   * Grounded FOMO AI answer (P12). Runs the canonical Gateway in TOOL_LOOP mode
   * with the FOMO Tool Registry, accumulates real sources + retrieval telemetry,
   * and returns a presentation-ready contract that distinguishes FOMO facts from
   * model inference and honestly reports missing sources.
   */
  async ask(params: {
    userId: string;
    operation: string;
    query: string;
    capability?: string;
    idempotencyKey?: string;
    isAdmin?: boolean;
    billingContext?: "USER" | "INTERNAL" | "SYSTEM";
  }) {
    const operation = params.operation || "ask_fomo";
    const sources: GroundedSource[] = [];
    const usedTools: any[] = [];
    const notConnected: string[] = [];
    const limitations: string[] = [];
    let searchExternalCostUsd = 0;

    const executeTool = async (name: string, args: any) => {
      const def = TOOLS.find((t) => t.name === name);
      const started = Date.now();
      if (!def) return { output: JSON.stringify({ error: "unknown_tool" }), costUsd: 0 };
      let res: KnowledgeResult;
      try {
        res = await this.knowledge.query(
          def.domain,
          { search: args?.query, id: args?.id, limit: 5 },
          { userId: params.userId, isAdmin: params.isAdmin },
        );
      } catch (e: any) {
        res = { connected: true, source: def.domain, domain: def.domain, dataMode: "real", data: null, count: 0, freshness: { updatedAt: null, ageSeconds: null, status: "unknown" }, status: "error", note: String(e?.message || e) } as any;
      }
      const latencyMs = Date.now() - started;
      // Accumulate grounded sources for real data only.
      if (res.status === "ok" && Array.isArray(res.data)) {
        for (const d of res.data) sources.push({ sourceType: "FOMO", entityType: def.domain.toUpperCase(), entityId: d.entityId, title: d.title, updatedAt: d.updatedAt || res.freshness.updatedAt, dataMode: res.dataMode });
      }
      if (res.status === "not_connected") notConnected.push(def.domain);
      // Tool usage telemetry (P13). Internal DB reads are unmetered.
      usedTools.push({ tool: name, calls: 1, latencyMs, costUsd: 0, costType: "internal_unmetered", dataMode: res.dataMode, success: res.status === "ok" || res.status === "empty", status: res.status, source: res.source });
      return { output: JSON.stringify({ status: res.status, source: res.source, connected: res.connected, count: res.count, freshness: res.freshness, data: res.data, note: res.note }), record: usedTools[usedTools.length - 1], costUsd: 0 };
    };

    const system = [
      "You are FOMO AI, a crypto intelligence assistant that answers STRICTLY from FOMO's own data via the provided read-only tools.",
      "Rules:",
      "1) Ground every factual claim in tool results. If a needed source is not_connected or empty, say so explicitly — DO NOT fill gaps with your own training knowledge presented as FOMO fact.",
      "2) Never give absolute investment guarantees; provide risk/reward and uncertainty.",
      "3) Be concise and structured.",
      "OUTPUT FORMAT — you MUST structure your answer with these exact section headers, each on its own line:",
      "[FOMO DATA]",
      "Only facts actually returned by the FOMO tools. If nothing was found, write exactly: No matching evidence was found in the connected FOMO data sources.",
      "[ANALYSIS]",
      "Your interpretation and reasoning built on the FOMO data above (clearly your analysis, not platform fact).",
      "[RISKS]",
      "Risks, uncertainty, missing data and caveats.",
    ].join("\n");

    const gw: any = await this.gateway.execute({
      userId: params.userId,
      operation,
      capability: params.capability,
      billingContext: params.billingContext || "USER",
      mode: "TOOL_LOOP",
      system,
      input: [{ role: "user", content: params.query }],
      tools: this.toolDefsFor(operation),
      executeTool,
      maxIterations: operation === "deep_research" ? 6 : 3,
      budget: { maxToolCalls: operation === "deep_research" ? 12 : 6 },
      idempotencyKey: params.idempotencyKey,
    });

    if (!gw || gw.ok === false) {
      return { ok: false, status: gw?.status || "FAILED", errorCode: gw?.errorCode, reason: gw?.reason, requirements: gw?.requirements, credits: gw?.credits };
    }

    if (gw.budgetStopped) limitations.push("tool_budget_reached");
    if (gw.toolIterationLimitReached) limitations.push("tool_iteration_limit");
    if (notConnected.length) limitations.push(`sources_not_connected:${[...new Set(notConnected)].join(",")}`);

    // Coverage (P12): transparent, not fake self-confidence.
    const attempted = usedTools.length;
    const successful = usedTools.filter((t) => t.success && t.status === "ok").length;
    const coverage = attempted === 0 ? "low" : successful === 0 ? "low" : successful >= Math.ceil(attempted / 2) ? "high" : "medium";

    const freshnessList = sources.map((s) => s.updatedAt).filter(Boolean).sort();

    // Retrieval telemetry (P13) — aggregate over this request's knowledge reads.
    const retrieval = {
      knowledgeQueries: usedTools.length,
      sourcesConnected: usedTools.filter((t) => t.status === "ok").length,
      sourcesEmpty: usedTools.filter((t) => t.status === "empty").length,
      sourcesNotConnected: usedTools.filter((t) => t.status === "not_connected").length,
      accessDenied: usedTools.filter((t) => t.status === "access_denied").length,
      errors: usedTools.filter((t) => t.status === "error").length,
      totalLatencyMs: usedTools.reduce((a, t) => a + (t.latencyMs || 0), 0),
      externalCostUsd: Math.round(searchExternalCostUsd * 1e8) / 1e8,
    };

    // All-in cost breakdown normalized to the presentation contract (P13).
    const cb = gw.costBreakdown || {};
    const costBreakdown = {
      modelUsd: cb.modelUsd ?? 0,
      embeddingUsd: cb.embeddingsUsd ?? 0,
      externalSearchUsd: cb.searchUsd ?? 0,
      externalToolsUsd: cb.toolsUsd ?? 0,
      otherUsd: cb.otherUsd ?? 0,
      totalUsd: cb.totalUsd ?? 0,
    };

    // Presentation-ready sections (Phase E / P21-P23). Parse the structured
    // answer into distinct blocks so the UI never guesses from raw markdown.
    const sections = this.parseSections(gw.content || "");
    const connectedSources = usedTools.filter((t) => t.status === "ok").length;
    const grounded = sources.length > 0;
    const missingSources = [...new Set(notConnected)];
    const confidence: "LOW" | "MEDIUM" | "HIGH" =
      coverage === "high" && grounded ? "HIGH" : coverage === "medium" || grounded ? "MEDIUM" : "LOW";

    // Deduplicate + shape sources for presentation (title + freshness, never raw collection).
    const presentationSources = sources.slice(0, 12).map((s) => ({
      id: s.entityId,
      type: s.entityType,
      title: s.title,
      observedAt: s.updatedAt,
      freshness: s.updatedAt ? this.freshnessLabel(s.updatedAt) : null,
    }));

    return {
      ok: true,
      answer: gw.content,
      sections,
      grounding: { grounded, connectedSources, missingSources },
      confidence,
      coverage,
      confidenceNote: "coverage = share of required FOMO sources that returned real data (transparent, not model self-confidence)",
      sources,
      presentationSources,
      usedTools,
      retrieval,
      provider: { name: gw.provider || "", model: gw.model || "", latencyMs: gw.latencyMs || 0 },
      dataFreshness: { oldest: freshnessList[0] || null, newest: freshnessList[freshnessList.length - 1] || null, sourcesUsed: sources.length },
      limitations,
      dataMode: gw.dataMode,
      usage: {
        creditsCharged: gw.credits?.captured ?? 0,
        creditsReserved: gw.credits?.reserved ?? 0,
        creditsEstimated: gw.credits?.estimated ?? 0,
        creditsReleased: gw.credits?.released ?? 0,
        costBreakdown,
      },
    };
  }

  /** Split the structured model output into [FOMO DATA]/[ANALYSIS]/[RISKS]. */
  private parseSections(text: string): { fomoData: { text: string; available: boolean }; analysis: { text: string }; risks: { text: string } } {
    const grab = (label: string): string => {
      const rx = new RegExp(`\\[${label}\\]([\\s\\S]*?)(?=\\n?\\[(?:FOMO DATA|ANALYSIS|RISKS)\\]|$)`, "i");
      const m = text.match(rx);
      return m ? m[1].trim() : "";
    };
    const fomoRaw = grab("FOMO DATA");
    const analysis = grab("ANALYSIS");
    const risks = grab("RISKS");
    const noEvidence = /no matching evidence was found/i.test(fomoRaw) || !fomoRaw;
    // Fallback: if the model ignored headers, keep the whole thing as analysis.
    if (!fomoRaw && !analysis && !risks) {
      return { fomoData: { text: "", available: false }, analysis: { text: text.trim() }, risks: { text: "" } };
    }
    return {
      fomoData: { text: fomoRaw, available: !noEvidence },
      analysis: { text: analysis },
      risks: { text: risks },
    };
  }

  private freshnessLabel(iso: string): string {
    const t = new Date(iso).getTime();
    if (!t) return "";
    const days = Math.floor((Date.now() - t) / 86400000);
    if (days <= 0) return "updated today";
    if (days === 1) return "updated 1 day ago";
    if (days < 30) return `updated ${days} days ago`;
    const months = Math.floor(days / 30);
    return months <= 1 ? "updated 1 month ago" : `updated ${months} months ago`;
  }

  estimate(userId: string, operation: string) {
    return this.gateway.estimateOnly({ userId, operation });
  }

  knowledgeHealth() {
    return this.knowledge.health();
  }

  async testSource(domain: string, query: string, ctx?: { userId?: string; isAdmin?: boolean }) {
    return this.knowledge.query(domain, { search: query, limit: 5 }, ctx);
  }
}
