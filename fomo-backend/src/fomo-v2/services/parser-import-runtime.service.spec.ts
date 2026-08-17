import { ConflictException } from "@nestjs/common";
import { Types } from "mongoose";
import {
  FomoV2ParserImportCheckpointSchema,
  FomoV2ParserImportFailureSchema,
} from "../models";
import {
  FOMO_V2_PARSER_IMPORT_SOURCE_TYPES,
  FomoV2ParserImportLeaseLostError,
  FomoV2ParserImportRunHandle,
  FomoV2ParserImportRuntimeService,
} from "./parser-import-runtime.service";

const query = <T>(value: T) => ({
  exec: jest.fn().mockResolvedValue(value),
});

const leanQuery = <T>(value: T) => {
  const result: any = {
    select: jest.fn(),
    lean: jest.fn(),
    exec: jest.fn().mockResolvedValue(value),
  };
  result.select.mockReturnValue(result);
  result.lean.mockReturnValue(result);
  return result;
};

const listResultQuery = <T>(value: T) => {
  const result: any = {
    sort: jest.fn(),
    limit: jest.fn(),
    select: jest.fn(),
    lean: jest.fn(),
    exec: jest.fn().mockResolvedValue(value),
  };
  result.sort.mockReturnValue(result);
  result.limit.mockReturnValue(result);
  result.select.mockReturnValue(result);
  result.lean.mockReturnValue(result);
  return result;
};

const checkpointIndex = {
  name: "uniq_parser_import_checkpoints_source",
  unique: true,
  key: {
    pipeline: 1,
    sourceType: 1,
    sourceDatabase: 1,
    sourceCollection: 1,
  },
};
const failureIndex = {
  name: "uniq_parser_import_failures_source_document",
  unique: true,
  key: {
    pipeline: 1,
    sourceType: 1,
    sourceDatabase: 1,
    sourceCollection: 1,
    sourceDocumentId: 1,
  },
};
const replayQueueIndex = {
  name: "idx_parser_import_failures_replay_queue",
  key: {
    pipeline: 1,
    sourceType: 1,
    sourceDatabase: 1,
    sourceCollection: 1,
    status: 1,
    replayRequestedAt: 1,
    _id: 1,
  },
  partialFilterExpression: {
    status: "retrying",
    replayRequestedAt: { $exists: true },
  },
};

describe("FomoV2ParserImportRuntimeService", () => {
  it("keeps explicit operational sources for legacy/manual callers", () => {
    expect(FOMO_V2_PARSER_IMPORT_SOURCE_TYPES).toEqual(
      expect.arrayContaining(["legacy", "parser", "system", "manual"])
    );
  });

  it("keeps run/checkpoint identity separated by normalized sourceType", async () => {
    const runModel = {
      create: jest.fn().mockImplementation(async (value) => value),
    };
    const checkpointModel = {
      collection: { indexes: jest.fn().mockResolvedValue([checkpointIndex]) },
      findOneAndUpdate: jest.fn().mockImplementation(() => query(null)),
      create: jest.fn().mockImplementation(async (value) => ({
        _id: new Types.ObjectId(),
        ...value,
      })),
      updateOne: jest.fn().mockImplementation(() => query({ matchedCount: 1 })),
    };
    const service = new FomoV2ParserImportRuntimeService(
      runModel as any,
      checkpointModel as any,
      {
        collection: {
          indexes: jest
            .fn()
            .mockResolvedValue([failureIndex, replayQueueIndex]),
        },
      } as any
    );

    const dropstab = await service.startRun({
      pipeline: "vesting",
      sourceType: "DropStab",
      sourceDatabase: "parser",
      sourceCollection: "dropstab_coin_detail_data",
      dryRun: false,
      leaseOwner: "worker-dropstab",
    });
    const icodrops = await service.startRun({
      pipeline: "vesting",
      sourceType: "ICO-Drops",
      sourceDatabase: "parser",
      sourceCollection: "ico_projects",
      dryRun: false,
      leaseOwner: "worker-icodrops",
    });

    expect(dropstab.sourceType).toBe("dropstab");
    expect(icodrops.sourceType).toBe("icodrops");
    expect(dropstab.runId).not.toBe(icodrops.runId);
    expect(checkpointModel.create.mock.calls[0][0]).toEqual(
      expect.objectContaining({ sourceType: "dropstab" })
    );
    expect(checkpointModel.create.mock.calls[1][0]).toEqual(
      expect.objectContaining({ sourceType: "icodrops" })
    );
    expect(checkpointModel.collection.indexes).toHaveBeenCalledTimes(1);
  });

  it("rejects unknown runtime sources before creating state", async () => {
    const runModel = { create: jest.fn() };
    const checkpointModel = { findOneAndUpdate: jest.fn() };
    const service = new FomoV2ParserImportRuntimeService(
      runModel as any,
      checkpointModel as any,
      {} as any
    );

    await expect(
      service.startRun({
        pipeline: "activities",
        sourceType: "surprise-provider",
        sourceDatabase: "parser",
        sourceCollection: "crypto_activities",
        dryRun: false,
      })
    ).rejects.toThrow(
      'Unsupported parser import sourceType "surprise-provider"'
    );
    expect(checkpointModel.findOneAndUpdate).not.toHaveBeenCalled();
    expect(runModel.create).not.toHaveBeenCalled();
  });

  it("rejects a concurrent run when the source-scoped lease is held", async () => {
    const duplicateKeyError: any = new Error("duplicate checkpoint");
    duplicateKeyError.code = 11000;
    const checkpointModel = {
      collection: { indexes: jest.fn().mockResolvedValue([checkpointIndex]) },
      findOneAndUpdate: jest.fn().mockImplementation(() => query(null)),
      create: jest.fn().mockRejectedValue(duplicateKeyError),
      updateOne: jest.fn().mockImplementation(() => query({ matchedCount: 1 })),
    };
    const runModel = { create: jest.fn() };
    const service = new FomoV2ParserImportRuntimeService(
      runModel as any,
      checkpointModel as any,
      {
        collection: {
          indexes: jest
            .fn()
            .mockResolvedValue([failureIndex, replayQueueIndex]),
        },
      } as any
    );

    await expect(
      service.startRun({
        pipeline: "funding",
        sourceType: "dropstab",
        sourceDatabase: "parser",
        sourceCollection: "dropstab_coin_detail_data",
        dryRun: false,
        leaseOwner: "second-worker",
      })
    ).rejects.toBeInstanceOf(ConflictException);
    expect(runModel.create).not.toHaveBeenCalled();
  });

  it("marks the previous running import abandoned when taking over an expired lease", async () => {
    const previousRunId = new Types.ObjectId();
    const checkpointId = new Types.ObjectId();
    const runModel = {
      create: jest.fn().mockImplementation(async (value) => value),
      updateOne: jest.fn().mockImplementation(() => query({ matchedCount: 1 })),
    };
    const checkpointModel = {
      collection: { indexes: jest.fn().mockResolvedValue([checkpointIndex]) },
      findOneAndUpdate: jest.fn().mockImplementation(() =>
        query({
          _id: checkpointId,
          activeRunId: previousRunId,
          leaseExpiresAt: new Date("2026-07-01T00:00:00.000Z"),
          cursor: "old-cursor",
        })
      ),
      updateOne: jest.fn().mockImplementation(() => query({ matchedCount: 1 })),
    };
    const service = new FomoV2ParserImportRuntimeService(
      runModel as any,
      checkpointModel as any,
      {
        collection: {
          indexes: jest
            .fn()
            .mockResolvedValue([failureIndex, replayQueueIndex]),
        },
      } as any
    );

    const handle = await service.startRun({
      pipeline: "activities",
      sourceType: "dropstab",
      sourceDatabase: "parser",
      sourceCollection: "crypto_activities",
      dryRun: false,
      leaseOwner: "takeover-worker",
    });

    expect(handle.cursor).toBe("old-cursor");
    expect(runModel.updateOne).toHaveBeenCalledWith(
      { _id: previousRunId, status: "running" },
      expect.objectContaining({
        $set: expect.objectContaining({
          status: "abandoned",
          "metadata.reason": "lease_expired",
          "metadata.takenOverByRunId": handle.runId,
        }),
        $push: expect.objectContaining({
          errorSamples: expect.objectContaining({
            $each: [expect.objectContaining({ reason: "lease_expired" })],
          }),
        }),
      })
    );
  });

  it("does not let a stale worker overwrite an abandoned run with failed", async () => {
    const runModel = {
      updateOne: jest.fn().mockImplementation(() => query({ matchedCount: 0 })),
    };
    const checkpointModel = {
      updateOne: jest.fn().mockImplementation(() => query({ matchedCount: 0 })),
    };
    const service = new FomoV2ParserImportRuntimeService(
      runModel as any,
      checkpointModel as any,
      {} as any
    );
    const handle: FomoV2ParserImportRunHandle = {
      pipeline: "activities",
      sourceType: "dropstab",
      sourceDatabase: "parser",
      sourceCollection: "crypto_activities",
      runId: new Types.ObjectId().toHexString(),
      runKey: "stale-run",
      checkpointId: new Types.ObjectId().toHexString(),
      leaseOwner: "stale-worker",
      leaseMs: 60_000,
      cutoffAt: new Date(),
    };

    await service.failRun(handle, new Error("lease lost"));

    expect(runModel.updateOne).toHaveBeenCalledWith(
      { _id: handle.runId, status: "running" },
      expect.any(Object)
    );
  });

  it("quarantines a poison document only inside its provider identity", async () => {
    const failureModel = {
      findOneAndUpdate: jest.fn().mockImplementation(() =>
        query({
          _id: new Types.ObjectId(),
          attempts: 3,
          status: "retrying",
        })
      ),
      updateOne: jest.fn().mockImplementation(() => query({ matchedCount: 1 })),
    };
    const runModel = {
      updateOne: jest.fn().mockImplementation(() => query({ matchedCount: 1 })),
    };
    const service = new FomoV2ParserImportRuntimeService(
      runModel as any,
      {
        exists: jest.fn().mockImplementation(() => query({ _id: "lease" })),
      } as any,
      failureModel as any
    );
    const handle: FomoV2ParserImportRunHandle = {
      pipeline: "vesting",
      sourceType: "dropstab",
      sourceDatabase: "parser",
      sourceCollection: "dropstab_coin_detail_data",
      runId: new Types.ObjectId().toHexString(),
      runKey: "run",
      checkpointId: new Types.ObjectId().toHexString(),
      leaseOwner: "worker",
      leaseMs: 60_000,
      cutoffAt: new Date(),
    };

    const result = await service.recordDocumentFailure(handle, {
      sourceDocumentId: "project-1",
      error: new Error("invalid payload"),
      maxAttempts: 3,
    });

    expect(result).toEqual({ attempts: 3, quarantined: true });
    expect(failureModel.findOneAndUpdate.mock.calls[0][0]).toEqual(
      expect.objectContaining({
        sourceType: "dropstab",
        sourceDocumentId: "project-1",
      })
    );
    expect(failureModel.updateOne).toHaveBeenCalledWith(expect.any(Object), {
      $set: { status: "quarantined" },
    });
  });

  it("resets a resolved document failure budget before the next failure", async () => {
    const state = {
      _id: new Types.ObjectId(),
      attempts: 0,
      status: "retrying",
    };
    const failureModel = {
      findOneAndUpdate: jest.fn().mockImplementation((_filter, update) => {
        state.attempts += Number(update.$inc?.attempts || 0);
        state.status = update.$set?.status || state.status;
        return query({ ...state });
      }),
      updateOne: jest.fn().mockImplementation((_filter, update) => {
        if (update.$set?.attempts !== undefined) {
          state.attempts = update.$set.attempts;
        }
        if (update.$set?.status) state.status = update.$set.status;
        return query({ matchedCount: 1 });
      }),
    };
    const runModel = {
      updateOne: jest.fn().mockImplementation(() => query({ matchedCount: 1 })),
    };
    const service = new FomoV2ParserImportRuntimeService(
      runModel as any,
      {
        exists: jest.fn().mockImplementation(() => query({ _id: "lease" })),
      } as any,
      failureModel as any
    );
    const handle: FomoV2ParserImportRunHandle = {
      pipeline: "activities",
      sourceType: "dropstab",
      sourceDatabase: "parser",
      sourceCollection: "crypto_activities",
      runId: new Types.ObjectId().toHexString(),
      runKey: "run",
      checkpointId: new Types.ObjectId().toHexString(),
      leaseOwner: "worker",
      leaseMs: 60_000,
      cutoffAt: new Date(),
    };

    await expect(
      service.recordDocumentFailure(handle, {
        sourceDocumentId: "activity-1",
        error: new Error("first"),
        maxAttempts: 3,
      })
    ).resolves.toEqual({ attempts: 1, quarantined: false });
    await expect(
      service.recordDocumentFailure(handle, {
        sourceDocumentId: "activity-1",
        error: new Error("second"),
        maxAttempts: 3,
      })
    ).resolves.toEqual({ attempts: 2, quarantined: false });

    await service.resolveDocumentFailure(handle, "activity-1");

    await expect(
      service.recordDocumentFailure(handle, {
        sourceDocumentId: "activity-1",
        error: new Error("new payload failure"),
        maxAttempts: 3,
      })
    ).resolves.toEqual({ attempts: 1, quarantined: false });
    expect(failureModel.updateOne).toHaveBeenCalledWith(
      expect.objectContaining({ sourceDocumentId: "activity-1" }),
      expect.objectContaining({
        $set: expect.objectContaining({ status: "resolved", attempts: 0 }),
      })
    );
  });

  it("starts a changed poison payload at attempt one after an older generation was quarantined", async () => {
    const previousFailureId = new Types.ObjectId();
    const failureModel = {
      findOne: jest.fn().mockReturnValue(
        leanQuery({
          _id: previousFailureId,
          attempts: 3,
          status: "quarantined",
          payloadHash: "payload-a",
          schemaVersion: "activity-source-v1",
        })
      ),
      updateOne: jest.fn().mockImplementation(() => query({ matchedCount: 1 })),
      findOneAndUpdate: jest.fn().mockImplementation(() =>
        query({
          _id: previousFailureId,
          attempts: 1,
          status: "retrying",
          payloadHash: "payload-b",
          schemaVersion: "activity-source-v1",
        })
      ),
    };
    const runModel = {
      updateOne: jest.fn().mockImplementation(() => query({ matchedCount: 1 })),
    };
    const service = new FomoV2ParserImportRuntimeService(
      runModel as any,
      {
        exists: jest.fn().mockImplementation(() => query({ _id: "lease" })),
      } as any,
      failureModel as any
    );
    const handle: FomoV2ParserImportRunHandle = {
      pipeline: "activities",
      sourceType: "dropstab",
      sourceDatabase: "parser",
      sourceCollection: "crypto_activities",
      runId: new Types.ObjectId().toHexString(),
      runKey: "run",
      checkpointId: new Types.ObjectId().toHexString(),
      leaseOwner: "worker",
      leaseMs: 60_000,
      cutoffAt: new Date(),
    };

    await expect(
      service.recordDocumentFailure(handle, {
        sourceDocumentId: "activity-1",
        error: new Error("changed payload is still invalid"),
        payloadHash: "payload-b",
        schemaVersion: "activity-source-v1",
        maxAttempts: 3,
      })
    ).resolves.toEqual({ attempts: 1, quarantined: false });
    expect(failureModel.updateOne).toHaveBeenCalledWith(
      { _id: previousFailureId },
      expect.objectContaining({
        $set: expect.objectContaining({
          attempts: 0,
          status: "retrying",
          payloadHash: "payload-b",
        }),
      })
    );
    expect(failureModel.findOneAndUpdate.mock.calls[0][1].$set).toEqual(
      expect.objectContaining({
        payloadHash: "payload-b",
        schemaVersion: "activity-source-v1",
      })
    );
  });

  it("does not mutate failure state after its lease is lost", async () => {
    const failureModel = {
      findOneAndUpdate: jest.fn(),
      updateOne: jest.fn(),
    };
    const service = new FomoV2ParserImportRuntimeService(
      {} as any,
      { exists: jest.fn().mockImplementation(() => query(null)) } as any,
      failureModel as any
    );
    const handle: FomoV2ParserImportRunHandle = {
      pipeline: "activities",
      sourceType: "dropstab",
      sourceDatabase: "parser",
      sourceCollection: "crypto_activities",
      runId: new Types.ObjectId().toHexString(),
      runKey: "run",
      checkpointId: new Types.ObjectId().toHexString(),
      leaseOwner: "old-worker",
      leaseMs: 60_000,
      cutoffAt: new Date(),
    };

    await expect(
      service.recordDocumentFailure(handle, {
        sourceDocumentId: "activity-1",
        error: new Error("late failure"),
      })
    ).rejects.toBeInstanceOf(FomoV2ParserImportLeaseLostError);
    expect(failureModel.findOneAndUpdate).not.toHaveBeenCalled();
    expect(failureModel.updateOne).not.toHaveBeenCalled();
  });

  it("lists failures only inside an exact normalized source identity", async () => {
    const failureModel = {
      find: jest
        .fn()
        .mockReturnValue(
          listResultQuery([{ sourceType: "icodrops", sourceDocumentId: "42" }])
        ),
    };
    const service = new FomoV2ParserImportRuntimeService(
      {} as any,
      {} as any,
      failureModel as any
    );

    await expect(
      service.listDocumentFailures({
        pipeline: "activities",
        sourceType: "ICO-Drops",
        sourceDatabase: "parser",
        sourceCollection: "crypto_activities",
        status: "quarantined",
        limit: 500,
      })
    ).resolves.toHaveLength(1);
    expect(failureModel.find).toHaveBeenCalledWith({
      pipeline: "activities",
      sourceType: "icodrops",
      sourceDatabase: "parser",
      sourceCollection: "crypto_activities",
      status: "quarantined",
    });
    expect(failureModel.find.mock.results[0].value.limit).toHaveBeenCalledWith(
      100
    );
  });

  it("requeues one exact provider document only when no import lease is active", async () => {
    const failure = {
      _id: new Types.ObjectId(),
      sourceType: "dropstab",
      sourceDocumentId: "42",
      attempts: 0,
      status: "retrying",
    };
    const failureModel = {
      collection: {
        indexes: jest
          .fn()
          .mockResolvedValue([failureIndex, replayQueueIndex]),
      },
      findOneAndUpdate: jest.fn().mockReturnValue(leanQuery(failure)),
    };
    const checkpointModel = {
      collection: { indexes: jest.fn().mockResolvedValue([checkpointIndex]) },
      findOneAndUpdate: jest.fn().mockImplementation(() =>
        query({ _id: new Types.ObjectId() })
      ),
      updateOne: jest.fn().mockImplementation(() => query({ matchedCount: 1 })),
    };
    const service = new FomoV2ParserImportRuntimeService(
      {} as any,
      checkpointModel as any,
      failureModel as any
    );

    await expect(
      service.requeueDocumentFailure({
        pipeline: "activities",
        sourceType: "drop-stab",
        sourceDatabase: "parser",
        sourceCollection: "crypto_activities",
        sourceDocumentId: "42",
      })
    ).resolves.toEqual(failure);
    expect(checkpointModel.findOneAndUpdate).toHaveBeenCalledWith(
      expect.objectContaining({
        pipeline: "activities",
        sourceType: "dropstab",
      }),
      expect.objectContaining({
        $set: expect.objectContaining({
          activeRunId: expect.any(Types.ObjectId),
          leaseOwner: expect.stringContaining("failure-requeue:"),
        }),
      }),
      { new: false }
    );
    expect(checkpointModel.updateOne).toHaveBeenCalledTimes(1);
    expect(failureModel.findOneAndUpdate).toHaveBeenCalledWith(
      {
        pipeline: "activities",
        sourceType: "dropstab",
        sourceDatabase: "parser",
        sourceCollection: "crypto_activities",
        sourceDocumentId: "42",
      },
      expect.objectContaining({
        $set: expect.objectContaining({
          status: "retrying",
          attempts: 0,
          replayRequestedAt: expect.any(Date),
        }),
      }),
      { new: true }
    );
  });

  it("leases a bounded exact replay queue inside one provider identity", async () => {
    const rows = Array.from({ length: 3 }, (_, index) => ({
      sourceDocumentId: `dropstab-${index + 1}`,
      replayRequestedAt: new Date(),
    }));
    const failureModel = {
      find: jest.fn().mockReturnValue(listResultQuery(rows)),
    };
    const checkpointModel = {
      exists: jest.fn().mockImplementation(() => query({ _id: "lease" })),
    };
    const service = new FomoV2ParserImportRuntimeService(
      {} as any,
      checkpointModel as any,
      failureModel as any
    );
    const handle: FomoV2ParserImportRunHandle = {
      pipeline: "activities",
      sourceType: "dropstab",
      sourceDatabase: "parser",
      sourceCollection: "crypto_activities",
      runId: new Types.ObjectId().toHexString(),
      runKey: "replay-run",
      checkpointId: new Types.ObjectId().toHexString(),
      leaseOwner: "replay-worker",
      leaseMs: 60_000,
      cutoffAt: new Date(),
    };

    await expect(service.listReplayRequests(handle, 2)).resolves.toEqual({
      requests: rows.slice(0, 2),
      hasMore: true,
    });
    expect(failureModel.find).toHaveBeenCalledWith({
      pipeline: "activities",
      sourceType: "dropstab",
      sourceDatabase: "parser",
      sourceCollection: "crypto_activities",
      status: "retrying",
      replayRequestedAt: { $exists: true },
    });
    expect(failureModel.find.mock.results[0].value.limit).toHaveBeenCalledWith(
      3
    );
  });

  it("rejects startRun when controlled unique indexes are missing", async () => {
    const runModel = { create: jest.fn() };
    const checkpointModel = {
      collection: { indexes: jest.fn().mockResolvedValue([]) },
    };
    const failureModel = {
      collection: {
        indexes: jest
          .fn()
          .mockResolvedValue([failureIndex, replayQueueIndex]),
      },
    };
    const service = new FomoV2ParserImportRuntimeService(
      runModel as any,
      checkpointModel as any,
      failureModel as any
    );

    await expect(
      service.startRun({
        pipeline: "activities",
        sourceType: "dropstab",
        sourceDatabase: "parser",
        sourceCollection: "crypto_activities",
        dryRun: false,
      })
    ).rejects.toThrow("controlled FOMO v2 index migration");
    expect(runModel.create).not.toHaveBeenCalled();
  });

  it.each([
    {
      label: "wrong key order",
      checkpoint: {
        ...checkpointIndex,
        key: {
          sourceType: 1,
          pipeline: 1,
          sourceDatabase: 1,
          sourceCollection: 1,
        },
      },
      failure: failureIndex,
    },
    {
      label: "partial unique index",
      checkpoint: checkpointIndex,
      failure: {
        ...failureIndex,
        partialFilterExpression: { sourceDocumentId: { $exists: true } },
      },
    },
  ])("rejects a runtime index with $label", async ({ checkpoint, failure }) => {
    const runModel = { create: jest.fn() };
    const service = new FomoV2ParserImportRuntimeService(
      runModel as any,
      {
        collection: { indexes: jest.fn().mockResolvedValue([checkpoint]) },
      } as any,
      {
        collection: { indexes: jest.fn().mockResolvedValue([failure]) },
      } as any
    );

    await expect(
      service.startRun({
        pipeline: "activities",
        sourceType: "dropstab",
        sourceDatabase: "parser",
        sourceCollection: "crypto_activities",
        dryRun: false,
      })
    ).rejects.toThrow("controlled FOMO v2 index migration");
    expect(runModel.create).not.toHaveBeenCalled();
  });

  it("declares sourceType in checkpoint and failure unique indexes", () => {
    const checkpointUnique = (
      FomoV2ParserImportCheckpointSchema.indexes() as any[]
    ).find(
      ([, options]) => options?.name === "uniq_parser_import_checkpoints_source"
    );
    const failureUnique = (
      FomoV2ParserImportFailureSchema.indexes() as any[]
    ).find(
      ([, options]) =>
        options?.name === "uniq_parser_import_failures_source_document"
    );
    const replayQueue = (
      FomoV2ParserImportFailureSchema.indexes() as any[]
    ).find(
      ([, options]) =>
        options?.name === "idx_parser_import_failures_replay_queue"
    );

    expect(checkpointUnique?.[0]).toEqual(
      expect.objectContaining({ sourceType: 1 })
    );
    expect(checkpointUnique?.[1]).toEqual(
      expect.objectContaining({ unique: true })
    );
    expect(failureUnique?.[0]).toEqual(
      expect.objectContaining({ sourceType: 1, sourceDocumentId: 1 })
    );
    expect(replayQueue?.[0]).toEqual({
      pipeline: 1,
      sourceType: 1,
      sourceDatabase: 1,
      sourceCollection: 1,
      status: 1,
      replayRequestedAt: 1,
      _id: 1,
    });
    expect(replayQueue?.[1]?.partialFilterExpression).toEqual({
      status: "retrying",
      replayRequestedAt: { $exists: true },
    });
  });
});
