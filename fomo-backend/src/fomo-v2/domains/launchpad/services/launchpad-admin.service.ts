import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
  Optional,
} from "@nestjs/common";
import { InjectModel } from "@nestjs/mongoose";
import mongoose, { Model, Types } from "mongoose";
import { AssetStorageService } from "src/storage/asset-storage.service";
import { FomoV2CanonicalProject } from "../../../models";
import {
  FomoV2LaunchpadConfirmCreateDto,
  FomoV2LaunchpadConfirmCreateCancellationDto,
  FomoV2LaunchpadCreateDraftDto,
  FomoV2LaunchpadCreateOperationDto,
  FomoV2LaunchpadNewCanonicalProjectDto,
  FomoV2LaunchpadPatchDraftDto,
  FomoV2LaunchpadPoolQueryDto,
  FomoV2LaunchpadProjectQueryDto,
  FomoV2LaunchpadPublicationDto,
  FomoV2LaunchpadPatchDetailsDto,
} from "../dto";
import {
  FomoV2LaunchpadOperation,
  FomoV2LaunchpadPlacement,
  FomoV2LaunchpadPool,
  FomoV2LaunchpadPoolDocument,
} from "../models";
import {
  FomoV2LaunchpadCreateParams,
  FomoV2LaunchpadDetails,
  FomoV2LaunchpadOperationType,
} from "../types";
import {
  FomoV2LaunchpadChainService,
  FomoV2LaunchpadTxVerification,
} from "./launchpad-chain.service";
import { FomoV2LaunchpadDeploymentService } from "./launchpad-deployment.service";
import { FomoV2LaunchpadSyncService } from "./launchpad-sync.service";

const UINT_LIMITS = {
  uint16: (BigInt(1) << BigInt(16)) - BigInt(1),
  uint32: (BigInt(1) << BigInt(32)) - BigInt(1),
  uint64: (BigInt(1) << BigInt(64)) - BigInt(1),
  uint256: (BigInt(1) << BigInt(256)) - BigInt(1),
};

const POOL_OPERATION_TYPES = new Set<FomoV2LaunchpadOperationType>([
  "update_pool_fee_percent",
  "update_pool_min_investment",
  "deposit_project_tokens",
  "close_pool",
  "admin_unstake_all_pool_users",
]);

const GLOBAL_OPERATION_TYPES = new Set<FomoV2LaunchpadOperationType>([
  "add_admin",
  "remove_admin",
  "set_investment_receiver",
  "set_fee_receiver",
  "transfer_ownership",
]);

@Injectable()
export class FomoV2LaunchpadAdminService {
  constructor(
    @InjectModel(FomoV2LaunchpadPool.name)
    private readonly poolModel: Model<FomoV2LaunchpadPool>,
    @InjectModel(FomoV2LaunchpadOperation.name)
    private readonly operationModel: Model<FomoV2LaunchpadOperation>,
    @InjectModel(FomoV2CanonicalProject.name)
    private readonly canonicalProjectModel: Model<FomoV2CanonicalProject>,
    private readonly deploymentService: FomoV2LaunchpadDeploymentService,
    private readonly chainService: FomoV2LaunchpadChainService,
    @Optional()
    @InjectModel(FomoV2LaunchpadPlacement.name)
    private readonly placementModel?: Model<FomoV2LaunchpadPlacement>,
    @Optional()
    private readonly syncService?: FomoV2LaunchpadSyncService,
    @Optional()
    private readonly assetStorageService?: AssetStorageService
  ) {}

  getConfig() {
    return this.deploymentService.getDeployment();
  }

  async listProjects(query: FomoV2LaunchpadProjectQueryDto = {}) {
    const limit = query.limit || 30;
    const offset = query.offset || 0;
    const filter: Record<string, any> = {
      status: { $in: ["active", "proposed"] },
    };
    const search = this.cleanString(query.search);
    if (search) {
      const regex = new RegExp(this.escapeRegExp(search), "i");
      filter.$or = [
        { name: regex },
        { symbol: regex },
        { slug: regex },
        { normalizedName: regex },
      ];
    }

    const [total, rows] = await Promise.all([
      this.canonicalProjectModel.countDocuments(filter),
      this.canonicalProjectModel
        .find(filter)
        .sort({ createdForLaunchpad: -1, name: 1, _id: 1 })
        .skip(offset)
        .limit(limit)
        .select(
          "name slug symbol status primaryWebsiteDomain metadata createdForLaunchpad originSourceType createdAt updatedAt"
        )
        .lean(),
    ]);

    return {
      items: rows.map((row) => this.presentCanonicalProject(row)),
      total,
      limit,
      offset,
    };
  }

  async listPools(query: FomoV2LaunchpadPoolQueryDto = {}) {
    const limit = query.limit || 30;
    const offset = query.offset || 0;
    const filter: Record<string, any> = {};
    if (query.status) filter.status = query.status;
    if (query.publicationStatus) {
      filter.publicationStatus = query.publicationStatus;
    }
    if (query.canonicalProjectId) {
      filter.canonicalProjectId = new Types.ObjectId(query.canonicalProjectId);
    }

    const search = this.cleanString(query.search);
    if (search) {
      const matchingProjects = await this.canonicalProjectModel
        .find({
          $or: [
            { name: new RegExp(this.escapeRegExp(search), "i") },
            { symbol: new RegExp(this.escapeRegExp(search), "i") },
            { slug: new RegExp(this.escapeRegExp(search), "i") },
          ],
        })
        .select("_id")
        .limit(500)
        .lean();
      const projectIds = matchingProjects.map((row: any) => row._id);
      filter.$or = [
        { canonicalProjectId: { $in: projectIds } },
        { poolId: search },
        { predictedPoolId: search },
        { "createTransaction.transactionHash": search.toLowerCase() },
      ];
    }

    const [total, rows] = await Promise.all([
      this.poolModel.countDocuments(filter),
      this.poolModel
        .find(filter)
        .sort({ createdAt: -1, _id: -1 })
        .skip(offset)
        .limit(limit)
        .lean(),
    ]);
    const canonicalProjects = await this.loadCanonicalProjects(rows);

    return {
      items: rows.map((row) =>
        this.presentPool(
          row,
          canonicalProjects.get(String(row.canonicalProjectId))
        )
      ),
      total,
      limit,
      offset,
    };
  }

  async getPool(id: string) {
    const pool = await this.findPool(id, true);
    const [canonicalProject, operations] = await Promise.all([
      this.canonicalProjectModel.findById(pool.canonicalProjectId).lean(),
      this.operationModel
        .find({ launchpadPoolId: pool._id })
        .sort({ createdAt: -1 })
        .limit(50)
        .lean(),
    ]);
    return {
      pool: this.presentPool(pool.toObject(), canonicalProject),
      operations: operations.map((operation) =>
        this.presentOperation(operation)
      ),
    };
  }

  async createDraft(input: FomoV2LaunchpadCreateDraftDto, user?: any) {
    this.assertDeployment(input.chainId, input.launchpadAddress);
    const createParams = this.normalizeAndValidateCreateParams(input);
    const actor = this.actor(user);
    const idempotencyKey = this.cleanString(input.idempotencyKey);

    if (idempotencyKey) {
      const existing = await this.poolModel.findOne({
        chainId: input.chainId,
        launchpadAddress: this.normalizeAddress(input.launchpadAddress),
        idempotencyKey,
      });
      if (existing) {
        const canonicalProject = await this.canonicalProjectModel
          .findById(existing.canonicalProjectId)
          .lean();
        return {
          pool: this.presentPool(existing.toObject(), canonicalProject),
          idempotentReplay: true,
        };
      }
    }

    const metadata = this.sanitizeMetadata(input.metadata);
    const canonicalProject = await this.resolveCanonicalProject(input, actor);
    try {
      const pool = await this.poolModel.create({
        canonicalProjectId: canonicalProject._id,
        slug: input.slug ? this.normalizeSlug(input.slug) : undefined,
        schemaVersion: 2,
        chainId: input.chainId,
        launchpadAddress: this.normalizeAddress(input.launchpadAddress),
        createParams,
        launchDetails: this.sanitizeLaunchDetails(input.launchDetails),
        metadata,
        onchainState: {},
        status: "draft",
        publicationStatus: "draft",
        revision: 0,
        idempotencyKey,
        createdBy: actor,
        updatedBy: actor,
      });
      return {
        pool: this.presentPool(pool.toObject(), canonicalProject),
        canonicalProjectCreated: Boolean(input.newCanonicalProject),
      };
    } catch (error: any) {
      if (input.newCanonicalProject && canonicalProject?._id) {
        await this.cleanupUnusedLaunchpadCanonicalProject(canonicalProject._id);
      }
      if (error?.code === 11000) {
        throw new ConflictException(
          "Launchpad draft conflicts with an existing unique operation."
        );
      }
      throw error;
    }
  }

  async patchDraft(
    id: string,
    input: FomoV2LaunchpadPatchDraftDto,
    user?: any
  ) {
    const pool = await this.findPool(id, true);
    if (pool.status !== "draft") {
      throw new ConflictException("Only a draft pool can be edited.");
    }
    if (
      input.expectedRevision !== undefined &&
      pool.revision !== input.expectedRevision
    ) {
      throw new ConflictException(
        `Launchpad pool revision changed; expected ${input.expectedRevision}, current ${pool.revision}.`
      );
    }

    const nextCreateParams: FomoV2LaunchpadCreateParams = {
      ...this.plainObject<FomoV2LaunchpadCreateParams>(pool.createParams),
      ...this.pickCreateParams(input),
    };
    this.validateCreateParams(nextCreateParams);
    pool.createParams = nextCreateParams;
    if (input.metadata !== undefined) {
      pool.metadata = this.sanitizeMetadata(input.metadata);
    }
    pool.updatedBy = this.actor(user);
    pool.revision += 1;
    await pool.save();
    const canonicalProject = await this.canonicalProjectModel
      .findById(pool.canonicalProjectId)
      .lean();
    return { pool: this.presentPool(pool.toObject(), canonicalProject) };
  }

  async confirmCreate(
    id: string,
    input: FomoV2LaunchpadConfirmCreateDto,
    user?: any
  ) {
    const pool = await this.findPool(id, true);
    const txHash = input.txHash.toLowerCase();
    if (
      pool.status === "active" &&
      pool.createTransaction?.transactionHash === txHash
    ) {
      if (this.syncService) {
        await this.syncService.relinkAndReplayPoolEvents(String(pool._id));
      }
      const currentPool = (await this.poolModel.findById(pool._id)) || pool;
      const canonicalProject = await this.canonicalProjectModel
        .findById(currentPool.canonicalProjectId)
        .lean();
      return {
        pool: this.presentPool(currentPool.toObject(), canonicalProject),
        verification: {
          status: "confirmed",
          safeToRetry: false,
          confirmations: pool.createTransaction.confirmations || 0,
          requiredConfirmations: this.getConfig().confirmations,
          poolId: pool.poolId,
        },
      };
    }
    if (!["draft", "tx_submitted", "failed"].includes(pool.status)) {
      throw new ConflictException(
        `Pool in ${pool.status} status cannot accept create confirmation.`
      );
    }
    const storedTxHash = pool.createTransaction?.transactionHash;
    let replacesTxHash: string | undefined;
    if (storedTxHash && storedTxHash !== txHash) {
      const reportedReplacesTxHash = input.replacesTxHash?.toLowerCase();
      if (reportedReplacesTxHash !== storedTxHash) {
        throw new ConflictException(
          "This draft already has a different create transaction. Pass replacesTxHash matching the stored transaction when the wallet mined a replacement."
        );
      }
      replacesTxHash = storedTxHash;
    }

    const conflictingOperation = await this.operationModel.findOne({
      chainId: pool.chainId,
      transactionHash: txHash,
      launchpadPoolId: { $ne: pool._id },
    });
    if (conflictingOperation) {
      throw new ConflictException(
        "Transaction hash is already attached to another launchpad pool."
      );
    }

    const now = new Date();
    pool.predictedPoolId = input.predictedPoolId || pool.predictedPoolId;
    pool.status = "tx_submitted";
    if (!replacesTxHash) {
      pool.createTransaction = {
        ...this.plainObject(pool.createTransaction || {}),
        transactionHash: txHash,
        safeToRetry: false,
        submittedAt: pool.createTransaction?.submittedAt || now,
        lastCheckedAt: now,
      };
    }
    pool.updatedBy = this.actor(user);
    pool.revision += 1;
    await pool.save();

    await this.operationModel.updateOne(
      { chainId: pool.chainId, transactionHash: txHash },
      {
        $setOnInsert: {
          launchpadPoolId: pool._id,
          chainId: pool.chainId,
          launchpadAddress: pool.launchpadAddress,
          type: "create_pool",
          transactionHash: txHash,
          submittedAt: now,
          createdBy: this.actor(user),
        },
        $set: {
          onchainPoolId: pool.predictedPoolId,
          params: {
            predictedPoolId: pool.predictedPoolId,
            replacesTxHash,
            createParams: this.plainObject(pool.createParams),
          },
          status: "pending",
          lastCheckedAt: now,
        },
      },
      { upsert: true }
    );

    return this.applyCreateVerification(pool, user, txHash, replacesTxHash);
  }

  async confirmCreateCancellation(
    id: string,
    input: FomoV2LaunchpadConfirmCreateCancellationDto,
    user?: any
  ) {
    const pool = await this.findPool(id, true);
    const attempt = this.plainObject<
      NonNullable<FomoV2LaunchpadPool["createTransaction"]>
    >(pool.createTransaction || {});
    if (!attempt.transactionHash || pool.poolId || pool.status === "active") {
      throw new ConflictException(
        "Only an unverified create transaction can be confirmed as cancelled."
      );
    }
    if (attempt.failureKind === "integrity") {
      throw new ConflictException(
        "An integrity failure cannot be reset through wallet cancellation."
      );
    }
    if (attempt.failureKind === "reverted") {
      throw new ConflictException(
        "The create transaction already reverted on-chain; use reset-reverted-create."
      );
    }
    const replacementTxHash = input.replacementTxHash.toLowerCase();
    if (
      attempt.failureKind === "cancelled" &&
      attempt.cancelledByTransactionHash &&
      attempt.cancelledByTransactionHash !== replacementTxHash
    ) {
      throw new ConflictException(
        "This create transaction is already linked to another verified cancellation."
      );
    }
    const verification =
      await this.chainService.verifyCreateCancellationTransaction(
        replacementTxHash,
        {
          transactionHash: attempt.transactionHash,
          from: attempt.from,
          nonce: attempt.nonce,
          to: attempt.to,
          calldataValidated: attempt.calldataValidated,
        }
      );
    if (
      verification.status === "confirmed" &&
      verification.failureKind === "cancelled" &&
      verification.safeToRetry
    ) {
      const now = new Date();
      pool.createTransaction = {
        ...attempt,
        failureKind: "cancelled",
        safeToRetry: true,
        cancelledByTransactionHash: replacementTxHash,
        cancellationFrom: verification.from,
        cancellationNonce: verification.nonce,
        cancellationTo: verification.to,
        cancellationBlockNumber: verification.blockNumber,
        cancellationBlockHash: verification.blockHash,
        cancellationConfirmations: verification.confirmations,
        cancelledAt: now,
        lastCheckedAt: now,
        verificationError: `Create transaction was cancelled by verified replacement ${replacementTxHash}.`,
      };
      pool.status = "failed";
      pool.updatedBy = this.actor(user);
      pool.revision += 1;
      await pool.save();
      await this.operationModel.updateOne(
        {
          chainId: pool.chainId,
          transactionHash: attempt.transactionHash,
          type: "create_pool",
        },
        {
          $set: {
            status: "failed",
            lastCheckedAt: now,
            verificationError: `Create transaction cancelled by ${replacementTxHash}.`,
            "params.cancelledByTransactionHash": replacementTxHash,
            "params.cancellationBlockNumber": verification.blockNumber,
          },
        }
      );
    }
    const canonicalProject = await this.canonicalProjectModel
      .findById(pool.canonicalProjectId)
      .lean();
    return {
      pool: this.presentPool(pool.toObject(), canonicalProject),
      verification,
    };
  }

  async resetRevertedCreate(id: string, user?: any) {
    const pool = await this.findPool(id, true);
    const attempt = this.plainObject<
      NonNullable<FomoV2LaunchpadPool["createTransaction"]>
    >(pool.createTransaction || {});
    if (
      !attempt.transactionHash ||
      pool.poolId ||
      !attempt.safeToRetry ||
      !["reverted", "cancelled"].includes(attempt.failureKind)
    ) {
      throw new ConflictException(
        "Create reset requires confirmed reverted or verified-cancelled evidence marked safeToRetry."
      );
    }

    const verification =
      attempt.failureKind === "cancelled"
        ? await this.chainService.verifyCreateCancellationTransaction(
            String(attempt.cancelledByTransactionHash || ""),
            {
              transactionHash: attempt.transactionHash,
              from: attempt.from,
              nonce: attempt.nonce,
              to: attempt.to,
              calldataValidated: attempt.calldataValidated,
            }
          )
        : await this.chainService.verifyCreateTransaction(
            attempt.transactionHash,
            this.plainObject<FomoV2LaunchpadCreateParams>(pool.createParams)
          );
    const resetEvidenceValid =
      verification.confirmations >= verification.requiredConfirmations &&
      verification.safeToRetry &&
      ((attempt.failureKind === "reverted" &&
        verification.status === "failed" &&
        verification.failureKind === "reverted") ||
        (attempt.failureKind === "cancelled" &&
          verification.status === "confirmed" &&
          verification.failureKind === "cancelled" &&
          verification.transactionHash ===
            String(attempt.cancelledByTransactionHash).toLowerCase()));
    if (!resetEvidenceValid) {
      throw new ConflictException({
        message:
          "Create reset evidence is no longer finalized or does not match the saved attempt.",
        verification,
      });
    }

    const archivedAttempt = {
      ...attempt,
      confirmations:
        attempt.failureKind === "reverted"
          ? verification.confirmations
          : attempt.confirmations,
      cancellationConfirmations:
        attempt.failureKind === "cancelled"
          ? verification.confirmations
          : attempt.cancellationConfirmations,
      lastCheckedAt: new Date(),
    };
    const history = Array.from(pool.createTransactionHistory || []).map(
      (entry: any) => this.plainObject(entry)
    );
    pool.createTransactionHistory = [...history, archivedAttempt].slice(-20) as any;
    pool.createTransaction = undefined;
    pool.predictedPoolId = undefined;
    pool.status = "draft";
    pool.publicationStatus = "draft";
    pool.publishedAt = undefined;
    pool.publishedBy = undefined;
    pool.updatedBy = this.actor(user);
    pool.revision += 1;
    await pool.save();
    const canonicalProject = await this.canonicalProjectModel
      .findById(pool.canonicalProjectId)
      .lean();
    return {
      pool: this.presentPool(pool.toObject(), canonicalProject),
      verification,
    };
  }

  async reconcileCreate(id: string, user?: any) {
    const pool = await this.findPool(id, true);
    if (!pool.createTransaction?.transactionHash) {
      throw new ConflictException("Pool has no submitted create transaction.");
    }
    return this.confirmCreate(
      id,
      {
        txHash: pool.createTransaction.transactionHash,
        predictedPoolId: pool.predictedPoolId,
        replacesTxHash: pool.createTransaction.replacesTransactionHash,
      },
      user
    );
  }

  async createOperation(
    poolId: string,
    input: FomoV2LaunchpadCreateOperationDto,
    user?: any
  ) {
    const pool = await this.findPool(poolId, true);
    if (!POOL_OPERATION_TYPES.has(input.type)) {
      throw new BadRequestException(
        "This operation is contract-global and must be submitted through /operations."
      );
    }
    if (!["active", "closed"].includes(pool.status) || !pool.poolId) {
      throw new ConflictException(
        "Admin operations require a verified on-chain poolId."
      );
    }
    if (pool.status === "closed" && input.type === "close_pool") {
      throw new ConflictException("Pool is already closed.");
    }

    const transactionHash = input.txHash.toLowerCase();
    const requestedParams = this.normalizeOperationRequestedParams(
      input.type,
      input.params
    );
    const now = new Date();
    let operation = await this.operationModel.findOne({
      chainId: pool.chainId,
      transactionHash,
    });
    if (operation) {
      if (
        String(operation.launchpadPoolId) !== String(pool._id) ||
        operation.type !== input.type
      ) {
        throw new ConflictException(
          "Transaction hash is already registered for another launchpad operation."
        );
      }
      this.assertSameOperationIntent(operation, requestedParams);
    } else {
      operation = await this.operationModel.create({
        launchpadPoolId: pool._id,
        chainId: pool.chainId,
        launchpadAddress: pool.launchpadAddress,
        onchainPoolId: POOL_OPERATION_TYPES.has(input.type)
          ? pool.poolId
          : undefined,
        type: input.type,
        transactionHash,
        params: requestedParams,
        requestedParams,
        observedParams: {},
        status: "pending",
        submittedAt: now,
        lastCheckedAt: now,
        createdBy: this.actor(user),
      });
    }

    return this.applyOperationVerification(pool, operation);
  }

  async createGlobalOperation(
    input: FomoV2LaunchpadCreateOperationDto,
    user?: any
  ) {
    if (!GLOBAL_OPERATION_TYPES.has(input.type)) {
      throw new BadRequestException(
        "This operation is pool-scoped and must be submitted through /pools/:id/operations."
      );
    }
    const deployment = this.getConfig();
    const transactionHash = input.txHash.toLowerCase();
    const requestedParams = this.normalizeOperationRequestedParams(
      input.type,
      input.params
    );
    const now = new Date();
    let operation = await this.operationModel.findOne({
      chainId: deployment.chainId,
      transactionHash,
    });
    if (operation) {
      if (operation.launchpadPoolId || operation.type !== input.type) {
        throw new ConflictException(
          "Transaction hash is already registered for another launchpad operation."
        );
      }
      this.assertSameOperationIntent(operation, requestedParams);
    } else {
      operation = await this.operationModel.create({
        chainId: deployment.chainId,
        launchpadAddress: deployment.launchpadAddress.toLowerCase(),
        type: input.type,
        transactionHash,
        params: requestedParams,
        requestedParams,
        observedParams: {},
        status: "pending",
        submittedAt: now,
        lastCheckedAt: now,
        createdBy: this.actor(user),
      });
    }
    return this.applyOperationVerification(undefined, operation);
  }

  async reconcileOperation(operationId: string) {
    if (!Types.ObjectId.isValid(operationId)) {
      throw new NotFoundException("Launchpad operation not found.");
    }
    const operation = await this.operationModel.findById(operationId);
    if (!operation)
      throw new NotFoundException("Launchpad operation not found.");
    const pool = operation.launchpadPoolId
      ? await this.findPool(String(operation.launchpadPoolId), true)
      : undefined;
    if (operation.type === "create_pool") {
      if (!pool) {
        throw new ConflictException(
          "Create-pool operation is missing its backend pool relation."
        );
      }
      return this.applyCreateVerification(
        pool,
        undefined,
        operation.transactionHash,
        operation.params?.replacesTxHash
      );
    }
    return this.applyOperationVerification(pool, operation);
  }

  async updatePublication(
    id: string,
    input: FomoV2LaunchpadPublicationDto,
    user?: any
  ) {
    const pool = await this.findPool(id, true);
    if (input.publicationStatus === "published") {
      const readiness = await this.getPublicationReadiness(id);
      if (!readiness.ready) {
        throw new ConflictException({
          message: "Launchpad pool is not ready for publication.",
          readiness,
        });
      }
    }
    pool.publicationStatus = input.publicationStatus;
    pool.updatedBy = this.actor(user);
    pool.revision += 1;
    if (input.publicationStatus === "published") {
      pool.publishedAt = new Date();
      pool.publishedBy = this.actor(user);
    }
    await pool.save();
    const canonicalProject = await this.canonicalProjectModel
      .findById(pool.canonicalProjectId)
      .lean();
    return { pool: this.presentPool(pool.toObject(), canonicalProject) };
  }

  async patchDetails(
    id: string,
    input: FomoV2LaunchpadPatchDetailsDto,
    user?: any
  ) {
    const pool = await this.findPool(id, true);
    if (
      input.expectedRevision !== undefined &&
      pool.revision !== input.expectedRevision
    ) {
      throw new ConflictException(
        `Launchpad pool revision changed; expected ${input.expectedRevision}, current ${pool.revision}.`
      );
    }
    if (input.slug !== undefined) {
      const normalizedSlug = this.normalizeSlug(input.slug);
      if (!normalizedSlug) throw new BadRequestException("slug is invalid.");
      pool.slug = normalizedSlug;
    }
    // The admin editor sends a complete editorial snapshot. Replacement makes
    // clearing an override deterministic and restores canonical fallback.
    pool.launchDetails = this.sanitizeLaunchDetails(input.launchDetails);
    pool.updatedBy = this.actor(user);
    pool.revision += 1;
    try {
      await pool.save();
    } catch (error: any) {
      if (error?.code === 11000) {
        throw new ConflictException("Another Launchpad pool already uses this slug.");
      }
      throw error;
    }
    const canonicalProject = await this.canonicalProjectModel
      .findById(pool.canonicalProjectId)
      .lean();
    return {
      pool: this.presentPool(pool.toObject(), canonicalProject),
      readiness: await this.getPublicationReadiness(id),
    };
  }

  async getPublicationReadiness(id: string) {
    const pool = await this.findPool(id, true);
    const canonical = await this.canonicalProjectModel
      .findById(pool.canonicalProjectId)
      .lean();
    const details: any = this.plainObject(pool.launchDetails || {});
    const metadata: any = canonical?.metadata || {};
    const issues: Array<{ code: string; field: string; message: string }> = [];
    const issue = (code: string, field: string, message: string) =>
      issues.push({ code, field, message });
    if (!pool.slug) issue("missing_slug", "slug", "A unique launch slug is required.");
    if (!this.cleanString(details.title || canonical?.name)) {
      issue("missing_title", "launchDetails.title", "Title or canonical project name is required.");
    }
    if (!this.cleanString(details.description || details.shortDescription || metadata.description)) {
      issue("missing_description", "launchDetails.description", "A launch or canonical description is required.");
    }
    if (!this.cleanString(details.logoUrl || metadata.logo || metadata.logoUrl)) {
      issue("missing_logo", "launchDetails.logoUrl", "A launch or canonical logo is required.");
    }
    if (!this.cleanString(details.bannerUrl)) {
      issue("missing_banner", "launchDetails.bannerUrl", "A launch detail banner is required.");
    }
    if (!pool.poolId || !["active", "closed"].includes(pool.status)) {
      issue("pool_not_verified", "poolId", "A verified active or closed on-chain pool is required.");
    }

    let contract: {
      ready: boolean;
      codePresent: boolean;
      stakingNftMatches: boolean;
      poolExists?: boolean;
      issues: string[];
    } = {
      ready: false,
      codePresent: false,
      stakingNftMatches: false,
      poolExists: undefined as boolean | undefined,
      issues: [] as string[],
    };
    let onchain: any;
    if (pool.poolId) {
      try {
        contract = await this.chainService.validateContractInterface(pool.poolId);
        for (const message of contract.issues) {
          issue("contract_interface", "contract", message);
        }
        if (contract.poolExists) {
          onchain = await this.chainService.readPoolInfo(pool.poolId);
          const expected = this.plainObject<FomoV2LaunchpadCreateParams>(pool.createParams);
          expected.feePercent = String(
            pool.onchainState?.feePercent ?? expected.feePercent
          );
          expected.minInvestment = String(
            pool.onchainState?.minInvestment ?? expected.minInvestment
          );
          for (const field of Object.keys(expected) as Array<keyof FomoV2LaunchpadCreateParams>) {
            const actual = String(onchain[field] ?? "").toLowerCase();
            const wanted = String(expected[field] ?? "").toLowerCase();
            if (actual !== wanted) {
              issue("pool_parameter_mismatch", `createParams.${field}`, `On-chain ${field} does not match the saved draft.`);
            }
          }
        }
      } catch (error: any) {
        issue("contract_unavailable", "contract", String(error?.message || error));
      }
    }
    return {
      ready: issues.length === 0,
      issues,
      checks: {
        content: !issues.some((item) => item.field.startsWith("launchDetails") || item.field === "slug"),
        contract: contract.ready,
        pool: Boolean(pool.poolId && contract.poolExists),
        token: String(onchain?.investToken || pool.createParams?.investToken || "").toLowerCase() ===
          this.getConfig().investTokenAddress.toLowerCase(),
      },
    };
  }

  async uploadMedia(file: any) {
    const buffer = this.strictImageBuffer(file);
    const mimeType = this.detectImageMimeType(buffer);
    const originalName = String(file?.originalName || file?.originalname || file?.name || "image");
    const extensionByMime: Record<string, string> = {
      "image/jpeg": "jpg",
      "image/png": "png",
      "image/webp": "webp",
      "image/gif": "gif",
    };
    const baseName = originalName.replace(/\.[^.]*$/, "") || "image";
    const storageName = `launchpad_${baseName}.${extensionByMime[mimeType!]}`;
    const now = new Date();
    const folder = `launchpad/${now.getUTCFullYear()}/${String(now.getUTCMonth() + 1).padStart(2, "0")}`;
    if (!this.assetStorageService) {
      throw new Error("Launchpad media storage is not configured.");
    }
    const asset = await this.assetStorageService.writeFile({
      buffer,
      originalName: storageName,
      mimeType,
      folder,
    });
    return {
      ...asset,
      url: asset.driver === "local" ? `/uploads/${asset.key}` : asset.url,
      managed: true,
    };
  }

  async deleteMedia(key: string) {
    const normalized = String(key || "").trim().replace(/^\/+/, "");
    const launchpadOwned =
      /^launchpad\/\d{4}\/\d{2}\/[a-f0-9-]+\.(?:jpg|jpeg|png|webp|gif)$/i.test(normalized) ||
      /^[a-z0-9_]+_launchpad_[a-z0-9_.-]+$/i.test(normalized);
    if (!launchpadOwned) {
      throw new BadRequestException("Only assets uploaded through Launchpad media can be deleted.");
    }
    const escaped = this.escapeRegExp(normalized);
    const reference = new RegExp(escaped, "i");
    const [poolReference, placementReference, canonicalReference] = await Promise.all([
      this.poolModel.exists({
        $or: [
          { "launchDetails.logoUrl": reference },
          { "launchDetails.bannerUrl": reference },
          { "launchDetails.gallery": reference },
          { "launchDetails.documents.url": reference },
          { "launchDetails.investors.logoUrl": reference },
          { "launchDetails.team.avatarUrl": reference },
        ],
      }),
      this.placementModel?.exists({
        $or: [
          { "banner.desktopUrl": reference },
          { "banner.mobileUrl": reference },
        ],
      }),
      this.canonicalProjectModel.exists({
        $or: [{ "metadata.logo": reference }, { "metadata.logoUrl": reference }],
      }),
    ]);
    if (poolReference || placementReference || canonicalReference) {
      throw new ConflictException("Media is still referenced by a launch or placement.");
    }
    if (!this.assetStorageService) {
      throw new Error("Launchpad media storage is not configured.");
    }
    await this.assetStorageService.removeFile(normalized);
    return { deleted: true, key: normalized };
  }

  async syncContract(id: string) {
    await this.findPool(id, true);
    if (!this.syncService) throw new Error("Launchpad sync service is not configured.");
    const result = await this.syncService.syncPoolById(id);
    return {
      ...result,
      ...(await this.getPool(id)),
    };
  }

  private async applyCreateVerification(
    pool: FomoV2LaunchpadPoolDocument,
    user: any,
    transactionHash: string,
    replacesTxHash?: string
  ) {
    if (
      pool.status === "active" &&
      pool.createTransaction?.transactionHash !== transactionHash
    ) {
      throw new ConflictException(
        "Pool is already active with a different verified create transaction."
      );
    }
    const verification = await this.chainService.verifyCreateTransaction(
      transactionHash,
      this.plainObject<FomoV2LaunchpadCreateParams>(pool.createParams),
      replacesTxHash
        ? {
            transactionHash: replacesTxHash,
            from: pool.createTransaction?.from,
            nonce: pool.createTransaction?.nonce,
            to: pool.createTransaction?.to,
            calldataValidated: pool.createTransaction?.calldataValidated,
          }
        : undefined
    );
    const now = new Date();
    const isReplacement = Boolean(
      replacesTxHash &&
        pool.createTransaction?.transactionHash !== transactionHash
    );
    if (!isReplacement || verification.status === "confirmed") {
      const previousTransaction = this.plainObject(
        pool.createTransaction || {}
      );
      pool.createTransaction = {
        ...(!isReplacement ? previousTransaction : {}),
        transactionHash,
        replacesTransactionHash: replacesTxHash,
        from: verification.from,
        nonce: verification.nonce,
        calldataValidated: verification.calldataValidated,
        to: verification.to,
        blockNumber: verification.blockNumber,
        blockHash: verification.blockHash,
        logIndex: verification.logIndex,
        observedPoolId: verification.poolId,
        confirmations: verification.confirmations,
        failureKind: verification.failureKind,
        safeToRetry: verification.safeToRetry,
        submittedAt:
          !isReplacement && previousTransaction.submittedAt
            ? previousTransaction.submittedAt
            : now,
        lastCheckedAt: now,
        confirmedAt: verification.status === "confirmed" ? now : undefined,
        verificationError:
          verification.status === "confirmed" ? undefined : verification.reason,
      };
    }
    pool.updatedBy = this.actor(user);
    pool.revision += 1;

    if (verification.status === "confirmed") {
      pool.poolId = verification.poolId;
      pool.status = "active";
      pool.onchainState = {
        ...(pool.onchainState || {}),
        feePercent: pool.createParams.feePercent,
        minInvestment: pool.createParams.minInvestment,
        lastVerifiedAt: now,
      };
    } else if (verification.status === "failed" && !isReplacement) {
      pool.status = "failed";
    } else if (!isReplacement) {
      pool.status = "tx_submitted";
    }

    try {
      await pool.save();
    } catch (error: any) {
      if (error?.code === 11000) {
        throw new ConflictException(
          "Verified PoolCreated poolId is already linked to another backend pool."
        );
      }
      throw error;
    }

    await this.operationModel.updateOne(
      { chainId: pool.chainId, transactionHash },
      {
        $set: {
          onchainPoolId: verification.poolId || pool.predictedPoolId,
          from: verification.from,
          nonce: verification.nonce,
          calldataValidated: verification.calldataValidated,
          to: verification.to,
          blockNumber: verification.blockNumber,
          blockHash: verification.blockHash,
          confirmations: verification.confirmations,
          status: verification.status,
          confirmedAt: verification.status === "confirmed" ? now : undefined,
          lastCheckedAt: now,
          verificationError:
            verification.status === "confirmed"
              ? undefined
              : verification.reason,
          params: {
            predictedPoolId: pool.predictedPoolId,
            replacesTxHash,
            replacementValidated: verification.replacementValidated,
            observedPoolId: verification.poolId,
            predictionMatches:
              !pool.predictedPoolId || !verification.poolId
                ? undefined
                : pool.predictedPoolId === verification.poolId,
            createParams: this.plainObject(pool.createParams),
          },
        },
      }
    );

    if (
      isReplacement &&
      replacesTxHash &&
      verification.status === "confirmed"
    ) {
      await this.operationModel.updateOne(
        {
          chainId: pool.chainId,
          transactionHash: replacesTxHash,
          type: "create_pool",
        },
        {
          $set: {
            status: "failed",
            verificationError: `Transaction replaced by verified transaction ${transactionHash}.`,
            lastCheckedAt: now,
          },
        }
      );
    }

    let responsePool: FomoV2LaunchpadPoolDocument = pool;
    if (verification.status === "confirmed" && this.syncService) {
      const snapshotBlock = Number(verification.blockNumber);
      await this.syncService.relinkAndReplayPoolEvents(
        String(pool._id),
        Number.isSafeInteger(snapshotBlock) ? snapshotBlock : undefined
      );
      responsePool = (await this.poolModel.findById(pool._id)) || pool;
    }

    const canonicalProject = await this.canonicalProjectModel
      .findById(responsePool.canonicalProjectId)
      .lean();
    return {
      pool: this.presentPool(responsePool.toObject(), canonicalProject),
      verification: this.presentVerification(verification, responsePool),
    };
  }

  private async applyOperationVerification(
    pool: FomoV2LaunchpadPoolDocument | undefined,
    operation: any
  ) {
    let verification = await this.chainService.verifyOperationTransaction(
      operation.transactionHash,
      operation.type,
      POOL_OPERATION_TYPES.has(operation.type) ? pool?.poolId : undefined
    );
    const requestedParams = this.plainObject(
      operation.requestedParams || operation.params || {}
    );
    if (verification.status === "confirmed") {
      const intentMismatch = this.operationIntentMismatch(
        operation.type,
        requestedParams,
        verification.decodedParams || {}
      );
      if (intentMismatch) {
        verification = {
          ...verification,
          status: "failed",
          failureKind: "integrity",
          safeToRetry: false,
          reason: intentMismatch,
        };
      }
    }
    const now = new Date();
    operation.from = verification.from;
    operation.to = verification.to;
    operation.blockNumber = verification.blockNumber;
    operation.blockHash = verification.blockHash;
    operation.confirmations = verification.confirmations;
    operation.status = verification.status;
    operation.lastCheckedAt = now;
    operation.verificationError =
      verification.status === "confirmed" ? undefined : verification.reason;
    operation.requestedParams = requestedParams;
    if (verification.decodedParams) {
      operation.observedParams = verification.decodedParams;
      operation.params = verification.decodedParams;
    }
    if (verification.status === "confirmed") operation.confirmedAt = now;
    await operation.save();

    if (verification.status === "confirmed" && pool) {
      const state: Record<string, any> = {
        ...(pool.onchainState || {}),
        lastVerifiedAt: now,
      };
      if (operation.type === "update_pool_fee_percent") {
        state.feePercent = verification.decodedParams?.newFeePercent;
      } else if (operation.type === "update_pool_min_investment") {
        state.minInvestment = verification.decodedParams?.newMinInvestment;
      } else if (operation.type === "deposit_project_tokens") {
        state.projectToken = verification.decodedParams?.projectToken;
        state.projectTokenAmount = verification.decodedParams?.amount;
        state.claimEnabled = true;
        state.stakeReleaseEnabled = true;
        try {
          state.projectTokenMetadata = await this.chainService.readTokenMetadata(
            verification.decodedParams?.projectToken
          );
        } catch {
          // The verified address and settlement state remain authoritative.
          // Finalized pool sync retries optional ERC20 display metadata.
        }
      } else if (operation.type === "close_pool") {
        pool.status = "closed";
        state.closed = true;
      }
      pool.onchainState = state;
      pool.revision += 1;
      await pool.save();
      if (
        this.syncService &&
        ["deposit_project_tokens", "close_pool"].includes(operation.type)
      ) {
        try {
          const refreshed = await this.syncService.syncPoolById(String(pool._id));
          pool.onchainState = refreshed.onchainState;
          if (refreshed.onchainState?.closed) pool.status = "closed";
        } catch {
          // Verified event-derived state remains valid; the scanner will retry
          // the full pool read when RPC availability recovers.
        }
      }
    }

    const canonicalProject = pool
      ? await this.canonicalProjectModel
          .findById(pool.canonicalProjectId)
          .lean()
      : undefined;
    return {
      operation: this.presentOperation(operation.toObject()),
      verification,
      pool: pool
        ? this.presentPool(pool.toObject(), canonicalProject)
        : undefined,
    };
  }

  private async resolveCanonicalProject(
    input: FomoV2LaunchpadCreateDraftDto,
    actor: string
  ): Promise<any> {
    const hasExisting = Boolean(input.canonicalProjectId);
    const hasNew = Boolean(input.newCanonicalProject);
    if (hasExisting === hasNew) {
      throw new BadRequestException(
        "Provide exactly one of canonicalProjectId or newCanonicalProject."
      );
    }
    if (input.canonicalProjectId) {
      const project = await this.canonicalProjectModel.findById(
        input.canonicalProjectId
      );
      if (!project || ["merged", "deprecated"].includes(project.status)) {
        throw new NotFoundException("Selectable canonical project not found.");
      }
      return project;
    }
    return this.createLaunchpadCanonicalProject(
      input.newCanonicalProject!,
      actor
    );
  }

  private async createLaunchpadCanonicalProject(
    input: FomoV2LaunchpadNewCanonicalProjectDto,
    actor: string
  ) {
    const name = this.cleanString(input.name);
    if (!name)
      throw new BadRequestException("Canonical project name is required.");
    const normalizedName = this.normalizeName(name);
    if (!normalizedName) {
      throw new BadRequestException(
        "Canonical project name cannot be normalized."
      );
    }
    const requestedSlug = this.normalizeSlug(input.slug || name);
    const collision = await this.canonicalProjectModel
      .findOne({
        status: { $nin: ["merged", "deprecated"] },
        $or: [
          { normalizedName },
          ...(requestedSlug ? [{ slug: requestedSlug }] : []),
        ],
      })
      .select("_id name slug symbol")
      .lean();
    if (collision) {
      throw new ConflictException({
        message:
          "A canonical project with the same identity already exists; select it instead.",
        candidate: this.presentCanonicalProject(collision),
      });
    }

    const symbol = this.cleanString(input.symbol)?.toUpperCase();
    const metadata = this.sanitizeMetadata({
      logo: input.logo,
      website: input.website,
      description: input.description,
      createdForLaunchpad: true,
    });
    try {
      return await this.canonicalProjectModel.create({
        name,
        normalizedName,
        slug: requestedSlug || undefined,
        symbol,
        normalizedSymbol: symbol,
        status: "proposed",
        primaryWebsiteDomain: this.websiteDomain(input.website),
        createdBy: "manual",
        createdForLaunchpad: true,
        launchpadIdentityKey: normalizedName,
        originSourceType: "launchpad_admin",
        identitySource: "launchpad_admin",
        identityConfidence: "medium",
        sourceEvidence: {
          createdByAdmin: actor,
          createdAt: new Date().toISOString(),
        },
        metadata,
      });
    } catch (error: any) {
      if (error?.code !== 11000) throw error;
      const existing = await this.canonicalProjectModel
        .findOne({ launchpadIdentityKey: normalizedName })
        .lean();
      throw new ConflictException({
        message:
          "A canonical project for this Launchpad identity was created concurrently; select it instead.",
        candidate: existing
          ? this.presentCanonicalProject(existing)
          : undefined,
      });
    }
  }

  private normalizeAndValidateCreateParams(
    input: FomoV2LaunchpadCreateDraftDto
  ): FomoV2LaunchpadCreateParams {
    const params: FomoV2LaunchpadCreateParams = {
      investToken: this.normalizeAddress(input.investToken),
      targetAmount: input.targetAmount,
      greenSeats: input.greenSeats,
      yellowSeats: input.yellowSeats,
      stakeStart: input.stakeStart,
      greenStart: input.greenStart,
      greenEnd: input.greenEnd,
      yellowSlotDuration: input.yellowSlotDuration,
      minInvestment: input.minInvestment,
      feePercent: input.feePercent,
    };
    this.validateCreateParams(params);
    return params;
  }

  private validateCreateParams(params: FomoV2LaunchpadCreateParams): void {
    const deployment = this.getConfig();
    if (
      params.investToken.toLowerCase() !==
      deployment.investTokenAddress.toLowerCase()
    ) {
      throw new BadRequestException(
        `investToken must match configured token ${deployment.investTokenAddress}.`
      );
    }
    const targetAmount = this.parseUint(
      params.targetAmount,
      "targetAmount",
      "uint256"
    );
    const greenSeats = this.parseUint(
      params.greenSeats,
      "greenSeats",
      "uint32"
    );
    this.parseUint(params.yellowSeats, "yellowSeats", "uint32");
    const stakeStart = this.parseUint(
      params.stakeStart,
      "stakeStart",
      "uint64"
    );
    const greenStart = this.parseUint(
      params.greenStart,
      "greenStart",
      "uint64"
    );
    const greenEnd = this.parseUint(params.greenEnd, "greenEnd", "uint64");
    const yellowSlotDuration = this.parseUint(
      params.yellowSlotDuration,
      "yellowSlotDuration",
      "uint64"
    );
    const minInvestment = this.parseUint(
      params.minInvestment,
      "minInvestment",
      "uint256"
    );
    const feePercent = this.parseUint(
      params.feePercent,
      "feePercent",
      "uint16"
    );
    if (targetAmount === BigInt(0))
      throw new BadRequestException("targetAmount must be greater than zero.");
    if (greenSeats === BigInt(0))
      throw new BadRequestException("greenSeats must be greater than zero.");
    if (yellowSlotDuration === BigInt(0)) {
      throw new BadRequestException(
        "yellowSlotDuration must be greater than zero."
      );
    }
    if (minInvestment === BigInt(0)) {
      throw new BadRequestException(
        "minInvestment must be explicit and greater than zero."
      );
    }
    if (feePercent > BigInt(100)) {
      throw new BadRequestException("feePercent must be between 0 and 100.");
    }
    if (!(stakeStart < greenStart && greenStart < greenEnd)) {
      throw new BadRequestException(
        "Schedule must satisfy stakeStart < greenStart < greenEnd."
      );
    }
    const minimumStakeStart = BigInt(Math.floor(Date.now() / 1000) + 60);
    if (stakeStart < minimumStakeStart) {
      throw new BadRequestException(
        "stakeStart must be at least 60 seconds in the future when the draft is saved."
      );
    }
  }

  private parseUint(
    value: string,
    field: string,
    type: keyof typeof UINT_LIMITS
  ): bigint {
    if (!/^(0|[1-9][0-9]*)$/.test(String(value))) {
      throw new BadRequestException(
        `${field} must be an unsigned decimal integer string.`
      );
    }
    const parsed = BigInt(value);
    if (parsed > UINT_LIMITS[type]) {
      throw new BadRequestException(`${field} exceeds ${type}.`);
    }
    return parsed;
  }

  private assertDeployment(chainId: number, launchpadAddress: string): void {
    try {
      this.deploymentService.assertExpectedDeployment(
        chainId,
        launchpadAddress
      );
    } catch (error: any) {
      throw new BadRequestException(String(error?.message || error));
    }
  }

  private pickCreateParams(input: FomoV2LaunchpadPatchDraftDto) {
    const fields: Array<keyof FomoV2LaunchpadCreateParams> = [
      "investToken",
      "targetAmount",
      "greenSeats",
      "yellowSeats",
      "stakeStart",
      "greenStart",
      "greenEnd",
      "yellowSlotDuration",
      "minInvestment",
      "feePercent",
    ];
    const output: Partial<FomoV2LaunchpadCreateParams> = {};
    for (const field of fields) {
      if (input[field] !== undefined) {
        (output as any)[field] =
          field === "investToken"
            ? this.normalizeAddress(input[field] as string)
            : input[field];
      }
    }
    return output;
  }

  private async findPool(
    id: string,
    document: true
  ): Promise<FomoV2LaunchpadPoolDocument>;
  private async findPool(id: string, document: boolean): Promise<any>;
  private async findPool(id: string, _document: boolean): Promise<any> {
    if (!Types.ObjectId.isValid(id)) {
      throw new NotFoundException("Launchpad pool not found.");
    }
    const pool = await this.poolModel.findById(id);
    if (!pool) throw new NotFoundException("Launchpad pool not found.");
    return pool;
  }

  private async loadCanonicalProjects(rows: any[]): Promise<Map<string, any>> {
    const ids = Array.from(
      new Set(rows.map((row) => String(row.canonicalProjectId)).filter(Boolean))
    ).map((id) => new Types.ObjectId(id));
    if (!ids.length) return new Map();
    const projects = await this.canonicalProjectModel
      .find({ _id: { $in: ids } })
      .lean();
    return new Map(
      projects.map((project: any) => [String(project._id), project])
    );
  }

  private async cleanupUnusedLaunchpadCanonicalProject(
    canonicalProjectId: any
  ): Promise<void> {
    try {
      const linkedPools = await this.poolModel.countDocuments({
        canonicalProjectId,
      });
      if (linkedPools > 0) return;
      await this.canonicalProjectModel.deleteOne({
        _id: canonicalProjectId,
        createdForLaunchpad: true,
        launchpadIdentityKey: { $type: "string" },
      });
    } catch {
      // Compensation is best-effort; a created canonical remains reusable if cleanup fails.
    }
  }

  private presentPool(pool: any, canonicalProject?: any) {
    return {
      id: String(pool._id),
      canonicalProjectId: String(pool.canonicalProjectId),
      canonicalProject: canonicalProject
        ? this.presentCanonicalProject(canonicalProject)
        : undefined,
      slug: pool.slug,
      schemaVersion: pool.schemaVersion || 1,
      status: pool.status,
      publicationStatus: pool.publicationStatus,
      chainId: pool.chainId,
      launchpadAddress: pool.launchpadAddress,
      poolId: pool.poolId,
      predictedPoolId: pool.predictedPoolId,
      createParams: pool.createParams,
      launchDetails: pool.launchDetails || {},
      metadata: pool.metadata || {},
      onchainState: pool.onchainState || {},
      createTransaction: pool.createTransaction,
      createTransactionHistory: pool.createTransactionHistory || [],
      revision: pool.revision,
      idempotencyKey: pool.idempotencyKey,
      createdBy: pool.createdBy,
      updatedBy: pool.updatedBy,
      publishedAt: pool.publishedAt,
      publishedBy: pool.publishedBy,
      createdAt: pool.createdAt,
      updatedAt: pool.updatedAt,
    };
  }

  private presentCanonicalProject(project: any) {
    const metadata = project?.metadata || {};
    return {
      id: String(project?._id || ""),
      name: project?.name,
      slug: project?.slug,
      symbol: project?.symbol,
      logo: metadata.logo,
      website:
        metadata.website ||
        (project?.primaryWebsiteDomain
          ? `https://${project.primaryWebsiteDomain}`
          : undefined),
      description: metadata.description,
      status: project?.status,
      createdForLaunchpad: Boolean(project?.createdForLaunchpad),
      originSourceType: project?.originSourceType,
      createdAt: project?.createdAt,
      updatedAt: project?.updatedAt,
    };
  }

  private presentOperation(operation: any) {
    return {
      id: String(operation._id),
      launchpadPoolId: operation.launchpadPoolId
        ? String(operation.launchpadPoolId)
        : undefined,
      chainId: operation.chainId,
      launchpadAddress: operation.launchpadAddress,
      onchainPoolId: operation.onchainPoolId,
      type: operation.type,
      transactionHash: operation.transactionHash,
      from: operation.from,
      nonce: operation.nonce,
      calldataValidated: operation.calldataValidated,
      to: operation.to,
      blockNumber: operation.blockNumber,
      blockHash: operation.blockHash,
      confirmations: operation.confirmations,
      params: operation.params || {},
      requestedParams: operation.requestedParams || {},
      observedParams: operation.observedParams || {},
      status: operation.status,
      submittedAt: operation.submittedAt,
      confirmedAt: operation.confirmedAt,
      lastCheckedAt: operation.lastCheckedAt,
      verificationError: operation.verificationError,
      createdBy: operation.createdBy,
      createdAt: operation.createdAt,
      updatedAt: operation.updatedAt,
    };
  }

  private presentVerification(
    verification: FomoV2LaunchpadTxVerification,
    pool: FomoV2LaunchpadPoolDocument
  ) {
    return {
      ...verification,
      poolId: verification.poolId,
      predictedPoolId: pool.predictedPoolId,
      predictionMatches:
        !verification.poolId || !pool.predictedPoolId
          ? undefined
          : verification.poolId === pool.predictedPoolId,
    };
  }

  private normalizeOperationRequestedParams(
    type: FomoV2LaunchpadOperationType,
    value: any
  ): Record<string, string> {
    const params = this.sanitizeMetadata(value);
    const uint = (
      key: string,
      solidityType: keyof typeof UINT_LIMITS,
      allowZero = true
    ) => {
      const parsed = this.parseUint(String(params[key] ?? ""), key, solidityType);
      if (!allowZero && parsed === BigInt(0)) {
        throw new BadRequestException(`${key} must be greater than zero.`);
      }
      return parsed.toString();
    };
    const address = () => this.normalizeAddress(String(params.address || ""));

    switch (type) {
      case "update_pool_fee_percent": {
        const feePercent = uint("feePercent", "uint16");
        if (BigInt(feePercent) > BigInt(100)) {
          throw new BadRequestException("feePercent must be between 0 and 100.");
        }
        return { feePercent };
      }
      case "update_pool_min_investment":
        return {
          minInvestment: uint("minInvestment", "uint256", false),
        };
      case "deposit_project_tokens":
        return {
          projectToken: this.normalizeAddress(String(params.projectToken || "")),
          amount: uint("amount", "uint256", false),
        };
      case "close_pool":
      case "admin_unstake_all_pool_users":
        return {};
      case "add_admin":
      case "remove_admin":
      case "set_investment_receiver":
      case "set_fee_receiver":
      case "transfer_ownership":
        return { address: address() };
      default:
        throw new BadRequestException(`Unsupported operation type ${type}.`);
    }
  }

  private assertSameOperationIntent(
    operation: any,
    requestedParams: Record<string, string>
  ): void {
    const stored = this.plainObject<Record<string, string>>(
      operation.requestedParams || {}
    );
    if (Object.keys(stored).length === 0) {
      operation.requestedParams = requestedParams;
      return;
    }
    if (JSON.stringify(stored) !== JSON.stringify(requestedParams)) {
      throw new ConflictException(
        "Transaction hash is already registered with different requested parameters."
      );
    }
  }

  private operationIntentMismatch(
    type: FomoV2LaunchpadOperationType,
    requested: Record<string, any>,
    observed: Record<string, any>
  ): string | undefined {
    const mismatch = (field: string, expected: any, actual: any) =>
      String(expected) === String(actual)
        ? undefined
        : `Operation intent mismatch for ${field}: requested ${String(expected)}, mined ${String(actual)}.`;
    const addressMismatch = (field: string, expected: any, actual: any) => {
      try {
        return this.normalizeAddress(String(expected)) ===
          this.normalizeAddress(String(actual))
          ? undefined
          : `Operation intent mismatch for ${field}: requested ${String(expected)}, mined ${String(actual)}.`;
      } catch {
        return `Operation intent mismatch for ${field}: mined value is not a valid address.`;
      }
    };

    switch (type) {
      case "update_pool_fee_percent":
        return mismatch(
          "feePercent",
          requested.feePercent,
          observed.newFeePercent
        );
      case "update_pool_min_investment":
        return mismatch(
          "minInvestment",
          requested.minInvestment,
          observed.newMinInvestment
        );
      case "deposit_project_tokens":
        return (
          addressMismatch(
            "projectToken",
            requested.projectToken,
            observed.projectToken
          ) || mismatch("amount", requested.amount, observed.amount)
        );
      case "add_admin":
      case "remove_admin":
        return addressMismatch("admin", requested.address, observed.admin);
      case "set_investment_receiver":
      case "set_fee_receiver":
        return addressMismatch(
          "receiver",
          requested.address,
          observed.newReceiver
        );
      case "transfer_ownership":
        return addressMismatch(
          "newOwner",
          requested.address,
          observed.newOwner
        );
      case "close_pool":
      case "admin_unstake_all_pool_users":
        return undefined;
      default:
        return `Unsupported operation type ${type}.`;
    }
  }

  private sanitizeMetadata(value: any): Record<string, any> {
    if (!value || typeof value !== "object" || Array.isArray(value)) return {};
    const serialized = JSON.stringify(value);
    if (serialized.length > 100_000) {
      throw new BadRequestException("metadata exceeds 100KB.");
    }
    const sanitize = (item: any, depth: number): any => {
      if (depth > 8)
        throw new BadRequestException("metadata nesting is too deep.");
      if (Array.isArray(item))
        return item.slice(0, 500).map((entry) => sanitize(entry, depth + 1));
      if (item && typeof item === "object") {
        const output: Record<string, any> = {};
        for (const [key, entry] of Object.entries(item)) {
          if (key.startsWith("$") || key.includes(".")) continue;
          output[key] = sanitize(entry, depth + 1);
        }
        return output;
      }
      if (
        ["string", "number", "boolean"].includes(typeof item) ||
        item === null
      ) {
        return item;
      }
      return undefined;
    };
    return sanitize(value, 0);
  }

  private sanitizeLaunchDetails(value: any): FomoV2LaunchpadDetails {
    return this.sanitizeMetadata(value) as FomoV2LaunchpadDetails;
  }

  private strictImageBuffer(file: any): Buffer {
    const buffer = Buffer.isBuffer(file?.buffer)
      ? file.buffer
      : file?.buffer instanceof Uint8Array
        ? Buffer.from(file.buffer)
        : undefined;
    if (!buffer?.length) throw new BadRequestException("Image file is required.");
    const configuredMb = Number(process.env.FOMO_V2_LAUNCHPAD_MEDIA_MAX_MB || 10);
    const maxBytes =
      (Number.isFinite(configuredMb) && configuredMb > 0 ? configuredMb : 10) *
      1024 *
      1024;
    if (buffer.length > maxBytes) throw new BadRequestException("Image file is too large.");
    const detected = this.detectImageMimeType(buffer);
    if (!detected) {
      throw new BadRequestException("Only valid JPEG, PNG, WebP, or GIF images are accepted.");
    }
    const declared = String(file?.mimeType || file?.mimetype || "")
      .toLowerCase()
      .split(";")[0];
    if (declared && declared !== detected) {
      throw new BadRequestException("Image MIME type does not match file content.");
    }
    return buffer;
  }

  private detectImageMimeType(buffer: Buffer): string | undefined {
    if (buffer.length >= 3 && buffer[0] === 0xff && buffer[1] === 0xd8 && buffer[2] === 0xff) {
      return "image/jpeg";
    }
    if (
      buffer.length >= 8 &&
      buffer[0] === 0x89 &&
      buffer[1] === 0x50 &&
      buffer[2] === 0x4e &&
      buffer[3] === 0x47 &&
      buffer[4] === 0x0d &&
      buffer[5] === 0x0a &&
      buffer[6] === 0x1a &&
      buffer[7] === 0x0a
    ) return "image/png";
    if (buffer.length >= 6 && /^GIF8[79]a$/.test(buffer.slice(0, 6).toString("ascii"))) {
      return "image/gif";
    }
    if (
      buffer.length >= 12 &&
      buffer.slice(0, 4).toString("ascii") === "RIFF" &&
      buffer.slice(8, 12).toString("ascii") === "WEBP"
    ) return "image/webp";
    return undefined;
  }

  private plainObject<T = Record<string, any>>(value: any): T {
    if (value && typeof value.toObject === "function") {
      return value.toObject({ depopulate: true }) as T;
    }
    return { ...(value || {}) } as T;
  }

  private normalizeAddress(value: string): string {
    try {
      return this.deploymentService.normalizeAddress(value);
    } catch {
      throw new BadRequestException(`${value} is not a valid EVM address.`);
    }
  }

  private normalizeName(value: string): string {
    return value
      .normalize("NFKD")
      .trim()
      .toLowerCase()
      .replace(/&/g, "and")
      .replace(/[^a-z0-9]+/g, " ")
      .replace(/\s+/g, " ")
      .trim();
  }

  private normalizeSlug(value: string): string {
    return String(value || "")
      .normalize("NFKD")
      .trim()
      .toLowerCase()
      .replace(/['"]/g, "")
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "");
  }

  private websiteDomain(value?: string): string | undefined {
    if (!value) return undefined;
    try {
      return new URL(value).hostname.toLowerCase().replace(/^www\./, "");
    } catch {
      return undefined;
    }
  }

  private actor(user: any): string {
    return (
      this.cleanString(user?._id || user?.id || user?.sub || user?.email) ||
      "admin"
    );
  }

  private cleanString(value: any): string | undefined {
    const text = String(value || "").trim();
    return text || undefined;
  }

  private escapeRegExp(value: string): string {
    return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  }
}
