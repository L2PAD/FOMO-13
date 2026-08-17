import { Transform } from "class-transformer";
import {
  IsBoolean,
  IsIn,
  IsInt,
  IsMongoId,
  IsOptional,
  IsString,
  Max,
  MaxLength,
  Min,
} from "class-validator";

const toInt = (value: any): number | undefined => {
  if (value === undefined || value === null || value === "") return undefined;
  const number = Number(value);
  return Number.isFinite(number) ? Math.trunc(number) : undefined;
};

const emptyToUndefined = (value: any): any => (value === "" ? undefined : value);

const toBool = (value: any): boolean | undefined => {
  if (value === undefined || value === null || value === "") return undefined;
  if (typeof value === "boolean") return value;
  const normalized = String(value).trim().toLowerCase();
  if (["1", "true", "yes", "on"].includes(normalized)) return true;
  if (["0", "false", "no", "off"].includes(normalized)) return false;
  return undefined;
};

export class FomoV2FundingFeedFiltersQueryDto {
  @IsOptional()
  @Transform(({ value }) => toInt(value))
  @IsInt()
  @Min(1)
  @Max(20)
  limit?: number;
}

export class FomoV2FundingFeedInvestorsQueryDto {
  @IsOptional()
  @IsString()
  @MaxLength(120)
  search?: string;

  @IsOptional()
  @Transform(({ value }) => toInt(value))
  @IsInt()
  @Min(1)
  @Max(50)
  limit?: number;
}

export class FomoV2ProjectTopInvestorsQueryDto {
  @IsOptional()
  @IsString()
  @MaxLength(40)
  lookup?: string;

  @IsOptional()
  @Transform(({ value }) => toInt(value))
  @IsInt()
  @Min(1)
  @Max(200)
  limit?: number;

  @IsOptional()
  @Transform(({ value }) => toBool(value))
  @IsBoolean()
  all?: boolean;
}

export class FomoV2FundingFeedListQueryDto {
  @IsOptional()
  @IsMongoId()
  canonicalProjectId?: string;

  @IsOptional()
  @Transform(({ value }) => toInt(value))
  @IsInt()
  @Min(1)
  @Max(200)
  limit?: number;

  @IsOptional()
  @Transform(({ value }) => toInt(value))
  @IsInt()
  @Min(0)
  @Max(100000)
  offset?: number;

  @IsOptional()
  @IsString()
  @MaxLength(120)
  search?: string;

  @IsOptional()
  @Transform(({ value }) => emptyToUndefined(value))
  @IsIn([
    "all",
    "new",
    "old",
    "fundsRaisedAsc",
    "fundsRaisedDesc",
    "preValuationAsc",
    "preValuationDesc",
    "fomoScoreAsc",
    "fomoScoreDesc",
    "trending",
    "smart",
  ])
  mode?: string;

  @IsOptional()
  @IsString()
  @MaxLength(500)
  categories?: string;

  @IsOptional()
  @IsString()
  @MaxLength(500)
  fundingType?: string;

  @IsOptional()
  @IsString()
  @MaxLength(500)
  fundsRaised?: string;

  @IsOptional()
  @IsString()
  @MaxLength(500)
  preValuation?: string;

  @IsOptional()
  @IsString()
  @MaxLength(500)
  fundingDates?: string;

  @IsOptional()
  @IsString()
  @MaxLength(100)
  hasToken?: string;

  @IsOptional()
  @IsString()
  @MaxLength(120)
  chain?: string;

  @IsOptional()
  @IsString()
  @MaxLength(500)
  investors?: string;

  @IsOptional()
  @IsString()
  @MaxLength(500)
  investorDropstabIds?: string;

  @IsOptional()
  @IsString()
  @MaxLength(500)
  investorSlugs?: string;

  @IsOptional()
  @IsString()
  @MaxLength(500)
  investorNames?: string;

  @IsOptional()
  @IsString()
  @MaxLength(500)
  devStage?: string;

  @IsOptional()
  @IsString()
  @MaxLength(500)
  companyType?: string;

  @IsOptional()
  @IsString()
  @MaxLength(500)
  redFlags?: string;

  @IsOptional()
  @IsString()
  @MaxLength(500)
  fomoScore?: string;
}

export class FomoV2FundingProjectRoundsQueryDto {
  @IsOptional()
  @IsIn([
    "coingeckoId",
    "slug",
    "canonicalProjectId",
    "marketAssetId",
    "readModelId",
  ])
  lookup?: string;

  @IsOptional()
  @Transform(({ value }) => toInt(value))
  @IsInt()
  @Min(1)
  @Max(200)
  limit?: number;
}
