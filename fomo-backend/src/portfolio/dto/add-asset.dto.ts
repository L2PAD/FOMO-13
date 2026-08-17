import { Type } from 'class-transformer';
import { IsDateString, IsEnum, IsIn, IsMongoId, IsNumber, IsOptional, IsString, MaxLength, Min } from 'class-validator';

export class AddAssetDto {
    @IsMongoId()
    projectId: string;

    @IsOptional()
    @IsMongoId()
    marketAssetId?: string;

    @IsOptional()
    @IsMongoId()
    canonicalProjectId?: string;

    @IsNumber()
    @Min(0.00000001)
    @Type(() => Number)
    amount: number;

    @IsString()
    @MaxLength(24)
    currency: string;

    @IsIn(['buy', 'sell'])
    type: 'buy' | 'sell'

    @IsNumber()
    @Min(0)
    @Type(() => Number)
    price: number;

    @IsString()
    @MaxLength(12)
    priceCurrency: string;

    @IsDateString()
    date: string;

    @IsNumber()
    @Min(0)
    @Type(() => Number)
    totalPrice: number;

    @IsOptional()
    @IsString()
    @MaxLength(300)
    note?: string;

    @IsOptional()
    @IsEnum(['percent', 'usd'])
    feeType?: 'percent' | 'usd';

    @IsOptional()
    @IsNumber()
    @Min(0)
    @Type(() => Number)
    feeAmount?: number;
}
