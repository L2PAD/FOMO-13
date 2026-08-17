import { Transform } from "class-transformer";
import {
  IsIn,
  IsInt,
  IsOptional,
  IsString,
  Max,
  MaxLength,
  Min,
} from "class-validator";

export const CRYPTO_LINKING_ENTITY_FILTERS = [
  "projects",
  "funds",
  "persons",
  "exchanges",
  "tokens",
  "assets",
] as const;
export const CRYPTO_LINKING_RELATION_FILTERS = [
  "investedIn",
  "coinvestedWith",
  "founded",
  "hasToken",
  "tradedOn",
  "worksAt",
] as const;
export const CRYPTO_LINKING_CONTEXT_FILTERS = [
  "founder",
  "investment",
  "ecosystem",
  "partnership",
  "market",
  "event",
  "mention",
] as const;

const toInt = (value: any): number | undefined => {
  if (value === undefined || value === null || value === "") return undefined;
  const number = Number(value);
  return Number.isFinite(number) ? Math.trunc(number) : undefined;
};

const toStringArray = (value: any): string[] | undefined => {
  if (value === undefined || value === null) return undefined;
  const items = Array.isArray(value) ? value : String(value).split(",");
  return items.map((item) => String(item).trim()).filter(Boolean);
};

export class CryptoLinkingSearchQueryDto {
  @IsOptional()
  @IsString()
  @MaxLength(120)
  q?: string;

  @IsOptional()
  @Transform(({ value }) => toInt(value))
  @IsInt()
  @Min(1)
  @Max(20)
  limit?: number;
}

export class CryptoLinkingGraphQueryDto {
  @IsIn(["project", "fund", "person"])
  entityType: string;

  @IsString()
  @MaxLength(120)
  id: string;

  @IsOptional()
  @Transform(({ value }) => toInt(value))
  @IsInt()
  @Min(1)
  @Max(300)
  limit?: number;

  @IsOptional()
  @Transform(({ value }) => toStringArray(value))
  @IsIn(CRYPTO_LINKING_ENTITY_FILTERS, { each: true })
  entityTypes?: string[];

  @IsOptional()
  @Transform(({ value }) => toStringArray(value))
  @IsIn(CRYPTO_LINKING_RELATION_FILTERS, { each: true })
  relationTypes?: string[];

  @IsOptional()
  @Transform(({ value }) => toStringArray(value))
  @IsIn(CRYPTO_LINKING_CONTEXT_FILTERS, { each: true })
  contextScopes?: string[];
}
