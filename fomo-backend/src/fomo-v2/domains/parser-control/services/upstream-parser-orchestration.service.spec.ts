import { NotFoundException } from "@nestjs/common";
import { FomoV2UpstreamParserOrchestrationService } from "./upstream-parser-orchestration.service";

function queryResult<T>(value: T) {
  return {
    lean: jest.fn().mockReturnThis(),
    exec: jest.fn().mockResolvedValue(value),
  };
}

function sortedQueryResult<T>(value: T) {
  return {
    sort: jest.fn().mockReturnValue({
      lean: jest.fn().mockReturnValue({
        exec: jest.fn().mockResolvedValue(value),
      }),
    }),
  };
}

function listQueryResult<T>(value: T) {
  return {
    sort: jest.fn().mockReturnThis(),
    limit: jest.fn().mockReturnThis(),
    lean: jest.fn().mockReturnThis(),
    exec: jest.fn().mockResolvedValue(value),
  };
}

describe("FomoV2UpstreamParserOrchestrationService", () => {
  it("allows TEST main against PROD apiintel but blocks PROD main against TEST apiintel", async () => {
    const intel = {
      listParsers: jest
        .fn()
        .mockResolvedValueOnce({ environment: "prod" })
        .mockResolvedValueOnce({ environment: "test" }),
    };
    const service = new FomoV2UpstreamParserOrchestrationService(
      {} as any,
      intel as any,
      {} as any,
      {} as any,
      {} as any
    );

    await expect(
      (service as any).assertUpstreamEnvironment(
        "test",
        "dropstab:coin-details"
      )
    ).resolves.toBe("prod");
    await expect(
      (service as any).assertUpstreamEnvironment(
        "prod",
        "dropstab:coin-details"
      )
    ).rejects.toThrow("environment mismatch");
  });

  it("retries a failed queue claim only when no downstream run id was stored", async () => {
    const findOneAndUpdate = jest.fn().mockReturnValue(queryResult(null));
    const service = new FomoV2UpstreamParserOrchestrationService(
      { findOneAndUpdate } as any,
      {} as any,
      {} as any,
      { queueManualRun: jest.fn() } as any,
      {} as any
    );

    await (service as any).queuePendingAutoImports();

    const filter = findOneAndUpdate.mock.calls[0][0];
    expect(filter.$or).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          autoImportStatus: "failed",
          $and: expect.arrayContaining([
            expect.objectContaining({
              $or: expect.arrayContaining([
                { autoImportRunId: { $exists: false } },
              ]),
            }),
            expect.objectContaining({
              $or: expect.arrayContaining([
                { autoImportRunIds: { $exists: false } },
              ]),
            }),
          ]),
        }),
      ])
    );
  });

  it("blocks re-enabling an upstream parser while global control is OFF", async () => {
    const intel = { updateParser: jest.fn() };
    const service = new FomoV2UpstreamParserOrchestrationService(
      {} as any,
      intel as any,
      {
        getGlobalState: jest
          .fn()
          .mockResolvedValue({ enabled: false, mode: "prod" }),
      } as any,
      {} as any,
      {} as any
    );

    await expect(
      service.updateParser("dropstab:coin-details", { paused: false })
    ).rejects.toThrow("Global parser control is OFF");
    expect(intel.updateParser).not.toHaveBeenCalled();
  });

  it("prevalidates and idempotently queues a manual PROD snapshot write", async () => {
    const flowModel = {
      findOne: jest.fn().mockReturnValue(
        sortedQueryResult({
          _id: "mongo-flow-id",
          flowId: "flow-1",
          parserKey: "dropstab:coin-details",
          sourceType: "dropstab",
          entityLimit: 500,
          externalRunId: "remote-1",
          snapshotId: "snapshot-1",
          snapshot: { status: "complete", environment: "prod" },
          autoImport: {
            targets: [
              {
                pipelineKey: "funding:dropstab",
                requestedMode: "write",
                mode: "write",
              },
            ],
          },
          autoImportRunId: "import-run-1",
          autoImportRunIds: { "funding:dropstab": "import-run-1" },
          autoImportStatus: "failed",
        })
      ),
      updateOne: jest
        .fn()
        .mockReturnValue({ exec: jest.fn().mockResolvedValue({}) }),
    };
    const intel = {
      getSnapshot: jest.fn().mockResolvedValue({
        snapshotId: "snapshot-1",
        runId: "remote-1",
        parserKey: "dropstab:coin-details",
        sourceType: "dropstab",
        environment: "prod",
        status: "complete",
        counts: { succeeded: 500 },
      }),
    };
    const parserControl = {
      queueManualRun: jest
        .fn()
        .mockResolvedValue({ _id: "import-run-1", status: "queued" }),
    };
    const worker = { wake: jest.fn() };
    const service = new FomoV2UpstreamParserOrchestrationService(
      flowModel as any,
      intel as any,
      {
        getGlobalState: jest
          .fn()
          .mockResolvedValue({ enabled: true, mode: "prod" }),
      } as any,
      parserControl as any,
      worker as any
    );

    await service.importSnapshot("admin-1", "snapshot-1", {
      pipelineKey: "funding:dropstab",
      mode: "write",
    });

    expect(parserControl.queueManualRun).toHaveBeenCalledWith(
      "admin-1",
      "funding:dropstab",
      "write",
      500,
      {
        snapshotId: "snapshot-1",
        upstreamRunId: "remote-1",
        idempotencyKey:
          "upstream-flow:flow-1:funding:dropstab:auto-import",
      }
    );
    expect(worker.wake).toHaveBeenCalled();
    expect(flowModel.updateOne).toHaveBeenCalledWith(
      {
        _id: "mongo-flow-id",
        autoImportStatus: { $in: ["failed", "partial", "cancelled"] },
      },
      expect.objectContaining({
        $set: expect.objectContaining({
          autoImportStatus: "queued",
          "autoImportRunIds.funding:dropstab": "import-run-1",
        }),
        $unset: expect.objectContaining({ autoImportFinishedAt: "" }),
      })
    );
  });

  it("allows only a source-mapped downstream target for a shared ICODrops snapshot", async () => {
    const flowModel = {
      findOne: jest.fn().mockReturnValue(
        sortedQueryResult({
          _id: "icodrops-flow",
          parserKey: "icodrops:projects",
          sourceType: "icodrops",
          entityLimit: 25,
          externalRunId: "remote-ico-1",
          snapshotId: "snapshot-ico-1",
          snapshot: { status: "complete", environment: "prod" },
        })
      ),
      updateOne: jest
        .fn()
        .mockReturnValue({ exec: jest.fn().mockResolvedValue({}) }),
    };
    const intel = {
      getSnapshot: jest.fn().mockResolvedValue({
        snapshotId: "snapshot-ico-1",
        runId: "remote-ico-1",
        parserKey: "icodrops:projects",
        sourceType: "icodrops",
        environment: "prod",
        status: "complete",
        counts: { succeeded: 25 },
      }),
    };
    const parserControl = {
      queueManualRun: jest
        .fn()
        .mockResolvedValue({ _id: "import-ico-1", status: "queued" }),
    };
    const service = new FomoV2UpstreamParserOrchestrationService(
      flowModel as any,
      intel as any,
      {
        getGlobalState: jest
          .fn()
          .mockResolvedValue({ enabled: true, mode: "prod" }),
      } as any,
      parserControl as any,
      { wake: jest.fn() } as any
    );

    await service.importSnapshot("admin-1", "snapshot-ico-1", {
      pipelineKey: "ico:icodrops",
      mode: "write",
    });
    expect(parserControl.queueManualRun).toHaveBeenCalledWith(
      "admin-1",
      "ico:icodrops",
      "write",
      25,
      expect.objectContaining({
        snapshotId: "snapshot-ico-1",
        idempotencyKey: "snapshot:snapshot-ico-1:ico:icodrops:write",
      })
    );

    await expect(
      service.importSnapshot("admin-1", "snapshot-ico-1", {
        pipelineKey: "vesting:dropstab",
        mode: "dry-run",
      })
    ).rejects.toThrow("cannot import snapshot");
  });

  it("keeps a recovering downstream import active in the flow timeline", async () => {
    const flowModel = {
      find: jest.fn().mockReturnValue(
        listQueryResult([
          {
            _id: "mongo-flow-id",
            parserKey: "dropstab:coin-details",
            sourceType: "dropstab",
            autoImportStatus: "queued",
            autoImportRunId: "import-run-1",
            autoImportRunIds: { "funding:dropstab": "import-run-1" },
            autoImport: {
              targets: [
                {
                  pipelineKey: "funding:dropstab",
                  requestedMode: "dry-run",
                  mode: "dry-run",
                },
              ],
            },
          },
        ])
      ),
      updateOne: jest
        .fn()
        .mockReturnValue({ exec: jest.fn().mockResolvedValue({}) }),
    };
    const service = new FomoV2UpstreamParserOrchestrationService(
      flowModel as any,
      {} as any,
      {} as any,
      {
        getRunById: jest.fn().mockResolvedValue({ status: "recovering" }),
      } as any,
      {} as any
    );

    await (service as any).reconcileAutoImports();

    expect(flowModel.updateOne).toHaveBeenCalledWith(
      {
        _id: "mongo-flow-id",
        autoImportStatus: { $in: ["queued", "running"] },
      },
      {
        $set: expect.objectContaining({
          autoImportStatus: "running",
          autoImportResult: expect.objectContaining({
            targets: expect.objectContaining({
              "funding:dropstab": expect.objectContaining({
                status: "recovering",
              }),
            }),
          }),
        }),
      }
    );
    expect(flowModel.updateOne).not.toHaveBeenCalledWith(
      expect.anything(),
      expect.objectContaining({
        $set: expect.objectContaining({ autoImportStatus: "failed" }),
      })
    );
  });

  it("discovers a scheduled apiintel run on demand before controlling it", async () => {
    const flowModel = {
      updateOne: jest
        .fn()
        .mockReturnValue({ exec: jest.fn().mockResolvedValue({}) }),
    };
    const intel = {
      controlRun: jest.fn().mockResolvedValue({
        runId: "remote-1",
        parserKey: "dropstab:coin-details",
        sourceType: "dropstab",
        status: "paused",
      }),
    };
    const service = new FomoV2UpstreamParserOrchestrationService(
      flowModel as any,
      intel as any,
      {} as any,
      {} as any,
      {} as any
    );
    const flow = {
      _id: "mongo-flow-id",
      externalRunId: "remote-1",
      parserKey: "dropstab:coin-details",
      sourceType: "dropstab",
    };
    jest
      .spyOn(service as any, "requireFlow")
      .mockRejectedValueOnce(new NotFoundException())
      .mockResolvedValueOnce(flow);
    const discover = jest
      .spyOn(service as any, "discoverRemoteRuns")
      .mockResolvedValue(undefined);
    jest
      .spyOn(service as any, "updateFlowFromRun")
      .mockResolvedValue({ ...flow, status: "paused" });

    await expect(
      service.controlRun("remote-1", "pause")
    ).resolves.toMatchObject({ status: "paused" });

    expect(discover).toHaveBeenCalledTimes(1);
    expect(intel.controlRun).toHaveBeenCalledWith("remote-1", "pause");
  });

  it("queues one idempotent auto-import for one completed upstream flow", async () => {
    const flow = {
      _id: "mongo-flow-id",
      flowId: "flow-1",
      parserKey: "dropstab:coin-details",
      sourceType: "dropstab",
      status: "succeeded",
      snapshotId: "snapshot-1",
      externalRunId: "remote-run-1",
      requestedByAdminId: "admin-1",
      globalMode: "test",
      autoImport: {
        pipelineKey: "funding:dropstab",
        mode: "write",
        limit: 25,
      },
      autoImportStatus: "queueing",
    };
    const flowModel = {
      findOneAndUpdate: jest
        .fn()
        .mockReturnValueOnce(queryResult(flow))
        .mockReturnValueOnce(queryResult(null)),
      updateOne: jest
        .fn()
        .mockReturnValue({ exec: jest.fn().mockResolvedValue({}) }),
    };
    const parserControl = {
      queueManualRun: jest.fn().mockResolvedValue({ _id: "import-run-1" }),
    };
    const worker = { wake: jest.fn() };
    const service = new FomoV2UpstreamParserOrchestrationService(
      flowModel as any,
      {} as any,
      {} as any,
      parserControl as any,
      worker as any
    );

    await (service as any).queuePendingAutoImports();

    expect(parserControl.queueManualRun).toHaveBeenCalledTimes(1);
    expect(parserControl.queueManualRun).toHaveBeenCalledWith(
      "admin-1",
      "funding:dropstab",
      "dry-run",
      25,
      {
        snapshotId: "snapshot-1",
        upstreamRunId: "remote-run-1",
        idempotencyKey:
          "upstream-flow:flow-1:funding:dropstab:auto-import",
      }
    );
    expect(worker.wake).toHaveBeenCalledTimes(1);
    expect(flowModel.updateOne).toHaveBeenCalledWith(
      { _id: "mongo-flow-id", autoImportStatus: "queueing" },
      expect.objectContaining({
        $set: expect.objectContaining({
          autoImportStatus: "queued",
          autoImportRunId: "import-run-1",
          autoImportRunIds: { "funding:dropstab": "import-run-1" },
        }),
      })
    );
  });

  it("fans one Dropstab coin snapshot out to all three allowed downstream pipelines", async () => {
    const flow = {
      _id: "mongo-flow-id",
      flowId: "flow-fan-out",
      parserKey: "dropstab:coin-details",
      sourceType: "dropstab",
      status: "succeeded",
      snapshotId: "snapshot-fan-out",
      snapshot: { status: "complete", counts: { succeeded: 30 } },
      externalRunId: "remote-fan-out",
      requestedByAdminId: "admin-1",
      globalMode: "prod",
      autoImport: {
        targets: [
          {
            pipelineKey: "funding:dropstab",
            requestedMode: "write",
            mode: "write",
            limit: 10,
          },
          {
            pipelineKey: "vesting:dropstab",
            requestedMode: "dry-run",
            mode: "dry-run",
            limit: 7,
          },
          {
            pipelineKey: "unlocks:dropstab",
            requestedMode: "write",
            mode: "write",
            limit: 10,
          },
        ],
      },
      autoImportStatus: "queueing",
    };
    const flowModel = {
      findOneAndUpdate: jest
        .fn()
        .mockReturnValueOnce(queryResult(flow))
        .mockReturnValueOnce(queryResult(null)),
      updateOne: jest
        .fn()
        .mockReturnValue({ exec: jest.fn().mockResolvedValue({}) }),
    };
    const parserControl = {
      queueManualRun: jest
        .fn()
        .mockResolvedValueOnce({ _id: "funding-run", status: "queued" })
        .mockResolvedValueOnce({ _id: "vesting-run", status: "queued" })
        .mockResolvedValueOnce({ _id: "unlocks-run", status: "queued" }),
    };
    const worker = { wake: jest.fn() };
    const service = new FomoV2UpstreamParserOrchestrationService(
      flowModel as any,
      {} as any,
      {} as any,
      parserControl as any,
      worker as any
    );

    await (service as any).queuePendingAutoImports();

    expect(parserControl.queueManualRun).toHaveBeenCalledTimes(3);
    expect(parserControl.queueManualRun).toHaveBeenNthCalledWith(
      1,
      "admin-1",
      "funding:dropstab",
      "write",
      30,
      expect.objectContaining({
        idempotencyKey:
          "upstream-flow:flow-fan-out:funding:dropstab:auto-import",
      })
    );
    expect(parserControl.queueManualRun).toHaveBeenNthCalledWith(
      2,
      "admin-1",
      "vesting:dropstab",
      "dry-run",
      7,
      expect.objectContaining({
        idempotencyKey:
          "upstream-flow:flow-fan-out:vesting:dropstab:auto-import",
      })
    );
    expect(parserControl.queueManualRun).toHaveBeenNthCalledWith(
      3,
      "admin-1",
      "unlocks:dropstab",
      "write",
      30,
      expect.objectContaining({
        idempotencyKey:
          "upstream-flow:flow-fan-out:unlocks:dropstab:auto-import",
      })
    );
    expect(flowModel.updateOne).toHaveBeenCalledWith(
      { _id: "mongo-flow-id", autoImportStatus: "queueing" },
      expect.objectContaining({
        $set: expect.objectContaining({
          autoImportRunIds: {
            "funding:dropstab": "funding-run",
            "vesting:dropstab": "vesting-run",
            "unlocks:dropstab": "unlocks-run",
          },
        }),
      })
    );
    expect(worker.wake).toHaveBeenCalledTimes(1);
  });

  it("reports partial fan-out without treating successful policy reasons as errors", async () => {
    const flowModel = {
      find: jest.fn().mockReturnValue(
        listQueryResult([
          {
            _id: "fan-out-flow",
            autoImportStatus: "running",
            parserKey: "dropstab:coin-details",
            sourceType: "dropstab",
            autoImport: {
              targets: [
                {
                  pipelineKey: "funding:dropstab",
                  requestedMode: "dry-run",
                  mode: "dry-run",
                },
                {
                  pipelineKey: "vesting:dropstab",
                  requestedMode: "dry-run",
                  mode: "dry-run",
                },
              ],
            },
            autoImportRunIds: {
              "funding:dropstab": "completed-run",
              "vesting:dropstab": "failed-run",
            },
          },
        ])
      ),
      updateOne: jest
        .fn()
        .mockReturnValue({ exec: jest.fn().mockResolvedValue({}) }),
    };
    const parserControl = {
      getRunById: jest.fn(async (runId: string) =>
        runId === "completed-run"
          ? {
              _id: runId,
              status: "completed",
              policyReason: "test-mode",
              requestedMode: "write",
              effectiveMode: "dry-run",
            }
          : {
              _id: runId,
              status: "failed",
              error: "vesting import failed",
              requestedMode: "dry-run",
              effectiveMode: "dry-run",
            }
      ),
    };
    const service = new FomoV2UpstreamParserOrchestrationService(
      flowModel as any,
      {} as any,
      {} as any,
      parserControl as any,
      {} as any
    );

    await (service as any).reconcileAutoImports();

    const update = flowModel.updateOne.mock.calls[0][1];
    expect(update.$set.autoImportStatus).toBe("partial");
    expect(update.$set.autoImportError).toContain("vesting import failed");
    expect(update.$set.autoImportError).not.toContain("test-mode");
  });

  it("uses an explicit empty target list as a one-off auto-import override", async () => {
    const created = { _id: "created-flow" };
    const flowModel = { create: jest.fn().mockResolvedValue(created) };
    const intel = {
      listParsers: jest.fn().mockResolvedValue({ environment: "prod" }),
      startRun: jest.fn(async (_parserKey: string, request: any) => ({
        runId: "remote-run",
        parserKey: "dropstab:coin-details",
        sourceType: "dropstab",
        flowId: request.flowId,
        requested: request,
        status: "queued",
      })),
    };
    const policyModel = { findOne: jest.fn() };
    const service = new FomoV2UpstreamParserOrchestrationService(
      flowModel as any,
      intel as any,
      {
        getGlobalState: jest
          .fn()
          .mockResolvedValue({ enabled: true, mode: "prod" }),
      } as any,
      {} as any,
      {} as any,
      policyModel as any
    );
    jest
      .spyOn(service as any, "updateFlowFromRun")
      .mockResolvedValue({ status: "queued" });

    await service.startRun("admin-1", "dropstab:coin-details", {
      entityLimit: 10,
      autoImports: [],
    });

    expect(policyModel.findOne).not.toHaveBeenCalled();
    expect(flowModel.create).toHaveBeenCalledWith(
      expect.not.objectContaining({ autoImport: expect.anything() })
    );
  });

  it("attaches a saved fan-out policy only to the newest scheduled snapshot after effectiveFrom", async () => {
    const now = Date.now();
    const recentRuns = [
      {
        runId: "old-run",
        parserKey: "dropstab:coin-details",
        sourceType: "dropstab",
        flowId: "old-flow",
        trigger: "schedule",
        status: "succeeded",
        createdAt: new Date(now - 1_000).toISOString(),
        requested: { entityLimit: 20, environment: "prod" },
      },
      {
        runId: "new-run",
        parserKey: "dropstab:coin-details",
        sourceType: "dropstab",
        flowId: "new-flow",
        trigger: "schedule",
        status: "succeeded",
        createdAt: new Date(now).toISOString(),
        requested: { entityLimit: 20, environment: "prod" },
      },
    ];
    const flowModel = {
      findOneAndUpdate: jest
        .fn()
        .mockImplementation(() => queryResult({ status: "succeeded" })),
    };
    const policyModel = {
      find: jest.fn().mockReturnValue({
        lean: jest.fn().mockReturnThis(),
        exec: jest.fn().mockResolvedValue([
          {
            parserKey: "dropstab:coin-details",
            sourceType: "dropstab",
            autoImportMode: "write",
            autoImportTargets: [
              "funding:dropstab",
              "vesting:dropstab",
              "unlocks:dropstab",
            ],
            effectiveFromAt: new Date(now - 2_000),
          },
        ]),
      }),
    };
    const service = new FomoV2UpstreamParserOrchestrationService(
      flowModel as any,
      {
        listParsers: jest.fn().mockResolvedValue({
          environment: "prod",
          parsers: [],
          recentRuns,
        }),
      } as any,
      {
        getGlobalState: jest
          .fn()
          .mockResolvedValue({ enabled: true, mode: "prod" }),
      } as any,
      {} as any,
      {} as any,
      policyModel as any
    );

    await (service as any).discoverRemoteRuns();

    const oldCall = flowModel.findOneAndUpdate.mock.calls.find(
      (call: any[]) => call[1].$set.externalRunId === "old-run"
    );
    const newCall = flowModel.findOneAndUpdate.mock.calls.find(
      (call: any[]) => call[1].$set.externalRunId === "new-run"
    );
    expect(oldCall[1].$setOnInsert.autoImport).toBeUndefined();
    expect(newCall[1].$setOnInsert.autoImport.targets).toHaveLength(3);
    expect(
      newCall[1].$setOnInsert.autoImport.targets.every(
        (target: any) => target.mode === "write"
      )
    ).toBe(true);
  });

  it("rejects a changed run identity before rebinding an existing flow", async () => {
    const flowModel = {
      findById: jest.fn().mockReturnValue(
        queryResult({
          _id: "mongo-flow",
          flowId: "flow-1",
          externalRunId: "expected-run",
          parserKey: "dropstab:coin-details",
          sourceType: "dropstab",
        })
      ),
      findByIdAndUpdate: jest.fn(),
    };
    const service = new FomoV2UpstreamParserOrchestrationService(
      flowModel as any,
      {} as any,
      {} as any,
      {} as any,
      {} as any
    );

    await expect(
      (service as any).updateFlowFromRun("mongo-flow", {
        runId: "attacker-run",
        flowId: "flow-1",
        parserKey: "dropstab:coin-details",
        sourceType: "dropstab",
        status: "running",
      })
    ).rejects.toThrow("run identity mismatch");
    expect(flowModel.findByIdAndUpdate).not.toHaveBeenCalled();
  });

  it("does not resume an upstream run while the global kill switch is off", async () => {
    const intel = { controlRun: jest.fn(), listParsers: jest.fn() };
    const service = new FomoV2UpstreamParserOrchestrationService(
      {} as any,
      intel as any,
      {
        getGlobalState: jest
          .fn()
          .mockResolvedValue({ enabled: false, mode: "prod" }),
      } as any,
      {} as any,
      {} as any
    );
    jest.spyOn(service as any, "requireFlowWithDiscovery").mockResolvedValue({
      _id: "mongo-flow",
      parserKey: "dropstab:coin-details",
      sourceType: "dropstab",
      externalRunId: "remote-run",
    });

    await expect(service.controlRun("remote-run", "resume")).rejects.toThrow(
      "Global parser control is OFF"
    );
    expect(intel.controlRun).not.toHaveBeenCalled();
    expect(intel.listParsers).not.toHaveBeenCalled();
  });

  it("rejects a snapshot response whose exact id differs from the requested id", async () => {
    const service = new FomoV2UpstreamParserOrchestrationService(
      {} as any,
      {
        getSnapshot: jest.fn().mockResolvedValue({
          snapshotId: "other-snapshot",
          runId: "remote-run",
          parserKey: "dropstab:coin-details",
          sourceType: "dropstab",
          environment: "prod",
          status: "complete",
          counts: { succeeded: 1 },
        }),
      } as any,
      {} as any,
      {} as any,
      {} as any
    );

    await expect(
      service.importSnapshot("admin-1", "requested-snapshot", {
        pipelineKey: "funding:dropstab",
        mode: "dry-run",
      })
    ).rejects.toThrow("snapshot identity mismatch");
  });
});
