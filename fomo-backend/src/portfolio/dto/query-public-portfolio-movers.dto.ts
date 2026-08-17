import { Type } from "class-transformer";
import { IsIn, IsInt, IsOptional, Max, Min } from "class-validator";

export type PublicPortfolioMoversRange = "24H" | "7D";
export type PublicPortfolioMoversDirection = "gainers" | "losers";

export class QueryPublicPortfolioMoversDto {
  @IsOptional()
  @IsIn(["24H", "7D"])
  range?: PublicPortfolioMoversRange;

  @IsOptional()
  @IsIn(["gainers", "losers"])
  direction?: PublicPortfolioMoversDirection;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(20)
  limit?: number;
}
