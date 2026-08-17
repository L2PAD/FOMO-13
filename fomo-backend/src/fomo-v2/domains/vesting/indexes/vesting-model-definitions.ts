import {
  FomoV2DropstabVestingSource,
  FomoV2DropstabVestingSourceSchema,
  FomoV2TokenAllocation,
  FomoV2TokenAllocationSchema,
  FomoV2VestingRound,
  FomoV2VestingRoundSchema,
  FomoV2VestingSchedule,
  FomoV2VestingScheduleSchema,
  FomoV2VestingSummary,
  FomoV2VestingSummarySchema,
} from "../models";

export const FOMO_V2_VESTING_MODEL_DEFINITIONS = [
  { name: FomoV2TokenAllocation.name, schema: FomoV2TokenAllocationSchema },
  { name: FomoV2VestingRound.name, schema: FomoV2VestingRoundSchema },
  { name: FomoV2VestingSchedule.name, schema: FomoV2VestingScheduleSchema },
  { name: FomoV2VestingSummary.name, schema: FomoV2VestingSummarySchema },
];

export const FOMO_V2_VESTING_PARSER_MODEL_DEFINITIONS = [
  {
    name: FomoV2DropstabVestingSource.name,
    schema: FomoV2DropstabVestingSourceSchema,
  },
];
