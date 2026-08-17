import { getModelToken } from "@nestjs/mongoose";
import { NestFactory } from "@nestjs/core";
import { Model } from "mongoose";
import { FomoV2CliModule } from "../../../fomo-v2-cli.module";
import { FomoV2CanonicalProject } from "../../../models";
import { FomoV2MigrationRunWriterService } from "../../../services";
import { FomoV2LaunchpadPlacement, FomoV2LaunchpadPool } from "../models";

type BackfillPlanItem = {
  id: string;
  currentRevision: number;
  slug?: string;
  baseSlug?: string;
  collisionResolved: boolean;
  launchDetails: Record<string, any>;
  changed: string[];
};

export async function main(): Promise<void> {
  const write = process.argv.slice(2).includes("--write");
  const dbName = String(process.env.DB_NAME || "fomoland");
  const previousIndexerEnabled = process.env.FOMO_V2_LAUNCHPAD_INDEXER_ENABLED;
  process.env.FOMO_V2_LAUNCHPAD_INDEXER_ENABLED = "false";
  const app = await NestFactory.createApplicationContext(FomoV2CliModule, {
    logger: ["error", "warn"],
  });
  const runs = app.get(FomoV2MigrationRunWriterService);
  const poolModel = app.get<Model<FomoV2LaunchpadPool>>(
    getModelToken(FomoV2LaunchpadPool.name)
  );
  const canonicalModel = app.get<Model<FomoV2CanonicalProject>>(
    getModelToken(FomoV2CanonicalProject.name)
  );
  const placementModel = app.get<Model<FomoV2LaunchpadPlacement>>(
    getModelToken(FomoV2LaunchpadPlacement.name)
  );
  const run = await runs.startRun({
    type: "manual",
    dryRun: !write,
    dbName,
    options: { write },
    metadata: { runner: "fomo-v2:launchpad-backfill" },
  });
  try {
    const pools: any[] = await poolModel.find({}).lean();
    const featuredPlacements: any[] = await placementModel
      .find({ featured: true })
      .sort({ surface: 1, sortOrder: 1, _id: 1 })
      .lean();
    const featuredBySurface = new Map<string, any[]>();
    for (const placement of featuredPlacements) {
      featuredBySurface.set(placement.surface, [
        ...(featuredBySurface.get(placement.surface) || []),
        placement,
      ]);
    }
    const duplicateFeatured = Array.from(featuredBySurface.entries())
      .filter(([, placements]) => placements.length > 1)
      .map(([surface, placements]) => ({
        surface,
        keepId: String(placements[0]._id),
        demoteIds: placements.slice(1).map((placement) => String(placement._id)),
      }));
    const canonicalIds = pools.map((pool) => pool.canonicalProjectId).filter(Boolean);
    const canonicals: any[] = await canonicalModel
      .find({ _id: { $in: canonicalIds } })
      .select("name slug metadata")
      .lean();
    const canonicalById = new Map(
      canonicals.map((project) => [String(project._id), project])
    );
    const existingSlugOwners = new Map<string, string[]>();
    for (const pool of pools) {
      const slug = normalizeSlug(pool.slug);
      if (!slug) continue;
      existingSlugOwners.set(slug, [
        ...(existingSlugOwners.get(slug) || []),
        String(pool._id),
      ]);
    }
    const duplicateExistingSlugs = Array.from(existingSlugOwners.entries())
      .filter(([, ids]) => ids.length > 1)
      .map(([slug, ids]) => ({ slug, ids }));
    const reserved = new Set(existingSlugOwners.keys());
    const plan: BackfillPlanItem[] = pools.map((pool) => {
      const canonical = canonicalById.get(String(pool.canonicalProjectId)) || {};
      const metadata = pool.metadata || {};
      const existingDetails = plain(pool.launchDetails);
      const hasExistingDetails = hasMeaningfulValue(existingDetails);
      const launchDetails = hasExistingDetails
        ? existingDetails
        : mapLegacyDetails(metadata);
      const existingSlug = normalizeSlug(pool.slug);
      const baseSlug = normalizeSlug(
        existingSlug || canonical.slug || canonical.name || launchDetails.title || `launch-${pool.poolId || String(pool._id).slice(-8)}`
      );
      let slug = existingSlug || baseSlug;
      let collisionResolved = false;
      if (!existingSlug && slug) {
        const original = slug;
        let suffix = 0;
        while (reserved.has(slug)) {
          collisionResolved = true;
          suffix += 1;
          slug = `${original}-${pool.poolId || String(pool._id).slice(-6)}${suffix > 1 ? `-${suffix}` : ""}`;
        }
        reserved.add(slug);
      }
      const changed: string[] = [];
      if (String(pool.slug || "") !== String(slug || "")) changed.push("slug");
      if (Number(pool.schemaVersion || 1) < 2) changed.push("schemaVersion");
      if (!hasExistingDetails && hasMeaningfulValue(launchDetails)) {
        changed.push("launchDetails");
      }
      return {
        id: String(pool._id),
        currentRevision: Number(pool.revision || 0),
        slug,
        baseSlug,
        collisionResolved,
        launchDetails,
        changed,
      };
    });

    if (write && duplicateExistingSlugs.length) {
      throw new Error(
        `Backfill blocked by existing duplicate slugs: ${duplicateExistingSlugs
          .map((item) => item.slug)
          .join(", ")}`
      );
    }
    let updated = 0;
    let featuredDemoted = 0;
    if (write) {
      for (const item of plan.filter((candidate) => candidate.changed.length)) {
        const result = await poolModel.updateOne(
          { _id: item.id, revision: item.currentRevision },
          {
            $set: {
              slug: item.slug,
              schemaVersion: 2,
              launchDetails: item.launchDetails,
            },
            $inc: { revision: 1 },
          }
        );
        if (result.modifiedCount !== 1) {
          throw new Error(`Pool ${item.id} changed concurrently during backfill.`);
        }
        updated += 1;
      }
      for (const item of duplicateFeatured) {
        const result = await placementModel.updateMany(
          { _id: { $in: item.demoteIds }, surface: item.surface, featured: true },
          { $set: { featured: false, updatedBy: "launchpad_v2_backfill" } }
        );
        featuredDemoted += result.modifiedCount || 0;
      }
    }
    const counters = {
      scanned: pools.length,
      planned: plan.filter((item) => item.changed.length).length,
      updated,
      collisionResolved: plan.filter((item) => item.collisionResolved).length,
      duplicateExistingSlugs: duplicateExistingSlugs.length,
      duplicateFeaturedSurfaces: duplicateFeatured.length,
      featuredDemoted,
    };
    await runs.completeRun(run.id, counters, {
      examples: plan.filter((item) => item.changed.length).slice(0, 20),
      duplicateExistingSlugs,
      duplicateFeatured,
    });
    console.log(
      JSON.stringify(
        { mode: write ? "write" : "dry-run", migrationRunId: run.id, counters, duplicateExistingSlugs, duplicateFeatured, plan },
        null,
        2
      )
    );
  } catch (error) {
    await runs.failRun(run.id, error);
    throw error;
  } finally {
    await app.close();
    if (previousIndexerEnabled === undefined) {
      delete process.env.FOMO_V2_LAUNCHPAD_INDEXER_ENABLED;
    } else {
      process.env.FOMO_V2_LAUNCHPAD_INDEXER_ENABLED = previousIndexerEnabled;
    }
  }
}

function mapLegacyDetails(metadata: any): Record<string, any> {
  const value = metadata || {};
  const pick = (key: string, ...aliases: string[]) =>
    [key, ...aliases].map((field) => value[field]).find((entry) => entry !== undefined);
  const output: Record<string, any> = {
    title: pick("title", "name"),
    shortDescription: pick("shortDescription", "subtitle"),
    description: pick("description"),
    saleType: pick("saleType", "fundingType"),
    category: pick("category"),
    logoUrl: pick("logoUrl", "logo"),
    bannerUrl: pick("bannerUrl", "banner"),
    gallery: pick("gallery", "images"),
    about: pick("about"),
    problem: pick("problem"),
    solution: pick("solution"),
    tokenUtility: pick("tokenUtility"),
    revenueModel: pick("revenueModel"),
    zoneDescriptions: pick("zoneDescriptions"),
    participationRules: pick("participationRules", "rules"),
    faq: pick("faq"),
    links: pick("links", "socials"),
    documents: pick("documents"),
    investors: pick("investors"),
    team: pick("team", "teamMembers"),
    analysisFlags: pick("analysisFlags"),
    funding: pick("funding"),
    flags: pick("flags"),
    tokenDisplay: pick("tokenDisplay"),
  };
  return Object.fromEntries(
    Object.entries(output).filter(([, entry]) => entry !== undefined && entry !== null)
  );
}

function normalizeSlug(value: any): string {
  return String(value || "")
    .normalize("NFKD")
    .trim()
    .toLowerCase()
    .replace(/['"]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 160);
}

function plain(value: any): Record<string, any> {
  if (!value) return {};
  if (typeof value.toObject === "function") return value.toObject();
  return { ...value };
}

function hasMeaningfulValue(value: any): boolean {
  if (value === undefined || value === null) return false;
  if (typeof value === "string") return value.trim().length > 0;
  if (typeof value === "boolean" || typeof value === "number") return true;
  if (Array.isArray(value)) return value.some((item) => hasMeaningfulValue(item));
  if (typeof value === "object") {
    return Object.values(value).some((item) => hasMeaningfulValue(item));
  }
  return false;
}

if (require.main === module) {
  main().catch((error) => {
    console.error(`[fomo-v2:launchpad-backfill] ${error?.stack || error}`);
    process.exitCode = 1;
  });
}
