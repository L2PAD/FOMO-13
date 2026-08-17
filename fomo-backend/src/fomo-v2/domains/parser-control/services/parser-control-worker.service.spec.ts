import { FomoV2ParserControlWorkerService } from "./parser-control-worker.service";

describe("FomoV2ParserControlWorkerService", () => {
  it("does not enqueue schedules during a manual tick when CRON is disabled", async () => {
    const previousCronEnabled = process.env.CRON_ENABLED;
    process.env.CRON_ENABLED = "false";
    const control = {
      queueDueRuns: jest.fn(),
      recoverExpiredSnapshotRuns: jest.fn().mockResolvedValue(0),
      claimNextRun: jest.fn().mockResolvedValue(null),
    };
    const worker = new FomoV2ParserControlWorkerService(
      control as any,
      {} as any,
      {} as any
    );

    try {
      await worker.tick();
    } finally {
      if (previousCronEnabled === undefined) delete process.env.CRON_ENABLED;
      else process.env.CRON_ENABLED = previousCronEnabled;
    }

    expect(control.queueDueRuns).not.toHaveBeenCalled();
    expect(control.recoverExpiredSnapshotRuns).toHaveBeenCalledTimes(1);
    expect(control.claimNextRun).toHaveBeenCalledTimes(1);
  });

  it("executes a requested write as dry-run when TEST policy downgrades it", async () => {
    const control = {
      heartbeat: jest.fn().mockResolvedValue(undefined),
      reportExecutionProgress: jest.fn().mockResolvedValue(undefined),
      applyExecutionPolicy: jest.fn().mockResolvedValue({
        canRun: true,
        effectiveMode: "dry-run",
        writesDomainData: false,
        blockedReason: "test-mode",
      }),
      finishRun: jest.fn().mockResolvedValue(undefined),
    };
    const registry = {
      execute: jest.fn().mockResolvedValue({
        summary: { scanned: 3 },
        partial: false,
      }),
    };
    const policy = { assertDomainWriteAllowed: jest.fn() };
    const worker = new FomoV2ParserControlWorkerService(
      control as any,
      registry as any,
      policy as any
    );
    const run = {
      _id: "run-id",
      parserKey: "funding:dropstab",
      requestedMode: "write",
      effectiveMode: "write",
      limit: 20,
    };

    await worker.executeClaimedRun(run);

    expect(registry.execute).toHaveBeenCalledWith(
      expect.objectContaining({ parserKey: "funding:dropstab" }),
      expect.objectContaining({
        write: false,
        limit: 20,
        assertExecutionActive: expect.any(Function),
        onMaterializationProgress: expect.any(Function),
      })
    );
    expect(policy.assertDomainWriteAllowed).not.toHaveBeenCalled();
    expect(control.reportExecutionProgress).toHaveBeenNthCalledWith(
      1,
      "run-id",
      expect.any(String),
      { phase: "import" },
      false
    );
    expect(control.reportExecutionProgress).toHaveBeenNthCalledWith(
      2,
      "run-id",
      expect.any(String),
      { phase: "finalizing" },
      false
    );
    expect(control.finishRun).toHaveBeenCalledWith(
      run,
      expect.objectContaining({
        status: "completed",
        summary: expect.objectContaining({
          effectiveMode: "dry-run",
          writesDomainData: false,
        }),
      })
    );
  });

  it("holds the global write fence through import and materialization", async () => {
    const control = {
      heartbeat: jest.fn().mockResolvedValue(undefined),
      reportExecutionProgress: jest.fn().mockResolvedValue(undefined),
      applyExecutionPolicy: jest.fn().mockResolvedValue({
        canRun: true,
        effectiveMode: "write",
        writesDomainData: true,
      }),
      acquireGlobalWriteLease: jest.fn().mockResolvedValue("acquired"),
      releaseGlobalWriteLease: jest.fn().mockResolvedValue(undefined),
      finishRun: jest.fn().mockResolvedValue(undefined),
    };
    const registry = {
      execute: jest.fn().mockImplementation(async (_definition, options) => {
        await options.assertExecutionActive();
        await options.onMaterializationProgress({ step: "funding-feed" });
        return { summary: {}, partial: false };
      }),
    };
    const policy = {
      assertDomainWriteAllowed: jest.fn().mockResolvedValue(undefined),
    };
    const worker = new FomoV2ParserControlWorkerService(
      control as any,
      registry as any,
      policy as any
    );
    const run = {
      _id: "64ca00000000000000000001",
      parserKey: "funding:dropstab",
      requestedMode: "write",
      effectiveMode: "write",
      limit: 20,
    };

    await expect(worker.executeClaimedRun(run)).resolves.toBe("finished");

    expect(control.acquireGlobalWriteLease).toHaveBeenCalledWith(
      run._id,
      run.parserKey,
      expect.any(String)
    );
    expect(registry.execute).toHaveBeenCalledWith(
      expect.any(Object),
      expect.objectContaining({ write: true })
    );
    expect(control.heartbeat).toHaveBeenCalledWith(
      run._id,
      expect.any(String),
      true
    );
    expect(control.releaseGlobalWriteLease).toHaveBeenCalledWith(
      run._id,
      expect.any(String)
    );
  });

  it("defers a write run while another global write lease is active", async () => {
    const control = {
      heartbeat: jest.fn().mockResolvedValue(undefined),
      applyExecutionPolicy: jest.fn().mockResolvedValue({
        canRun: true,
        effectiveMode: "write",
        writesDomainData: true,
      }),
      acquireGlobalWriteLease: jest.fn().mockResolvedValue("busy"),
      deferClaimedRunForGlobalWriteLease: jest.fn().mockResolvedValue(undefined),
    };
    const registry = { execute: jest.fn() };
    const worker = new FomoV2ParserControlWorkerService(
      control as any,
      registry as any,
      {} as any
    );
    const run = {
      _id: "64ca00000000000000000002",
      parserKey: "funding:dropstab",
      requestedMode: "write",
      effectiveMode: "write",
    };

    await expect(worker.executeClaimedRun(run)).resolves.toBe("deferred");

    expect(control.deferClaimedRunForGlobalWriteLease).toHaveBeenCalledWith(run);
    expect(registry.execute).not.toHaveBeenCalled();
  });
});
