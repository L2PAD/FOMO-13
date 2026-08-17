import { Schema } from "mongoose";
import {
  Coinmarketcap,
  CoinmarketcapSchema,
} from "src/coinmarketcap/models/coinmarketcap.model";
import {
  CryptoActivityBoardTask,
  CryptoActivityBoardTaskSchema,
} from "src/crypto-activities/models/crypto-activity-board-task.model";
import {
  CryptoActivityCalendarItem,
  CryptoActivityCalendarItemSchema,
} from "src/crypto-activities/models/crypto-activity-calendar-item.model";
import {
  CryptoActivityFavorite,
  CryptoActivityFavoriteSchema,
} from "src/crypto-activities/models/crypto-activity-favorite.model";
import {
  CryptoActivityReaction,
  CryptoActivityReactionSchema,
} from "src/crypto-activities/models/crypto-activity-reaction.model";
import {
  CryptoActivityReport,
  CryptoActivityReportSchema,
} from "src/crypto-activities/models/crypto-activity-report.model";
import {
  CryptoActivityStepProgress,
  CryptoActivityStepProgressSchema,
} from "src/crypto-activities/models/crypto-activity-step-progress.model";
import { Event, EventSchema } from "src/events/models/event.model";
import {
  ExternalAssetMirror,
  ExternalAssetMirrorSchema,
} from "src/storage/external-asset-mirror.model";
import {
  EarlylandTaskUserState,
  EarlylandTaskUserStateSchema,
} from "src/tasks/models/earlyland-task-user-state.model";
import { CryptoTab, CryptoTabSchema } from "src/tabs/model/tab.model";
import { User, UserSchema } from "src/user/user.model";
import { FOMO_V2_ACTIVITY_MODEL_DEFINITIONS } from "../domains/activities/indexes/activity-model-definitions";
import {
  FOMO_V2_BACKER_MODEL_DEFINITIONS,
  FOMO_V2_BACKER_PARSER_MODEL_DEFINITIONS,
} from "../domains/backers/indexes/backer-model-definitions";
import { FOMO_V2_FLAG_MODEL_DEFINITIONS } from "../domains/flags/indexes/flag-model-definitions";
import { FOMO_V2_FUNDING_MODEL_DEFINITIONS } from "../domains/funding/indexes/funding-model-definitions";
import {
  FOMO_V2_ICO_MODEL_DEFINITIONS,
  FOMO_V2_ICO_PARSER_MODEL_DEFINITIONS,
} from "../domains/ico/indexes/ico-model-definitions";
import { FOMO_V2_IMPORT_CANDIDATE_MODEL_DEFINITIONS } from "../domains/import-candidates/indexes/import-candidate-model-definitions";
import { FOMO_V2_LAUNCHPAD_MODEL_DEFINITIONS } from "../domains/launchpad/indexes/launchpad-model-definitions";
import { FOMO_V2_MARKET_MODEL_DEFINITIONS } from "../domains/market/indexes/market-model-definitions";
import { FOMO_V2_PROJECT_PROFILE_MODEL_DEFINITIONS } from "../domains/project-profiles/indexes/project-profile-model-definitions";
import { FOMO_V2_REACTION_MODEL_DEFINITIONS } from "../domains/reactions/indexes/reaction-model-definitions";
import { FOMO_V2_REVIEW_MODEL_DEFINITIONS } from "../domains/review/indexes/review-model-definitions";
import { FOMO_V2_UNLOCKS_MODEL_DEFINITIONS } from "../domains/unlocks/indexes/unlocks-model-definitions";
import {
  FOMO_V2_VESTING_MODEL_DEFINITIONS,
  FOMO_V2_VESTING_PARSER_MODEL_DEFINITIONS,
} from "../domains/vesting/indexes/vesting-model-definitions";
import {
  FomoV2CanonicalProject,
  FomoV2CanonicalProjectSchema,
  FomoV2CanonicalProjectSource,
  FomoV2CanonicalProjectSourceSchema,
  FomoV2MigrationRun,
  FomoV2MigrationRunSchema,
  FomoV2ParserImportCheckpoint,
  FomoV2ParserImportCheckpointSchema,
  FomoV2ParserImportFailure,
  FomoV2ParserImportFailureSchema,
  FomoV2ParserImportRun,
  FomoV2ParserImportRunSchema,
  FomoV2ParserControlConfig,
  FomoV2ParserControlConfigSchema,
  FomoV2ParserControlRun,
  FomoV2ParserControlRunSchema,
  FomoV2ParserGlobalControl,
  FomoV2ParserGlobalControlSchema,
  FomoV2UpstreamParserFlow,
  FomoV2UpstreamParserFlowSchema,
  FomoV2UpstreamParserPolicy,
  FomoV2UpstreamParserPolicySchema,
  FomoV2SourceEntity,
  FomoV2SourceEntitySchema,
  FomoV2SourceSnapshot,
  FomoV2SourceSnapshotSchema,
} from "../models";
import { FOMO_V2_PROJECT_DOMAIN_SOURCE_MODEL_DEFINITIONS } from "../shared/source-policy/indexes/project-domain-source-model-definitions";

export interface FomoV2ModelDefinition {
  readonly name: string;
  readonly schema: Schema<any>;
}

const FOMO_V2_CORE_MODEL_DEFINITIONS: FomoV2ModelDefinition[] = [
  { name: FomoV2MigrationRun.name, schema: FomoV2MigrationRunSchema },
  {
    name: FomoV2ParserGlobalControl.name,
    schema: FomoV2ParserGlobalControlSchema,
  },
  {
    name: FomoV2ParserControlConfig.name,
    schema: FomoV2ParserControlConfigSchema,
  },
  {
    name: FomoV2ParserControlRun.name,
    schema: FomoV2ParserControlRunSchema,
  },
  {
    name: FomoV2UpstreamParserFlow.name,
    schema: FomoV2UpstreamParserFlowSchema,
  },
  {
    name: FomoV2UpstreamParserPolicy.name,
    schema: FomoV2UpstreamParserPolicySchema,
  },
  {
    name: FomoV2ParserImportRun.name,
    schema: FomoV2ParserImportRunSchema,
  },
  {
    name: FomoV2ParserImportCheckpoint.name,
    schema: FomoV2ParserImportCheckpointSchema,
  },
  {
    name: FomoV2ParserImportFailure.name,
    schema: FomoV2ParserImportFailureSchema,
  },
  { name: FomoV2SourceSnapshot.name, schema: FomoV2SourceSnapshotSchema },
  { name: FomoV2SourceEntity.name, schema: FomoV2SourceEntitySchema },
  { name: FomoV2CanonicalProject.name, schema: FomoV2CanonicalProjectSchema },
  {
    name: FomoV2CanonicalProjectSource.name,
    schema: FomoV2CanonicalProjectSourceSchema,
  },
];

/**
 * User-state collections whose indexes are managed as part of the FOMO v2
 * activity boundary even though their schemas live in integration packages.
 */
const FOMO_V2_ACTIVITY_USER_STATE_MODEL_DEFINITIONS: FomoV2ModelDefinition[] = [
  { name: CryptoActivityFavorite.name, schema: CryptoActivityFavoriteSchema },
  { name: CryptoActivityReaction.name, schema: CryptoActivityReactionSchema },
  { name: CryptoActivityReport.name, schema: CryptoActivityReportSchema },
  {
    name: CryptoActivityCalendarItem.name,
    schema: CryptoActivityCalendarItemSchema,
  },
  {
    name: CryptoActivityBoardTask.name,
    schema: CryptoActivityBoardTaskSchema,
  },
  {
    name: CryptoActivityStepProgress.name,
    schema: CryptoActivityStepProgressSchema,
  },
  {
    name: EarlylandTaskUserState.name,
    schema: EarlylandTaskUserStateSchema,
  },
];

/** Models required by v2 runtime integrations but not index-owned by v2. */
const FOMO_V2_PRIMARY_INTEGRATION_MODEL_DEFINITIONS: FomoV2ModelDefinition[] = [
  { name: Coinmarketcap.name, schema: CoinmarketcapSchema },
  { name: Event.name, schema: EventSchema },
  { name: User.name, schema: UserSchema },
  { name: CryptoTab.name, schema: CryptoTabSchema },
  { name: ExternalAssetMirror.name, schema: ExternalAssetMirrorSchema },
];

/**
 * Primary-connection collections whose declared indexes are owned by FOMO v2.
 * This is the only registry consumed by FomoV2IndexService.
 */
export const FOMO_V2_OWNED_PRIMARY_MODEL_DEFINITIONS = buildModelRegistry(
  "owned primary",
  [
    ...FOMO_V2_CORE_MODEL_DEFINITIONS,
    ...FOMO_V2_ACTIVITY_USER_STATE_MODEL_DEFINITIONS,
    ...FOMO_V2_MARKET_MODEL_DEFINITIONS,
    ...FOMO_V2_ACTIVITY_MODEL_DEFINITIONS,
    ...FOMO_V2_BACKER_MODEL_DEFINITIONS,
    ...FOMO_V2_FUNDING_MODEL_DEFINITIONS,
    ...FOMO_V2_VESTING_MODEL_DEFINITIONS,
    ...FOMO_V2_UNLOCKS_MODEL_DEFINITIONS,
    ...FOMO_V2_IMPORT_CANDIDATE_MODEL_DEFINITIONS,
    ...FOMO_V2_LAUNCHPAD_MODEL_DEFINITIONS,
    ...FOMO_V2_PROJECT_PROFILE_MODEL_DEFINITIONS,
    ...FOMO_V2_ICO_MODEL_DEFINITIONS,
    ...FOMO_V2_PROJECT_DOMAIN_SOURCE_MODEL_DEFINITIONS,
    ...FOMO_V2_REVIEW_MODEL_DEFINITIONS,
    ...FOMO_V2_REACTION_MODEL_DEFINITIONS,
    ...FOMO_V2_FLAG_MODEL_DEFINITIONS,
  ]
);

/** Complete primary-connection registration used by FomoV2Module. */
export const FOMO_V2_PRIMARY_REGISTRATION_MODEL_DEFINITIONS =
  buildModelRegistry("primary registration", [
    ...FOMO_V2_OWNED_PRIMARY_MODEL_DEFINITIONS,
    ...FOMO_V2_PRIMARY_INTEGRATION_MODEL_DEFINITIONS,
  ]);

/**
 * Parser-connection registrations are intentionally separate. They are source
 * projections, not primary FOMO v2 collections, and must never be passed to
 * FomoV2IndexService.
 */
export const FOMO_V2_PARSER_REGISTRATION_MODEL_DEFINITIONS = buildModelRegistry(
  "parser registration",
  [
    ...FOMO_V2_ICO_PARSER_MODEL_DEFINITIONS,
    ...FOMO_V2_BACKER_PARSER_MODEL_DEFINITIONS,
    ...FOMO_V2_VESTING_PARSER_MODEL_DEFINITIONS,
  ]
);

export const FOMO_V2_OWNED_PRIMARY_MODEL_NAMES = modelNames(
  FOMO_V2_OWNED_PRIMARY_MODEL_DEFINITIONS
);
export const FOMO_V2_PRIMARY_REGISTRATION_MODEL_NAMES = modelNames(
  FOMO_V2_PRIMARY_REGISTRATION_MODEL_DEFINITIONS
);
export const FOMO_V2_PARSER_REGISTRATION_MODEL_NAMES = modelNames(
  FOMO_V2_PARSER_REGISTRATION_MODEL_DEFINITIONS
);

function buildModelRegistry(
  registryName: string,
  definitions: ReadonlyArray<FomoV2ModelDefinition>
): ReadonlyArray<FomoV2ModelDefinition> {
  const definitionsByName = new Map<string, FomoV2ModelDefinition>();
  for (const definition of definitions) {
    if (definitionsByName.has(definition.name)) {
      throw new Error(
        `Duplicate FOMO v2 ${registryName} model definition: ${definition.name}`
      );
    }
    definitionsByName.set(definition.name, definition);
  }

  return Object.freeze(
    Array.from(definitionsByName.values()).sort((left, right) =>
      left.name.localeCompare(right.name)
    )
  );
}

function modelNames(
  definitions: ReadonlyArray<FomoV2ModelDefinition>
): ReadonlyArray<string> {
  return Object.freeze(definitions.map((definition) => definition.name));
}
