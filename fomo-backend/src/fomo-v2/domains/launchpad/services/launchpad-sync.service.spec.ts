import { ConfigService } from "@nestjs/config";
import { FomoV2LaunchpadDeploymentService } from "./launchpad-deployment.service";
import { FomoV2LaunchpadSyncService } from "./launchpad-sync.service";

function createService(models: Record<string, any> = {}) {
  return new FomoV2LaunchpadSyncService(
    models.poolModel || ({} as any),
    models.participantModel || ({} as any),
    models.chainEventModel || ({} as any),
    models.syncStateModel || ({} as any),
    models.chainService || ({} as any),
    new FomoV2LaunchpadDeploymentService(new ConfigService({}))
  );
}

describe("FomoV2LaunchpadSyncService", () => {
  it("aggregates event amounts with bigint precision and trusts ReceiptUpdated position", async () => {
    const pool = {
      _id: "507f1f77bcf86cd799439020",
      chainId: 97,
      launchpadAddress: "0x0608b52aac58e7313481d0809e8b4525bdd11d33",
      poolId: "1",
      createParams: {
        investToken: "0x4eef2a62e8a63b713c96cbadac4c6622d1eab948",
      },
      onchainState: {},
    };
    const events = [
      {
        blockNumber: "119507961",
        logIndex: "1",
        eventName: "Invested",
        values: {
          grossAmount: "900719925474099312345",
          netAmount: "900719925474099300000",
          feeAmount: "12345",
        },
      },
      {
        blockNumber: "119507962",
        logIndex: "2",
        eventName: "Invested",
        values: { grossAmount: "10", netAmount: "9", feeAmount: "1" },
      },
      {
        blockNumber: "119507962",
        logIndex: "3",
        eventName: "ReceiptUpdated",
        values: {
          receiptTokenId: "77",
          newAmount: "900719925474099312355",
        },
      },
    ];
    const participantModel = { updateOne: jest.fn().mockResolvedValue({}) };
    const service = createService({
      poolModel: {
        findById: jest.fn().mockReturnValue({ lean: jest.fn().mockResolvedValue(pool) }),
      },
      participantModel,
      chainEventModel: {
        find: jest.fn().mockReturnValue({ lean: jest.fn().mockResolvedValue(events) }),
      },
    });

    await (service as any).rebuildParticipant(pool._id, "0xd22d8d0368d80a4627d554cb9b70e31bf7ec828a");

    expect(participantModel.updateOne).toHaveBeenCalledWith(
      expect.any(Object),
      expect.objectContaining({
        $set: expect.objectContaining({
          grossAmount: "900719925474099312355",
          netAmount: "900719925474099300009",
          feeAmount: "12346",
          investedAmount: "900719925474099312355",
          receiptTokenIds: ["77"],
        }),
      }),
      { upsert: true }
    );
  });

  it("relinks a duplicate immutable log and replays its aggregate", async () => {
    const pool = {
      _id: "507f1f77bcf86cd799439020",
      chainId: 97,
      launchpadAddress: "0x0608b52aac58e7313481d0809e8b4525bdd11d33",
      poolId: "1",
      onchainState: {},
    };
    const duplicate: any = new Error("duplicate");
    duplicate.code = 11000;
    const chainEventModel = {
      create: jest.fn().mockRejectedValue(duplicate),
      findOne: jest.fn().mockResolvedValue({ _id: "507f1f77bcf86cd799439040" }),
      updateOne: jest.fn().mockResolvedValue({}),
    };
    const poolModel = {
      findOne: jest.fn().mockResolvedValue(pool),
      findById: jest.fn().mockResolvedValue(pool),
    };
    const service = createService({ poolModel, chainEventModel });
    jest.spyOn(service as any, "rebuildParticipant").mockResolvedValue(undefined);
    jest.spyOn(service as any, "refreshPool").mockResolvedValue({});

    await service.applyEvents([
      {
        eventName: "Invested",
        transactionHash: `0x${"ab".repeat(32)}`,
        logIndex: "1",
        blockNumber: "119507961",
        blockHash: `0x${"cd".repeat(32)}`,
        values: {
          poolId: "1",
          user: "0xd22d8d0368d80a4627d554cb9b70e31bf7ec828a",
          grossAmount: "100",
          netAmount: "95",
          feeAmount: "5",
        },
      },
    ]);

    expect(chainEventModel.updateOne).toHaveBeenCalledWith(
      { _id: "507f1f77bcf86cd799439040" },
      {
        $set: expect.objectContaining({
          launchpadPoolId: pool._id,
          onchainPoolId: "1",
          walletAddress: "0xd22d8d0368d80a4627d554cb9b70e31bf7ec828a",
        }),
      }
    );
    expect((service as any).rebuildParticipant).toHaveBeenCalled();
  });

  it("does not persist or refresh a pending user transaction", async () => {
    const verification = {
      status: "pending",
      transactionHash: `0x${"ab".repeat(32)}`,
      action: "invest",
      confirmations: 1,
      requiredConfirmations: 2,
      reason: "Waiting for required block confirmations.",
      events: [
        {
          eventName: "Invested",
          transactionHash: `0x${"ab".repeat(32)}`,
          logIndex: "1",
          blockNumber: "119507961",
          blockHash: `0x${"cd".repeat(32)}`,
          values: { poolId: "7" },
        },
      ],
    };
    const poolModel = { findById: jest.fn() };
    const service = createService({
      poolModel,
      chainService: {
        verifyUserTransaction: jest.fn().mockResolvedValue(verification),
      },
    });
    const applyEvents = jest.spyOn(service, "applyEvents");
    const refreshParticipant = jest.spyOn(
      service as any,
      "refreshParticipantFromChain"
    );

    const result = await service.verifyAndApplyUserTransaction({
      pool: {
        _id: "507f1f77bcf86cd799439020",
        poolId: "7",
      },
      txHash: verification.transactionHash,
      action: "invest",
      wallet: "0xd22d8d0368d80a4627d554cb9b70e31bf7ec828a",
    });

    expect(result).toMatchObject({ status: "pending", eventIds: [] });
    expect(applyEvents).not.toHaveBeenCalled();
    expect(poolModel.findById).not.toHaveBeenCalled();
    expect(refreshParticipant).not.toHaveBeenCalled();
  });

  it("relinks historical unbound logs and rebuilds pool and participant aggregates", async () => {
    const wallet = "0xd22d8d0368d80a4627d554cb9b70e31bf7ec828a";
    const pool: any = {
      _id: "507f1f77bcf86cd799439020",
      chainId: 97,
      launchpadAddress: "0x0608b52aac58e7313481d0809e8b4525bdd11d33",
      poolId: "7",
      status: "active",
      onchainState: {},
      save: jest.fn().mockResolvedValue(undefined),
    };
    const events = [
      {
        blockNumber: "119507961",
        logIndex: "2",
        eventName: "Invested",
        walletAddress: wallet,
        values: { grossAmount: "100", netAmount: "95", feeAmount: "5" },
      },
      {
        blockNumber: "119507962",
        logIndex: "1",
        eventName: "PoolFeeUpdated",
        values: { newFeePercent: "7" },
      },
    ];
    const chainEventModel = {
      updateMany: jest.fn().mockResolvedValue({ modifiedCount: 2 }),
      find: jest.fn().mockReturnValue({
        lean: jest.fn().mockResolvedValue(events),
      }),
    };
    const participantModel = {
      countDocuments: jest
        .fn()
        .mockResolvedValueOnce(1)
        .mockResolvedValueOnce(0),
    };
    const poolModel = { findById: jest.fn().mockResolvedValue(pool) };
    const service = createService({
      poolModel,
      participantModel,
      chainEventModel,
    });
    jest
      .spyOn(service as any, "rebuildParticipant")
      .mockResolvedValue(undefined);
    jest.spyOn(service as any, "refreshPool").mockResolvedValue({});

    const result = await service.relinkAndReplayPoolEvents(pool._id, 119507900);

    expect(chainEventModel.updateMany).toHaveBeenCalledWith(
      expect.objectContaining({
        onchainPoolId: "7",
        $or: expect.any(Array),
      }),
      { $set: { launchpadPoolId: pool._id } }
    );
    expect((service as any).rebuildParticipant).toHaveBeenCalledWith(
      pool._id,
      wallet
    );
    expect(pool.onchainState).toMatchObject({
      feePercent: "7",
      participantCount: 1,
      claimedParticipantCount: 0,
    });
    expect((service as any).refreshPool).toHaveBeenCalledWith(
      pool,
      119507962
    );
    expect(result).toEqual({ linkedEvents: 2, rebuiltParticipants: 1 });
  });

  it("renews only its own lease with the configured expiry window", async () => {
    const updateOne = jest.fn().mockResolvedValue({ matchedCount: 1 });
    const service = createService({ syncStateModel: { updateOne } });
    const nowSpy = jest
      .spyOn(Date, "now")
      .mockReturnValue(1_700_000_000_000);

    await (service as any).renewLease("sync-state-1", 600_000);

    expect(updateOne).toHaveBeenCalledWith(
      {
        _id: "sync-state-1",
        leaseOwner: expect.any(String),
      },
      {
        $set: { leaseUntil: new Date(1_700_000_600_000) },
      }
    );
    nowSpy.mockRestore();
  });

  it("does not advance the checkpoint after ownership of the lease is lost", async () => {
    const updateOne = jest.fn().mockResolvedValue({ matchedCount: 0 });
    const service = createService({ syncStateModel: { updateOne } });

    await expect(
      (service as any).releaseLease("sync-state-1", {
        nextBlock: "119510000",
        finalizedBlock: "119509999",
      })
    ).rejects.toThrow("lease was lost");

    expect(updateOne).toHaveBeenCalledWith(
      {
        _id: "sync-state-1",
        leaseOwner: expect.any(String),
      },
      expect.objectContaining({
        $set: expect.objectContaining({
          nextBlock: "119510000",
          finalizedBlock: "119509999",
        }),
      })
    );
  });

  it("counts only contributed wallets and records claimed settlement progress", async () => {
    const countDocuments = jest
      .fn()
      .mockResolvedValueOnce(3)
      .mockResolvedValueOnce(2);
    const readPoolInfo = jest.fn().mockResolvedValue({
      exists: true,
      closed: true,
      claimEnabled: true,
      raisedAmount: "500",
      projectToken: "0x1111111111111111111111111111111111111111",
    });
    const readTokenMetadata = jest.fn().mockResolvedValue({
      address: "0x1111111111111111111111111111111111111111",
      symbol: "PT",
      decimals: 8,
    });
    const pool = {
      _id: "507f1f77bcf86cd799439020",
      poolId: "7",
      status: "active",
      onchainState: {},
      save: jest.fn().mockResolvedValue(undefined),
    };
    const service = createService({
      participantModel: { countDocuments },
      chainService: {
        getHeadBlockNumber: jest.fn().mockResolvedValue(120),
        readPoolInfo,
        readTokenMetadata,
      },
    });

    const state = await (service as any).refreshPool(pool);

    expect(readPoolInfo).toHaveBeenCalledWith("7", 119);
    expect(countDocuments).toHaveBeenNthCalledWith(
      1,
      expect.objectContaining({
        launchpadPoolId: pool._id,
        $or: expect.any(Array),
      })
    );
    expect(countDocuments).toHaveBeenNthCalledWith(
      2,
      expect.objectContaining({
        launchpadPoolId: pool._id,
        claimed: true,
      })
    );
    expect(state).toMatchObject({
      participantCount: 3,
      claimedParticipantCount: 2,
      lastSyncedBlock: "119",
      projectTokenMetadata: {
        symbol: "PT",
        decimals: 8,
      },
    });
    expect(pool.status).toBe("closed");
  });

  it("periodically retries finalized snapshots for stale verified pools", async () => {
    const pool = { _id: "507f1f77bcf86cd799439020", poolId: "7" };
    const limit = jest.fn().mockResolvedValue([pool]);
    const sort = jest.fn().mockReturnValue({ limit });
    const find = jest.fn().mockReturnValue({ sort });
    const service = createService({ poolModel: { find } });
    jest
      .spyOn(service as any, "refreshPool")
      .mockResolvedValue({ lastSyncedBlock: "119507999" });
    const heartbeat = jest.fn().mockResolvedValue(undefined);

    await (service as any).refreshStalePools(119507999, heartbeat);

    expect(find).toHaveBeenCalledWith(
      expect.objectContaining({
        chainId: 97,
        status: { $in: ["active", "closed"] },
        $or: expect.any(Array),
      })
    );
    expect((service as any).refreshPool).toHaveBeenCalledWith(
      pool,
      119507999
    );
    expect(heartbeat).toHaveBeenCalled();
  });

  it("rewinds a mismatched finalized checkpoint and rebuilds affected participants", async () => {
    const wallet = "0xd22d8d0368d80a4627d554cb9b70e31bf7ec828a";
    const pool = {
      _id: "507f1f77bcf86cd799439020",
      poolId: "7",
    };
    const affected = [
      {
        launchpadPoolId: pool._id,
        walletAddress: wallet,
      },
    ];
    const chainEventModel = {
      find: jest.fn().mockReturnValue({
        select: jest.fn().mockReturnValue({
          lean: jest.fn().mockResolvedValue(affected),
        }),
      }),
      deleteMany: jest.fn().mockResolvedValue({ deletedCount: 1 }),
    };
    const syncStateModel = {
      updateOne: jest.fn().mockResolvedValue({ matchedCount: 1 }),
    };
    const chainService = {
      getBlockHash: jest.fn().mockResolvedValue(`0x${"22".repeat(32)}`),
    };
    const service = createService({
      poolModel: { findById: jest.fn().mockResolvedValue(pool) },
      chainEventModel,
      syncStateModel,
      chainService,
    });
    jest
      .spyOn(service as any, "rebuildParticipant")
      .mockResolvedValue(undefined);
    jest.spyOn(service as any, "refreshPool").mockResolvedValue({});
    const heartbeat = jest.fn().mockResolvedValue(undefined);
    const state: any = {
      _id: "sync-state-1",
      chainId: 97,
      launchpadAddress: "0x0608b52aac58e7313481d0809e8b4525bdd11d33",
      nextBlock: "121",
      finalizedBlock: "120",
      finalizedBlockHash: `0x${"11".repeat(32)}`,
    };
    const previousDepth = process.env.FOMO_V2_LAUNCHPAD_INDEXER_REORG_DEPTH;
    process.env.FOMO_V2_LAUNCHPAD_INDEXER_REORG_DEPTH = "20";

    try {
      const result = await (service as any).rewindIfReorged(
        state,
        100,
        heartbeat
      );

      expect(chainEventModel.deleteMany).toHaveBeenCalledWith(
        expect.objectContaining({ blockNumberValue: { $gte: 100 } })
      );
      expect((service as any).rebuildParticipant).toHaveBeenCalledWith(
        pool._id,
        wallet
      );
      expect((service as any).refreshPool).toHaveBeenCalledWith(pool, 120);
      expect(syncStateModel.updateOne).toHaveBeenCalledWith(
        { _id: state._id, leaseOwner: expect.any(String) },
        {
          $set: { nextBlock: "100" },
          $unset: { finalizedBlock: 1, finalizedBlockHash: 1 },
        }
      );
      expect(result).toMatchObject({ nextBlock: "100" });
      expect(result.finalizedBlock).toBeUndefined();
      expect(result.finalizedBlockHash).toBeUndefined();
    } finally {
      if (previousDepth === undefined) {
        delete process.env.FOMO_V2_LAUNCHPAD_INDEXER_REORG_DEPTH;
      } else {
        process.env.FOMO_V2_LAUNCHPAD_INDEXER_REORG_DEPTH = previousDepth;
      }
    }
  });

  it("repairs a stale canonical-range pool at the scanned finalized block", async () => {
    const wallet = "0xd22d8d0368d80a4627d554cb9b70e31bf7ec828a";
    const pool = {
      _id: "507f1f77bcf86cd799439020",
      poolId: "7",
    };
    const staleEvent = {
      _id: "507f1f77bcf86cd799439040",
      launchpadPoolId: pool._id,
      transactionHash: `0x${"ab".repeat(32)}`,
      logIndex: "1",
      blockHash: `0x${"cd".repeat(32)}`,
      walletAddress: wallet,
    };
    const chainEventModel = {
      find: jest.fn().mockReturnValue({
        lean: jest.fn().mockResolvedValue([staleEvent]),
      }),
      deleteMany: jest.fn().mockResolvedValue({ deletedCount: 1 }),
    };
    const service = createService({
      chainEventModel,
      poolModel: { findById: jest.fn().mockResolvedValue(pool) },
    });
    jest.spyOn(service as any, "refreshPool").mockResolvedValue({});
    jest
      .spyOn(service as any, "rebuildParticipant")
      .mockResolvedValue(undefined);

    await (service as any).reconcileCanonicalRange(100, 110, []);

    expect(chainEventModel.deleteMany).toHaveBeenCalledWith({
      _id: { $in: [staleEvent._id] },
    });
    expect((service as any).rebuildParticipant).toHaveBeenCalledWith(
      pool._id,
      wallet
    );
    expect((service as any).refreshPool).toHaveBeenCalledWith(pool, 110);
  });
});
