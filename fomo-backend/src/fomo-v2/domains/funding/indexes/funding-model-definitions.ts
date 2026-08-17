import {
  FomoV2FundingFeedRoundReadModel,
  FomoV2FundingFeedRoundReadModelSchema,
  FomoV2FundingPlatform,
  FomoV2FundingPlatformSchema,
  FomoV2FundingRound,
  FomoV2FundingRoundParticipant,
  FomoV2FundingRoundParticipantSchema,
  FomoV2FundingRoundSchema,
} from "../models";

export const FOMO_V2_FUNDING_MODEL_DEFINITIONS = [
  { name: FomoV2FundingPlatform.name, schema: FomoV2FundingPlatformSchema },
  { name: FomoV2FundingRound.name, schema: FomoV2FundingRoundSchema },
  {
    name: FomoV2FundingRoundParticipant.name,
    schema: FomoV2FundingRoundParticipantSchema,
  },
  {
    name: FomoV2FundingFeedRoundReadModel.name,
    schema: FomoV2FundingFeedRoundReadModelSchema,
  },
];
