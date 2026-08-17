import { ConfigService } from "@nestjs/config";
import { AdminDataSyncConfigService } from "./admin-data-sync-config.service";
import { AdminDataSyncService } from "./admin-data-sync.service";

const makeDb = (existingCollections: Record<string, number>) => ({
  collection: (name: string) => ({
    countDocuments: async () => existingCollections[name] || 0,
  }),
});

const makeService = (
  prodConnection: any,
  devConnection: any = prodConnection,
  env: Record<string, string> = {}
) => {
  const config = new AdminDataSyncConfigService(
    new ConfigService({
      ADMIN_DATA_SYNC_ENABLED: "true",
      ADMIN_DATA_SYNC_PROD_DB_NAME: "fomo_live",
      ADMIN_DATA_SYNC_DEV_DB_NAME: "fomo_dev",
      ...env,
    })
  );

  return new AdminDataSyncService(
    prodConnection,
    devConnection,
    {} as any,
    config,
    {} as any,
    {} as any
  );
};

describe("AdminDataSyncService", () => {
  it("reads prod to dev preview source counts through the prod connection and target counts through the dev connection", async () => {
    const prodDb = jest.fn((name: string) => {
      if (name !== "fomo_live") {
        throw new Error(`prod connection cannot read ${name}`);
      }
      return makeDb({ canonical_projects: 2, funding_rounds: 3 });
    });
    const devDb = jest.fn((name: string) => {
      if (name !== "fomo_dev") {
        throw new Error(`dev connection cannot read ${name}`);
      }
      return makeDb({ canonical_projects: 1 });
    });
    const service = makeService(
      { client: { db: prodDb } } as any,
      { client: { db: devDb } } as any,
      {
        ADMIN_DATA_SYNC_DEV_MONGO_URI:
          "mongodb://fomo_ai_dev_user:password@mongo:27017/fomo_dev?authSource=fomo_dev",
      }
    );

    const preview = await service.previewProdToDev();

    expect(preview.sourceDb).toBe("fomo_live");
    expect(preview.targetDb).toBe("fomo_dev");
    expect(preview.sourceCounts.canonical_projects).toBe(2);
    expect(preview.targetCounts.canonical_projects).toBe(1);
    expect(prodDb).toHaveBeenCalledWith("fomo_live");
    expect(prodDb).not.toHaveBeenCalledWith("fomo_dev");
    expect(devDb).toHaveBeenCalledWith("fomo_dev");
    expect(preview.missingCollections).toEqual([]);
    expect(preview.missingCollectionDetection).toBe("skipped");
    expect(preview.allowlistedCollections).not.toContain("users");
    expect(preview.sensitiveCollectionsExcluded).toContain("withdraws");
  });

  it("still previews target counts when the prod connection has no fomo_dev access", async () => {
    const prodConnection = {
      client: {
        db: (name: string) => {
          if (name !== "fomo_live") {
            throw Object.assign(new Error("not authorized on fomo_dev"), {
              code: 13,
              codeName: "Unauthorized",
            });
          }
          return makeDb({ canonical_projects: 2 });
        },
      },
    } as any;
    const devConnection = {
      client: {
        db: (name: string) =>
          name === "fomo_dev" ? makeDb({ canonical_projects: 1 }) : makeDb({}),
      },
    } as any;
    const service = makeService(prodConnection, devConnection, {
      ADMIN_DATA_SYNC_DEV_MONGO_URI:
        "mongodb://fomo_ai_dev_user:password@mongo:27017/fomo_dev?authSource=fomo_dev",
    });

    const preview = await service.previewProdToDev();

    expect(preview.sourceCounts.canonical_projects).toBe(2);
    expect(preview.targetCounts.canonical_projects).toBe(1);
  });

  it("does not call listCollections during preview", async () => {
    const listCollections = jest.fn(() => ({
      toArray: async () => {
        throw new Error("listCollections should not be called");
      },
    }));
    const connection = {
      client: {
        db: () => ({
          listCollections,
          collection: () => ({
            countDocuments: async () => 2,
          }),
        }),
      },
    } as any;
    const service = makeService(connection);

    const preview = await service.previewProdToDev();

    expect(listCollections).not.toHaveBeenCalled();
    expect(preview.sourceCounts.canonical_projects).toBe(2);
  });

  it("returns partial preview when target DB counts are unavailable", async () => {
    const prodConnection = {
      client: {
        db: () => makeDb({ canonical_projects: 2, market_assets: 4 }),
      },
    } as any;
    const devConnection = {
      client: {
        db: () => ({
          collection: () => ({
            countDocuments: async () => {
              throw Object.assign(new Error("not authorized on fomo_dev"), {
                code: 13,
                codeName: "Unauthorized",
              });
            },
          }),
        }),
      },
    } as any;
    const service = makeService(prodConnection, devConnection);

    const preview = await service.previewProdToDev();

    expect(preview.sourceCounts.canonical_projects).toBe(2);
    expect(preview.targetCounts.canonical_projects).toBeNull();
    expect(preview.warnings.length).toBeGreaterThan(0);
    expect(preview.warnings[0]).toContain("count unavailable");
  });

  it("returns controlled unavailable target counts when no dev connection is configured", async () => {
    const service = makeService(
      { client: { db: () => makeDb({ canonical_projects: 2 }) } } as any,
      {} as any
    );

    const preview = await service.previewProdToDev();

    expect(preview.sourceCounts.canonical_projects).toBe(2);
    expect(preview.targetCounts.canonical_projects).toBeNull();
    expect(preview.warnings[0]).toContain("Mongo connection is not configured");
  });

  it("returns partial preview when all counts are unavailable", async () => {
    const connection = {
      client: {
        db: () => ({
          collection: () => ({
            countDocuments: async () => {
              throw Object.assign(new Error("not authorized"), {
                code: 13,
                codeName: "Unauthorized",
              });
            },
          }),
        }),
      },
    } as any;
    const service = makeService(connection);

    const preview = await service.previewProdToDev();

    expect(preview.sourceCounts.canonical_projects).toBeNull();
    expect(preview.targetCounts.canonical_projects).toBeNull();
    expect(preview.warnings.length).toBeGreaterThan(0);
  });
});
