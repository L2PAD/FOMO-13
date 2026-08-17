import { Transform } from "class-transformer"
import { IsIn, IsInt, IsOptional, IsString, Matches, Max, MaxLength, Min } from "class-validator"

const emptyToUndefined = (value: any): any => value === "" ? undefined : value;

export class GetComparisonDto {
    @IsOptional()
    @Transform(({ value }) => emptyToUndefined(value))
    @IsString()
    @Matches(/^[a-z0-9-]+$/i)
    @MaxLength(80)
    category?:string 

    @IsOptional()
    @Transform(({ value }) => emptyToUndefined(value))
    @IsIn(["marketCap", "fullyDilutedMarketCap"])
    sortBy?:'marketCap' | 'fullyDilutedMarketCap'

    @IsOptional()
    @Transform(({ value }) => value === undefined || value === null || value === "" ? undefined : Number(value))
    @IsInt()
    @Min(1)
    @Max(100)
    limit?:number
}
