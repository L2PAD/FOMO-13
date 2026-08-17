/**
 * AI Provider abstraction (P3).
 *
 * Product code NEVER talks to OpenAI directly — it goes through FomoAiGateway,
 * which calls an AiProvider. A provider returns the model output PLUS a
 * normalized usage object. If the provider does not report a token field, it
 * MUST be returned as `null` — never a fabricated 0.
 */
export interface NormalizedUsage {
  inputTokens: number | null;
  outputTokens: number | null;
  cachedInputTokens: number | null;
  reasoningTokens: number | null;
  totalTokens: number | null;
}

export interface AiProviderResult {
  content: string;
  provider: string;
  model: string;
  usage: NormalizedUsage;
  latencyMs: number;
  providerRequestId: string;
  // real = a real provider call happened; mock = synthetic (no key / test mode)
  dataMode: "real" | "mock";
  raw?: Record<string, any>;
}

export interface AiProviderCallInput {
  model: string;
  input: string | Array<Record<string, any>>;
  system?: string;
  maxOutputTokens?: number;
  reasoningEffort?: string;
  timeoutMs?: number;
}

export interface AiProvider {
  readonly name: string;
  isConfigured(): boolean;
  call(input: AiProviderCallInput): Promise<AiProviderResult>;
}
