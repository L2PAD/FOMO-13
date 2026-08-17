import { Coinmarketcap } from "src/coinmarketcap/models/coinmarketcap.model";
import { CryptoActivityBoardTask } from "src/crypto-activities/models/crypto-activity-board-task.model";
import { CryptoActivityCalendarItem } from "src/crypto-activities/models/crypto-activity-calendar-item.model";
import { CryptoActivityFavorite } from "src/crypto-activities/models/crypto-activity-favorite.model";
import { CryptoActivityReaction } from "src/crypto-activities/models/crypto-activity-reaction.model";
import { CryptoActivityReport } from "src/crypto-activities/models/crypto-activity-report.model";
import { CryptoActivityStepProgress } from "src/crypto-activities/models/crypto-activity-step-progress.model";
import { Event } from "src/events/models/event.model";
import { ExternalAssetMirror } from "src/storage/external-asset-mirror.model";
import { EarlylandTaskUserState } from "src/tasks/models/earlyland-task-user-state.model";
import { CryptoTab } from "src/tabs/model/tab.model";
import { User } from "src/user/user.model";
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
  FomoV2CanonicalProjectSource,
  FomoV2MigrationRun,
  FomoV2ParserControlConfig,
  FomoV2ParserControlRun,
  FomoV2ParserGlobalControl,
  FomoV2UpstreamParserFlow,
  FomoV2UpstreamParserPolicy,
  FomoV2ParserImportCheckpoint,
  FomoV2ParserImportFailure,
  FomoV2ParserImportRun,
  FomoV2SourceEntity,
  FomoV2SourceSnapshot,
} from "../models";
import { FOMO_V2_PROJECT_DOMAIN_SOURCE_MODEL_DEFINITIONS } from "../shared/source-policy/indexes/project-domain-source-model-definitions";
import {
  FOMO_V2_OWNED_PRIMARY_MODEL_DEFINITIONS,
  FOMO_V2_OWNED_PRIMARY_MODEL_NAMES,
  FOMO_V2_PARSER_REGISTRATION_MODEL_DEFINITIONS,
  FOMO_V2_PARSER_REGISTRATION_MODEL_NAMES,
  FOMO_V2_PRIMARY_REGISTRATION_MODEL_DEFINITIONS,
  FOMO_V2_PRIMARY_REGISTRATION_MODEL_NAMES,
} from "./fomo-v2-model.registry";

describe("FOMO v2 model registry", () => {
  const sortedNames = (definitions: ReadonlyArray<{ name: string }>) =>
    definitions
      .map((definition) => definition.name)
      .sort((left, right) => left.localeCompare(right));

  it("contains every owned primary model without duplicates or drift", () => {
    const expectedOwnedDefinitions = [
      { name: FomoV2MigrationRun.name },
      { name: FomoV2ParserGlobalControl.name },
      { name: FomoV2ParserControlConfig.name },
      { name: FomoV2ParserControlRun.name },
      { name: FomoV2UpstreamParserFlow.name },
      { name: FomoV2UpstreamParserPolicy.name },
      { name: FomoV2ParserImportRun.name },
      { name: FomoV2ParserImportCheckpoint.name },
      { name: FomoV2ParserImportFailure.name },
      { name: FomoV2SourceSnapshot.name },
      { name: FomoV2SourceEntity.name },
      { name: FomoV2CanonicalProject.name },
      { name: FomoV2CanonicalProjectSource.name },
      { name: CryptoActivityFavorite.name },
      { name: CryptoActivityReaction.name },
      { name: CryptoActivityReport.name },
      { name: CryptoActivityCalendarItem.name },
      { name: CryptoActivityBoardTask.name },
      { name: CryptoActivityStepProgress.name },
      { name: EarlylandTaskUserState.name },
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
    ];

    expect(FOMO_V2_OWNED_PRIMARY_MODEL_NAMES).toEqual(
      sortedNames(expectedOwnedDefinitions)
    );
    expect(new Set(FOMO_V2_OWNED_PRIMARY_MODEL_NAMES).size).toBe(
      expectedOwnedDefinitions.length
    );
  });

  it("preserves runtime integrations outside v2 index ownership", () => {
    const integrationNames = [
      Coinmarketcap.name,
      Event.name,
      User.name,
      CryptoTab.name,
      ExternalAssetMirror.name,
    ];

    expect(FOMO_V2_PRIMARY_REGISTRATION_MODEL_NAMES).toEqual(
      [...FOMO_V2_OWNED_PRIMARY_MODEL_NAMES, ...integrationNames].sort(
        (left, right) => left.localeCompare(right)
      )
    );
    expect(
      integrationNames.filter((name) =>
        FOMO_V2_OWNED_PRIMARY_MODEL_NAMES.includes(name)
      )
    ).toEqual([]);
  });

  it("keeps parser registrations separate from primary index ownership", () => {
    const expectedParserDefinitions = [
      ...FOMO_V2_ICO_PARSER_MODEL_DEFINITIONS,
      ...FOMO_V2_BACKER_PARSER_MODEL_DEFINITIONS,
      ...FOMO_V2_VESTING_PARSER_MODEL_DEFINITIONS,
    ];

    expect(FOMO_V2_PARSER_REGISTRATION_MODEL_NAMES).toEqual(
      sortedNames(expectedParserDefinitions)
    );
    expect(
      FOMO_V2_PARSER_REGISTRATION_MODEL_NAMES.filter((name) =>
        FOMO_V2_PRIMARY_REGISTRATION_MODEL_NAMES.includes(name)
      )
    ).toEqual([]);
  });

  it("uses the same schema instance for index and runtime registration", () => {
    const primaryDefinitionsByName = new Map(
      FOMO_V2_PRIMARY_REGISTRATION_MODEL_DEFINITIONS.map((definition) => [
        definition.name,
        definition,
      ])
    );

    for (const ownedDefinition of FOMO_V2_OWNED_PRIMARY_MODEL_DEFINITIONS) {
      expect(primaryDefinitionsByName.get(ownedDefinition.name)?.schema).toBe(
        ownedDefinition.schema
      );
    }

    expect(Object.isFrozen(FOMO_V2_OWNED_PRIMARY_MODEL_DEFINITIONS)).toBe(true);
    expect(
      Object.isFrozen(FOMO_V2_PRIMARY_REGISTRATION_MODEL_DEFINITIONS)
    ).toBe(true);
    expect(Object.isFrozen(FOMO_V2_PARSER_REGISTRATION_MODEL_DEFINITIONS)).toBe(
      true
    );
  });
});
