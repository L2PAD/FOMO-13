import {
  BadRequestException,
  Injectable,
  Logger,
  NotFoundException,
  OnModuleInit,
} from "@nestjs/common";
import { InjectConnection } from "@nestjs/mongoose";
import { randomUUID } from "crypto";
import { Connection } from "mongoose";

import {
  INFO_ANALYTICS_COLLECTION,
  INFO_AUTOMATIC_ENTITY_DEFAULT_RESOURCES,
  INFO_ENTITY_DEFAULTS,
  INFO_MARKET_CACHE_COLLECTION,
  INFO_MEDIA_MIGRATIONS_COLLECTION,
  INFO_RESOURCE_DEFINITIONS,
  INFO_SINGLETON_DEFAULTS,
  InfoResourceDefinition,
} from "./info.constants";
import {
  cloneInfoDefault,
  normalizeInfoPayload,
  parseInfoBoolean,
  serializeInfoDocument,
} from "./helpers/info-normalization";
import { InfoDocument } from "./models/info.models";

type ResourceReadOptions = {
  admin?: boolean;
  query?: Record<string, unknown>;
};

@Injectable()
export class InfoRepositoryService implements OnModuleInit {
  private readonly logger = new Logger(InfoRepositoryService.name);

  constructor(@InjectConnection() private readonly connection: Connection) {}

  async onModuleInit(): Promise<void> {
    if (process.env.DB_AUTO_INDEX !== "true") {
      this.logger.log(
        "Info index creation skipped because DB_AUTO_INDEX is disabled"
      );
      return;
    }
    try {
      await this.ensureIndexes();
    } catch (error) {
      this.logger.warn(
        `Info indexes were not created during bootstrap: ${
          (error as Error)?.message || error
        }`
      );
    }
  }

  getDefinition(resource: string): InfoResourceDefinition {
    const definition = INFO_RESOURCE_DEFINITIONS[resource];
    if (!definition) {
      throw new NotFoundException(`Unknown info resource: ${resource}`);
    }
    return definition;
  }

  assertPublicResource(resource: string): InfoResourceDefinition {
    const definition = this.getDefinition(resource);
    if (!definition.public) {
      throw new NotFoundException(`Unknown info resource: ${resource}`);
    }
    return definition;
  }

  async readResource(
    resource: string,
    options: ResourceReadOptions = {}
  ): Promise<InfoDocument | InfoDocument[]> {
    const definition = options.admin
      ? this.getDefinition(resource)
      : this.assertPublicResource(resource);

    if (definition.kind === "singleton") {
      return this.readSingleton(resource);
    }

    const filter = this.buildEntityFilter(definition, options);
    const limit = this.parseLimit(options.query?.limit);
    const documents = await this.collection(definition.collection)
      .find(filter)
      .sort(definition.sort || { order: 1, created_at: 1 })
      .limit(limit)
      .toArray();

    if (
      documents.length === 0 &&
      INFO_AUTOMATIC_ENTITY_DEFAULT_RESOURCES.has(resource) &&
      INFO_ENTITY_DEFAULTS[resource]
    ) {
      return INFO_ENTITY_DEFAULTS[resource]
        .filter((item) => options.admin || item.is_active !== false)
        .map((item) =>
          this.serializeResource(resource, cloneInfoDefault(item))
        );
    }

    return documents.map((document) =>
      this.serializeResource(resource, document)
    );
  }

  async readEntity(
    resource: string,
    id: string,
    admin = false
  ): Promise<InfoDocument> {
    const definition = admin
      ? this.getDefinition(resource)
      : this.assertPublicResource(resource);
    this.assertEntity(resource, definition);

    const filter: Record<string, unknown> = { id: this.normalizeId(id) };
    if (!admin) filter.is_active = { $ne: false };

    const document = await this.collection(definition.collection).findOne(
      filter
    );
    if (!document) {
      throw new NotFoundException(`${resource} item not found`);
    }

    return this.serializeResource(resource, document);
  }

  async readSingleton(resource: string): Promise<InfoDocument> {
    const definition = this.getDefinition(resource);
    this.assertSingleton(resource, definition);

    const document = await this.collection(definition.collection).findOne({
      key: "default",
    });

    if (!document) {
      return this.serializeResource(
        resource,
        cloneInfoDefault(INFO_SINGLETON_DEFAULTS[resource] || {})
      );
    }

    return this.serializeResource(resource, document);
  }

  async putSingleton(resource: string, input: unknown): Promise<InfoDocument> {
    const definition = this.getDefinition(resource);
    this.assertSingleton(resource, definition);

    const current = await this.collection(definition.collection).findOne({
      key: "default",
    });
    const normalized = normalizeInfoPayload(resource, input);
    delete normalized.id;
    delete normalized.created_at;
    delete normalized.updated_at;

    const now = new Date();
    const value = {
      ...normalizeInfoPayload(
        resource,
        cloneInfoDefault(INFO_SINGLETON_DEFAULTS[resource] || {})
      ),
      ...(current ? this.serializeResource(resource, current) : {}),
      ...normalized,
      key: "default",
      created_at: current?.created_at || now,
      updated_at: now,
    };

    await this.collection(definition.collection).replaceOne(
      { key: "default" },
      value,
      { upsert: true }
    );

    return this.serializeResource(resource, value);
  }

  async createEntity(resource: string, input: unknown): Promise<InfoDocument> {
    const definition = this.getDefinition(resource);
    this.assertEntity(resource, definition);

    const normalized = normalizeInfoPayload(resource, input);
    const now = new Date();
    const document = {
      ...normalized,
      id: normalized.id ? this.normalizeId(normalized.id) : randomUUID(),
      created_at: now,
      updated_at: now,
    };

    try {
      await this.collection(definition.collection).insertOne(document);
    } catch (error) {
      if ((error as any)?.code === 11000) {
        throw new BadRequestException(`${resource} item already exists`);
      }
      throw error;
    }

    return this.serializeResource(resource, document);
  }

  async updateEntity(
    resource: string,
    id: string,
    input: unknown
  ): Promise<InfoDocument> {
    const definition = this.getDefinition(resource);
    this.assertEntity(resource, definition);

    const entityId = this.normalizeId(id);
    const existing = await this.collection(definition.collection).findOne({
      id: entityId,
    });
    if (!existing) {
      throw new NotFoundException(`${resource} item not found`);
    }

    const normalized = normalizeInfoPayload(resource, input);
    delete normalized.id;
    delete normalized.created_at;
    delete normalized.updated_at;

    const value = {
      ...this.serializeResource(resource, existing),
      ...normalized,
      id: entityId,
      created_at: existing.created_at || new Date(),
      updated_at: new Date(),
    };
    await this.collection(definition.collection).replaceOne(
      { id: entityId },
      value
    );

    return this.serializeResource(resource, value);
  }

  async deleteEntity(
    resource: string,
    id: string
  ): Promise<{ deleted: true; id: string }> {
    const definition = this.getDefinition(resource);
    this.assertEntity(resource, definition);

    const entityId = this.normalizeId(id);
    const result = await this.collection(definition.collection).deleteOne({
      id: entityId,
    });
    if (!result.deletedCount) {
      throw new NotFoundException(`${resource} item not found`);
    }

    return { deleted: true, id: entityId };
  }

  async reorderEntities(
    resource: string,
    input: unknown
  ): Promise<InfoDocument[]> {
    const definition = this.getDefinition(resource);
    this.assertEntity(resource, definition);
    if (!Array.isArray(input) || input.length > 2_000) {
      throw new BadRequestException("Reorder payload must be an array");
    }

    const seen = new Set<string>();
    const now = new Date();
    const operations = input.map((item, index) => {
      if (!item || typeof item !== "object") {
        throw new BadRequestException("Invalid reorder item");
      }
      const raw = item as Record<string, unknown>;
      const id = this.normalizeId(raw.id);
      if (seen.has(id)) {
        throw new BadRequestException(`Duplicate reorder id: ${id}`);
      }
      seen.add(id);

      const requestedOrder = Number(raw.order);
      const order = Number.isFinite(requestedOrder)
        ? Math.trunc(requestedOrder)
        : index;

      return {
        updateOne: {
          filter: { id },
          update: { $set: { order, updated_at: now } },
        },
      };
    });

    if (operations.length) {
      await this.collection(definition.collection).bulkWrite(operations, {
        ordered: true,
      });
    }

    return this.readResource(resource, { admin: true }) as Promise<
      InfoDocument[]
    >;
  }

  async seedDefaults(
    resource: string
  ): Promise<{ inserted: number; items: InfoDocument[] }> {
    const definition = this.getDefinition(resource);
    this.assertEntity(resource, definition);
    const defaults = INFO_ENTITY_DEFAULTS[resource];
    if (!defaults) {
      throw new BadRequestException(`No defaults are defined for ${resource}`);
    }

    let inserted = 0;
    for (const [index, source] of defaults.entries()) {
      const normalized = normalizeInfoPayload(
        resource,
        cloneInfoDefault(source)
      );
      const now = new Date();
      const id = normalized.id
        ? this.normalizeId(normalized.id)
        : `${resource}-${index}`;
      const result = await this.collection(definition.collection).updateOne(
        { id },
        {
          $setOnInsert: {
            ...normalized,
            id,
            created_at: now,
            updated_at: now,
          },
        },
        { upsert: true }
      );
      inserted += result.upsertedCount || 0;
    }

    return {
      inserted,
      items: (await this.readResource(resource, {
        admin: true,
      })) as InfoDocument[],
    };
  }

  async addRoadmapTask(input: unknown): Promise<InfoDocument> {
    const roadmap = await this.readSingleton("roadmap");
    const tasks = Array.isArray(roadmap.tasks) ? roadmap.tasks : [];
    const normalized = normalizeInfoPayload("roadmap-task", input);
    const now = new Date();
    const task = {
      ...normalized,
      id: normalized.id ? this.normalizeId(normalized.id) : randomUUID(),
      order:
        normalized.order === undefined
          ? tasks.length
          : Math.trunc(Number(normalized.order) || 0),
      created_at: now,
      updated_at: now,
    };
    await this.putSingleton("roadmap", { tasks: [...tasks, task] });
    return serializeInfoDocument(task);
  }

  async updateRoadmapTask(id: string, input: unknown): Promise<InfoDocument> {
    const entityId = this.normalizeId(id);
    const roadmap = await this.readSingleton("roadmap");
    const tasks = Array.isArray(roadmap.tasks) ? roadmap.tasks : [];
    const index = tasks.findIndex((task) => task?.id === entityId);
    if (index < 0) throw new NotFoundException("Roadmap task not found");

    const normalized = normalizeInfoPayload("roadmap-task", input);
    delete normalized.id;
    delete normalized.created_at;
    const updated = {
      ...tasks[index],
      ...normalized,
      id: entityId,
      updated_at: new Date(),
    };
    tasks[index] = updated;
    await this.putSingleton("roadmap", { tasks });
    return serializeInfoDocument(updated);
  }

  async deleteRoadmapTask(id: string): Promise<{ deleted: true; id: string }> {
    const entityId = this.normalizeId(id);
    const roadmap = await this.readSingleton("roadmap");
    const tasks = Array.isArray(roadmap.tasks) ? roadmap.tasks : [];
    const filtered = tasks.filter((task) => task?.id !== entityId);
    if (filtered.length === tasks.length) {
      throw new NotFoundException("Roadmap task not found");
    }
    await this.putSingleton("roadmap", { tasks: filtered });
    return { deleted: true, id: entityId };
  }

  async reorderRoadmapTasks(input: unknown): Promise<InfoDocument[]> {
    if (!Array.isArray(input)) {
      throw new BadRequestException("Reorder payload must be an array");
    }
    const roadmap = await this.readSingleton("roadmap");
    const tasks = Array.isArray(roadmap.tasks) ? roadmap.tasks : [];
    const orderById = new Map(
      input.map((item: any, index) => [
        this.normalizeId(item?.id),
        Number.isFinite(Number(item?.order))
          ? Math.trunc(Number(item.order))
          : index,
      ])
    );
    const updated = tasks
      .map((task, index) => ({
        ...task,
        order: orderById.has(task?.id)
          ? orderById.get(task.id)
          : task.order ?? index,
        updated_at: orderById.has(task?.id) ? new Date() : task.updated_at,
      }))
      .sort((a, b) => Number(a.order || 0) - Number(b.order || 0));
    await this.putSingleton("roadmap", { tasks: updated });
    return updated.map((task) => serializeInfoDocument(task));
  }

  private buildEntityFilter(
    definition: InfoResourceDefinition,
    options: ResourceReadOptions
  ): Record<string, unknown> {
    const filter: Record<string, unknown> = {};
    if (!options.admin) filter.is_active = { $ne: false };

    for (const field of definition.filterFields || []) {
      const rawValue = options.query?.[field];
      if (rawValue === undefined || rawValue === null || rawValue === "") {
        continue;
      }
      // Public collections must never expose records explicitly disabled by
      // administrators, even when a caller supplies `?is_active=false`.
      if (!options.admin && field === "is_active") {
        continue;
      }
      const booleanValue = parseInfoBoolean(rawValue);
      filter[field] =
        booleanValue === undefined
          ? String(rawValue).slice(0, 200)
          : booleanValue;
    }

    return filter;
  }

  private parseLimit(input: unknown): number {
    const value = Number(input);
    if (!Number.isFinite(value)) return 500;
    return Math.max(1, Math.min(2_000, Math.trunc(value)));
  }

  private normalizeId(input: unknown): string {
    const value = String(input || "").trim();
    if (!value || value.length > 200 || !/^[a-zA-Z0-9:_-]+$/.test(value)) {
      throw new BadRequestException("Invalid item id");
    }
    return value;
  }

  private assertEntity(
    resource: string,
    definition: InfoResourceDefinition
  ): void {
    if (definition.kind !== "entity") {
      throw new BadRequestException(`${resource} is a singleton resource`);
    }
  }

  private assertSingleton(
    resource: string,
    definition: InfoResourceDefinition
  ): void {
    if (definition.kind !== "singleton") {
      throw new BadRequestException(`${resource} is an entity resource`);
    }
  }

  private collection(name: string): any {
    if (!this.connection.db) {
      throw new Error("MongoDB connection is not ready");
    }
    return this.connection.db.collection(name);
  }

  private serializeResource(resource: string, document: unknown): InfoDocument {
    const serialized = normalizeInfoPayload(
      resource,
      serializeInfoDocument(document, true)
    );
    if (this.getDefinition(resource).kind === "singleton") {
      delete serialized.key;
    }
    return serialized;
  }

  private async ensureIndexes(): Promise<void> {
    for (const definition of Object.values(INFO_RESOURCE_DEFINITIONS)) {
      const collection = this.collection(definition.collection);
      if (definition.kind === "singleton") {
        await collection.createIndex(
          { key: 1 },
          {
            name: "info_singleton_key_unique",
            unique: true,
            partialFilterExpression: { key: { $type: "string" } },
          }
        );
      } else {
        await collection.createIndex(
          { id: 1 },
          {
            name: "info_entity_id_unique",
            unique: true,
            partialFilterExpression: { id: { $type: "string" } },
          }
        );
        await collection.createIndex(
          definition.sort || { order: 1, created_at: 1 },
          { name: "info_default_sort" }
        );
      }
    }

    const wallets = this.collection(
      INFO_RESOURCE_DEFINITIONS["wallet-profiles"].collection
    );
    await wallets.createIndex(
      { wallet_address: 1 },
      { name: "info_wallet_address_unique", unique: true }
    );
    await wallets.createIndex(
      { referral_code: 1 },
      {
        name: "info_referral_code_unique",
        unique: true,
        partialFilterExpression: { referral_code: { $type: "string" } },
      }
    );
    const invites = this.collection(
      INFO_RESOURCE_DEFINITIONS["invite-codes"].collection
    );
    await invites.createIndex(
      { code: 1 },
      {
        name: "info_invite_code_unique",
        unique: true,
        partialFilterExpression: { code: { $type: "string" } },
      }
    );
    await this.collection(INFO_ANALYTICS_COLLECTION).createIndex(
      { timestamp: -1 },
      { name: "info_analytics_timestamp" }
    );
    await this.collection(INFO_MARKET_CACHE_COLLECTION).createIndex(
      { type: 1 },
      { name: "info_market_cache_type_unique", unique: true }
    );
    await this.collection(INFO_MEDIA_MIGRATIONS_COLLECTION).createIndex(
      { source_filename: 1, sha256: 1 },
      { name: "info_media_source_hash_unique", unique: true }
    );
  }
}
