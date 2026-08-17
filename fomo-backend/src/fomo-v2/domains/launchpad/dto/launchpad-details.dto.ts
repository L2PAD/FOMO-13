import { Type } from "class-transformer";
import {
  ArrayMaxSize,
  IsArray,
  IsBoolean,
  IsInt,
  IsObject,
  IsOptional,
  IsString,
  Matches,
  Max,
  MaxLength,
  Min,
  ValidateNested,
} from "class-validator";

export const LAUNCHPAD_ASSET_URL_PATTERN = /^(?:https?:\/\/|\/(?!\/))\S+$/i;
export const LAUNCHPAD_SLUG_PATTERN = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

class RequiredLaunchpadUrlDto {
  @IsString()
  @MaxLength(2048)
  @Matches(LAUNCHPAD_ASSET_URL_PATTERN)
  url: string;
}

export class FomoV2LaunchpadZoneDescriptionsDto {
  @IsOptional() @IsString() @MaxLength(10_000) green?: string;
  @IsOptional() @IsString() @MaxLength(10_000) yellow?: string;
  @IsOptional() @IsString() @MaxLength(10_000) red?: string;
}

export class FomoV2LaunchpadFaqItemDto {
  @IsString() @MaxLength(500) question: string;
  @IsString() @MaxLength(10_000) answer: string;
}

export class FomoV2LaunchpadLinksDto {
  @IsOptional() @IsString() @MaxLength(2048) @Matches(LAUNCHPAD_ASSET_URL_PATTERN) website?: string;
  @IsOptional() @IsString() @MaxLength(2048) @Matches(LAUNCHPAD_ASSET_URL_PATTERN) twitter?: string;
  @IsOptional() @IsString() @MaxLength(2048) @Matches(LAUNCHPAD_ASSET_URL_PATTERN) telegram?: string;
  @IsOptional() @IsString() @MaxLength(2048) @Matches(LAUNCHPAD_ASSET_URL_PATTERN) discord?: string;
  @IsOptional() @IsString() @MaxLength(2048) @Matches(LAUNCHPAD_ASSET_URL_PATTERN) whitepaper?: string;
}

export class FomoV2LaunchpadDocumentDto extends RequiredLaunchpadUrlDto {
  @IsString() @MaxLength(300) title: string;
  @IsOptional() @IsString() @MaxLength(100) type?: string;
}

export class FomoV2LaunchpadInvestorDto {
  @IsOptional() @IsString() @MaxLength(200) id?: string;
  @IsString() @MaxLength(300) name: string;
  @IsOptional() @IsString() @MaxLength(2048) @Matches(LAUNCHPAD_ASSET_URL_PATTERN) logoUrl?: string;
  @IsOptional() @IsString() @MaxLength(2048) @Matches(LAUNCHPAD_ASSET_URL_PATTERN) website?: string;
}

export class FomoV2LaunchpadTeamMemberDto {
  @IsOptional() @IsString() @MaxLength(200) id?: string;
  @IsString() @MaxLength(300) name: string;
  @IsOptional() @IsString() @MaxLength(300) role?: string;
  @IsOptional() @IsString() @MaxLength(2048) @Matches(LAUNCHPAD_ASSET_URL_PATTERN) avatarUrl?: string;
  @IsOptional() @IsString() @MaxLength(2048) @Matches(LAUNCHPAD_ASSET_URL_PATTERN) website?: string;
}

export class FomoV2LaunchpadAnalysisFlagsDto {
  @IsOptional() @IsArray() @ArrayMaxSize(100) @IsString({ each: true }) @MaxLength(500, { each: true }) green?: string[];
  @IsOptional() @IsArray() @ArrayMaxSize(100) @IsString({ each: true }) @MaxLength(500, { each: true }) yellow?: string[];
  @IsOptional() @IsArray() @ArrayMaxSize(100) @IsString({ each: true }) @MaxLength(500, { each: true }) red?: string[];
}

export class FomoV2LaunchpadFundingDto {
  @IsOptional() @IsString() @MaxLength(300) totalRaisedLabel?: string;
  @IsOptional() @IsString() @MaxLength(300) fundingType?: string;
}

export class FomoV2LaunchpadDisplayFlagsDto {
  @IsOptional() @IsBoolean() showLeaderboard?: boolean;
  @IsOptional() @IsBoolean() showParticipants?: boolean;
  @IsOptional() @IsBoolean() showCountdown?: boolean;
}

export class FomoV2LaunchpadTokenDisplayDto {
  @IsOptional() @IsString() @MaxLength(300) name?: string;
  @IsOptional() @IsString() @MaxLength(40) symbol?: string;
  @IsOptional() @IsInt() @Min(0) @Max(255) decimals?: number;
  @IsOptional() @IsString() @MaxLength(300) priceLabel?: string;
  @IsOptional() @IsString() @MaxLength(300) allocationLabel?: string;
}

export class FomoV2LaunchpadDetailsDto {
  @IsOptional() @IsString() @MaxLength(300) title?: string;
  @IsOptional() @IsString() @MaxLength(1_000) shortDescription?: string;
  @IsOptional() @IsString() @MaxLength(50_000) description?: string;
  @IsOptional() @IsString() @MaxLength(200) saleType?: string;
  @IsOptional() @IsString() @MaxLength(200) category?: string;
  @IsOptional() @IsString() @MaxLength(2048) @Matches(LAUNCHPAD_ASSET_URL_PATTERN) logoUrl?: string;
  @IsOptional() @IsString() @MaxLength(2048) @Matches(LAUNCHPAD_ASSET_URL_PATTERN) bannerUrl?: string;

  @IsOptional()
  @IsArray()
  @ArrayMaxSize(20)
  @IsString({ each: true })
  @MaxLength(2048, { each: true })
  @Matches(LAUNCHPAD_ASSET_URL_PATTERN, { each: true })
  gallery?: string[];

  @IsOptional() @IsString() @MaxLength(50_000) about?: string;
  @IsOptional() @IsString() @MaxLength(50_000) problem?: string;
  @IsOptional() @IsString() @MaxLength(50_000) solution?: string;
  @IsOptional() @IsString() @MaxLength(50_000) tokenUtility?: string;
  @IsOptional() @IsString() @MaxLength(50_000) revenueModel?: string;

  @IsOptional() @ValidateNested() @Type(() => FomoV2LaunchpadZoneDescriptionsDto)
  zoneDescriptions?: FomoV2LaunchpadZoneDescriptionsDto;

  @IsOptional() @IsArray() @ArrayMaxSize(100) @IsString({ each: true }) @MaxLength(2_000, { each: true })
  participationRules?: string[];

  @IsOptional() @IsArray() @ArrayMaxSize(100) @ValidateNested({ each: true }) @Type(() => FomoV2LaunchpadFaqItemDto)
  faq?: FomoV2LaunchpadFaqItemDto[];

  @IsOptional() @ValidateNested() @Type(() => FomoV2LaunchpadLinksDto)
  links?: FomoV2LaunchpadLinksDto;

  @IsOptional() @IsArray() @ArrayMaxSize(50) @ValidateNested({ each: true }) @Type(() => FomoV2LaunchpadDocumentDto)
  documents?: FomoV2LaunchpadDocumentDto[];

  @IsOptional() @IsArray() @ArrayMaxSize(100) @ValidateNested({ each: true }) @Type(() => FomoV2LaunchpadInvestorDto)
  investors?: FomoV2LaunchpadInvestorDto[];

  @IsOptional() @IsArray() @ArrayMaxSize(100) @ValidateNested({ each: true }) @Type(() => FomoV2LaunchpadTeamMemberDto)
  team?: FomoV2LaunchpadTeamMemberDto[];

  @IsOptional() @ValidateNested() @Type(() => FomoV2LaunchpadAnalysisFlagsDto)
  analysisFlags?: FomoV2LaunchpadAnalysisFlagsDto;

  @IsOptional() @ValidateNested() @Type(() => FomoV2LaunchpadFundingDto)
  funding?: FomoV2LaunchpadFundingDto;

  @IsOptional() @ValidateNested() @Type(() => FomoV2LaunchpadDisplayFlagsDto)
  flags?: FomoV2LaunchpadDisplayFlagsDto;

  @IsOptional() @ValidateNested() @Type(() => FomoV2LaunchpadTokenDisplayDto)
  tokenDisplay?: FomoV2LaunchpadTokenDisplayDto;
}

export class FomoV2LaunchpadPatchDetailsDto {
  @IsOptional()
  @IsInt()
  @Min(0)
  expectedRevision?: number;

  @IsOptional()
  @IsString()
  @MaxLength(160)
  @Matches(LAUNCHPAD_SLUG_PATTERN)
  slug?: string;

  @IsObject()
  @ValidateNested()
  @Type(() => FomoV2LaunchpadDetailsDto)
  launchDetails: FomoV2LaunchpadDetailsDto;
}

export class FomoV2LaunchpadDeleteMediaDto {
  @IsString()
  @MaxLength(2048)
  key: string;
}
