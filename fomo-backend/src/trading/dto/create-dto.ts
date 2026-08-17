import { IsArray, IsBoolean, IsNotEmpty, IsNumber, IsOptional, IsString } from 'class-validator';

export class TradingAccDto {
    @IsNotEmpty()
    @IsString()
    id: string;

    @IsOptional()
    @IsBoolean()
    isPrivate?: boolean;
}

export class CreateTradingDto {
    @IsString()
    projectId: string;

    @IsArray()
    twitterAccs: string[];

    @IsArray()
    keywords: string[];
}
