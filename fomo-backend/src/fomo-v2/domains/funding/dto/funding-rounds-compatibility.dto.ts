import { Transform } from "class-transformer";
import {
  ArrayMaxSize,
  IsArray,
  IsBoolean,
  IsIn,
  IsInt,
  IsMongoId,
  IsNotEmpty,
  IsOptional,
  IsString,
  Max,
  MaxLength,
  Min,
} from "class-validator";

const toInteger = (value: unknown): unknown => {
  if (value === undefined || value === null || value === "") return undefined;
  if (typeof value === "number") return value;

  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : value;
};

const toBoolean = (value: unknown): unknown => {
  if (value === undefined || value === null || value === "") return undefined;
  if (typeof value === "boolean") return value;

  const normalized = String(value).trim().toLowerCase();
  if (["1", "true", "yes", "on"].includes(normalized)) return true;
  if (["0", "false", "no", "off"].includes(normalized)) return false;

  return value;
};

const toStringArray = (value: unknown): unknown => {
  if (value === undefined || value === null || value === "") return undefined;

  const values = Array.isArray(value) ? value : [value];
  return values
    .flatMap((item) => String(item).split(","))
    .map((item) => item.trim())
    .filter(Boolean);
};

const toLowerCaseString = (value: unknown): unknown => {
  if (value === undefined || value === null || value === "") return undefined;
  return String(value).trim().toLowerCase();
};

export class FomoV2FundingRoundsCompatibilityProjectParamsDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(160)
  project!: string;
}

/**
 * Compatibility input for the former funding-rounds sync endpoint.
 *
 * Full/unbounded imports are deliberately not exposed over HTTP. The v2 CLI is
 * the controlled path for those maintenance operations.
 */
export class FomoV2FundingRoundsIntelSyncDto {
  @IsOptional()
  @Transform(({ value }) => toInteger(value))
  @IsInt()
  @Min(1)
  @Max(200)
  limit?: number;

  @IsOptional()
  @Transform(({ value }) => toBoolean(value))
  @IsBoolean()
  dryRun?: boolean;

  @IsOptional()
  @Transform(({ value }) => toBoolean(value))
  @IsBoolean()
  debug?: boolean;

  @IsOptional()
  @Transform(({ value }) => toBoolean(value))
  @IsBoolean()
  canonicalMarketlessOnly?: boolean;

  /** Accepted for compatibility; it never enables an unbounded import. */
  @IsOptional()
  @Transform(({ value }) => toBoolean(value))
  @IsBoolean()
  force?: boolean;

  @IsOptional()
  @Transform(({ value }) => toLowerCaseString(value))
  @IsIn(["dropstab"])
  sourceType?: string;

  @IsOptional()
  @Transform(({ value }) => toStringArray(value))
  @IsArray()
  @ArrayMaxSize(100)
  @IsMongoId({ each: true })
  sourceDocumentIds?: string[];
}
