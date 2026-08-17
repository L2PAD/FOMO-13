import { managedParserDefinition } from "../parser-control.constants";
import { FomoV2ParserControlRegistryService } from "./parser-control-registry.service";

describe("FomoV2ParserControlRegistryService", () => {
  const createRegistry = () => {
    const activityImport = { importPending: jest.fn().mockResolvedValue({}) };
    const backerImport = { run: jest.fn().mockResolvedValue({}) };
    const fundingImport = { run: jest.fn().mockResolvedValue({}) };
    const icodropsFundingImport = { run: jest.fn().mockResolvedValue({}) };
    const intelFundingImport = { run: jest.fn().mockResolvedValue({}) };
    const icoProfileImport = { run: jest.fn().mockResolvedValue({}) };
    const marketImport = { runTier: jest.fn().mockResolvedValue({}) };
    const unlockImport = { run: jest.fn().mockResolvedValue({}) };
    const vestingImport = { run: jest.fn().mockResolvedValue({}) };
    const postWriteMaterialization = {
      run: jest.fn().mockResolvedValue({
        parserKey: "funding:dropstab",
        mode: "write",
        status: "completed",
        affectedRoutes: ["/crypto/funding-feed"],
        routes: ["/crypto/funding-feed"],
        durationMs: 1,
        scanned: 1,
        written: 1,
        steps: [],
        errors: [],
      }),
    };
    const registry = new FomoV2ParserControlRegistryService(
      activityImport as any,
      backerImport as any,
      fundingImport as any,
      icodropsFundingImport as any,
      intelFundingImport as any,
      icoProfileImport as any,
      marketImport as any,
      unlockImport as any,
      vestingImport as any,
      postWriteMaterialization as any
    );

    return {
      registry,
      activityImport,
      backerImport,
      fundingImport,
      icodropsFundingImport,
      intelFundingImport,
      icoProfileImport,
      marketImport,
      unlockImport,
      vestingImport,
      postWriteMaterialization,
    };
  };

  it("dispatches Dropstab and ICODrops funding to different adapters", async () => {
    const { registry, fundingImport, icodropsFundingImport } = createRegistry();

    await registry.execute(managedParserDefinition("funding:dropstab")!, {
      write: true,
      limit: 2_500,
      snapshotId: "snapshot-1",
      upstreamRunId: "remote-1",
    });
    await registry.execute(managedParserDefinition("funding:icodrops")!, {
      write: false,
      limit: 30,
    });

    expect(fundingImport.run).toHaveBeenCalledWith({
      sourceType: "dropstab",
      limit: 2_500,
      write: true,
      enrichOnly: false,
      snapshotId: "snapshot-1",
      upstreamRunId: "remote-1",
      upstreamParserKey: "dropstab:coin-details",
    });
    expect(icodropsFundingImport.run).toHaveBeenCalledWith({
      limit: 30,
      write: false,
    });
  });

  it("attaches post-write materialization to the run summary", async () => {
    const { registry, postWriteMaterialization } = createRegistry();
    const onProgress = jest.fn();

    const result = await registry.execute(
      managedParserDefinition("funding:dropstab")!,
      {
        write: true,
        limit: 10,
        snapshotId: "snapshot-1",
        onMaterializationProgress: onProgress,
      }
    );

    expect(postWriteMaterialization.run).toHaveBeenCalledWith({
      parserKey: "funding:dropstab",
      write: true,
      assertExecutionActive: undefined,
      onProgress,
    });
    expect(result.summary.materialization).toEqual(
      expect.objectContaining({ status: "completed" })
    );
    expect(result.partial).toBe(false);
  });

  it.each(["dropstab", "icodrops"] as const)(
    "passes the exact %s provider bucket to activity import",
    async (sourceType) => {
      const { registry, activityImport } = createRegistry();

      await registry.execute(
        managedParserDefinition(`activities:${sourceType}`)!,
        { write: false, limit: 15 }
      );

      expect(activityImport.importPending).toHaveBeenCalledWith({
        source: "parser",
        providerSourceType: sourceType,
        limit: 15,
        write: false,
        persistCheckpoint: false,
      });
    }
  );

  it.each([
    ["funding:dropstab", "fundingImport", "run"],
    ["funding:icodrops", "icodropsFundingImport", "run"],
    ["funding:intel_fundraising", "intelFundingImport", "run"],
    ["ico:icodrops", "icoProfileImport", "run"],
    ["backers:intel", "backerImport", "run"],
    ["vesting:dropstab", "vestingImport", "run"],
    ["unlocks:dropstab", "unlockImport", "run"],
    ["activities:dropstab", "activityImport", "importPending"],
    ["activities:icodrops", "activityImport", "importPending"],
    ["activities:legacy", "activityImport", "importPending"],
  ] as const)(
    "forwards the managed execution fence to %s",
    async (parserKey, adapterName, methodName) => {
      const harness = createRegistry();
      const assertExecutionActive = jest.fn().mockResolvedValue(undefined);

      await harness.registry.execute(managedParserDefinition(parserKey)!, {
        write: false,
        limit: 10,
        assertExecutionActive,
      });

      expect((harness[adapterName] as any)[methodName]).toHaveBeenCalledWith(
        expect.objectContaining({ assertExecutionActive })
      );
    }
  );

  it("fences every market tier and forwards the same callback to each tier", async () => {
    const { registry, marketImport } = createRegistry();
    const assertExecutionActive = jest.fn().mockResolvedValue(undefined);

    await registry.execute(managedParserDefinition("market:coingecko")!, {
      write: true,
      limit: 25,
      snapshotId: "snapshot-market-1",
      assertExecutionActive,
    });

    expect(marketImport.runTier).toHaveBeenCalledTimes(3);
    for (const [, tierOptions] of marketImport.runTier.mock.calls) {
      expect(tierOptions).toEqual(
        expect.objectContaining({ assertExecutionActive })
      );
    }
    expect(assertExecutionActive).toHaveBeenCalledTimes(6);
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
  ])("fails closed for managed WRITE without snapshot: %s", async (parserKey) => {
    const { registry, postWriteMaterialization } = createRegistry();

    await expect(
      registry.execute(managedParserDefinition(parserKey)!, {
        write: true,
        limit: 10,
      })
    ).rejects.toThrow(/requires an exact immutable snapshotId/i);
    expect(postWriteMaterialization.run).not.toHaveBeenCalled();
  });

  it("dispatches Dropstab investor snapshots to a source-correct backer import", async () => {
    const { registry, backerImport } = createRegistry();

    await registry.execute(managedParserDefinition("backers:dropstab")!, {
      write: true,
      limit: 12,
      snapshotId: "snapshot-investors-1",
      upstreamRunId: "upstream-investors-1",
    });

    expect(backerImport.run).toHaveBeenCalledWith({
      sourceType: "dropstab",
      limit: 12,
      write: true,
      snapshotId: "snapshot-investors-1",
      upstreamRunId: "upstream-investors-1",
      upstreamParserKey: "dropstab:investors",
    });
  });
});
