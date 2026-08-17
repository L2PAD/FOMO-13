import { ObjectId } from "mongodb";
import {
  buildArchiveRecord,
  buildMongoUri,
  buildUnsetOperation,
  calculateLongRangeFieldStats,
  parseTrimProjectChartLongRangesArgs,
  PROJECT_CHART_LONG_RANGE_FILTER,
  validateTrimProjectChartLongRangesOptions,
} from "./trim-project-chart-long-ranges";

describe("trim-project-chart-long-ranges safety", () => {
  it("defaults to dry-run with jsonl archive target and no confirmations", () => {
    const args = parseTrimProjectChartLongRangesArgs([]);

    expect(args.mode).toBe("dry-run");
    expect(args.archiveTarget).toBe("jsonl");
    expect(args.confirmArchive).toBe(false);
    expect(args.confirmWrite).toBe(false);
    expect(args.batchSize).toBe(100);
    expect(args.skip).toBe(0);
  });

  it("uses the exact project-only long range filter", () => {
    expect(PROJECT_CHART_LONG_RANGE_FILTER).toEqual({
      entityType: "project",
      $or: [
        { chart90d: { $exists: true } },
        { chart1y: { $exists: true } },
        { chartAll: { $exists: true } },
      ],
    });
  });

  it("requires explicit confirmation for archive and write modes", () => {
    const archiveArgs = parseTrimProjectChartLongRangesArgs(["--mode=archive"]);
    const writeArgs = parseTrimProjectChartLongRangesArgs(["--mode=write"]);

    expect(() => validateTrimProjectChartLongRangesOptions(archiveArgs)).toThrow(/confirm-archive/);
    expect(() => validateTrimProjectChartLongRangesOptions(writeArgs)).toThrow(/confirm-write/);
  });

  it("parses batching and archive options", () => {
    const args = parseTrimProjectChartLongRangesArgs([
      "--mode=write",
      "--confirm-write=true",
      "--archive-target=collection",
      "--archive-collection=chart_archive_test",
      "--batch-size=25",
      "--limit=100",
      "--skip=50",
      "--migration-id=test-migration",
    ]);

    expect(args).toEqual(
      expect.objectContaining({
        mode: "write",
        confirmWrite: true,
        archiveTarget: "collection",
        archiveCollection: "chart_archive_test",
        batchSize: 25,
        limit: 100,
        skip: 50,
        migrationId: "test-migration",
      }),
    );
  });

  it("calculates long range field stats without including short ranges", () => {
    const doc = {
      chart7d: [{ timestamp: 1 }],
      chart30d: [{ timestamp: 2 }],
      chart90d: [{ timestamp: 3 }, { timestamp: 4 }],
      chart1y: [],
    };

    const stats = calculateLongRangeFieldStats(doc);

    expect(stats.presentFields).toEqual(["chart90d", "chart1y"]);
    expect(stats.fieldStats.chart90d.docs).toBe(1);
    expect(stats.fieldStats.chart90d.points).toBe(2);
    expect(stats.fieldStats.chart1y.docs).toBe(1);
    expect(stats.fieldStats.chart1y.points).toBe(0);
    expect(stats.fieldStats.chartAll.docs).toBe(0);
    expect(stats.totalLongRangeBsonBytes).toBeGreaterThan(0);
  });

  it("archives only removable long fields", () => {
    const chartId = new ObjectId();
    const entityId = new ObjectId();
    const record = buildArchiveRecord(
      {
        _id: chartId,
        entityId,
        entityType: "project",
        chart7d: [{ timestamp: 1 }],
        chart90d: [{ timestamp: 2 }],
        chartAll: [{ timestamp: 3 }],
      },
      "migration-1",
      new Date("2026-06-04T00:00:00.000Z"),
    );

    expect(record._id).toBe(`migration-1:${chartId.toHexString()}`);
    expect(record.entityId).toBe(entityId);
    expect(record.fields).toEqual({
      chart90d: [{ timestamp: 2 }],
      chartAll: [{ timestamp: 3 }],
    });
    expect((record.fields as any).chart7d).toBeUndefined();
  });

  it("builds an unset operation for only chart90d, chart1y, and chartAll", () => {
    const chartId = new ObjectId();
    const operation = buildUnsetOperation({
      _id: chartId,
      entityType: "project",
      chart24h: [],
      chart7d: [],
      chart30d: [],
      chart90d: [],
      chart1y: [],
      chartAll: [],
    } as any);

    expect(operation).toEqual({
      updateOne: {
        filter: { _id: chartId, entityType: "project" },
        update: {
          $unset: {
            chart90d: "",
            chart1y: "",
            chartAll: "",
          },
        },
      },
    });
  });

  it("builds the default fomoland Mongo URI from DB_URL", () => {
    expect(buildMongoUri({ DB_URL: "mongodb://host:27017" } as any)).toBe(
      "mongodb://host:27017/fomoland?authSource=admin",
    );
    expect(buildMongoUri({ DB_URL: "mongodb://host:27017", DB_NAME: "fomo_new" } as any)).toBe(
      "mongodb://host:27017/fomo_new?authSource=admin",
    );
    expect(buildMongoUri({ DB_URL: "mongodb://host:27017/fomoland?authSource=admin" } as any)).toBe(
      "mongodb://host:27017/fomoland?authSource=admin",
    );
  });
});
