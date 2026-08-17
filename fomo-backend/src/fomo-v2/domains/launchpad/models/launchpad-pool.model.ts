import { Prop, Schema, SchemaFactory } from "@nestjs/mongoose";
import mongoose, { HydratedDocument, Types } from "mongoose";
import {
  FOMO_V2_LAUNCHPAD_POOL_STATUSES,
  FOMO_V2_LAUNCHPAD_PUBLICATION_STATUSES,
  FOMO_V2_LAUNCHPAD_FAILURE_KINDS,
  FomoV2LaunchpadCreateParams,
  FomoV2LaunchpadDetails,
  FomoV2LaunchpadFailureKind,
  FomoV2LaunchpadPoolStatus,
  FomoV2LaunchpadPublicationStatus,
} from "../types";

export type FomoV2LaunchpadPoolDocument = HydratedDocument<FomoV2LaunchpadPool>;

const FomoV2LaunchpadCreateParamsSchema = new mongoose.Schema(
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

const FomoV2LaunchpadCreateTransactionSchema = new mongoose.Schema(
  {
    transactionHash: { type: String, required: true },
    replacesTransactionHash: { type: String },
    from: { type: String },
    nonce: { type: String },
    calldataValidated: { type: Boolean },
    to: { type: String },
    blockNumber: { type: String },
    blockHash: { type: String },
    logIndex: { type: String },
    observedPoolId: { type: String },
    confirmations: { type: Number, min: 0 },
    failureKind: { type: String, enum: FOMO_V2_LAUNCHPAD_FAILURE_KINDS },
    safeToRetry: { type: Boolean, required: true, default: false },
    cancelledByTransactionHash: { type: String },
    cancellationFrom: { type: String },
    cancellationNonce: { type: String },
    cancellationTo: { type: String },
    cancellationBlockNumber: { type: String },
    cancellationBlockHash: { type: String },
    cancellationConfirmations: { type: Number, min: 0 },
    cancelledAt: { type: Date },
    submittedAt: { type: Date, required: true },
    confirmedAt: { type: Date },
    lastCheckedAt: { type: Date },
    verificationError: { type: String },
  },
  { _id: false, strict: true }
);

const FomoV2LaunchpadFaqSchema = new mongoose.Schema(
  {
    question: { type: String, required: true },
    answer: { type: String, required: true },
  },
  { _id: false, strict: true }
);

const FomoV2LaunchpadDocumentSchema = new mongoose.Schema(
  {
    title: { type: String, required: true },
    url: { type: String, required: true },
    type: { type: String },
  },
  { _id: false, strict: true }
);

const FomoV2LaunchpadInvestorSchema = new mongoose.Schema(
  {
    id: { type: String },
    name: { type: String, required: true },
    logoUrl: { type: String },
    website: { type: String },
  },
  { _id: false, strict: true }
);

const FomoV2LaunchpadTeamMemberSchema = new mongoose.Schema(
  {
    id: { type: String },
    name: { type: String, required: true },
    role: { type: String },
    avatarUrl: { type: String },
    website: { type: String },
  },
  { _id: false, strict: true }
);

const FomoV2LaunchpadDetailsSchema = new mongoose.Schema(
  {
    title: { type: String },
    shortDescription: { type: String },
    description: { type: String },
    saleType: { type: String },
    category: { type: String },
    logoUrl: { type: String },
    bannerUrl: { type: String },
    gallery: { type: [String], default: [] },
    about: { type: String },
    problem: { type: String },
    solution: { type: String },
    tokenUtility: { type: String },
    revenueModel: { type: String },
    zoneDescriptions: {
      type: new mongoose.Schema(
        {
          green: { type: String },
          yellow: { type: String },
          red: { type: String },
        },
        { _id: false, strict: true }
      ),
    },
    participationRules: { type: [String], default: [] },
    faq: { type: [FomoV2LaunchpadFaqSchema], default: [] },
    links: {
      type: new mongoose.Schema(
        {
          website: { type: String },
          twitter: { type: String },
          telegram: { type: String },
          discord: { type: String },
          whitepaper: { type: String },
        },
        { _id: false, strict: true }
      ),
    },
    documents: { type: [FomoV2LaunchpadDocumentSchema], default: [] },
    investors: { type: [FomoV2LaunchpadInvestorSchema], default: [] },
    team: { type: [FomoV2LaunchpadTeamMemberSchema], default: [] },
    analysisFlags: {
      type: new mongoose.Schema(
        {
          green: { type: [String], default: [] },
          yellow: { type: [String], default: [] },
          red: { type: [String], default: [] },
        },
        { _id: false, strict: true }
      ),
    },
    funding: {
      type: new mongoose.Schema(
        {
          totalRaisedLabel: { type: String },
          fundingType: { type: String },
        },
        { _id: false, strict: true }
      ),
    },
    flags: {
      type: new mongoose.Schema(
        {
          showLeaderboard: { type: Boolean },
          showParticipants: { type: Boolean },
          showCountdown: { type: Boolean },
        },
        { _id: false, strict: true }
      ),
    },
    tokenDisplay: {
      type: new mongoose.Schema(
        {
          name: { type: String },
          symbol: { type: String },
          decimals: { type: Number, min: 0, max: 255 },
          priceLabel: { type: String },
          allocationLabel: { type: String },
        },
        { _id: false, strict: true }
      ),
    },
  },
  { _id: false, strict: true }
);

@Schema({
  collection: "launchpad_pools",
  timestamps: true,
  strict: true,
  autoIndex: false,
  optimisticConcurrency: true,
})
export class FomoV2LaunchpadPool {
  _id?: Types.ObjectId;
  createdAt?: Date;
  updatedAt?: Date;

  @Prop({
    type: mongoose.Schema.Types.ObjectId,
    ref: "FomoV2CanonicalProject",
    required: true,
  })
  canonicalProjectId: Types.ObjectId;

  @Prop({ type: String })
  slug?: string;

  @Prop({ type: Number, required: true, default: 2, min: 1 })
  schemaVersion: number;

  @Prop({ type: Number, required: true, min: 1 })
  chainId: number;

  @Prop({ type: String, required: true })
  launchpadAddress: string;

  @Prop({ type: String })
  poolId?: string;

  @Prop({ type: String })
  predictedPoolId?: string;

  @Prop({ type: FomoV2LaunchpadCreateParamsSchema, required: true })
  createParams: FomoV2LaunchpadCreateParams;

  @Prop({ type: FomoV2LaunchpadDetailsSchema, default: {} })
  launchDetails: FomoV2LaunchpadDetails;

  @Prop({ type: mongoose.Schema.Types.Mixed, default: {} })
  metadata: Record<string, any>;

  @Prop({ type: mongoose.Schema.Types.Mixed, default: {} })
  onchainState: Record<string, any>;

  @Prop({ type: FomoV2LaunchpadCreateTransactionSchema })
  createTransaction?: {
    transactionHash: string;
    replacesTransactionHash?: string;
    from?: string;
    nonce?: string;
    calldataValidated?: boolean;
    to?: string;
    blockNumber?: string;
    blockHash?: string;
    logIndex?: string;
    observedPoolId?: string;
    confirmations?: number;
    failureKind?: FomoV2LaunchpadFailureKind;
    safeToRetry: boolean;
    cancelledByTransactionHash?: string;
    cancellationFrom?: string;
    cancellationNonce?: string;
    cancellationTo?: string;
    cancellationBlockNumber?: string;
    cancellationBlockHash?: string;
    cancellationConfirmations?: number;
    cancelledAt?: Date;
    submittedAt: Date;
    confirmedAt?: Date;
    lastCheckedAt?: Date;
    verificationError?: string;
  };

  @Prop({ type: [FomoV2LaunchpadCreateTransactionSchema], default: [] })
  createTransactionHistory: Array<FomoV2LaunchpadPool["createTransaction"]>;

  @Prop({
    type: String,
    enum: FOMO_V2_LAUNCHPAD_POOL_STATUSES,
    required: true,
    default: "draft",
  })
  status: FomoV2LaunchpadPoolStatus;

  @Prop({
    type: String,
    enum: FOMO_V2_LAUNCHPAD_PUBLICATION_STATUSES,
    required: true,
    default: "draft",
  })
  publicationStatus: FomoV2LaunchpadPublicationStatus;

  @Prop({ type: Number, required: true, default: 0, min: 0 })
  revision: number;

  @Prop({ type: String })
  idempotencyKey?: string;

  @Prop({ type: String })
  createdBy?: string;

  @Prop({ type: String })
  updatedBy?: string;

  @Prop({ type: Date })
  publishedAt?: Date;

  @Prop({ type: String })
  publishedBy?: string;
}

export const FomoV2LaunchpadPoolSchema =
  SchemaFactory.createForClass(FomoV2LaunchpadPool);

FomoV2LaunchpadPoolSchema.index(
  { chainId: 1, launchpadAddress: 1, poolId: 1 },
  {
    unique: true,
    partialFilterExpression: { poolId: { $type: "string" } },
    name: "uniq_launchpad_pool_chain_contract_pool_id",
  }
);
FomoV2LaunchpadPoolSchema.index(
  { slug: 1 },
  {
    unique: true,
    partialFilterExpression: { slug: { $type: "string" } },
    name: "uniq_launchpad_pool_slug",
  }
);
FomoV2LaunchpadPoolSchema.index(
  { canonicalProjectId: 1, createdAt: -1 },
  { name: "idx_launchpad_pools_canonical_created_at" }
);
FomoV2LaunchpadPoolSchema.index(
  { status: 1, publicationStatus: 1, updatedAt: -1 },
  { name: "idx_launchpad_pools_status_publication" }
);
FomoV2LaunchpadPoolSchema.index(
  { chainId: 1, launchpadAddress: 1, idempotencyKey: 1 },
  {
    unique: true,
    partialFilterExpression: { idempotencyKey: { $type: "string" } },
    name: "uniq_launchpad_pool_idempotency_key",
  }
);
FomoV2LaunchpadPoolSchema.index(
  { "createTransaction.transactionHash": 1 },
  {
    unique: true,
    partialFilterExpression: {
      "createTransaction.transactionHash": { $type: "string" },
    },
    name: "uniq_launchpad_pool_create_tx_hash",
  }
);
