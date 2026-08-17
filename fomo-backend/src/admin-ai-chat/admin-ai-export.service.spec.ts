import { mkdtemp, readFile, rm } from "fs/promises";
import * as os from "os";
import * as path from "path";
import mongoose from "mongoose";
import { AdminAiExportService } from "./admin-ai-export.service";

describe("AdminAiExportService streaming", () => {
  let exportDir = "";

  afterEach(async () => {
    if (exportDir) await rm(exportDir, { recursive: true, force: true });
    exportDir = "";
  });

  it("streams a collection to a valid JSON artifact and records its checksum", async () => {
    exportDir = await mkdtemp(path.join(os.tmpdir(), "admin-ai-export-test-"));
    const artifact: any = {
      _id: new mongoose.Types.ObjectId(),
      kind: "collection",
      dbTarget: "fomo_dev",
      collectionName: "canonical_projects",
      spec: { filter: {}, projection: {}, sort: { _id: 1 }, limit: 0 },
      format: "json",
      compression: "none",
      status: "queued",
      filename: "canonical-projects.json",
      expiresAt: new Date(Date.now() + 60_000),
    };
    const documents = [
      { _id: "project-1", name: "Alpha" },
      { _id: "project-2", name: "Beta" },
    ];
    const cursor: any = {
      sort: jest.fn(() => cursor),
      batchSize: jest.fn(() => cursor),
      limit: jest.fn(() => cursor),
      async *[Symbol.asyncIterator]() {
        for (const document of documents) yield document;
      },
    };
    const collection = {
      countDocuments: jest.fn(async () => documents.length),
      estimatedDocumentCount: jest.fn(async () => documents.length),
      find: jest.fn(() => cursor),
    };
    const artifactModel = {
      findById: jest.fn(() => ({ lean: jest.fn(async () => ({ ...artifact })) })),
      updateOne: jest.fn(async (_filter: unknown, update: any) => {
        Object.assign(artifact, update.$set || {});
      }),
    };
    const configService = {
      get: jest.fn((key: string) => {
        if (key === "AI_ADMIN_EXPORT_DIR") return exportDir;
        if (key === "SESSION_SECRET") return "test-export-secret";
        return undefined;
      }),
    };
    const adminAiConfig = {
      ensureAiToolDbAccess: jest.fn(),
      getDbName: jest.fn(() => "fomo_dev"),
    };
    const service = new AdminAiExportService(
      artifactModel as any,
      { db: { collection: jest.fn(() => collection) } } as any,
      {} as any,
      configService as any,
      adminAiConfig as any
    );

    await service.processArtifact(String(artifact._id));

    expect(artifact.status).toBe("ready");
    expect(artifact.documentCount).toBe(2);
    expect(artifact.progress).toBe(100);
    expect(artifact.sha256).toMatch(/^[a-f0-9]{64}$/);
    const parsed = JSON.parse(
      await readFile(path.join(exportDir, artifact.storageKey), "utf8")
    );
    expect(parsed).toEqual(documents);
  });
});
