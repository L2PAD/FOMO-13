import { Injectable } from "@nestjs/common";

type RedactionOptions = {
  maxDepth?: number;
  maxArrayLength?: number;
  maxStringLength?: number;
};

const DEFAULT_OPTIONS: Required<RedactionOptions> = {
  maxDepth: 5,
  maxArrayLength: 50,
  maxStringLength: 1200,
};

const SENSITIVE_KEY_PATTERNS = [
  "password",
  "hash",
  "secret",
  "apiKey",
  "privateKey",
  "session",
  "cookie",
  "twoFactor",
  "twoFactorSecret",
  "emailConfirmation",
  "resetPassword",
  "walletPrivateKey",
  "accessToken",
  "refreshToken",
  "authToken",
  "csrfToken",
  "email",
  "walletAddress",
  "userWallet",
];

const SENSITIVE_EXACT_KEY_NAMES = ["token", "wallet", "wallets"];
const NON_SENSITIVE_EXACT_KEY_NAMES = [
  "requiresemailconfirmation",
  "emailconfirmationactive",
  "confirmationttlhours",
  "otpttlminutes",
  "codeacceptedinchattool",
];

const RAW_PAYLOAD_KEYS = [
  "rawPayload",
  "raw",
  "html",
  "body",
  "bodyHtml",
  "pageHtml",
  "request",
  "response",
];

const SENSITIVE_STRING_KEY_VALUE_PATTERN =
  /\b([a-z0-9_-]*(?:password|secret|api[_-]?key|private[_-]?key|access[_-]?token|refresh[_-]?token|auth[_-]?token|csrf[_-]?token|jwt|token)[a-z0-9_-]*)(\s*[:=]\s*)(?:"[^"]*"|'[^']*'|[^\s,;&]+)/gi;

const RAW_PAYLOAD_STRING_KEY_VALUE_PATTERN =
  /\b(rawPayload|raw|html|body|bodyHtml|pageHtml|request|response)(\s*[:=]\s*)(?:"[^"]*"|'[^']*'|[^\s,;&]+)/gi;

@Injectable()
export class FomoV2AiRedactionService {
  redact(value: unknown, options: RedactionOptions = {}): unknown {
    return this.redactValue(value, 0, { ...DEFAULT_OPTIONS, ...options });
  }

  stringify(value: unknown, options: RedactionOptions = {}): string {
    return JSON.stringify(this.redact(value, options), null, 2);
  }

  private redactValue(
    value: unknown,
    depth: number,
    options: Required<RedactionOptions>
  ): unknown {
    if (value === null || value === undefined) return value;

    if (typeof value === "string") {
      return this.redactString(value, options.maxStringLength);
    }

    if (typeof value === "number" || typeof value === "boolean") return value;

    if (value instanceof Date) return value.toISOString();

    if (depth >= options.maxDepth) {
      return "[TRUNCATED_DEPTH]";
    }

    if (Array.isArray(value)) {
      const items = value
        .slice(0, options.maxArrayLength)
        .map((item) => this.redactValue(item, depth + 1, options));

      if (value.length > options.maxArrayLength) {
        items.push(`[TRUNCATED_ARRAY:${value.length - options.maxArrayLength}]`);
      }

      return items;
    }

    if (typeof value === "object") {
      const source = this.toPlainObject(value);
      const result: Record<string, unknown> = {};

      for (const [key, item] of Object.entries(source)) {
        if (this.isSensitiveKey(key)) {
          result[key] = "[REDACTED]";
          continue;
        }

        if (this.isRawPayloadKey(key)) {
          result[key] = "[OMITTED_RAW_PAYLOAD]";
          continue;
        }

        result[key] = this.redactValue(item, depth + 1, options);
      }

      return result;
    }

    return String(value);
  }

  private toPlainObject(value: object): Record<string, unknown> {
    if (typeof (value as any).toObject === "function") {
      return (value as any).toObject({ depopulate: true, versionKey: false });
    }

    return value as Record<string, unknown>;
  }

  private isSensitiveKey(key: string): boolean {
    const normalized = key.toLowerCase();

    if (NON_SENSITIVE_EXACT_KEY_NAMES.includes(normalized)) return false;

    if (SENSITIVE_EXACT_KEY_NAMES.includes(normalized)) return true;

    return SENSITIVE_KEY_PATTERNS.some((pattern) =>
      normalized.includes(pattern.toLowerCase())
    );
  }

  private isRawPayloadKey(key: string): boolean {
    const normalized = key.toLowerCase();
    return RAW_PAYLOAD_KEYS.some((pattern) => normalized === pattern.toLowerCase());
  }

  private redactString(value: string, maxLength: number): string {
    const withoutSecretLikeTokens = value
      .replace(/mongodb(?:\+srv)?:\/\/[^\s"']+/gi, "mongodb://[REDACTED]")
      .replace(
        SENSITIVE_STRING_KEY_VALUE_PATTERN,
        (_match, key, separator) => `${key}${separator}[REDACTED]`
      )
      .replace(
        RAW_PAYLOAD_STRING_KEY_VALUE_PATTERN,
        (_match, key, separator) => `${key}${separator}[OMITTED_RAW_PAYLOAD]`
      )
      .replace(/sk-[A-Za-z0-9_-]{16,}/g, "[REDACTED]")
      .replace(/\beyJ[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+\b/g, "[REDACTED]")
      .replace(/Bearer\s+[A-Za-z0-9._~+/=-]{16,}/gi, "Bearer [REDACTED]")
      .replace(/\b0x[a-fA-F0-9]{64}\b/g, "[REDACTED_HASH]")
      .replace(/\b0x[a-fA-F0-9]{40}\b/g, "[REDACTED_WALLET]")
      .replace(/[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}/g, "[REDACTED_EMAIL]");

    if (withoutSecretLikeTokens.length <= maxLength) {
      return withoutSecretLikeTokens;
    }

    return `${withoutSecretLikeTokens.slice(0, maxLength)}...[TRUNCATED_STRING:${
      withoutSecretLikeTokens.length - maxLength
    }]`;
  }
}
