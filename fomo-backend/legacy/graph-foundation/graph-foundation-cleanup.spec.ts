import {
  GRAPH_FOUNDATION_COLLECTIONS,
  parseCleanupArgs,
  runGraphFoundationCleanup,
} from "./graph-foundation-cleanup";

function createMockDb(counts: Record<string, number> = {}) {
  const collections = new Map<string, any>();
  const legacyCollectionNames = ["projects", "fundingrounds", "tokenunlocks", "funds", "persons", "project_intel", "project_unlocks"];

  for (const collectionName of [...GRAPH_FOUNDATION_COLLECTIONS, ...legacyCollectionNames]) {
    const collection = {
      countDocuments: jest.fn(async () => counts[collectionName] || 0),
      deleteMany: jest.fn(async () => ({ deletedCount: counts[collectionName] || 0 })),
      find: jest.fn(() => ({ toArray: jest.fn(async () => []) })),
    };
    collections.set(collectionName, collection);
  }

  return {
    collection: jest.fn((name: string) => collections.get(name)),
    collections,
  };
}

describe("graph foundation cleanup", () => {
  it("parses dry-run and guarded apply flags", () => {
    expect(parseCleanupArgs(["--dry-run"]).dryRun).toBe(true);
    expect(parseCleanupArgs(["--apply", "--confirm-cleanup=true"])).toEqual(
      expect.objectContaining({ apply: true, dryRun: false, confirmCleanup: true }),
    );
  });

  it("cleanup dry-run reports counts and deletes nothing", async () => {
    const db = createMockDb({ canonical_projects: 10, canonical_project_links: 20 });

    const result = await runGraphFoundationCleanup(db as any, { dryRun: true });

    expect(result.mode).toBe("dry-run");
    expect(result.collections.canonical_projects).toBe(10);
    expect(result.collections.canonical_project_links).toBe(20);
    for (const collectionName of GRAPH_FOUNDATION_COLLECTIONS) {
      expect(db.collections.get(collectionName).deleteMany).not.toHaveBeenCalled();
    }
  });

  it("cleanup apply deletes only graph foundation collections", async () => {
    const db = createMockDb({ canonical_projects: 10, projects: 999 });

    const result = await runGraphFoundationCleanup(db as any, {
      apply: true,
      confirmCleanup: true,
      backup: false,
    });

    expect(result.mode).toBe("apply");
    expect(result.deleted.canonical_projects).toBe(10);
    for (const collectionName of GRAPH_FOUNDATION_COLLECTIONS) {
      expect(db.collections.get(collectionName).deleteMany).toHaveBeenCalledWith({});
    }
    expect(db.collections.get("projects").deleteMany).not.toHaveBeenCalled();
    expect(db.collections.get("fundingrounds").deleteMany).not.toHaveBeenCalled();
    expect(db.collections.get("tokenunlocks").deleteMany).not.toHaveBeenCalled();
  });
});
