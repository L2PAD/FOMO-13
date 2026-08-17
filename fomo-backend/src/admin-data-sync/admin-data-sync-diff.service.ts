import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
  ServiceUnavailableException,
} from "@nestjs/common";
import { InjectConnection, InjectModel } from "@nestjs/mongoose";
import { createHash } from "crypto";
import mongoose, { Connection, Model, Types } from "mongoose";
import {
  ADMIN_DATA_SYNC_DEV_CONNECTION,
  ADMIN_DATA_SYNC_PROD_CONNECTION,
} from "./admin-data-sync.constants";
import { AdminDataSyncConfigService } from "./admin-data-sync-config.service";
import {
  AdminDataSyncAudit,
  AdminDataSyncAuditDocument,
} from "./models/admin-data-sync-audit.model";
import {
  AdminDataSyncPromotion,
  AdminDataSyncPromotionDocument,
} from "./models/admin-data-sync-promotion.model";
import {
  AdminDataSyncSnapshot,
  AdminDataSyncSnapshotDocument,
} from "./models/admin-data-sync-snapshot.model";

export const ADMIN_DATA_SYNC_VOLATILE_HASH_FIELDS = [
  "updatedAt",
  "createdAt",
  "__v",
  "lastSyncedAt",
  "syncMeta",
] as const;

type DiffMode = "selected_docs" | "selected_collections";
type DiffOperation = "insert" | "update" | "conflict" | "skip";

export interface AdminDataSyncDiffInput {
  collections?: string[];
  filter?: {
    canonicalProjectId?: string;
    ids?: string[];
    slug?: string;
    updatedSince?: string;
  };
  mode?: DiffMode;
}

export interface AdminDataSyncApplyInput {
  confirmationPhrase?: string;
}

export interface AdminDataSyncDiffOperationRecord {
  collection: string;
  _id: any;
  operation: DiffOperation;
  changedFields: string[];
  beforeSummary?: Record<string, any>;
  afterSummary?: Record<string, any>;
  hashBeforeProd?: string;
  hashFromDev?: string;
  riskLevel: "low" | "medium" | "high";
  afterDocument?: Record<string, any>;
}

const SAMPLE_LIMIT_PER_COLLECTION = 25;

export function stableHashDocument(document: any): string {
  return createHash("sha256")
    .update(stableStringify(normalizeForHash(document)))
    .digest("hex");
}

export function normalizeForHash(value: any): any {
  if (value === null || value === undefined) return value;
  if (value instanceof Date) return value.toISOString();
  if (value instanceof Types.ObjectId) return value.toHexString();
  if (Array.isArray(value)) return value.map((item) => normalizeForHash(item));

  if (typeof value === "object") {
    const output: Record<string, any> = {};
    Object.keys(value)
      .filter(
        (key) => !ADMIN_DATA_SYNC_VOLATILE_HASH_FIELDS.includes(key as any)
      )
      .sort()
      .forEach((key) => {
        output[key] = normalizeForHash(value[key]);
      });
    return output;
  }

  return value;
}

export function stableStringify(value: any): string {
  if (value === null || typeof value !== "object") return JSON.stringify(value);
  if (Array.isArray(value)) return `[${value.map(stableStringify).join(",")}]`;

  return `{${Object.keys(value)
    .sort()
    .map((key) => `${JSON.stringify(key)}:${stableStringify(value[key])}`)
    .join(",")}}`;
}

export function collectChangedFields(before: any, after: any, prefix = ""): string[] {
  const normalizedBefore = normalizeForHash(before) || {};
  const normalizedAfter = normalizeForHash(after) || {};
  const fields = new Set<string>();

  visitChangedFields(normalizedBefore, normalizedAfter, prefix, fields);

  return Array.from(fields).slice(0, 80);
}

function visitChangedFields(
  before: any,
  after: any,
  prefix: string,
  fields: Set<string>
): void {
  if (fields.size >= 80) return;

  if (
    before === null ||
    after === null ||
    typeof before !== "object" ||
    typeof after !== "object" ||
    Array.isArray(before) ||
    Array.isArray(after)
  ) {
    if (stableStringify(before) !== stableStringify(after)) {
      fields.add(prefix || "_root");
    }
    return;
  }

  const keys = new Set([...Object.keys(before), ...Object.keys(after)]);
  for (const key of Array.from(keys).sort()) {
    const nextPrefix = prefix ? `${prefix}.${key}` : key;
    if (!(key in before) || !(key in after)) {
      fields.add(nextPrefix);
      continue;
    }
    visitChangedFields(before[key], after[key], nextPrefix, fields);
  }
}

@Injectable()
export class AdminDataSyncDiffService {
  constructor(
    @InjectConnection(ADMIN_DATA_SYNC_PROD_CONNECTION)
    private readonly prodConnection: Connection,
    @InjectConnection(ADMIN_DATA_SYNC_DEV_CONNECTION)
    private readonly devConnection: Connection,
    @InjectModel(AdminDataSyncPromotion.name)
    private readonly promotionModel: Model<AdminDataSyncPromotionDocument>,
    @InjectModel(AdminDataSyncSnapshot.name)
    private readonly snapshotModel: Model<AdminDataSyncSnapshotDocument>,
    @InjectModel(AdminDataSyncAudit.name)
    private readonly auditModel: Model<AdminDataSyncAuditDocument>,
    private readonly config: AdminDataSyncConfigService
  ) {}

  async createDiff(adminId: string, input: AdminDataSyncDiffInput = {}) {
    this.config.assertEnabled();
    this.config.assertDevToProdDiffEnabled();
    this.config.assertSafeConnectionRouting({ requireDevUri: true });

    const mode = input.mode || "selected_docs";
    if (mode !== "selected_docs") {
      throw new BadRequestException(
        "Dev to prod MVP supports selected_docs diffs only"
      );
    }

    const collections = this.config.normalizeRequestedCollections(
      input.collections,
      "dev_to_prod"
    );
    if (collections.length > this.config.getMaxCollectionsPerPromotion()) {
      throw new BadRequestException(
        `Promotion is limited to ${this.config.getMaxCollectionsPerPromotion()} collections`
      );
    }

    const maxDocuments = this.config.getMaxDiffDocuments();
    const filter = this.buildScopedFilter(input.filter || {});
    const sourceDb = this.config.getDevDbName();
    const targetDb = this.config.getProdDbName();
    const source = this.getDb(
      this.devConnection,
      sourceDb,
      ADMIN_DATA_SYNC_DEV_CONNECTION
    );
    const target = this.getDb(
      this.prodConnection,
      targetDb,
      ADMIN_DATA_SYNC_PROD_CONNECTION
    );
    const collectionSummaries: any[] = [];
    const operationsByCollection: Record<string, AdminDataSyncDiffOperationRecord[]> =
      {};
    let totalOperations = 0;

    for (const collection of collections) {
      if (collection === "market_project_histories") {
        throw new BadRequestException(
          "Full market_project_histories diff is disabled"
        );
      }

      const sourceCollection = source.collection(collection);
      const targetCollection = target.collection(collection);
      const sourceDocs = await sourceCollection
        .find(filter as any)
        .limit(maxDocuments + 1)
        .toArray();

      if (sourceDocs.length > maxDocuments) {
        throw new BadRequestException(
          `Diff exceeds ${maxDocuments} documents for ${collection}`
        );
      }

      const summary = {
        collection,
        inserts: 0,
        updates: 0,
        deletes: 0,
        conflicts: 0,
        skipped: 0,
        samples: [] as any[],
      };
      const collectionOperations: AdminDataSyncDiffOperationRecord[] = [];

      for (const sourceDoc of sourceDocs) {
        const targetDoc = await targetCollection.findOne({ _id: sourceDoc._id });
        const devHash = stableHashDocument(sourceDoc);

        if (!targetDoc) {
          summary.inserts += 1;
          const operation = this.buildOperationRecord({
            collection,
            operation: "insert",
            sourceDoc,
            targetDoc,
            devHash,
          });
          collectionOperations.push(operation);
          this.addSample(summary.samples, operation);
          continue;
        }

        const prodHash = stableHashDocument(targetDoc);
        if (prodHash === devHash) {
          summary.skipped += 1;
          continue;
        }

        summary.updates += 1;
        const operation = this.buildOperationRecord({
          collection,
          operation: "update",
          sourceDoc,
          targetDoc,
          prodHash,
          devHash,
        });
        collectionOperations.push(operation);
        this.addSample(summary.samples, operation);
      }

      operationsByCollection[collection] = collectionOperations;
      totalOperations += collectionOperations.length;
      collectionSummaries.push(summary);
    }

    const promotionId = new mongoose.Types.ObjectId().toHexString();
    const promotion = await this.promotionModel.create({
      promotionId,
      createdByAdminId: adminId,
      status: "draft",
      sourceDb,
      targetDb,
      selectedCollections: collections,
      selectedFilters: {
        mode,
        filter: input.filter || {},
      },
      diffSummary: {
        collections: collectionSummaries,
        totalOperations,
        deletes: 0,
        maxDocuments,
      },
      diffDetails: {
        mode,
        operationsByCollection,
        createdAt: new Date(),
      },
    });

    await this.audit("promotion_diff_created", adminId, {
      promotionId,
      details: {
        collections,
        totalOperations,
        filter: input.filter || {},
      },
    });

    return {
      promotionId,
      status: promotion.status,
      sourceDb,
      targetDb,
      collections: collectionSummaries,
    };
  }

  async listPromotions(limit = 50) {
    return this.promotionModel
      .find({})
      .sort({ createdAt: -1 })
      .limit(Math.min(Math.max(Number(limit) || 50, 1), 100))
      .lean();
  }

  async getPromotion(promotionId: string) {
    const promotion = await this.promotionModel.findOne({ promotionId }).lean();
    if (!promotion) throw new NotFoundException("Promotion was not found");
    return promotion;
  }

  async approvePromotion(adminId: string, promotionId: string) {
    const promotion = await this.promotionModel.findOne({ promotionId });
    if (!promotion) throw new NotFoundException("Promotion was not found");
    if (promotion.status !== "draft") {
      throw new BadRequestException("Only draft promotions can be approved");
    }

    promotion.status = "approved";
    promotion.approvedByAdminId = adminId;
    promotion.approvedAt = new Date();
    await promotion.save();

    await this.audit("promotion_approved", adminId, { promotionId });
    return promotion.toObject();
  }

  async rejectPromotion(adminId: string, promotionId: string) {
    const promotion = await this.promotionModel.findOne({ promotionId });
    if (!promotion) throw new NotFoundException("Promotion was not found");
    if (!["draft", "approved", "failed"].includes(promotion.status)) {
      throw new BadRequestException("Promotion cannot be rejected now");
    }

    promotion.status = "rejected";
    await promotion.save();

    await this.audit("promotion_rejected", adminId, { promotionId });
    return promotion.toObject();
  }

  async applyPromotion(
    adminId: string,
    promotionId: string,
    input: AdminDataSyncApplyInput = {}
  ) {
    this.config.assertEnabled();
    this.config.assertSafeConnectionRouting();

    if (!this.config.isDevToProdApplyEnabled()) {
      throw new ForbiddenException("Dev to prod apply is disabled by env");
    }

    if (this.config.isDeleteDisabled() === false) {
      throw new ForbiddenException("Delete support must stay disabled");
    }

    if (
      this.config.isConfirmationPhraseRequired() &&
      input.confirmationPhrase !== this.config.getConfirmationPhrase()
    ) {
      throw new BadRequestException("Confirmation phrase does not match");
    }

    const promotion = await this.promotionModel.findOne({ promotionId });
    if (!promotion) throw new NotFoundException("Promotion was not found");
    if (promotion.status !== "approved") {
      throw new BadRequestException("Promotion must be approved before apply");
    }

    promotion.status = "applying";
    promotion.appliedByAdminId = adminId;
    await promotion.save();

    try {
      this.assertApplySizeWithinLimit(promotion.toObject());
      const backupPath = await this.backupAffectedProdDocs(
        adminId,
        promotion.toObject()
      );
      const appliedSummary = await this.applyOperations(promotion.toObject());

      promotion.status = "applied";
      promotion.backupPath = backupPath;
      promotion.appliedSummary = appliedSummary;
      promotion.appliedAt = new Date();
      await promotion.save();

      await this.audit("promotion_applied", adminId, {
        promotionId,
        details: { backupPath, appliedSummary },
      });

      return promotion.toObject();
    } catch (error) {
      promotion.status = "failed";
      promotion.errorSummary = this.errorMessage(error);
      await promotion.save();

      await this.audit("promotion_apply_failed", adminId, {
        promotionId,
        details: { errorSummary: promotion.errorSummary },
      });

      throw error;
    }
  }

  private async applyOperations(promotion: any) {
    const targetDb = this.getDb(
      this.prodConnection,
      this.config.getProdDbName(),
      ADMIN_DATA_SYNC_PROD_CONNECTION
    );
    const operationsByCollection =
      promotion?.diffDetails?.operationsByCollection || {};
    const summary: Record<string, any> = {};

    for (const collection of Object.keys(operationsByCollection)) {
      this.config.assertSafeCollection(collection, "dev_to_prod");
      const targetCollection = targetDb.collection(collection);
      const writes: any[] = [];
      const collectionSummary = {
        inserted: 0,
        updated: 0,
        conflicts: 0,
        skipped: 0,
      };

      for (const operation of operationsByCollection[collection] || []) {
        if (!["insert", "update"].includes(operation.operation)) {
          collectionSummary.skipped += 1;
          continue;
        }

        const afterDocument = operation.afterDocument;
        if (!afterDocument || !("_id" in afterDocument)) {
          collectionSummary.skipped += 1;
          continue;
        }

        const current = await targetCollection.findOne({ _id: afterDocument._id });

        if (operation.operation === "insert") {
          if (current) {
            collectionSummary.conflicts += 1;
            continue;
          }
          writes.push({ insertOne: { document: afterDocument } });
          collectionSummary.inserted += 1;
          continue;
        }

        if (!current) {
          collectionSummary.conflicts += 1;
          continue;
        }

        if (stableHashDocument(current) !== operation.hashBeforeProd) {
          collectionSummary.conflicts += 1;
          continue;
        }

        writes.push({
          replaceOne: {
            filter: { _id: afterDocument._id },
            replacement: afterDocument,
            upsert: false,
          },
        });
        collectionSummary.updated += 1;
      }

      if (writes.length) {
        await targetCollection.bulkWrite(writes, { ordered: false });
      }

      summary[collection] = collectionSummary;
    }

    return summary;
  }

  private assertApplySizeWithinLimit(promotion: any) {
    const operationsByCollection =
      promotion?.diffDetails?.operationsByCollection || {};
    const totalOperations = Object.values(operationsByCollection).reduce(
      (sum: number, operations: any) =>
        sum + (Array.isArray(operations) ? operations.length : 0),
      0
    );

    if (totalOperations > this.config.getMaxApplyDocuments()) {
      throw new BadRequestException(
        `Promotion apply is limited to ${this.config.getMaxApplyDocuments()} documents`
      );
    }
  }

  private async backupAffectedProdDocs(adminId: string, promotion: any) {
    const targetDb = this.getDb(
      this.prodConnection,
      this.config.getProdDbName(),
      ADMIN_DATA_SYNC_PROD_CONNECTION
    );
    const operationsByCollection =
      promotion?.diffDetails?.operationsByCollection || {};
    const snapshotId = new mongoose.Types.ObjectId().toHexString();
    const documentsByCollection: Record<string, any[]> = {};
    const countsByCollection: Record<string, number> = {};

    for (const collection of Object.keys(operationsByCollection)) {
      this.config.assertSafeCollection(collection, "dev_to_prod");
      const ids = (operationsByCollection[collection] || [])
        .map((operation: any) => operation?.afterDocument?._id)
        .filter((value: any) => value !== undefined && value !== null);

      const docs = ids.length
        ? await targetDb.collection(collection).find({ _id: { $in: ids } }).toArray()
        : [];
      documentsByCollection[collection] = docs;
      countsByCollection[collection] = docs.length;
    }

    const backupPath = `mongo://${this.config.getProdDbName()}/admin_data_sync_snapshots/${snapshotId}`;
    await this.snapshotModel.create({
      snapshotId,
      type: "promotion_apply_backup",
      promotionId: promotion.promotionId,
      createdByAdminId: adminId,
      sourceDb: this.config.getProdDbName(),
      backupPath,
      collections: Object.keys(operationsByCollection),
      documentsByCollection,
      countsByCollection,
    });

    return backupPath;
  }

  private buildScopedFilter(filter: AdminDataSyncDiffInput["filter"]) {
    const clauses: any[] = [];

    if (Array.isArray(filter?.ids) && filter.ids.length) {
      clauses.push({ _id: { $in: this.idVariants(filter.ids) } });
    }

    if (filter?.canonicalProjectId) {
      const variants = this.idVariants([filter.canonicalProjectId]);
      clauses.push({
        $or: [
          { _id: { $in: variants } },
          { canonicalProjectId: { $in: variants } },
          { projectId: { $in: variants } },
          { canonicalId: { $in: variants } },
        ],
      });
    }

    if (filter?.slug) {
      const slug = String(filter.slug).trim();
      if (slug) {
        clauses.push({
          $or: [
            { slug },
            { sourceSlug: slug },
            { projectSlug: slug },
            { "identity.slug": slug },
            { "raw.slug": slug },
            { "providerIds.coingeckoSlug": slug },
          ],
        });
      }
    }

    if (filter?.updatedSince) {
      const updatedSince = new Date(filter.updatedSince);
      if (Number.isNaN(updatedSince.getTime())) {
        throw new BadRequestException("updatedSince must be a valid date");
      }
      clauses.push({ updatedAt: { $gte: updatedSince } });
    }

    if (!clauses.length) {
      throw new BadRequestException(
        "selected_docs diff requires ids, canonicalProjectId, slug, or updatedSince"
      );
    }

    return clauses.length === 1 ? clauses[0] : { $and: clauses };
  }

  private idVariants(ids: string[]) {
    const values: any[] = [];

    ids
      .map((value) => String(value || "").trim())
      .filter(Boolean)
      .forEach((value) => {
        values.push(value);
        if (Types.ObjectId.isValid(value)) {
          values.push(new Types.ObjectId(value));
        }
      });

    return values;
  }

  private buildOperationRecord(input: {
    collection: string;
    operation: "insert" | "update";
    sourceDoc: any;
    targetDoc?: any;
    prodHash?: string;
    devHash: string;
  }): AdminDataSyncDiffOperationRecord {
    const changedFields =
      input.operation === "insert"
        ? ["_document"]
        : collectChangedFields(input.targetDoc, input.sourceDoc);

    return {
      collection: input.collection,
      _id: input.sourceDoc._id,
      operation: input.operation,
      changedFields,
      beforeSummary: input.targetDoc
        ? this.summarizeDocument(input.targetDoc)
        : undefined,
      afterSummary: this.summarizeDocument(input.sourceDoc),
      hashBeforeProd: input.prodHash,
      hashFromDev: input.devHash,
      riskLevel: this.riskLevel(input.collection, input.operation, changedFields),
      afterDocument: input.sourceDoc,
    };
  }

  private addSample(samples: any[], operation: AdminDataSyncDiffOperationRecord) {
    if (samples.length >= SAMPLE_LIMIT_PER_COLLECTION) return;
    samples.push({
      collection: operation.collection,
      _id: this.idToString(operation._id),
      operation: operation.operation,
      changedFields: operation.changedFields,
      beforeSummary: operation.beforeSummary,
      afterSummary: operation.afterSummary,
      hashBeforeProd: operation.hashBeforeProd,
      hashFromDev: operation.hashFromDev,
      riskLevel: operation.riskLevel,
    });
  }

  private summarizeDocument(document: any) {
    if (!document) return undefined;
    return {
      _id: this.idToString(document._id),
      name: document.name || document.roundName || document.title,
      slug: document.slug || document.sourceSlug || document.projectSlug,
      symbol: document.symbol || document.normalizedSymbol,
      status: document.status,
      canonicalProjectId: this.idToString(document.canonicalProjectId),
      sourceType: document.sourceType || document.primarySource,
      updatedAt: document.updatedAt,
    };
  }

  private riskLevel(
    collection: string,
    operation: "insert" | "update",
    changedFields: string[]
  ): "low" | "medium" | "high" {
    if (collection.includes("funding") || collection.includes("token")) {
      return "medium";
    }
    if (operation === "update" && changedFields.length > 25) return "medium";
    return "low";
  }

  private getDb(
    connection: Connection,
    dbName: string,
    connectionName: string
  ): any {
    const client = (connection as any)?.client;
    if (!client?.db) {
      throw new ServiceUnavailableException(
        `Admin Data Sync Mongo connection ${connectionName} is not available`
      );
    }

    return client.db(dbName);
  }

  private idToString(value: any): string | undefined {
    if (!value) return undefined;
    if (value instanceof Types.ObjectId) return value.toHexString();
    return String(value);
  }

  private async audit(
    action: string,
    adminId: string,
    input: { promotionId?: string; details?: Record<string, any> } = {}
  ) {
    await this.auditModel.create({
      action,
      adminId,
      promotionId: input.promotionId,
      details: input.details || {},
    });
  }

  private errorMessage(error: any): string {
    return String(error?.message || error || "Unknown error").slice(0, 1000);
  }
}
