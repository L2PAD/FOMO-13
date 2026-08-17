import { createHash } from "crypto";
import * as fs from "fs";
import * as path from "path";
import mongoose, { Connection } from "mongoose";

import { buildMongoUri } from "src/config/mongo.config";
import { UPLOADS_DIR } from "src/config/uploads";
import { AssetStorageService } from "src/storage/asset-storage.service";
import {
  INFO_MARKET_CACHE_COLLECTION,
  INFO_MEDIA_MIGRATIONS_COLLECTION,
  INFO_RESOURCE_DEFINITIONS,
} from "../info.constants";
import { normalizeInfoPayload } from "../helpers/info-normalization";

type MigrationMapping = {
  source: string;
  target: string;
  resource?: string;
  singleton?: boolean;
  walletProfile?: boolean;
};

type CollectionReport = {
  source: string;
  target: string;
  found: number;
  planned: number;
  written: number;
  duplicate_records: number;
  duplicate_ids: string[];
  generated_ids: number;
  missing_fields: Array<{ id: string; fields: string[] }>;
};

type MediaReport = {
  referenced: number;
  planned: string[];
  uploaded: Array<{ source: string; url: string }>;
  reused: Array<{ source: string; url: string }>;
  missing: string[];
  failed: Array<{ source: string; error: string }>;
};

function resourceMapping(
  source: string,
  resource: string,
  extra: Partial<MigrationMapping> = {}
): MigrationMapping {
  const definition = INFO_RESOURCE_DEFINITIONS[resource];
  return {
    source,
    resource,
    target: definition.collection,
    singleton: definition.kind === "singleton",
    ...extra,
  };
}

const MAPPINGS: MigrationMapping[] = [
  resourceMapping("navigation_items", "navigation-items"),
  resourceMapping("hero_settings", "hero-settings"),
  resourceMapping("hero_buttons", "hero-buttons"),
  resourceMapping("about_settings", "about-settings"),
  resourceMapping("utilities", "utilities"),
  resourceMapping("utilities_settings", "utilities-settings"),
  resourceMapping("utility_nav_buttons", "utility-nav-buttons"),
  resourceMapping("platform_settings", "platform-settings"),
  resourceMapping("nft_mechanics_settings", "nft-mechanics-settings"),
  resourceMapping("drawer_cards", "drawer-cards"),
  resourceMapping("roadmap_settings", "roadmap"),
  resourceMapping("evolution_levels", "evolution-levels"),
  resourceMapping("evolution_badges", "evolution-badges"),
  resourceMapping("team_members", "team-members"),
  resourceMapping("partners", "partners"),
  resourceMapping("faq_items", "faq"),
  resourceMapping("community_settings", "community-settings"),
  resourceMapping("footer_settings", "footer-settings"),
  resourceMapping("cookie_consent_settings", "cookie-consent-settings"),
  resourceMapping("seo_settings", "seo-settings"),
  resourceMapping("arena_predictions", "arena-predictions"),
  resourceMapping("influence_entities", "influence-entities"),
  resourceMapping("earlyland_opportunities", "earlyland-opportunities"),
  resourceMapping("p2p_deals", "p2p-deals"),
  resourceMapping("invite_codes", "invite-codes"),
  resourceMapping("wallet_registrations", "wallet-profiles", {
    walletProfile: true,
  }),
  // This is landing-specific wallet state from the old service. It is merged
  // into the isolated info collection and never written to the core users model.
  resourceMapping("users", "wallet-profiles", { walletProfile: true }),
  {
    source: "crypto_cache",
    target: INFO_MARKET_CACHE_COLLECTION,
  },
];

const REQUIRED_FIELDS: Record<string, string[]> = {
  "navigation-items": ["label_en", "href"],
  "hero-buttons": ["text_en", "link"],
  utilities: ["title_en"],
  roadmap: ["title_en"],
  "roadmap-task": ["title_en"],
  "evolution-levels": ["rank_en", "description_en"],
  "evolution-badges": ["name_en"],
  "team-members": ["name_en", "position_en"],
  partners: ["name_en"],
  faq: ["question_en", "answer_en"],
  "wallet-profiles": ["wallet_address"],
};

function hasArg(name: string): boolean {
  return process.argv.slice(2).includes(name);
}

function deterministicId(
  sourceCollection: string,
  rawDocument: Record<string, any>
): string {
  if (rawDocument._id) return String(rawDocument._id);
  return createHash("sha256")
    .update(`${sourceCollection}:${JSON.stringify(rawDocument)}`)
    .digest("hex")
    .slice(0, 32);
}

function isMediaReference(value: string): boolean {
  const clean = value.split("?")[0].split("#")[0].replace(/\\/g, "/");
  return (
    /(?:^|\/)uploads\/[^/]+\.(?:png|jpe?g|webp|gif)$/i.test(clean) ||
    /^\/[^/]+\.(?:png|jpe?g|webp|gif)$/i.test(clean)
  );
}

function collectMediaReferences(value: unknown, target: Set<string>): void {
  if (Array.isArray(value)) {
    value.forEach((item) => collectMediaReferences(item, target));
    return;
  }
  if (value && typeof value === "object") {
    Object.values(value).forEach((item) =>
      collectMediaReferences(item, target)
    );
    return;
  }
  if (typeof value === "string" && isMediaReference(value)) {
    const clean = value.split("?")[0].split("#")[0].replace(/\\/g, "/");
    target.add(path.basename(clean));
  }
}

function rewriteMediaReferences(
  value: unknown,
  urlByFilename: Map<string, string>
): any {
  if (Array.isArray(value)) {
    return value.map((item) => rewriteMediaReferences(item, urlByFilename));
  }
  if (value instanceof Date) return value;
  if (value && typeof value === "object") {
    const prototype = Object.getPrototypeOf(value);
    if (prototype !== Object.prototype && prototype !== null) return value;
    return Object.fromEntries(
      Object.entries(value).map(([key, child]) => [
        key,
        rewriteMediaReferences(child, urlByFilename),
      ])
    );
  }
  if (typeof value !== "string" || !isMediaReference(value)) return value;
  const clean = value.split("?")[0].split("#")[0].replace(/\\/g, "/");
  return urlByFilename.get(path.basename(clean)) || value;
}

function chooseSingleton(
  documents: Record<string, any>[]
): Record<string, any>[] {
  if (documents.length <= 1) return documents;
  return [
    [...documents].sort((left, right) => {
      const leftTime = Date.parse(
        String(left.updated_at || left.created_at || 0)
      );
      const rightTime = Date.parse(
        String(right.updated_at || right.created_at || 0)
      );
      return (
        (Number.isFinite(rightTime) ? rightTime : 0) -
        (Number.isFinite(leftTime) ? leftTime : 0)
      );
    })[0],
  ];
}

function nonNullValues(value: Record<string, any>): Record<string, any> {
  return Object.fromEntries(
    Object.entries(value).filter(
      ([, child]) => child !== undefined && child !== null
    )
  );
}

async function mergeWalletProfile(
  target: Connection,
  collectionName: string,
  document: Record<string, any>
): Promise<void> {
  const walletAddress = String(document.wallet_address || "")
    .trim()
    .toLowerCase();
  if (!walletAddress) return;

  const collection = target.db.collection(collectionName);
  const existing = await collection.findOne({ wallet_address: walletAddress });
  const currentSource: Record<string, any> = existing ? { ...existing } : {};
  delete currentSource._id;
  const current = existing
    ? normalizeInfoPayload("wallet-profiles", currentSource)
    : {};
  const incoming = nonNullValues(document);
  const createdTimes = [current.created_at, incoming.created_at]
    .map((value) => new Date(value || 0))
    .filter((value) => Number.isFinite(value.getTime()) && value.getTime() > 0);
  const updatedTimes = [current.updated_at, incoming.updated_at]
    .map((value) => new Date(value || 0))
    .filter((value) => Number.isFinite(value.getTime()) && value.getTime() > 0);
  const merged = {
    ...current,
    ...incoming,
    id: current.id || incoming.id,
    wallet_address: walletAddress,
    referral_count: Math.max(
      Number(current.referral_count || 0),
      Number(incoming.referral_count || 0)
    ),
    twitter_connected: Boolean(
      current.twitter_connected || incoming.twitter_connected
    ),
    terms_accepted: Boolean(current.terms_accepted || incoming.terms_accepted),
    created_at: createdTimes.length
      ? new Date(Math.min(...createdTimes.map((value) => value.getTime())))
      : new Date(),
    updated_at: updatedTimes.length
      ? new Date(Math.max(...updatedTimes.map((value) => value.getTime())))
      : new Date(),
  };
  await collection.replaceOne(
    { wallet_address: walletAddress },
    normalizeInfoPayload("wallet-profiles", merged),
    { upsert: true }
  );
}

async function migrateCollection(
  source: Connection,
  target: Connection,
  mapping: MigrationMapping,
  write: boolean,
  mediaUrls: Map<string, string>
): Promise<CollectionReport> {
  const rawDocuments = await source.db
    .collection(mapping.source)
    .find({})
    .toArray();
  const documents = mapping.singleton
    ? chooseSingleton(rawDocuments)
    : rawDocuments;
  const seenIds = new Set<string>();
  const duplicateIds = new Set<string>();
  let generatedIds = 0;
  let written = 0;
  const missingFields: CollectionReport["missing_fields"] = [];

  for (const raw of documents) {
    const sourceId = raw.id
      ? String(raw.id)
      : deterministicId(mapping.source, raw);
    if (!raw.id && !mapping.singleton) generatedIds += 1;
    const identity = mapping.walletProfile
      ? String(raw.wallet_address || "").toLowerCase() || sourceId
      : sourceId;
    if (seenIds.has(identity)) duplicateIds.add(identity);
    seenIds.add(identity);

    const plain = rewriteMediaReferences({ ...raw }, mediaUrls);
    delete plain._id;
    let document = mapping.resource
      ? normalizeInfoPayload(mapping.resource, plain)
      : plain;
    const now = new Date();

    if (mapping.singleton) {
      delete document.id;
      document = {
        ...document,
        key: "default",
        created_at: document.created_at || now,
        updated_at: document.updated_at || now,
      };
    } else {
      document = {
        ...document,
        id: sourceId,
        created_at: document.created_at || now,
        updated_at: document.updated_at || now,
      };
    }

    const required = REQUIRED_FIELDS[mapping.resource || ""] || [];
    const missing = required.filter(
      (field) =>
        document[field] === undefined ||
        document[field] === null ||
        document[field] === ""
    );
    if (missing.length) {
      missingFields.push({ id: identity, fields: missing });
    }

    if (!write) continue;
    if (mapping.walletProfile) {
      await mergeWalletProfile(target, mapping.target, document);
    } else {
      const filter = mapping.singleton
        ? { key: "default" }
        : mapping.source === "crypto_cache"
        ? { type: document.type }
        : { id: sourceId };
      await target.db
        .collection(mapping.target)
        .replaceOne(filter, document, { upsert: true });
    }
    written += 1;
  }

  return {
    source: mapping.source,
    target: mapping.target,
    found: rawDocuments.length,
    planned: documents.length,
    written,
    duplicate_records: Math.max(0, rawDocuments.length - documents.length),
    duplicate_ids: Array.from(duplicateIds),
    generated_ids: generatedIds,
    missing_fields: missingFields,
  };
}

async function deriveNftSettings(
  source: Connection,
  target: Connection,
  write: boolean,
  mediaUrls: Map<string, string>
): Promise<{ found: boolean; written: boolean }> {
  const targetCollection =
    INFO_RESOURCE_DEFINITIONS["nft-mechanics-settings"].collection;
  const directCount = await source.db
    .collection("nft_mechanics_settings")
    .countDocuments({});
  if (directCount) return { found: false, written: false };

  const hero = await source.db.collection("hero_settings").findOne({});
  if (!hero?.nft_settings) return { found: false, written: false };
  if (write) {
    await target.db.collection(targetCollection).updateOne(
      { key: "default" },
      {
        $set: {
          ...normalizeInfoPayload(
            "nft-mechanics-settings",
            rewriteMediaReferences(hero.nft_settings, mediaUrls)
          ),
          key: "default",
          updated_at: hero.updated_at || new Date(),
          created_at: hero.created_at || new Date(),
        },
      },
      { upsert: true }
    );
  }
  return { found: true, written: write };
}

function mimeFromFilename(filename: string): string | undefined {
  const extension = path.extname(filename).toLowerCase();
  return {
    ".png": "image/png",
    ".jpg": "image/jpeg",
    ".jpeg": "image/jpeg",
    ".webp": "image/webp",
    ".gif": "image/gif",
  }[extension];
}

function normalizeStoredUrl(url: string): string {
  const value = String(url || "").trim();
  if (/^https?:\/\//i.test(value) || value.startsWith("/uploads/")) {
    return value;
  }
  return `/uploads/${value.replace(/^\/+/, "").replace(/^uploads\//, "")}`;
}

async function migrateMedia(
  references: Set<string>,
  target: Connection,
  write: boolean
): Promise<{ report: MediaReport; urls: Map<string, string> }> {
  const sourceDir = path.resolve(
    process.env.FOMO_INFO_SOURCE_UPLOADS_DIR ||
      path.join(process.cwd(), "..", "FOMO-INFO", "backend", "uploads")
  );
  const report: MediaReport = {
    referenced: references.size,
    planned: [],
    uploaded: [],
    reused: [],
    missing: [],
    failed: [],
  };
  const urls = new Map<string, string>();
  const storage = write ? new AssetStorageService() : undefined;
  const migrationCollection = target.db.collection(
    INFO_MEDIA_MIGRATIONS_COLLECTION
  );

  for (const filename of Array.from(references).sort()) {
    const safeName = path.basename(filename);
    const sourceFile = path.resolve(sourceDir, safeName);
    if (
      !sourceFile.startsWith(`${sourceDir}${path.sep}`) ||
      !(await fs.promises.stat(sourceFile).catch(() => null))
    ) {
      report.missing.push(safeName);
      continue;
    }

    try {
      const buffer = await fs.promises.readFile(sourceFile);
      const sha256 = createHash("sha256").update(buffer).digest("hex");
      const existing = await migrationCollection.findOne({
        source_filename: safeName,
        sha256,
      });
      if (existing?.target_url) {
        const targetUrl = String(existing.target_url);
        urls.set(safeName, targetUrl);
        report.reused.push({ source: safeName, url: targetUrl });
        continue;
      }

      report.planned.push(safeName);
      if (!write || !storage) continue;
      const stored = await Promise.resolve(
        storage.writeFile({
          buffer,
          originalName: safeName,
          mimeType: mimeFromFilename(safeName),
          folder: "info",
        })
      );
      const targetUrl = normalizeStoredUrl(stored.url);
      await migrationCollection.updateOne(
        { source_filename: safeName, sha256 },
        {
          $set: {
            source_filename: safeName,
            sha256,
            target_key: stored.key,
            target_url: targetUrl,
            storage_driver: stored.driver,
            mime_type: stored.mimeType,
            size: stored.size,
            migrated_at: new Date(),
          },
        },
        { upsert: true }
      );
      urls.set(safeName, targetUrl);
      report.uploaded.push({ source: safeName, url: targetUrl });
    } catch (error) {
      report.failed.push({
        source: safeName,
        error: (error as Error)?.message || String(error),
      });
    }
  }

  return { report, urls };
}

async function collectAllMediaReferences(
  source: Connection
): Promise<Set<string>> {
  const references = new Set<string>();
  for (const collectionName of Array.from(
    new Set(MAPPINGS.map((mapping) => mapping.source))
  )) {
    const documents = await source.db
      .collection(collectionName)
      .find({})
      .toArray();
    documents.forEach((document) =>
      collectMediaReferences(document, references)
    );
  }
  return references;
}

async function run(): Promise<void> {
  const write = hasArg("--write");
  const sourceUri = String(process.env.FOMO_INFO_SOURCE_MONGO_URI || "").trim();
  if (!sourceUri) {
    throw new Error("FOMO_INFO_SOURCE_MONGO_URI is required");
  }
  const targetUri =
    String(process.env.FOMO_INFO_TARGET_MONGO_URI || "").trim() ||
    buildMongoUri();
  const source = mongoose.createConnection(sourceUri);
  const target = mongoose.createConnection(targetUri);

  try {
    await Promise.all([source.asPromise(), target.asPromise()]);
    const mediaReferences = await collectAllMediaReferences(source);
    const media = await migrateMedia(mediaReferences, target, write);
    const collections: CollectionReport[] = [];
    for (const mapping of MAPPINGS) {
      collections.push(
        await migrateCollection(source, target, mapping, write, media.urls)
      );
    }
    const nftFromHero = await deriveNftSettings(
      source,
      target,
      write,
      media.urls
    );

    console.log(
      JSON.stringify(
        {
          mode: write ? "write" : "dry-run",
          storage_driver: process.env.STORAGE_DRIVER || "local",
          local_uploads_dir:
            (process.env.STORAGE_DRIVER || "local").toLowerCase() === "local"
              ? UPLOADS_DIR
              : null,
          wallet_profile_sources: ["wallet_registrations", "users"],
          core_users_written: 0,
          nft_settings_derived_from_hero: nftFromHero,
          collections,
          totals: {
            found: collections.reduce((sum, item) => sum + item.found, 0),
            planned: collections.reduce((sum, item) => sum + item.planned, 0),
            written: collections.reduce((sum, item) => sum + item.written, 0),
            duplicate_records: collections.reduce(
              (sum, item) => sum + item.duplicate_records,
              0
            ),
            duplicate_ids: collections.reduce(
              (sum, item) => sum + item.duplicate_ids.length,
              0
            ),
            missing_field_records: collections.reduce(
              (sum, item) => sum + item.missing_fields.length,
              0
            ),
          },
          media: media.report,
        },
        null,
        2
      )
    );
  } finally {
    await Promise.allSettled([source.close(), target.close()]);
  }
}

run().catch((error) => {
  console.error(error instanceof Error ? error.message : error);
  process.exitCode = 1;
});
