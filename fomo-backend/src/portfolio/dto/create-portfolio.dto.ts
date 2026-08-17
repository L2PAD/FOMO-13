
import { IsBoolean, IsMongoId, IsOptional, IsString, MaxLength, MinLength } from 'class-validator';

export class CreatePortfolioDto {
    @IsString()
    @MinLength(1)
    @MaxLength(80)
    name: string;

    @IsOptional()
    @IsString()
    @MaxLength(500)
    description?: string;

    @IsOptional()
    @IsString()
    logo?: string;
}

export class ToggleBattleDto {
    @IsMongoId()
    portfolioId: string;

    @IsBoolean()
    state: boolean;
}
