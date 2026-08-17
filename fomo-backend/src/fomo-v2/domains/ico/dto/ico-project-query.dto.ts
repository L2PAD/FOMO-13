import { Transform } from "class-transformer";
import { IsBoolean, IsInt, IsOptional, IsString, Max, MaxLength, Min } from "class-validator";

const toInt = (value: any): number | undefined => {
  if (value === undefined || value === null || value === "") return undefined;
  const number = Number(value);
  return Number.isFinite(number) ? Math.trunc(number) : undefined;
};

const toBool = (value: any): boolean | undefined => {
  if (value === undefined || value === null || value === "") return undefined;
  if (typeof value === "boolean") return value;
  const normalized = String(value).trim().toLowerCase();
  if (["1", "true", "yes", "on"].includes(normalized)) return true;
  if (["0", "false", "no", "off"].includes(normalized)) return false;
  return undefined;
};

export class FomoV2IcoProjectFiltersQueryDto {
  @IsOptional()
  @Transform(({ value }) => toInt(value))
  @IsInt()
  @Min(1)
  @Max(24)
  limit?: number;
}

export class FomoV2IcoProjectListQueryDto {
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
  searchValue?: string;

  @IsOptional()
  @IsString()
  @MaxLength(120)
  status?: string;

  @IsOptional()
  @IsString()
  @MaxLength(80)
  sortKey?: string;

  @IsOptional()
  @IsString()
  @MaxLength(8)
  sortNumberValue?: string;

  @IsOptional()
  @IsString()
  @MaxLength(40)
  additionalStatus?: string;

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
  fundingDates?: string;

  @IsOptional()
  @IsString()
  @MaxLength(500)
  fundsRaised?: string;

  @IsOptional()
  @IsString()
  @MaxLength(500)
  investorNames?: string;

  @IsOptional()
  @IsString()
  @MaxLength(500)
  fomoScore?: string;

  @IsOptional()
  @IsString()
  @MaxLength(500)
  redFlags?: string;

  @IsOptional()
  @IsString()
  @MaxLength(500)
  ["red-flags"]?: string;

  @IsOptional()
  @Transform(({ value }) => toBool(value))
  @IsBoolean()
  sandbox?: boolean;
}
