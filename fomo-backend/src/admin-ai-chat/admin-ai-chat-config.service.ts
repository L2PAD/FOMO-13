import { Injectable, ServiceUnavailableException } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import {
  ADMIN_AI_REQUIRED_DB_NAME,
  ADMIN_AI_REQUIRED_DB_TARGET,
  ADMIN_AI_REQUIRED_PARSER_DB_NAME,
} from "./admin-ai-chat.constants";
import { AdminAiAccessMode } from "./fomo-v2-context/fomo-v2-ai-types";

const DISABLED_VALUES = ["false", "0", "off", "no"];
const ENABLED_VALUES = ["true", "1", "on", "yes"];
const HARD_FORBIDDEN_DB_MARKERS = [
  "fomo_prod",
  "fomo_live",
  "fomo_market",
  "production",
  "prod",
  "live",
];
const READ_DB_ALLOWLIST = [
  ADMIN_AI_REQUIRED_DB_NAME,
  ADMIN_AI_REQUIRED_PARSER_DB_NAME,
];
const WRITE_DB_ALLOWLIST = [ADMIN_AI_REQUIRED_DB_NAME];
const RAW_MONGO_INPUT_KEYS = [
  "mongoQuery",
  "mongoUpdate",
  "mongoPipeline",
  "rawQuery",
  "rawUpdate",
  "rawCommand",
  "runCommand",
  "eval",
  "shell",
  "mongosh",
  "database",
  "dbName",
  "collection",
  "collectionName",
  "pipeline",
  "$where",
  "$out",
  "$merge",
  "$function",
  "$accumulator",
];
const DANGEROUS_INPUT_KEYS = [
  "drop",
  "dropDatabase",
  "dropCollection",
  "deleteMany",
  "updateMany",
  "bulkWrite",
  "renameCollection",
];
const DANGEROUS_INPUT_TEXT =
  /--drop|deleteMany|updateMany|bulkWrite|dropDatabase|dropCollection|renameCollection|db\.runCommand|mongosh|eval\s*\(/i;

type AiToolDbAccessInput = {
  dbName: string;
  access: "read" | "write";
  parserDb?: boolean;
  dangerous?: boolean;
  accessMode?: AdminAiAccessMode;
};

@Injectable()
export class AdminAiChatConfigService {
  constructor(private readonly configService: ConfigService) {}

  isChatEnabled(): boolean {
    const value = this.configService.get<string>("AI_ADMIN_CHAT_ENABLED");
    if (value === undefined || value === null || value === "") return true;
    return !DISABLED_VALUES.includes(String(value).toLowerCase());
  }

  ensureChatEnabled() {
    if (!this.isChatEnabled()) {
      throw new ServiceUnavailableException("Admin AI Chat is disabled");
    }

    this.ensureDevDatabaseScope();
  }

  ensureDevDatabaseScope() {
    const target = this.value("AI_ADMIN_DB_TARGET").toLowerCase();
    if (target !== ADMIN_AI_REQUIRED_DB_TARGET) {
      throw new ServiceUnavailableException(
        "Admin AI Chat is available only when AI_ADMIN_DB_TARGET=development"
      );
    }

    const dbName = this.value("AI_ADMIN_DB_NAME");
    if (dbName !== ADMIN_AI_REQUIRED_DB_NAME) {
      throw new ServiceUnavailableException(
        "Admin AI Chat requires AI_ADMIN_DB_NAME=fomo_dev"
      );
    }

    const parserDbName = this.value("AI_ADMIN_PARSER_DB_NAME");
    if (parserDbName !== ADMIN_AI_REQUIRED_PARSER_DB_NAME) {
      throw new ServiceUnavailableException(
        "Admin AI Chat requires AI_ADMIN_PARSER_DB_NAME=parser_new_dev"
      );
    }

    const uri = this.value("AI_ADMIN_MONGO_URI");
    if (!uri) {
      throw new ServiceUnavailableException(
        "Admin AI Chat requires AI_ADMIN_MONGO_URI for the development database"
      );
    }

    if (this.isHardForbiddenDbReference(uri)) {
      throw new ServiceUnavailableException(
        "Admin AI Chat refuses production-like AI_ADMIN_MONGO_URI"
      );
    }

    if (
      this.isHardForbiddenDbReference(dbName) ||
      this.isHardForbiddenDbReference(parserDbName)
    ) {
      throw new ServiceUnavailableException(
        "Admin AI Chat database names must be development-only"
      );
    }
  }

  getMongoUri(): string {
    this.ensureDevDatabaseScope();
    return this.value("AI_ADMIN_MONGO_URI");
  }

  getDbName(): string {
    return this.value("AI_ADMIN_DB_NAME") || ADMIN_AI_REQUIRED_DB_NAME;
  }

  getParserDbName(): string {
    return this.value("AI_ADMIN_PARSER_DB_NAME") || ADMIN_AI_REQUIRED_PARSER_DB_NAME;
  }

  getTrackingId(): string {
    return this.value("OPEN_AI_TRACKING_ID");
  }

  isWriteToolsEnabled(): boolean {
    return this.isExplicitlyEnabled("AI_ADMIN_WRITE_TOOLS_ENABLED");
  }

  isParserWriteToolsEnabled(): boolean {
    return this.isExplicitlyEnabled("AI_ADMIN_PARSER_WRITE_TOOLS_ENABLED");
  }

  isDangerousToolsEnabled(): boolean {
    return (
      this.isExplicitlyEnabled("AI_ADMIN_DANGEROUS_TOOLS_ENABLED") ||
      this.isExplicitlyEnabled("AI_ADMIN_DANGEROUS_DEV_TOOLS_ENABLED")
    );
  }

  isFullAccessModeAllowed(): boolean {
    return this.isExplicitlyEnabled("AI_ADMIN_ALLOW_FULL_ACCESS_MODE");
  }

  getDefaultAccessMode(): AdminAiAccessMode {
    return this.normalizeAccessMode(this.value("AI_ADMIN_DEFAULT_ACCESS_MODE"));
  }

  normalizeAccessMode(value: unknown): AdminAiAccessMode {
    const mode = String(value || "").trim();
    if (mode === "read_only") return "read_only";
    if (mode === "full_access") {
      return this.isFullAccessModeAllowed() ? "full_access" : "write_with_approval";
    }
    return "write_with_approval";
  }

  ensureAiToolDbAccess(input: AiToolDbAccessInput) {
    this.ensureDevDatabaseScope();

    const dbName = String(input.dbName || "").trim();
    if (!dbName || this.isHardForbiddenDbReference(dbName)) {
      throw new ServiceUnavailableException(
        "Admin AI tool refused hard-forbidden database target"
      );
    }

    if (input.access === "read" && !READ_DB_ALLOWLIST.includes(dbName)) {
      throw new ServiceUnavailableException(
        "Admin AI read tools are limited to fomo_dev and parser_new_dev"
      );
    }

    if (input.access === "write") {
      if (input.accessMode === "read_only") {
        throw new ServiceUnavailableException(
          "WRITE_TOOLS_DISABLED_BY_ACCESS_MODE"
        );
      }

      const parserDevWriteAllowed =
        input.parserDb &&
        dbName === ADMIN_AI_REQUIRED_PARSER_DB_NAME &&
        this.isParserWriteToolsEnabled();

      if (!WRITE_DB_ALLOWLIST.includes(dbName) && !parserDevWriteAllowed) {
        throw new ServiceUnavailableException(
          "Admin AI write tools are limited to fomo_dev and enabled parser_new_dev tools"
        );
      }

      if (input.parserDb && !this.isParserWriteToolsEnabled()) {
        throw new ServiceUnavailableException(
          "Admin AI parser DB write tools are disabled"
        );
      }

      if (!this.isWriteToolsEnabled()) {
        throw new ServiceUnavailableException(
          "Admin AI write tools are disabled"
        );
      }
    }

    if (input.dangerous && !this.isDangerousToolsEnabled()) {
      throw new ServiceUnavailableException(
        "Admin AI dangerous tools are disabled"
      );
    }
  }

  assertSafeAiToolInput(value: unknown, path = "input") {
    if (value === undefined || value === null) return;

    if (typeof value === "string") {
      if (!this.isDangerousToolsEnabled() && DANGEROUS_INPUT_TEXT.test(value)) {
        throw new ServiceUnavailableException(
          `Admin AI tool input contains forbidden dangerous operation text at ${path}`
        );
      }
      return;
    }

    if (typeof value !== "object") return;

    if (Array.isArray(value)) {
      value.forEach((item, index) =>
        this.assertSafeAiToolInput(item, `${path}[${index}]`)
      );
      return;
    }

    for (const [key, item] of Object.entries(value as Record<string, unknown>)) {
      const normalized = key.trim();
      const lower = normalized.toLowerCase();
      const rawForbidden = RAW_MONGO_INPUT_KEYS.some(
        (forbidden) => forbidden.toLowerCase() === lower
      );
      if (rawForbidden) {
        throw new ServiceUnavailableException(
          `Admin AI raw Mongo input is forbidden at ${path}.${key}`
        );
      }

      const dangerousForbidden =
        !this.isDangerousToolsEnabled() &&
        DANGEROUS_INPUT_KEYS.some(
          (forbidden) => forbidden.toLowerCase() === lower
        );
      if (dangerousForbidden) {
        throw new ServiceUnavailableException(
          `Admin AI dangerous input is forbidden at ${path}.${key}`
        );
      }

      this.assertSafeAiToolInput(item, `${path}.${key}`);
    }
  }

  canOpenConnection(): boolean {
    if (!this.isChatEnabled()) return false;

    try {
      this.ensureDevDatabaseScope();
      return true;
    } catch (error) {
      return false;
    }
  }

  private value(key: string): string {
    return String(this.configService.get<string>(key) || "").trim();
  }

  private isExplicitlyEnabled(key: string): boolean {
    return ENABLED_VALUES.includes(this.value(key).toLowerCase());
  }

  private isHardForbiddenDbReference(value: string): boolean {
    const target = String(value || "").toLowerCase();
    return HARD_FORBIDDEN_DB_MARKERS.some((marker) => target.includes(marker));
  }
}
