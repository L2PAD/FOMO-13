import { Transform } from "class-transformer";
import {
  ArrayMaxSize,
  ArrayNotEmpty,
  IsArray,
  IsBoolean,
  IsIn,
  IsInt,
  IsNumber,
  IsOptional,
  IsString,
  Max,
  MaxLength,
  Min,
} from "class-validator";

const UNLOCK_SORT_FIELDS = [
  "nextTokenUnlockDate",
  "lastTokenUnlockDate",
  "priceUsd",
  "marketCap",
  "fdv",
  "circulatingSupply",
  "totalSupply",
  "circulationSupplyPercent",
  "publicVestingPercent",
  "nextUnlockPercent",
  "nextUnlockValueUsd",
  "totalTokensUnlockedPercent",
  "totalTokensLockedPercent",
  "coinSlug",
  "coinSymbol",
  "updatedAt",
  "createdAt",
] as const;

function emptyToUndefined(value: unknown): unknown {
  if (value === undefined || value === null) return undefined;
  if (typeof value !== "string") return value;

  const normalized = value.trim();
  return normalized ? normalized : undefined;
}

function toInteger(value: unknown): unknown {
  if (value === undefined || value === null || value === "") return undefined;

  const parsed = Number(value);
  return Number.isFinite(parsed) ? Math.trunc(parsed) : value;
}

function toNumber(value: unknown): unknown {
  if (value === undefined || value === null || value === "") return undefined;

  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : value;
}

function toBoolean(value: unknown): unknown {
  if (value === undefined || value === null || value === "") return undefined;
  if (typeof value === "boolean") return value;

  const normalized = String(value).trim().toLowerCase();
  if (["1", "true", "yes", "on"].includes(normalized)) return true;
  if (["0", "false", "no", "off"].includes(normalized)) return false;

  return value;
}

function toIdList(value: unknown): unknown {
  if (value === undefined || value === null) return undefined;

  const rawValues = Array.isArray(value) ? value : [value];
  return Array.from(
    new Set(
      rawValues
        .flatMap((item) => String(item).split(","))
        .map((item) => item.trim())
        .filter(Boolean)
    )
  );
}

export class FomoV2UnlockFeedQueryDto {
  @IsOptional()
  @Transform(({ value }) => emptyToUndefined(value))
  @IsString()
  @MaxLength(120)
  search?: string;

  @IsOptional()
  @Transform(({ value }) => emptyToUndefined(value))
  @IsString()
  @MaxLength(120)
  platform?: string;

  @IsOptional()
  @Transform(({ value }) => emptyToUndefined(value))
  @IsString()
  @MaxLength(80)
  source?: string;

  @IsOptional()
  @Transform(({ value }) => emptyToUndefined(value))
  @IsString()
  @MaxLength(120)
  category?: string;

  @IsOptional()
  @Transform(({ value }) => emptyToUndefined(value))
  @IsIn(["upcoming", "past", "all"])
  status?: "upcoming" | "past" | "all";

  @IsOptional()
  @Transform(({ value }) => toInteger(value))
  @IsInt()
  @Min(1)
  @Max(3650)
  days?: number;

  @IsOptional()
  @Transform(({ value }) => toNumber(value))
  @IsNumber({ allowInfinity: false, allowNaN: false })
  @Min(0)
  @Max(1_000_000_000_000_000)
  minValueUsd?: number;

  @IsOptional()
  @Transform(({ value }) => toBoolean(value))
  @IsBoolean()
  small_unlocks?: boolean;

  @IsOptional()
  @Transform(({ value }) => toBoolean(value))
  @IsBoolean()
  smallUnlocks?: boolean;

  @IsOptional()
  @Transform(({ value }) => emptyToUndefined(value))
  @IsIn(UNLOCK_SORT_FIELDS)
  sortBy?: (typeof UNLOCK_SORT_FIELDS)[number];

  @IsOptional()
  @Transform(({ value }) => emptyToUndefined(value))
  @IsIn(["asc", "desc"])
  sortOrder?: "asc" | "desc";

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
}

export class FomoV2UnlockCategoriesQueryDto {
  @IsOptional()
  @Transform(({ value }) => emptyToUndefined(value))
  @IsIn(["upcoming", "past", "all"])
  status?: "upcoming" | "past" | "all";

  @IsOptional()
  @Transform(({ value }) => toInteger(value))
  @IsInt()
  @Min(1)
  @Max(20)
  limit?: number;

  @IsOptional()
  @Transform(({ value }) => toBoolean(value))
  @IsBoolean()
  small_unlocks?: boolean;

  @IsOptional()
  @Transform(({ value }) => toBoolean(value))
  @IsBoolean()
  smallUnlocks?: boolean;
}

export class FomoV2UnlockUserActionsQueryDto {
  @Transform(({ value }) => toIdList(value))
  @IsArray()
  @ArrayNotEmpty()
  @ArrayMaxSize(100)
  @IsString({ each: true })
  @MaxLength(500, { each: true })
  ids: string[];
}

export class FomoV2UnlockIdParamDto {
  @Transform(({ value }) => emptyToUndefined(value))
  @IsString()
  @MaxLength(500)
  unlockId: string;
}

export class FomoV2UnlockCalendarActionDto {
  @IsOptional()
  @Transform(({ value }) => toBoolean(value))
  @IsBoolean()
  notifyEnabled?: boolean;

  @IsOptional()
  @Transform(({ value }) => toInteger(value))
  @IsInt()
  @Min(0)
  @Max(365 * 24 * 60)
  notifyBeforeMinutes?: number;
}

export class FomoV2UnlockReminderActionDto {
  @IsOptional()
  @Transform(({ value }) => toInteger(value))
  @IsInt()
  @Min(0)
  @Max(365 * 24 * 60)
  notifyBeforeMinutes?: number;
}
