import { Transform, Type } from "class-transformer";
import {
  IsBoolean,
  IsDefined,
  IsIn,
  IsInt,
  IsMongoId,
  IsOptional,
  IsString,
  Matches,
  Max,
  MaxLength,
  Min,
  ValidateNested,
} from "class-validator";
import {
  FOMO_V2_LAUNCHPAD_PLACEMENT_SURFACES,
  FomoV2LaunchpadPlacementSurface,
} from "../types";

const SAFE_URL_OR_PATH_PATTERN = /^(?:https?:\/\/|\/(?!\/)).+/i;

const toInteger = (value: unknown): unknown => {
  if (value === undefined || value === null || value === "") return undefined;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? Math.trunc(parsed) : value;
};

const toBoolean = (value: unknown): unknown => {
  if (typeof value === "boolean") return value;
  if (value === "true") return true;
  if (value === "false") return false;
  return value;
};

export class FomoV2LaunchpadPlacementBannerDto {
  @IsDefined()
  @IsString()
  @MaxLength(2048)
  @Matches(SAFE_URL_OR_PATH_PATTERN)
  desktopUrl: string;

  @IsOptional()
  @IsString()
  @MaxLength(2048)
  @Matches(SAFE_URL_OR_PATH_PATTERN)
  mobileUrl?: string;

  @IsOptional()
  @IsString()
  @MaxLength(2048)
  @Matches(SAFE_URL_OR_PATH_PATTERN)
  linkUrl?: string;

  @IsOptional()
  @IsString()
  @MaxLength(500)
  alt?: string;
}

export class FomoV2LaunchpadPlacementUpsertDto {
  @IsMongoId()
  launchpadPoolId: string;

  @IsIn(FOMO_V2_LAUNCHPAD_PLACEMENT_SURFACES)
  surface: FomoV2LaunchpadPlacementSurface;

  @IsOptional()
  @Transform(({ value }) => toBoolean(value))
  @IsBoolean()
  enabled?: boolean;

  @IsOptional()
  @Transform(({ value }) => toBoolean(value))
  @IsBoolean()
  featured?: boolean;

  @IsOptional()
  @Transform(({ value }) => toBoolean(value))
  @IsBoolean()
  ad?: boolean;

  @IsOptional()
  @Transform(({ value }) => toInteger(value))
  @IsInt()
  @Min(0)
  @Max(1_000_000)
  sortOrder?: number;

  @IsDefined()
  @ValidateNested()
  @Type(() => FomoV2LaunchpadPlacementBannerDto)
  banner: FomoV2LaunchpadPlacementBannerDto;
}

export class FomoV2LaunchpadPlacementPatchDto {
  @IsOptional()
  @Transform(({ value }) => toBoolean(value))
  @IsBoolean()
  enabled?: boolean;

  @IsOptional()
  @Transform(({ value }) => toBoolean(value))
  @IsBoolean()
  featured?: boolean;

  @IsOptional()
  @Transform(({ value }) => toBoolean(value))
  @IsBoolean()
  ad?: boolean;

  @IsOptional()
  @Transform(({ value }) => toInteger(value))
  @IsInt()
  @Min(0)
  @Max(1_000_000)
  sortOrder?: number;

  @IsOptional()
  @ValidateNested()
  @Type(() => FomoV2LaunchpadPlacementBannerDto)
  banner?: FomoV2LaunchpadPlacementBannerDto;
}

export class FomoV2LaunchpadPlacementAdminQueryDto {
  @IsOptional()
  @IsIn(FOMO_V2_LAUNCHPAD_PLACEMENT_SURFACES)
  surface?: FomoV2LaunchpadPlacementSurface;

  @IsOptional()
  @IsMongoId()
  poolId?: string;

  /** @deprecated Use poolId. */
  @IsOptional()
  @IsMongoId()
  launchpadPoolId?: string;

  @IsOptional()
  @Transform(({ value }) => toBoolean(value))
  @IsBoolean()
  enabled?: boolean;

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

export class FomoV2LaunchpadPlacementPublicQueryDto {
  @IsIn(FOMO_V2_LAUNCHPAD_PLACEMENT_SURFACES)
  surface: FomoV2LaunchpadPlacementSurface;

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
