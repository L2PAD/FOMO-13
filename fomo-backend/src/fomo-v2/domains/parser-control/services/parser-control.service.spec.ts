import { Types } from "mongoose";
import { managedParserDefinition } from "../parser-control.constants";
import {
  FomoV2ParserControlLeaseLostError,
  FomoV2ParserControlService,
} from "./parser-control.service";

function queryResult<T>(value: T) {
  return {
    select: jest.fn().mockReturnThis(),
    lean: jest.fn().mockReturnThis(),
    exec: jest.fn().mockResolvedValue(value),
  };
}

function updateResult(matchedCount: number) {
  return {
    exec: jest.fn().mockResolvedValue({ matchedCount }),
  };
}

function createService() {
  const globalModel = {
    updateOne: jest.fn(),
  };
  const configModel = {
    findOne: jest.fn(),
    findOneAndUpdate: jest.fn(),
    updateOne: jest.fn(),
    updateMany: jest.fn(),
  };
  const runModel = {
    create: jest.fn(),
    findOne: jest.fn(),
    findOneAndUpdate: jest.fn(),
    updateOne: jest.fn(),
    updateMany: jest.fn(),
  };
  const policyService = {
    getGlobalState: jest.fn().mockResolvedValue({
      enabled: true,
      mode: "prod",
    }),
    resolve: jest.fn().mockResolvedValue({
      canRun: true,
      writesDomainData: true,
      effectiveMode: "write",
      globalMode: "prod",
    }),
  };
  const service = new FomoV2ParserControlService(
    globalModel as any,
    configModel as any,
    runModel as any,
    policyService as any
  );
  return { service, globalModel, configModel, runModel, policyService };
}

describe("FomoV2ParserControlService ownership fencing", () => {
  it("atomically rejects TEST mode while a global write lease is active", async () => {
    const { service, globalModel, runModel } = createService();
    runModel.findOne.mockReturnValueOnce(queryResult(null));
    globalModel.updateOne.mockReturnValueOnce(updateResult(0));

    await expect(service.updateGlobal("admin-id", { mode: "test" })).rejects.toThrow(
      "write import or materialization lease is active"
    );

    expect(globalModel.updateOne).toHaveBeenCalledWith(
      expect.objectContaining({
        $or: expect.arrayContaining([
          { activeWriteRunId: { $exists: false } },
          { activeWriteRunId: null },
        ]),
      }),
      expect.any(Object),
      { upsert: false }
    );
  });

  it("does not overwrite omitted global fields from a stale pre-read", async () => {
    const { service, globalModel, runModel, policyService } = createService();
    runModel.findOne.mockReturnValueOnce(queryResult(null));
    runModel.updateMany.mockReturnValueOnce(updateResult(1));
    globalModel.updateOne.mockReturnValueOnce(updateResult(1));
    policyService.getGlobalState
      .mockResolvedValueOnce({ enabled: true, mode: "prod", revision: 4 })
      .mockResolvedValueOnce({ enabled: true, mode: "test", revision: 5 });
    jest.spyOn(service, "getSnapshot").mockResolvedValue({} as any);

    await service.updateGlobal("admin-id", { mode: "test" });

    const update = globalModel.updateOne.mock.calls[0][1];
    expect(update.$set).toEqual({
      mode: "test",
      updatedByAdminId: "admin-id",
    });
    expect(update.$set).not.toHaveProperty("enabled");
  });

  it("renews only the exact global write lease owner", async () => {
    const { service, globalModel, configModel, runModel } = createService();
    const runId = new Types.ObjectId().toHexString();
    runModel.updateOne.mockReturnValueOnce(updateResult(1));
    configModel.updateOne.mockReturnValueOnce(updateResult(1));
    globalModel.updateOne.mockReturnValueOnce(updateResult(0));

    await expect(
      service.heartbeat(runId, "worker-owner", true)
    ).rejects.toBeInstanceOf(FomoV2ParserControlLeaseLostError);

    expect(globalModel.updateOne).toHaveBeenCalledWith(
      expect.objectContaining({
        activeWriteRunId: new Types.ObjectId(runId),
        activeWriteLeaseOwner: "worker-owner",
        enabled: true,
        mode: "prod",
      }),
      expect.any(Object)
    );
  });

  it("returns the existing snapshot import for the same idempotency key", async () => {
    const { service, runModel, configModel } = createService();
    const existing = {
      _id: new Types.ObjectId(),
      parserKey: "funding:dropstab",
      requestedMode: "dry-run",
      snapshotId: "snapshot-1",
      upstreamRunId: "remote-1",
      idempotencyKey: "upstream-flow:flow-1:auto-import",
      status: "queued",
      limit: 20,
    };
    runModel.findOne.mockReturnValue(queryResult(existing));

    await expect(
      service.queueManualRun("admin-id", "funding:dropstab", "dry-run", 20, {
        snapshotId: "snapshot-1",
        upstreamRunId: "remote-1",
        idempotencyKey: "upstream-flow:flow-1:auto-import",
      })
    ).resolves.toBe(existing);
    expect(configModel.findOneAndUpdate).not.toHaveBeenCalled();
    expect(runModel.create).not.toHaveBeenCalled();
  });

  it("preserves a funding snapshot limit above the legacy 1000 cap", async () => {
    const { service, configModel, runModel } = createService();
    configModel.updateOne.mockReturnValueOnce(updateResult(1));
    configModel.findOne.mockReturnValueOnce(
      queryResult({
        parserKey: "funding:dropstab",
        paused: false,
        intervalMinutes: 360,
      })
    );
    configModel.findOneAndUpdate.mockReturnValueOnce(
      queryResult({ parserKey: "funding:dropstab", paused: false })
    );
    runModel.create.mockImplementationOnce((value: Record<string, any>) => ({
      toObject: () => value,
    }));

    const run = await service.queueManualRun(
      "admin-id",
      "funding:dropstab",
      "dry-run",
      5_000,
      { snapshotId: "snapshot-large" }
    );

    expect(run.limit).toBe(5_000);
  });

  it.each([
    "market:coingecko",
    "funding:dropstab",
    "funding:icodrops",
    "funding:intel_fundraising",
    "ico:icodrops",
    "backers:dropstab",
    "vesting:dropstab",
    "unlocks:dropstab",
    "activities:dropstab",
  ])("rejects managed %s write without a snapshot", async (parserKey) => {
    const { service, runModel } = createService();

    await expect(
      service.queueManualRun("admin-id", parserKey, "write", 10)
    ).rejects.toThrow("only from a complete apiintel snapshot");
    expect(runModel.create).not.toHaveBeenCalled();
  });

  it("drops an old downstream scheduled WRITE that has no snapshot", async () => {
    const { service, configModel, runModel } = createService();

    await expect(
      (service as any).queueRun({
        definition: managedParserDefinition("funding:icodrops")!,
        requestedMode: "write",
        trigger: "schedule",
        adminId: "scheduler",
      })
    ).resolves.toBeNull();
    expect(configModel.updateOne).not.toHaveBeenCalled();
    expect(runModel.create).not.toHaveBeenCalled();
  });

  it("rejects manual queueing when this server has no parser worker", async () => {
    const previousWorkerEnabled =
      process.env.FOMO_V2_PARSER_CONTROL_WORKER_ENABLED;
    process.env.FOMO_V2_PARSER_CONTROL_WORKER_ENABLED = "false";
    const { service, configModel } = createService();

    try {
      await expect(
        service.queueManualRun("admin-id", "funding:dropstab", "dry-run", 10)
      ).rejects.toThrow("Parser worker is disabled");
    } finally {
      if (previousWorkerEnabled === undefined) {
        delete process.env.FOMO_V2_PARSER_CONTROL_WORKER_ENABLED;
      } else {
        process.env.FOMO_V2_PARSER_CONTROL_WORKER_ENABLED =
          previousWorkerEnabled;
      }
    }

    expect(configModel.updateOne).not.toHaveBeenCalled();
  });

  it("does not execute a queued run after its config ownership was replaced", async () => {
    const { service, configModel, runModel } = createService();
    const runId = new Types.ObjectId();
    runModel.findOneAndUpdate
      .mockReturnValueOnce(
        queryResult({
          _id: runId,
          parserKey: "activities:dropstab",
          status: "queued",
          leaseOwner: "queue-owner",
          queuedAt: new Date(),
        })
      )
      .mockReturnValueOnce(queryResult(null));
    configModel.updateOne.mockReturnValueOnce(updateResult(0));
    runModel.updateOne.mockReturnValueOnce(updateResult(1));

    await expect(service.claimNextRun("worker-owner")).resolves.toBeNull();

    expect(configModel.updateOne).toHaveBeenCalledWith(
      expect.objectContaining({
        activeRunId: runId,
        activeLeaseOwner: "queue-owner",
      }),
      expect.any(Object)
    );
    expect(runModel.updateOne).toHaveBeenCalledWith(
      {
        _id: runId,
        status: "running",
        leaseOwner: "worker-owner",
      },
      expect.objectContaining({
        $set: expect.objectContaining({ status: "abandoned" }),
      })
    );
  });

  it("returns a claim only after config ownership is transferred to the worker", async () => {
    const { service, configModel, runModel } = createService();
    const runId = new Types.ObjectId();
    runModel.findOneAndUpdate.mockReturnValueOnce(
      queryResult({
        _id: runId,
        parserKey: "funding:dropstab",
        status: "queued",
        leaseOwner: "queue-owner",
      })
    );
    configModel.updateOne.mockReturnValueOnce(updateResult(1));

    const claimed = await service.claimNextRun("worker-owner");

    expect(claimed).toMatchObject({
      _id: runId,
      parserKey: "funding:dropstab",
      status: "running",
      leaseOwner: "worker-owner",
    });
  });

  it("does not clear config when cancellation loses the queued-to-running race", async () => {
    const { service, configModel, runModel } = createService();
    runModel.findOneAndUpdate.mockReturnValueOnce(queryResult(null));

    await (service as any).cancelQueuedRuns(
      "activities:icodrops",
      "parser-paused"
    );

    expect(configModel.updateOne).not.toHaveBeenCalled();
  });

  it("can cancel scheduled work without touching a queued manual run", async () => {
    const { service, runModel } = createService();
    runModel.findOneAndUpdate.mockReturnValueOnce(queryResult(null));

    await (service as any).cancelQueuedRuns(
      "market:coingecko",
      "schedule-disabled",
      "schedule"
    );

    expect(runModel.findOneAndUpdate).toHaveBeenCalledWith(
      {
        status: { $in: ["queued", "recovering"] },
        parserKey: "market:coingecko",
        trigger: "schedule",
      },
      expect.any(Object),
      expect.any(Object)
    );
  });

  it("clears only the exact queue owner after an atomic cancellation", async () => {
    const { service, configModel, runModel } = createService();
    const runId = new Types.ObjectId();
    runModel.findOneAndUpdate
      .mockReturnValueOnce(
        queryResult({
          _id: runId,
          parserKey: "activities:icodrops",
          status: "cancelled",
          leaseOwner: "queue-owner",
          queuedAt: new Date(),
        })
      )
      .mockReturnValueOnce(queryResult(null));
    configModel.updateOne.mockReturnValueOnce(updateResult(1));

    await (service as any).cancelQueuedRuns(
      "activities:icodrops",
      "parser-paused"
    );

    expect(configModel.updateOne).toHaveBeenCalledWith(
      {
        parserKey: "activities:icodrops",
        activeRunId: runId,
        activeLeaseOwner: "queue-owner",
      },
      expect.any(Object)
    );
  });

  it("abandons only the expired owner when a stale config lease is taken over", async () => {
    const { service, configModel, runModel } = createService();
    const staleRunId = new Types.ObjectId();
    const queuedRunId = new Types.ObjectId();
    const staleLeaseOwner = "stale-worker";
    configModel.updateOne.mockReturnValueOnce(updateResult(1));
    configModel.findOne.mockReturnValueOnce(
      queryResult({
        parserKey: "funding:dropstab",
        paused: false,
        intervalMinutes: 360,
      })
    );
    configModel.findOneAndUpdate.mockReturnValueOnce(
      queryResult({
        parserKey: "funding:dropstab",
        activeRunId: staleRunId,
        activeLeaseOwner: staleLeaseOwner,
        activeLeaseExpiresAt: new Date(0),
      })
    );
    runModel.updateOne.mockReturnValueOnce(updateResult(1));
    runModel.create.mockImplementationOnce((value: Record<string, any>) => ({
      toObject: () => ({ ...value, _id: queuedRunId }),
    }));

    await service.queueManualRun("admin-id", "funding:dropstab", "dry-run", 10);

    expect(runModel.updateOne).toHaveBeenCalledWith(
      {
        _id: staleRunId,
        status: { $in: ["queued", "running", "recovering"] },
        leaseOwner: staleLeaseOwner,
      },
      expect.objectContaining({
        $set: expect.objectContaining({
          status: "abandoned",
          policyReason: "lease-expired",
        }),
      })
    );
  });

  it("abandons a running claim when its config heartbeat loses ownership", async () => {
    const { service, configModel, runModel } = createService();
    runModel.updateOne
      .mockReturnValueOnce(updateResult(1))
      .mockReturnValueOnce(updateResult(1));
    configModel.updateOne.mockReturnValueOnce(updateResult(0));

    await expect(
      service.heartbeat(new Types.ObjectId().toHexString(), "worker-owner")
    ).rejects.toBeInstanceOf(FomoV2ParserControlLeaseLostError);

    expect(runModel.updateOne).toHaveBeenLastCalledWith(
      expect.objectContaining({
        status: "running",
        leaseOwner: "worker-owner",
      }),
      expect.objectContaining({
        $set: expect.objectContaining({ status: "abandoned" }),
      })
    );
  });

  it("persists bounded live execution progress behind the active lease", async () => {
    const { service, configModel, runModel } = createService();
    const runId = new Types.ObjectId().toHexString();
    runModel.updateOne
      .mockReturnValueOnce(updateResult(1))
      .mockReturnValueOnce(updateResult(1));
    configModel.updateOne.mockReturnValueOnce(updateResult(1));

    await service.reportExecutionProgress(runId, "worker-owner", {
      phase: "materialization",
      step: "funding-feed-read-model",
      batch: 2,
      scanned: 750,
      written: 740,
    });

    expect(runModel.updateOne).toHaveBeenLastCalledWith(
      { _id: runId, status: "running", leaseOwner: "worker-owner" },
      {
        $set: {
          progress: expect.objectContaining({
            phase: "materialization",
            step: "funding-feed-read-model",
            batch: 2,
            scanned: 750,
            written: 740,
            updatedAt: expect.any(Date),
          }),
        },
      }
    );
  });

  it("does not publish a terminal result after config ownership is lost", async () => {
    const { service, configModel, runModel } = createService();
    configModel.updateOne.mockReturnValueOnce(updateResult(0));

    await expect(
      service.finishRun(
        {
          _id: new Types.ObjectId(),
          parserKey: "funding:icodrops",
          status: "running",
          leaseOwner: "old-worker",
        },
        { status: "completed" }
      )
    ).rejects.toBeInstanceOf(FomoV2ParserControlLeaseLostError);

    expect(runModel.updateOne).not.toHaveBeenCalled();
  });

  it("recovers only an expired immutable snapshot run and fences its old owner", async () => {
    const { service, configModel, runModel } = createService();
    const now = new Date("2026-08-02T00:00:00.000Z");
    const runId = new Types.ObjectId();
    const expired = {
      _id: runId,
      parserKey: "funding:dropstab",
      status: "running",
      snapshotId: "snapshot-1",
      leaseOwner: "old-worker",
      leaseExpiresAt: new Date("2026-08-01T23:00:00.000Z"),
      queuedAt: new Date("2026-08-01T22:00:00.000Z"),
    };
    runModel.findOneAndUpdate.mockReturnValueOnce(queryResult(expired));
    configModel.updateOne
      .mockReturnValueOnce(updateResult(1))
      .mockReturnValueOnce(updateResult(0));
    runModel.updateOne.mockReturnValueOnce(updateResult(1));

    await expect(service.recoverExpiredSnapshotRuns(now, 1)).resolves.toBe(1);

    const recoveryOwner =
      runModel.findOneAndUpdate.mock.calls[0][1][0].$set.leaseOwner;
    expect(runModel.findOneAndUpdate).toHaveBeenCalledWith(
      expect.objectContaining({
        status: { $in: ["running", "recovering"] },
        parserKey: {
          $in: expect.arrayContaining([
            "funding:dropstab",
            "backers:dropstab",
            "market:coingecko",
          ]),
        },
        snapshotId: { $exists: true, $type: "string", $ne: "" },
      }),
      [
        {
          $set: expect.objectContaining({
            status: "recovering",
            previousLeaseOwner: "$leaseOwner",
            leaseOwner: recoveryOwner,
            attempt: { $add: [{ $ifNull: ["$attempt", 1] }, 1] },
            recoveryCount: {
              $add: [{ $ifNull: ["$recoveryCount", 0] }, 1],
            },
          }),
        },
      ],
      expect.any(Object)
    );
    expect(configModel.updateOne).toHaveBeenNthCalledWith(
      1,
      expect.objectContaining({
        parserKey: "funding:dropstab",
        paused: false,
        $or: expect.arrayContaining([
          {
            activeRunId: runId,
            activeLeaseOwner: { $in: ["old-worker"] },
          },
        ]),
      }),
      expect.objectContaining({
        $set: expect.objectContaining({
          activeRunId: runId,
          activeLeaseOwner: recoveryOwner,
        }),
      })
    );
    expect(runModel.updateOne).toHaveBeenCalledWith(
      {
        _id: runId,
        status: "recovering",
        leaseOwner: recoveryOwner,
      },
      expect.objectContaining({
        $set: expect.objectContaining({
          status: "queued",
          previousLeaseOwner: "old-worker",
        }),
      })
    );

    await expect(
      service.finishRun(expired, { status: "completed" })
    ).rejects.toBeInstanceOf(FomoV2ParserControlLeaseLostError);
    expect(runModel.updateOne).toHaveBeenCalledTimes(1);
  });

  it("never selects a legacy mutable-source run for automatic recovery", async () => {
    const { service, configModel, runModel } = createService();
    runModel.findOneAndUpdate.mockReturnValueOnce(queryResult(null));

    await expect(
      service.recoverExpiredSnapshotRuns(new Date(), 1)
    ).resolves.toBe(0);

    expect(runModel.findOneAndUpdate.mock.calls[0][0]).toEqual(
      expect.objectContaining({
        parserKey: {
          $in: expect.arrayContaining([
            "funding:dropstab",
            "backers:dropstab",
            "market:coingecko",
          ]),
        },
        snapshotId: { $exists: true, $type: "string", $ne: "" },
      })
    );
    expect(configModel.updateOne).not.toHaveBeenCalled();
  });

  it("can resume a recovery attempt that itself lost its lease", async () => {
    const { service, configModel, runModel } = createService();
    const runId = new Types.ObjectId();
    const expiredRecovery = {
      _id: runId,
      parserKey: "funding:dropstab",
      status: "recovering",
      snapshotId: "snapshot-1",
      leaseOwner: "recovery-old",
      previousLeaseOwner: "worker-old",
      leaseExpiresAt: new Date(0),
    };
    runModel.findOneAndUpdate.mockReturnValueOnce(queryResult(expiredRecovery));
    configModel.updateOne.mockReturnValueOnce(updateResult(1));
    runModel.updateOne.mockReturnValueOnce(updateResult(1));

    await expect(
      service.recoverExpiredSnapshotRuns(new Date(), 1)
    ).resolves.toBe(1);

    expect(configModel.updateOne.mock.calls[0][0].$or).toEqual(
      expect.arrayContaining([
        {
          activeRunId: runId,
          activeLeaseOwner: { $in: ["recovery-old", "worker-old"] },
        },
      ])
    );
  });

  it.each(["failed", "partial", "cancelled"] as const)(
    "requeues the same %s immutable idempotent run through a serialized retry claim",
    async (terminalStatus) => {
    const { service, configModel, runModel } = createService();
    const runId = new Types.ObjectId();
    const existing = {
      _id: runId,
      parserKey: "funding:dropstab",
      requestedMode: "write",
      snapshotId: "snapshot-1",
      upstreamRunId: "remote-1",
      idempotencyKey: "snapshot:snapshot-1:funding:dropstab:write",
      status: terminalStatus,
      limit: 50,
      leaseOwner: "old-worker",
      leaseExpiresAt: new Date(Date.now() + 60_000),
    };
    runModel.findOne.mockReturnValueOnce(queryResult(existing));
    configModel.updateOne.mockReturnValueOnce(updateResult(1));
    configModel.findOne.mockReturnValueOnce(
      queryResult({ parserKey: "funding:dropstab", paused: false })
    );
    runModel.findOneAndUpdate
      .mockReturnValueOnce(queryResult(existing))
      .mockReturnValueOnce(
        queryResult({ ...existing, status: "queued", attempt: 2 })
      );
    configModel.findOneAndUpdate.mockReturnValueOnce(
      queryResult({
        parserKey: "funding:dropstab",
        activeRunId: runId,
        activeLeaseOwner: "old-worker",
        activeLeaseExpiresAt: existing.leaseExpiresAt,
      })
    );

    const retried = await service.queueManualRun(
      "admin-id",
      "funding:dropstab",
      "write",
      50,
      {
        snapshotId: "snapshot-1",
        upstreamRunId: "remote-1",
        idempotencyKey: "snapshot:snapshot-1:funding:dropstab:write",
      }
    );

    expect(retried).toMatchObject({ _id: runId, status: "queued", attempt: 2 });
    const retryOwner =
      runModel.findOneAndUpdate.mock.calls[0][1].$set.leaseOwner;
    expect(configModel.findOneAndUpdate.mock.calls[0][0].$or).toEqual(
      expect.arrayContaining([
        {
          activeRunId: runId,
          activeLeaseOwner: "old-worker",
        },
      ])
    );
    expect(runModel.findOneAndUpdate).toHaveBeenNthCalledWith(
      2,
      expect.objectContaining({
        _id: runId,
        status: "recovering",
        leaseOwner: retryOwner,
      }),
      expect.objectContaining({
        $set: expect.objectContaining({ status: "queued" }),
        $inc: { attempt: 1 },
      }),
      { new: true }
    );
      expect(runModel.create).not.toHaveBeenCalled();
    }
  );

  it("finishes and releases only the worker that still owns both fences", async () => {
    const { service, configModel, runModel } = createService();
    const runId = new Types.ObjectId();
    configModel.updateOne
      .mockReturnValueOnce(updateResult(1))
      .mockReturnValueOnce(updateResult(1));
    runModel.updateOne.mockReturnValueOnce(updateResult(1));

    await service.finishRun(
      {
        _id: runId,
        parserKey: "funding:dropstab",
        status: "running",
        leaseOwner: "worker-owner",
        queuedAt: new Date(),
      },
      { status: "completed", summary: { scanned: 5 } }
    );

    expect(runModel.updateOne).toHaveBeenCalledWith(
      { _id: runId, status: "running", leaseOwner: "worker-owner" },
      expect.any(Object)
    );
    expect(configModel.updateOne).toHaveBeenLastCalledWith(
      {
        parserKey: "funding:dropstab",
        activeRunId: runId,
        activeLeaseOwner: "worker-owner",
      },
      expect.objectContaining({
        $unset: expect.objectContaining({ activeRunId: "" }),
      })
    );
  });
});
