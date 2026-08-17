import {
  BadRequestException,
  Injectable,
  ServiceUnavailableException,
} from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import * as fs from "fs";
import * as path from "path";
import { buildMongoUri } from "../config/mongo.config";
import {
  ADMIN_DATA_SYNC_DEV_CONNECTION,
  ADMIN_DATA_SYNC_PROD_CONNECTION,
} from "./admin-data-sync.constants";

export const ADMIN_DATA_SYNC_EXPECTED_PROD_DB = "fomo_live";
export const ADMIN_DATA_SYNC_EXPECTED_DEV_DB = "fomo_dev";
export const ADMIN_DATA_SYNC_CONFIRMATION_PHRASE =
  "PROMOTE FOMO V2 DEV TO PROD";
export const ADMIN_DATA_SYNC_DEV_URI_PROD_MARKERS = [
  "fomo_live",
  "fomo_prod",
  "prod",
  "production",
  "live",
] as const;

export const PROD_TO_DEV_COLLECTION_ALLOWLIST = [
  "canonical_projects",
  "market_assets",
  "market_project_read_models",
  "market_project_histories",
  "project_asset_links",
  "canonical_project_sources",
  "source_entities",
  "review_batches",
  "backers",
  "backer_portfolio_holdings",
  "funding_rounds",
  "funding_round_participants",
  "token_allocations",
  "vesting_schedules",
  "unlock_events",
  "import_candidates",
  "news_articles",
  "source_evidence",
  "source_conflicts",
  "review_cases",
  "backer_sources",
  "token_allocation_snapshots",
  "vesting_events",
  "source_policies",
  "unresolved_backers",
] as const;

export const DEV_TO_PROD_COLLECTION_ALLOWLIST = [
  "canonical_projects",
  "project_asset_links",
  "canonical_project_sources",
  "source_entities",
  "review_batches",
  "backers",
  "backer_portfolio_holdings",
  "funding_rounds",
  "funding_round_participants",
  "token_allocations",
  "vesting_schedules",
  "unlock_events",
  "import_candidates",
  "news_articles",
  "source_evidence",
  "source_conflicts",
  "review_cases",
  "backer_sources",
  "token_allocation_snapshots",
  "vesting_events",
  "source_policies",
  "unresolved_backers",
] as const;

export const DERIVED_HEAVY_COLLECTIONS = [
  "market_project_read_models",
  "market_project_histories",
  "market_assets",
] as const;

export const SENSITIVE_COLLECTIONS = [
  "users",
  "admins",
  "sessions",
  "deposits",
  "withdraws",
  "support",
  "auth",
  "tokens",
  "auth_tokens",
  "access_tokens",
  "refresh_tokens",
  "password_resets",
  "password_reset_tokens",
  "email_confirmations",
  "email_resets",
  "email_reset_tokens",
  "two_factor",
] as const;

export type AdminDataSyncDirection = "prod_to_dev" | "dev_to_prod";
export type AdminDataSyncProdToDevRunMode =
  | "disabled"
  | "backend-native"
  | "host-runner";

@Injectable()
export class AdminDataSyncConfigService {
  constructor(private readonly configService: ConfigService) {}

  isEnabled(): boolean {
    return this.readBool("ADMIN_DATA_SYNC_ENABLED", false);
  }

  isDevToProdAllowed(): boolean {
    return this.isDevToProdApplyEnabled();
  }

  isProdToDevEnabled(): boolean {
    return this.readBool("ADMIN_DATA_SYNC_PROD_TO_DEV_ENABLED", true);
  }

  isDevToProdDiffEnabled(): boolean {
    return this.readBool("ADMIN_DATA_SYNC_DEV_TO_PROD_DIFF_ENABLED", true);
  }

  isDevToProdApplyEnabled(): boolean {
    const explicit = this.readOptionalString(
      "ADMIN_DATA_SYNC_DEV_TO_PROD_APPLY_ENABLED"
    );
    if (explicit !== undefined) {
      return this.parseBool(explicit, false);
    }

    return this.readBool("ADMIN_DATA_SYNC_ALLOW_DEV_TO_PROD", false);
  }

  isConfirmationPhraseRequired(): boolean {
    return this.readBool("ADMIN_DATA_SYNC_REQUIRE_CONFIRMATION_PHRASE", true);
  }

  isApprovalRequired(): boolean {
    return this.readBool("ADMIN_DATA_SYNC_REQUIRE_APPROVAL", true);
  }

  isDeleteDisabled(): boolean {
    return this.readBool("ADMIN_DATA_SYNC_DISABLE_DELETE", true);
  }

  getProdDbName(): string {
    return this.readString(
      "ADMIN_DATA_SYNC_PROD_DB_NAME",
      ADMIN_DATA_SYNC_EXPECTED_PROD_DB
    );
  }

  getDevDbName(): string {
    return this.readString(
      "ADMIN_DATA_SYNC_DEV_DB_NAME",
      ADMIN_DATA_SYNC_EXPECTED_DEV_DB
    );
  }

  getProdMongoUri(): string {
    const explicit = this.readOptionalString("ADMIN_DATA_SYNC_PROD_MONGO_URI");
    if (explicit) return explicit;

    return buildMongoUri(this.mongoEnv(this.getProdDbName()));
  }

  getDevMongoUri(): string {
    return (
      this.readOptionalString("ADMIN_DATA_SYNC_DEV_MONGO_URI") ||
      this.readOptionalString("AI_ADMIN_MONGO_URI") ||
      ""
    );
  }

  getProdConnectionName(): string {
    return ADMIN_DATA_SYNC_PROD_CONNECTION;
  }

  getDevConnectionName(): string {
    return ADMIN_DATA_SYNC_DEV_CONNECTION;
  }

  getMongoContainer(): string {
    return this.readString("ADMIN_DATA_SYNC_MONGO_CONTAINER", "fomo-mongo");
  }

  getBackupDir(): string {
    return this.readString(
      "ADMIN_DATA_SYNC_BACKUP_DIR",
      "/opt/stacks/fomo/backups"
    );
  }

  getMaxDiffDocuments(): number {
    const value = Number(this.readString("ADMIN_DATA_SYNC_MAX_DIFF_DOCS", "500"));
    if (!Number.isFinite(value) || value <= 0) return 500;
    return Math.min(Math.trunc(value), 500);
  }

  getMaxApplyDocuments(): number {
    const value = Number(this.readString("ADMIN_DATA_SYNC_MAX_APPLY_DOCS", "200"));
    if (!Number.isFinite(value) || value <= 0) return 200;
    return Math.min(Math.trunc(value), 500);
  }

  getMaxCollectionsPerPromotion(): number {
    const value = Number(
      this.readString("ADMIN_DATA_SYNC_MAX_COLLECTIONS_PER_PROMOTION", "5")
    );
    if (!Number.isFinite(value) || value <= 0) return 5;
    return Math.min(Math.trunc(value), 10);
  }

  getProdToDevRunMode(): AdminDataSyncProdToDevRunMode {
    const value = this.readString(
      "ADMIN_DATA_SYNC_PROD_TO_DEV_RUN_MODE",
      "disabled"
    );

    if (["disabled", "backend-native", "host-runner"].includes(value)) {
      return value as AdminDataSyncProdToDevRunMode;
    }

    return "disabled";
  }

  getConfirmationPhrase(): string {
    return this.readString(
      "ADMIN_DATA_SYNC_CONFIRMATION_PHRASE",
      ADMIN_DATA_SYNC_CONFIRMATION_PHRASE
    );
  }

  getProdToDevAllowlist(): string[] {
    return this.uniqueSafeCollections([...PROD_TO_DEV_COLLECTION_ALLOWLIST]);
  }

  getDevToProdAllowlist(): string[] {
    return this.uniqueSafeCollections([...DEV_TO_PROD_COLLECTION_ALLOWLIST]);
  }

  getSensitiveCollections(): string[] {
    return [...SENSITIVE_COLLECTIONS];
  }

  getDerivedHeavyCollections(): string[] {
    return [...DERIVED_HEAVY_COLLECTIONS];
  }

  getScriptPath(): string {
    const configured = this.readString("ADMIN_DATA_SYNC_SCRIPT_PATH", "");
    if (configured) return configured;

    const candidates = [
      path.resolve(process.cwd(), "scripts", "sync-fomo-live-to-dev.sh"),
      path.resolve(process.cwd(), "..", "scripts", "sync-fomo-live-to-dev.sh"),
      path.resolve(
        process.cwd(),
        "backend",
        "scripts",
        "sync-fomo-live-to-dev.sh"
      ),
    ];

    return candidates.find((candidate) => fs.existsSync(candidate)) || candidates[0];
  }

  assertEnabled(): void {
    if (!this.isEnabled()) {
      throw new ServiceUnavailableException("Admin Data Sync is disabled");
    }
  }

  assertProdToDevEnabled(): void {
    this.assertEnabled();
    if (!this.isProdToDevEnabled()) {
      throw new ServiceUnavailableException("Prod to dev sync is disabled");
    }
  }

  assertDevToProdDiffEnabled(): void {
    this.assertEnabled();
    if (!this.isDevToProdDiffEnabled()) {
      throw new ServiceUnavailableException("Dev to prod diff is disabled");
    }
  }

  assertExactDbNames(): void {
    const prodDb = this.getProdDbName();
    const devDb = this.getDevDbName();

    if (
      prodDb !== ADMIN_DATA_SYNC_EXPECTED_PROD_DB ||
      devDb !== ADMIN_DATA_SYNC_EXPECTED_DEV_DB ||
      String(prodDb) === String(devDb)
    ) {
      throw new ServiceUnavailableException(
        "Admin Data Sync requires prod=fomo_live and dev=fomo_dev"
      );
    }
  }

  assertSafeConnectionRouting(options: { requireDevUri?: boolean } = {}): void {
    this.assertExactDbNames();

    const prodUri = this.getProdMongoUri();
    const devUri = this.getDevMongoUri();

    if (options.requireDevUri && !devUri) {
      throw new ServiceUnavailableException(
        "Admin Data Sync requires ADMIN_DATA_SYNC_DEV_MONGO_URI or AI_ADMIN_MONGO_URI for fomo_dev"
      );
    }

    if (prodUri && devUri && prodUri === devUri) {
      throw new ServiceUnavailableException(
        "Admin Data Sync prod and dev Mongo URIs must be different"
      );
    }

    if (devUri && this.isProductionLikeDevUri(devUri)) {
      throw new ServiceUnavailableException(
        "Admin Data Sync refuses production-like ADMIN_DATA_SYNC_DEV_MONGO_URI"
      );
    }
  }

  canOpenProdConnection(): boolean {
    try {
      this.assertSafeConnectionRouting();
      return Boolean(this.getProdMongoUri());
    } catch (error) {
      return false;
    }
  }

  canOpenDevConnection(): boolean {
    try {
      this.assertSafeConnectionRouting({ requireDevUri: true });
      return Boolean(this.getDevMongoUri());
    } catch (error) {
      return false;
    }
  }

  getConnectionSummary() {
    return {
      prodDb: this.getProdDbName(),
      devDb: this.getDevDbName(),
      prodConnection: this.getProdConnectionName(),
      devConnection: this.getDevConnectionName(),
      prodUriHost: this.uriHost(this.getProdMongoUri()),
      devUriHost: this.uriHost(this.getDevMongoUri()),
    };
  }

  formatConnectionSummary(): string {
    const summary = this.getConnectionSummary();
    return [
      "Admin Data Sync connections:",
      `prodDb=${summary.prodDb}`,
      `devDb=${summary.devDb}`,
      `prodConnection=${summary.prodConnection}`,
      `devConnection=${summary.devConnection}`,
      `prodUriHost=${summary.prodUriHost}`,
      `devUriHost=${summary.devUriHost}`,
    ].join("\n");
  }

  assertSafeCollection(
    collection: string,
    direction: AdminDataSyncDirection
  ): void {
    const normalized = this.normalizeCollection(collection);

    if (!normalized) {
      throw new BadRequestException("Collection name is required");
    }

    if (this.isSensitiveCollection(normalized)) {
      throw new BadRequestException(
        `Sensitive collection is not allowed: ${normalized}`
      );
    }

    const allowlist =
      direction === "prod_to_dev"
        ? this.getProdToDevAllowlist()
        : this.getDevToProdAllowlist();

    if (!allowlist.includes(normalized)) {
      throw new BadRequestException(`Collection is not allowlisted: ${normalized}`);
    }

    if (
      direction === "dev_to_prod" &&
      normalized === "market_project_histories"
    ) {
      throw new BadRequestException(
        "market_project_histories promotion requires special handling"
      );
    }
  }

  normalizeRequestedCollections(
    collections: unknown,
    direction: AdminDataSyncDirection
  ): string[] {
    const values = Array.isArray(collections)
      ? collections
      : direction === "prod_to_dev"
      ? this.getProdToDevAllowlist()
      : [];

    const normalized = this.uniqueSafeCollections(
      values.map((value) => this.normalizeCollection(value))
    );

    if (!normalized.length) {
      throw new BadRequestException("At least one collection is required");
    }

    normalized.forEach((collection) =>
      this.assertSafeCollection(collection, direction)
    );

    return normalized;
  }

  getPublicConfig() {
    this.assertSafeConnectionRouting();

    return {
      enabled: this.isEnabled(),
      prodToDevEnabled: this.isProdToDevEnabled(),
      devToProdDiffEnabled: this.isDevToProdDiffEnabled(),
      devToProdApplyEnabled: this.isDevToProdApplyEnabled(),
      sourceDb: this.getProdDbName(),
      targetDb: this.getDevDbName(),
      prodDb: this.getProdDbName(),
      devDb: this.getDevDbName(),
      prodConnection: this.getProdConnectionName(),
      devConnection: this.getDevConnectionName(),
      prodUriHost: this.uriHost(this.getProdMongoUri()),
      devUriHost: this.uriHost(this.getDevMongoUri()),
      prodToDevRunMode: this.getProdToDevRunMode(),
      prodToDevRunEnabled:
        this.isProdToDevEnabled() &&
        this.getProdToDevRunMode() !== "disabled",
      mongoContainer: this.getMongoContainer(),
      backupDir: this.getBackupDir(),
      scriptPath: this.getScriptPath(),
      allowDevToProd: this.isDevToProdAllowed(),
      requireApproval: this.isApprovalRequired(),
      requireConfirmationPhrase: this.isConfirmationPhraseRequired(),
      disableDelete: this.isDeleteDisabled(),
      maxDiffDocuments: this.getMaxDiffDocuments(),
      maxApplyDocuments: this.getMaxApplyDocuments(),
      maxCollectionsPerPromotion: this.getMaxCollectionsPerPromotion(),
      prodToDevAllowlist: this.getProdToDevAllowlist(),
      devToProdAllowlist: this.getDevToProdAllowlist(),
      derivedHeavyCollections: this.getDerivedHeavyCollections(),
      sensitiveCollectionsExcluded: this.getSensitiveCollections(),
      confirmationPhrase: this.getConfirmationPhrase(),
      devToProdMode: this.isDevToProdAllowed() ? "guarded_apply" : "dry_run_only",
    };
  }

  isSensitiveCollection(collection: string): boolean {
    return SENSITIVE_COLLECTIONS.includes(
      this.normalizeCollection(collection) as any
    );
  }

  private normalizeCollection(value: unknown): string {
    return String(value || "").trim();
  }

  private uniqueSafeCollections(collections: string[]): string[] {
    return Array.from(new Set(collections.map((value) => value.trim()).filter(Boolean)))
      .filter((collection) => !this.isSensitiveCollection(collection));
  }

  private readString(key: string, fallback: string): string {
    return this.readOptionalString(key) ?? fallback;
  }

  private readOptionalString(key: string): string | undefined {
    const value = this.configService.get<string>(key);
    const resolved = value ?? process.env[key];
    if (resolved === undefined || resolved === null) return undefined;
    return String(resolved).trim();
  }

  private mongoEnv(dbName: string): NodeJS.ProcessEnv {
    return {
      ...process.env,
      DB_URL: this.readOptionalString("DB_URL") ?? process.env.DB_URL,
      MONGO_URL: this.readOptionalString("MONGO_URL") ?? process.env.MONGO_URL,
      MONGODB_URI:
        this.readOptionalString("MONGODB_URI") ?? process.env.MONGODB_URI,
      DB_NAME: dbName,
    };
  }

  private readBool(key: string, fallback: boolean): boolean {
    return this.parseBool(this.readString(key, fallback ? "true" : "false"), fallback);
  }

  private parseBool(value: string, fallback: boolean): boolean {
    const raw = String(value || "").toLowerCase();
    if (["1", "true", "yes", "on"].includes(raw)) return true;
    if (["0", "false", "no", "off"].includes(raw)) return false;
    return fallback;
  }

  private isProductionLikeDevUri(value: string): boolean {
    const target = String(value || "").toLowerCase();
    return ADMIN_DATA_SYNC_DEV_URI_PROD_MARKERS.some((marker) =>
      target.includes(marker)
    );
  }

  private uriHost(uri: string): string {
    const value = String(uri || "").trim();
    if (!value) return "unconfigured";

    try {
      return new URL(value).host || "unknown-host";
    } catch (error) {
      return "invalid-uri";
    }
  }
}
