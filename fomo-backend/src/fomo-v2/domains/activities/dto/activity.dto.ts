import { Transform, Type } from "class-transformer";
import {
  ArrayMaxSize,
  IsArray,
  IsBoolean,
  IsDate,
  IsIn,
  IsInt,
  IsMongoId,
  IsNumber,
  IsOptional,
  IsString,
  Matches,
  Max,
  MaxLength,
  Min,
  ValidateIf,
  ValidateNested,
} from "class-validator";
import {
  FOMO_V2_ACTIVITY_ACCESS_TIERS,
  FOMO_V2_ACTIVITY_AI_PROPOSAL_STATUSES,
  FOMO_V2_ACTIVITY_CANONICAL_STATUSES,
  FOMO_V2_ACTIVITY_DIFFICULTIES,
  FOMO_V2_ACTIVITY_LIFECYCLE_STATUSES,
  FOMO_V2_ACTIVITY_PUBLICATION_STATUSES,
  FOMO_V2_ACTIVITY_REVIEW_STATUSES,
  FOMO_V2_ACTIVITY_TASK_FREQUENCIES,
} from "../types";

const toInteger = (value: any): number | undefined => {
  if (value === undefined || value === null || value === "") return undefined;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? Math.trunc(parsed) : undefined;
};

const emptyToUndefined = (value: any): any =>
  value === "" ? undefined : value;

const toBoolean = (value: any): boolean | undefined => {
  if (value === undefined || value === null || value === "") return undefined;
  if (typeof value === "boolean") return value;
  const normalized = String(value).trim().toLowerCase();
  if (["1", "true", "yes", "on"].includes(normalized)) return true;
  if (["0", "false", "no", "off"].includes(normalized)) return false;
  return undefined;
};

class FomoV2ActivityLinkDto {
  @IsString()
  @MaxLength(120)
  label: string;

  @IsString()
  @MaxLength(2048)
  url: string;
}

class FomoV2ActivitySocialLinksDto {
  @IsOptional()
  @IsString()
  @MaxLength(2048)
  website?: string;

  @IsOptional()
  @IsString()
  @MaxLength(2048)
  twitter?: string;

  @IsOptional()
  @IsString()
  @MaxLength(2048)
  telegram?: string;

  @IsOptional()
  @IsString()
  @MaxLength(2048)
  discord?: string;

  @IsOptional()
  @IsString()
  @MaxLength(2048)
  docs?: string;

  @IsOptional()
  @IsArray()
  @ArrayMaxSize(30)
  @ValidateNested({ each: true })
  @Type(() => FomoV2ActivityLinkDto)
  custom?: FomoV2ActivityLinkDto[];
}

class FomoV2ActivityDescriptionDto {
  @IsOptional()
  @IsString()
  @MaxLength(50_000)
  about?: string;

  @IsOptional()
  @IsString()
  @MaxLength(200_000)
  aboutHtml?: string;

  @IsOptional()
  @IsString()
  @MaxLength(50_000)
  howToParticipate?: string;

  @IsOptional()
  @IsString()
  @MaxLength(200_000)
  howToParticipateHtml?: string;
}

class FomoV2ActivityReviewScoreDto {
  @IsString()
  @MaxLength(120)
  label: string;

  @IsNumber({ allowInfinity: false, allowNaN: false })
  @Min(0)
  @Max(100)
  value: number;
}

class FomoV2ActivityReviewDto {
  @IsOptional()
  @IsString()
  @MaxLength(50_000)
  text?: string;

  @IsOptional()
  @IsString()
  @MaxLength(200_000)
  textHtml?: string;

  @IsOptional()
  @IsArray()
  @ArrayMaxSize(30)
  @ValidateNested({ each: true })
  @Type(() => FomoV2ActivityReviewScoreDto)
  scores?: FomoV2ActivityReviewScoreDto[];

  @IsOptional()
  @IsBoolean()
  isLocked?: boolean;
}

class FomoV2ActivityMetricsDto {
  @IsOptional()
  @IsString()
  @MaxLength(120)
  riskLevel?: string;

  @IsOptional()
  @IsString()
  @MaxLength(120)
  complexity?: string;

  @IsOptional()
  @IsString()
  @MaxLength(120)
  timeRequired?: string;

  @IsOptional()
  @IsString()
  @MaxLength(120)
  potentialReward?: string;
}

class FomoV2ActivityTimelineItemDto {
  @IsString()
  @MaxLength(200)
  title: string;

  @IsOptional()
  @Type(() => Date)
  @IsDate()
  date?: Date;

  @IsOptional()
  @IsString()
  @MaxLength(5000)
  description?: string;
}

class FomoV2ActivityFlagsDto {
  @IsOptional()
  @IsArray()
  @ArrayMaxSize(100)
  @IsString({ each: true })
  @MaxLength(500, { each: true })
  green?: string[];

  @IsOptional()
  @IsArray()
  @ArrayMaxSize(100)
  @IsString({ each: true })
  @MaxLength(500, { each: true })
  yellow?: string[];

  @IsOptional()
  @IsArray()
  @ArrayMaxSize(100)
  @IsString({ each: true })
  @MaxLength(500, { each: true })
  red?: string[];
}

class FomoV2ActivityTaskStepDto {
  @IsOptional()
  @IsString()
  @MaxLength(120)
  id?: string;

  @IsString()
  @MaxLength(300)
  title: string;

  @IsOptional()
  @IsString()
  @MaxLength(20_000)
  description?: string;

  @IsOptional()
  @IsString()
  @MaxLength(100_000)
  descriptionHtml?: string;

  @IsOptional()
  @IsString()
  @MaxLength(120)
  timeEstimate?: string;

  @IsOptional()
  @IsString()
  @MaxLength(120)
  ctaLabel?: string;

  @IsOptional()
  @IsString()
  @MaxLength(2048)
  ctaUrl?: string;

  @IsOptional()
  @IsString()
  @MaxLength(2048)
  image?: string;

  @IsOptional()
  @IsString()
  @MaxLength(2048)
  video?: string;
}

class FomoV2ActivityTaskGuideDto {
  @IsOptional()
  @IsString()
  @MaxLength(300)
  title?: string;

  @IsOptional()
  @IsString()
  @MaxLength(50_000)
  description?: string;

  @IsOptional()
  @IsString()
  @MaxLength(200_000)
  descriptionHtml?: string;

  @IsOptional()
  @IsString()
  @MaxLength(120)
  ctaLabel?: string;

  @IsOptional()
  @IsString()
  @MaxLength(2048)
  ctaUrl?: string;

  @IsOptional()
  @IsString()
  @MaxLength(1000)
  successMessage?: string;

  @IsOptional()
  @IsBoolean()
  isLocked?: boolean;

  @IsOptional()
  @IsArray()
  @ArrayMaxSize(100)
  @ValidateNested({ each: true })
  @Type(() => FomoV2ActivityTaskStepDto)
  steps?: FomoV2ActivityTaskStepDto[];
}

class FomoV2ActivityRewardDto {
  @IsOptional()
  @IsString()
  @MaxLength(300)
  label?: string;

  @IsOptional()
  @IsNumber({ allowInfinity: false, allowNaN: false })
  amount?: number;

  @IsOptional()
  @IsString()
  @MaxLength(50)
  currency?: string;

  @IsOptional()
  @IsString()
  @MaxLength(80)
  token?: string;

  @IsOptional()
  @IsString()
  @MaxLength(2000)
  description?: string;
}

class FomoV2ActivityRelatedAssetDto {
  @IsString()
  @MaxLength(200)
  name: string;

  @IsOptional()
  @IsString()
  @MaxLength(40)
  symbol?: string;

  @IsOptional()
  @IsString()
  @MaxLength(2048)
  image?: string;

  @IsOptional()
  @IsString()
  @MaxLength(160)
  slug?: string;
}

class FomoV2ActivityInvestorSnapshotDto {
  @IsOptional()
  @IsString()
  @MaxLength(120)
  id?: string;

  @IsString()
  @MaxLength(300)
  name: string;

  @IsOptional()
  @IsString()
  @MaxLength(160)
  slug?: string;

  @IsOptional()
  @IsString()
  @MaxLength(40)
  symbol?: string;

  @IsOptional()
  @IsString()
  @MaxLength(2048)
  logo?: string;

  @IsOptional()
  @IsString()
  @MaxLength(2048)
  website?: string;

  @IsOptional()
  @IsString()
  @MaxLength(80)
  source?: string;
}

export class FomoV2ActivityContentDto {
  @IsOptional()
  @IsString()
  @MaxLength(300)
  name?: string;

  @IsOptional()
  @IsString()
  @MaxLength(300)
  projectName?: string;

  @IsOptional()
  @IsString()
  @MaxLength(40)
  symbol?: string;

  @IsOptional()
  @IsString()
  @MaxLength(2048)
  logo?: string;

  @IsOptional()
  @IsString()
  @MaxLength(2048)
  projectLogo?: string;

  @IsOptional()
  @IsString()
  @MaxLength(80)
  score?: string;

  @IsOptional()
  @IsString()
  @MaxLength(120)
  activityType?: string;

  @IsOptional()
  @IsString()
  @MaxLength(120)
  category?: string;

  @IsOptional()
  @IsIn(FOMO_V2_ACTIVITY_DIFFICULTIES)
  difficulty?: string;

  @IsOptional()
  @IsString()
  @MaxLength(120)
  cost?: string;

  @IsOptional()
  @IsString()
  @MaxLength(120)
  timeEstimate?: string;

  @IsOptional()
  @IsIn(FOMO_V2_ACTIVITY_TASK_FREQUENCIES)
  taskFrequency?: string;

  @IsOptional()
  @IsBoolean()
  isHot?: boolean;

  @IsOptional()
  @IsString()
  @MaxLength(300)
  rewardLabel?: string;

  @IsOptional()
  @IsArray()
  @ArrayMaxSize(100)
  @IsString({ each: true })
  @MaxLength(120, { each: true })
  ecosystem?: string[];

  @IsOptional()
  @IsArray()
  @ArrayMaxSize(100)
  @IsString({ each: true })
  @MaxLength(120, { each: true })
  platform?: string[];

  @IsOptional()
  @IsArray()
  @ArrayMaxSize(200)
  @IsString({ each: true })
  @MaxLength(120, { each: true })
  tags?: string[];

  @IsOptional()
  @IsArray()
  @ArrayMaxSize(100)
  @IsString({ each: true })
  @MaxLength(1000, { each: true })
  requirements?: string[];

  @IsOptional()
  @Type(() => Date)
  @IsDate()
  startDate?: Date;

  @IsOptional()
  @Type(() => Date)
  @IsDate()
  endDate?: Date;

  @IsOptional()
  @IsString()
  @MaxLength(120)
  approxStartDate?: string;

  @IsOptional()
  @IsString()
  @MaxLength(120)
  approxEndDate?: string;

  @IsOptional()
  @IsString()
  @MaxLength(100)
  timezone?: string;

  @IsOptional()
  @ValidateNested()
  @Type(() => FomoV2ActivityDescriptionDto)
  description?: FomoV2ActivityDescriptionDto;

  @IsOptional()
  @IsNumber({ allowInfinity: false, allowNaN: false })
  @Min(0)
  rewardSupply?: number;

  @IsOptional()
  @IsArray()
  @ArrayMaxSize(100)
  @ValidateNested({ each: true })
  @Type(() => FomoV2ActivityRewardDto)
  rewards?: FomoV2ActivityRewardDto[];

  @IsOptional()
  @IsNumber({ allowInfinity: false, allowNaN: false })
  rewardAmount?: number;

  @IsOptional()
  @IsString()
  @MaxLength(1000)
  rewardDistribution?: string;

  @IsOptional()
  @IsString()
  @MaxLength(300)
  rewardDistributionApprox?: string;

  @IsOptional()
  @IsInt()
  @Min(0)
  participants?: number;

  @IsOptional()
  @IsNumber({ allowInfinity: false, allowNaN: false })
  @Min(0)
  fundsRaised?: number;

  @IsOptional()
  @IsString()
  @MaxLength(2048)
  joinLink?: string;

  @IsOptional()
  @IsArray()
  @ArrayMaxSize(100)
  @ValidateNested({ each: true })
  @Type(() => FomoV2ActivityLinkDto)
  links?: FomoV2ActivityLinkDto[];

  @IsOptional()
  @IsArray()
  @ArrayMaxSize(30)
  @IsString({ each: true })
  @MaxLength(2048, { each: true })
  videoGuides?: string[];

  @IsOptional()
  @IsArray()
  @ArrayMaxSize(100)
  @ValidateNested({ each: true })
  @Type(() => FomoV2ActivityRelatedAssetDto)
  relatedAssets?: FomoV2ActivityRelatedAssetDto[];

  @IsOptional()
  @IsArray()
  @ArrayMaxSize(100)
  @ValidateNested({ each: true })
  @Type(() => FomoV2ActivityInvestorSnapshotDto)
  investors?: FomoV2ActivityInvestorSnapshotDto[];

  @IsOptional()
  @ValidateNested()
  @Type(() => FomoV2ActivitySocialLinksDto)
  socialLinks?: FomoV2ActivitySocialLinksDto;

  @IsOptional()
  @ValidateNested()
  @Type(() => FomoV2ActivityReviewDto)
  review?: FomoV2ActivityReviewDto;

  @IsOptional()
  @ValidateNested()
  @Type(() => FomoV2ActivityMetricsDto)
  metrics?: FomoV2ActivityMetricsDto;

  @IsOptional()
  @IsArray()
  @ArrayMaxSize(100)
  @ValidateNested({ each: true })
  @Type(() => FomoV2ActivityTimelineItemDto)
  timeline?: FomoV2ActivityTimelineItemDto[];

  @IsOptional()
  @ValidateNested()
  @Type(() => FomoV2ActivityFlagsDto)
  flags?: FomoV2ActivityFlagsDto;

  @IsOptional()
  @ValidateNested()
  @Type(() => FomoV2ActivityTaskGuideDto)
  taskGuide?: FomoV2ActivityTaskGuideDto;
}

class FomoV2ActivityCanonicalCandidateDto {
  @IsMongoId()
  canonicalProjectId: string;

  @IsOptional()
  @IsString()
  @MaxLength(40)
  confidence?: string;

  @IsOptional()
  @IsString()
  @MaxLength(80)
  matchedBy?: string;

  @IsOptional()
  @IsString()
  @MaxLength(2000)
  reason?: string;
}

export class FomoV2ActivityCanonicalResolutionDto {
  @IsIn(FOMO_V2_ACTIVITY_CANONICAL_STATUSES)
  status: string;

  @IsOptional()
  @IsString()
  @MaxLength(40)
  confidence?: string;

  @IsOptional()
  @IsString()
  @MaxLength(80)
  matchedBy?: string;

  @IsOptional()
  @IsString()
  @MaxLength(2000)
  reason?: string;

  @IsOptional()
  @IsArray()
  @ArrayMaxSize(30)
  @ValidateNested({ each: true })
  @Type(() => FomoV2ActivityCanonicalCandidateDto)
  candidates?: FomoV2ActivityCanonicalCandidateDto[];
}

export class FomoV2ActivityAiProposalDto {
  @IsString()
  @MaxLength(120)
  proposalId: string;

  @IsOptional()
  @IsIn(FOMO_V2_ACTIVITY_AI_PROPOSAL_STATUSES)
  status?: string;

  @IsString()
  @MaxLength(80)
  provider: string;

  @IsString()
  @MaxLength(160)
  model: string;

  @IsString()
  @MaxLength(120)
  promptVersion: string;

  @IsString()
  @MaxLength(256)
  inputHash: string;

  @IsOptional()
  @ValidateNested()
  @Type(() => FomoV2ActivityContentDto)
  content?: FomoV2ActivityContentDto;

  @IsOptional()
  @IsArray()
  @ArrayMaxSize(100)
  @IsString({ each: true })
  @MaxLength(2000, { each: true })
  warnings?: string[];

  @IsOptional()
  @IsString()
  @MaxLength(20_000)
  rationale?: string;
}

export class FomoV2ActivityPublicListQueryDto {
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
  @Max(100_000)
  offset?: number;

  @IsOptional()
  @Transform(({ value }) => emptyToUndefined(value))
  @IsString()
  @MaxLength(120)
  search?: string;

  @IsOptional()
  @IsString()
  @MaxLength(200)
  lifecycleStatus?: string;

  @IsOptional()
  @IsString()
  @MaxLength(200)
  status?: string;

  @IsOptional()
  @IsIn(FOMO_V2_ACTIVITY_ACCESS_TIERS)
  accessTier?: string;

  @IsOptional()
  @IsString()
  @MaxLength(500)
  activityType?: string;

  @IsOptional()
  @IsString()
  @MaxLength(500)
  type?: string;

  @IsOptional()
  @IsString()
  @MaxLength(500)
  excludeType?: string;

  @IsOptional()
  @IsString()
  @MaxLength(500)
  category?: string;

  @IsOptional()
  @IsString()
  @MaxLength(200)
  difficulty?: string;

  @IsOptional()
  @IsIn(["score", "newest", "oldest", "endingSoon"])
  sort?: string;

  @IsOptional()
  @Transform(({ value }) => toBoolean(value))
  @IsBoolean()
  favourite?: boolean;

  @IsOptional()
  @Transform(({ value }) => toBoolean(value))
  @IsBoolean()
  favorite?: boolean;

  @IsOptional()
  @Transform(({ value }) => toBoolean(value))
  @IsBoolean()
  hasInvestors?: boolean;

  @IsOptional()
  @IsMongoId()
  canonicalProjectId?: string;
}

export class FomoV2ActivityFiltersQueryDto {
  @IsOptional()
  @IsIn(FOMO_V2_ACTIVITY_ACCESS_TIERS)
  accessTier?: string;

  @IsOptional()
  @Transform(({ value }) => toInteger(value))
  @IsInt()
  @Min(1)
  @Max(50)
  limit?: number;
}

export class FomoV2ActivityPromotedQueryDto {
  @IsOptional()
  @Transform(({ value }) => toInteger(value))
  @IsInt()
  @Min(1)
  @Max(30)
  limit?: number;
}

export class FomoV2ActivityAdminListQueryDto extends FomoV2ActivityPublicListQueryDto {
  @IsOptional()
  @IsIn(FOMO_V2_ACTIVITY_REVIEW_STATUSES)
  reviewStatus?: string;

  @IsOptional()
  @IsIn(FOMO_V2_ACTIVITY_PUBLICATION_STATUSES)
  publicationStatus?: string;

  @IsOptional()
  @IsIn(FOMO_V2_ACTIVITY_CANONICAL_STATUSES)
  canonicalStatus?: string;
}

export class FomoV2ActivityPatchDto {
  @IsInt()
  @Min(0)
  expectedRevision: number;

  @IsOptional()
  @IsString()
  @MaxLength(160)
  @Matches(/^[a-z0-9]+(?:-[a-z0-9]+)*$/)
  slug?: string;

  @IsOptional()
  @IsIn(FOMO_V2_ACTIVITY_LIFECYCLE_STATUSES)
  lifecycleStatus?: string;

  @IsOptional()
  @IsIn(FOMO_V2_ACTIVITY_REVIEW_STATUSES)
  reviewStatus?: string;

  @IsOptional()
  @IsIn(FOMO_V2_ACTIVITY_PUBLICATION_STATUSES)
  publicationStatus?: string;

  @IsOptional()
  @IsIn(FOMO_V2_ACTIVITY_ACCESS_TIERS)
  accessTier?: string;

  @IsOptional()
  @Transform(({ value }) => toBoolean(value))
  @IsBoolean()
  isSponsored?: boolean;

  @IsOptional()
  @Transform(({ value }) => toInteger(value))
  @IsInt()
  @Min(-100_000)
  @Max(100_000)
  sponsoredPriority?: number;

  @IsOptional()
  @ValidateIf((_object, value) => value !== null)
  @IsMongoId()
  canonicalProjectId?: string | null;

  @IsOptional()
  @ValidateNested()
  @Type(() => FomoV2ActivityCanonicalResolutionDto)
  canonicalResolution?: FomoV2ActivityCanonicalResolutionDto;

  @IsOptional()
  @ValidateNested()
  @Type(() => FomoV2ActivityContentDto)
  currentDraft?: FomoV2ActivityContentDto;

  @IsOptional()
  @IsArray()
  @ArrayMaxSize(300)
  @IsString({ each: true })
  @MaxLength(200, { each: true })
  @Matches(/^[a-zA-Z0-9_.]+$/, { each: true })
  manualOverrideFields?: string[];

  @IsOptional()
  @ValidateNested()
  @Type(() => FomoV2ActivityAiProposalDto)
  aiProposal?: FomoV2ActivityAiProposalDto;

  @IsOptional()
  @IsString()
  @MaxLength(2000)
  note?: string;
}

export class FomoV2ActivityDecisionDto {
  @IsInt()
  @Min(0)
  expectedRevision: number;

  @IsOptional()
  @IsString()
  @MaxLength(2000)
  reason?: string;
}
