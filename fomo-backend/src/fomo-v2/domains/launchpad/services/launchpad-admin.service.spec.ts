import { BadRequestException, ConflictException } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { FomoV2LaunchpadAdminService } from "./launchpad-admin.service";
import { FomoV2LaunchpadDeploymentService } from "./launchpad-deployment.service";

const CREATE_TX_HASH = `0x${"ab".repeat(32)}`;

function createService(canonicalProjectModel: any = {}) {
  const deployment = new FomoV2LaunchpadDeploymentService(
    new ConfigService({})
  );
  return new FomoV2LaunchpadAdminService(
    {} as any,
    {} as any,
    canonicalProjectModel,
    deployment,
    {} as any
  );
}

function createDraftInput(overrides: Record<string, any> = {}) {
  const now = Math.floor(Date.now() / 1000);
  return {
    canonicalProjectId: "507f1f77bcf86cd799439011",
    chainId: 97,
    launchpadAddress: "0x0608B52aAC58E7313481d0809E8b4525BDD11d33",
    investToken: "0x4EeF2A62E8A63b713C96CBADAc4C6622D1EAB948",
    targetAmount: "1000000000000000000000",
    greenSeats: "10",
    yellowSeats: "20",
    stakeStart: String(now + 600),
    greenStart: String(now + 1200),
    greenEnd: String(now + 1800),
    yellowSlotDuration: "300",
    minInvestment: "1000000000000000000",
    feePercent: "5",
    ...overrides,
  };
}

describe("FomoV2LaunchpadAdminService", () => {
  it("validates and preserves every smart-contract uint as a decimal string", () => {
    const service = createService();

    const params = (service as any).normalizeAndValidateCreateParams(
      createDraftInput()
    );

    expect(params).toMatchObject({
      targetAmount: "1000000000000000000000",
      greenSeats: "10",
      yellowSeats: "20",
      minInvestment: "1000000000000000000",
      feePercent: "5",
    });
    expect(typeof params.targetAmount).toBe("string");
  });

  it("rejects the contract's unsafe implicit minimum investment", () => {
    const service = createService();

    expect(() =>
      (service as any).normalizeAndValidateCreateParams(
        createDraftInput({ minInvestment: "0" })
      )
    ).toThrow(BadRequestException);
  });

  it("marks a manually created canonical project explicitly for Launchpad", async () => {
    const query = {
      select: jest.fn().mockReturnThis(),
      lean: jest.fn().mockResolvedValue(null),
    };
    const canonicalProjectModel = {
      findOne: jest.fn().mockReturnValue(query),
      create: jest.fn().mockImplementation(async (value) => ({
        _id: "507f1f77bcf86cd799439012",
        ...value,
      })),
    };
    const service = createService(canonicalProjectModel);

    const project = await (service as any).createLaunchpadCanonicalProject(
      {
        name: "Launch Only Project",
        symbol: "LOP",
        logo: "https://cdn.example/logo.png",
        website: "https://launch.example",
        description: "Created from the Launchpad form.",
      },
      "admin-1"
    );

    expect(project).toMatchObject({
      createdForLaunchpad: true,
      originSourceType: "launchpad_admin",
      createdBy: "manual",
      status: "proposed",
    });
    expect(project.metadata.createdForLaunchpad).toBe(true);
  });

  it("keeps the requested admin-operation intent separate from mined calldata", () => {
    const service = createService();
    const requested = (service as any).normalizeOperationRequestedParams(
      "update_pool_fee_percent",
      { feePercent: "5" }
    );

    expect(requested).toEqual({ feePercent: "5" });
    expect(
      (service as any).operationIntentMismatch(
        "update_pool_fee_percent",
        requested,
        { poolId: "7", newFeePercent: "6" }
      )
    ).toContain("requested 5, mined 6");
  });

  it("accepts equivalent checksummed addresses in operation intent", () => {
    const service = createService();
    const requested = (service as any).normalizeOperationRequestedParams(
      "set_fee_receiver",
      { address: "0xD22D8d0368D80A4627d554cb9b70E31Bf7eC828a" }
    );

    expect(
      (service as any).operationIntentMismatch(
        "set_fee_receiver",
        requested,
        { newReceiver: "0xd22d8d0368d80a4627d554cb9b70e31bf7ec828a" }
      )
    ).toBeUndefined();
  });

  it("marks an already confirmed create as unsafe to retry", async () => {
    const pool = {
      _id: "507f1f77bcf86cd799439020",
      canonicalProjectId: "507f1f77bcf86cd799439011",
      status: "active",
      poolId: "1",
      createTransaction: {
        transactionHash: CREATE_TX_HASH,
        confirmations: 3,
      },
      toObject: jest.fn().mockReturnValue({
        _id: "507f1f77bcf86cd799439020",
        canonicalProjectId: "507f1f77bcf86cd799439011",
        status: "active",
        poolId: "1",
      }),
    };
    const poolModel = { findById: jest.fn().mockResolvedValue(pool) };
    const canonicalProjectModel = {
      findById: jest.fn().mockReturnValue({
        lean: jest.fn().mockResolvedValue(null),
      }),
    };
    const deployment = new FomoV2LaunchpadDeploymentService(
      new ConfigService({})
    );
    const service = new FomoV2LaunchpadAdminService(
      poolModel as any,
      {} as any,
      canonicalProjectModel as any,
      deployment,
      {} as any
    );

    await expect(
      service.confirmCreate(
        "507f1f77bcf86cd799439020",
        { txHash: CREATE_TX_HASH },
        undefined
      )
    ).resolves.toMatchObject({
      verification: {
        status: "confirmed",
        safeToRetry: false,
        poolId: "1",
      },
    });
  });

  it("persists integrity failure classification in the create transaction", async () => {
    const params = (createService() as any).normalizeAndValidateCreateParams(
      createDraftInput()
    );
    const pool: any = {
      _id: "507f1f77bcf86cd799439021",
      canonicalProjectId: "507f1f77bcf86cd799439011",
      chainId: 97,
      launchpadAddress: "0x0608b52aac58e7313481d0809e8b4525bdd11d33",
      createParams: params,
      createTransaction: {
        transactionHash: CREATE_TX_HASH,
        submittedAt: new Date(),
        safeToRetry: false,
      },
      status: "tx_submitted",
      revision: 0,
      save: jest.fn().mockResolvedValue(undefined),
    };
    pool.toObject = jest.fn().mockImplementation(() => ({ ...pool }));
    const operationModel = {
      updateOne: jest.fn().mockResolvedValue(undefined),
    };
    const canonicalProjectModel = {
      findById: jest.fn().mockReturnValue({
        lean: jest.fn().mockResolvedValue(null),
      }),
    };
    const chainService = {
      verifyCreateTransaction: jest.fn().mockResolvedValue({
        status: "failed",
        failureKind: "integrity",
        safeToRetry: false,
        transactionHash: CREATE_TX_HASH,
        confirmations: 1,
        requiredConfirmations: 1,
        calldataValidated: false,
        reason: "Synthetic integrity mismatch.",
      }),
    };
    const deployment = new FomoV2LaunchpadDeploymentService(
      new ConfigService({})
    );
    const service = new FomoV2LaunchpadAdminService(
      {} as any,
      operationModel as any,
      canonicalProjectModel as any,
      deployment,
      chainService as any
    );

    const result = await (service as any).applyCreateVerification(
      pool,
      undefined,
      CREATE_TX_HASH
    );

    expect(pool.createTransaction).toMatchObject({
      transactionHash: CREATE_TX_HASH,
      failureKind: "integrity",
      safeToRetry: false,
      verificationError: "Synthetic integrity mismatch.",
    });
    expect(result.verification).toMatchObject({
      failureKind: "integrity",
      safeToRetry: false,
    });
  });

  it("requires content and a matching live contract before publication", async () => {
    const params = (createService() as any).normalizeAndValidateCreateParams(
      createDraftInput()
    );
    const pool: any = {
      _id: "507f1f77bcf86cd799439030",
      canonicalProjectId: "507f1f77bcf86cd799439011",
      slug: "ready-launch",
      status: "active",
      poolId: "1",
      launchDetails: {
        title: "Ready",
        description: "Ready description",
        logoUrl: "/uploads/logo.png",
        bannerUrl: "/uploads/banner.png",
      },
      createParams: params,
    };
    const poolModel = { findById: jest.fn().mockResolvedValue(pool) };
    const canonicalProjectModel = {
      findById: jest.fn().mockReturnValue({
        lean: jest.fn().mockResolvedValue({ name: "Canonical", metadata: {} }),
      }),
    };
    const chainService = {
      validateContractInterface: jest.fn().mockResolvedValue({
        ready: true,
        codePresent: true,
        stakingNftMatches: true,
        poolExists: true,
        issues: [],
      }),
      readPoolInfo: jest.fn().mockResolvedValue({ ...params, exists: true }),
    };
    const service = new FomoV2LaunchpadAdminService(
      poolModel as any,
      {} as any,
      canonicalProjectModel as any,
      new FomoV2LaunchpadDeploymentService(new ConfigService({})),
      chainService as any
    );

    await expect(service.getPublicationReadiness(String(pool._id))).resolves.toMatchObject({
      ready: true,
      checks: { content: true, contract: true, pool: true, token: true },
    });
  });

  it("validates upload magic bytes and normalizes the stored extension", async () => {
    const storage = { writeFile: jest.fn().mockResolvedValue({
      key: "1_2_launchpad_logo.png",
      url: "/1_2_launchpad_logo.png",
      mimeType: "image/png",
      size: 8,
      driver: "local",
    }) };
    const service = new FomoV2LaunchpadAdminService(
      {} as any,
      {} as any,
      {} as any,
      new FomoV2LaunchpadDeploymentService(new ConfigService({})),
      {} as any,
      undefined,
      undefined,
      storage as any
    );

    await expect(
      service.uploadMedia({
        buffer: Buffer.from("not-an-image"),
        originalName: "bad.png",
        mimeType: "image/png",
      })
    ).rejects.toThrow(BadRequestException);

    const png = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);
    await expect(
      service.uploadMedia({ buffer: png, originalName: "logo.exe", mimeType: "image/png" })
    ).resolves.toMatchObject({
      url: "/uploads/1_2_launchpad_logo.png",
      managed: true,
    });
    expect(storage.writeFile).toHaveBeenCalledWith(
      expect.objectContaining({ originalName: "launchpad_logo.png", mimeType: "image/png" })
    );
  });

  it("persists verified ERC20 metadata after project-token deposit", async () => {
    const token = "0x1111111111111111111111111111111111111111";
    const pool: any = {
      _id: "507f1f77bcf86cd799439020",
      canonicalProjectId: "507f1f77bcf86cd799439011",
      poolId: "7",
      status: "closed",
      revision: 0,
      onchainState: {},
      save: jest.fn().mockResolvedValue(undefined),
      toObject: jest.fn().mockImplementation(() => ({ ...pool })),
    };
    const operation: any = {
      type: "deposit_project_tokens",
      transactionHash: CREATE_TX_HASH,
      requestedParams: { projectToken: token, amount: "100000000" },
      save: jest.fn().mockResolvedValue(undefined),
      toObject: jest.fn().mockImplementation(() => ({ ...operation })),
    };
    const chainService = {
      verifyOperationTransaction: jest.fn().mockResolvedValue({
        status: "confirmed",
        decodedParams: { poolId: "7", projectToken: token, amount: "100000000" },
        confirmations: 3,
      }),
      readTokenMetadata: jest.fn().mockResolvedValue({
        address: token,
        name: "Project Token",
        symbol: "PT",
        decimals: 8,
      }),
    };
    const canonicalProjectModel = {
      findById: jest.fn().mockReturnValue({
        lean: jest.fn().mockResolvedValue(null),
      }),
    };
    const service = new FomoV2LaunchpadAdminService(
      {} as any,
      {} as any,
      canonicalProjectModel as any,
      new FomoV2LaunchpadDeploymentService(new ConfigService({})),
      chainService as any
    );

    await (service as any).applyOperationVerification(pool, operation);

    expect(chainService.readTokenMetadata).toHaveBeenCalledWith(token);
    expect(pool.onchainState).toMatchObject({
      projectToken: token,
      projectTokenAmount: "100000000",
      projectTokenMetadata: {
        address: token,
        symbol: "PT",
        decimals: 8,
      },
      claimEnabled: true,
    });
  });

  it("resets the same draft only after a finalized reverted create is reverified", async () => {
    const createParams = createDraftInput();
    const pool: any = {
      _id: "507f1f77bcf86cd799439020",
      canonicalProjectId: "507f1f77bcf86cd799439011",
      chainId: 97,
      launchpadAddress: createParams.launchpadAddress.toLowerCase(),
      createParams,
      createTransaction: {
        transactionHash: CREATE_TX_HASH,
        from: "0xd22d8d0368d80a4627d554cb9b70e31bf7ec828a",
        nonce: "11",
        to: createParams.launchpadAddress.toLowerCase(),
        calldataValidated: true,
        blockNumber: "100",
        blockHash: `0x${"11".repeat(32)}`,
        confirmations: 3,
        failureKind: "reverted",
        safeToRetry: true,
        submittedAt: new Date(),
      },
      createTransactionHistory: [],
      predictedPoolId: "7",
      status: "failed",
      publicationStatus: "draft",
      revision: 2,
      onchainState: {},
      save: jest.fn().mockResolvedValue(undefined),
      toObject: jest.fn(function (this: any) {
        return { ...this };
      }),
    };
    const chainService = {
      verifyCreateTransaction: jest.fn().mockResolvedValue({
        status: "failed",
        failureKind: "reverted",
        safeToRetry: true,
        transactionHash: CREATE_TX_HASH,
        confirmations: 3,
        requiredConfirmations: 3,
        blockNumber: "100",
        blockHash: `0x${"11".repeat(32)}`,
      }),
    };
    const canonicalProjectModel = {
      findById: jest.fn().mockReturnValue({
        lean: jest.fn().mockResolvedValue({
          _id: pool.canonicalProjectId,
          name: "Retry project",
        }),
      }),
    };
    const service = new FomoV2LaunchpadAdminService(
      { findById: jest.fn().mockResolvedValue(pool) } as any,
      {} as any,
      canonicalProjectModel as any,
      new FomoV2LaunchpadDeploymentService(new ConfigService({})),
      chainService as any
    );

    const result = await service.resetRevertedCreate(pool._id, { sub: "admin-1" });

    expect(chainService.verifyCreateTransaction).toHaveBeenCalledWith(
      CREATE_TX_HASH,
      expect.objectContaining({ targetAmount: createParams.targetAmount })
    );
    expect(pool.status).toBe("draft");
    expect(pool.createTransaction).toBeUndefined();
    expect(pool.predictedPoolId).toBeUndefined();
    expect(pool.createTransactionHistory).toHaveLength(1);
    expect(pool.createTransactionHistory[0]).toMatchObject({
      transactionHash: CREATE_TX_HASH,
      failureKind: "reverted",
      safeToRetry: true,
    });
    expect(result.verification).toMatchObject({ failureKind: "reverted" });
  });

  it("verifies a wallet cancellation before marking and resetting the create attempt", async () => {
    const replacementTxHash = `0x${"ac".repeat(32)}`;
    const createParams = createDraftInput();
    const pool: any = {
      _id: "507f1f77bcf86cd799439020",
      canonicalProjectId: "507f1f77bcf86cd799439011",
      chainId: 97,
      launchpadAddress: createParams.launchpadAddress.toLowerCase(),
      createParams,
      createTransaction: {
        transactionHash: CREATE_TX_HASH,
        from: "0xd22d8d0368d80a4627d554cb9b70e31bf7ec828a",
        nonce: "11",
        to: createParams.launchpadAddress.toLowerCase(),
        calldataValidated: true,
        safeToRetry: false,
        submittedAt: new Date(),
      },
      createTransactionHistory: [],
      status: "tx_submitted",
      publicationStatus: "draft",
      revision: 1,
      onchainState: {},
      save: jest.fn().mockResolvedValue(undefined),
      toObject: jest.fn(function (this: any) {
        return { ...this };
      }),
    };
    const cancellationVerification = {
      status: "confirmed",
      failureKind: "cancelled",
      safeToRetry: true,
      transactionHash: replacementTxHash,
      replacesTransactionHash: CREATE_TX_HASH,
      replacementValidated: true,
      confirmations: 3,
      requiredConfirmations: 3,
      from: pool.createTransaction.from,
      nonce: "11",
      to: pool.createTransaction.from,
      blockNumber: "101",
      blockHash: `0x${"22".repeat(32)}`,
    };
    const chainService = {
      verifyCreateCancellationTransaction: jest
        .fn()
        .mockResolvedValue(cancellationVerification),
    };
    const operationModel = { updateOne: jest.fn().mockResolvedValue({}) };
    const canonicalProjectModel = {
      findById: jest.fn().mockReturnValue({
        lean: jest.fn().mockResolvedValue({
          _id: pool.canonicalProjectId,
          name: "Cancelled project",
        }),
      }),
    };
    const service = new FomoV2LaunchpadAdminService(
      { findById: jest.fn().mockResolvedValue(pool) } as any,
      operationModel as any,
      canonicalProjectModel as any,
      new FomoV2LaunchpadDeploymentService(new ConfigService({})),
      chainService as any
    );

    const confirmed = await service.confirmCreateCancellation(
      pool._id,
      { replacementTxHash },
      { sub: "admin-1" }
    );

    expect(confirmed.verification).toMatchObject({
      failureKind: "cancelled",
      safeToRetry: true,
    });
    expect(pool.createTransaction).toMatchObject({
      failureKind: "cancelled",
      safeToRetry: true,
      cancelledByTransactionHash: replacementTxHash,
    });
    expect(operationModel.updateOne).toHaveBeenCalled();

    await service.resetRevertedCreate(pool._id, { sub: "admin-1" });
    expect(chainService.verifyCreateCancellationTransaction).toHaveBeenCalledTimes(2);
    expect(pool.status).toBe("draft");
    expect(pool.createTransaction).toBeUndefined();
    expect(pool.createTransactionHistory[0]).toMatchObject({
      failureKind: "cancelled",
      cancelledByTransactionHash: replacementTxHash,
    });
  });

  it("refuses to reset pending or integrity-failed create evidence", async () => {
    const pool: any = {
      _id: "507f1f77bcf86cd799439020",
      createTransaction: {
        transactionHash: CREATE_TX_HASH,
        failureKind: "integrity",
        safeToRetry: false,
        submittedAt: new Date(),
      },
      status: "failed",
    };
    const chainService = {
      verifyCreateTransaction: jest.fn(),
      verifyCreateCancellationTransaction: jest.fn(),
    };
    const service = new FomoV2LaunchpadAdminService(
      { findById: jest.fn().mockResolvedValue(pool) } as any,
      {} as any,
      {} as any,
      new FomoV2LaunchpadDeploymentService(new ConfigService({})),
      chainService as any
    );

    await expect(service.resetRevertedCreate(pool._id)).rejects.toBeInstanceOf(
      ConflictException
    );
    expect(chainService.verifyCreateTransaction).not.toHaveBeenCalled();
    expect(
      chainService.verifyCreateCancellationTransaction
    ).not.toHaveBeenCalled();
  });

  it("refuses reset when previously safe revert evidence is no longer finalized", async () => {
    const createParams = createDraftInput();
    const pool: any = {
      _id: "507f1f77bcf86cd799439020",
      chainId: 97,
      launchpadAddress: createParams.launchpadAddress.toLowerCase(),
      createParams,
      createTransaction: {
        transactionHash: CREATE_TX_HASH,
        from: "0xd22d8d0368d80a4627d554cb9b70e31bf7ec828a",
        nonce: "11",
        to: createParams.launchpadAddress.toLowerCase(),
        calldataValidated: true,
        failureKind: "reverted",
        safeToRetry: true,
      },
      status: "failed",
      save: jest.fn(),
    };
    const chainService = {
      verifyCreateTransaction: jest.fn().mockResolvedValue({
        status: "pending",
        transactionHash: CREATE_TX_HASH,
        confirmations: 1,
        requiredConfirmations: 3,
        safeToRetry: false,
        reason: "Waiting for required block confirmations.",
      }),
    };
    const service = new FomoV2LaunchpadAdminService(
      { findById: jest.fn().mockResolvedValue(pool) } as any,
      {} as any,
      {} as any,
      new FomoV2LaunchpadDeploymentService(new ConfigService({})),
      chainService as any
    );

    await expect(service.resetRevertedCreate(pool._id)).rejects.toBeInstanceOf(
      ConflictException
    );
    expect(chainService.verifyCreateTransaction).toHaveBeenCalledTimes(1);
    expect(pool.save).not.toHaveBeenCalled();
    expect(pool.createTransaction).toMatchObject({
      transactionHash: CREATE_TX_HASH,
      failureKind: "reverted",
    });
  });
});
