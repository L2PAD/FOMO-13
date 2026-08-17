import { Transform } from "class-transformer";
import { IsIn, IsInt, IsOptional, IsString, Max, MaxLength, Min } from "class-validator";

const toInt = (value: any): number | undefined => {
  if (value === undefined || value === null || value === "") return undefined;
  const number = Number(value);
  return Number.isFinite(number) ? Math.trunc(number) : undefined;
};

const emptyToUndefined = (value: any): any => value === "" ? undefined : value;

export class FundingRoundFiltersQueryDto {
  @IsOptional()
  @Transform(({ value }) => toInt(value))
  @IsInt()
  @Min(1)
  @Max(20)
  limit?: number;
}

export class FundingRoundsListQueryDto {
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
