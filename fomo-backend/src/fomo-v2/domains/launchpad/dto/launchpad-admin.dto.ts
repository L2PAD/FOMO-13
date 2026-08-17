import { Transform, Type } from "class-transformer";
import {
  IsIn,
  IsInt,
  IsMongoId,
  IsObject,
  IsOptional,
  IsString,
  IsUrl,
  Matches,
  Max,
  MaxLength,
  Min,
  ValidateNested,
} from "class-validator";
import {
  FOMO_V2_LAUNCHPAD_OPERATION_TYPES,
  FOMO_V2_LAUNCHPAD_POOL_STATUSES,
  FOMO_V2_LAUNCHPAD_PUBLICATION_STATUSES,
  FomoV2LaunchpadOperationType,
  FomoV2LaunchpadPoolStatus,
  FomoV2LaunchpadPublicationStatus,
} from "../types";
import {
  FomoV2LaunchpadDetailsDto,
  LAUNCHPAD_SLUG_PATTERN,
} from "./launchpad-details.dto";

const ADDRESS_PATTERN = /^0x[a-fA-F0-9]{40}$/;
const TX_HASH_PATTERN = /^0x[a-fA-F0-9]{64}$/;
const RAW_UINT_PATTERN = /^(0|[1-9][0-9]*)$/;

const emptyToUndefined = (value: any): any =>
  value === "" || value === null ? undefined : value;

const toInteger = (value: any): number | undefined => {
  if (value === undefined || value === null || value === "") return undefined;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? Math.trunc(parsed) : undefined;
};

export class FomoV2LaunchpadNewCanonicalProjectDto {
  @IsString()
  @MaxLength(300)
  name: string;

  @IsOptional()
  @IsString()
  @MaxLength(40)
  symbol?: string;

  @IsOptional()
  @IsString()
  @MaxLength(160)
  @Matches(/^[a-zA-Z0-9]+(?:-[a-zA-Z0-9]+)*$/)
  slug?: string;

  @IsOptional()
  @IsString()
  @MaxLength(2048)
  logo?: string;

  @IsOptional()
  @IsUrl(
    { require_protocol: true },
    { message: "website must be an absolute URL" }
  )
  @MaxLength(2048)
  website?: string;

  @IsOptional()
  @IsString()
  @MaxLength(50_000)
  description?: string;
}

export class FomoV2LaunchpadCreateDraftDto {
  @IsOptional()
  @IsMongoId()
  canonicalProjectId?: string;

  @IsOptional()
  @ValidateNested()
  @Type(() => FomoV2LaunchpadNewCanonicalProjectDto)
  newCanonicalProject?: FomoV2LaunchpadNewCanonicalProjectDto;

  @IsOptional()
  @IsString()
  @MaxLength(160)
  @Matches(LAUNCHPAD_SLUG_PATTERN)
  slug?: string;

  @IsOptional()
  @IsObject()
  @ValidateNested()
  @Type(() => FomoV2LaunchpadDetailsDto)
  launchDetails?: FomoV2LaunchpadDetailsDto;

  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(Number.MAX_SAFE_INTEGER)
  chainId: number;

  @IsString()
  @Matches(ADDRESS_PATTERN)
  launchpadAddress: string;

  @IsString()
  @Matches(ADDRESS_PATTERN)
  investToken: string;

  @IsString()
  @Matches(RAW_UINT_PATTERN)
  targetAmount: string;

  @IsString()
  @Matches(RAW_UINT_PATTERN)
  greenSeats: string;

  @IsString()
  @Matches(RAW_UINT_PATTERN)
  yellowSeats: string;

  @IsString()
  @Matches(RAW_UINT_PATTERN)
  stakeStart: string;

  @IsString()
  @Matches(RAW_UINT_PATTERN)
  greenStart: string;

  @IsString()
  @Matches(RAW_UINT_PATTERN)
  greenEnd: string;

  @IsString()
  @Matches(RAW_UINT_PATTERN)
  yellowSlotDuration: string;

  @IsString()
  @Matches(RAW_UINT_PATTERN)
  minInvestment: string;

  @IsString()
  @Matches(RAW_UINT_PATTERN)
  feePercent: string;

  @IsOptional()
  @IsObject()
  metadata?: Record<string, any>;

  @IsOptional()
  @IsString()
  @MaxLength(200)
  @Matches(/^[a-zA-Z0-9_.:-]+$/)
  idempotencyKey?: string;
}

export class FomoV2LaunchpadPatchDraftDto {
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  expectedRevision?: number;

  @IsOptional()
  @IsString()
  @Matches(ADDRESS_PATTERN)
  investToken?: string;

  @IsOptional()
  @IsString()
  @Matches(RAW_UINT_PATTERN)
  targetAmount?: string;

  @IsOptional()
  @IsString()
  @Matches(RAW_UINT_PATTERN)
  greenSeats?: string;

  @IsOptional()
  @IsString()
  @Matches(RAW_UINT_PATTERN)
  yellowSeats?: string;

  @IsOptional()
  @IsString()
  @Matches(RAW_UINT_PATTERN)
  stakeStart?: string;

  @IsOptional()
  @IsString()
  @Matches(RAW_UINT_PATTERN)
  greenStart?: string;

  @IsOptional()
  @IsString()
  @Matches(RAW_UINT_PATTERN)
  greenEnd?: string;

  @IsOptional()
  @IsString()
  @Matches(RAW_UINT_PATTERN)
  yellowSlotDuration?: string;

  @IsOptional()
  @IsString()
  @Matches(RAW_UINT_PATTERN)
  minInvestment?: string;

  @IsOptional()
  @IsString()
  @Matches(RAW_UINT_PATTERN)
  feePercent?: string;

  @IsOptional()
  @IsObject()
  metadata?: Record<string, any>;
}

export class FomoV2LaunchpadConfirmCreateDto {
  @IsString()
  @Matches(TX_HASH_PATTERN)
  txHash: string;

  @IsOptional()
  @IsString()
  @Matches(RAW_UINT_PATTERN)
  predictedPoolId?: string;

  @IsOptional()
  @IsString()
  @Matches(TX_HASH_PATTERN)
  replacesTxHash?: string;
}

export class FomoV2LaunchpadConfirmCreateCancellationDto {
  @IsString()
  @Matches(TX_HASH_PATTERN)
  replacementTxHash: string;
}

export class FomoV2LaunchpadCreateOperationDto {
  @IsIn(
    FOMO_V2_LAUNCHPAD_OPERATION_TYPES.filter((type) => type !== "create_pool")
  )
  type: Exclude<FomoV2LaunchpadOperationType, "create_pool">;

  @IsString()
  @Matches(TX_HASH_PATTERN)
  txHash: string;

  @IsOptional()
  @IsObject()
  params?: Record<string, any>;
}

export class FomoV2LaunchpadPublicationDto {
  @IsIn(FOMO_V2_LAUNCHPAD_PUBLICATION_STATUSES)
  publicationStatus: FomoV2LaunchpadPublicationStatus;
}

export class FomoV2LaunchpadProjectQueryDto {
  @IsOptional()
  @Transform(({ value }) => emptyToUndefined(value))
  @IsString()
  @MaxLength(200)
  search?: string;

  @IsOptional()
  @Transform(({ value }) => toInteger(value))
  @IsInt()
  @Min(1)
  @Max(100)
  limit?: number;

  @IsOptional()
  @Transform(({ value }) => toInteger(value))
  @IsInt()
  @Min(0)
  @Max(1_000_000)
  offset?: number;
}

export class FomoV2LaunchpadPoolQueryDto extends FomoV2LaunchpadProjectQueryDto {
  @IsOptional()
  @IsIn(FOMO_V2_LAUNCHPAD_POOL_STATUSES)
  status?: FomoV2LaunchpadPoolStatus;

  @IsOptional()
  @IsIn(FOMO_V2_LAUNCHPAD_PUBLICATION_STATUSES)
  publicationStatus?: FomoV2LaunchpadPublicationStatus;

  @IsOptional()
  @IsMongoId()
  canonicalProjectId?: string;
}
