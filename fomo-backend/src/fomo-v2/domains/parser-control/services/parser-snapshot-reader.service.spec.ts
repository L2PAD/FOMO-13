import { FomoV2ParserSnapshotReaderService } from "./parser-snapshot-reader.service";

describe("FomoV2ParserSnapshotReaderService", () => {
  const createHarness = (overrides: Record<string, any> = {}) => {
    const manifestCollection = {
      findOne: jest.fn().mockResolvedValue({
        snapshotId: "snapshot-1",
        parserKey: "dropstab:investors",
        sourceType: "dropstab",
        status: "complete",
        environment: "prod",
        runId: "upstream-1",
        ...overrides.manifest,
      }),
    };
    const cursor = {
      sort: jest.fn().mockReturnThis(),
      skip: jest.fn().mockReturnThis(),
      limit: jest.fn().mockReturnThis(),
    };
    const itemCollection = {
      findOne: jest.fn().mockResolvedValue(overrides.foreignItem || null),
      countDocuments: jest.fn().mockResolvedValue(2),
      find: jest.fn().mockReturnValue(cursor),
    };
    const connection = {
      db: {
        collection: jest.fn((name: string) =>
          name === "parser_snapshots" ? manifestCollection : itemCollection
        ),
      },
    };
    const service = new FomoV2ParserSnapshotReaderService(connection as any);
    return { service, manifestCollection, itemCollection, cursor };
  };

  it("validates the exact complete PROD snapshot and its upstream run", async () => {
    const { service, itemCollection } = createHarness();

    const snapshot = await service.validate({
      snapshotId: "snapshot-1",
      parserKey: "dropstab:investors",
      sourceType: "dropstab",
      upstreamRunId: "upstream-1",
      write: true,
    });

    expect(snapshot).toEqual(
      expect.objectContaining({
        snapshotId: "snapshot-1",
        parserKey: "dropstab:investors",
        sourceType: "dropstab",
        succeeded: 2,
      })
    );
    expect(itemCollection.findOne).toHaveBeenCalledWith(
      expect.objectContaining({
        snapshotId: "snapshot-1",
        status: "succeeded",
      })
    );
  });

  it("rejects a successful item with foreign source provenance", async () => {
    const { service } = createHarness({
      foreignItem: { sourceType: "icodrops" },
    });

    await expect(
      service.validate({
        snapshotId: "snapshot-1",
        parserKey: "dropstab:investors",
        sourceType: "dropstab",
      })
    ).rejects.toThrow(/another parser\/source/i);
  });

  it("rejects TEST snapshots for write mode", async () => {
    const { service } = createHarness({ manifest: { environment: "test" } });

    await expect(
      service.validate({
        snapshotId: "snapshot-1",
        parserKey: "dropstab:investors",
        sourceType: "dropstab",
        write: true,
      })
    ).rejects.toThrow(/environment is not prod/i);
  });

  it("uses stable paging and prefixes only document-level payload fields", async () => {
    const { service, itemCollection, cursor } = createHarness();
    const snapshot = await service.validate({
      snapshotId: "snapshot-1",
      parserKey: "dropstab:investors",
      sourceType: "dropstab",
    });

    service.cursor(snapshot, {
      payloadFilter: {
        $or: [
          { slug: "fund-a" },
          { rounds: { $elemMatch: { amount: { $gt: 0 } } } },
        ],
      },
      skip: 4,
      limit: 10,
    });

    expect(itemCollection.find).toHaveBeenCalledWith(
      expect.objectContaining({
        $or: [
          { "payload.slug": "fund-a" },
          {
            "payload.rounds": {
              $elemMatch: { amount: { $gt: 0 } },
            },
          },
        ],
      })
    );
    expect(cursor.sort).toHaveBeenCalledWith({ entityKey: 1, _id: 1 });
    expect(cursor.skip).toHaveBeenCalledWith(4);
    expect(cursor.limit).toHaveBeenCalledWith(10);
  });
});
