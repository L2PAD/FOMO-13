import { Transform } from "class-transformer";
import {
  IsIn,
  IsInt,
  IsOptional,
  IsString,
  Max,
  MaxLength,
  Min,
} from "class-validator";

const toInteger = (value: unknown): number | undefined => {
  if (value === undefined || value === null || value === "") return undefined;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? Math.trunc(parsed) : undefined;
};

const toQueryString = (value: unknown): string | undefined => {
  if (value === undefined || value === null || value === "") return undefined;
  return Array.isArray(value) ? value.map(String).join(",") : String(value);
};

class FomoV2BoundedStringQueryDto {
  @IsOptional()
  @Transform(({ value }) => toQueryString(value))
  @IsString()
  @MaxLength(1_000)
  categories?: string;

  @IsOptional()
  @Transform(({ value }) => toQueryString(value))
  @IsString()
  @MaxLength(1_000)
  price?: string;

  @IsOptional()
  @Transform(({ value }) => toQueryString(value))
  @IsString()
  @MaxLength(1_000)
  price_checkboxes?: string;

  @IsOptional()
  @Transform(({ value }) => toQueryString(value))
  @IsString()
  @MaxLength(1_000)
  change24?: string;

  @IsOptional()
  @Transform(({ value }) => toQueryString(value))
  @IsString()
  @MaxLength(1_000)
  volume24?: string;

  @IsOptional()
  @Transform(({ value }) => toQueryString(value))
  @IsString()
  @MaxLength(1_000)
  volume24h?: string;

  @IsOptional()
  @Transform(({ value }) => toQueryString(value))
  @IsString()
  @MaxLength(1_000)
  marketCap?: string;

  @IsOptional()
  @Transform(({ value }) => toQueryString(value))
  @IsString()
  @MaxLength(1_000)
  fdv?: string;

  @IsOptional()
  @Transform(({ value }) => toQueryString(value))
  @IsString()
  @MaxLength(1_000)
  circulationSupply?: string;

  @IsOptional()
  @Transform(({ value }) => toQueryString(value))
  @IsString()
  @MaxLength(1_000)
  fomoScore?: string;

  @IsOptional()
  @Transform(({ value }) => toQueryString(value))
  @IsString()
  @MaxLength(1_000)
  tradeLaunchDate?: string;
}

export class FomoV2MarketProjectListQueryDto extends FomoV2BoundedStringQueryDto {
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

  @IsOptional()
  @IsString()
  @MaxLength(120)
  searchValue?: string;

  @IsOptional()
  @IsString()
  @MaxLength(64)
  status?: string;

  @IsOptional()
  @IsIn(["sponsored", "eralash"])
  additionalStatus?: "sponsored" | "eralash";

  @IsOptional()
  @IsString()
  @MaxLength(80)
  sortKey?: string;

  @IsOptional()
  @Transform(({ value }) => toInteger(value))
  @IsIn([-1, 1])
  sortNumberValue?: -1 | 1;

  @IsOptional()
  @Transform(({ value }) => toQueryString(value))
  @IsString()
  @MaxLength(4_000)
  includedProjectIds?: string;

  @IsOptional()
  @Transform(({ value }) => toQueryString(value))
  @IsString()
  @MaxLength(4_000)
  excludedProjectIds?: string;
}

export class FomoV2MarketCategoryParamDto {
  @IsIn(["recently", "gainers", "trending", "accumulation"])
  type: "recently" | "gainers" | "trending" | "accumulation";
}

export class FomoV2ProjectParamDto {
  @IsString()
  @MaxLength(160)
  projectId: string;
}

export class FomoV2ProjectLookupQueryDto {
  @IsOptional()
  @IsIn(["market", "project", "ico", "echo"])
  projectType?: "market" | "project" | "ico" | "echo";

  @IsOptional()
  @IsIn([
    "coingeckoId",
    "slug",
    "canonicalProjectId",
    "marketAssetId",
    "readModelId",
  ])
  lookup?:
    | "coingeckoId"
    | "slug"
    | "canonicalProjectId"
    | "marketAssetId"
    | "readModelId";
}

export class FomoV2ProjectUnlocksQueryDto extends FomoV2ProjectLookupQueryDto {
  @IsOptional()
  @IsIn(["upcoming", "past", "all"])
  events?: "upcoming" | "past" | "all";

  @IsOptional()
  @Transform(({ value }) => toInteger(value))
  @IsInt()
  @Min(1)
  @Max(200)
  eventsLimit?: number;

  @IsOptional()
  @Transform(({ value }) => toInteger(value))
  @IsInt()
  @Min(1)
  @Max(10_000)
  progressEventsLimit?: number;
}
