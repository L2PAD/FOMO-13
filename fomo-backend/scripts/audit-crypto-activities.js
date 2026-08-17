#!/usr/bin/env node

try {
  require("dotenv").config();
} catch (error) {
  // dotenv is optional; production environments usually provide DB_URL directly.
}

const mongoose = require("mongoose");
mongoose.set("strictQuery", false);

const COLLECTION = process.env.CRYPTO_ACTIVITIES_COLLECTION || "cryptoactivities";
const FALLBACK_COLLECTION = "crypto_activities";

function mongoUri() {
  if (process.env.CRYPTO_ACTIVITIES_MONGO_URL) return process.env.CRYPTO_ACTIVITIES_MONGO_URL;
  if (process.env.MONGO_URL) return process.env.MONGO_URL;
  if (process.env.DB_URL) return `${process.env.DB_URL}/fomoland?authSource=admin`;
  throw new Error("DB_URL, MONGO_URL or CRYPTO_ACTIVITIES_MONGO_URL is required");
}

function isNonEmptyString(value) {
  return typeof value === "string" && value.trim().length > 0 && value.trim().toUpperCase() !== "TBA";
}

function isNonEmptyArray(value) {
  return Array.isArray(value) && value.some((item) => {
    if (typeof item === "string") return isNonEmptyString(item);
    return item && typeof item === "object" ? Object.keys(item).length > 0 : Boolean(item);
  });
}

function hasDescription(activity) {
  if (isNonEmptyString(activity.description)) return true;
  return isNonEmptyString(activity.description?.about) || isNonEmptyString(activity.description?.howToParticipate);
}

function descriptionLength(activity) {
  if (isNonEmptyString(activity.description)) return activity.description.trim().length;
  return [
    activity.description?.about,
    activity.description?.howToParticipate,
    activity.fullDescription,
    activity.shortDescription,
  ]
    .filter(isNonEmptyString)
    .join(" ")
    .length;
}

function hasSourceUrl(activity) {
  return Boolean(
    isNonEmptyString(activity.sourceUrl) ||
      isNonEmptyString(activity.originalUrl) ||
      isNonEmptyString(activity.joinLink) ||
      isNonEmptyString(activity.socialLinks?.website) ||
      (Array.isArray(activity.links) && activity.links.some((link) => isNonEmptyString(link?.url))) ||
      (!Array.isArray(activity.links) && activity.links && Object.values(activity.links).some((value) => {
        if (typeof value === "string") return isNonEmptyString(value);
        if (Array.isArray(value)) return value.some((item) => isNonEmptyString(item?.url));
        return false;
      }))
  );
}

function hasProject(activity) {
  return Boolean(
    isNonEmptyString(activity.projectName) ||
      isNonEmptyString(activity.name) ||
      isNonEmptyString(activity.coinName) ||
      isNonEmptyString(activity.project?.name)
  );
}

function hasLogo(activity) {
  return Boolean(
    isNonEmptyString(activity.projectLogo) ||
      isNonEmptyString(activity.logo) ||
      isNonEmptyString(activity.project?.logo) ||
      isNonEmptyString(activity.relatedAssets?.[0]?.image)
  );
}

function hasSocials(activity) {
  const socials = activity.socialLinks || activity.project?.socials || {};
  return ["website", "twitter", "telegram", "discord", "medium", "github", "docs"].some((key) =>
    isNonEmptyString(socials[key]),
  ) || isNonEmptyArray(socials.custom);
}

function hasRewards(activity) {
  return (
    isNonEmptyArray(activity.rewards) ||
    isNonEmptyString(activity.rewardLabel) ||
    isNonEmptyString(activity.rewardAmount) ||
    Number(activity.rewardAmount) > 0
  );
}

function hasRequirements(activity) {
  return (
    isNonEmptyArray(activity.requirements) ||
    isNonEmptyArray(activity.taskGuide?.steps) ||
    isNonEmptyString(activity.description?.howToParticipate)
  );
}

function invalidDates(activity) {
  return ["startDate", "endDate", "approxStartDate", "approxEndDate"].filter((key) => {
    const value = activity[key];
    if (!value || value === "TBA") return false;
    const date = value instanceof Date ? value : new Date(value);
    return Number.isNaN(date.getTime());
  });
}

function completenessScore(activity) {
  const checks = [
    hasDescription(activity),
    descriptionLength(activity) >= 300,
    hasSourceUrl(activity),
    hasProject(activity),
    hasLogo(activity),
    hasSocials(activity),
    hasRewards(activity),
    hasRequirements(activity),
    isNonEmptyArray(activity.tags),
    Boolean(activity.startDate || activity.endDate || activity.approxStartDate || activity.approxEndDate),
    isNonEmptyString(activity.activityType || activity.type),
    isNonEmptyString(activity.status),
    isNonEmptyArray(activity.timeline),
  ];

  return checks.filter(Boolean).length;
}

function activityName(activity) {
  return activity.name || activity.projectName || activity.coinName || activity.title || activity.slug || String(activity._id);
}

async function countCollection(db, collectionName) {
  const names = await db.listCollections({ name: collectionName }).toArray();
  if (!names.length) return 0;
  return db.collection(collectionName).countDocuments();
}

async function main() {
  await mongoose.connect(mongoUri());
  const db = mongoose.connection.db;
  let collectionName = COLLECTION;
  let total = await countCollection(db, collectionName);

  if (!total && collectionName !== FALLBACK_COLLECTION) {
    const fallbackTotal = await countCollection(db, FALLBACK_COLLECTION);
    if (fallbackTotal) {
      collectionName = FALLBACK_COLLECTION;
      total = fallbackTotal;
    }
  }

  const collection = db.collection(collectionName);
  const activities = total
    ? await collection.find({}).project({
        name: 1,
        projectName: 1,
        coinName: 1,
        title: 1,
        slug: 1,
        source: 1,
        sourceUrl: 1,
        originalUrl: 1,
        joinLink: 1,
        links: 1,
        socialLinks: 1,
        project: 1,
        projectLogo: 1,
        logo: 1,
        relatedAssets: 1,
        description: 1,
        shortDescription: 1,
        fullDescription: 1,
        rewards: 1,
        rewardLabel: 1,
        rewardAmount: 1,
        requirements: 1,
        taskGuide: 1,
        tags: 1,
        startDate: 1,
        endDate: 1,
        approxStartDate: 1,
        approxEndDate: 1,
        activityType: 1,
        type: 1,
        status: 1,
        timeline: 1,
        sourceMeta: 1,
        rawSourceData: 1,
      }).toArray()
    : [];

  const stats = {
    total,
    withDescription: activities.filter(hasDescription).length,
    withFullDescription: activities.filter((item) => descriptionLength(item) >= 300).length,
    withSourceUrl: activities.filter(hasSourceUrl).length,
    withOriginalUrl: activities.filter((item) => isNonEmptyString(item.originalUrl)).length,
    withProject: activities.filter(hasProject).length,
    withProjectLogo: activities.filter(hasLogo).length,
    withSocials: activities.filter(hasSocials).length,
    withRewards: activities.filter(hasRewards).length,
    withRequirements: activities.filter(hasRequirements).length,
    withTags: activities.filter((item) => isNonEmptyArray(item.tags)).length,
    withSourceMeta: activities.filter((item) => item.sourceMeta && Object.keys(item.sourceMeta).length).length,
    withRawSourceData: activities.filter((item) => item.rawSourceData && Object.keys(item.rawSourceData).length).length,
  };

  const missingCritical = activities
    .filter((activity) => !hasDescription(activity) || !hasSourceUrl(activity) || !hasProject(activity) || invalidDates(activity).length)
    .slice(0, 25)
    .map((activity) => ({
      id: String(activity._id),
      name: activityName(activity),
      missing: [
        !hasDescription(activity) ? "description" : "",
        !hasSourceUrl(activity) ? "sourceUrl" : "",
        !hasProject(activity) ? "project" : "",
        invalidDates(activity).length ? `invalidDates:${invalidDates(activity).join(",")}` : "",
      ].filter(Boolean),
    }));

    const duplicateKeys = new Map();
    for (const activity of activities) {
      const activityId = String(activity._id);
      const keys = new Set([activity.slug, activity.sourceUrl, activity.originalUrl].filter(isNonEmptyString));
      for (const key of keys) {
        const ids = duplicateKeys.get(key) || new Set();
        ids.add(activityId);
        duplicateKeys.set(key, ids);
      }
    }
  const duplicates = Array.from(duplicateKeys.entries())
      .map(([key, ids]) => ({ key, count: ids.size }))
      .filter(({ count }) => count > 1)
      .slice(0, 20)
      .map(({ key, count }) => ({ key, count }));

  const topComplete = activities
    .map((activity) => ({
      id: String(activity._id),
      name: activityName(activity),
      slug: activity.slug,
      source: activity.source,
      score: completenessScore(activity),
    }))
    .sort((left, right) => right.score - left.score || left.name.localeCompare(right.name))
    .slice(0, 10);

  console.log(`Crypto activities audit (${collectionName})`);
  console.log(`Activities total: ${stats.total}`);
  console.log(`With description: ${stats.withDescription}`);
  console.log(`With fullDescription/long description: ${stats.withFullDescription}`);
  console.log(`With sourceUrl: ${stats.withSourceUrl}`);
  console.log(`With originalUrl: ${stats.withOriginalUrl}`);
  console.log(`With project: ${stats.withProject}`);
  console.log(`With project.logo: ${stats.withProjectLogo}`);
  console.log(`With socials: ${stats.withSocials}`);
  console.log(`With rewards: ${stats.withRewards}`);
  console.log(`With requirements: ${stats.withRequirements}`);
  console.log(`With tags: ${stats.withTags}`);
  console.log(`With sourceMeta: ${stats.withSourceMeta}`);
  console.log(`With rawSourceData: ${stats.withRawSourceData}`);
  console.log("Missing critical fields:");
  console.log(JSON.stringify(missingCritical, null, 2));
  console.log("Possible duplicates:");
  console.log(JSON.stringify(duplicates, null, 2));
  console.log("Top complete activities:");
  console.log(JSON.stringify(topComplete, null, 2));
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await mongoose.disconnect();
  });
