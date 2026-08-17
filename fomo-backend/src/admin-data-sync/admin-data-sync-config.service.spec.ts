import { BadRequestException, ServiceUnavailableException } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { AdminDataSyncConfigService } from "./admin-data-sync-config.service";

const makeConfig = (env: Record<string, string> = {}) =>
  new AdminDataSyncConfigService(
    new ConfigService({
      ADMIN_DATA_SYNC_ENABLED: "true",
      ADMIN_DATA_SYNC_PROD_DB_NAME: "fomo_live",
      ADMIN_DATA_SYNC_DEV_DB_NAME: "fomo_dev",
      ...env,
    })
  );

describe("AdminDataSyncConfigService", () => {
  it("accepts only the fixed fomo_live and fomo_dev DB names", () => {
    expect(() => makeConfig().assertExactDbNames()).not.toThrow();

    expect(() =>
      makeConfig({ ADMIN_DATA_SYNC_PROD_DB_NAME: "fomoland" }).assertExactDbNames()
    ).toThrow(ServiceUnavailableException);

    expect(() =>
      makeConfig({ ADMIN_DATA_SYNC_DEV_DB_NAME: "fomo_live" }).assertExactDbNames()
    ).toThrow(ServiceUnavailableException);
  });

  it("defaults dev to prod apply to disabled", () => {
    const service = new AdminDataSyncConfigService(new ConfigService({}));

    expect(service.isDevToProdAllowed()).toBe(false);
    expect(service.isDevToProdApplyEnabled()).toBe(false);
    expect(service.getProdToDevRunMode()).toBe("disabled");
    expect(service.isApprovalRequired()).toBe(true);
    expect(service.isDeleteDisabled()).toBe(true);
  });

  it("uses the explicit dev to prod apply flag over the legacy flag", () => {
    const service = makeConfig({
      ADMIN_DATA_SYNC_ALLOW_DEV_TO_PROD: "true",
      ADMIN_DATA_SYNC_DEV_TO_PROD_APPLY_ENABLED: "false",
    });

    expect(service.isDevToProdApplyEnabled()).toBe(false);
  });

  it("excludes sensitive collections from allowlists", () => {
    const service = makeConfig();

    expect(service.getProdToDevAllowlist()).not.toContain("users");
    expect(service.getProdToDevAllowlist()).not.toContain("admins");
    expect(service.getSensitiveCollections()).toContain("deposits");
  });

  it("rejects sensitive and arbitrary collections", () => {
    const service = makeConfig();

    expect(() =>
      service.normalizeRequestedCollections(["users"], "prod_to_dev")
    ).toThrow(BadRequestException);

    expect(() =>
      service.normalizeRequestedCollections(["not_a_fomo_collection"], "dev_to_prod")
    ).toThrow(BadRequestException);
  });

  it("uses explicit data sync Mongo URIs and falls back dev to AI_ADMIN_MONGO_URI", () => {
    const service = makeConfig({
      DB_URL: "mongodb://prod-user:password@mongo:27017/fomo_live?authSource=admin",
      ADMIN_DATA_SYNC_DEV_MONGO_URI: "",
      AI_ADMIN_MONGO_URI:
        "mongodb://fomo_ai_dev_user:password@mongo:27017/fomo_dev?authSource=fomo_dev",
    });

    expect(service.getProdMongoUri()).toContain("fomo_live");
    expect(service.getDevMongoUri()).toBe(
      "mongodb://fomo_ai_dev_user:password@mongo:27017/fomo_dev?authSource=fomo_dev"
    );
    expect(() => service.assertSafeConnectionRouting({ requireDevUri: true })).not.toThrow();
  });

  it("blocks prod and dev Mongo URIs that resolve to the same value", () => {
    const uri =
      "mongodb://fomo_ai_dev_user:password@mongo:27017/fomo_dev?authSource=fomo_dev";
    const service = makeConfig({
      ADMIN_DATA_SYNC_PROD_MONGO_URI: uri,
      ADMIN_DATA_SYNC_DEV_MONGO_URI: uri,
    });

    expect(() => service.assertSafeConnectionRouting({ requireDevUri: true })).toThrow(
      ServiceUnavailableException
    );
  });

  it("blocks production-like dev Mongo URI markers", () => {
    const productionLikeUris = [
      "mongodb://user:password@mongo:27017/fomo_live?authSource=fomo_live",
      "mongodb://user:password@mongo:27017/fomo_prod?authSource=fomo_prod",
      "mongodb://user:password@prod-mongo:27017/fomo_dev?authSource=fomo_dev",
      "mongodb://user:password@production-mongo:27017/fomo_dev?authSource=fomo_dev",
      "mongodb://user:password@live-mongo:27017/fomo_dev?authSource=fomo_dev",
    ];

    for (const ADMIN_DATA_SYNC_DEV_MONGO_URI of productionLikeUris) {
      const service = makeConfig({ ADMIN_DATA_SYNC_DEV_MONGO_URI });

      expect(() =>
        service.assertSafeConnectionRouting({ requireDevUri: true })
      ).toThrow(ServiceUnavailableException);
    }
  });

  it("does not require a dev Mongo URI for preview guards", () => {
    const service = makeConfig({
      ADMIN_DATA_SYNC_DEV_MONGO_URI: "",
      AI_ADMIN_MONGO_URI: "",
    });

    expect(service.getDevMongoUri()).toBe("");
    expect(() => service.assertSafeConnectionRouting()).not.toThrow();
    expect(() =>
      service.assertSafeConnectionRouting({ requireDevUri: true })
    ).toThrow(ServiceUnavailableException);
  });
});
