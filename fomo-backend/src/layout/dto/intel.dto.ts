import { IsOptional, IsString, MaxLength } from "class-validator";

export class IntelDto {
    @IsString()
    @IsOptional()
    @MaxLength(2048)
    intelUrl: string
}
