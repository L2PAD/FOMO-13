
import { Type } from 'class-transformer';
import {
    ArrayMaxSize,
    IsArray,
    IsMongoId,
    IsNumber,
    IsOptional,
    IsString,
    MaxLength,
    Min,
    ValidateNested,
} from 'class-validator';

export class UpdateAssetDto {
    @IsOptional()
    @IsString()
    @MaxLength(80)
    name?: string;

    @IsOptional()
    @IsString()
    @MaxLength(500)
    description?: string;

    @IsOptional()
    @IsString()
    logo?: string;
}

class AssetOrderItemDto {
    @IsMongoId()
    projectId: string;

    @IsNumber()
    @Min(0)
    @Type(() => Number)
    index: number;
}

export class UpdateAssetOrderDto {
    @IsMongoId()
    portfolioId: string;

    @IsArray()
    @ArrayMaxSize(500)
    @ValidateNested({ each: true })
    @Type(() => AssetOrderItemDto)
    assets: AssetOrderItemDto[];
}
