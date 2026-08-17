import { ConfigService } from "@nestjs/config";
import { Interface } from "ethers";
import mongoose from "mongoose";
import {
  FOMO_V2_LAUNCHPAD_ABI,
  FomoV2LaunchpadChainService,
} from "./launchpad-chain.service";
import { FomoV2LaunchpadDeploymentService } from "./launchpad-deployment.service";

const EVENT_ABI = [
  "function createPool(address investToken,uint256 targetAmount,uint32 greenSeats,uint32 yellowSeats,uint64 stakeStart,uint64 greenStart,uint64 greenEnd,uint64 yellowSlotDuration,uint256 minInvestment,uint16 feePercent) returns (uint256 poolId)",
  "event PoolCreated(uint256 indexed poolId,address indexed investToken,uint256 targetAmount,uint32 greenSeats,uint32 yellowSeats,uint64 stakeStart,uint64 greenStart,uint64 greenEnd,uint64 yellowSlotDuration,uint256 minInvestment,uint16 feePercent)",
];

const CLOSE_ABI = [
  "function closePoolIfFinished(uint256 poolId)",
  "event PoolClosed(uint256 indexed poolId,uint256 raisedAmount)",
];

const TX_HASH = `0x${"ab".repeat(32)}`;
const REPLACEMENT_TX_HASH = `0x${"ac".repeat(32)}`;
const REPORTED_CREATE_TX_HASH =
  "0x8cbba176971c48a8f4685fec7864cef36f0264be12fc4aac154749042813d2e9";

const MongooseCreateParamsSchema = new mongoose.Schema(
  {
    investToken: { type: String, required: true },
    targetAmount: { type: String, required: true },
    greenSeats: { type: String, required: true },
    yellowSeats: { type: String, required: true },
    stakeStart: { type: String, required: true },
    greenStart: { type: String, required: true },
    greenEnd: { type: String, required: true },
    yellowSlotDuration: { type: String, required: true },
    minInvestment: { type: String, required: true },
    feePercent: { type: String, required: true },
  },
  { _id: false, strict: true }
);

const MongoosePoolFixture =
  mongoose.models.FomoV2LaunchpadChainPoolFixture ||
  mongoose.model(
    "FomoV2LaunchpadChainPoolFixture",
    new mongoose.Schema({
      createParams: { type: MongooseCreateParamsSchema, required: true },
    })
  );

function createDeployment(overrides: Record<string, string> = {}) {
  return new FomoV2LaunchpadDeploymentService(
    new ConfigService({
      FOMO_V2_LAUNCHPAD_RPC_URL: "https://rpc.invalid.example",
      ...overrides,
    })
  );
}

function createParams() {
  return {
    investToken: "0x4eef2a62e8a63b713c96cbadac4c6622d1eab948",
    targetAmount: "1000000000000000000000",
    greenSeats: "10",
    yellowSeats: "20",
    stakeStart: "2000000000",
    greenStart: "2000001000",
    greenEnd: "2000002000",
    yellowSlotDuration: "300",
    minInvestment: "1000000000000000000",
    feePercent: "5",
  };
}

function createCalldata(
  contractInterface: Interface,
  params: ReturnType<typeof createParams>
) {
  return contractInterface.encodeFunctionData("createPool", [
    params.investToken,
    params.targetAmount,
    params.greenSeats,
    params.yellowSeats,
    params.stakeStart,
    params.greenStart,
    params.greenEnd,
    params.yellowSlotDuration,
    params.minInvestment,
    params.feePercent,
  ]);
}

describe("FomoV2LaunchpadChainService", () => {
  it("filters historical staked token ids through the active-stake mapping", async () => {
    const service = new FomoV2LaunchpadChainService(createDeployment());
    const contract = {
      isTokenStakedInPool: jest
        .fn()
        .mockImplementation(async (_pool: string, _wallet: string, tokenId: string) => tokenId === "11"),
    };

    await expect(
      (service as any).filterActiveStakedTokenIds(
        contract,
        "1",
        "0xd22d8d0368d80a4627d554cb9b70e31bf7ec828a",
        ["10", "11"],
        119507999
      )
    ).resolves.toEqual(["11"]);
    expect(contract.isTokenStakedInPool).toHaveBeenCalledWith(
      "1",
      "0xd22d8d0368d80a4627d554cb9b70e31bf7ec828a",
      "10",
      { blockTag: 119507999 }
    );
  });

  it("rejects user transaction verification on the wrong RPC chain", async () => {
    const service = new FomoV2LaunchpadChainService(createDeployment());
    jest.spyOn(service as any, "provider").mockReturnValue({
      getNetwork: jest.fn().mockResolvedValue({ chainId: BigInt(56) }),
    });

    await expect(
      service.verifyUserTransaction(
        TX_HASH,
        "invest",
        "1",
        "0xd22d8d0368d80a4627d554cb9b70e31bf7ec828a"
      )
    ).resolves.toMatchObject({ status: "failed", events: [] });
  });

  it("rejects a user receipt sent to another contract", async () => {
    const deployment = createDeployment();
    const service = new FomoV2LaunchpadChainService(deployment);
    const wallet = "0xd22d8d0368d80a4627d554cb9b70e31bf7ec828a";
    const other = "0x1111111111111111111111111111111111111111";
    const iface = new Interface(FOMO_V2_LAUNCHPAD_ABI);
    jest.spyOn(service as any, "provider").mockReturnValue({
      getNetwork: jest.fn().mockResolvedValue({ chainId: BigInt(97) }),
      getTransaction: jest.fn().mockResolvedValue({
        from: wallet,
        to: other,
        data: iface.encodeFunctionData("invest", ["1", "100"]),
        value: BigInt(0),
      }),
      getTransactionReceipt: jest.fn().mockResolvedValue({
        status: 1,
        from: wallet,
        to: other,
        blockNumber: 100,
        blockHash: `0x${"11".repeat(32)}`,
        logs: [],
      }),
      getBlockNumber: jest.fn().mockResolvedValue(101),
    });

    await expect(
      service.verifyUserTransaction(TX_HASH, "invest", "1", wallet)
    ).resolves.toMatchObject({
      status: "failed",
      reason: "Transaction target is not the configured Launchpad contract.",
    });
  });

  it("rejects a successful receipt without the expected pool-and-wallet event", async () => {
    const deployment = createDeployment();
    const service = new FomoV2LaunchpadChainService(deployment);
    const wallet = "0xd22d8d0368d80a4627d554cb9b70e31bf7ec828a";
    const address = deployment.getDeployment().launchpadAddress;
    const iface = new Interface(FOMO_V2_LAUNCHPAD_ABI);
    jest.spyOn(service as any, "provider").mockReturnValue({
      getNetwork: jest.fn().mockResolvedValue({ chainId: BigInt(97) }),
      getTransaction: jest.fn().mockResolvedValue({
        from: wallet,
        to: address,
        data: iface.encodeFunctionData("invest", ["1", "100"]),
        value: BigInt(0),
      }),
      getTransactionReceipt: jest.fn().mockResolvedValue({
        status: 1,
        from: wallet,
        to: address,
        blockNumber: 100,
        blockHash: `0x${"22".repeat(32)}`,
        logs: [],
      }),
      getBlockNumber: jest.fn().mockResolvedValue(101),
    });

    await expect(
      service.verifyUserTransaction(TX_HASH, "invest", "1", wallet)
    ).resolves.toMatchObject({
      status: "failed",
      reason: expect.stringContaining("Expected Invested event"),
    });
  });

  it("confirms only the canonical PoolCreated event and returns its poolId", async () => {
    const deployment = createDeployment();
    const service = new FomoV2LaunchpadChainService(deployment);
    const eventInterface = new Interface(EVENT_ABI);
    const params = createParams();
    const encoded = eventInterface.encodeEventLog(
      eventInterface.getEvent("PoolCreated")!,
      [
        "7",
        params.investToken,
        params.targetAmount,
        params.greenSeats,
        params.yellowSeats,
        params.stakeStart,
        params.greenStart,
        params.greenEnd,
        params.yellowSlotDuration,
        params.minInvestment,
        params.feePercent,
      ]
    );
    const config = deployment.getDeployment();
    const provider = {
      getNetwork: jest.fn().mockResolvedValue({ chainId: BigInt(97) }),
      getTransactionReceipt: jest.fn().mockResolvedValue({
        status: 1,
        to: config.launchpadAddress,
        from: "0xd22d8d0368d80a4627d554cb9b70e31bf7ec828a",
        blockNumber: 100,
        blockHash: `0x${"cd".repeat(32)}`,
        logs: [
          {
            address: config.launchpadAddress,
            topics: encoded.topics,
            data: encoded.data,
            index: 4,
          },
        ],
      }),
      getTransaction: jest.fn().mockResolvedValue({
        to: config.launchpadAddress,
        from: "0xd22d8d0368d80a4627d554cb9b70e31bf7ec828a",
        nonce: 4,
        data: createCalldata(eventInterface, params),
        value: BigInt(0),
      }),
      getBlockNumber: jest.fn().mockResolvedValue(101),
    };
    jest.spyOn(service as any, "provider").mockReturnValue(provider);

    const result = await service.verifyCreateTransaction(TX_HASH, params);

    expect(result).toMatchObject({
      status: "confirmed",
      poolId: "7",
      confirmations: 2,
      logIndex: "4",
    });
  });

  it("fails verification when PoolCreated arguments differ from the draft", async () => {
    const deployment = createDeployment();
    const service = new FomoV2LaunchpadChainService(deployment);
    const eventInterface = new Interface(EVENT_ABI);
    const params = createParams();
    const encoded = eventInterface.encodeEventLog(
      eventInterface.getEvent("PoolCreated")!,
      [
        "8",
        params.investToken,
        "999",
        params.greenSeats,
        params.yellowSeats,
        params.stakeStart,
        params.greenStart,
        params.greenEnd,
        params.yellowSlotDuration,
        params.minInvestment,
        params.feePercent,
      ]
    );
    const provider = {
      getNetwork: jest.fn().mockResolvedValue({ chainId: BigInt(97) }),
      getTransactionReceipt: jest.fn().mockResolvedValue({
        status: 1,
        to: deployment.getDeployment().launchpadAddress,
        from: "0xd22d8d0368d80a4627d554cb9b70e31bf7ec828a",
        blockNumber: 100,
        blockHash: `0x${"ef".repeat(32)}`,
        logs: [
          {
            address: deployment.getDeployment().launchpadAddress,
            topics: encoded.topics,
            data: encoded.data,
            index: 1,
          },
        ],
      }),
      getTransaction: jest.fn().mockResolvedValue({
        to: deployment.getDeployment().launchpadAddress,
        from: "0xd22d8d0368d80a4627d554cb9b70e31bf7ec828a",
        nonce: 5,
        data: createCalldata(eventInterface, params),
        value: BigInt(0),
      }),
      getBlockNumber: jest.fn().mockResolvedValue(101),
    };
    jest.spyOn(service as any, "provider").mockReturnValue(provider);

    const result = await service.verifyCreateTransaction(TX_HASH, params);

    expect(result).toMatchObject({
      status: "failed",
      failureKind: "integrity",
      safeToRetry: false,
    });
    expect(result.reason).toContain("targetAmount=999");
  });

  it("verifies the reported mined create using a hydrated Mongoose subdocument and ignores internal or extra keys", async () => {
    const deployment = createDeployment();
    const service = new FomoV2LaunchpadChainService(deployment);
    const eventInterface = new Interface(EVENT_ABI);
    const params = {
      investToken: "0x4eef2a62e8a63b713c96cbadac4c6622d1eab948",
      targetAmount: "1000000000000000000000",
      greenSeats: "3",
      yellowSeats: "5",
      stakeStart: "1784223660",
      greenStart: "1784226900",
      greenEnd: "1784228400",
      yellowSlotDuration: "900",
      minInvestment: "10000000000000000000",
      feePercent: "5",
    };
    const fixture = new MongoosePoolFixture({ createParams: params });
    const hydratedParams = fixture.createParams as any;
    Object.defineProperty(hydratedParams, "unexpectedVerifierKey", {
      configurable: true,
      enumerable: true,
      value: "must be ignored",
    });
    expect(Object.keys(hydratedParams)).toEqual(
      expect.arrayContaining([
        "$__parent",
        "$__",
        "_doc",
        "unexpectedVerifierKey",
      ])
    );

    const encoded = eventInterface.encodeEventLog(
      eventInterface.getEvent("PoolCreated")!,
      [
        "1",
        params.investToken,
        params.targetAmount,
        params.greenSeats,
        params.yellowSeats,
        params.stakeStart,
        params.greenStart,
        params.greenEnd,
        params.yellowSlotDuration,
        params.minInvestment,
        params.feePercent,
      ]
    );
    const provider = {
      getNetwork: jest.fn().mockResolvedValue({ chainId: BigInt(97) }),
      getTransactionReceipt: jest.fn().mockResolvedValue({
        status: 1,
        to: deployment.getDeployment().launchpadAddress,
        from: "0xd128f1e3b2938eb005bc5c750a66b82173f62857",
        blockNumber: 119507960,
        blockHash: `0x${"91".repeat(32)}`,
        logs: [
          {
            address: deployment.getDeployment().launchpadAddress,
            topics: encoded.topics,
            data: encoded.data,
            index: 0,
          },
        ],
      }),
      getTransaction: jest.fn().mockResolvedValue({
        to: deployment.getDeployment().launchpadAddress,
        from: "0xd128f1e3b2938eb005bc5c750a66b82173f62857",
        nonce: 1,
        data: createCalldata(eventInterface, params),
        value: BigInt(0),
      }),
      getBlockNumber: jest.fn().mockResolvedValue(119507960),
    };
    jest.spyOn(service as any, "provider").mockReturnValue(provider);

    await expect(
      service.verifyCreateTransaction(
        REPORTED_CREATE_TX_HASH,
        hydratedParams
      )
    ).resolves.toMatchObject({
      status: "confirmed",
      poolId: "1",
      blockNumber: "119507960",
      confirmations: 1,
      safeToRetry: false,
    });
  });

  it("marks only a reverted receipt as safe to retry", async () => {
    const deployment = createDeployment();
    const service = new FomoV2LaunchpadChainService(deployment);
    const eventInterface = new Interface(EVENT_ABI);
    const params = createParams();
    const provider = {
      getNetwork: jest.fn().mockResolvedValue({ chainId: BigInt(97) }),
      getTransactionReceipt: jest.fn().mockResolvedValue({
        status: 0,
        to: deployment.getDeployment().launchpadAddress,
        from: "0xd22d8d0368d80a4627d554cb9b70e31bf7ec828a",
        blockNumber: 100,
        blockHash: `0x${"92".repeat(32)}`,
        logs: [],
      }),
      getTransaction: jest.fn().mockResolvedValue({
        to: deployment.getDeployment().launchpadAddress,
        from: "0xd22d8d0368d80a4627d554cb9b70e31bf7ec828a",
        nonce: 6,
        data: createCalldata(eventInterface, params),
        value: BigInt(0),
      }),
      getBlockNumber: jest.fn().mockResolvedValue(101),
    };
    jest.spyOn(service as any, "provider").mockReturnValue(provider);

    await expect(
      service.verifyCreateTransaction(TX_HASH, params)
    ).resolves.toMatchObject({
      status: "failed",
      failureKind: "reverted",
      safeToRetry: true,
      reason: "Create-pool transaction reverted.",
    });
  });

  it("stays pending when RPC is not configured", async () => {
    const deployment = new FomoV2LaunchpadDeploymentService(
      new ConfigService({})
    );
    const service = new FomoV2LaunchpadChainService(deployment);

    await expect(
      service.verifyCreateTransaction(TX_HASH, createParams())
    ).resolves.toMatchObject({
      status: "pending",
      confirmations: 0,
      safeToRetry: false,
    });
  });

  it("validates a mined replacement from persisted sender and nonce evidence", async () => {
    const deployment = createDeployment();
    const service = new FomoV2LaunchpadChainService(deployment);
    const eventInterface = new Interface(EVENT_ABI);
    const params = createParams();
    const encoded = eventInterface.encodeEventLog(
      eventInterface.getEvent("PoolCreated")!,
      [
        "9",
        params.investToken,
        params.targetAmount,
        params.greenSeats,
        params.yellowSeats,
        params.stakeStart,
        params.greenStart,
        params.greenEnd,
        params.yellowSlotDuration,
        params.minInvestment,
        params.feePercent,
      ]
    );
    const sender = "0xd22d8d0368d80a4627d554cb9b70e31bf7ec828a";
    const provider = {
      getNetwork: jest.fn().mockResolvedValue({ chainId: BigInt(97) }),
      getTransactionReceipt: jest.fn().mockResolvedValue({
        status: 1,
        to: deployment.getDeployment().launchpadAddress,
        from: sender,
        blockNumber: 100,
        blockHash: `0x${"56".repeat(32)}`,
        logs: [
          {
            address: deployment.getDeployment().launchpadAddress,
            topics: encoded.topics,
            data: encoded.data,
            index: 3,
          },
        ],
      }),
      getTransaction: jest.fn().mockResolvedValue({
        to: deployment.getDeployment().launchpadAddress,
        from: sender,
        nonce: 11,
        data: createCalldata(eventInterface, params),
        value: BigInt(0),
      }),
      getBlockNumber: jest.fn().mockResolvedValue(101),
    };
    jest.spyOn(service as any, "provider").mockReturnValue(provider);

    const result = await service.verifyCreateTransaction(
      REPLACEMENT_TX_HASH,
      params,
      {
        transactionHash: TX_HASH,
        from: sender,
        nonce: "11",
        to: deployment.getDeployment().launchpadAddress,
        calldataValidated: true,
      }
    );

    expect(result).toMatchObject({
      status: "confirmed",
      poolId: "9",
      replacesTransactionHash: TX_HASH,
      replacementValidated: true,
    });
    expect(provider.getTransaction).toHaveBeenCalledTimes(1);
  });

  it("confirms a finalized wallet cancellation only for the original sender and nonce", async () => {
    const deployment = createDeployment({
      FOMO_V2_LAUNCHPAD_CONFIRMATIONS: "2",
    });
    const service = new FomoV2LaunchpadChainService(deployment);
    const sender = "0xd22d8d0368d80a4627d554cb9b70e31bf7ec828a";
    jest.spyOn(service as any, "provider").mockReturnValue({
      getNetwork: jest.fn().mockResolvedValue({ chainId: BigInt(97) }),
      getTransaction: jest.fn().mockResolvedValue({
        from: sender,
        to: sender,
        nonce: 11,
        data: "0x",
        value: BigInt(0),
      }),
      getTransactionReceipt: jest.fn().mockResolvedValue({
        status: 1,
        from: sender,
        to: sender,
        blockNumber: 100,
        blockHash: `0x${"78".repeat(32)}`,
      }),
      getBlockNumber: jest.fn().mockResolvedValue(101),
    });

    await expect(
      service.verifyCreateCancellationTransaction(REPLACEMENT_TX_HASH, {
        transactionHash: TX_HASH,
        from: sender,
        nonce: "11",
        to: deployment.getDeployment().launchpadAddress,
        calldataValidated: true,
      })
    ).resolves.toMatchObject({
      status: "confirmed",
      failureKind: "cancelled",
      safeToRetry: true,
      confirmations: 2,
      replacesTransactionHash: TX_HASH,
      replacementValidated: true,
    });
  });

  it.each([
    [
      "sender",
      "0x1111111111111111111111111111111111111111",
      11,
      "sender does not match",
    ],
    [
      "nonce",
      "0xd22d8d0368d80a4627d554cb9b70e31bf7ec828a",
      12,
      "nonce does not match",
    ],
  ])(
    "rejects a cancellation replacement with a mismatched %s",
    async (_field, replacementSender, replacementNonce, reason) => {
      const deployment = createDeployment();
      const service = new FomoV2LaunchpadChainService(deployment);
      const originalSender =
        "0xd22d8d0368d80a4627d554cb9b70e31bf7ec828a";
      jest.spyOn(service as any, "provider").mockReturnValue({
        getNetwork: jest.fn().mockResolvedValue({ chainId: BigInt(97) }),
        getTransaction: jest.fn().mockResolvedValue({
          from: replacementSender,
          to: replacementSender,
          nonce: replacementNonce,
          data: "0x",
          value: BigInt(0),
        }),
        getTransactionReceipt: jest.fn().mockResolvedValue(null),
      });

      await expect(
        service.verifyCreateCancellationTransaction(REPLACEMENT_TX_HASH, {
          transactionHash: TX_HASH,
          from: originalSender,
          nonce: "11",
          to: deployment.getDeployment().launchpadAddress,
          calldataValidated: true,
        })
      ).resolves.toMatchObject({
        status: "failed",
        failureKind: "integrity",
        safeToRetry: false,
        replacementValidated: false,
        reason: expect.stringContaining(reason),
      });
    }
  );

  it("keeps a valid wallet cancellation unsafe until it is finalized", async () => {
    const deployment = createDeployment({
      FOMO_V2_LAUNCHPAD_CONFIRMATIONS: "3",
    });
    const service = new FomoV2LaunchpadChainService(deployment);
    const sender = "0xd22d8d0368d80a4627d554cb9b70e31bf7ec828a";
    jest.spyOn(service as any, "provider").mockReturnValue({
      getNetwork: jest.fn().mockResolvedValue({ chainId: BigInt(97) }),
      getTransaction: jest.fn().mockResolvedValue({
        from: sender,
        to: sender,
        nonce: 11,
        data: "0x",
        value: BigInt(0),
      }),
      getTransactionReceipt: jest.fn().mockResolvedValue({
        status: 1,
        from: sender,
        to: sender,
        blockNumber: 100,
        blockHash: `0x${"78".repeat(32)}`,
      }),
      getBlockNumber: jest.fn().mockResolvedValue(101),
    });

    await expect(
      service.verifyCreateCancellationTransaction(REPLACEMENT_TX_HASH, {
        transactionHash: TX_HASH,
        from: sender,
        nonce: "11",
        to: deployment.getDeployment().launchpadAddress,
        calldataValidated: true,
      })
    ).resolves.toMatchObject({
      status: "pending",
      confirmations: 2,
      requiredConfirmations: 3,
      safeToRetry: false,
      replacementValidated: true,
    });
  });

  it("does not accept another createPool replacement as a wallet cancellation", async () => {
    const deployment = createDeployment();
    const service = new FomoV2LaunchpadChainService(deployment);
    const sender = "0xd22d8d0368d80a4627d554cb9b70e31bf7ec828a";
    const iface = new Interface(EVENT_ABI);
    jest.spyOn(service as any, "provider").mockReturnValue({
      getNetwork: jest.fn().mockResolvedValue({ chainId: BigInt(97) }),
      getTransaction: jest.fn().mockResolvedValue({
        from: sender,
        to: deployment.getDeployment().launchpadAddress,
        nonce: 11,
        data: createCalldata(iface, createParams()),
        value: BigInt(0),
      }),
      getTransactionReceipt: jest.fn().mockResolvedValue({
        status: 1,
        from: sender,
        to: deployment.getDeployment().launchpadAddress,
        blockNumber: 100,
        blockHash: `0x${"79".repeat(32)}`,
      }),
      getBlockNumber: jest.fn().mockResolvedValue(101),
    });

    await expect(
      service.verifyCreateCancellationTransaction(REPLACEMENT_TX_HASH, {
        transactionHash: TX_HASH,
        from: sender,
        nonce: "11",
        to: deployment.getDeployment().launchpadAddress,
        calldataValidated: true,
      })
    ).resolves.toMatchObject({
      status: "failed",
      failureKind: "integrity",
      safeToRetry: false,
      replacementValidated: false,
      reason: expect.stringContaining("still calls createPool"),
    });
  });

  it("confirms close_pool only when the matching PoolClosed event exists", async () => {
    const deployment = createDeployment();
    const service = new FomoV2LaunchpadChainService(deployment);
    const closeInterface = new Interface(CLOSE_ABI);
    const event = closeInterface.encodeEventLog(
      closeInterface.getEvent("PoolClosed")!,
      ["7", "500"]
    );
    const provider = {
      getNetwork: jest.fn().mockResolvedValue({ chainId: BigInt(97) }),
      getTransactionReceipt: jest.fn().mockResolvedValue({
        status: 1,
        to: deployment.getDeployment().launchpadAddress,
        from: "0xd22d8d0368d80a4627d554cb9b70e31bf7ec828a",
        blockNumber: 100,
        blockHash: `0x${"12".repeat(32)}`,
        logs: [
          {
            address: deployment.getDeployment().launchpadAddress,
            topics: event.topics,
            data: event.data,
            index: 2,
          },
        ],
      }),
      getTransaction: jest.fn().mockResolvedValue({
        to: deployment.getDeployment().launchpadAddress,
        data: closeInterface.encodeFunctionData("closePoolIfFinished", ["7"]),
        value: BigInt(0),
      }),
      getBlockNumber: jest.fn().mockResolvedValue(101),
    };
    jest.spyOn(service as any, "provider").mockReturnValue(provider);

    await expect(
      service.verifyOperationTransaction(TX_HASH, "close_pool", "7")
    ).resolves.toMatchObject({ status: "confirmed", confirmations: 2 });

    provider.getTransactionReceipt.mockResolvedValueOnce({
      status: 1,
      to: deployment.getDeployment().launchpadAddress,
      from: "0xd22d8d0368d80a4627d554cb9b70e31bf7ec828a",
      blockNumber: 100,
      blockHash: `0x${"34".repeat(32)}`,
      logs: [],
    });
    await expect(
      service.verifyOperationTransaction(TX_HASH, "close_pool", "7")
    ).resolves.toMatchObject({ status: "failed" });
  });
});
