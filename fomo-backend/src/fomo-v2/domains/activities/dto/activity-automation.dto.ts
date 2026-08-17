import { Transform, Type } from "class-transformer";
import {
  ArrayMaxSize,
  IsArray,
  IsBoolean,
  IsDateString,
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

function toBoolean(value: any): any {
  if (typeof value === "boolean") return value;
  if (["true", "1", 1].includes(value)) return true;
  if (["false", "0", 0].includes(value)) return false;
  return value;
}

export class FomoV2ActivityImportCursorsDto {
  @IsOptional()
  @IsString()
  @MaxLength(2_000)
  legacy?: string;

  @IsOptional()
  @IsString()
  @MaxLength(2_000)
  parser?: string;
}

export class FomoV2ActivityImportPendingDto {
  @IsOptional()
  @IsIn(["legacy", "parser", "all"])
  source?: "legacy" | "parser" | "all";

  @IsOptional()
  @IsIn(["dropstab", "icodrops"])
  providerSourceType?: "dropstab" | "icodrops";

  @IsOptional()
  @Transform(({ value }) => toBoolean(value))
  @IsBoolean()
  write?: boolean;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(500)
  limit?: number;

  @IsOptional()
  @Transform(({ value }) => toBoolean(value))
  @IsBoolean()
  force?: boolean;

  @IsOptional()
  @IsString()
  @MaxLength(2_000)
  cursor?: string;

  @IsOptional()
  @ValidateNested()
  @Type(() => FomoV2ActivityImportCursorsDto)
  cursors?: FomoV2ActivityImportCursorsDto;
}

export class FomoV2ActivityLifecycleRefreshDto {
  @IsOptional()
  @IsDateString()
  now?: string;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(10_000)
  limit?: number;
}

export class FomoV2ActivityAiReviewRequestDto {
  @Type(() => Number)
  @IsInt()
  @Min(0)
  expectedRevision: number;
}

export class FomoV2ActivityAiReviewApplyDto {
  @IsString()
  @MaxLength(120)
  proposalId: string;

  @Type(() => Number)
  @IsInt()
  @Min(0)
  expectedRevision: number;

  @IsOptional()
  @IsArray()
  @ArrayMaxSize(300)
  @MaxLength(200, { each: true })
  @Matches(/^(?:currentDraft\.)?[a-zA-Z0-9_.]+$/, { each: true })
  paths?: string[];
}

export class FomoV2ActivityAiReviewRejectDto {
  @IsString()
  @MaxLength(120)
  proposalId: string;

  @Type(() => Number)
  @IsInt()
  @Min(0)
  expectedRevision: number;

  @IsOptional()
  @IsString()
  @MaxLength(2_000)
  reason?: string;
}

export class FomoV2ActivityCanonicalResolveDto {
  @Type(() => Number)
  @IsInt()
  @Min(0)
  expectedRevision: number;
}

export class FomoV2ActivityCanonicalVerifyDto {
  @Type(() => Number)
  @IsInt()
  @Min(0)
  expectedRevision: number;

  @IsMongoId()
  canonicalProjectId: string;

  @IsOptional()
  @IsString()
  @MaxLength(2_000)
  reason?: string;
}

export class FomoV2ActivityCanonicalRejectDto {
  @Type(() => Number)
  @IsInt()
  @Min(0)
  expectedRevision: number;

  @IsOptional()
  @IsMongoId()
  canonicalProjectId?: string;

  @IsOptional()
  @IsString()
  @MaxLength(2_000)
  reason?: string;
}

export class FomoV2ActivityCanonicalNoMatchDto {
  @Type(() => Number)
  @IsInt()
  @Min(0)
  expectedRevision: number;

  @IsOptional()
  @IsString()
  @MaxLength(2_000)
  reason?: string;
}
