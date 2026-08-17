import { Injectable } from "@nestjs/common";
import { InjectConnection } from "@nestjs/mongoose";
import { Connection, Types } from "mongoose";
import { FOMO_V2_PARSER_DB_CONNECTION } from "../../ico/ico-parser-db.constants";

const SNAPSHOT_COLLECTION = "parser_snapshots";
const SNAPSHOT_ITEM_COLLECTION = "parser_snapshot_items";

export interface FomoV2ParserSnapshotIdentity {
  snapshotId: string;
  parserKey: string;
  sourceType: string;
  write?: boolean;
  upstreamRunId?: string;
}

export interface FomoV2ValidatedParserSnapshot
  extends FomoV2ParserSnapshotIdentity {
  manifest: Record<string, any>;
  succeeded: number;
}

export interface FomoV2ParserSnapshotPageOptions {
  payloadFilter?: Record<string, any>;
  limit?: number;
  skip?: number;
}

/**
 * One fail-closed reader for immutable apiintel snapshots. Domain importers
 * receive payloads only after the manifest and every successful item have
 * been fenced to the exact parser/provider identity requested by the caller.
 */
@Injectable()
export class FomoV2ParserSnapshotReaderService {
  constructor(
    @InjectConnection(FOMO_V2_PARSER_DB_CONNECTION)
    private readonly parserConnection: Connection
  ) {}

  async validate(
    input: FomoV2ParserSnapshotIdentity
  ): Promise<FomoV2ValidatedParserSnapshot> {
    const identity = this.normalizeIdentity(input);
    const manifest = await this.snapshotCollection().findOne({
      $or: this.snapshotManifestIdentities(identity.snapshotId),
    });
    if (!manifest) {
      throw new Error(
        `Parser snapshot was not found: ${identity.snapshotId}.`
      );
    }

    const manifestSnapshotId = String(
      manifest.snapshotId || manifest._id || ""
    );
    if (manifestSnapshotId !== identity.snapshotId) {
      throw new Error(
        `Parser snapshot identity mismatch: expected ${identity.snapshotId}, received ${manifestSnapshotId || "unknown"}.`
      );
    }
    this.assertEqual(
      "parserKey",
      identity.snapshotId,
      identity.parserKey,
      manifest.parserKey
    );
    this.assertEqual(
      "sourceType",
      identity.snapshotId,
      identity.sourceType,
      manifest.sourceType
    );
    if (String(manifest.status || "") !== "complete") {
      throw new Error(
        `Snapshot ${identity.snapshotId} is not complete (status=${String(
          manifest.status || "unknown"
        )}).`
      );
    }
    if (identity.write && String(manifest.environment || "") !== "prod") {
      throw new Error(
        `Snapshot ${identity.snapshotId} cannot be written to FOMO DB because its environment is not prod.`
      );
    }
    if (
      identity.upstreamRunId &&
      String(manifest.runId || manifest.upstreamRunId || "") !==
        identity.upstreamRunId
    ) {
      throw new Error(
        `Snapshot ${identity.snapshotId} upstream run mismatch.`
      );
    }

    const successfulFilter = {
      snapshotId: identity.snapshotId,
      status: "succeeded",
    };
    const foreignItem = await this.snapshotItemCollection().findOne({
      ...successfulFilter,
      $or: [
        { parserKey: { $ne: identity.parserKey } },
        { sourceType: { $ne: identity.sourceType } },
        { payload: { $not: { $type: "object" } } },
        { "payload.source": { $ne: identity.sourceType } },
      ],
    });
    if (foreignItem) {
      throw new Error(
        `Snapshot ${identity.snapshotId} contains a successful item from another parser/source or an invalid payload.`
      );
    }

    const succeeded = await this.snapshotItemCollection().countDocuments({
      ...successfulFilter,
      parserKey: identity.parserKey,
      sourceType: identity.sourceType,
      "payload.source": identity.sourceType,
    });

    return { ...identity, manifest, succeeded };
  }

  async count(
    snapshot: FomoV2ValidatedParserSnapshot,
    payloadFilter?: Record<string, any>
  ): Promise<number> {
    return this.snapshotItemCollection().countDocuments(
      this.itemFilter(snapshot, payloadFilter)
    );
  }

  cursor(
    snapshot: FomoV2ValidatedParserSnapshot,
    options: FomoV2ParserSnapshotPageOptions = {}
  ): any {
    let cursor = this.snapshotItemCollection()
      .find(this.itemFilter(snapshot, options.payloadFilter))
      .sort({ entityKey: 1, _id: 1 });
    const skip = this.nonNegativeInteger(options.skip);
    const limit = this.positiveInteger(options.limit);
    if (skip) cursor = cursor.skip(skip);
    if (limit) cursor = cursor.limit(limit);
    return cursor;
  }

  payload(
    snapshot: FomoV2ValidatedParserSnapshot,
    item: Record<string, any>
  ): Record<string, any> {
    if (
      String(item.snapshotId || "") !== snapshot.snapshotId ||
      String(item.parserKey || "") !== snapshot.parserKey ||
      String(item.sourceType || "") !== snapshot.sourceType ||
      String(item.status || "") !== "succeeded" ||
      !item.payload ||
      typeof item.payload !== "object" ||
      Array.isArray(item.payload) ||
      String(item.payload.source || "") !== snapshot.sourceType
    ) {
      throw new Error(
        `Snapshot item source mismatch for ${snapshot.snapshotId}.`
      );
    }
    return item.payload;
  }

  private itemFilter(
    snapshot: FomoV2ValidatedParserSnapshot,
    payloadFilter?: Record<string, any>
  ): Record<string, any> {
    return {
      snapshotId: snapshot.snapshotId,
      parserKey: snapshot.parserKey,
      sourceType: snapshot.sourceType,
      status: "succeeded",
      "payload.source": snapshot.sourceType,
      ...(payloadFilter ? this.prefixPayloadFilter(payloadFilter) : {}),
    };
  }

  private prefixPayloadFilter(filter: Record<string, any>): Record<string, any> {
    const prefixQuery = (value: any): any => {
      if (!value || typeof value !== "object" || Array.isArray(value)) {
        return value;
      }
      return Object.fromEntries(
        Object.entries(value).map(([key, nested]) => {
          if (["$and", "$or", "$nor"].includes(key) && Array.isArray(nested)) {
            return [key, nested.map((entry) => prefixQuery(entry))];
          }
          // A field operator value (for example $elemMatch) is already scoped
          // below payload.<field>; prefixing its nested keys would corrupt it.
          if (key.startsWith("$")) return [key, nested];
          return [`payload.${key}`, nested];
        })
      );
    };
    return prefixQuery(filter);
  }

  private normalizeIdentity(
    input: FomoV2ParserSnapshotIdentity
  ): FomoV2ParserSnapshotIdentity {
    const snapshotId = this.requiredKey(input.snapshotId, "snapshotId", 200);
    const parserKey = this.requiredKey(input.parserKey, "parserKey", 100);
    const sourceType = this.requiredKey(input.sourceType, "sourceType", 80);
    const upstreamRunId = input.upstreamRunId
      ? this.requiredKey(input.upstreamRunId, "upstreamRunId", 200)
      : undefined;
    return {
      snapshotId,
      parserKey,
      sourceType,
      write: Boolean(input.write),
      upstreamRunId,
    };
  }

  private snapshotManifestIdentities(snapshotId: string): Record<string, any>[] {
    const identities: Record<string, any>[] = [{ snapshotId }];
    if (Types.ObjectId.isValid(snapshotId)) {
      identities.push({ _id: new Types.ObjectId(snapshotId) });
    }
    return identities;
  }

  private snapshotCollection(): any {
    return this.parserDb().collection(SNAPSHOT_COLLECTION);
  }

  private snapshotItemCollection(): any {
    return this.parserDb().collection(SNAPSHOT_ITEM_COLLECTION);
  }

  private parserDb(): any {
    const db = (this.parserConnection as any).db;
    if (!db) throw new Error("Parser DB connection is not initialized.");
    return db;
  }

  private requiredKey(value: any, label: string, maxLength: number): string {
    const text = String(value || "").trim();
    if (
      !text ||
      text.length > maxLength ||
      !/^[a-zA-Z0-9][a-zA-Z0-9:_.-]*$/.test(text)
    ) {
      throw new Error(`Invalid parser snapshot ${label}.`);
    }
    return text;
  }

  private assertEqual(
    field: string,
    snapshotId: string,
    expected: string,
    actual: any
  ): void {
    if (String(actual || "") !== expected) {
      throw new Error(
        `Snapshot ${snapshotId} ${field} mismatch: expected "${expected}", received "${String(
          actual || "unknown"
        )}".`
      );
    }
  }

  private positiveInteger(value: any): number | undefined {
    const parsed = Math.floor(Number(value));
    return Number.isFinite(parsed) && parsed > 0 ? parsed : undefined;
  }

  private nonNegativeInteger(value: any): number {
    const parsed = Math.floor(Number(value));
    return Number.isFinite(parsed) && parsed > 0 ? parsed : 0;
  }
}
