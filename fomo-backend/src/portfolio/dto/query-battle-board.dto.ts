import { IsIn, IsOptional, IsString, Max, Min } from "class-validator";
import { Type } from "class-transformer";

export class QueryBattleBoardDto {
  @IsOptional()
  @IsString()
  search?: string;

  @IsOptional()
  @IsIn(["ROI_30D", "BALANCE", "CHANGE_24H"])
  sortBy?: "ROI_30D" | "BALANCE" | "CHANGE_24H";

  @IsOptional()
  @IsIn(["asc", "desc"])
  sortOrder?: "asc" | "desc";

  @IsOptional()
  @Type(() => Number)
  @Min(0)
  offset?: number;

  @IsOptional()
  @Type(() => Number)
  @Min(1)
  @Max(100)
  limit?: number;
}
