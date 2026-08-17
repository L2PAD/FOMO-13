import { Transform } from "class-transformer";
import {
  IsIn,
  IsInt,
  IsOptional,
  IsString,
  Matches,
  Max,
  Min,
} from "class-validator";
import {
  FOMO_V2_LAUNCHPAD_PLACEMENT_SURFACES,
  FOMO_V2_LAUNCHPAD_USER_ACTIONS,
  FomoV2LaunchpadPlacementSurface,
  FomoV2LaunchpadUserAction,
} from "../types";

const ADDRESS_PATTERN = /^0x[a-fA-F0-9]{40}$/;
const TX_HASH_PATTERN = /^0x[a-fA-F0-9]{64}$/;

const integer = (value: any): number | undefined => {
  if (value === undefined || value === null || value === "") return undefined;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? Math.trunc(parsed) : undefined;
};

export class FomoV2LaunchpadPublicListQueryDto {
  @IsOptional()
  @IsIn(FOMO_V2_LAUNCHPAD_PLACEMENT_SURFACES)
  surface?: FomoV2LaunchpadPlacementSurface;

  @IsOptional() @Transform(({ value }) => integer(value)) @IsInt() @Min(1) @Max(100)
  limit?: number;

  @IsOptional() @Transform(({ value }) => integer(value)) @IsInt() @Min(0) @Max(1_000_000)
  offset?: number;
}

export class FomoV2LaunchpadPublicDetailQueryDto {
  @IsOptional() @IsString() @Matches(ADDRESS_PATTERN)
  wallet?: string;
}

export class FomoV2LaunchpadVerifyUserTransactionDto {
  @IsString() @Matches(TX_HASH_PATTERN)
  txHash: string;

  @IsIn(FOMO_V2_LAUNCHPAD_USER_ACTIONS)
  action: FomoV2LaunchpadUserAction;

  @IsString() @Matches(ADDRESS_PATTERN)
  wallet: string;
}
