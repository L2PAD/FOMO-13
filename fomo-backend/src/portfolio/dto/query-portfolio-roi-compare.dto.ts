import { IsIn, IsOptional, IsString } from "class-validator";

export type PortfolioRoiCompareRange = "24H" | "7D" | "30D" | "90D" | "1Y" | "ALL";

export class QueryPortfolioRoiCompareDto {
  @IsString()
  userIds: string;

  @IsOptional()
  @IsIn(["24H", "7D", "30D", "90D", "1Y", "ALL"])
  range?: PortfolioRoiCompareRange;
}
