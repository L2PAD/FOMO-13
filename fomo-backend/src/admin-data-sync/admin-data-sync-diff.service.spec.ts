import { BadRequestException, ForbiddenException } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { Types } from "mongoose";
import { AdminDataSyncConfigService } from "./admin-data-sync-config.service";
import {
  AdminDataSyncDiffService,
  collectChangedFields,
  stableHashDocument,
} from "./admin-data-sync-diff.service";

const makeConfig = (env: Record<string, string> = {}) =>
  new AdminDataSyncConfigService(
    new ConfigService({
      ADMIN_DATA_SYNC_ENABLED: "true",
      ADMIN_DATA_SYNC_PROD_DB_NAME: "fomo_live",
      ADMIN_DATA_SYNC_DEV_DB_NAME: "fomo_dev",
      ADMIN_DATA_SYNC_DEV_MONGO_URI:
        "mongodb://fomo_ai_dev_user:password@mongo:27017/fomo_dev?authSource=fomo_dev",
      ...env,
    })
  );

const sameId = (left: any, right: any) => String(left) === String(right);

const makeCollection = (docs: any[]) => ({
  find: jest.fn(() => {
    const cursor = {
      toArray: async () => docs,
      limit: jest.fn((limit: number) => ({
        toArray: async () => docs.slice(0, limit),
      })),
    };
    return cursor;
  }),
  findOne: jest.fn(async (filter: any) =>
    docs.find((doc) => sameId(doc._id, filter._id))
  ),
  bulkWrite: jest.fn(async () => ({ ok: 1 })),
});

const makeService = (input: {
  sourceDocs?: Record<string, any[]>;
  targetDocs?: Record<string, any[]>;
  config?: AdminDataSyncConfigService;
  promotionDoc?: any;
}) => {
  const sourceCollections = new Map<string, any>();
  const targetCollections = new Map<string, any>();

  Object.entries(input.sourceDocs || {}).forEach(([name, docs]) =>
    sourceCollections.set(name, makeCollection(docs))
  );
  Object.entries(input.targetDocs || {}).forEach(([name, docs]) =>
    targetCollections.set(name, makeCollection(docs))
  );

  const devDb = jest.fn((name: string) => ({
    collection: (collection: string) => {
      if (name !== "fomo_dev") {
        throw new Error(`dev connection cannot read ${name}`);
      }
      if (!sourceCollections.has(collection)) {
        sourceCollections.set(collection, makeCollection([]));
      }
      return sourceCollections.get(collection);
    },
  }));
  const prodDb = jest.fn((name: string) => ({
    collection: (collection: string) => {
      if (name !== "fomo_live") {
        throw new Error(`prod connection cannot read ${name}`);
      }
      if (!targetCollections.has(collection)) {
        targetCollections.set(collection, makeCollection([]));
      }
      return targetCollections.get(collection);
    },
  }));

  const prodConnection = {
    client: {
      db: prodDb,
    },
  } as any;
  const devConnection = {
    client: {
      db: devDb,
    },
  } as any;

  const promotionModel = {
    create: jest.fn(async (doc: any) => ({
      ...doc,
      toObject: () => doc,
    })),
    findOne: jest.fn(async () => input.promotionDoc || null),
    find: jest.fn(() => ({ sort: () => ({ limit: () => ({ lean: async () => [] }) }) })),
  } as any;
  const snapshotModel = { create: jest.fn(async (doc: any) => doc) } as any;
  const auditModel = { create: jest.fn(async (doc: any) => doc) } as any;

  return {
    service: new AdminDataSyncDiffService(
      prodConnection,
      devConnection,
      promotionModel,
      snapshotModel,
      auditModel,
      input.config || makeConfig()
    ),
    promotionModel,
    snapshotModel,
    prodDb,
    devDb,
    targetCollections,
  };
};

describe("AdminDataSyncDiffService", () => {
  it("ignores volatile fields in hashes and changed fields", () => {
    const before = { name: "A", updatedAt: new Date("2026-01-01") };
    const after = { name: "A", updatedAt: new Date("2026-02-01") };

    expect(stableHashDocument(before)).toBe(stableHashDocument(after));
    expect(collectChangedFields(before, after)).toEqual([]);
  });

  it("detects inserts and updates without deletes", async () => {
    const existingId = new Types.ObjectId();
    const newId = new Types.ObjectId();
    const { service } = makeService({
      sourceDocs: {
        funding_rounds: [
          { _id: existingId, canonicalProjectId: new Types.ObjectId(), roundName: "Seed+" },
          { _id: newId, canonicalProjectId: new Types.ObjectId(), roundName: "Series A" },
        ],
      },
      targetDocs: {
        funding_rounds: [{ _id: existingId, roundName: "Seed" }],
      },
    });

    const result = await service.createDiff("admin-1", {
      collections: ["funding_rounds"],
      mode: "selected_docs",
      filter: { ids: [String(existingId), String(newId)] },
    });

    expect(result.collections[0].updates).toBe(1);
    expect(result.collections[0].inserts).toBe(1);
    expect(result.collections[0].deletes).toBe(0);
  });

  it("reads dev-to-prod diff docs through dev and prod named connections", async () => {
    const id = new Types.ObjectId();
    const { service, devDb, prodDb } = makeService({
      sourceDocs: {
        funding_rounds: [{ _id: id, roundName: "Seed from dev" }],
      },
      targetDocs: {
        funding_rounds: [{ _id: id, roundName: "Seed from prod" }],
      },
    });

    const result = await service.createDiff("admin-1", {
      collections: ["funding_rounds"],
      mode: "selected_docs",
      filter: { ids: [String(id)] },
    });

    expect(result.collections[0].updates).toBe(1);
    expect(devDb).toHaveBeenCalledWith("fomo_dev");
    expect(devDb).not.toHaveBeenCalledWith("fomo_live");
    expect(prodDb).toHaveBeenCalledWith("fomo_live");
    expect(prodDb).not.toHaveBeenCalledWith("fomo_dev");
  });

  it("rejects arbitrary collections and full market history promotion", async () => {
    const { service } = makeService({});

    await expect(
      service.createDiff("admin-1", {
        collections: ["users"],
        mode: "selected_docs",
        filter: { ids: ["1"] },
      })
    ).rejects.toThrow(BadRequestException);

    await expect(
      service.createDiff("admin-1", {
        collections: ["market_project_histories"],
        mode: "selected_docs",
        filter: { updatedSince: "2026-01-01" },
      })
    ).rejects.toThrow(BadRequestException);
  });

  it("blocks apply when env disables dev to prod", async () => {
    const { service } = makeService({
      config: makeConfig({ ADMIN_DATA_SYNC_DEV_TO_PROD_APPLY_ENABLED: "false" }),
    });

    await expect(
      service.applyPromotion("admin-1", "promotion-1", {
        confirmationPhrase: "PROMOTE FOMO V2 DEV TO PROD",
      })
    ).rejects.toThrow(ForbiddenException);
  });

  it("blocks apply when promotion is not approved", async () => {
    const promotionDoc = {
      promotionId: "promotion-1",
      status: "draft",
      save: jest.fn(async () => undefined),
      toObject() {
        return this;
      },
    };
    const { service } = makeService({
      config: makeConfig({ ADMIN_DATA_SYNC_DEV_TO_PROD_APPLY_ENABLED: "true" }),
      promotionDoc,
    });

    await expect(
      service.applyPromotion("admin-1", "promotion-1", {
        confirmationPhrase: "PROMOTE FOMO V2 DEV TO PROD",
      })
    ).rejects.toThrow(BadRequestException);
  });

  it("skips changed prod docs as conflicts during apply", async () => {
    const id = new Types.ObjectId();
    const originalProd = { _id: id, canonicalProjectId: new Types.ObjectId(), roundName: "Seed" };
    const changedProd = { ...originalProd, roundName: "Seed changed in prod" };
    const devDoc = { ...originalProd, roundName: "Seed changed in dev" };
    const promotionDoc = {
      promotionId: "promotion-1",
      status: "approved",
      sourceDb: "fomo_dev",
      targetDb: "fomo_live",
      diffDetails: {
        operationsByCollection: {
          funding_rounds: [
            {
              operation: "update",
              afterDocument: devDoc,
              hashBeforeProd: stableHashDocument(originalProd),
            },
          ],
        },
      },
      save: jest.fn(async () => undefined),
      toObject() {
        return this;
      },
    };
    const { service, targetCollections } = makeService({
      config: makeConfig({ ADMIN_DATA_SYNC_DEV_TO_PROD_APPLY_ENABLED: "true" }),
      targetDocs: { funding_rounds: [changedProd] },
      promotionDoc,
    });

    const result = await service.applyPromotion("admin-1", "promotion-1", {
      confirmationPhrase: "PROMOTE FOMO V2 DEV TO PROD",
    });

    expect(result.appliedSummary.funding_rounds.conflicts).toBe(1);
    expect(targetCollections.get("funding_rounds").bulkWrite).not.toHaveBeenCalled();
  });
});
