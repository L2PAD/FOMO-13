import { Injectable } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { InjectConnection } from "@nestjs/mongoose";
import { Connection, Model } from "mongoose";
import { FOMO_V2_OWNED_PRIMARY_MODEL_DEFINITIONS } from "../persistence/fomo-v2-model.registry";

export interface EnsureFomoV2IndexesOptions {
  force?: boolean;
  confirmWrite?: boolean;
}

export interface FomoV2CollectionIndexReport {
  collection: string;
  declaredIndexes: string[];
  existingBefore: string[];
  existingAfter: string[];
  createdIndexes: string[];
  keptIndexes: string[];
  obsoleteIndexes: string[];
  droppedIndexes: string[];
}

export interface EnsureFomoV2IndexesResult {
  dbName: string;
  collections: FomoV2CollectionIndexReport[];
}

interface ExistingIndexDefinition {
  name: string;
  key?: Record<string, any>;
  [key: string]: any;
}

interface DeclaredIndexDefinition {
  key: Record<string, any>;
  options: Record<string, any>;
  name: string;
}

interface SameKeyIndexReplacement {
  declared: DeclaredIndexDefinition;
  obsolete: ExistingIndexDefinition[];
}

interface IndexMigrationState {
  model: Model<any>;
  existingDefinitions: ExistingIndexDefinition[];
  existingBefore: string[];
  obsoleteIndexes: string[];
  additive: DeclaredIndexDefinition[];
  sameKeyReplacements: SameKeyIndexReplacement[];
  replacedIndexes: string[];
}

const OBSOLETE_INDEXES_BY_COLLECTION: Record<string, string[]> = {
  activities: ["uniq_activities_parser_id"],
  funding_rounds: [
    "uniq_funding_rounds_project_type_announced_date",
    "uniq_funding_rounds_project_source_type_announced_date",
  ],
  funding_round_participants: [
    "uniq_funding_participants_round_normalized_backer",
    "uniq_funding_participants_project_backer_round",
  ],
  unlock_events: [
    "uniq_unlock_events_project_source_sale_date_type",
    "idx_unlock_events_project_normalized_round",
  ],
  token_allocations: ["uniq_token_allocations_project_normalized_name"],
  vesting_rounds: ["uniq_vesting_rounds_project_normalized_round"],
  vesting_schedules: ["idx_vesting_schedules_project_normalized_round"],
  project_source_profiles: [
    "idx_project_source_profiles_source_slug",
    "idx_project_source_profiles_source_project_id",
  ],
  ico_project_read_models: ["idx_ico_project_read_models_project_source"],
};

@Injectable()
export class FomoV2IndexService {
  constructor(
    private readonly configService: ConfigService,
    @InjectConnection()
    private readonly connection: Connection
  ) {}

  async ensureIndexes(
    options: EnsureFomoV2IndexesOptions = {}
  ): Promise<EnsureFomoV2IndexesResult> {
    const dbName = this.dbName();
    if (!options.confirmWrite) {
      throw new Error(
        "Creating or replacing FOMO v2 indexes requires confirmWrite=true."
      );
    }
    if (this.isProduction() && !options.force) {
      throw new Error(
        "Refusing to replace FOMO v2 indexes in production without force=true."
      );
    }
    if (dbName === "fomoland" && !options.force) {
      throw new Error(
        "Refusing to create FOMO v2 indexes on DB_NAME=fomoland without --force=true."
      );
    }

    const states: IndexMigrationState[] = [];

    // Phase 1 is read-only across the entire registry. A late duplicate must
    // not leave earlier collections partially migrated.
    for (const model of this.indexedModels()) {
      const existingDefinitions = await this.listIndexes(model);
      const existingBefore = existingDefinitions.map(({ name }) => name);
      const obsoleteIndexes = this.obsoleteIndexNames(model, existingBefore);
      await this.assertSafeToCreateDeclaredIndexes(model);
      const plan = this.planDeclaredIndexes(
        model,
        existingDefinitions,
        obsoleteIndexes
      );
      states.push({
        model,
        existingDefinitions,
        existingBefore,
        obsoleteIndexes,
        additive: plan.additive,
        sameKeyReplacements: plan.sameKeyReplacements,
        replacedIndexes: [],
      });
    }

    // Phase 2 creates only indexes whose key pattern does not collide with an
    // existing index. Every additive build must succeed before a destructive
    // same-key replacement is attempted anywhere.
    for (const { model, additive } of states) {
      for (const declared of additive) {
        await model.collection.createIndex(declared.key, declared.options);
      }
    }

    // MongoDB cannot keep two indexes with the same key pattern while their
    // options/name differ. Replace those explicitly and restore the previous
    // index definition if the new build fails.
    for (const state of states) {
      for (const replacement of state.sameKeyReplacements) {
        const replaced = await this.replaceSameKeyIndex(
          state.model,
          replacement
        );
        state.replacedIndexes.push(...replaced);
      }
    }

    // Phase 4 removes obsolete indexes whose key patterns did not conflict
    // with their replacements. Same-key obsolete indexes were handled above.
    const collections: FomoV2CollectionIndexReport[] = [];
    for (const {
      model,
      existingBefore,
      obsoleteIndexes,
      replacedIndexes,
    } of states) {
      const cleanupDroppedIndexes = await this.dropObsoleteIndexes(
        model,
        existingBefore,
        new Set(replacedIndexes)
      );
      const droppedIndexes = [
        ...new Set([...replacedIndexes, ...cleanupDroppedIndexes]),
      ];
      const existingAfter = await this.listIndexNames(model);
      const declaredIndexes = this.declaredIndexNames(model);
      const createdIndexes = existingAfter.filter(
        (name) => !existingBefore.includes(name)
      );
      const keptIndexes = existingAfter.filter((name) =>
        existingBefore.includes(name)
      );

      collections.push({
        collection: model.collection.collectionName,
        declaredIndexes,
        existingBefore,
        existingAfter,
        createdIndexes,
        keptIndexes,
        obsoleteIndexes,
        droppedIndexes,
      });
    }

    return { dbName, collections };
  }

  private indexedModels(): Array<Model<any>> {
    return FOMO_V2_OWNED_PRIMARY_MODEL_DEFINITIONS.map((definition) => {
      const registered = this.connection.models[definition.name];
      return (
        registered || this.connection.model(definition.name, definition.schema)
      );
    });
  }

  private declaredIndexNames(model: Model<any>): string[] {
    return (model.schema.indexes() as any[])
      .map((indexDefinition) => String(indexDefinition?.[1]?.name || ""))
      .filter(Boolean);
  }

  private async listIndexNames(model: Model<any>): Promise<string[]> {
    return (await this.listIndexes(model)).map(({ name }) => name);
  }

  private async listIndexes(
    model: Model<any>
  ): Promise<ExistingIndexDefinition[]> {
    try {
      const indexes = await model.collection.listIndexes().toArray();
      return indexes
        .map((index) => ({ ...index, name: String(index.name || "") }))
        .filter((index) => Boolean(index.name));
    } catch (error: any) {
      if (error?.codeName === "NamespaceNotFound" || error?.code === 26)
        return [];
      throw error;
    }
  }

  private obsoleteIndexNames(
    model: Model<any>,
    existingIndexes: string[]
  ): string[] {
    const obsoleteIndexes =
      OBSOLETE_INDEXES_BY_COLLECTION[model.collection.collectionName] || [];
    return obsoleteIndexes.filter((indexName) =>
      existingIndexes.includes(indexName)
    );
  }

  private async dropObsoleteIndexes(
    model: Model<any>,
    existingIndexes: string[],
    alreadyDropped = new Set<string>()
  ): Promise<string[]> {
    const obsoleteIndexes = this.obsoleteIndexNames(model, existingIndexes);
    const droppedIndexes: string[] = [];
    for (const indexName of obsoleteIndexes) {
      if (alreadyDropped.has(indexName)) continue;
      if (!existingIndexes.includes(indexName)) continue;
      try {
        await model.collection.dropIndex(indexName);
        droppedIndexes.push(indexName);
      } catch (error: any) {
        if (error?.codeName === "IndexNotFound" || error?.code === 27) continue;
        throw error;
      }
    }
    return droppedIndexes;
  }

  private declaredIndexes(model: Model<any>): DeclaredIndexDefinition[] {
    return (model.schema.indexes() as any[])
      .map(([key, options]) => ({
        key: { ...(key || {}) },
        options: { ...(options || {}) },
        name: String(options?.name || ""),
      }))
      .filter((index) => Boolean(index.name));
  }

  private planDeclaredIndexes(
    model: Model<any>,
    existing: ExistingIndexDefinition[],
    obsoleteIndexes: string[]
  ): {
    additive: DeclaredIndexDefinition[];
    sameKeyReplacements: SameKeyIndexReplacement[];
  } {
    const additive: DeclaredIndexDefinition[] = [];
    const sameKeyReplacements: SameKeyIndexReplacement[] = [];
    const obsoleteNames = new Set(obsoleteIndexes);

    for (const declared of this.declaredIndexes(model)) {
      const existingByName = existing.find(
        (index) => index.name === declared.name
      );
      if (existingByName) {
        if (
          existingByName.key &&
          (!this.sameIndexKey(existingByName.key, declared.key) ||
            !this.sameIndexOptions(existingByName, declared.options))
        ) {
          throw new Error(
            `Refusing to replace undeclared index drift ${model.collection.collectionName}.${declared.name}; inspect and migrate it explicitly.`
          );
        }
        continue;
      }

      const sameKey = existing.filter(
        (index) =>
          index.key && this.sameIndexKey(index.key, declared.key)
      );
      if (!sameKey.length) {
        additive.push(declared);
        continue;
      }

      const unmanagedConflicts = sameKey.filter(
        (index) => !obsoleteNames.has(index.name)
      );
      if (unmanagedConflicts.length) {
        throw new Error(
          `Refusing same-key index replacement for ${model.collection.collectionName}.${declared.name}: conflicting indexes are not in the controlled obsolete list (${unmanagedConflicts
            .map(({ name }) => name)
            .join(", ")}).`
        );
      }
      sameKeyReplacements.push({ declared, obsolete: sameKey });
    }

    return { additive, sameKeyReplacements };
  }

  private async replaceSameKeyIndex(
    model: Model<any>,
    replacement: SameKeyIndexReplacement
  ): Promise<string[]> {
    const dropped: ExistingIndexDefinition[] = [];
    try {
      for (const obsolete of replacement.obsolete) {
        await model.collection.dropIndex(obsolete.name);
        dropped.push(obsolete);
      }
      await model.collection.createIndex(
        replacement.declared.key,
        replacement.declared.options
      );
      return dropped.map(({ name }) => name);
    } catch (error: any) {
      const rollbackErrors: string[] = [];
      for (const previous of dropped) {
        try {
          await model.collection.createIndex(
            previous.key || {},
            this.restorableIndexOptions(previous)
          );
        } catch (rollbackError: any) {
          rollbackErrors.push(
            `${previous.name}: ${rollbackError?.message || rollbackError}`
          );
        }
      }
      const rollbackMessage = rollbackErrors.length
        ? ` Rollback failed: ${rollbackErrors.join("; ")}`
        : dropped.length
          ? " Previous index definition restored."
          : " No index was dropped."
      throw new Error(
        `Failed controlled same-key index replacement ${model.collection.collectionName}.${replacement.declared.name}: ${error?.message || error}.${rollbackMessage}`
      );
    }
  }

  private restorableIndexOptions(
    index: ExistingIndexDefinition
  ): Record<string, any> {
    const {
      key: _key,
      ns: _namespace,
      v: _version,
      background: _background,
      ...options
    } = index;
    return options;
  }

  private sameIndexKey(
    left: Record<string, any>,
    right: Record<string, any>
  ): boolean {
    return (
      JSON.stringify(Object.entries(left)) ===
      JSON.stringify(Object.entries(right))
    );
  }

  private sameIndexOptions(
    existing: ExistingIndexDefinition,
    declared: Record<string, any>
  ): boolean {
    const comparable = (value: Record<string, any>) => ({
      unique: Boolean(value.unique),
      sparse: Boolean(value.sparse),
      partialFilterExpression: value.partialFilterExpression || null,
      collation: value.collation || null,
      expireAfterSeconds: value.expireAfterSeconds ?? null,
    });
    return (
      JSON.stringify(comparable(existing)) ===
      JSON.stringify(comparable(declared))
    );
  }

  private async assertSafeToCreateDeclaredIndexes(
    model: Model<any>
  ): Promise<void> {
    if (model.collection.collectionName === "project_source_profiles") {
      await this.assertNoDuplicateIdentity(
        model,
        "uniq_project_source_profiles_source_project_id",
        {
          sourceProjectId: { $type: "string" },
        },
        { sourceType: "$sourceType", sourceProjectId: "$sourceProjectId" },
        "sourceType/sourceProjectId"
      );
      await this.assertNoDuplicateIdentity(
        model,
        "uniq_project_source_profiles_source_slug",
        {
          sourceSlug: { $type: "string" },
        },
        { sourceType: "$sourceType", sourceSlug: "$sourceSlug" },
        "sourceType/sourceSlug"
      );
      return;
    }
    if (model.collection.collectionName === "ico_project_read_models") {
      await this.assertNoDuplicateIdentity(
        model,
        "uniq_ico_project_read_models_project_source",
        {},
        {
          canonicalProjectId: "$canonicalProjectId",
          sourceType: "$sourceType",
        },
        "canonicalProjectId/sourceType"
      );
      return;
    }
    if (model.collection.collectionName !== "unlock_events") return;
    await this.assertNoDuplicateIdentity(
      model,
      "uniq_unlock_events_canonical_fingerprint",
      { canonicalFingerprint: { $type: "string" } },
      "$canonicalFingerprint",
      "canonicalFingerprint"
    );
  }

  private async assertNoDuplicateIdentity(
    model: Model<any>,
    indexName: string,
    match: Record<string, any>,
    groupId: any,
    identityLabel: string
  ): Promise<void> {
    const duplicates = await model.collection
      .aggregate([
        { $match: match },
        {
          $group: {
            _id: groupId,
            count: { $sum: 1 },
            ids: { $push: "$_id" },
          },
        },
        { $match: { count: { $gt: 1 } } },
        { $limit: 10 },
      ])
      .toArray();
    if (!duplicates.length) return;
    const summary = duplicates.map((item) => ({
      identity: item._id,
      count: item.count,
      ids: (item.ids || []).slice(0, 5).map((id: any) => String(id)),
    }));
    throw new Error(
      `Refusing to create ${indexName}: duplicate ${identityLabel} values exist. Cleanup required before index migration. Sample=${JSON.stringify(
        summary
      )}`
    );
  }

  private dbName(): string {
    return (
      String(
        this.configService.get("DB_NAME") || process.env.DB_NAME || "fomoland"
      ).trim() || "fomoland"
    );
  }

  private isProduction(): boolean {
    return String(
      this.configService.get("NODE_ENV") || process.env.NODE_ENV || ""
    )
      .trim()
      .toLowerCase() === "production";
  }
}
