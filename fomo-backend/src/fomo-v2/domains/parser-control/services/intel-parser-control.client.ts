import { Injectable } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import axios, { AxiosRequestConfig } from "axios";

export class IntelParserControlClientError extends Error {
  constructor(
    public readonly code: string,
    message: string,
    public readonly statusCode: number,
    public readonly retryable: boolean
  ) {
    super(message);
    this.name = "IntelParserControlClientError";
  }

  toPublic(): Record<string, any> {
    return {
      code: this.code,
      message: this.message,
      statusCode: this.statusCode,
      retryable: this.retryable,
    };
  }
}

@Injectable()
export class IntelParserControlClient {
  constructor(private readonly config: ConfigService) {}

  async listParsers(): Promise<Record<string, any>> {
    return this.request("GET", "/parsers");
  }

  async startRun(
    parserKey: string,
    input: {
      entityLimit: number;
      filters?: Record<string, any>;
      flowId: string;
      environment: "test" | "prod";
    }
  ): Promise<Record<string, any>> {
    return this.request(
      "POST",
      `/parsers/${encodeURIComponent(parserKey)}/runs`,
      input,
      input.flowId
    );
  }

  async updateParser(
    parserKey: string,
    input: {
      enabled?: boolean;
      paused?: boolean;
      scheduleEnabled?: boolean;
      intervalMinutes?: number;
      defaultEntityLimit?: number;
    }
  ): Promise<Record<string, any>> {
    return this.request(
      "PATCH",
      `/parsers/${encodeURIComponent(parserKey)}`,
      input
    );
  }

  async getRun(runId: string): Promise<Record<string, any>> {
    return this.request("GET", `/runs/${encodeURIComponent(runId)}`);
  }

  async controlRun(
    runId: string,
    action: "pause" | "resume" | "cancel"
  ): Promise<Record<string, any>> {
    return this.request("POST", `/runs/${encodeURIComponent(runId)}/${action}`);
  }

  async getSnapshot(snapshotId: string): Promise<Record<string, any>> {
    return this.request("GET", `/snapshots/${encodeURIComponent(snapshotId)}`);
  }

  /** Exposed for deterministic tests and diagnostics; never contains secrets. */
  baseUrl(): string {
    const configured = String(
      this.config.get<string>("INTEL_API_BASE_URL") || ""
    ).trim();
    if (!configured) {
      throw new IntelParserControlClientError(
        "intel_not_configured",
        "INTEL_API_BASE_URL is not configured.",
        503,
        false
      );
    }
    const withoutTrailingSlash = configured.replace(/\/+$/, "");
    return withoutTrailingSlash.endsWith("/internal/parser-control")
      ? withoutTrailingSlash
      : `${withoutTrailingSlash}/internal/parser-control`;
  }

  private token(): string {
    const token = String(
      this.config.get<string>("PARSER_CONTROL_INTERNAL_TOKEN") ||
        this.config.get<string>("PROJECT_INTEL_INTERNAL_SYNC_TOKEN") ||
        ""
    ).trim();
    if (!token) {
      throw new IntelParserControlClientError(
        "intel_auth_not_configured",
        "Parser-control internal token is not configured.",
        503,
        false
      );
    }
    return token;
  }

  private timeoutMs(): number {
    const parsed = Number(
      this.config.get<string>("PARSER_CONTROL_INTEL_TIMEOUT_MS") || 10_000
    );
    if (!Number.isFinite(parsed)) return 10_000;
    return Math.min(Math.max(Math.floor(parsed), 1_000), 60_000);
  }

  private async request(
    method: "GET" | "POST" | "PATCH",
    path: string,
    data?: Record<string, any>,
    idempotencyKey?: string
  ): Promise<Record<string, any>> {
    const config: AxiosRequestConfig = {
      method,
      url: `${this.baseUrl()}${path}`,
      timeout: this.timeoutMs(),
      headers: {
        "x-internal-sync-token": this.token(),
        Accept: "application/json",
        ...(idempotencyKey ? { "x-idempotency-key": idempotencyKey } : {}),
      },
      ...(data ? { data } : {}),
      maxContentLength: 5 * 1024 * 1024,
    };

    try {
      const response = await axios.request(config);
      return unwrapIntelEnvelope(response.data);
    } catch (error: any) {
      if (error instanceof IntelParserControlClientError) throw error;
      throw normalizeIntelClientError(error);
    }
  }
}

export function unwrapIntelEnvelope(value: any): Record<string, any> {
  let current = value;
  for (let depth = 0; depth < 4; depth += 1) {
    if (!current || typeof current !== "object" || Array.isArray(current)) {
      break;
    }
    const hasEnvelopeMarker =
      Object.prototype.hasOwnProperty.call(current, "ok") ||
      Object.prototype.hasOwnProperty.call(current, "success");
    if (
      hasEnvelopeMarker &&
      Object.prototype.hasOwnProperty.call(current, "data")
    ) {
      current = current.data;
      continue;
    }
    break;
  }
  if (Array.isArray(current)) return { parsers: current };
  return current && typeof current === "object" ? current : { value: current };
}

function normalizeIntelClientError(error: any): IntelParserControlClientError {
  const responseStatus = Number(error?.response?.status || 0);
  const code = String(error?.code || "").toUpperCase();
  const timedOut = code === "ECONNABORTED" || code === "ETIMEDOUT";
  const unreachable =
    timedOut ||
    ["ECONNREFUSED", "ENOTFOUND", "EAI_AGAIN", "ECONNRESET"].includes(code);
  const remoteMessage =
    error?.response?.data?.message || error?.response?.data?.error;
  const message = timedOut
    ? "apiintel parser-control request timed out."
    : unreachable
    ? "apiintel parser-control is unreachable."
    : responseStatus
    ? `apiintel parser-control returned HTTP ${responseStatus}${
        remoteMessage ? `: ${safeText(remoteMessage, 300)}` : "."
      }`
    : "apiintel parser-control request failed.";
  return new IntelParserControlClientError(
    timedOut
      ? "intel_timeout"
      : unreachable
      ? "intel_unreachable"
      : "intel_error",
    message,
    responseStatus >= 400 && responseStatus < 500 ? responseStatus : 502,
    unreachable || timedOut || responseStatus >= 500
  );
}

function safeText(value: any, maxLength: number): string {
  return String(value || "")
    .replace(/mongodb(\+srv)?:\/\/[^@]+@/gi, "mongodb://[redacted]@")
    .replace(/[A-Za-z0-9_-]{32,}/g, "[redacted]")
    .slice(0, maxLength);
}
