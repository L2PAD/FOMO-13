import {
  FomoV2LaunchpadOperation,
  FomoV2LaunchpadOperationSchema,
  FomoV2LaunchpadPlacement,
  FomoV2LaunchpadPlacementSchema,
  FomoV2LaunchpadPool,
  FomoV2LaunchpadPoolSchema,
  FomoV2LaunchpadParticipant,
  FomoV2LaunchpadParticipantSchema,
  FomoV2LaunchpadChainEvent,
  FomoV2LaunchpadChainEventSchema,
  FomoV2LaunchpadSyncState,
  FomoV2LaunchpadSyncStateSchema,
} from "../models";

export const FOMO_V2_LAUNCHPAD_MODEL_DEFINITIONS = [
  { name: FomoV2LaunchpadPool.name, schema: FomoV2LaunchpadPoolSchema },
  {
    name: FomoV2LaunchpadOperation.name,
    schema: FomoV2LaunchpadOperationSchema,
  },
  {
    name: FomoV2LaunchpadPlacement.name,
    schema: FomoV2LaunchpadPlacementSchema,
  },
  {
    name: FomoV2LaunchpadParticipant.name,
    schema: FomoV2LaunchpadParticipantSchema,
  },
  {
    name: FomoV2LaunchpadChainEvent.name,
    schema: FomoV2LaunchpadChainEventSchema,
  },
  {
    name: FomoV2LaunchpadSyncState.name,
    schema: FomoV2LaunchpadSyncStateSchema,
  },
];
