import { Transform } from "class-transformer";
import { IsIn, IsInt, IsOptional, IsString, Max, MaxLength, Min } from "class-validator";

const toInt = (value: any): number | undefined => {
  if (value === undefined || value === null || value === "") return undefined;
  const number = Number(value);
  return Number.isFinite(number) ? Math.trunc(number) : undefined;
};

const emptyToUndefined = (value: any): any => value === "" ? undefined : value;

export class FundsQueryDto {
  @IsOptional()
  @Transform(({ value }) => toInt(value))
  @IsInt()
  @Min(1)
  @Max(10000)
  page?: number;

  @IsOptional()
  @Transform(({ value }) => toInt(value))
  @IsInt()
  @Min(1)
  @Max(500)
  limit?: number;

  @IsOptional()
  @IsString()
  @MaxLength(120)
  name?: string;

  @IsOptional()
  @IsString()
  @MaxLength(120)
  search?: string;

  @IsOptional()
  niche?: string | string[];

  @IsOptional()
  investAmount?: string | string[];

  @IsOptional()
  investAmount_checkboxes?: string | string[];

  @IsOptional()
  projects?: string | string[];

  @IsOptional()
  industryFocus?: string | string[];

  @IsOptional()
  foundedDate?: string | string[];

  @IsOptional()
  "regionData.region"?: string | string[];

  @IsOptional()
  country?: string | string[];

  @IsOptional()
  roi?: string | string[];

  @IsOptional()
  status?: string | string[];

  @IsOptional()
  fomoScore?: string | string[];

  @IsOptional()
  @Transform(({ value }) => emptyToUndefined(value))
  @IsIn(["sponsored"])
  additionalStatus?: "sponsored";

  @IsOptional()
  @IsString()
  @MaxLength(60)
  sortBy?: string;

  @IsOptional()
  @Transform(({ value }) => emptyToUndefined(value))
  @IsIn(["asc", "desc"])
  sortOrder?: "asc" | "desc";

  @IsOptional()
  @IsString()
  @MaxLength(60)
  quickFilter?: string;
}
