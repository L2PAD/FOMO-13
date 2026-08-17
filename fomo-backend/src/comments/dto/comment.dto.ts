import mongoose from "mongoose";
import { Transform, Type } from "class-transformer";
import {
    IsArray,
    IsBoolean,
    IsDate,
    IsMongoId,
    IsOptional,
    IsString,
    MaxLength,
    MinLength,
} from "class-validator";

export default class commentDto {
    @IsOptional()
    _id?: mongoose.Types.ObjectId

    @IsOptional()
    @IsMongoId()
    author?: mongoose.Types.ObjectId

    @IsOptional()
    @Type(() => Date)
    @IsDate()
    date?: Date

    @IsString()
    @MinLength(1)
    @MaxLength(5000)
    text: string

    @IsOptional()
    @IsString()
    @MaxLength(120)
    page?: string

    @IsOptional()
    @IsBoolean()
    isTopic?: boolean

    @IsOptional()
    @IsBoolean()
    isAnswer?: boolean

    @IsOptional()
    @IsArray()
    answers?: Array<any>

    @IsOptional()
    @Transform(({ value }) => {
        if (typeof value !== "string") return value;

        const normalized = value.trim();
        return normalized || undefined;
    })
    @IsString()
    @MinLength(1)
    @MaxLength(200)
    topicName?: string

    @IsOptional()
    @IsString()
    @MaxLength(64)
    topicKey?: string

    @IsOptional()
    @IsString()
    @MaxLength(64)
    categoryKey?: string

    @IsOptional()
    @IsString()
    image?: string

    @IsOptional()
    @IsArray()
    likes?: Array<any>

    @IsOptional()
    @IsArray()
    dislikes?: Array<any>

    @IsOptional()
    @IsString()
    @MaxLength(255)
    path?: string

    @IsOptional()
    @IsString()
    audience?: "PUBLIC" | "FOLLOWERS"

    @IsOptional()
    @IsString()
    @MaxLength(20000)
    bodyHtml?: string

    @IsOptional()
    @IsArray()
    images?: Array<string>

    @IsOptional()
    @IsArray()
    mediaUrls?: Array<string>

    @IsOptional()
    @IsArray()
    tags?: Array<string>
}
