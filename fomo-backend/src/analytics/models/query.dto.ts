import { ChartTypes, EntityTypes } from "./chart.model"
import { IsIn, IsOptional, IsString, MaxLength } from "class-validator"

export class GetChartQueryDto {
    @IsOptional()
    @IsString()
    @MaxLength(120)
    ids?:string 

    @IsOptional()
    @IsIn(["project", "fund", "person", "user", "category", "funding-dynamics"])
    entityType?:EntityTypes

    @IsOptional()
    @IsIn(["chart24h", "chart7d", "chart30d", "chart90d", "chart1y", "chartAll"])
    chartType?:ChartTypes
}
