import "dotenv/config";
import mongoose from "mongoose";
import { buildMongoUri } from "src/config/mongo.config";
import {
  IMAGE_INVENTORY_ALLOWLIST,
  IMAGE_INVENTORY_EXCLUDED_SOURCES,
  findAllowlistedSource,
  sourceKey,
} from "../image-inventory.config";
import {
  ImageUrlCategory,
  classifyImageValue,
  getImageFieldValues,
  parseNonNegativeInteger,
  parsePositiveInteger,
  topLevelField,
} from "../image-inventory.utils";

interface RunnerArgs {
  limit: number;
  offset: number;
  examplesLimit: number;
  source?: string;
}

interface InventoryExample {
  source: string;
  collection: string;
  documentId: string;
  fieldPath: string;
  value: string;
}

interface InventoryReport {
  scannedDocs: number;
  scannedFields: number;
  foundImages: number;
  alreadyR2: number;
  localUploadsRelative: number;
  localUploadsAbsolute: number;
  coingecko: number;
  dropstab: number;
  icodrops: number;
  otherExternal: number;
  dataImageBase64: number;
  empty: number;
  invalid: number;
  sources: string[];
  excludedSources: string[];
  perSource: SourceInventoryReport[];
  examples: Record<ImageUrlCategory, InventoryExample[]>;
}

interface SourceInventoryReport {
  source: string;
  database?: string;
  collection: string;
  fieldPath: string;
  collectionExists: boolean;
  documentCount: number;
  scannedDocs: number;
  scannedFields: number;
  foundImages: number;
  alreadyR2: number;
  localUploadsRelative: number;
  localUploadsAbsolute: number;
  coingecko: number;
  dropstab: number;
  icodrops: number;
  otherExternal: number;
  dataImageBase64: number;
  empty: number;
  invalid: number;
  examples: InventoryExample[];
}

const reportKeyByCategory: Record<ImageUrlCategory, keyof InventoryReport> = {
  already_r2_assets: "alreadyR2",
  local_uploads_relative: "localUploadsRelative",
  local_uploads_absolute: "localUploadsAbsolute",
  coingecko: "coingecko",
  dropstab: "dropstab",
  icodrops: "icodrops",
  other_external: "otherExternal",
  data_image_base64: "dataImageBase64",
  empty: "empty",
  invalid: "invalid",
};

export async function main(): Promise<void> {
  const args = parseArgs(process.argv.slice(2));
  const selectedSources = args.source
    ? [requireAllowlistedSource(args.source)]
    : IMAGE_INVENTORY_ALLOWLIST;

  logProgress(
    `starting limit=${args.limit} offset=${args.offset} sources=${selectedSources.length}`,
  );

  mongoose.set("strictQuery", false);
  await mongoose.connect(buildMongoUri(), { autoIndex: false });

  try {
    const db = mongoose.connection.db;
    const report = createReport(selectedSources.map(sourceKey), args.examplesLimit);

    for (const source of selectedSources) {
      const sourceReport = await scanSource(db, source, args);
      report.perSource.push(sourceReport);
      mergeSourceReport(report, sourceReport, args.examplesLimit);
    }

    console.log(JSON.stringify(report, null, 2));
    logProgress("completed");
  } finally {
    await mongoose.disconnect();
    logProgress("closed mongo connection");
  }
}

async function scanSource(
  defaultDb: any,
  source: { database?: string; collection: string; fieldPath: string },
  args: RunnerArgs,
): Promise<SourceInventoryReport> {
  const sourceDb = source.database
    ? mongoose.connection.getClient().db(source.database)
    : defaultDb;
  const collectionExists = await sourceDb
    .listCollections({ name: source.collection })
    .hasNext();
  const sourceName = sourceKey(source);
  const sourceReport = createSourceReport(source);

  if (!collectionExists) {
    sourceReport.collectionExists = false;
    return sourceReport;
  }

  sourceReport.collectionExists = true;
  const collection = sourceDb.collection(source.collection);
  sourceReport.documentCount = await collection.estimatedDocumentCount().catch(() => 0);

  const projection = {
    [topLevelField(source.fieldPath)]: 1,
  };
  const docs = await collection
    .find({}, { projection })
    .skip(args.offset)
    .limit(args.limit)
    .toArray();

  sourceReport.scannedDocs = docs.length;

  for (const doc of docs) {
    const values = getImageFieldValues(doc, source.fieldPath);

    for (const fieldValue of values) {
      sourceReport.scannedFields += 1;

      const category = classifyImageValue(fieldValue.value);
      incrementReport(sourceReport, category);

      if (category !== "empty" && category !== "invalid") {
        sourceReport.foundImages += 1;
      }

      if (
        category !== "empty" &&
        category !== "invalid" &&
        sourceReport.examples.length < args.examplesLimit
      ) {
        sourceReport.examples.push({
          source: sourceName,
          collection: source.collection,
          documentId: String(doc._id),
          fieldPath: fieldValue.displayPath,
          value: stringifyExampleValue(fieldValue.value),
        });
      }
    }
  }

  return sourceReport;
}

function parseArgs(argv: string[]): RunnerArgs {
  const args: RunnerArgs = {
    limit: 1000,
    offset: 0,
    examplesLimit: 10,
  };

  for (const arg of argv) {
    if (!arg.startsWith("--")) continue;
    const [rawKey, rawValue = "true"] = arg.slice(2).split("=");
    const key = rawKey.trim().toLowerCase();
    const value = rawValue.trim();

    if (key === "limit") {
      args.limit = parsePositiveInteger(value, rawKey, args.limit);
    } else if (key === "offset") {
      args.offset = parseNonNegativeInteger(value, rawKey, args.offset);
    } else if (key === "examples-limit" || key === "exampleslimit" || key === "examples") {
      args.examplesLimit = parseNonNegativeInteger(value, rawKey, args.examplesLimit);
    } else if (key === "source") {
      args.source = value;
    } else {
      throw new Error(`Unknown option --${rawKey}.`);
    }
  }

  return args;
}

function requireAllowlistedSource(value: string) {
  const source = findAllowlistedSource(value);
  if (!source) {
    throw new Error(`Source "${value}" is not in image inventory allowlist.`);
  }

  return source;
}

function createReport(sources: string[], examplesLimit: number): InventoryReport {
  const report: InventoryReport = {
    scannedDocs: 0,
    scannedFields: 0,
    foundImages: 0,
    alreadyR2: 0,
    localUploadsRelative: 0,
    localUploadsAbsolute: 0,
    coingecko: 0,
    dropstab: 0,
    icodrops: 0,
    otherExternal: 0,
    dataImageBase64: 0,
    empty: 0,
    invalid: 0,
    sources,
    excludedSources: IMAGE_INVENTORY_EXCLUDED_SOURCES,
    perSource: [],
    examples: {
      already_r2_assets: [],
      local_uploads_relative: [],
      local_uploads_absolute: [],
      coingecko: [],
      dropstab: [],
      icodrops: [],
      other_external: [],
      data_image_base64: [],
      empty: [],
      invalid: [],
    },
  };

  if (examplesLimit === 0) {
    Object.keys(report.examples).forEach((key) => {
      report.examples[key as ImageUrlCategory] = [];
    });
  }

  return report;
}

function createSourceReport(source: {
  database?: string;
  collection: string;
  fieldPath: string;
}): SourceInventoryReport {
  return {
    source: sourceKey(source),
    database: source.database,
    collection: source.collection,
    fieldPath: source.fieldPath,
    collectionExists: false,
    documentCount: 0,
    scannedDocs: 0,
    scannedFields: 0,
    foundImages: 0,
    alreadyR2: 0,
    localUploadsRelative: 0,
    localUploadsAbsolute: 0,
    coingecko: 0,
    dropstab: 0,
    icodrops: 0,
    otherExternal: 0,
    dataImageBase64: 0,
    empty: 0,
    invalid: 0,
    examples: [],
  };
}

function incrementReport(
  report: InventoryReport | SourceInventoryReport,
  category: ImageUrlCategory,
): void {
  const key = reportKeyByCategory[category];
  (report[key] as number) += 1;
}

function mergeSourceReport(
  report: InventoryReport,
  sourceReport: SourceInventoryReport,
  examplesLimit: number,
): void {
  report.scannedDocs += sourceReport.scannedDocs;
  report.scannedFields += sourceReport.scannedFields;
  report.foundImages += sourceReport.foundImages;

  for (const category of Object.keys(reportKeyByCategory) as ImageUrlCategory[]) {
    const key = reportKeyByCategory[category];
    (report[key] as number) += sourceReport[key] as number;
  }

  for (const example of sourceReport.examples) {
    const category = classifyImageValue(example.value);
    addExample(report, category, examplesLimit, example);
  }
}

function addExample(
  report: InventoryReport,
  category: ImageUrlCategory,
  examplesLimit: number,
  example: InventoryExample,
): void {
  if (examplesLimit <= 0) return;
  if (report.examples[category].length >= examplesLimit) return;

  report.examples[category].push(example);
}

function stringifyExampleValue(value: unknown): string {
  if (typeof value === "string") return value.slice(0, 500);
  if (value === undefined) return "";
  if (value === null) return "";

  try {
    return JSON.stringify(value).slice(0, 500);
  } catch (error) {
    return String(value).slice(0, 500);
  }
}

function logProgress(message: string): void {
  console.error(`[image-inventory] ${new Date().toISOString()} ${message}`);
}

if (require.main === module) {
  main().catch((error) => {
    console.error(`[image-inventory] ${error?.message || error}`);
    if (error?.stack) console.error(error.stack);
    process.exitCode = 1;
  });
}
