import { Injectable, Optional } from "@nestjs/common";
import { InjectConnection, InjectModel } from "@nestjs/mongoose";
import mongoose, { Connection, Model, Types } from "mongoose";
import {
  ADMIN_AI_COLLECTION_REGISTRY,
  ADMIN_AI_CONNECTION_NAME,
} from "../admin-ai-chat.constants";
import { AdminAiChatConfigService } from "../admin-ai-chat-config.service";
import { AdminAiExportService } from "../admin-ai-export.service";
import {
  TavilyWebSearchProvider,
  WebSearchProviderError,
} from "../web-search/tavily-web-search.provider";
import {
  FomoV2Backer,
  FomoV2BackerPortfolioHolding,
  FomoV2BackerSourceProfile,
  FomoV2CanonicalProject,
  FomoV2CanonicalProjectSource,
  FomoV2FundingRound,
  FomoV2FundingRoundParticipant,
  FomoV2ImportCandidate,
  FomoV2MarketAsset,
  FomoV2MarketProjectHistory,
  FomoV2MarketProjectReadModel,
  FomoV2ProjectAssetLink,
  FomoV2ProjectDomainSource,
  FomoV2ReviewBatch,
  FomoV2SourceEntity,
  FomoV2SourceSnapshot,
  FomoV2TokenAllocation,
  FomoV2UnlockEvent,
  FomoV2VestingRound,
  FomoV2VestingSchedule,
  FomoV2VestingSummary,
} from "../../fomo-v2/models";
import { FomoV2AiRedactionService } from "./fomo-v2-ai-redaction.service";
import {
  FOMO_V2_AI_TOOL_NAMES,
  AdminAiAccessMode,
  AdminAiToolExecutionContext,
  FomoV2AiToolName,
  FomoV2AiToolResult,
} from "./fomo-v2-ai-types";

const MAX_TIME_MS = 5000;
const DEFAULT_LIMIT = 20;
const MAX_LIMIT = 50;
const GENERIC_DEFAULT_LIMIT = 20;
const GENERIC_MAX_LIMIT = 200;
const GENERIC_AGGREGATE_MAX_TIME_MS = 15000;
const FORBIDDEN_COLLECTION_NAME_PATTERN = /(^system\.|\$|\0|fomo_prod|fomo_live|fomo_market|prod|production|live)/i;
const FORBIDDEN_AGGREGATE_STAGES = new Set([
  "$out",
  "$merge",
  "$currentOp",
  "$function",
  "$accumulator",
  "$where",
  "mapReduce",
]);
const SAFE_UPDATE_OPERATORS = new Set([
  "$set",
  "$unset",
  "$inc",
  "$min",
  "$max",
  "$addToSet",
  "$pull",
  "$push",
  "$setOnInsert",
]);

const FOMO_DEV_WRITE_TOOL_NAMES = [
  "fomoDevCreateReviewCase",
  "fomoDevResolveReviewCase",
  "fomoDevLinkParserSourceToProject",
  "fomoDevUnlinkParserSourceFromProject",
  "fomoDevUpdateProjectFields",
  "fomoDevUpsertSourceEvidence",
  "fomoDevMarkSourceConflict",
  "fomoDevRebuildProjectReadModel",
  "fomoDevRunImporterForProject",
  "fomoDevCreateWriteProposal",
  "fomoDevExecuteApprovedWrite",
  "fomoDevInsertOne",
  "fomoDevUpdateOne",
  "fomoDevUpdateMany",
  "fomoDevDeleteOne",
  "fomoDevDeleteMany",
  "fomoV2AnalyzeVestingReviewCase",
  "fomoV2BuildVestingReviewProposal",
] as const;

const CONDITIONAL_WRITE_TOOL_NAMES = new Set<string>([
  "fomoV2AnalyzeVestingReviewCase",
  "fomoV2BuildVestingReviewProposal",
]);

const VESTING_WRITE_COLLECTIONS = new Set([
  "token_allocations",
  "vesting_rounds",
  "vesting_schedules",
  "vesting_summaries",
  "unlock_events",
  "review_batches",
  "import_candidates",
]);

const VESTING_REVIEW_RESPONSE_TYPE = "vesting_review_compare";
const VESTING_JSON_ARRAY_KEYS = [
  "tokenAllocation",
  "vestingRounds",
  "vestingSchedule",
  "vestingTimeline",
] as const;
const SAFE_VESTING_TYPES = ["tge", "linear", "nonlinear", "cliff", "unknown"] as const;
const SAFE_DATE_CONFIDENCE = ["exact", "estimated", "unknown"] as const;
const SAFE_VESTING_CATEGORIES = [
  "seed",
  "private",
  "public_sale",
  "team",
  "advisors",
  "ecosystem",
  "foundation",
  "treasury",
  "community",
  "liquidity",
  "marketing",
  "rewards",
  "unknown",
] as const;

const FOMO_DEV_PROJECT_UPDATE_FIELDS = [
  "name",
  "slug",
  "symbol",
  "status",
  "primaryWebsiteDomain",
  "originSourceType",
  "identitySource",
  "identityConfidence",
  "isVestingReview",
] as const;

const FOMO_DEV_CONFIRMATION_REQUIRED = new Set<string>([
  ...FOMO_DEV_WRITE_TOOL_NAMES,
]);

const SAFE_SOURCE_ENTITY_TYPES = [
  "asset",
  "project",
  "project_enrichment",
  "relationship",
  "raw",
];
const SAFE_LINK_STATUSES = ["active", "proposed", "conflict", "deprecated"];
const SAFE_CONFIDENCE_LEVELS = ["exact", "high", "medium", "low", "none"];
const SAFE_REVIEW_STATUSES = ["open", "resolved", "ignored", "superseded"];

const PROJECT_FIELDS =
  "_id name normalizedName slug symbol normalizedSymbol status primaryWebsiteDomain providerIds aliases hasMarketData isVestingReview fomoScore rating fullness originSourceType identitySource identityConfidence sourceEvidence createdAt updatedAt";
const MARKET_ASSET_FIELDS =
  "_id assetType name normalizedName symbol normalizedSymbol slug providerIds websiteDomains status firstSeenAt lastSeenAt createdAt updatedAt";
const PROJECT_ASSET_LINK_FIELDS =
  "_id canonicalProjectId marketAssetId relationType status confidence source verified matchedBy reason createdAt updatedAt";
const MARKET_READ_MODEL_FIELDS =
  "_id canonicalProjectId marketAssetId projectKind name symbol slug logo niche category rank tier trading status price priceChange priceBTC priceETH priceSOL marketCap fullyDilutedMarketCap volume24h volume24hChange circulatingSupply totalSupply maxSupply circulatingSupplyPercent athUsd athUsdDate athUsdChangePercent atlUsd atlUsdDate atlUsdChangePercent usdQuote performance performanceUpdatedAt performanceSource performanceProvider marketDataUpdatedAt dateAdded chart7dUpdatedAt chart7dSource chart7dPointsCount chart7dTrend fomoScore rating fullness isVestingReview descriptionText categories topCategories website links coingeckoDetailsUpdatedAt coingeckoDetailsSource providerIds sourceCoverage createdAt updatedAt";
const MARKET_HISTORY_FIELDS =
  "_id canonicalProjectId marketAssetId timestamp bucketTimestamp price marketCap volume24h priceChange24h btcPriceUsd ethPriceUsd solPriceUsd source tier createdAt updatedAt";
const SOURCE_FIELDS =
  "_id canonicalProjectId source sourceEntityType sourceId sourceSlug sourceUrl websiteDomain sourceEntityId sourceSnapshotId confidence matchedBy reason verified status createdAt updatedAt";
const SOURCE_ENTITY_FIELDS =
  "_id entityKey source sourceEntityType sourceId sourceSlug sourceUrl websiteDomain providerIds canonicalProjectId latestSourceSnapshotId resolutionStatus confidence matchedBy reason firstSeenAt lastSeenAt createdAt updatedAt";
const SOURCE_SNAPSHOT_FIELDS =
  "_id source sourceEntityType sourceId sourceSlug sourceUrl sourceEntityKey payloadHash normalizedPreview sourceEntityId capturedAt providerUpdatedAt parserVersion createdAt updatedAt";
const FUNDING_ROUND_FIELDS =
  "_id canonicalProjectId marketAssetId roundKey roundName normalizedRoundName roundType normalizedRoundType status announcedDate date dateBucket raisedAmount raisedCurrency valuation tokenPrice tokensForSaleAmount tokensForSalePercent roi platform primarySource sourceType sourceFeed sourceId sourceSlug sourceUrl sourceEntityId sourceSnapshotId confidence createdAt updatedAt";
const FUNDING_PARTICIPANT_FIELDS =
  "_id canonicalProjectId fundingRoundId backerId backerName sourceBackerRef sourceBackerId sourceBackerSlug sourceBackerUrl role isLead status primarySource sourceEntityId sourceSnapshotId confidence createdAt updatedAt";
const BACKER_FIELDS =
  "_id name normalizedName slug backerType description website socials logoUrl avatarUrl country niche status confidence primarySource sourceId sourceUrl sourceRefs createdAt updatedAt";
const BACKER_SOURCE_FIELDS =
  "_id backerId sourceType sourceInvestorId sourceSlug sourceUrl name normalizedName backerType description website socials logoUrl avatarUrl country sourceEntityId sourceSnapshotId createdAt updatedAt";
const BACKER_HOLDING_FIELDS =
  "_id backerId canonicalProjectId roundIds participantIds firstRoundDate lastRoundDate roundTypes isLead leadRoundIds roundsCount leadRoundsCount totalKnownRaisedAmountUsd backerName backerType projectName projectSlug projectSymbol projectLogoUrl hasMarketData marketAssetId sourceTypes sourceFeeds updatedAt";
const TOKEN_ALLOCATION_FIELDS =
  "_id canonicalProjectId marketAssetId sourceType sourceId sourceSlug sourcePath sourceUrl name normalizedName allocationPercent amount saleId primarySource sourceEntityKey sourceEntityId sourceSnapshotId vestingDatasetKey sourceRefs confidence status createdAt updatedAt";
const VESTING_ROUND_FIELDS =
  "_id canonicalProjectId marketAssetId sourceType saleId roundName normalizedRoundName allocationPercent totalAmount unlockedAmountSource lockedAmountSource unlockedPercentSource lockedPercentSource valueLockedUsdSource lastUnlockDateSource primarySource sourceEntityKey sourceEntityId sourceSnapshotId vestingDatasetKey sourceRefs confidence status createdAt updatedAt";
const VESTING_SCHEDULE_FIELDS =
  "_id canonicalProjectId marketAssetId tokenAllocationId vestingRoundId sourceType saleId roundName normalizedRoundName tgeUnlockPercent vestingType vestingFrequency vestingDurationMonths startDate endDate dateConfidence currentUnlockedPercentSource currentLockedPercentSource sourceEntityKey sourceEntityId sourceSnapshotId vestingDatasetKey sourceRefs confidence status createdAt updatedAt";
const VESTING_SUMMARY_FIELDS =
  "_id canonicalProjectId sourceType vestingDatasetKey totalAmount unlockedAmount lockedAmount untrackedAmount unlockedPercent lockedPercent untrackedPercent lastUnlockDate nextUnlockDate nextUnlockEventId sourceUnlockedValueUsd sourceLockedValueUsd calculatedAt createdAt updatedAt";
const UNLOCK_EVENT_FIELDS =
  "_id canonicalProjectId marketAssetId tokenAllocationId vestingRoundId vestingScheduleId vestingDatasetKey unlockKey sourceType sourceEventId saleId sourcePath unlockDate statusSource amount percentOfSupply roundName normalizedRoundName stage unlockType unlockTypes isTgeUnlock sourceValueUsd sourceMarketCapSharePercent eventOrigin eventOrigins sourceFetchedAt importedAt sourceRefs appliedAt appliedStatus applyAttempts lastApplyAttemptAt applyError createdAt updatedAt";
const REVIEW_BATCH_FIELDS =
  "_id domain reason status canonicalProjectId projectKey projectName normalizedProjectName currentSourceType incomingSourceType affectedEntityTypes candidateCount fingerprint firstSeenAt lastSeenAt seenCount createdAt updatedAt";
const IMPORT_CANDIDATE_FIELDS =
  "_id domain entityType sourceType sourceId sourceSlug sourceUrl sourcePath name symbol slug normalizedName normalizedSymbol normalizedSlug status firstSeenAt lastSeenAt seenCount createdAt updatedAt";

@Injectable()
export class FomoV2AiToolsService {
  constructor(
    @InjectModel(FomoV2CanonicalProject.name, ADMIN_AI_CONNECTION_NAME)
    private readonly canonicalProjectModel: Model<any>,
    @InjectModel(FomoV2CanonicalProjectSource.name, ADMIN_AI_CONNECTION_NAME)
    private readonly canonicalProjectSourceModel: Model<any>,
    @InjectModel(FomoV2SourceEntity.name, ADMIN_AI_CONNECTION_NAME)
    private readonly sourceEntityModel: Model<any>,
    @InjectModel(FomoV2SourceSnapshot.name, ADMIN_AI_CONNECTION_NAME)
    private readonly sourceSnapshotModel: Model<any>,
    @InjectModel(FomoV2MarketAsset.name, ADMIN_AI_CONNECTION_NAME)
    private readonly marketAssetModel: Model<any>,
    @InjectModel(FomoV2ProjectAssetLink.name, ADMIN_AI_CONNECTION_NAME)
    private readonly projectAssetLinkModel: Model<any>,
    @InjectModel(FomoV2MarketProjectReadModel.name, ADMIN_AI_CONNECTION_NAME)
    private readonly marketReadModel: Model<any>,
    @InjectModel(FomoV2MarketProjectHistory.name, ADMIN_AI_CONNECTION_NAME)
    private readonly marketHistoryModel: Model<any>,
    @InjectModel(FomoV2FundingRound.name, ADMIN_AI_CONNECTION_NAME)
    private readonly fundingRoundModel: Model<any>,
    @InjectModel(FomoV2FundingRoundParticipant.name, ADMIN_AI_CONNECTION_NAME)
    private readonly fundingParticipantModel: Model<any>,
    @InjectModel(FomoV2Backer.name, ADMIN_AI_CONNECTION_NAME)
    private readonly backerModel: Model<any>,
    @InjectModel(FomoV2BackerSourceProfile.name, ADMIN_AI_CONNECTION_NAME)
    private readonly backerSourceModel: Model<any>,
    @InjectModel(FomoV2BackerPortfolioHolding.name, ADMIN_AI_CONNECTION_NAME)
    private readonly backerHoldingModel: Model<any>,
    @InjectModel(FomoV2TokenAllocation.name, ADMIN_AI_CONNECTION_NAME)
    private readonly tokenAllocationModel: Model<any>,
    @InjectModel(FomoV2VestingRound.name, ADMIN_AI_CONNECTION_NAME)
    private readonly vestingRoundModel: Model<any>,
    @InjectModel(FomoV2VestingSchedule.name, ADMIN_AI_CONNECTION_NAME)
    private readonly vestingScheduleModel: Model<any>,
    @InjectModel(FomoV2VestingSummary.name, ADMIN_AI_CONNECTION_NAME)
    private readonly vestingSummaryModel: Model<any>,
    @InjectModel(FomoV2UnlockEvent.name, ADMIN_AI_CONNECTION_NAME)
    private readonly unlockEventModel: Model<any>,
    @InjectModel(FomoV2ReviewBatch.name, ADMIN_AI_CONNECTION_NAME)
    private readonly reviewBatchModel: Model<any>,
    @InjectModel(FomoV2ImportCandidate.name, ADMIN_AI_CONNECTION_NAME)
    private readonly importCandidateModel: Model<any>,
    @InjectModel(FomoV2ProjectDomainSource.name, ADMIN_AI_CONNECTION_NAME)
    private readonly projectDomainSourceModel: Model<any>,
    @InjectConnection(ADMIN_AI_CONNECTION_NAME)
    private readonly adminConnection: Connection,
    private readonly adminAiConfig: AdminAiChatConfigService,
    private readonly redactionService: FomoV2AiRedactionService,
    @Optional()
    private readonly webSearchProvider?: TavilyWebSearchProvider,
    @Optional()
    private readonly exportService?: AdminAiExportService
  ) {}

  getToolDefinitions() {
    return [
      this.tool("fomoV2FindProject", "Find FOMO v2 projects by ObjectId, slug, name, symbol, market asset id, or source id/slug.", {
        type: "object",
        properties: { query: { type: "string" }, limit: { type: "number" } },
        required: ["query"],
      }),
      this.tool("fomoV2GetProjectFullContext", "Get compact full FOMO v2 context for one canonical project or market asset.", {
        type: "object",
        properties: {
          canonicalProjectId: { type: "string" },
          marketAssetId: { type: "string" },
          slug: { type: "string" },
          query: { type: "string" },
          limit: { type: "number" },
        },
      }),
      this.tool("fomoV2GetMarketContext", "Get market read model and latest market history for a project.", {
        type: "object",
        properties: {
          canonicalProjectId: { type: "string" },
          marketAssetId: { type: "string" },
          slug: { type: "string" },
          query: { type: "string" },
          limit: { type: "number" },
        },
      }),
      this.tool("fomoV2GetSourceContext", "Get project source links, source entities, source evidence summaries, and review/source conflicts.", {
        type: "object",
        properties: {
          canonicalProjectId: { type: "string" },
          marketAssetId: { type: "string" },
          slug: { type: "string" },
          query: { type: "string" },
          limit: { type: "number" },
        },
      }),
      this.tool("fomoV2GetFundingContext", "Get funding rounds, participants, linked backers, and unresolved funding/backer mappings for a project.", {
        type: "object",
        properties: {
          canonicalProjectId: { type: "string" },
          marketAssetId: { type: "string" },
          slug: { type: "string" },
          query: { type: "string" },
          limit: { type: "number" },
        },
      }),
      this.tool("fomoV2GetBackerContext", "Get backer profile, sources, portfolio holdings, participants, and related projects by backer name/slug/id.", {
        type: "object",
        properties: { query: { type: "string" }, backerId: { type: "string" }, limit: { type: "number" } },
      }),
      this.tool("fomoV2GetTokenomicsContext", "Get token allocations, vesting schedules, vesting summaries, and unlock events for a project.", {
        type: "object",
        properties: {
          canonicalProjectId: { type: "string" },
          marketAssetId: { type: "string" },
          slug: { type: "string" },
          query: { type: "string" },
          limit: { type: "number" },
        },
      }),
      this.tool("fomoV2FindVestingReviewCases", "Find projects with proposed/review vesting, token allocation, unlock, or import-candidate work in fomo_dev. Read-only.", {
        type: "object",
        properties: {
          limit: { type: "number" },
          status: { type: "string", enum: ["proposed", "active", "review", "all"] },
          sortBy: {
            type: "string",
            enum: [
              "reviewWeight",
              "proposedVestingCount",
              "proposedAllocationCount",
              "unlockEventsCount",
              "reviewCasesCount",
              "importCandidatesCount",
            ],
          },
          filters: { type: "object" },
        },
      }),
      this.tool("fomoV2GetVestingReviewContext", "Get compact vesting/tokenomics review context for one project, including saleId map and source links. Read-only.", {
        type: "object",
        properties: {
          canonicalProjectId: { type: "string" },
          projectId: { type: "string" },
          query: { type: "string" },
          includeParserContext: { type: "boolean" },
          includeSourceLinks: { type: "boolean" },
          includeReviewHistory: { type: "boolean" },
          limit: { type: "number" },
        },
      }),
      this.tool("fomoV2ExportVestingReviews", "Create one downloadable raw JSON/JSONL export of open review_batches ordered by top project market rank. Use this once for JSON/raw/full-data requests instead of fetching each project context. Read-only.", {
        type: "object",
        properties: {
          limit: { type: "number", minimum: 1, maximum: 1000 },
          status: { type: "string", enum: ["open", "resolved", "ignored", "superseded"] },
          domain: { type: "string", enum: ["vesting", "all"] },
          format: { type: "string", enum: ["json", "jsonl"] },
          compression: { type: "string", enum: ["none", "gzip"] },
        },
      }),
      this.tool("fomoV2AnalyzeVestingSaleIds", "Analyze saleId consistency across token allocations, vesting schedules, and unlock events. Read-only.", {
        type: "object",
        properties: {
          canonicalProjectId: { type: "string" },
          projectId: { type: "string" },
          query: { type: "string" },
          limit: { type: "number" },
        },
      }),
      this.tool("fomoV2NormalizeVestingNames", "Suggest canonical vesting/allocation names while preserving sourceName separately. Read-only.", {
        type: "object",
        properties: {
          canonicalProjectId: { type: "string" },
          projectId: { type: "string" },
          query: { type: "string" },
          names: { type: "array", items: { type: "string" } },
          includeExistingDbNames: { type: "boolean" },
          includeSourceNames: { type: "boolean" },
          limit: { type: "number" },
        },
      }),
      this.tool("fomoV2FindOfficialSourceLinks", "Find likely official project links from fomo_dev source/read-model data and recommend focused source queries. Read-only.", {
        type: "object",
        properties: {
          canonicalProjectId: { type: "string" },
          projectId: { type: "string" },
          query: { type: "string" },
          includeParserLinks: { type: "boolean" },
          limit: { type: "number" },
        },
      }),
      this.tool("fomoWebSearchOfficialSources", "Search official/public source candidates when a configured provider exists. Adapter-ready; no shell/web scraping.", {
        type: "object",
        properties: {
          projectName: { type: "string" },
          symbol: { type: "string" },
          website: { type: "string" },
          intent: { type: "string", enum: ["tokenomics", "vesting", "unlock schedule", "allocation", "whitepaper", "docs"] },
          trustedDomains: { type: "array", items: { type: "string" } },
          limit: { type: "number" },
        },
        required: ["projectName", "intent"],
      }),
      this.tool("fomoWebFetchSourceSummary", "Fetch a safe source summary when a configured fetch provider exists; blocks private/non-http URLs and raw HTML exposure.", {
        type: "object",
        properties: {
          url: { type: "string" },
          expectedProject: { type: "string" },
          intent: { type: "string", enum: ["tokenomics", "vesting", "unlock schedule", "allocation"] },
        },
        required: ["url"],
      }),
      this.tool("fomoV2AnalyzeVestingReviewCase", "Analyze a vesting review case and optionally create a proposal-only planned change set for admin approval.", {
        type: "object",
        properties: {
          canonicalProjectId: { type: "string" },
          projectId: { type: "string" },
          query: { type: "string" },
          reviewCaseId: { type: "string" },
          tokenAllocationIds: { type: "array", items: { type: "string" } },
          vestingScheduleIds: { type: "array", items: { type: "string" } },
          unlockEventIds: { type: "array", items: { type: "string" } },
          useOfficialSources: { type: "boolean" },
          useWebSearch: { type: "boolean" },
          maxSources: { type: "number" },
          mode: { type: "string", enum: ["analysis_only", "proposal"] },
          dryRun: { type: "boolean" },
          confirm: { type: "boolean" },
        },
      }),
      this.tool("fomoV2BuildVestingReviewProposal", "Build a compare-ready vesting_review_compare payload with canonical current/proposed JSON, issues, saleId map, sources, and optional approval planned changes.", {
        type: "object",
        properties: {
          projectQuery: { type: "string" },
          canonicalProjectId: { type: "string" },
          projectId: { type: "string" },
          query: { type: "string" },
          reviewCaseId: { type: "string" },
          currentJson: { type: "object" },
          proposedJson: { type: "object" },
          editedPayload: { type: "object" },
          adminNote: { type: "string" },
          mode: {
            type: "string",
            enum: ["from_review_case", "from_current_context", "from_user_json"],
          },
          useOfficialSources: { type: "boolean" },
          useWebSearch: { type: "boolean" },
          outputMode: {
            type: "string",
            enum: ["analysis_only", "compare_payload", "write_proposal"],
          },
          dryRun: { type: "boolean" },
          confirm: { type: "boolean" },
          limit: { type: "number" },
          maxSources: { type: "number" },
        },
      }),
      this.tool("fomoV2FindDuplicates", "Find possible duplicate canonical projects, backers, or source entities by name, slug, symbol, or source links.", {
        type: "object",
        properties: {
          entityType: { type: "string", enum: ["canonicalProject", "backer", "sourceEntity"] },
          query: { type: "string" },
          name: { type: "string" },
          symbol: { type: "string" },
          slug: { type: "string" },
          limit: { type: "number" },
        },
        required: ["entityType"],
      }),
      this.tool("fomoV2ExplainMissingData", "Diagnose why a crypto-domain field is missing for a project. Read-only.", {
        type: "object",
        properties: {
          canonicalProjectId: { type: "string" },
          marketAssetId: { type: "string" },
          slug: { type: "string" },
          query: { type: "string" },
          field: {
            type: "string",
            enum: ["logo", "marketData", "fundingRounds", "backers", "allocation", "vesting", "unlocks", "sourceLinks"],
          },
        },
        required: ["field"],
      }),
      this.tool("fomoV2CollectionStats", "Get aggregate counts for FOMO v2 crypto-domain collections only.", {
        type: "object",
        properties: { includeBreakdowns: { type: "boolean" } },
      }),
      this.tool("fomoDevFindProject", "Find projects in fomo_dev by id, slug, name, symbol, market asset id, or source id/slug. Read-only.", {
        type: "object",
        properties: { query: { type: "string" }, limit: { type: "number" } },
        required: ["query"],
      }),
      this.tool("fomoDevGetProjectFullContext", "Get compact full fomo_dev context for one canonical project or market asset. Read-only.", {
        type: "object",
        properties: {
          canonicalProjectId: { type: "string" },
          marketAssetId: { type: "string" },
          slug: { type: "string" },
          query: { type: "string" },
          limit: { type: "number" },
        },
      }),
      this.tool("fomoDevGetMarketContext", "Get fomo_dev market read model and latest market history for a project. Read-only.", {
        type: "object",
        properties: {
          canonicalProjectId: { type: "string" },
          marketAssetId: { type: "string" },
          slug: { type: "string" },
          query: { type: "string" },
          limit: { type: "number" },
        },
      }),
      this.tool("fomoDevGetFundingContext", "Get fomo_dev funding rounds, participants, linked backers, and unresolved funding/backer mappings. Read-only.", {
        type: "object",
        properties: {
          canonicalProjectId: { type: "string" },
          marketAssetId: { type: "string" },
          slug: { type: "string" },
          query: { type: "string" },
          limit: { type: "number" },
        },
      }),
      this.tool("fomoDevGetBackerContext", "Get fomo_dev backer profile, sources, holdings, participants, and related projects. Read-only.", {
        type: "object",
        properties: { query: { type: "string" }, backerId: { type: "string" }, limit: { type: "number" } },
      }),
      this.tool("fomoDevGetTokenomicsContext", "Get fomo_dev token allocations, vesting schedules, summaries, and unlock events. Read-only.", {
        type: "object",
        properties: {
          canonicalProjectId: { type: "string" },
          marketAssetId: { type: "string" },
          slug: { type: "string" },
          query: { type: "string" },
          limit: { type: "number" },
        },
      }),
      this.tool("fomoDevGetSourceEvidence", "Get fomo_dev source links, source entities, source snapshots, source evidence, and source conflicts. Read-only.", {
        type: "object",
        properties: {
          canonicalProjectId: { type: "string" },
          marketAssetId: { type: "string" },
          slug: { type: "string" },
          query: { type: "string" },
          limit: { type: "number" },
        },
      }),
      this.tool("fomoDevSearchReviewCases", "Search fomo_dev review cases in review_batches. Read-only.", {
        type: "object",
        properties: {
          canonicalProjectId: { type: "string" },
          status: { type: "string", enum: SAFE_REVIEW_STATUSES },
          reason: { type: "string" },
          domain: { type: "string" },
          query: { type: "string" },
          limit: { type: "number" },
        },
      }),
      this.tool("fomoDevCreateReviewCase", "Create a typed review case in fomo_dev.review_batches. Requires dryRun and confirm=true when dryRun=false.", {
        type: "object",
        properties: {
          dryRun: { type: "boolean" },
          confirm: { type: "boolean" },
          domain: { type: "string" },
          reason: { type: "string" },
          canonicalProjectId: { type: "string" },
          projectKey: { type: "string" },
          projectName: { type: "string" },
          currentSourceType: { type: "string" },
          incomingSourceType: { type: "string" },
          affectedEntityTypes: { type: "array", items: { type: "string" } },
          candidates: { type: "array", items: { type: "object" } },
          metadata: { type: "object" },
        },
        required: ["dryRun", "domain", "reason"],
      }),
      this.tool("fomoDevResolveReviewCase", "Resolve, ignore, or supersede one fomo_dev review case by id. Requires dryRun and confirm=true when dryRun=false.", {
        type: "object",
        properties: {
          dryRun: { type: "boolean" },
          confirm: { type: "boolean" },
          reviewCaseId: { type: "string" },
          id: { type: "string" },
          status: { type: "string", enum: ["resolved", "ignored", "superseded"] },
          resolutionNote: { type: "string" },
        },
        required: ["dryRun", "status"],
      }),
      this.tool("fomoDevLinkParserSourceToProject", "Create or update a typed fomo_dev canonical_project_sources link from parser/source data. Requires dryRun and confirm=true when dryRun=false.", {
        type: "object",
        properties: {
          dryRun: { type: "boolean" },
          confirm: { type: "boolean" },
          canonicalProjectId: { type: "string" },
          source: { type: "string" },
          sourceEntityType: { type: "string", enum: SAFE_SOURCE_ENTITY_TYPES },
          sourceId: { type: "string" },
          sourceSlug: { type: "string" },
          sourceUrl: { type: "string" },
          websiteDomain: { type: "string" },
          sourceEntityId: { type: "string" },
          sourceSnapshotId: { type: "string" },
          confidence: { type: "string", enum: SAFE_CONFIDENCE_LEVELS },
          status: { type: "string", enum: SAFE_LINK_STATUSES },
          reason: { type: "string" },
          verified: { type: "boolean" },
        },
        required: ["dryRun", "canonicalProjectId", "source", "sourceEntityType"],
      }),
      this.tool("fomoDevUnlinkParserSourceFromProject", "Deprecate one typed fomo_dev canonical_project_sources link. Requires dryRun and confirm=true when dryRun=false.", {
        type: "object",
        properties: {
          dryRun: { type: "boolean" },
          confirm: { type: "boolean" },
          sourceLinkId: { type: "string" },
          canonicalProjectId: { type: "string" },
          source: { type: "string" },
          sourceId: { type: "string" },
          sourceSlug: { type: "string" },
          reason: { type: "string" },
        },
        required: ["dryRun"],
      }),
      this.tool("fomoDevUpdateProjectFields", "Update allowlisted fields on one fomo_dev canonical project. Requires dryRun and confirm=true when dryRun=false.", {
        type: "object",
        properties: {
          dryRun: { type: "boolean" },
          confirm: { type: "boolean" },
          canonicalProjectId: { type: "string" },
          fields: { type: "object" },
          reason: { type: "string" },
        },
        required: ["dryRun", "canonicalProjectId", "fields"],
      }),
      this.tool("fomoDevUpsertSourceEvidence", "Upsert one controlled sourceEvidence entry on a fomo_dev canonical project. Requires dryRun and confirm=true when dryRun=false.", {
        type: "object",
        properties: {
          dryRun: { type: "boolean" },
          confirm: { type: "boolean" },
          canonicalProjectId: { type: "string" },
          evidenceKey: { type: "string" },
          evidence: { type: "object" },
        },
        required: ["dryRun", "canonicalProjectId", "evidenceKey", "evidence"],
      }),
      this.tool("fomoDevMarkSourceConflict", "Create a typed SOURCE_CONFLICT review case in fomo_dev and optionally mark one source link as conflict. Requires dryRun and confirm=true when dryRun=false.", {
        type: "object",
        properties: {
          dryRun: { type: "boolean" },
          confirm: { type: "boolean" },
          canonicalProjectId: { type: "string" },
          domain: { type: "string" },
          currentSourceType: { type: "string" },
          incomingSourceType: { type: "string" },
          affectedEntityTypes: { type: "array", items: { type: "string" } },
          candidates: { type: "array", items: { type: "object" } },
          sourceLinkId: { type: "string" },
          note: { type: "string" },
        },
        required: ["dryRun", "canonicalProjectId", "domain", "currentSourceType", "incomingSourceType"],
      }),
      this.tool("fomoDevRebuildProjectReadModel", "Plan a safe fomo_dev project read-model rebuild for one project. Actual runner execution is blocked from the LLM tool path.", {
        type: "object",
        properties: {
          dryRun: { type: "boolean" },
          confirm: { type: "boolean" },
          canonicalProjectId: { type: "string" },
          marketAssetId: { type: "string" },
          query: { type: "string" },
          reason: { type: "string" },
        },
        required: ["dryRun"],
      }),
      this.tool("fomoDevRunImporterForProject", "Create a safe importer run proposal for one fomo_dev project. Actual importer execution is blocked from the LLM tool path.", {
        type: "object",
        properties: {
          dryRun: { type: "boolean" },
          confirm: { type: "boolean" },
          importerKey: { type: "string" },
          canonicalProjectId: { type: "string" },
          query: { type: "string" },
          reason: { type: "string" },
        },
        required: ["dryRun", "importerKey"],
      }),
      this.tool("fomoDevListCollections", "List fomo_dev collections. Read-only.", {
        type: "object",
        properties: {},
      }),
      this.tool("fomoDevCollectionStats", "Get fomo_dev collection stats by collectionName or all safe collections. Read-only.", {
        type: "object",
        properties: {
          collectionName: { type: "string" },
          limit: { type: "number" },
        },
      }),
      this.tool("fomoDevFind", "Find documents in one fomo_dev collection with a JSON filter, projection, sort, and limit. Read-only.", {
        type: "object",
        properties: {
          collectionName: { type: "string" },
          filter: { type: "object" },
          projection: { type: "object" },
          sort: { type: "object" },
          limit: { type: "number" },
        },
        required: ["collectionName"],
      }),
      this.tool("fomoDevFindMany", "Alias of fomoDevFind for safe multi-document fomo_dev reads.", {
        type: "object",
        properties: {
          collectionName: { type: "string" },
          filter: { type: "object" },
          projection: { type: "object" },
          sort: { type: "object" },
          limit: { type: "number" },
        },
        required: ["collectionName"],
      }),
      this.tool("fomoDevFindOne", "Find one document in one fomo_dev collection with a JSON filter. Read-only.", {
        type: "object",
        properties: {
          collectionName: { type: "string" },
          filter: { type: "object" },
          projection: { type: "object" },
          sort: { type: "object" },
        },
        required: ["collectionName"],
      }),
      this.tool("fomoDevCount", "Count documents in one fomo_dev collection with a JSON filter. Read-only.", {
        type: "object",
        properties: {
          collectionName: { type: "string" },
          filter: { type: "object" },
        },
        required: ["collectionName"],
      }),
      this.tool("fomoDevAggregate", "Run a safe read-only aggregate on one fomo_dev collection. Blocks write/admin stages.", {
        type: "object",
        properties: {
          collectionName: { type: "string" },
          pipeline: { type: "array", items: { type: "object" } },
          limit: { type: "number" },
        },
        required: ["collectionName", "pipeline"],
      }),
      this.tool("fomoDevAggregateReadOnly", "Alias of fomoDevAggregate for safe read-only fomo_dev aggregation.", {
        type: "object",
        properties: {
          collectionName: { type: "string" },
          pipeline: { type: "array", items: { type: "object" } },
          limit: { type: "number" },
        },
        required: ["collectionName", "pipeline"],
      }),
      this.tool("fomoDevCreateJsonExport", "Create a downloadable streaming JSON/JSONL export for any allowed fomo_dev collection. Use for raw data, large result sets, or a whole collection. The file is generated by the backend and is never passed through the model. Read-only.", {
        type: "object",
        properties: {
          collectionName: { type: "string" },
          filter: { type: "object" },
          projection: { type: "object" },
          sort: { type: "object" },
          limit: { type: "number", minimum: 0 },
          format: { type: "string", enum: ["json", "jsonl"] },
          compression: { type: "string", enum: ["none", "gzip"] },
          filenamePrefix: { type: "string" },
        },
        required: ["collectionName"],
      }),
      this.tool("fomoDevCreateWriteProposal", "Create or approve a safe fomo_dev write proposal through the Admin AI approval flow.", {
        type: "object",
        properties: {
          collectionName: { type: "string" },
          operation: { type: "string", enum: ["insertOne", "updateOne"] },
          filter: { type: "object" },
          document: { type: "object" },
          update: { type: "object" },
          dryRun: { type: "boolean" },
          confirm: { type: "boolean" },
        },
        required: ["collectionName", "operation"],
      }),
      this.tool("fomoDevPreviewWriteDiff", "Preview a safe fomo_dev write diff without executing.", {
        type: "object",
        properties: {
          collectionName: { type: "string" },
          operation: { type: "string", enum: ["insertOne", "updateOne"] },
          filter: { type: "object" },
          document: { type: "object" },
          update: { type: "object" },
        },
        required: ["collectionName", "operation"],
      }),
      this.tool("fomoDevExecuteApprovedWrite", "Execute a backend-approved fomo_dev write proposal. Direct chat calls still pass through approval guard.", {
        type: "object",
        properties: {
          collectionName: { type: "string" },
          operation: { type: "string", enum: ["insertOne", "updateOne"] },
          filter: { type: "object" },
          document: { type: "object" },
          update: { type: "object" },
          dryRun: { type: "boolean" },
          confirm: { type: "boolean" },
        },
        required: ["collectionName", "operation"],
      }),
      this.tool("fomoDevInsertOne", "Insert one document into one fomo_dev collection under the current access mode.", {
        type: "object",
        properties: {
          collectionName: { type: "string" },
          document: { type: "object" },
          dryRun: { type: "boolean" },
          confirm: { type: "boolean" },
        },
        required: ["collectionName", "document"],
      }),
      this.tool("fomoDevUpdateOne", "Update one document in one fomo_dev collection with a safe JSON update under the current access mode.", {
        type: "object",
        properties: {
          collectionName: { type: "string" },
          filter: { type: "object" },
          update: { type: "object" },
          upsert: { type: "boolean" },
          dryRun: { type: "boolean" },
          confirm: { type: "boolean" },
        },
        required: ["collectionName", "filter", "update"],
      }),
      this.tool("fomoDevUpdateMany", "Update many documents in one fomo_dev collection with a safe JSON update. Requires confirm=true for execution.", {
        type: "object",
        properties: {
          collectionName: { type: "string" },
          filter: { type: "object" },
          update: { type: "object" },
          dryRun: { type: "boolean" },
          confirm: { type: "boolean" },
        },
        required: ["collectionName", "filter", "update"],
      }),
      this.tool("fomoDevDeleteOne", "Delete one document in one fomo_dev collection under the current access mode.", {
        type: "object",
        properties: {
          collectionName: { type: "string" },
          filter: { type: "object" },
          dryRun: { type: "boolean" },
          confirm: { type: "boolean" },
        },
        required: ["collectionName", "filter"],
      }),
      this.tool("fomoDevDeleteMany", "Delete many documents in one fomo_dev collection. Requires confirm=true for execution.", {
        type: "object",
        properties: {
          collectionName: { type: "string" },
          filter: { type: "object" },
          dryRun: { type: "boolean" },
          confirm: { type: "boolean" },
        },
        required: ["collectionName", "filter"],
      }),
    ];
  }

  async executeTool(
    name: string,
    input: Record<string, unknown> = {},
    context: AdminAiToolExecutionContext = {}
  ) {
    const startedAt = Date.now();

    if (!FOMO_V2_AI_TOOL_NAMES.includes(name as FomoV2AiToolName)) {
      return this.result(name, {
        error: "Unknown or disabled tool",
        allowedTools: FOMO_V2_AI_TOOL_NAMES,
      });
    }

    try {
      const toolName = name as FomoV2AiToolName;
      const accessMode = this.resolveAccessMode(context.accessMode);
      const pendingResult = await this.pendingOrBlockedWriteResult(
        toolName,
        input,
        accessMode,
        context
      );
      if (pendingResult) {
        return {
          ...pendingResult,
          data: this.redactionService.redact(pendingResult.data) as Record<string, unknown>,
          durationMs: Date.now() - startedAt,
        };
      }

      this.ensureToolGuard(toolName, input, accessMode, context);
      const result = await this.dispatchTool(toolName, input, context);
      return {
        ...result,
        data: this.redactionService.redact(result.data) as Record<string, unknown>,
        durationMs: Date.now() - startedAt,
      };
    } catch (error: any) {
      return this.result(name, {
        error: error?.message || "FOMO v2 tool failed",
        errorCode: error?.code || error?.name || "TOOL_ERROR",
      });
    }
  }

  private ensureToolGuard(
    name: FomoV2AiToolName,
    input: Record<string, unknown>,
    accessMode: AdminAiAccessMode,
    context: AdminAiToolExecutionContext = {}
  ) {
    if (!this.isGenericDevTool(name) && !context.approvalExecution) {
      this.adminAiConfig.assertSafeAiToolInput(input);
    }
    const isWrite = this.isDevWriteTool(name, input);
    const dryRun = this.isDryRun(input);

    this.adminAiConfig.ensureAiToolDbAccess({
      dbName: this.adminAiConfig.getDbName(),
      access: isWrite && !dryRun ? "write" : "read",
      accessMode,
    });

    if (isWrite && !dryRun && FOMO_DEV_CONFIRMATION_REQUIRED.has(name)) {
      this.assertConfirmed(input);
    }
  }

  async fomoV2CollectionStats(input: Record<string, unknown> = {}) {
    this.adminAiConfig.ensureDevDatabaseScope();
    const includeBreakdowns = input.includeBreakdowns !== false;
    const [
      canonicalProjects,
      marketReadModels,
      marketAssets,
      projectAssetLinks,
      canonicalProjectSources,
      sourceEntities,
      sourceSnapshots,
      projectDomainSources,
      reviewCases,
      backers,
      backerSources,
      backerPortfolioHoldings,
      fundingRounds,
      fundingRoundParticipants,
      tokenAllocations,
      vestingRounds,
      vestingSchedules,
      vestingSummaries,
      unlockEvents,
      importCandidates,
      unresolvedSourceEntities,
      openImportCandidates,
    ] = await Promise.all([
      this.count(this.canonicalProjectModel),
      this.count(this.marketReadModel),
      this.count(this.marketAssetModel),
      this.count(this.projectAssetLinkModel),
      this.count(this.canonicalProjectSourceModel),
      this.count(this.sourceEntityModel),
      this.count(this.sourceSnapshotModel),
      this.count(this.projectDomainSourceModel),
      this.count(this.reviewBatchModel),
      this.count(this.backerModel),
      this.count(this.backerSourceModel),
      this.count(this.backerHoldingModel),
      this.count(this.fundingRoundModel),
      this.count(this.fundingParticipantModel),
      this.count(this.tokenAllocationModel),
      this.count(this.vestingRoundModel),
      this.count(this.vestingScheduleModel),
      this.count(this.vestingSummaryModel),
      this.count(this.unlockEventModel),
      this.count(this.importCandidateModel),
      this.count(this.sourceEntityModel, { resolutionStatus: "unresolved" }),
      this.count(this.importCandidateModel, { status: "open" }),
    ]);

    const breakdowns = includeBreakdowns
      ? {
          canonicalProjectsByStatus: await this.groupCount(this.canonicalProjectModel, "status"),
          marketAssetsByStatus: await this.groupCount(this.marketAssetModel, "status"),
          projectAssetLinksByStatus: await this.groupCount(this.projectAssetLinkModel, "status"),
          canonicalProjectSourcesByStatus: await this.groupCount(this.canonicalProjectSourceModel, "status"),
          sourceEntitiesByResolution: await this.groupCount(this.sourceEntityModel, "resolutionStatus"),
          reviewCasesByStatus: await this.groupCount(this.reviewBatchModel, "status"),
          reviewCasesByReason: await this.groupCount(this.reviewBatchModel, "reason"),
          fundingRoundsByStatus: await this.groupCount(this.fundingRoundModel, "status"),
          fundingParticipantsByStatus: await this.groupCount(this.fundingParticipantModel, "status"),
          tokenAllocationsByStatus: await this.groupCount(this.tokenAllocationModel, "status"),
          vestingSchedulesByStatus: await this.groupCount(this.vestingScheduleModel, "status"),
          unlockEventsByAppliedStatus: await this.groupCount(this.unlockEventModel, "appliedStatus"),
          importCandidatesByStatus: await this.groupCount(this.importCandidateModel, "status"),
        }
      : undefined;

    return this.result("fomoV2CollectionStats", {
      snapshotTitle: "FOMO v2 dev DB snapshot",
      collections: {
        canonical_projects: canonicalProjects,
        market_project_read_models: marketReadModels,
        market_assets: marketAssets,
        project_asset_links: projectAssetLinks,
        canonical_project_sources: canonicalProjectSources,
        source_entities: sourceEntities,
        source_snapshots: sourceSnapshots,
        source_evidence: {
          configured: false,
          note: "Stored as embedded sourceEvidence/normalizedPreview fields, not a separate Mongoose collection.",
        },
        source_conflicts: {
          configured: false,
          note: "Represented by review_batches with source_conflict reason and conflict statuses on source/link records.",
        },
        project_domain_sources: projectDomainSources,
        review_cases: {
          collection: "review_batches",
          count: reviewCases,
        },
        backers,
        backer_sources: {
          collection: "backer_source_profiles",
          count: backerSources,
        },
        backer_portfolio_holdings: backerPortfolioHoldings,
        funding_rounds: fundingRounds,
        funding_round_participants: fundingRoundParticipants,
        token_allocations: tokenAllocations,
        token_allocation_snapshots: {
          configured: false,
          note: "No Mongoose model found in current backend.",
        },
        vesting_rounds: vestingRounds,
        vesting_schedules: vestingSchedules,
        vesting_summaries: vestingSummaries,
        vesting_events: {
          configured: false,
          note: "No separate vesting_events model found; use vesting_schedules, vesting_summaries, and unlock_events.",
        },
        unlock_events: unlockEvents,
        import_candidates: importCandidates,
        unresolved_mappings: {
          source_entities: unresolvedSourceEntities,
          import_candidates: openImportCandidates,
        },
      },
      breakdowns,
    });
  }

  async fomoV2FindProject(input: Record<string, unknown>) {
    const query = String(input.query || "").trim();
    const limit = this.limit(input.limit, 10);

    if (!query) {
      return this.result("fomoV2FindProject", { candidates: [], reason: "query is required" }, { limit });
    }

    const candidates = await this.findProjectCandidates(query, limit);

    return this.result("fomoV2FindProject", { query, candidates }, { limit });
  }

  async fomoV2GetProjectFullContext(input: Record<string, unknown>) {
    const limit = this.limit(input.limit, DEFAULT_LIMIT);
    const resolved = await this.resolveProject(input);

    if (!resolved.canonicalProjectId && !resolved.marketAssetId) {
      return this.result("fomoV2GetProjectFullContext", { resolved, error: "Project not found" }, { limit });
    }

    const [canonicalProject, marketContext, sourceContext, fundingContext, tokenomicsContext] =
      await Promise.all([
        resolved.canonicalProjectId
          ? this.findById(this.canonicalProjectModel, resolved.canonicalProjectId, PROJECT_FIELDS)
          : null,
        this.getMarketContextData(resolved, limit),
        resolved.canonicalProjectId
          ? this.getSourceContextData(resolved.canonicalProjectId, limit)
          : null,
        resolved.canonicalProjectId
          ? this.getFundingContextData(resolved.canonicalProjectId, limit)
          : null,
        resolved.canonicalProjectId
          ? this.getTokenomicsContextData(resolved.canonicalProjectId, limit)
          : null,
      ]);

    const reviewCases = resolved.canonicalProjectId
      ? await this.findMany(
          this.reviewBatchModel,
          { canonicalProjectId: resolved.canonicalProjectId },
          REVIEW_BATCH_FIELDS,
          { lastSeenAt: -1, _id: -1 },
          limit
        )
      : [];

    return this.result(
      "fomoV2GetProjectFullContext",
      {
        resolved,
        canonicalProject,
        market: marketContext,
        sources: sourceContext,
        funding: fundingContext,
        tokenomics: tokenomicsContext,
        reviewCases,
      },
      { limit }
    );
  }

  async fomoV2GetMarketContext(input: Record<string, unknown>) {
    const limit = this.limit(input.limit, DEFAULT_LIMIT);
    const resolved = await this.resolveProject(input);
    const data = await this.getMarketContextData(resolved, limit);

    return this.result("fomoV2GetMarketContext", { resolved, ...data }, { limit });
  }

  async fomoV2GetSourceContext(input: Record<string, unknown>) {
    const limit = this.limit(input.limit, DEFAULT_LIMIT);
    const resolved = await this.resolveProject(input);

    if (!resolved.canonicalProjectId) {
      return this.result("fomoV2GetSourceContext", { resolved, error: "canonicalProjectId is required or could not be resolved" }, { limit });
    }

    const data = await this.getSourceContextData(resolved.canonicalProjectId, limit);
    return this.result("fomoV2GetSourceContext", { resolved, ...data }, { limit });
  }

  async fomoV2GetFundingContext(input: Record<string, unknown>) {
    const limit = this.limit(input.limit, DEFAULT_LIMIT);
    const resolved = await this.resolveProject(input);

    if (!resolved.canonicalProjectId) {
      return this.result("fomoV2GetFundingContext", { resolved, error: "canonicalProjectId is required or could not be resolved" }, { limit });
    }

    const data = await this.getFundingContextData(resolved.canonicalProjectId, limit);
    return this.result("fomoV2GetFundingContext", { resolved, ...data }, { limit });
  }

  async fomoV2GetBackerContext(input: Record<string, unknown>) {
    const limit = this.limit(input.limit, DEFAULT_LIMIT);
    const backer = await this.resolveBacker(input);

    if (!backer?._id) {
      return this.result("fomoV2GetBackerContext", { error: "Backer not found", query: input.query || input.backerId }, { limit });
    }

    const [sources, holdings, participants] = await Promise.all([
      this.findMany(this.backerSourceModel, { backerId: backer._id }, BACKER_SOURCE_FIELDS, { updatedAt: -1, _id: -1 }, limit),
      this.findMany(this.backerHoldingModel, { backerId: backer._id }, BACKER_HOLDING_FIELDS, { lastRoundDate: -1, _id: -1 }, limit),
      this.findMany(this.fundingParticipantModel, { backerId: backer._id }, FUNDING_PARTICIPANT_FIELDS, { updatedAt: -1, _id: -1 }, limit),
    ]);

    const projectIds = holdings
      .map((item: any) => item.canonicalProjectId)
      .filter(Boolean)
      .slice(0, limit);
    const relatedProjects = projectIds.length
      ? await this.findMany(this.canonicalProjectModel, { _id: { $in: projectIds } }, PROJECT_FIELDS, { name: 1 }, limit)
      : [];

    return this.result(
      "fomoV2GetBackerContext",
      { backer, sources, portfolioHoldings: holdings, fundingRoundParticipants: participants, relatedProjects },
      { limit }
    );
  }

  async fomoV2GetTokenomicsContext(input: Record<string, unknown>) {
    const limit = this.limit(input.limit, DEFAULT_LIMIT);
    const resolved = await this.resolveProject(input);

    if (!resolved.canonicalProjectId) {
      return this.result("fomoV2GetTokenomicsContext", { resolved, error: "canonicalProjectId is required or could not be resolved" }, { limit });
    }

    const data = await this.getTokenomicsContextData(resolved.canonicalProjectId, limit);
    return this.result("fomoV2GetTokenomicsContext", { resolved, ...data }, { limit });
  }

  async fomoV2FindVestingReviewCases(input: Record<string, unknown>) {
    const limit = this.limit(input.limit, 10);
    const status = this.safeEnum(input.status, ["proposed", "active", "review", "all"], "review");
    const sortBy = this.safeEnum(
      input.sortBy,
      [
        "reviewWeight",
        "proposedVestingCount",
        "proposedAllocationCount",
        "unlockEventsCount",
        "reviewCasesCount",
        "importCandidatesCount",
      ],
      "reviewWeight"
    );
    const filters = this.safeObject(input.filters || {}, 20);
    const statusMatch = this.vestingStatusMatch(status);
    const reviewMatch = this.vestingReviewMatch(status);
    const importMatch = this.vestingImportCandidateMatch(status);
    const readLimit = Math.min(limit * 10, 200);

    const [tokenAllocations, vestingSchedules, unlockEvents, reviewCases, importCandidates] =
      await Promise.all([
        this.findMany(this.tokenAllocationModel, statusMatch, TOKEN_ALLOCATION_FIELDS, { updatedAt: -1, _id: -1 }, readLimit),
        this.findMany(this.vestingScheduleModel, statusMatch, VESTING_SCHEDULE_FIELDS, { updatedAt: -1, _id: -1 }, readLimit),
        this.findMany(this.unlockEventModel, status === "all" ? {} : { appliedStatus: { $ne: "applied" } }, UNLOCK_EVENT_FIELDS, { unlockDate: 1, _id: 1 }, readLimit),
        this.findMany(this.reviewBatchModel, reviewMatch, REVIEW_BATCH_FIELDS, { lastSeenAt: -1, _id: -1 }, readLimit),
        this.findMany(this.importCandidateModel, importMatch, IMPORT_CANDIDATE_FIELDS, { lastSeenAt: -1, _id: -1 }, readLimit),
      ]);

    const groups = new Map<string, any>();
    const addRecord = (kind: string, record: any) => {
      const canonicalProjectId = this.idString(record?.canonicalProjectId);
      const key = canonicalProjectId || record?.projectKey || record?.normalizedProjectName || record?.normalizedName || record?.name || "unlinked";
      const group = groups.get(key) || {
        canonicalProjectId,
        projectId: canonicalProjectId,
        project: {
          name: record?.projectName || record?.name || record?.roundName,
          symbol: record?.symbol,
          slug: record?.slug,
          website: undefined,
        },
        counts: {
          tokenAllocations: 0,
          proposedTokenAllocations: 0,
          activeTokenAllocations: 0,
          vestingSchedules: 0,
          proposedVestingSchedules: 0,
          activeVestingSchedules: 0,
          unlockEvents: 0,
          reviewCases: 0,
          importCandidates: 0,
          missingSaleId: 0,
          missingName: 0,
        },
        reviewWeight: 0,
        reasons: [] as string[],
        riskFlags: [] as string[],
        sampleIds: {
          tokenAllocationIds: [] as string[],
          vestingScheduleIds: [] as string[],
          unlockEventIds: [] as string[],
          reviewCaseIds: [] as string[],
          importCandidateIds: [] as string[],
        },
      };

      if (canonicalProjectId && !group.canonicalProjectId) {
        group.canonicalProjectId = canonicalProjectId;
        group.projectId = canonicalProjectId;
      }

      if (!group.project.name && (record?.projectName || record?.name || record?.roundName)) {
        group.project.name = record?.projectName || record?.name || record?.roundName;
      }

      const sampleId = this.idString(record?._id);
      const statusValue = String(record?.status || record?.appliedStatus || "").toLowerCase();
      const hasSaleId = this.hasUsefulSaleId(record?.saleId);
      const hasName = Boolean(record?.name || record?.roundName || record?.projectName);

      if (kind === "tokenAllocation") {
        group.counts.tokenAllocations += 1;
        if (statusValue.includes("proposed") || statusValue.includes("review")) group.counts.proposedTokenAllocations += 1;
        if (statusValue.includes("active")) group.counts.activeTokenAllocations += 1;
        if (sampleId && group.sampleIds.tokenAllocationIds.length < 5) group.sampleIds.tokenAllocationIds.push(sampleId);
      } else if (kind === "vestingSchedule") {
        group.counts.vestingSchedules += 1;
        if (statusValue.includes("proposed") || statusValue.includes("review")) group.counts.proposedVestingSchedules += 1;
        if (statusValue.includes("active")) group.counts.activeVestingSchedules += 1;
        if (sampleId && group.sampleIds.vestingScheduleIds.length < 5) group.sampleIds.vestingScheduleIds.push(sampleId);
      } else if (kind === "unlockEvent") {
        group.counts.unlockEvents += 1;
        if (sampleId && group.sampleIds.unlockEventIds.length < 5) group.sampleIds.unlockEventIds.push(sampleId);
      } else if (kind === "reviewCase") {
        group.counts.reviewCases += 1;
        if (sampleId && group.sampleIds.reviewCaseIds.length < 5) group.sampleIds.reviewCaseIds.push(sampleId);
      } else if (kind === "importCandidate") {
        group.counts.importCandidates += 1;
        if (sampleId && group.sampleIds.importCandidateIds.length < 5) group.sampleIds.importCandidateIds.push(sampleId);
      }

      if ((kind === "tokenAllocation" || kind === "vestingSchedule" || kind === "unlockEvent") && !hasSaleId) {
        group.counts.missingSaleId += 1;
      }
      if ((kind === "tokenAllocation" || kind === "vestingSchedule") && !hasName) {
        group.counts.missingName += 1;
      }

      group.reviewWeight =
        group.counts.proposedTokenAllocations * 5 +
        group.counts.proposedVestingSchedules * 5 +
        group.counts.reviewCases * 4 +
        group.counts.importCandidates * 3 +
        group.counts.missingSaleId * 2 +
        group.counts.unlockEvents;

      group.reasons = this.vestingCaseReasons(group.counts);
      group.riskFlags = this.vestingRiskFlags(group.counts);
      groups.set(key, group);
    };

    tokenAllocations.forEach((record: any) => addRecord("tokenAllocation", record));
    vestingSchedules.forEach((record: any) => addRecord("vestingSchedule", record));
    unlockEvents.forEach((record: any) => addRecord("unlockEvent", record));
    reviewCases.forEach((record: any) => addRecord("reviewCase", record));
    importCandidates.forEach((record: any) => addRecord("importCandidate", record));

    const projectIds = this.uniqueIds(Array.from(groups.values()).map((item) => item.canonicalProjectId));
    const projects = projectIds.length
      ? await this.findMany(this.canonicalProjectModel, { _id: { $in: projectIds } }, PROJECT_FIELDS, { updatedAt: -1, _id: -1 }, projectIds.length)
      : [];
    const projectById = new Map(projects.map((project: any) => [String(project._id), project]));

    let items = Array.from(groups.values()).map((item) => {
      const project = item.canonicalProjectId ? projectById.get(String(item.canonicalProjectId)) : null;
      return {
        ...item,
        project: {
          name: project?.name || item.project.name,
          symbol: project?.symbol || item.project.symbol,
          slug: project?.slug || item.project.slug,
          website: project?.primaryWebsiteDomain || item.project.website,
        },
      };
    });

    const query = this.safeString(filters.projectQuery, 120).toLowerCase();
    if (query) {
      items = items.filter((item) =>
        [item.project?.name, item.project?.symbol, item.project?.slug, item.canonicalProjectId]
          .filter(Boolean)
          .some((value) => String(value).toLowerCase().includes(query))
      );
    }
    if (filters.hasUnlockEvents !== undefined) {
      items = items.filter((item) => Boolean(item.counts.unlockEvents) === Boolean(filters.hasUnlockEvents));
    }
    if (filters.missingSaleId !== undefined) {
      items = items.filter((item) => Boolean(item.counts.missingSaleId) === Boolean(filters.missingSaleId));
    }
    if (filters.missingName !== undefined) {
      items = items.filter((item) => Boolean(item.counts.missingName) === Boolean(filters.missingName));
    }
    if (filters.hasConflicts !== undefined) {
      items = items.filter((item) => item.riskFlags.length > 0 === Boolean(filters.hasConflicts));
    }

    const sortMap: Record<string, (item: any) => number> = {
      reviewWeight: (item) => item.reviewWeight,
      proposedVestingCount: (item) => item.counts.proposedVestingSchedules,
      proposedAllocationCount: (item) => item.counts.proposedTokenAllocations,
      unlockEventsCount: (item) => item.counts.unlockEvents,
      reviewCasesCount: (item) => item.counts.reviewCases,
      importCandidatesCount: (item) => item.counts.importCandidates,
    };
    items.sort((left, right) => sortMap[sortBy](right) - sortMap[sortBy](left));

    return this.result(
      "fomoV2FindVestingReviewCases",
      {
        items: items.slice(0, limit),
        summary: {
          totalProjectsMatched: items.length,
          warnings: items.length ? [] : ["No vesting review candidates were found in the sampled fomo_dev collections."],
        },
      },
      { limit, collectionsRead: this.collectionsForTool("fomoV2FindVestingReviewCases") }
    );
  }

  async fomoV2GetVestingReviewContext(input: Record<string, unknown>) {
    const limit = this.limit(input.limit, DEFAULT_LIMIT);
    const context = await this.buildVestingReviewContext(input, limit);
    return this.result("fomoV2GetVestingReviewContext", context, {
      limit,
      collectionsRead: this.collectionsForTool("fomoV2GetVestingReviewContext"),
    });
  }

  async fomoV2ExportVestingReviews(
    input: Record<string, unknown>,
    context: AdminAiToolExecutionContext
  ) {
    if (!this.exportService) {
      return this.result("fomoV2ExportVestingReviews", {
        error: "JSON export service is unavailable",
        errorCode: "EXPORT_SERVICE_UNAVAILABLE",
      });
    }
    const limit = this.integerInRange(input.limit, 10, 1, 1000);
    const status = this.safeEnum(
      input.status,
      ["open", "resolved", "ignored", "superseded"],
      "open"
    );
    const domain = this.safeEnum(input.domain, ["vesting", "all"], "vesting");
    const format = this.safeEnum(input.format, ["json", "jsonl"], "json");
    const compression = this.safeEnum(input.compression, ["none", "gzip"], "none");
    const artifact = await this.exportService.createExport(
      {
        kind: "vesting_reviews",
        collectionName: "review_batches",
        spec: { limit, status, domain, sortBy: "project_rank" },
        format: format as "json" | "jsonl",
        compression: compression as "none" | "gzip",
        filenamePrefix: `${domain}-reviews-${status}-top-${limit}`,
      },
      context
    );
    return this.result(
      "fomoV2ExportVestingReviews",
      {
        status: "queued",
        artifact,
        summary: `Raw ${domain} review export queued for ${limit} ${status} review cases ordered by project rank.`,
      },
      { collectionsRead: ["review_batches", "canonical_projects", "market_project_read_models"] }
    );
  }

  async fomoV2AnalyzeVestingSaleIds(input: Record<string, unknown>) {
    const limit = this.limit(input.limit, DEFAULT_LIMIT);
    const context = await this.buildVestingReviewContext(input, limit);
    if ((context as any).error) {
      return this.result("fomoV2AnalyzeVestingSaleIds", context, { limit });
    }

    const analysis = this.analyzeVestingSaleIdContext(context as any);
    return this.result("fomoV2AnalyzeVestingSaleIds", analysis, {
      limit,
      collectionsRead: this.collectionsForTool("fomoV2AnalyzeVestingSaleIds"),
    });
  }

  async fomoV2NormalizeVestingNames(input: Record<string, unknown>) {
    const limit = this.limit(input.limit, DEFAULT_LIMIT);
    const warnings: string[] = [];
    const explicitNames = this.safeStringArray(input.names, 50, 160);
    const names: Array<{ sourceName: string; currentName?: string; targetId?: string; collectionName?: string }> = explicitNames.map((name) => ({
      sourceName: name,
      currentName: name,
    }));

    if ((input.includeExistingDbNames !== false || input.includeSourceNames === true) && (input.canonicalProjectId || input.projectId || input.query)) {
      const context = await this.buildVestingReviewContext(input, limit);
      if (!(context as any).error) {
        const allRecords = [
          ...((context as any).currentV2Data?.tokenAllocations || []),
          ...((context as any).currentV2Data?.vestingSchedules || []),
          ...((context as any).proposedData?.tokenAllocations || []),
          ...((context as any).proposedData?.vestingSchedules || []),
        ];
        allRecords.forEach((record: any) => {
          const sourceName = input.includeSourceNames === false ? record.name : record.sourceName || record.name;
          if (sourceName) {
            names.push({
              sourceName,
              currentName: record.name,
              targetId: record.id,
              collectionName: record.collectionName,
            });
          }
        });
      } else if (!explicitNames.length) {
        return this.result("fomoV2NormalizeVestingNames", context, { limit });
      }
    }

    const seen = new Set<string>();
    const nameCandidates = names
      .filter((item) => {
        const key = `${item.collectionName || ""}:${item.targetId || ""}:${item.sourceName}:${item.currentName || ""}`.toLowerCase();
        if (seen.has(key)) return false;
        seen.add(key);
        return true;
      })
      .slice(0, limit)
      .map((item) => this.normalizeVestingNameCandidate(item));

    if (!nameCandidates.length) {
      warnings.push("No vesting names were supplied or found in current project context.");
    }

    return this.result(
      "fomoV2NormalizeVestingNames",
      { nameCandidates, warnings },
      { limit, collectionsRead: this.collectionsForTool("fomoV2NormalizeVestingNames") }
    );
  }

  async fomoV2FindOfficialSourceLinks(input: Record<string, unknown>) {
    const limit = this.limit(input.limit, DEFAULT_LIMIT);
    const context = await this.buildOfficialSourceContext(input, limit);
    return this.result("fomoV2FindOfficialSourceLinks", context, {
      limit,
      collectionsRead: this.collectionsForTool("fomoV2FindOfficialSourceLinks"),
    });
  }

  async fomoWebSearchOfficialSources(input: Record<string, unknown>) {
    const projectName = this.safeString(input.projectName, 160);
    const symbol = this.safeString(input.symbol, 40);
    const website = this.safeString(input.website, 240);
    const intent = this.safeEnum(
      input.intent,
      ["tokenomics", "vesting", "unlock schedule", "allocation", "whitepaper", "docs"],
      ""
    );
    const limit = this.limit(input.limit, 10);
    const trustedDomains = this.safeStringArray(input.trustedDomains, 20, 160)
      .map((domain) => this.hostFromDomainOrUrl(domain))
      .filter(Boolean);
    const queries = this.officialSourceSearchQueries(
      { name: projectName, symbol, website },
      intent || "tokenomics",
      trustedDomains
    );

    if (!projectName || !intent) {
      return this.result("fomoWebSearchOfficialSources", {
        provider: "tavily",
        queries,
        results: [],
        error: "projectName and intent are required",
        errorCode: "WEB_SEARCH_INPUT_REQUIRED",
        warnings: ["No web search was attempted."],
      });
    }

    const providerStatus = this.webSearchProvider?.getStatus() || {
      provider: "tavily",
      configured: false,
      enabled: false,
      errorCode: "WEB_SEARCH_PROVIDER_NOT_CONFIGURED",
      maxResults: limit,
      timeoutMs: 0,
      officialPriority: true,
    };

    if (!providerStatus.configured) {
      return this.webSearchResult({
        providerStatus,
        queries,
        results: [],
        error: providerStatus.errorCode === "WEB_SEARCH_PROVIDER_UNSUPPORTED"
          ? "Configured web search provider is not supported."
          : "Web search provider is not configured for Admin AI Chat.",
        errorCode: providerStatus.errorCode || "WEB_SEARCH_PROVIDER_NOT_CONFIGURED",
        warnings: [
          "Official web validation is unavailable until Tavily is configured.",
          "No shell, browser automation, or arbitrary web scraping was used.",
        ],
        limit,
      });
    }

    const rawResults: any[] = [];
    const executedQueries: string[] = [];
    const warnings: string[] = [];
    const queryLimit = Math.min(queries.length, 5);

    try {
      for (const query of queries.slice(0, queryLimit)) {
        const response = await this.webSearchProvider!.search({
          query,
          limit,
          includeDomains: trustedDomains,
          searchDepth: "advanced",
        });
        executedQueries.push(response.query || query);
        rawResults.push(
          ...(response.results || []).map((result) => ({
            ...result,
            query,
          }))
        );
        if (rawResults.length >= limit * 2) break;
      }
    } catch (error: any) {
      const code = error instanceof WebSearchProviderError
        ? error.code
        : "WEB_SEARCH_PROVIDER_ERROR";
      return this.webSearchResult({
        providerStatus,
        queries,
        executedQueries,
        results: [],
        error: error?.message || "Web search provider failed.",
        errorCode: code,
        warnings: [
          "Tavily search failed; continue with DB links only.",
          "No raw provider response or API key was returned.",
        ],
        limit,
      });
    }

    const results = this.rankWebSearchResults(
      this.dedupeWebSearchResults(
        rawResults.map((result) =>
          this.classifyWebSearchResult(result, {
            projectName,
            symbol,
            website,
            trustedDomains,
          })
        )
      ),
      Boolean(providerStatus.officialPriority)
    ).slice(0, limit);

    if (!results.length) {
      warnings.push("Tavily returned no usable results for the generated official-source queries.");
    }

    return this.webSearchResult({
      providerStatus,
      queries,
      executedQueries,
      results,
      error: results.length ? undefined : "Tavily search returned no results.",
      errorCode: results.length ? undefined : "WEB_SEARCH_NO_RESULTS",
      warnings,
      limit,
    });
  }

  async fomoWebFetchSourceSummary(input: Record<string, unknown>) {
    const url = this.safeString(input.url, 1000);
    const validation = this.validateSafeFetchUrl(url);
    if (!validation.ok) {
      return this.result("fomoWebFetchSourceSummary", {
        url,
        sourceType: "unknown",
        officialLikelihood: "low",
        extractedFacts: [],
        sourceSummary: "",
        error: validation.error,
        errorCode: validation.errorCode,
        warnings: ["No request was made for this URL."],
      });
    }

    return this.result("fomoWebFetchSourceSummary", {
      url,
      finalUrl: validation.url,
      sourceType: this.classifySourceUrl(validation.url),
      officialLikelihood: "medium",
      extractedFacts: [],
      sourceSummary: "",
      error: "Web fetch provider is not configured for Admin AI Chat.",
      errorCode: "WEB_FETCH_PROVIDER_NOT_CONFIGURED",
      warnings: [
        "Safe URL validation passed, but no fetch was attempted because no backend fetch provider is configured.",
        "Raw HTML is never returned by this adapter-ready tool.",
      ],
    });
  }

  async fomoV2AnalyzeVestingReviewCase(
    input: Record<string, unknown>,
    context: AdminAiToolExecutionContext = {}
  ) {
    const limit = this.limit(input.maxSources || input.limit, DEFAULT_LIMIT);
    const mode = this.safeEnum(input.mode, ["analysis_only", "proposal"], "analysis_only");
    const dryRun = this.isDryRun(input);
    const confirm = Boolean(input.confirm);
    const vestingContext = await this.buildVestingReviewContext(input, limit);
    if ((vestingContext as any).error) {
      return this.result("fomoV2AnalyzeVestingReviewCase", {
        ...vestingContext,
        requiresApproval: false,
      }, { limit });
    }

    const officialSources = input.useOfficialSources === false
      ? { links: [], recommendedSearchQueries: [], warnings: ["Official source lookup was disabled by input."] }
      : await this.buildOfficialSourceContext(input, limit);
    const saleIdAnalysis = this.analyzeVestingSaleIdContext(vestingContext as any);
    const nameRecommendations = this.vestingNameRecommendationsFromContext(vestingContext as any, limit);
    const sourcesUsed = ((officialSources as any).links || []).slice(0, limit).map((link: any) => ({
      url: link.url,
      sourceType: link.type || link.sourceType || "unknown",
      officialLikelihood: link.officialLikelihood || "medium",
      evidenceStrength: link.officialLikelihood === "high" ? "strong" : link.officialLikelihood === "medium" ? "medium" : "weak",
    }));
    let webSearchSummary: Record<string, unknown> | undefined;
    const warnings = [
      ...((vestingContext as any).warnings || []),
      ...((officialSources as any).warnings || []),
      ...((saleIdAnalysis as any).warnings || []),
    ];

    if (
      input.useOfficialSources !== false &&
      input.useWebSearch !== false &&
      !this.hasSufficientOfficialEvidence(sourcesUsed)
    ) {
      const project = (vestingContext as any).project || {};
      const searchResult = await this.fomoWebSearchOfficialSources({
        projectName: project.name,
        symbol: project.symbol,
        website: project.website,
        intent: "tokenomics",
        trustedDomains: ((officialSources as any).links || [])
          .filter((link: any) => link.officialLikelihood === "high")
          .map((link: any) => this.hostFromDomainOrUrl(link.url))
          .filter(Boolean),
        limit,
      });
      const searchData = searchResult.data || {};
      webSearchSummary = {
        provider: searchData.provider,
        queryCount: searchData.queryCount,
        resultCount: searchData.resultCount,
        officialHighCount: searchData.officialHighCount,
        officialMediumCount: searchData.officialMediumCount,
        thirdPartyCount: searchData.thirdPartyCount,
        errorCode: searchData.errorCode,
      };
      warnings.push(...((searchData.warnings as string[] | undefined) || []));
      if (searchData.errorCode) {
        warnings.push(`Web search unavailable or incomplete: ${searchData.errorCode}`);
      }
      sourcesUsed.push(
        ...(((searchData.results as any[]) || []).slice(0, limit).map((result: any) => ({
          url: result.url,
          sourceType: result.sourceType,
          officialLikelihood: result.officialLikelihood,
          evidenceStrength: result.officialLikelihood === "high" ? "strong" : result.officialLikelihood === "medium" ? "medium" : "weak",
        })))
      );
    }

    const proposedData = (vestingContext as any).proposedData || {};
    const currentData = (vestingContext as any).currentV2Data || {};
    const riskFlags = Array.from(new Set([
      ...saleIdAnalysis.saleIdGroups.flatMap((group: any) => group.warnings || []),
      ...nameRecommendations.flatMap((item: any) => item.riskFlags || []),
    ])).slice(0, 20);
    const finalRecommendation = this.vestingFinalRecommendation({
      sourcesUsed,
      riskFlags,
      hasProposedData:
        (proposedData.tokenAllocations || []).length > 0 ||
        (proposedData.vestingSchedules || []).length > 0 ||
        (proposedData.unlockEvents || []).length > 0,
      useOfficialSources: input.useOfficialSources !== false,
    });
    const plannedChanges = mode === "proposal"
      ? this.buildVestingPlannedChanges(vestingContext as any, nameRecommendations, saleIdAnalysis.recommendations)
      : [];

    if (mode === "proposal" && !dryRun && confirm && context.approvalExecution) {
      const approvedPlannedChanges = Array.isArray(input.approvedPlannedChanges)
        ? input.approvedPlannedChanges as any[]
        : plannedChanges;
      const execution = await this.executeVestingPlannedChanges(approvedPlannedChanges);
      return this.devWriteResult(
        "fomoV2AnalyzeVestingReviewCase",
        {
          dryRun,
          confirm,
          status: execution.error ? "error" : "done",
          project: (vestingContext as any).project,
          sourcesUsed,
          webSearchSummary,
          finalRecommendation,
          plannedChanges: approvedPlannedChanges,
          requiresApproval: false,
          ...execution,
          warnings,
        },
        this.collectionsForTool("fomoV2AnalyzeVestingReviewCase")
      );
    }

    return this.devWriteResult(
      "fomoV2AnalyzeVestingReviewCase",
      {
        dryRun,
        confirm,
        status: mode === "proposal" ? "planned" : "done",
        project: (vestingContext as any).project,
        sourcesUsed,
        webSearchSummary,
        currentDataSummary: {
          allocations: (currentData.tokenAllocations || []).length,
          vestingSchedules: (currentData.vestingSchedules || []).length,
          unlockEvents: (currentData.unlockEvents || []).length,
        },
        proposedDataSummary: {
          allocations: (proposedData.tokenAllocations || []).length,
          vestingSchedules: (proposedData.vestingSchedules || []).length,
          unlockEvents: (proposedData.unlockEvents || []).length,
        },
        comparison: this.vestingComparison(currentData, proposedData, sourcesUsed, saleIdAnalysis),
        nameRecommendations,
        saleIdRecommendations: saleIdAnalysis.recommendations,
        finalRecommendation,
        riskFlags,
        plannedChanges,
        requiresApproval: mode === "proposal",
        createdCount: 0,
        updatedCount: 0,
        modifiedCount: 0,
        affectedIds: plannedChanges.flatMap((change: any) => [
          this.idString(change.filter?._id),
          this.idString(change.document?._id),
        ]).filter(Boolean),
        warnings,
      },
      this.collectionsForTool("fomoV2AnalyzeVestingReviewCase")
    );
  }

  async fomoV2BuildVestingReviewProposal(
    input: Record<string, unknown>,
    context: AdminAiToolExecutionContext = {}
  ) {
    const limit = this.limit(input.maxSources || input.limit, DEFAULT_LIMIT);
    const mode = this.safeEnum(
      input.mode,
      ["from_review_case", "from_current_context", "from_user_json"],
      input.currentJson || input.proposedJson ? "from_user_json" : "from_review_case"
    );
    const outputMode = this.safeEnum(
      input.outputMode,
      ["analysis_only", "compare_payload", "write_proposal"],
      "compare_payload"
    );
    const dryRun = this.isDryRun(input);
    const confirm = Boolean(input.confirm);
    const warnings: string[] = [];
    const contextInput = {
      ...input,
      query: input.projectQuery || input.query,
      includeSourceLinks: true,
      includeReviewHistory: true,
    };
    const shouldLoadContext =
      mode !== "from_user_json" ||
      Boolean(input.canonicalProjectId || input.projectId || input.projectQuery || input.query || input.reviewCaseId);
    const vestingContext = shouldLoadContext
      ? await this.buildVestingReviewContext(contextInput, limit)
      : {};

    if ((vestingContext as any).error && mode !== "from_user_json") {
      return this.result("fomoV2BuildVestingReviewProposal", {
        responseType: VESTING_REVIEW_RESPONSE_TYPE,
        status: "error",
        error: (vestingContext as any).error,
        errorCode: "VESTING_REVIEW_CONTEXT_NOT_FOUND",
        project: (vestingContext as any).project || {},
        currentJson: null,
        proposedJson: this.emptyVestingReviewJson(),
        diffSummary: this.emptyVestingDiffSummary(),
        issues: [],
        saleIdMap: [],
        nameChanges: [],
        sourcesUsed: [],
        recommendation: "manual_review",
        confidence: 0.2,
        requiresApproval: false,
        warnings: (vestingContext as any).warnings || [],
      }, { limit, collectionsRead: this.collectionsForTool("fomoV2BuildVestingReviewProposal") });
    }

    warnings.push(...(((vestingContext as any).warnings as string[] | undefined) || []));
    const currentJson = input.currentJson
      ? this.normalizeVestingReviewJson(input.currentJson)
      : this.vestingReviewJsonFromContextData((vestingContext as any).currentV2Data);
    const contextProposedJson = this.vestingReviewJsonFromContextData((vestingContext as any).proposedData);
    const proposedJson = input.proposedJson
      ? this.normalizeVestingReviewJson(input.proposedJson)
      : this.hasVestingReviewJsonData(contextProposedJson)
        ? contextProposedJson
        : this.hasVestingReviewJsonData(currentJson)
          ? currentJson
          : this.emptyVestingReviewJson();
    const editedPayload = input.editedPayload && typeof input.editedPayload === "object"
      ? this.normalizeVestingReviewJson(input.editedPayload)
      : undefined;
    const activeProposedJson = editedPayload || proposedJson;
    const proposedValidation = this.validateVestingReviewJson(activeProposedJson);
    const currentValidation = this.hasVestingReviewJsonData(currentJson)
      ? this.validateVestingReviewJson(currentJson)
      : { valid: true, errors: [], warnings: [] };

    warnings.push(...proposedValidation.warnings, ...currentValidation.warnings);

    const saleIdMap = this.buildVestingCompareSaleIdMap(activeProposedJson);
    const sourcesUsed = await this.buildVestingReviewSourcesUsed({
      input: contextInput,
      vestingContext,
      limit,
      useOfficialSources: input.useOfficialSources !== false,
      useWebSearch: input.useWebSearch !== false,
      warnings,
    });
    const nameChanges = this.buildVestingReviewNameChanges(currentJson, activeProposedJson);
    const issues = this.buildVestingReviewIssues({
      currentJson,
      proposedJson: activeProposedJson,
      saleIdMap,
      nameChanges,
      sourcesUsed,
      validationErrors: proposedValidation.errors,
    });
    const diffSummary = this.buildVestingJsonDiffSummary(currentJson, activeProposedJson, issues);
    const recommendation = this.vestingReviewCompareRecommendation({
      proposedJson: activeProposedJson,
      issues,
      sourcesUsed,
      useOfficialSources: input.useOfficialSources !== false,
    });
    const confidence = this.vestingReviewCompareConfidence({
      recommendation,
      issues,
      sourcesUsed,
      validationValid: proposedValidation.valid,
    });
    const nameRecommendations = this.vestingNameRecommendationsFromContext(vestingContext as any, limit);
    const saleIdAnalysis = this.analyzeVestingSaleIdContext(vestingContext as any);
    const plannedChanges = outputMode === "write_proposal"
      ? this.buildVestingPlannedChanges(vestingContext as any, nameRecommendations, saleIdAnalysis.recommendations)
      : [];
    const affectedIds = plannedChanges.flatMap((change: any) => [
      this.idString(change.filter?._id),
      this.idString(change.document?._id),
    ]).filter(Boolean);
    const payload = {
      responseType: VESTING_REVIEW_RESPONSE_TYPE,
      dryRun,
      confirm,
      status: outputMode === "write_proposal" ? "planned" : "done",
      project: (vestingContext as any).project || {},
      recommendation,
      confidence,
      currentJson: this.hasVestingReviewJsonData(currentJson) ? currentJson : null,
      proposedJson: activeProposedJson,
      originalProposedJson: editedPayload ? proposedJson : undefined,
      editedPayloadApplied: Boolean(editedPayload),
      diffSummary,
      issues,
      saleIdMap,
      nameChanges,
      sourcesUsed,
      validation: {
        valid: proposedValidation.valid,
        errors: proposedValidation.errors,
        warnings: proposedValidation.warnings,
      },
      plannedChanges: outputMode === "write_proposal" ? plannedChanges : undefined,
      requiresApproval: outputMode === "write_proposal",
      createdCount: 0,
      updatedCount: 0,
      modifiedCount: 0,
      affectedIds,
      warnings: Array.from(new Set(warnings)).slice(0, 30),
      adminNote: this.safeString(input.adminNote, 500) || undefined,
    };

    if (outputMode === "write_proposal" && !dryRun && confirm && context.approvalExecution) {
      if (!proposedValidation.valid) {
        return this.devWriteResult(
          "fomoV2BuildVestingReviewProposal",
          {
            ...payload,
            status: "error",
            requiresApproval: false,
            error: "Edited/proposed vesting review JSON is invalid",
            errorCode: "VESTING_REVIEW_JSON_INVALID",
          },
          this.collectionsForTool("fomoV2BuildVestingReviewProposal")
        );
      }
      const approvedPlannedChanges = Array.isArray(input.approvedPlannedChanges)
        ? input.approvedPlannedChanges as any[]
        : plannedChanges;
      const execution = await this.executeVestingPlannedChanges(approvedPlannedChanges);

      return this.devWriteResult(
        "fomoV2BuildVestingReviewProposal",
        {
          ...payload,
          status: execution.error ? "error" : "done",
          plannedChanges: approvedPlannedChanges,
          requiresApproval: false,
          ...execution,
          affectedIds: execution.affectedIds || affectedIds,
        },
        this.collectionsForTool("fomoV2BuildVestingReviewProposal")
      );
    }

    return this.devWriteResult(
      "fomoV2BuildVestingReviewProposal",
      payload,
      this.collectionsForTool("fomoV2BuildVestingReviewProposal")
    );
  }

  async fomoV2FindDuplicates(input: Record<string, unknown>) {
    const entityType = String(input.entityType || "");
    const query = String(input.query || input.name || input.slug || input.symbol || "").trim();
    const limit = this.limit(input.limit, 20);

    if (!["canonicalProject", "backer", "sourceEntity"].includes(entityType)) {
      return this.result("fomoV2FindDuplicates", { error: "entityType must be canonicalProject, backer, or sourceEntity" }, { limit });
    }

    const data = query
      ? await this.findDuplicateCandidates(entityType, query, limit)
      : await this.findDuplicateGroups(entityType, limit);

    return this.result("fomoV2FindDuplicates", { entityType, query: query || undefined, ...data }, { limit });
  }

  async fomoV2ExplainMissingData(input: Record<string, unknown>) {
    const field = String(input.field || "");
    const resolved = await this.resolveProject(input);

    if (!resolved.canonicalProjectId) {
      return this.result("fomoV2ExplainMissingData", {
        resolved,
        field,
        error: "canonicalProjectId is required or could not be resolved",
        suggestedSafeNextAction: "Use fomoV2FindProject with a name, slug, symbol, or id, then retry with canonicalProjectId.",
      });
    }

    const diagnostic = await this.buildMissingDataDiagnostic(resolved, field);
    return this.result("fomoV2ExplainMissingData", diagnostic);
  }

  async fomoDevSearchReviewCases(input: Record<string, unknown>) {
    const limit = this.limit(input.limit, DEFAULT_LIMIT);
    const filters: Record<string, unknown>[] = [];
    const canonicalProjectId = this.objectId(input.canonicalProjectId);
    const query = String(input.query || "").trim();

    if (canonicalProjectId) filters.push({ canonicalProjectId });
    if (input.status) filters.push({ status: this.safeEnum(input.status, SAFE_REVIEW_STATUSES, "open") });
    if (input.reason) filters.push({ reason: this.safeString(input.reason, 80) });
    if (input.domain) filters.push({ domain: this.safeString(input.domain, 80) });
    if (query) {
      const regex = this.regex(query);
      filters.push({
        $or: [
          { projectName: regex },
          { projectKey: regex },
          { normalizedProjectName: regex },
          { currentSourceType: regex },
          { incomingSourceType: regex },
          { reason: regex },
          { domain: regex },
        ],
      });
    }

    const reviewCases = await this.findMany(
      this.reviewBatchModel,
      this.andMatch(filters),
      REVIEW_BATCH_FIELDS,
      { lastSeenAt: -1, _id: -1 },
      limit
    );

    return this.result(
      "fomoDevSearchReviewCases",
      {
        filter: this.safePickInput(input, [
          "canonicalProjectId",
          "status",
          "reason",
          "domain",
          "query",
        ]),
        reviewCases,
      },
      { limit, collectionsRead: ["review_batches"] }
    );
  }

  async fomoDevCreateReviewCase(input: Record<string, unknown>) {
    const dryRun = this.isDryRun(input);
    const confirm = Boolean(input.confirm);
    const document = this.buildReviewCaseDocument(input);
    if (document.error) {
      return this.devWriteResult(
        "fomoDevCreateReviewCase",
        {
          dryRun,
          confirm,
          status: "error",
          error: document.error,
          warnings: document.warnings,
        },
        ["review_batches"]
      );
    }

    const plannedChanges = [
      {
        operation: "create",
        collectionName: "review_batches",
        document: document.value,
      },
    ];

    if (dryRun) {
      return this.devWriteResult(
        "fomoDevCreateReviewCase",
        {
          dryRun,
          confirm,
          status: "planned",
          plannedChanges,
          createdCount: 0,
          updatedCount: 0,
          modifiedCount: 0,
          affectedIds: [],
          warnings: document.warnings,
        },
        ["review_batches"]
      );
    }

    const created = await this.reviewBatchModel.create(document.value);
    return this.devWriteResult(
      "fomoDevCreateReviewCase",
      {
        dryRun,
        confirm,
        status: "done",
        createdCount: 1,
        updatedCount: 0,
        modifiedCount: 0,
        affectedIds: [this.idString(created?._id)].filter(Boolean),
        warnings: document.warnings,
      },
      ["review_batches"]
    );
  }

  async fomoDevResolveReviewCase(input: Record<string, unknown>) {
    const dryRun = this.isDryRun(input);
    const confirm = Boolean(input.confirm);
    const reviewCaseId = this.objectId(input.reviewCaseId || input.id);
    const status = this.safeEnum(input.status, ["resolved", "ignored", "superseded"], "");
    const warnings: string[] = [];

    if (!reviewCaseId) {
      return this.devWriteResult(
        "fomoDevResolveReviewCase",
        { dryRun, confirm, status: "error", error: "reviewCaseId or id is required" },
        ["review_batches"]
      );
    }

    if (!status) {
      return this.devWriteResult(
        "fomoDevResolveReviewCase",
        { dryRun, confirm, status: "error", error: "status must be resolved, ignored, or superseded" },
        ["review_batches"]
      );
    }

    const before = await this.findById(this.reviewBatchModel, reviewCaseId, REVIEW_BATCH_FIELDS);
    if (!before) warnings.push("Review case was not found before update");
    const update = {
      status,
      lastSeenAt: new Date(),
      "metadata.aiAdminResolution": {
        status,
        note: this.safeString(input.resolutionNote, 500),
        resolvedAt: new Date(),
      },
    };

    if (dryRun) {
      return this.devWriteResult(
        "fomoDevResolveReviewCase",
        {
          dryRun,
          confirm,
          status: "planned",
          plannedChanges: [
            {
              operation: "updateOne",
              collectionName: "review_batches",
              filter: { _id: String(reviewCaseId) },
              before,
              set: update,
            },
          ],
          createdCount: 0,
          updatedCount: 0,
          modifiedCount: 0,
          affectedIds: before?._id ? [this.idString(before._id)] : [],
          warnings,
        },
        ["review_batches"]
      );
    }

    const updated = await this.reviewBatchModel
      .findOneAndUpdate(
        { _id: reviewCaseId },
        { $set: update },
        { new: true }
      )
      .lean();

    return this.devWriteResult(
      "fomoDevResolveReviewCase",
      {
        dryRun,
        confirm,
        status: updated ? "done" : "error",
        error: updated ? undefined : "Review case not found",
        createdCount: 0,
        updatedCount: updated ? 1 : 0,
        modifiedCount: updated ? 1 : 0,
        affectedIds: updated?._id ? [this.idString(updated._id)] : [],
        warnings,
      },
      ["review_batches"]
    );
  }

  async fomoDevLinkParserSourceToProject(input: Record<string, unknown>) {
    const dryRun = this.isDryRun(input);
    const confirm = Boolean(input.confirm);
    const payload = this.buildSourceLinkPayload(input);

    if (payload.error) {
      return this.devWriteResult(
        "fomoDevLinkParserSourceToProject",
        { dryRun, confirm, status: "error", error: payload.error },
        ["canonical_project_sources"]
      );
    }

    const filter = this.sourceLinkIdentityFilter(payload.value);
    const update = {
      $set: {
        ...payload.value,
        metadata: {
          ...(payload.value.metadata || {}),
          aiAdminLinkedAt: new Date(),
        },
      },
      $setOnInsert: {
        createdAt: new Date(),
      },
    };

    if (dryRun) {
      return this.devWriteResult(
        "fomoDevLinkParserSourceToProject",
        {
          dryRun,
          confirm,
          status: "planned",
          plannedChanges: [
            {
              operation: "updateOne",
              collectionName: "canonical_project_sources",
              filter: this.formatSafeValue(filter),
              update: this.formatSafeValue(update),
              upsert: true,
            },
          ],
          createdCount: 0,
          updatedCount: 0,
          modifiedCount: 0,
          affectedIds: [],
          warnings: [],
        },
        ["canonical_project_sources"]
      );
    }

    const result = await this.canonicalProjectSourceModel.updateOne(filter, update, {
      upsert: true,
    });
    return this.devWriteResult(
      "fomoDevLinkParserSourceToProject",
      {
        dryRun,
        confirm,
        status: "done",
        ...this.mongoWriteCounts(result),
        affectedIds: this.upsertedIds(result),
        warnings: [],
      },
      ["canonical_project_sources"]
    );
  }

  async fomoDevUnlinkParserSourceFromProject(input: Record<string, unknown>) {
    const dryRun = this.isDryRun(input);
    const confirm = Boolean(input.confirm);
    const filter = this.sourceLinkLookupFilter(input);

    if (!filter) {
      return this.devWriteResult(
        "fomoDevUnlinkParserSourceFromProject",
        {
          dryRun,
          confirm,
          status: "error",
          error: "sourceLinkId or canonicalProjectId with source/sourceId/sourceSlug is required",
        },
        ["canonical_project_sources"]
      );
    }

    const update = {
      status: "deprecated",
      verified: false,
      reason: this.safeString(input.reason, 300) || "Unlinked by Admin AI typed tool",
      "metadata.aiAdminUnlinkedAt": new Date(),
    };

    if (dryRun) {
      return this.devWriteResult(
        "fomoDevUnlinkParserSourceFromProject",
        {
          dryRun,
          confirm,
          status: "planned",
          plannedChanges: [
            {
              operation: "updateOne",
              collectionName: "canonical_project_sources",
              filter: this.formatSafeValue(filter),
              set: this.formatSafeValue(update),
            },
          ],
          createdCount: 0,
          updatedCount: 0,
          modifiedCount: 0,
          affectedIds: [],
          warnings: [],
        },
        ["canonical_project_sources"]
      );
    }

    const result = await this.canonicalProjectSourceModel.updateOne(filter, {
      $set: update,
    });
    return this.devWriteResult(
      "fomoDevUnlinkParserSourceFromProject",
      {
        dryRun,
        confirm,
        status: "done",
        ...this.mongoWriteCounts(result),
        affectedIds: this.upsertedIds(result),
        warnings: [],
      },
      ["canonical_project_sources"]
    );
  }

  async fomoDevUpdateProjectFields(input: Record<string, unknown>) {
    const dryRun = this.isDryRun(input);
    const confirm = Boolean(input.confirm);
    const canonicalProjectId = this.objectId(input.canonicalProjectId);
    const normalized = this.normalizeProjectUpdateFields(input.fields);

    if (!canonicalProjectId) {
      return this.devWriteResult(
        "fomoDevUpdateProjectFields",
        { dryRun, confirm, status: "error", error: "canonicalProjectId is required" },
        ["canonical_projects"]
      );
    }

    if (!Object.keys(normalized.set).length) {
      return this.devWriteResult(
        "fomoDevUpdateProjectFields",
        {
          dryRun,
          confirm,
          status: "error",
          error: "No allowlisted project fields were provided",
          warnings: normalized.warnings,
        },
        ["canonical_projects"]
      );
    }

    const before = await this.findById(this.canonicalProjectModel, canonicalProjectId, PROJECT_FIELDS);
    const set = {
      ...normalized.set,
      "metadata.aiAdminLastUpdatedAt": new Date(),
      "metadata.aiAdminLastUpdateReason": this.safeString(input.reason, 400),
    };

    if (dryRun) {
      return this.devWriteResult(
        "fomoDevUpdateProjectFields",
        {
          dryRun,
          confirm,
          status: "planned",
          plannedChanges: [
            {
              operation: "updateOne",
              collectionName: "canonical_projects",
              filter: { _id: String(canonicalProjectId) },
              diff: this.diffFields(before || {}, normalized.set),
            },
          ],
          createdCount: 0,
          updatedCount: 0,
          modifiedCount: 0,
          affectedIds: before?._id ? [this.idString(before._id)] : [],
          warnings: normalized.warnings,
        },
        ["canonical_projects"]
      );
    }

    const result = await this.canonicalProjectModel.updateOne(
      { _id: canonicalProjectId },
      { $set: set }
    );
    return this.devWriteResult(
      "fomoDevUpdateProjectFields",
      {
        dryRun,
        confirm,
        status: "done",
        ...this.mongoWriteCounts(result),
        affectedIds: [String(canonicalProjectId)],
        warnings: normalized.warnings,
      },
      ["canonical_projects"]
    );
  }

  async fomoDevUpsertSourceEvidence(input: Record<string, unknown>) {
    const dryRun = this.isDryRun(input);
    const confirm = Boolean(input.confirm);
    const canonicalProjectId = this.objectId(input.canonicalProjectId);
    const evidenceKey = this.safeEvidenceKey(input.evidenceKey);
    const evidence = this.safeObject(input.evidence, 20);

    if (!canonicalProjectId || !evidenceKey || !Object.keys(evidence).length) {
      return this.devWriteResult(
        "fomoDevUpsertSourceEvidence",
        {
          dryRun,
          confirm,
          status: "error",
          error: "canonicalProjectId, safe evidenceKey, and evidence object are required",
        },
        ["canonical_projects"]
      );
    }

    const set = {
      [`sourceEvidence.${evidenceKey}`]: {
        ...evidence,
        aiAdminUpdatedAt: new Date(),
      },
      "metadata.aiAdminSourceEvidenceUpdatedAt": new Date(),
    };

    if (dryRun) {
      return this.devWriteResult(
        "fomoDevUpsertSourceEvidence",
        {
          dryRun,
          confirm,
          status: "planned",
          plannedChanges: [
            {
              operation: "updateOne",
              collectionName: "canonical_projects",
              filter: { _id: String(canonicalProjectId) },
              set: this.formatSafeValue(set),
            },
          ],
          createdCount: 0,
          updatedCount: 0,
          modifiedCount: 0,
          affectedIds: [String(canonicalProjectId)],
          warnings: [],
        },
        ["canonical_projects"]
      );
    }

    const result = await this.canonicalProjectModel.updateOne(
      { _id: canonicalProjectId },
      { $set: set }
    );
    return this.devWriteResult(
      "fomoDevUpsertSourceEvidence",
      {
        dryRun,
        confirm,
        status: "done",
        ...this.mongoWriteCounts(result),
        affectedIds: [String(canonicalProjectId)],
        warnings: [],
      },
      ["canonical_projects"]
    );
  }

  async fomoDevMarkSourceConflict(input: Record<string, unknown>) {
    const dryRun = this.isDryRun(input);
    const confirm = Boolean(input.confirm);
    const reviewDocument = this.buildReviewCaseDocument({
      ...input,
      reason: "SOURCE_CONFLICT",
    });
    const sourceLinkId = this.objectId(input.sourceLinkId);
    const plannedChanges: Record<string, unknown>[] = [];

    if (reviewDocument.error) {
      return this.devWriteResult(
        "fomoDevMarkSourceConflict",
        {
          dryRun,
          confirm,
          status: "error",
          error: reviewDocument.error,
          warnings: reviewDocument.warnings,
        },
        ["review_batches", "canonical_project_sources"]
      );
    }

    plannedChanges.push({
      operation: "create",
      collectionName: "review_batches",
      document: reviewDocument.value,
    });
    if (sourceLinkId) {
      plannedChanges.push({
        operation: "updateOne",
        collectionName: "canonical_project_sources",
        filter: { _id: String(sourceLinkId) },
        set: {
          status: "conflict",
          reason: this.safeString(input.note, 400) || "Marked conflict by Admin AI typed tool",
        },
      });
    }

    if (dryRun) {
      return this.devWriteResult(
        "fomoDevMarkSourceConflict",
        {
          dryRun,
          confirm,
          status: "planned",
          plannedChanges,
          createdCount: 0,
          updatedCount: 0,
          modifiedCount: 0,
          affectedIds: sourceLinkId ? [String(sourceLinkId)] : [],
          warnings: reviewDocument.warnings,
        },
        ["review_batches", "canonical_project_sources"]
      );
    }

    const created = await this.reviewBatchModel.create(reviewDocument.value);
    let sourceUpdateCounts = {
      createdCount: 0,
      updatedCount: 0,
      modifiedCount: 0,
    };
    if (sourceLinkId) {
      const sourceResult = await this.canonicalProjectSourceModel.updateOne(
        { _id: sourceLinkId },
        {
          $set: {
            status: "conflict",
            reason: this.safeString(input.note, 400) || "Marked conflict by Admin AI typed tool",
            "metadata.aiAdminConflictMarkedAt": new Date(),
          },
        }
      );
      sourceUpdateCounts = this.mongoWriteCounts(sourceResult);
    }

    return this.devWriteResult(
      "fomoDevMarkSourceConflict",
      {
        dryRun,
        confirm,
        status: "done",
        createdCount: 1,
        updatedCount: sourceUpdateCounts.updatedCount,
        modifiedCount: sourceUpdateCounts.modifiedCount,
        affectedIds: [
          this.idString(created?._id),
          sourceLinkId ? String(sourceLinkId) : undefined,
        ].filter(Boolean),
        warnings: reviewDocument.warnings,
      },
      ["review_batches", "canonical_project_sources"]
    );
  }

  async fomoDevRebuildProjectReadModel(input: Record<string, unknown>) {
    const dryRun = this.isDryRun(input);
    const confirm = Boolean(input.confirm);
    const resolved = await this.resolveProject(input);
    const warnings = [
      "Actual read-model rebuild execution is blocked from Admin AI Chat tool path. Use the dedicated backend runner with admin approval.",
    ];

    return this.devWriteResult(
      "fomoDevRebuildProjectReadModel",
      {
        dryRun,
        confirm,
        status: dryRun ? "planned" : "blocked",
        plannedChanges: [
          {
            operation: "runApprovedBackendRunner",
            runner: "market_project_read_model_materialize",
            dbName: this.adminAiConfig.getDbName(),
            resolved,
            reason: this.safeString(input.reason, 400),
            canExecuteFromChatTool: false,
          },
        ],
        createdCount: 0,
        updatedCount: 0,
        modifiedCount: 0,
        affectedIds: [
          this.idString(resolved.canonicalProjectId),
          this.idString(resolved.marketAssetId),
        ].filter(Boolean),
        warnings,
      },
      ["market_project_read_models", "canonical_projects", "market_assets"]
    );
  }

  async fomoDevRunImporterForProject(input: Record<string, unknown>) {
    const dryRun = this.isDryRun(input);
    const confirm = Boolean(input.confirm);
    const importerKey = this.safeEnum(
      input.importerKey,
      [
        "funding_import",
        "funding_gap_fill",
        "backer_profile_import",
        "vesting_import",
        "unlock_import",
        "market_read_model",
      ],
      ""
    );
    const resolved = await this.resolveProject(input);

    if (!importerKey) {
      return this.devWriteResult(
        "fomoDevRunImporterForProject",
        {
          dryRun,
          confirm,
          status: "error",
          error: "importerKey is required and must be allowlisted",
          createdCount: 0,
          updatedCount: 0,
          modifiedCount: 0,
          affectedIds: [],
          warnings: [],
        },
        []
      );
    }

    return this.devWriteResult(
      "fomoDevRunImporterForProject",
      {
        dryRun,
        confirm,
        status: dryRun ? "planned" : "blocked",
        plannedChanges: [
          {
            operation: "runApprovedImporter",
            importerKey,
            dbName: this.adminAiConfig.getDbName(),
            resolved,
            reason: this.safeString(input.reason, 400),
            canExecuteFromChatTool: false,
          },
        ],
        createdCount: 0,
        updatedCount: 0,
        modifiedCount: 0,
        affectedIds: [
          this.idString(resolved.canonicalProjectId),
          this.idString(resolved.marketAssetId),
        ].filter(Boolean),
        warnings: [
          "Actual importer execution is blocked from Admin AI Chat tool path. Use the dedicated backend runner with admin approval.",
        ],
      },
      [
        "canonical_projects",
        "canonical_project_sources",
        "source_entities",
        "source_snapshots",
      ]
    );
  }

  async fomoDevListCollections() {
    const collections = await this.adminConnection.db
      .listCollections({}, { nameOnly: true })
      .toArray();
    const names = collections
      .map((item: any) => String(item.name || ""))
      .filter((name) => this.isSafeGenericCollectionName(name))
      .sort();

    return this.result(
      "fomoDevListCollections",
      {
        dbName: this.adminAiConfig.getDbName(),
        collections: names,
        summary: { count: names.length },
      },
      { collectionsRead: names.slice(0, 50) }
    );
  }

  async fomoDevCollectionStats(input: Record<string, unknown>) {
    const collectionName = this.safeGenericCollectionName(input.collectionName);
    const limit = this.genericLimit(input.limit);
    const names = collectionName
      ? [collectionName]
      : (await this.adminConnection.db.listCollections({}, { nameOnly: true }).toArray())
          .map((item: any) => String(item.name || ""))
          .filter((name) => this.isSafeGenericCollectionName(name))
          .sort()
          .slice(0, limit);
    const stats = [];

    for (const name of names) {
      const collection = this.adminConnection.db.collection(name);
      const count = await collection.countDocuments({}, { maxTimeMS: MAX_TIME_MS });
      stats.push({ name, count });
    }

    return this.result(
      "fomoDevCollectionStats",
      {
        dbName: this.adminAiConfig.getDbName(),
        collections: stats,
        summary: {
          collectionsFound: stats.length,
          totalDocuments: stats.reduce((sum, item) => sum + item.count, 0),
        },
      },
      { collectionsRead: names }
    );
  }

  async fomoDevFind(input: Record<string, unknown>) {
    const collectionName = this.safeGenericCollectionName(input.collectionName);
    const limit = this.genericLimit(input.limit);
    if (!collectionName) return this.genericCollectionError("fomoDevFind");

    const docs = await this.adminConnection.db
      .collection(collectionName)
      .find(this.safeMongoFilter(input.filter), {
        projection: this.safeProjection(input.projection),
        maxTimeMS: MAX_TIME_MS,
      } as any)
      .sort(this.safeSort(input.sort))
      .limit(limit)
      .toArray();

    return this.result(
      "fomoDevFind",
      {
        dbName: this.adminAiConfig.getDbName(),
        collectionName,
        documents: docs.map((doc) => this.formatSafeValue(doc)),
      },
      { limit, collectionsRead: [collectionName] }
    );
  }

  async fomoDevCreateJsonExport(
    input: Record<string, unknown>,
    context: AdminAiToolExecutionContext
  ) {
    if (!this.exportService) {
      return this.result("fomoDevCreateJsonExport", {
        error: "JSON export service is unavailable",
        errorCode: "EXPORT_SERVICE_UNAVAILABLE",
      });
    }
    const collectionName = this.safeGenericCollectionName(input.collectionName);
    if (!collectionName) return this.genericCollectionError("fomoDevCreateJsonExport");
    const limit = this.nonNegativeInteger(input.limit, 0);
    const format = this.safeEnum(input.format, ["json", "jsonl"], "jsonl");
    const compression = this.safeEnum(input.compression, ["none", "gzip"], "gzip");
    const filenamePrefix = this.safeString(input.filenamePrefix || collectionName, 80);
    const artifact = await this.exportService.createExport(
      {
        kind: "collection",
        collectionName,
        spec: {
          filter: this.safeMongoFilter(input.filter),
          projection: this.safeProjection(input.projection),
          sort: this.safeSort(input.sort),
          limit,
        },
        format: format as "json" | "jsonl",
        compression: compression as "none" | "gzip",
        filenamePrefix,
      },
      context
    );
    return this.result(
      "fomoDevCreateJsonExport",
      {
        status: "queued",
        artifact,
        summary: `Streaming JSON export queued for ${collectionName}.`,
      },
      { collectionsRead: [collectionName] }
    );
  }

  async fomoDevFindOne(input: Record<string, unknown>) {
    const collectionName = this.safeGenericCollectionName(input.collectionName);
    if (!collectionName) return this.genericCollectionError("fomoDevFindOne");

    const document = await this.adminConnection.db.collection(collectionName).findOne(
      this.safeMongoFilter(input.filter),
      {
        projection: this.safeProjection(input.projection),
        sort: this.safeSort(input.sort),
        maxTimeMS: MAX_TIME_MS,
      } as any
    );

    return this.result(
      "fomoDevFindOne",
      {
        dbName: this.adminAiConfig.getDbName(),
        collectionName,
        document: this.formatSafeValue(document),
      },
      { collectionsRead: [collectionName] }
    );
  }

  async fomoDevCount(input: Record<string, unknown>) {
    const collectionName = this.safeGenericCollectionName(input.collectionName);
    if (!collectionName) return this.genericCollectionError("fomoDevCount");
    const count = await this.adminConnection.db
      .collection(collectionName)
      .countDocuments(this.safeMongoFilter(input.filter), { maxTimeMS: MAX_TIME_MS });

    return this.result(
      "fomoDevCount",
      { dbName: this.adminAiConfig.getDbName(), collectionName, count },
      { collectionsRead: [collectionName] }
    );
  }

  async fomoDevAggregate(input: Record<string, unknown>) {
    const collectionName = this.safeGenericCollectionName(input.collectionName);
    if (!collectionName) return this.genericCollectionError("fomoDevAggregate");
    const pipeline = this.safeAggregatePipeline(input.pipeline, this.genericLimit(input.limit));
    const documents = await this.adminConnection.db
      .collection(collectionName)
      .aggregate(pipeline, { maxTimeMS: GENERIC_AGGREGATE_MAX_TIME_MS })
      .toArray();

    return this.result(
      "fomoDevAggregate",
      {
        dbName: this.adminAiConfig.getDbName(),
        collectionName,
        documents: documents.map((doc) => this.formatSafeValue(doc)),
      },
      { limit: this.genericLimit(input.limit), collectionsRead: [collectionName] }
    );
  }

  async fomoDevCreateWriteProposal(input: Record<string, unknown>) {
    return this.fomoDevExecuteApprovedWrite({
      ...input,
      dryRun: this.isDryRun(input),
    });
  }

  async fomoDevPreviewWriteDiff(input: Record<string, unknown>) {
    return this.fomoDevExecuteApprovedWrite({
      ...input,
      dryRun: true,
      confirm: false,
    });
  }

  async fomoDevExecuteApprovedWrite(input: Record<string, unknown>) {
    const operation = String(input.operation || "").trim();
    const collectionName = this.safeGenericCollectionName(input.collectionName);
    if (!collectionName) return this.genericCollectionError("fomoDevExecuteApprovedWrite");
    if (!["insertOne", "updateOne"].includes(operation)) {
      return this.result("fomoDevExecuteApprovedWrite", {
        error: "operation must be insertOne or updateOne",
        errorCode: "UNSUPPORTED_WRITE_OPERATION",
      });
    }

    if (operation === "insertOne") {
      return this.renameToolResult(
        await this.fomoDevInsertOne({ ...input, collectionName }),
        "fomoDevExecuteApprovedWrite"
      );
    }

    const filter = this.safeMongoFilter(input.filter);
    if (!this.isStrictWriteFilter(filter)) {
      return this.result("fomoDevExecuteApprovedWrite", {
        error: "Strict filter is required for fomo_dev write proposal execution",
        errorCode: "STRICT_FILTER_REQUIRED",
        plannedChanges: [],
      });
    }

    return this.renameToolResult(
      await this.fomoDevUpdateOne({ ...input, collectionName, filter }),
      "fomoDevExecuteApprovedWrite"
    );
  }

  async fomoDevInsertOne(input: Record<string, unknown>) {
    const collectionName = this.safeGenericCollectionName(input.collectionName);
    const dryRun = this.isDryRun(input);
    const confirm = Boolean(input.confirm);
    const document = this.safeGenericDocument(input.document);
    if (!collectionName) return this.genericCollectionError("fomoDevInsertOne");

    if (dryRun) {
      return this.genericWritePlan("fomoDevInsertOne", collectionName, "insertOne", {
        document,
      });
    }

    const result = await this.adminConnection.db.collection(collectionName).insertOne({
      ...document,
      aiAdminCreatedAt: new Date(),
    });
    return this.devWriteResult(
      "fomoDevInsertOne",
      {
        dryRun,
        confirm,
        status: "done",
        operation: "insertOne",
        createdCount: 1,
        updatedCount: 0,
        modifiedCount: 0,
        affectedIds: [this.idString(result.insertedId)].filter(Boolean),
      },
      [collectionName]
    );
  }

  async fomoDevUpdateOne(input: Record<string, unknown>) {
    return this.fomoDevUpdateGeneric("fomoDevUpdateOne", input, false);
  }

  async fomoDevUpdateMany(input: Record<string, unknown>) {
    if (!input.confirm && input.dryRun === false) {
      return this.result("fomoDevUpdateMany", {
        error: "confirm=true is required for updateMany execution",
        errorCode: "CONFIRM_REQUIRED_FOR_UPDATE_MANY",
      });
    }
    return this.fomoDevUpdateGeneric("fomoDevUpdateMany", input, true);
  }

  async fomoDevDeleteOne(input: Record<string, unknown>) {
    return this.fomoDevDeleteGeneric("fomoDevDeleteOne", input, false);
  }

  async fomoDevDeleteMany(input: Record<string, unknown>) {
    if (!input.confirm && input.dryRun === false) {
      return this.result("fomoDevDeleteMany", {
        error: "confirm=true is required for deleteMany execution",
        errorCode: "CONFIRM_REQUIRED_FOR_DELETE_MANY",
      });
    }
    return this.fomoDevDeleteGeneric("fomoDevDeleteMany", input, true);
  }

  private async dispatchTool(
    name: FomoV2AiToolName,
    input: Record<string, unknown>,
    context: AdminAiToolExecutionContext = {}
  ) {
    switch (name) {
      case "fomoV2FindProject":
        return this.fomoV2FindProject(input);
      case "fomoV2GetProjectFullContext":
        return this.fomoV2GetProjectFullContext(input);
      case "fomoV2GetMarketContext":
        return this.fomoV2GetMarketContext(input);
      case "fomoV2GetSourceContext":
        return this.fomoV2GetSourceContext(input);
      case "fomoV2GetFundingContext":
        return this.fomoV2GetFundingContext(input);
      case "fomoV2GetBackerContext":
        return this.fomoV2GetBackerContext(input);
      case "fomoV2GetTokenomicsContext":
        return this.fomoV2GetTokenomicsContext(input);
      case "fomoV2FindVestingReviewCases":
        return this.fomoV2FindVestingReviewCases(input);
      case "fomoV2GetVestingReviewContext":
        return this.fomoV2GetVestingReviewContext(input);
      case "fomoV2ExportVestingReviews":
        return this.fomoV2ExportVestingReviews(input, context);
      case "fomoV2AnalyzeVestingSaleIds":
        return this.fomoV2AnalyzeVestingSaleIds(input);
      case "fomoV2NormalizeVestingNames":
        return this.fomoV2NormalizeVestingNames(input);
      case "fomoV2FindOfficialSourceLinks":
        return this.fomoV2FindOfficialSourceLinks(input);
      case "fomoWebSearchOfficialSources":
        return this.fomoWebSearchOfficialSources(input);
      case "fomoWebFetchSourceSummary":
        return this.fomoWebFetchSourceSummary(input);
      case "fomoV2AnalyzeVestingReviewCase":
        return this.fomoV2AnalyzeVestingReviewCase(input, context);
      case "fomoV2BuildVestingReviewProposal":
        return this.fomoV2BuildVestingReviewProposal(input, context);
      case "fomoV2FindDuplicates":
        return this.fomoV2FindDuplicates(input);
      case "fomoV2ExplainMissingData":
        return this.fomoV2ExplainMissingData(input);
      case "fomoV2CollectionStats":
        return this.fomoV2CollectionStats(input);
      case "fomoDevFindProject":
        return this.renameToolResult(await this.fomoV2FindProject(input), name);
      case "fomoDevGetProjectFullContext":
        return this.renameToolResult(await this.fomoV2GetProjectFullContext(input), name);
      case "fomoDevGetMarketContext":
        return this.renameToolResult(await this.fomoV2GetMarketContext(input), name);
      case "fomoDevGetFundingContext":
        return this.renameToolResult(await this.fomoV2GetFundingContext(input), name);
      case "fomoDevGetBackerContext":
        return this.renameToolResult(await this.fomoV2GetBackerContext(input), name);
      case "fomoDevGetTokenomicsContext":
        return this.renameToolResult(await this.fomoV2GetTokenomicsContext(input), name);
      case "fomoDevGetSourceEvidence":
        return this.renameToolResult(await this.fomoV2GetSourceContext(input), name);
      case "fomoDevSearchReviewCases":
        return this.fomoDevSearchReviewCases(input);
      case "fomoDevCreateReviewCase":
        return this.fomoDevCreateReviewCase(input);
      case "fomoDevResolveReviewCase":
        return this.fomoDevResolveReviewCase(input);
      case "fomoDevLinkParserSourceToProject":
        return this.fomoDevLinkParserSourceToProject(input);
      case "fomoDevUnlinkParserSourceFromProject":
        return this.fomoDevUnlinkParserSourceFromProject(input);
      case "fomoDevUpdateProjectFields":
        return this.fomoDevUpdateProjectFields(input);
      case "fomoDevUpsertSourceEvidence":
        return this.fomoDevUpsertSourceEvidence(input);
      case "fomoDevMarkSourceConflict":
        return this.fomoDevMarkSourceConflict(input);
      case "fomoDevRebuildProjectReadModel":
        return this.fomoDevRebuildProjectReadModel(input);
      case "fomoDevRunImporterForProject":
        return this.fomoDevRunImporterForProject(input);
      case "fomoDevListCollections":
        return this.fomoDevListCollections();
      case "fomoDevCollectionStats":
        return this.fomoDevCollectionStats(input);
      case "fomoDevFind":
        return this.fomoDevFind(input);
      case "fomoDevFindMany":
        return this.renameToolResult(await this.fomoDevFind(input), name);
      case "fomoDevFindOne":
        return this.fomoDevFindOne(input);
      case "fomoDevCount":
        return this.fomoDevCount(input);
      case "fomoDevAggregate":
        return this.fomoDevAggregate(input);
      case "fomoDevAggregateReadOnly":
        return this.renameToolResult(await this.fomoDevAggregate(input), name);
      case "fomoDevCreateJsonExport":
        return this.fomoDevCreateJsonExport(input, context);
      case "fomoDevCreateWriteProposal":
        return this.fomoDevCreateWriteProposal(input);
      case "fomoDevPreviewWriteDiff":
        return this.fomoDevPreviewWriteDiff(input);
      case "fomoDevExecuteApprovedWrite":
        return this.fomoDevExecuteApprovedWrite(input);
      case "fomoDevInsertOne":
        return this.fomoDevInsertOne(input);
      case "fomoDevUpdateOne":
        return this.fomoDevUpdateOne(input);
      case "fomoDevUpdateMany":
        return this.fomoDevUpdateMany(input);
      case "fomoDevDeleteOne":
        return this.fomoDevDeleteOne(input);
      case "fomoDevDeleteMany":
        return this.fomoDevDeleteMany(input);
      default:
        return this.result(name, { error: "Tool not implemented" });
    }
  }

  private resolveAccessMode(value: unknown): AdminAiAccessMode {
    return this.adminAiConfig.normalizeAccessMode(
      value || this.adminAiConfig.getDefaultAccessMode()
    );
  }

  private async pendingOrBlockedWriteResult(
    name: FomoV2AiToolName,
    input: Record<string, unknown>,
    accessMode: AdminAiAccessMode,
    context: AdminAiToolExecutionContext
  ) {
    if (!this.isDevWriteTool(name, input) || context.approvalExecution) return null;

    if (accessMode === "read_only") {
      return this.result(
        name,
        {
          status: "blocked",
          error: "WRITE_TOOLS_DISABLED_BY_ACCESS_MODE",
          errorCode: "WRITE_TOOLS_DISABLED_BY_ACCESS_MODE",
          requiresApproval: false,
          toolName: name,
          targetDb: this.adminAiConfig.getDbName(),
          collectionName: this.collectionsForTool(name),
          createdCount: 0,
          updatedCount: 0,
          modifiedCount: 0,
          affectedIds: [],
          warnings: [],
        },
        { collectionsRead: this.collectionsForTool(name) }
      );
    }

    if (accessMode !== "write_with_approval") return null;

    this.ensureToolGuard(name, { ...input, dryRun: true }, accessMode);
    const plan = await this.dispatchTool(name, { ...input, dryRun: true }, {
      ...context,
      approvalExecution: true,
    });
    const data = plan.data || {};

    return this.result(
      name,
      {
        status: "pending",
        requiresApproval: true,
        toolRunId: undefined,
        toolName: name,
        targetDb: this.adminAiConfig.getDbName(),
        collectionName: this.collectionsForTool(name),
        operation: this.operationForTool(name),
        responseType: data.responseType,
        project: data.project,
        recommendation: data.recommendation,
        confidence: data.confidence,
        currentJson: data.currentJson,
        proposedJson: data.proposedJson,
        originalProposedJson: data.originalProposedJson,
        diffSummary: data.diffSummary,
        issues: data.issues,
        saleIdMap: data.saleIdMap,
        nameChanges: data.nameChanges,
        sourcesUsed: data.sourcesUsed,
        validation: data.validation,
        plannedChanges: data.plannedChanges || [],
        summary: {
          dryRun: true,
          targetDb: this.adminAiConfig.getDbName(),
          collectionName: this.collectionsForTool(name),
          plannedChangesCount: Array.isArray(data.plannedChanges)
            ? data.plannedChanges.length
            : data.plannedChanges
              ? 1
              : 0,
          warnings: data.warnings || [],
        },
        createdCount: 0,
        updatedCount: 0,
        modifiedCount: 0,
        affectedIds: [],
        warnings: data.warnings || [],
      },
      { collectionsRead: this.collectionsForTool(name) }
    );
  }

  private isDevWriteTool(name: FomoV2AiToolName, input: Record<string, unknown> = {}) {
    if (name === "fomoV2BuildVestingReviewProposal") {
      return input.outputMode === "write_proposal";
    }
    if (CONDITIONAL_WRITE_TOOL_NAMES.has(name)) {
      return input.mode === "proposal";
    }
    return (FOMO_DEV_WRITE_TOOL_NAMES as readonly string[]).includes(name);
  }

  private isGenericDevTool(name: FomoV2AiToolName) {
    return String(name).startsWith("fomoDev") &&
      [
        "fomoDevListCollections",
        "fomoDevCollectionStats",
        "fomoDevFind",
        "fomoDevFindMany",
        "fomoDevFindOne",
        "fomoDevCount",
        "fomoDevAggregate",
        "fomoDevAggregateReadOnly",
        "fomoDevCreateJsonExport",
        "fomoDevCreateWriteProposal",
        "fomoDevPreviewWriteDiff",
        "fomoDevExecuteApprovedWrite",
        "fomoDevInsertOne",
        "fomoDevUpdateOne",
        "fomoDevUpdateMany",
        "fomoDevDeleteOne",
        "fomoDevDeleteMany",
      ].includes(name);
  }

  private operationForTool(name: FomoV2AiToolName) {
    if (String(name).includes("InsertOne")) return "insertOne";
    if (String(name).includes("UpdateOne")) return "updateOne";
    if (String(name).includes("UpdateMany")) return "updateMany";
    if (String(name).includes("DeleteOne")) return "deleteOne";
    if (String(name).includes("DeleteMany")) return "deleteMany";
    if (String(name).includes("Rebuild")) return "runnerProposal";
    if (String(name).includes("RunImporter")) return "importerProposal";

    const map: Record<string, string> = {
      fomoDevCreateReviewCase: "create",
      fomoDevResolveReviewCase: "updateOne",
      fomoDevLinkParserSourceToProject: "upsert",
      fomoDevUnlinkParserSourceFromProject: "updateOne",
      fomoDevUpdateProjectFields: "updateOne",
      fomoDevUpsertSourceEvidence: "updateOne",
      fomoDevMarkSourceConflict: "create",
      fomoDevCreateWriteProposal: "writeProposal",
      fomoDevExecuteApprovedWrite: "approvedWrite",
      fomoV2AnalyzeVestingReviewCase: "vestingReviewProposal",
      fomoV2BuildVestingReviewProposal: "vestingReviewProposal",
    };

    return map[name] || "read";
  }

  private async fomoDevUpdateGeneric(
    tool: "fomoDevUpdateOne" | "fomoDevUpdateMany",
    input: Record<string, unknown>,
    many: boolean
  ) {
    const collectionName = this.safeGenericCollectionName(input.collectionName);
    const dryRun = this.isDryRun(input);
    const confirm = Boolean(input.confirm);
    if (!collectionName) return this.genericCollectionError(tool);
    const filter = this.safeMongoFilter(input.filter);
    const update = this.safeMongoUpdate(input.update);
    const operation = many ? "updateMany" : "updateOne";

    if (dryRun) {
      return this.genericWritePlan(tool, collectionName, operation, {
        filter,
        update,
        upsert: many ? false : Boolean(input.upsert),
      });
    }

    const result = many
      ? await this.adminConnection.db.collection(collectionName).updateMany(filter, update)
      : await this.adminConnection.db
          .collection(collectionName)
          .updateOne(filter, update, { upsert: Boolean(input.upsert) });

    return this.devWriteResult(
      tool,
      {
        dryRun,
        confirm,
        status: "done",
        operation,
        ...this.mongoWriteCounts(result),
        affectedIds: this.upsertedIds(result),
      },
      [collectionName]
    );
  }

  private async fomoDevDeleteGeneric(
    tool: "fomoDevDeleteOne" | "fomoDevDeleteMany",
    input: Record<string, unknown>,
    many: boolean
  ) {
    const collectionName = this.safeGenericCollectionName(input.collectionName);
    const dryRun = this.isDryRun(input);
    const confirm = Boolean(input.confirm);
    if (!collectionName) return this.genericCollectionError(tool);
    const filter = this.safeMongoFilter(input.filter);
    const operation = many ? "deleteMany" : "deleteOne";

    if (dryRun) {
      return this.genericWritePlan(tool, collectionName, operation, { filter });
    }

    const result = many
      ? await this.adminConnection.db.collection(collectionName).deleteMany(filter)
      : await this.adminConnection.db.collection(collectionName).deleteOne(filter);

    return this.devWriteResult(
      tool,
      {
        dryRun,
        confirm,
        status: "done",
        operation,
        createdCount: 0,
        updatedCount: 0,
        modifiedCount: Number(result.deletedCount || 0),
        affectedIds: [],
      },
      [collectionName]
    );
  }

  private genericWritePlan(
    tool: string,
    collectionName: string,
    operation: string,
    payload: Record<string, unknown>
  ) {
    return this.devWriteResult(
      tool,
      {
        dryRun: true,
        confirm: false,
        status: "planned",
        operation,
        plannedChanges: [
          {
            operation,
            collectionName,
            ...(this.formatSafeValue(payload) as Record<string, unknown>),
          },
        ],
        createdCount: 0,
        updatedCount: 0,
        modifiedCount: 0,
        affectedIds: [],
      },
      [collectionName]
    );
  }

  private genericCollectionError(tool: string) {
    return this.result(tool, {
      error: "Safe collectionName is required",
      errorCode: "INVALID_COLLECTION_NAME",
    });
  }

  private safeGenericCollectionName(value: unknown) {
    const name = this.safeString(value, 120);
    return this.isSafeGenericCollectionName(name) ? name : "";
  }

  private isSafeGenericCollectionName(name: string) {
    return Boolean(name) && !FORBIDDEN_COLLECTION_NAME_PATTERN.test(name);
  }

  private safeMongoFilter(value: unknown) {
    return this.safeMongoObject(value, { allowOperators: true });
  }

  private isStrictWriteFilter(filter: Record<string, unknown>) {
    const keys = Object.keys(filter || {});
    if (!keys.length) return false;
    if (keys.includes("_id") || keys.includes("canonicalProjectId") || keys.includes("sourceEntityId")) return true;
    if (keys.includes("key") || keys.includes("slug") || keys.includes("sourceId") || keys.includes("sourceSlug")) return true;
    const andFilters = Array.isArray((filter as any).$and) ? (filter as any).$and : [];
    return andFilters.some((item: any) => item && typeof item === "object" && this.isStrictWriteFilter(item));
  }

  private safeProjection(value: unknown) {
    return this.safeMongoObject(value, { allowOperators: false });
  }

  private safeSort(value: unknown) {
    const sort = this.safeMongoObject(value, { allowOperators: false });
    return Object.entries(sort).reduce((acc, [key, item]) => {
      const direction = Number(item) === -1 ? -1 : 1;
      acc[key] = direction;
      return acc;
    }, {} as Record<string, 1 | -1>);
  }

  private safeGenericDocument(value: unknown) {
    return this.safeMongoObject(value, { allowOperators: false });
  }

  private safeMongoUpdate(value: unknown) {
    const update = this.safeMongoObject(value, { allowOperators: true });
    const keys = Object.keys(update);
    if (!keys.length || keys.some((key) => !SAFE_UPDATE_OPERATORS.has(key))) {
      throw new Error("Only safe update operators are allowed");
    }
    return update;
  }

  private safeAggregatePipeline(value: unknown, limit: number) {
    const input = Array.isArray(value) ? value : [];
    const pipeline = input.slice(0, 20).map((stage) => {
      const safeStage = this.safeMongoObject(stage, { allowOperators: true });
      Object.keys(safeStage).forEach((key) => {
        if (FORBIDDEN_AGGREGATE_STAGES.has(key)) {
          throw new Error(`Forbidden aggregate stage: ${key}`);
        }
      });
      return safeStage;
    });

    pipeline.push({ $limit: limit });
    return pipeline;
  }

  private safeMongoObject(
    value: unknown,
    options: { allowOperators: boolean }
  ): Record<string, any> {
    if (!value || typeof value !== "object" || Array.isArray(value)) return {};
    const output: Record<string, any> = {};

    for (const [key, item] of Object.entries(value as Record<string, unknown>).slice(0, 80)) {
      if (!this.isSafeMongoKey(key, options.allowOperators)) continue;
      if (item && typeof item === "object" && !Array.isArray(item) && !(item instanceof Date)) {
        output[key] = this.safeMongoObject(item, options);
      } else if (Array.isArray(item)) {
        output[key] = item.slice(0, 100).map((entry) =>
          entry && typeof entry === "object"
            ? this.safeMongoObject(entry, options)
            : this.formatSafeValue(entry)
        );
      } else {
        output[key] = this.formatSafeValue(item);
      }
    }

    return output;
  }

  private isSafeMongoKey(key: string, allowOperators: boolean) {
    if (!key || key.includes("\0")) return false;
    if (key.startsWith("$")) {
      if (!allowOperators) return false;
      return !["$where", "$function", "$accumulator", "$out", "$merge"].includes(key);
    }
    return !/runCommand|adminCommand|eval|shell|createUser|grantRoles|dropDatabase|shutdown/i.test(key);
  }

  private genericLimit(value: unknown) {
    const parsed = Number(value);
    if (!Number.isFinite(parsed) || parsed <= 0) return GENERIC_DEFAULT_LIMIT;
    return Math.min(Math.floor(parsed), GENERIC_MAX_LIMIT);
  }

  private isDryRun(input: Record<string, unknown>) {
    return input.dryRun !== false;
  }

  private assertConfirmed(input: Record<string, unknown>) {
    if (input.confirm !== true) {
      const error = new Error("confirm=true is required when dryRun=false");
      (error as any).code = "CONFIRM_REQUIRED";
      throw error;
    }
  }

  private renameToolResult(result: FomoV2AiToolResult, tool: string): FomoV2AiToolResult {
    return {
      ...result,
      tool,
    };
  }

  private devWriteResult(
    tool: string,
    data: Record<string, unknown>,
    collectionsRead: string[]
  ) {
    return this.result(
      tool,
      {
        dbName: this.adminAiConfig.getDbName(),
        targetDb: this.adminAiConfig.getDbName(),
        createdCount: 0,
        updatedCount: 0,
        modifiedCount: 0,
        affectedIds: [],
        warnings: [],
        ...data,
      },
      {
        collectionsRead,
        writeDbTarget: this.adminAiConfig.getDbName(),
        writeToolsEnabled: this.adminAiConfig.isWriteToolsEnabled(),
      }
    );
  }

  private buildReviewCaseDocument(input: Record<string, unknown>) {
    const warnings: string[] = [];
    const domain = this.safeString(input.domain, 80);
    const reason = this.safeString(input.reason, 80);
    const canonicalProjectId = this.objectId(input.canonicalProjectId);
    const candidates = this.sanitizeReviewCandidates(input.candidates);

    if (!domain) return { error: "domain is required", warnings } as const;
    if (!reason) return { error: "reason is required", warnings } as const;
    if (input.canonicalProjectId && !canonicalProjectId) {
      return { error: "canonicalProjectId is invalid", warnings } as const;
    }

    const projectName = this.safeString(input.projectName, 160);
    const projectKey = this.safeString(input.projectKey, 160);
    const now = new Date();
    const value = this.cleanUndefined({
      domain,
      reason,
      status: "open",
      canonicalProjectId: canonicalProjectId || undefined,
      projectKey,
      projectName,
      normalizedProjectName: projectName ? this.normalizeName(projectName) : undefined,
      currentSourceType: this.safeString(input.currentSourceType, 80),
      incomingSourceType: this.safeString(input.incomingSourceType, 80),
      affectedEntityTypes: this.safeStringArray(input.affectedEntityTypes, 20, 80),
      candidateCount: candidates.length,
      candidates,
      fingerprint:
        this.safeString((input as any).fingerprint, 220) ||
        this.reviewFingerprint({
          domain,
          reason,
          canonicalProjectId: this.idString(canonicalProjectId),
          projectKey,
          projectName,
          currentSourceType: input.currentSourceType,
          incomingSourceType: input.incomingSourceType,
        }),
      firstSeenAt: now,
      lastSeenAt: now,
      seenCount: 1,
      metadata: {
        ...this.safeObject(input.metadata, 20),
        aiAdminCreated: true,
        aiAdminCreatedAt: now,
      },
    });

    if (!candidates.length) {
      warnings.push("No candidates were supplied for this review case");
    }

    return { value, warnings } as const;
  }

  private sanitizeReviewCandidates(value: unknown) {
    if (!Array.isArray(value)) return [];

    return value.slice(0, 10).map((candidate) => {
      const source = this.safeObject(candidate, 20);
      return this.cleanUndefined({
        entityType: this.safeString(source.entityType, 80) || "project",
        sourceType: this.safeString(source.sourceType, 80),
        sourceId: this.safeString(source.sourceId, 160),
        sourceEntityId: this.idString(this.objectId(source.sourceEntityId)),
        sourceSnapshotId: this.idString(this.objectId(source.sourceSnapshotId)),
        sourcePath: this.safeString(source.sourcePath, 240),
        sourceUrl: this.safeString(source.sourceUrl, 500),
        payload: this.safeObject(source.payload || {}, 20),
        normalizedPayload: this.safeObject(source.normalizedPayload || {}, 20),
        confidence: this.numberInRange(source.confidence, 0, 1),
        metadata: this.safeObject(source.metadata || {}, 20),
      });
    });
  }

  private buildSourceLinkPayload(input: Record<string, unknown>) {
    const canonicalProjectId = this.objectId(input.canonicalProjectId);
    const source = this.safeString(input.source, 80);
    const sourceEntityType = this.safeEnum(
      input.sourceEntityType,
      SAFE_SOURCE_ENTITY_TYPES,
      "project"
    );
    const sourceId = this.safeString(input.sourceId, 160);
    const sourceSlug = this.safeString(input.sourceSlug, 160);
    const sourceUrl = this.safeString(input.sourceUrl, 500);
    const sourceEntityId = this.objectId(input.sourceEntityId);
    const sourceSnapshotId = this.objectId(input.sourceSnapshotId);

    if (!canonicalProjectId) return { error: "canonicalProjectId is required" } as const;
    if (!source) return { error: "source is required" } as const;
    if (!sourceId && !sourceSlug && !sourceUrl && !sourceEntityId) {
      return {
        error: "At least one parser/source identity is required: sourceId, sourceSlug, sourceUrl, or sourceEntityId",
      } as const;
    }

    const value = this.cleanUndefined({
      canonicalProjectId,
      source,
      sourceEntityType,
      sourceId,
      sourceSlug,
      sourceUrl,
      websiteDomain: this.safeString(input.websiteDomain, 160),
      sourceEntityId: sourceEntityId || undefined,
      sourceSnapshotId: sourceSnapshotId || undefined,
      confidence: this.safeEnum(input.confidence, SAFE_CONFIDENCE_LEVELS, "medium"),
      matchedBy: "admin_ai_chat",
      reason: this.safeString(input.reason, 300),
      verified: Boolean(input.verified),
      status: this.safeEnum(input.status, SAFE_LINK_STATUSES, "proposed"),
      metadata: {
        aiAdminLinked: true,
      },
    });

    return { value } as const;
  }

  private sourceLinkIdentityFilter(value: Record<string, any>) {
    if (value.sourceId) {
      return {
        source: value.source,
        sourceEntityType: value.sourceEntityType,
        sourceId: value.sourceId,
      };
    }

    if (value.sourceEntityId) {
      return { sourceEntityId: value.sourceEntityId };
    }

    return this.cleanUndefined({
      canonicalProjectId: value.canonicalProjectId,
      source: value.source,
      sourceEntityType: value.sourceEntityType,
      sourceSlug: value.sourceSlug,
      sourceUrl: value.sourceUrl,
    });
  }

  private sourceLinkLookupFilter(input: Record<string, unknown>) {
    const sourceLinkId = this.objectId(input.sourceLinkId || input.id);
    if (sourceLinkId) return { _id: sourceLinkId };

    const canonicalProjectId = this.objectId(input.canonicalProjectId);
    const source = this.safeString(input.source, 80);
    const sourceId = this.safeString(input.sourceId, 160);
    const sourceSlug = this.safeString(input.sourceSlug, 160);
    if (!canonicalProjectId || !source || (!sourceId && !sourceSlug)) return null;

    return this.cleanUndefined({
      canonicalProjectId,
      source,
      ...(sourceId ? { sourceId } : { sourceSlug }),
    });
  }

  private normalizeProjectUpdateFields(value: unknown) {
    const input = this.safeObject(value, 20);
    const set: Record<string, unknown> = {};
    const warnings: string[] = [];

    for (const [key, rawValue] of Object.entries(input)) {
      if (!(FOMO_DEV_PROJECT_UPDATE_FIELDS as readonly string[]).includes(key)) {
        warnings.push(`Ignored non-allowlisted project field: ${key}`);
        continue;
      }

      if (key === "status") {
        set.status = this.safeEnum(rawValue, ["active", "proposed", "merged", "deprecated"], "proposed");
      } else if (key === "isVestingReview") {
        set.isVestingReview = Boolean(rawValue);
      } else if (key === "symbol") {
        const symbol = this.safeString(rawValue, 40);
        set.symbol = symbol;
        set.normalizedSymbol = symbol.toUpperCase();
      } else if (key === "name") {
        const name = this.safeString(rawValue, 160);
        set.name = name;
        set.normalizedName = this.normalizeName(name);
      } else {
        set[key] = this.safeString(rawValue, 240);
      }
    }

    return { set: this.cleanUndefined(set), warnings };
  }

  private diffFields(before: Record<string, any>, after: Record<string, unknown>) {
    return Object.entries(after).map(([field, next]) => ({
      field,
      before: this.formatSafeValue(before[field]),
      after: this.formatSafeValue(next),
    }));
  }

  private mongoWriteCounts(result: any) {
    const createdCount = Number(result?.upsertedCount || 0);
    const modifiedCount = Number(result?.modifiedCount || 0);
    const matchedCount = Number(result?.matchedCount || result?.n || 0);
    return {
      createdCount,
      updatedCount: createdCount + matchedCount,
      modifiedCount,
    };
  }

  private upsertedIds(result: any) {
    const ids = [
      result?.upsertedId,
      ...(Array.isArray(result?.upsertedIds) ? result.upsertedIds : []),
    ].filter(Boolean);

    return ids.map((id) => this.idString(id)).filter(Boolean);
  }

  private safePickInput(input: Record<string, unknown>, keys: string[]) {
    return keys.reduce((acc, key) => {
      if (input[key] !== undefined && input[key] !== null && input[key] !== "") {
        acc[key] = input[key];
      }
      return acc;
    }, {} as Record<string, unknown>);
  }

  private andMatch(filters: Record<string, unknown>[]) {
    const compact = filters.filter((item) => Object.keys(item).length);
    if (!compact.length) return {};
    if (compact.length === 1) return compact[0];
    return { $and: compact };
  }

  private safeString(value: unknown, maxLength: number) {
    return String(value || "").trim().slice(0, maxLength);
  }

  private safeStringArray(value: unknown, maxItems: number, maxLength: number) {
    if (!Array.isArray(value)) return [];
    return value
      .map((item) => this.safeString(item, maxLength))
      .filter(Boolean)
      .slice(0, maxItems);
  }

  private safeEnum(value: unknown, values: readonly string[], fallback: string) {
    const text = this.safeString(value, 120);
    return values.includes(text) ? text : fallback;
  }

  private safeEvidenceKey(value: unknown) {
    const key = this.safeString(value, 80);
    return /^[a-zA-Z0-9_-]{1,80}$/.test(key) ? key : "";
  }

  private safeObject(value: unknown, maxKeys: number) {
    if (!value || typeof value !== "object" || Array.isArray(value)) return {};

    const output: Record<string, unknown> = {};
    for (const [key, item] of Object.entries(value as Record<string, unknown>)) {
      if (!/^[a-zA-Z0-9_.-]{1,80}$/.test(key)) continue;
      if (key.includes("$")) continue;
      if (Object.keys(output).length >= maxKeys) break;
      output[key] = this.formatSafeValue(item);
    }
    return output;
  }

  private cleanUndefined<T extends Record<string, any>>(value: T): T {
    const output: Record<string, any> = {};
    for (const [key, item] of Object.entries(value)) {
      if (item !== undefined && item !== null && item !== "") {
        output[key] = item;
      }
    }
    return output as T;
  }

  private numberInRange(value: unknown, min: number, max: number) {
    const parsed = Number(value);
    if (!Number.isFinite(parsed)) return undefined;
    return Math.min(max, Math.max(min, parsed));
  }

  private integerInRange(
    value: unknown,
    fallback: number,
    min: number,
    max: number
  ) {
    const parsed = Number(value);
    if (!Number.isFinite(parsed)) return fallback;
    return Math.min(max, Math.max(min, Math.floor(parsed)));
  }

  private nonNegativeInteger(value: unknown, fallback: number) {
    const parsed = Number(value);
    if (!Number.isFinite(parsed) || parsed < 0) return fallback;
    return Math.floor(parsed);
  }

  private reviewFingerprint(value: Record<string, unknown>) {
    const source = JSON.stringify(value);
    let hash = 0;
    for (let index = 0; index < source.length; index += 1) {
      hash = (hash * 31 + source.charCodeAt(index)) >>> 0;
    }
    return `admin-ai-review-${hash.toString(16)}`;
  }

  private formatSafeValue(value: unknown): unknown {
    if (value instanceof Date) return value.toISOString();
    if (value instanceof Types.ObjectId) return String(value);
    if (Array.isArray(value)) return value.slice(0, 20).map((item) => this.formatSafeValue(item));

    if (value && typeof value === "object") {
      const output: Record<string, unknown> = {};
      Object.entries(value as Record<string, unknown>)
        .slice(0, 20)
        .forEach(([key, item]) => {
          if (!key.includes("$")) output[key] = this.formatSafeValue(item);
        });
      return output;
    }

    if (typeof value === "string") return value.slice(0, 1000);
    return value;
  }

  private vestingStatusMatch(status: string) {
    if (status === "all") return {};
    if (status === "active") return { status: "active" };
    if (status === "proposed") return { status: { $regex: /proposed|review/i } };
    return { status: { $regex: /proposed|review|pending|open/i } };
  }

  private vestingReviewMatch(status: string) {
    if (status === "all") return {};
    if (status === "active") return { status: "resolved" };
    return {
      $or: [
        { status: { $regex: /open|proposed|review/i } },
        { domain: { $regex: /vesting|tokenomics|unlock|allocation/i } },
        { reason: { $regex: /vesting|tokenomics|unlock|allocation|saleId/i } },
      ],
    };
  }

  private vestingImportCandidateMatch(status: string) {
    const domainMatch = {
      $or: [
        { domain: { $regex: /vesting|tokenomics|unlock|allocation/i } },
        { entityType: { $regex: /vesting|token|unlock|allocation/i } },
      ],
    };
    if (status === "all") return domainMatch;
    if (status === "active") return { ...domainMatch, status: "resolved" };
    return { ...domainMatch, status: { $regex: /open|proposed|review|pending/i } };
  }

  private hasUsefulSaleId(value: unknown) {
    return value !== undefined && value !== null && value !== "" && Number.isFinite(Number(value));
  }

  private vestingCaseReasons(counts: Record<string, number>) {
    const reasons: string[] = [];
    if (counts.proposedTokenAllocations) reasons.push(`${counts.proposedTokenAllocations} proposed token allocations`);
    if (counts.proposedVestingSchedules) reasons.push(`${counts.proposedVestingSchedules} proposed vesting schedules`);
    if (counts.unlockEvents) reasons.push(`${counts.unlockEvents} unlock events`);
    if (counts.reviewCases) reasons.push(`${counts.reviewCases} review cases`);
    if (counts.importCandidates) reasons.push(`${counts.importCandidates} import candidates`);
    if (counts.missingSaleId) reasons.push(`${counts.missingSaleId} records missing saleId`);
    if (counts.missingName) reasons.push(`${counts.missingName} records missing name`);
    return reasons.length ? reasons : ["vesting/tokenomics records found"];
  }

  private vestingRiskFlags(counts: Record<string, number>) {
    const flags: string[] = [];
    if (counts.missingSaleId) flags.push("missing_sale_id");
    if (counts.missingName) flags.push("missing_name");
    if (counts.proposedTokenAllocations || counts.proposedVestingSchedules) flags.push("has_proposed_data");
    if (counts.reviewCases) flags.push("has_review_cases");
    return flags;
  }

  private async buildVestingReviewContext(input: Record<string, unknown>, limit: number) {
    const resolved = await this.resolveProject(input);
    if (!resolved.canonicalProjectId) {
      return {
        resolved,
        error: "canonicalProjectId is required or could not be resolved",
        warnings: ["Use fomoV2FindVestingReviewCases or fomoV2FindProject first, then retry with canonicalProjectId."],
      };
    }

    const includeSourceLinks = input.includeSourceLinks !== false;
    const includeReviewHistory = input.includeReviewHistory !== false;
    const canonicalProjectId = resolved.canonicalProjectId as Types.ObjectId;
    const [project, tokenomics, sourceContext, reviewCases, importCandidates] = await Promise.all([
      this.findById(this.canonicalProjectModel, canonicalProjectId, PROJECT_FIELDS),
      this.getTokenomicsContextData(canonicalProjectId, limit),
      includeSourceLinks ? this.getSourceContextData(canonicalProjectId, limit) : Promise.resolve({ canonicalProjectSources: [], sourceEntities: [], sourceSnapshots: [], projectDomainSources: [], sourceReviewCases: [] }),
      includeReviewHistory
        ? this.findMany(
            this.reviewBatchModel,
            {
              canonicalProjectId,
              domain: { $regex: /vesting|tokenomics|unlock|allocation/i },
            },
            REVIEW_BATCH_FIELDS,
            { lastSeenAt: -1, _id: -1 },
            limit
          )
        : Promise.resolve([]),
      includeReviewHistory
        ? this.findMany(
            this.importCandidateModel,
            {
              canonicalProjectId,
              $or: [
                { domain: { $regex: /vesting|tokenomics|unlock|allocation/i } },
                { entityType: { $regex: /vesting|token|unlock|allocation/i } },
              ],
            },
            IMPORT_CANDIDATE_FIELDS,
            { lastSeenAt: -1, _id: -1 },
            limit
          )
        : Promise.resolve([]),
    ]);

    const allocations = (tokenomics.tokenAllocations || []).map((record: any) => this.compactTokenAllocation(record));
    const rounds = (tokenomics.vestingRounds || []).map((record: any) => this.compactVestingRound(record));
    const schedules = (tokenomics.vestingSchedules || []).map((record: any) => this.compactVestingSchedule(record));
    const summaries = (tokenomics.vestingSummaries || []).map((record: any) => this.compactVestingSummary(record));
    const unlocks = (tokenomics.unlockEvents || []).map((record: any) => this.compactUnlockEvent(record));
    const currentV2Data = {
      tokenAllocations: allocations.filter((record: any) => !this.isProposedVestingRecord(record)),
      vestingRounds: rounds.filter((record: any) => !this.isProposedVestingRecord(record)),
      vestingSchedules: schedules.filter((record: any) => !this.isProposedVestingRecord(record)),
      vestingSummaries: summaries.filter((record: any) => !this.isProposedVestingRecord(record)),
      unlockEvents: unlocks.filter((record: any) => !this.isProposedVestingRecord(record)),
    };
    const proposedData = {
      tokenAllocations: allocations.filter((record: any) => this.isProposedVestingRecord(record)),
      vestingRounds: rounds.filter((record: any) => this.isProposedVestingRecord(record)),
      vestingSchedules: schedules.filter((record: any) => this.isProposedVestingRecord(record)),
      vestingSummaries: summaries.filter((record: any) => this.isProposedVestingRecord(record)),
      unlockEvents: unlocks.filter((record: any) => this.isProposedVestingRecord(record)),
    };
    const officialDomains = includeSourceLinks
      ? this.officialDomainsFromSourceContext(project, sourceContext, {})
      : [];
    const sourceLinks = includeSourceLinks
      ? this.sourceLinksFromContext(project, sourceContext, limit, officialDomains)
      : [];
    const warnings: string[] = [];
    if (input.includeParserContext !== false) {
      warnings.push("Parser DB context is not loaded inside this fomo_dev tool; use parser tools for ico/dropstab/intel evidence.");
    }
    if (!sourceLinks.length && includeSourceLinks) {
      warnings.push("No stored official/source links were found in fomo_dev context.");
    }

    return {
      resolved,
      project: {
        canonicalProjectId: this.idString(project?._id || canonicalProjectId),
        name: project?.name,
        symbol: project?.symbol,
        slug: project?.slug,
        website: project?.primaryWebsiteDomain,
        links: this.safeObject(project?.links || {}, 20),
      },
      currentV2Data,
      proposedData,
      reviewContext: {
        reviewCases: reviewCases.map((item: any) => this.formatSafeValue(item)),
        importCandidates: importCandidates.map((item: any) => this.formatSafeValue(item)),
        conflicts: reviewCases
          .filter((item: any) => /conflict/i.test(String(item.reason || item.domain || "")))
          .map((item: any) => this.formatSafeValue(item)),
      },
      parserContext: input.includeParserContext === false
        ? undefined
        : {
            configured: false,
            note: "Use fomoParser* tools to read parser_new_dev context. This vesting tool keeps parser reads separate from fomo_dev writes.",
          },
      sourceLinks,
      saleIdMap: this.buildSaleIdMap([...allocations, ...rounds, ...schedules, ...unlocks]),
      warnings,
    };
  }

  private compactTokenAllocation(record: any) {
    const sourceName = this.firstStringByPaths(record, ["sourceName", "source.name", "roundName", "name"]);
    return {
      id: this.idString(record?._id),
      collectionName: "token_allocations",
      status: record?.status,
      name: record?.name,
      sourceName,
      saleId: this.saleIdNumber(record?.saleId),
      percent: this.numberInRange(record?.allocationPercent, 0, Number.MAX_SAFE_INTEGER),
      tokenAmount: this.numberInRange(record?.amount, 0, Number.MAX_SAFE_INTEGER),
      sourceKey: record?.primarySource || record?.sourceType || record?.sourceEntityKey,
      evidenceRefs: this.safeStringArray(record?.sourceRefs, 10, 240),
    };
  }

  private compactVestingSchedule(record: any) {
    const sourceName = this.firstStringByPaths(record, ["sourceName", "source.name", "roundName", "name"]);
    return {
      id: this.idString(record?._id),
      collectionName: "vesting_schedules",
      status: record?.status,
      name: record?.roundName || record?.name,
      sourceName,
      saleId: this.saleIdNumber(record?.saleId),
      cliffMonths: this.numberInRange(record?.cliffMonths, 0, 240),
      vestingMonths: this.numberInRange(record?.vestingDurationMonths || record?.vestingMonths, 0, 240),
      unlockPercentAtTge: this.numberInRange(record?.tgeUnlockPercent || record?.unlockPercentAtTge, 0, 100),
      startDate: this.dateString(record?.startDate),
      endDate: this.dateString(record?.endDate),
      sourceKey: record?.sourceType || record?.sourceEntityKey,
      evidenceRefs: this.safeStringArray(record?.sourceRefs, 10, 240),
    };
  }

  private compactVestingRound(record: any) {
    const sourceName = this.firstStringByPaths(record, ["sourceName", "source.name", "roundName", "name"]);
    return {
      id: this.idString(record?._id),
      collectionName: "vesting_rounds",
      status: record?.status,
      name: record?.roundName || record?.name,
      sourceName,
      saleId: this.saleIdNumber(record?.saleId),
      percent: this.numberInRange(record?.allocationPercent, 0, 100),
      tokenAmount: this.numberInRange(record?.totalAmount, 0, Number.MAX_SAFE_INTEGER),
      unlockedAmount: this.numberInRange(record?.unlockedAmountSource, 0, Number.MAX_SAFE_INTEGER),
      lockedAmount: this.numberInRange(record?.lockedAmountSource, 0, Number.MAX_SAFE_INTEGER),
      unlockedPercent: this.numberInRange(record?.unlockedPercentSource, 0, 100),
      lockedPercent: this.numberInRange(record?.lockedPercentSource, 0, 100),
      lastUnlockDate: this.dateString(record?.lastUnlockDateSource),
      sourceKey: record?.primarySource || record?.sourceType || record?.sourceEntityKey,
      evidenceRefs: this.safeStringArray(record?.sourceRefs, 10, 240),
    };
  }

  private compactVestingSummary(record: any) {
    return {
      id: this.idString(record?._id),
      collectionName: "vesting_summaries",
      status: record?.status,
      totalAmount: this.numberInRange(record?.totalAmount, 0, Number.MAX_SAFE_INTEGER),
      unlockedAmount: this.numberInRange(record?.unlockedAmount, 0, Number.MAX_SAFE_INTEGER),
      lockedAmount: this.numberInRange(record?.lockedAmount, 0, Number.MAX_SAFE_INTEGER),
      untrackedAmount: this.numberInRange(record?.untrackedAmount, 0, Number.MAX_SAFE_INTEGER),
      unlockedPercent: this.numberInRange(record?.unlockedPercent, 0, 100),
      lockedPercent: this.numberInRange(record?.lockedPercent, 0, 100),
      untrackedPercent: this.numberInRange(record?.untrackedPercent, 0, 100),
      unlockedValueUsd: this.numberInRange(record?.sourceUnlockedValueUsd, 0, Number.MAX_SAFE_INTEGER),
      lockedValueUsd: this.numberInRange(record?.sourceLockedValueUsd, 0, Number.MAX_SAFE_INTEGER),
      lastUnlockDate: this.dateString(record?.lastUnlockDate),
    };
  }

  private compactUnlockEvent(record: any) {
    return {
      id: this.idString(record?._id),
      collectionName: "unlock_events",
      status: record?.appliedStatus || record?.statusSource,
      saleId: this.saleIdNumber(record?.saleId),
      name: record?.roundName || record?.stage || record?.unlockType,
      unlockDate: this.dateString(record?.unlockDate),
      unlockPercent: this.numberInRange(record?.percentOfSupply, 0, 100),
      unlockTokens: this.numberInRange(record?.amount, 0, Number.MAX_SAFE_INTEGER),
      sourceKey: record?.sourceType || record?.vestingDatasetKey,
    };
  }

  private isProposedVestingRecord(record: any) {
    return /proposed|review|pending|open/i.test(String(record?.status || ""));
  }

  private saleIdNumber(value: unknown) {
    if (!this.hasUsefulSaleId(value)) return undefined;
    return Number(value);
  }

  private dateString(value: unknown) {
    if (!value) return undefined;
    if (value instanceof Date) return value.toISOString();
    return String(value).slice(0, 40);
  }

  private buildSaleIdMap(records: any[]) {
    const groups = new Map<string, any>();
    for (const record of records) {
      const saleId = this.saleIdNumber(record.saleId);
      const name = record.name || record.sourceName || "unnamed";
      const key = saleId !== undefined ? `sale:${saleId}` : `missing:${this.normalizeName(String(name))}`;
      const group = groups.get(key) || {
        saleId,
        allocationName: undefined,
        scheduleName: undefined,
        unlockEventCount: 0,
        linkedAllocationIds: [] as string[],
        linkedVestingRoundIds: [] as string[],
        linkedVestingScheduleIds: [] as string[],
        linkedUnlockEventIds: [] as string[],
        names: new Set<string>(),
        sourceNames: new Set<string>(),
        warnings: [] as string[],
      };

      if (record.name) group.names.add(String(record.name));
      if (record.sourceName) group.sourceNames.add(String(record.sourceName));
      if (record.collectionName === "token_allocations") {
        group.allocationName ||= record.name;
        if (record.id) group.linkedAllocationIds.push(record.id);
      } else if (record.collectionName === "vesting_rounds") {
        group.scheduleName ||= record.name;
        if (record.id) group.linkedVestingRoundIds.push(record.id);
      } else if (record.collectionName === "vesting_schedules") {
        group.scheduleName ||= record.name;
        if (record.id) group.linkedVestingScheduleIds.push(record.id);
      } else if (record.collectionName === "unlock_events") {
        group.unlockEventCount += 1;
        if (record.id) group.linkedUnlockEventIds.push(record.id);
      }
      groups.set(key, group);
    }

    return Array.from(groups.values()).map((group) => {
      const names = Array.from(group.names).filter(Boolean);
      const warnings: string[] = [...group.warnings];
      if (group.saleId === undefined) warnings.push("missing_sale_id");
      if (group.saleId !== undefined && names.length > 1) warnings.push("same_sale_id_has_multiple_names");
      if (group.saleId !== undefined && !group.linkedAllocationIds.length && (group.linkedVestingRoundIds.length || group.linkedVestingScheduleIds.length || group.linkedUnlockEventIds.length)) {
        warnings.push("sale_id_without_allocation");
      }
      if (group.saleId !== undefined && !group.linkedVestingScheduleIds.length && (group.linkedAllocationIds.length || group.linkedVestingRoundIds.length || group.linkedUnlockEventIds.length)) {
        warnings.push("sale_id_without_schedule");
      }

      return {
        saleId: group.saleId,
        allocationName: group.allocationName,
        scheduleName: group.scheduleName,
        sourceNames: Array.from(group.sourceNames).slice(0, 10),
        unlockEventCount: group.unlockEventCount,
        linkedAllocationIds: group.linkedAllocationIds.slice(0, 20),
        linkedVestingRoundIds: group.linkedVestingRoundIds.slice(0, 20),
        linkedVestingScheduleIds: group.linkedVestingScheduleIds.slice(0, 20),
        linkedUnlockEventIds: group.linkedUnlockEventIds.slice(0, 20),
        warnings: Array.from(new Set(warnings)),
      };
    });
  }

  private analyzeVestingSaleIdContext(context: any) {
    const records = [
      ...(context.currentV2Data?.tokenAllocations || []),
      ...(context.currentV2Data?.vestingRounds || []),
      ...(context.currentV2Data?.vestingSchedules || []),
      ...(context.currentV2Data?.unlockEvents || []),
      ...(context.proposedData?.tokenAllocations || []),
      ...(context.proposedData?.vestingRounds || []),
      ...(context.proposedData?.vestingSchedules || []),
      ...(context.proposedData?.unlockEvents || []),
    ];
    const saleIdMap = this.buildSaleIdMap(records);
    const maxSaleId = records
      .map((record: any) => this.saleIdNumber(record.saleId))
      .filter((value: any) => value !== undefined)
      .reduce((max: number, value: number) => Math.max(max, value), 0);
    let nextSaleId = maxSaleId + 1;
    const recommendations: any[] = [];
    const warnings: string[] = [];

    saleIdMap.forEach((group: any) => {
      const targetIds = [
        ...(group.linkedAllocationIds || []),
        ...(group.linkedVestingRoundIds || []),
        ...(group.linkedVestingScheduleIds || []),
        ...(group.linkedUnlockEventIds || []),
      ];
      if (group.saleId === undefined && targetIds.length) {
        const proposedSaleId = nextSaleId++;
        recommendations.push({
          action: "create_new_sale_id",
          targetIds,
          proposedSaleId,
          proposedName: group.allocationName || group.scheduleName,
          reason: "Records describe a vesting/allocation group but do not have a saleId link.",
          confidence: 0.72,
        });
      }
      if ((group.warnings || []).includes("sale_id_without_allocation")) {
        recommendations.push({
          action: "assign_sale_id",
          targetIds,
          proposedSaleId: group.saleId,
          proposedName: group.allocationName || group.scheduleName,
          reason: "Schedule/unlock records have a saleId with no matching allocation in current context.",
          confidence: 0.64,
        });
      }
      if ((group.warnings || []).includes("same_sale_id_has_multiple_names")) {
        recommendations.push({
          action: "split_sale_id",
          targetIds,
          proposedSaleId: nextSaleId++,
          reason: "The same saleId is attached to multiple semantic names/categories.",
          confidence: 0.58,
        });
      }
      warnings.push(...(group.warnings || []));
    });

    const groupsByName = new Map<string, any[]>();
    saleIdMap.forEach((group: any) => {
      const name = this.normalizeName(String(group.allocationName || group.scheduleName || ""));
      if (!name) return;
      const items = groupsByName.get(name) || [];
      items.push(group);
      groupsByName.set(name, items);
    });
    groupsByName.forEach((groups, name) => {
      const saleIds = Array.from(new Set(groups.map((group) => group.saleId).filter((value) => value !== undefined)));
      if (saleIds.length > 1) {
        warnings.push("same_name_has_multiple_sale_ids");
        recommendations.push({
          action: "merge_sale_id",
          targetIds: groups.flatMap((group) => [
            ...(group.linkedAllocationIds || []),
            ...(group.linkedVestingRoundIds || []),
            ...(group.linkedVestingScheduleIds || []),
            ...(group.linkedUnlockEventIds || []),
          ]),
          proposedSaleId: saleIds[0],
          proposedName: name,
          reason: "The same normalized name appears with multiple saleIds.",
          confidence: 0.6,
        });
      }
    });

    return {
      project: context.project,
      saleIdGroups: saleIdMap.map((group: any) => ({
        saleId: group.saleId,
        canonicalName: group.allocationName || group.scheduleName,
        sourceNames: group.sourceNames || [],
        allocationIds: group.linkedAllocationIds || [],
        vestingRoundIds: group.linkedVestingRoundIds || [],
        vestingScheduleIds: group.linkedVestingScheduleIds || [],
        unlockEventIds: group.linkedUnlockEventIds || [],
        status: this.saleIdGroupStatus(group),
        warnings: group.warnings || [],
      })),
      recommendations,
      warnings: Array.from(new Set(warnings)),
    };
  }

  private saleIdGroupStatus(group: any) {
    if (group.saleId === undefined) return "needs_new_sale_id";
    if ((group.warnings || []).some((warning: string) => /multiple|conflict/i.test(warning))) return "conflict";
    if ((group.warnings || []).length) return "missing_links";
    return "ok";
  }

  private normalizeVestingNameCandidate(item: {
    sourceName: string;
    currentName?: string;
    targetId?: string;
    collectionName?: string;
  }) {
    const sourceName = this.safeString(item.sourceName, 160);
    const currentName = this.safeString(item.currentName, 160);
    const proposedCanonicalName = this.proposeCanonicalVestingName(sourceName || currentName);
    const category = this.vestingNameCategory(proposedCanonicalName);
    const shouldRename = Boolean(currentName && proposedCanonicalName && this.normalizeName(currentName) !== this.normalizeName(proposedCanonicalName));
    const riskFlags = [];
    if (!sourceName) riskFlags.push("missing_source_name");
    if (shouldRename && !sourceName) riskFlags.push("rename_without_source_name");
    if (category === "unknown") riskFlags.push("unknown_category");

    return {
      targetId: item.targetId,
      collectionName: item.collectionName,
      sourceName,
      currentName,
      proposedCanonicalName,
      category,
      confidence: category === "unknown" ? 0.35 : shouldRename ? 0.74 : 0.9,
      reason: shouldRename
        ? "Canonical name differs from source/current wording; preserve sourceName separately and only update display/canonical name with evidence."
        : "Name already matches a stable canonical vesting category.",
      shouldRename,
      riskFlags,
    };
  }

  private proposeCanonicalVestingName(value: string) {
    const normalized = this.normalizeName(value);
    if (!normalized) return "";
    if (/seed/.test(normalized)) return "Seed Round";
    if (/strategic/.test(normalized)) return "Strategic Round";
    if (/private|investor|investors|sale a|round a/.test(normalized)) return "Private Round";
    if (/public|ido|ieo|ico|launchpad/.test(normalized)) return "Public Sale";
    if (/team/.test(normalized) && /advisor/.test(normalized)) return "Team & Advisors";
    if (/team/.test(normalized)) return "Team";
    if (/advisor/.test(normalized)) return "Advisors";
    if (/ecosystem/.test(normalized)) return "Ecosystem";
    if (/foundation/.test(normalized)) return "Foundation";
    if (/treasury|reserve/.test(normalized)) return "Treasury";
    if (/community/.test(normalized)) return "Community";
    if (/liquid|liquidity|market making|market-making/.test(normalized)) return "Liquidity";
    if (/marketing|growth/.test(normalized)) return "Marketing";
    if (/reward|incentive|staking/.test(normalized)) return "Rewards";
    return value.trim().replace(/\s+/g, " ").slice(0, 160);
  }

  private vestingNameCategory(value: string) {
    const normalized = this.normalizeName(value);
    if (/seed/.test(normalized)) return "seed";
    if (/private|strategic/.test(normalized)) return "private";
    if (/public|ido|ieo|ico|launchpad/.test(normalized)) return "public_sale";
    if (/team/.test(normalized) && /advisor/.test(normalized)) return "team";
    if (/team/.test(normalized)) return "team";
    if (/advisor/.test(normalized)) return "advisors";
    if (/ecosystem/.test(normalized)) return "ecosystem";
    if (/foundation/.test(normalized)) return "foundation";
    if (/treasury|reserve/.test(normalized)) return "treasury";
    if (/community/.test(normalized)) return "community";
    if (/liquid|liquidity/.test(normalized)) return "liquidity";
    if (/marketing|growth/.test(normalized)) return "marketing";
    if (/reward|incentive|staking/.test(normalized)) return "rewards";
    return "unknown";
  }

  private vestingNameRecommendationsFromContext(context: any, limit: number) {
    const records = [
      ...(context.currentV2Data?.tokenAllocations || []),
      ...(context.currentV2Data?.vestingRounds || []),
      ...(context.currentV2Data?.vestingSchedules || []),
      ...(context.proposedData?.tokenAllocations || []),
      ...(context.proposedData?.vestingRounds || []),
      ...(context.proposedData?.vestingSchedules || []),
    ];
    return records
      .slice(0, limit)
      .map((record: any) => this.normalizeVestingNameCandidate({
        sourceName: record.sourceName || record.name,
        currentName: record.name,
        targetId: record.id,
        collectionName: record.collectionName,
      }))
      .filter((item: any) => item.shouldRename || item.riskFlags.length);
  }

  private buildVestingPlannedChanges(context: any, nameRecommendations: any[], saleRecommendations: any[]) {
    const records = [
      ...(context.currentV2Data?.tokenAllocations || []),
      ...(context.currentV2Data?.vestingRounds || []),
      ...(context.currentV2Data?.vestingSchedules || []),
      ...(context.currentV2Data?.unlockEvents || []),
      ...(context.proposedData?.tokenAllocations || []),
      ...(context.proposedData?.vestingRounds || []),
      ...(context.proposedData?.vestingSchedules || []),
      ...(context.proposedData?.unlockEvents || []),
    ];
    const byId = new Map(records.map((record: any) => [String(record.id), record]));
    const changes: any[] = [];

    nameRecommendations
      .filter((item: any) => item.shouldRename && item.targetId && VESTING_WRITE_COLLECTIONS.has(item.collectionName))
      .forEach((item: any) => {
        const before = byId.get(String(item.targetId)) || {};
        const isRoundLike = item.collectionName === "vesting_rounds" || item.collectionName === "vesting_schedules";
        const set: Record<string, unknown> = isRoundLike
          ? {
              roundName: item.proposedCanonicalName,
              normalizedRoundName: this.normalizeName(item.proposedCanonicalName),
            }
          : {
              name: item.proposedCanonicalName,
              normalizedName: this.normalizeName(item.proposedCanonicalName),
            };
        if (item.sourceName && !before.sourceName) set.sourceName = item.sourceName;
        changes.push({
          db: "fomo_dev",
          targetDb: this.adminAiConfig.getDbName(),
          collectionName: item.collectionName,
          operation: "updateOne",
          filter: { _id: item.targetId },
          update: { $set: set },
          beforePreview: this.formatSafeValue(before),
          afterPreview: this.formatSafeValue({ ...before, ...set }),
          reason: item.reason,
          riskFlags: item.riskFlags,
        });
      });

    saleRecommendations
      .filter((item: any) => ["assign_sale_id", "create_new_sale_id", "merge_sale_id"].includes(item.action))
      .forEach((item: any) => {
        (item.targetIds || []).forEach((targetId: string) => {
          const before = byId.get(String(targetId));
          if (!before?.collectionName || !VESTING_WRITE_COLLECTIONS.has(before.collectionName)) return;
          if (!this.hasUsefulSaleId(item.proposedSaleId)) return;
          changes.push({
            db: "fomo_dev",
            targetDb: this.adminAiConfig.getDbName(),
            collectionName: before.collectionName,
            operation: "updateOne",
            filter: { _id: targetId },
            update: { $set: { saleId: item.proposedSaleId } },
            beforePreview: this.formatSafeValue(before),
            afterPreview: this.formatSafeValue({ ...before, saleId: item.proposedSaleId }),
            reason: item.reason,
            riskFlags: ["sale_id_update"],
          });
        });
      });

    return changes.slice(0, 50);
  }

  private async executeVestingPlannedChanges(plannedChanges: any[]) {
    const affectedIds: string[] = [];
    let createdCount = 0;
    let updatedCount = 0;
    let modifiedCount = 0;
    const warnings: string[] = [];

    for (const change of plannedChanges.slice(0, 50)) {
      if (change.db !== "fomo_dev" || change.targetDb !== this.adminAiConfig.getDbName()) {
        return {
          error: "Vesting write target DB is not allowed",
          errorCode: "VESTING_WRITE_DB_FORBIDDEN",
          createdCount,
          updatedCount,
          modifiedCount,
          affectedIds,
          warnings,
        };
      }
      if (!VESTING_WRITE_COLLECTIONS.has(change.collectionName)) {
        return {
          error: "Vesting write collection is not allowlisted",
          errorCode: "VESTING_WRITE_COLLECTION_FORBIDDEN",
          createdCount,
          updatedCount,
          modifiedCount,
          affectedIds,
          warnings,
        };
      }

      if (change.operation === "insertOne") {
        const document = this.safeGenericDocument(change.document);
        const result = await this.adminConnection.db.collection(change.collectionName).insertOne({
          ...document,
          aiAdminCreatedAt: new Date(),
        });
        createdCount += 1;
        if (result.insertedId) affectedIds.push(String(result.insertedId));
      } else if (change.operation === "updateOne") {
        const filter = this.safeMongoFilter(change.filter);
        if (!filter._id) {
          return {
            error: "Vesting updateOne requires _id filter",
            errorCode: "VESTING_WRITE_STRICT_FILTER_REQUIRED",
            createdCount,
            updatedCount,
            modifiedCount,
            affectedIds,
            warnings,
          };
        }
        const update = this.safeMongoUpdate(change.update);
        const result = await this.adminConnection.db.collection(change.collectionName).updateOne(filter, update);
        const counts = this.mongoWriteCounts(result);
        createdCount += counts.createdCount;
        updatedCount += counts.updatedCount;
        modifiedCount += counts.modifiedCount;
        affectedIds.push(String(filter._id));
      } else {
        return {
          error: "Unsupported vesting write operation",
          errorCode: "VESTING_WRITE_OPERATION_FORBIDDEN",
          createdCount,
          updatedCount,
          modifiedCount,
          affectedIds,
          warnings,
        };
      }
    }

    return {
      createdCount,
      updatedCount,
      modifiedCount,
      affectedIds: Array.from(new Set(affectedIds)),
      warnings,
    };
  }

  private emptyVestingReviewJson() {
    return {
      tokenAllocation: [],
      vestingRounds: [],
      vestingSummary: {
        unlockedPercent: 0,
        lockedPercent: 0,
        untrackedPercent: 0,
        totalAmount: 0,
        unlockedAmount: 0,
        lockedAmount: 0,
        untrackedAmount: 0,
        lastUnlockDate: null,
      },
      vestingSchedule: [],
      vestingTimeline: [],
    };
  }

  private emptyVestingDiffSummary() {
    return { added: 0, changed: 0, removed: 0, unchanged: 0, criticalIssues: 0 };
  }

  private normalizeVestingReviewJson(value: unknown) {
    const raw = value && typeof value === "object" ? value as Record<string, any> : {};
    const tokenAllocation = this.arrayValue(raw.tokenAllocation || raw.tokenAllocations)
      .map((item) => this.normalizeVestingAllocation(item));
    const vestingRounds = this.arrayValue(raw.vestingRounds || raw.rounds)
      .map((item) => this.normalizeVestingRound(item));
    const vestingSchedule = this.arrayValue(raw.vestingSchedule || raw.vestingSchedules)
      .map((item) => this.normalizeVestingScheduleJson(item));
    const vestingTimeline = this.arrayValue(raw.vestingTimeline || raw.unlockEvents || raw.unlockingEvents)
      .map((item) => this.normalizeVestingTimelineItem(item));

    return {
      tokenAllocation,
      vestingRounds,
      vestingSummary: this.normalizeVestingSummary(raw.vestingSummary || raw.vestingSummaries?.[0] || {}),
      vestingSchedule,
      vestingTimeline,
    };
  }

  private vestingReviewJsonFromContextData(data: any) {
    if (!data || typeof data !== "object") return this.emptyVestingReviewJson();
    return this.normalizeVestingReviewJson({
      tokenAllocation: data.tokenAllocations || [],
      vestingRounds: data.vestingRounds || [],
      vestingSummary: (data.vestingSummaries || [])[0] || {},
      vestingSchedule: data.vestingSchedules || [],
      vestingTimeline: data.unlockEvents || [],
    });
  }

  private hasVestingReviewJsonData(value: any) {
    if (!value || typeof value !== "object") return false;
    return VESTING_JSON_ARRAY_KEYS.some((key) => Array.isArray(value[key]) && value[key].length > 0);
  }

  private normalizeVestingAllocation(value: any) {
    const sourceName = this.safeString(value?.sourceName || value?.source_name, 180);
    const name = this.safeString(value?.name || sourceName, 180);
    return this.cleanUndefined({
      name: name || sourceName,
      sourceName: sourceName || undefined,
      percent: this.numberInRange(value?.percent ?? value?.allocationPercent, 0, 100),
      amount: this.numberInRange(value?.amount ?? value?.tokenAmount ?? value?.totalAmount, 0, Number.MAX_SAFE_INTEGER),
      saleId: this.saleIdNumber(value?.saleId),
      normalizedCategory: this.safeEnum(
        value?.normalizedCategory || value?.category || this.vestingNameCategory(name || sourceName),
        SAFE_VESTING_CATEGORIES,
        "unknown"
      ),
    });
  }

  private normalizeVestingRound(value: any) {
    const sourceName = this.safeString(value?.sourceName || value?.source_name, 180);
    const roundName = this.safeString(value?.roundName || value?.name || sourceName, 180);
    return this.cleanUndefined({
      roundName: roundName || sourceName,
      sourceName: sourceName || undefined,
      saleId: this.saleIdNumber(value?.saleId),
      normalizedCategory: this.safeEnum(
        value?.normalizedCategory || value?.category || this.vestingNameCategory(roundName || sourceName),
        SAFE_VESTING_CATEGORIES,
        "unknown"
      ),
      totalAmount: this.numberInRange(value?.totalAmount ?? value?.tokenAmount ?? value?.amount, 0, Number.MAX_SAFE_INTEGER),
      tgeUnlockPercent: this.numberInRange(value?.tgeUnlockPercent ?? value?.unlockPercentAtTge, 0, 100),
      hasCliff: Boolean(value?.hasCliff || Number(value?.cliffMonths || 0) > 0),
      vestingType: this.safeEnum(value?.vestingType, SAFE_VESTING_TYPES, "unknown"),
      vestingFrequency: value?.vestingFrequency === undefined ? null : this.safeString(value?.vestingFrequency, 80),
      vestingDurationMonths: this.numberInRange(value?.vestingDurationMonths ?? value?.vestingMonths, 0, 600),
      vestedPercent: this.numberInRange(value?.vestedPercent ?? value?.unlockedPercent, 0, 100),
      vestedAmount: this.numberInRange(value?.vestedAmount ?? value?.unlockedAmount, 0, Number.MAX_SAFE_INTEGER),
      lockedPercent: this.numberInRange(value?.lockedPercent, 0, 100),
      lockedAmount: this.numberInRange(value?.lockedAmount, 0, Number.MAX_SAFE_INTEGER),
      startDate: this.dateOrNull(value?.startDate),
      endDate: this.dateOrNull(value?.endDate || value?.lastUnlockDate),
      dateConfidence: this.safeEnum(value?.dateConfidence, SAFE_DATE_CONFIDENCE, "unknown"),
    });
  }

  private normalizeVestingScheduleJson(value: any) {
    const sourceName = this.safeString(value?.sourceName || value?.source_name, 180);
    const roundName = this.safeString(value?.roundName || value?.name || sourceName, 180);
    return this.cleanUndefined({
      roundName: roundName || sourceName,
      sourceName: sourceName || undefined,
      saleId: this.saleIdNumber(value?.saleId),
      normalizedCategory: this.safeEnum(
        value?.normalizedCategory || value?.category || this.vestingNameCategory(roundName || sourceName),
        SAFE_VESTING_CATEGORIES,
        "unknown"
      ),
      tgeUnlockPercent: this.numberInRange(value?.tgeUnlockPercent ?? value?.unlockPercentAtTge, 0, 100),
      vestingType: this.safeEnum(value?.vestingType, SAFE_VESTING_TYPES, "unknown"),
      vestingFrequency: value?.vestingFrequency === undefined ? null : this.safeString(value?.vestingFrequency, 80),
      vestingDurationMonths: this.numberInRange(value?.vestingDurationMonths ?? value?.vestingMonths, 0, 600),
      currentUnlockedPercent: this.numberInRange(value?.currentUnlockedPercent ?? value?.unlockedPercent, 0, 100),
      currentLockedPercent: this.numberInRange(value?.currentLockedPercent ?? value?.lockedPercent, 0, 100),
      startDate: this.dateOrNull(value?.startDate),
      endDate: this.dateOrNull(value?.endDate),
      dateConfidence: this.safeEnum(value?.dateConfidence, SAFE_DATE_CONFIDENCE, "unknown"),
    });
  }

  private normalizeVestingTimelineItem(value: any) {
    const sourceName = this.safeString(value?.sourceName || value?.source_name, 180);
    const roundName = this.safeString(value?.roundName || value?.name || value?.stage || sourceName, 180);
    const unlockDate = this.dateOrNull(value?.unlockDate);
    return this.cleanUndefined({
      roundName: roundName || sourceName,
      sourceName: sourceName || undefined,
      saleId: this.saleIdNumber(value?.saleId),
      normalizedCategory: this.safeEnum(
        value?.normalizedCategory || value?.category || this.vestingNameCategory(roundName || sourceName),
        SAFE_VESTING_CATEGORIES,
        "unknown"
      ),
      totalAmount: this.numberInRange(value?.totalAmount ?? value?.amount ?? value?.unlockTokens, 0, Number.MAX_SAFE_INTEGER),
      tgeUnlockPercent: this.numberInRange(value?.tgeUnlockPercent ?? value?.unlockPercent, 0, 100),
      hasCliff: Boolean(value?.hasCliff || Number(value?.cliffMonths || 0) > 0),
      vestingType: this.safeEnum(value?.vestingType || value?.unlockType, SAFE_VESTING_TYPES, "unknown"),
      vestingFrequency: value?.vestingFrequency === undefined ? null : this.safeString(value?.vestingFrequency, 80),
      vestingDurationMonths: this.numberInRange(value?.vestingDurationMonths ?? value?.vestingMonths, 0, 600),
      vestedPercent: this.numberInRange(value?.vestedPercent ?? value?.unlockPercent, 0, 100),
      vestedAmount: this.numberInRange(value?.vestedAmount ?? value?.unlockTokens, 0, Number.MAX_SAFE_INTEGER),
      lockedPercent: this.numberInRange(value?.lockedPercent, 0, 100),
      lockedAmount: this.numberInRange(value?.lockedAmount, 0, Number.MAX_SAFE_INTEGER),
      startDate: this.dateOrNull(value?.startDate || unlockDate),
      endDate: this.dateOrNull(value?.endDate || unlockDate),
      dateConfidence: this.safeEnum(value?.dateConfidence, SAFE_DATE_CONFIDENCE, unlockDate ? "exact" : "unknown"),
    });
  }

  private normalizeVestingSummary(value: any) {
    return {
      unlockedPercent: this.numberInRange(value?.unlockedPercent, 0, 100) ?? 0,
      lockedPercent: this.numberInRange(value?.lockedPercent, 0, 100) ?? 0,
      untrackedPercent: this.numberInRange(value?.untrackedPercent, 0, 100) ?? 0,
      totalAmount: this.numberInRange(value?.totalAmount, 0, Number.MAX_SAFE_INTEGER) ?? 0,
      unlockedAmount: this.numberInRange(value?.unlockedAmount, 0, Number.MAX_SAFE_INTEGER) ?? 0,
      lockedAmount: this.numberInRange(value?.lockedAmount, 0, Number.MAX_SAFE_INTEGER) ?? 0,
      untrackedAmount: this.numberInRange(value?.untrackedAmount, 0, Number.MAX_SAFE_INTEGER) ?? 0,
      unlockedValueUsd: this.numberInRange(value?.unlockedValueUsd, 0, Number.MAX_SAFE_INTEGER),
      lockedValueUsd: this.numberInRange(value?.lockedValueUsd, 0, Number.MAX_SAFE_INTEGER),
      lastUnlockDate: this.dateOrNull(value?.lastUnlockDate),
    };
  }

  private validateVestingReviewJson(value: any) {
    const errors: Array<{ path: string; type: string; message: string }> = [];
    const warnings: string[] = [];
    const addError = (path: string, type: string, message: string) => {
      errors.push({ path, type, message });
    };

    VESTING_JSON_ARRAY_KEYS.forEach((key) => {
      if (!Array.isArray(value?.[key])) {
        addError(key, "shape_invalid", `${key} must be an array`);
      }
    });

    const checkSaleId = (path: string, saleId: unknown) => {
      if (!this.hasUsefulSaleId(saleId)) addError(`${path}.saleId`, "sale_id_missing", "saleId is required and must be numeric");
    };
    const checkNumber = (path: string, rawValue: unknown) => {
      if (rawValue === undefined || rawValue === null || !Number.isFinite(Number(rawValue))) {
        addError(path, "number_invalid", "Value must be numeric");
      }
    };
    const checkDate = (path: string, rawValue: unknown) => {
      if (rawValue === null || rawValue === undefined || rawValue === "") return;
      const parsed = new Date(String(rawValue));
      if (Number.isNaN(parsed.getTime())) addError(path, "date_invalid", "Date must be ISO-like or null");
    };
    const checkEnum = (path: string, rawValue: unknown, allowed: readonly string[], type: string) => {
      if (!allowed.includes(String(rawValue))) addError(path, type, `Value must be one of: ${allowed.join(", ")}`);
    };

    (value.tokenAllocation || []).forEach((item: any, index: number) => {
      const path = `tokenAllocation[${index}]`;
      if (!item?.name) addError(`${path}.name`, "name_missing", "Canonical allocation name is required");
      checkSaleId(path, item?.saleId);
      checkNumber(`${path}.percent`, item?.percent);
      checkNumber(`${path}.amount`, item?.amount);
      checkEnum(`${path}.normalizedCategory`, item?.normalizedCategory, SAFE_VESTING_CATEGORIES, "category_invalid");
    });
    (value.vestingRounds || []).forEach((item: any, index: number) => {
      const path = `vestingRounds[${index}]`;
      if (!item?.roundName) addError(`${path}.roundName`, "name_missing", "Canonical round name is required");
      checkSaleId(path, item?.saleId);
      checkNumber(`${path}.totalAmount`, item?.totalAmount);
      checkNumber(`${path}.tgeUnlockPercent`, item?.tgeUnlockPercent);
      checkEnum(`${path}.normalizedCategory`, item?.normalizedCategory, SAFE_VESTING_CATEGORIES, "category_invalid");
      checkEnum(`${path}.vestingType`, item?.vestingType, SAFE_VESTING_TYPES, "vesting_type_invalid");
      checkEnum(`${path}.dateConfidence`, item?.dateConfidence, SAFE_DATE_CONFIDENCE, "date_confidence_invalid");
      checkDate(`${path}.startDate`, item?.startDate);
      checkDate(`${path}.endDate`, item?.endDate);
    });
    (value.vestingSchedule || []).forEach((item: any, index: number) => {
      const path = `vestingSchedule[${index}]`;
      if (!item?.roundName) addError(`${path}.roundName`, "name_missing", "Canonical schedule round name is required");
      checkSaleId(path, item?.saleId);
      checkNumber(`${path}.tgeUnlockPercent`, item?.tgeUnlockPercent);
      checkEnum(`${path}.normalizedCategory`, item?.normalizedCategory, SAFE_VESTING_CATEGORIES, "category_invalid");
      checkEnum(`${path}.vestingType`, item?.vestingType, SAFE_VESTING_TYPES, "vesting_type_invalid");
      checkEnum(`${path}.dateConfidence`, item?.dateConfidence, SAFE_DATE_CONFIDENCE, "date_confidence_invalid");
      checkDate(`${path}.startDate`, item?.startDate);
      checkDate(`${path}.endDate`, item?.endDate);
    });
    (value.vestingTimeline || []).forEach((item: any, index: number) => {
      const path = `vestingTimeline[${index}]`;
      if (!item?.roundName) addError(`${path}.roundName`, "name_missing", "Canonical timeline round name is required");
      checkSaleId(path, item?.saleId);
      checkNumber(`${path}.totalAmount`, item?.totalAmount);
      checkNumber(`${path}.tgeUnlockPercent`, item?.tgeUnlockPercent);
      checkEnum(`${path}.normalizedCategory`, item?.normalizedCategory, SAFE_VESTING_CATEGORIES, "category_invalid");
      checkEnum(`${path}.vestingType`, item?.vestingType, SAFE_VESTING_TYPES, "vesting_type_invalid");
      checkEnum(`${path}.dateConfidence`, item?.dateConfidence, SAFE_DATE_CONFIDENCE, "date_confidence_invalid");
      checkDate(`${path}.startDate`, item?.startDate);
      checkDate(`${path}.endDate`, item?.endDate);
    });

    const allocationPercentSum = (value.tokenAllocation || []).reduce(
      (sum: number, item: any) => sum + Number(item?.percent || 0),
      0
    );
    if ((value.tokenAllocation || []).length && (allocationPercentSum < 99.5 || allocationPercentSum > 100.5)) {
      addError("tokenAllocation", "percent_sum_invalid", `Allocation percent sum is ${allocationPercentSum.toFixed(4)}, expected 99.5-100.5`);
    }

    const saleIdMap = this.buildVestingCompareSaleIdMap(value);
    saleIdMap.forEach((item: any) => {
      if ((item.warnings || []).includes("same_sale_id_has_multiple_names")) {
        addError(`saleIdMap.${item.saleId}`, "sale_id_conflict", "Same saleId is linked to multiple canonical names");
      }
    });
    if (!this.hasVestingReviewJsonData(value)) warnings.push("No vesting review records were provided.");

    return { valid: errors.length === 0, errors, warnings };
  }

  private buildVestingCompareSaleIdMap(value: any) {
    const groups = new Map<number, any>();
    const add = (record: any, kind: "allocation" | "round" | "schedule" | "timeline") => {
      const saleId = this.saleIdNumber(record?.saleId);
      if (saleId === undefined) return;
      const name = this.safeString(record?.name || record?.roundName, 180);
      const sourceName = this.safeString(record?.sourceName, 180);
      const existing = groups.get(saleId) || {
        saleId,
        canonicalName: name,
        sourceNames: new Set<string>(),
        categories: new Set<string>(),
        linkedTokenAllocation: false,
        linkedVestingRound: false,
        linkedVestingSchedule: false,
        linkedTimeline: false,
        names: new Set<string>(),
        warnings: [] as string[],
      };
      if (name) {
        existing.names.add(name);
        existing.canonicalName ||= name;
      }
      if (sourceName) existing.sourceNames.add(sourceName);
      if (record?.normalizedCategory) existing.categories.add(String(record.normalizedCategory));
      if (kind === "allocation") existing.linkedTokenAllocation = true;
      if (kind === "round") existing.linkedVestingRound = true;
      if (kind === "schedule") existing.linkedVestingSchedule = true;
      if (kind === "timeline") existing.linkedTimeline = true;
      groups.set(saleId, existing);
    };

    (value.tokenAllocation || []).forEach((record: any) => add(record, "allocation"));
    (value.vestingRounds || []).forEach((record: any) => add(record, "round"));
    (value.vestingSchedule || []).forEach((record: any) => add(record, "schedule"));
    (value.vestingTimeline || []).forEach((record: any) => add(record, "timeline"));

    return Array.from(groups.values()).map((group) => {
      const names = Array.from(group.names).filter(Boolean);
      const warnings = [...group.warnings];
      if (names.length > 1) warnings.push("same_sale_id_has_multiple_names");
      if (!group.linkedTokenAllocation && (group.linkedVestingRound || group.linkedVestingSchedule || group.linkedTimeline)) {
        warnings.push("sale_id_without_allocation");
      }
      if (!group.linkedVestingSchedule && (group.linkedTokenAllocation || group.linkedVestingRound || group.linkedTimeline)) {
        warnings.push("sale_id_without_schedule");
      }
      if (group.linkedTimeline && !group.linkedVestingSchedule) warnings.push("timeline_without_schedule");

      return {
        saleId: group.saleId,
        canonicalName: group.canonicalName || names[0] || "Unnamed vesting group",
        sourceNames: Array.from(group.sourceNames).slice(0, 12),
        normalizedCategory: Array.from(group.categories)[0] || "unknown",
        linkedTokenAllocation: group.linkedTokenAllocation,
        linkedVestingRound: group.linkedVestingRound,
        linkedVestingSchedule: group.linkedVestingSchedule,
        linkedTimeline: group.linkedTimeline,
        warnings: Array.from(new Set(warnings)),
      };
    }).sort((left, right) => Number(left.saleId) - Number(right.saleId));
  }

  private async buildVestingReviewSourcesUsed(input: {
    input: Record<string, unknown>;
    vestingContext: any;
    limit: number;
    useOfficialSources: boolean;
    useWebSearch: boolean;
    warnings: string[];
  }) {
    if (!input.useOfficialSources) {
      input.warnings.push("Official source lookup was disabled by input.");
      return [];
    }

    const sourcesUsed = (((input.vestingContext as any).sourceLinks as any[]) || [])
      .slice(0, input.limit)
      .map((link) => this.vestingReviewSourceUsed(link));

    if (input.useWebSearch && !this.hasSufficientOfficialEvidence(sourcesUsed)) {
      const project = (input.vestingContext as any).project || {};
      if (project.name || input.input.projectQuery || input.input.query) {
        const searchResult = await this.fomoWebSearchOfficialSources({
          projectName: project.name || input.input.projectQuery || input.input.query,
          symbol: project.symbol,
          website: project.website,
          intent: "tokenomics",
          trustedDomains: sourcesUsed
            .filter((source) => source.officialLikelihood === "high")
            .map((source) => this.hostFromDomainOrUrl(source.url))
            .filter(Boolean),
          limit: input.limit,
        });
        const searchData = searchResult.data || {};
        input.warnings.push(...((searchData.warnings as string[] | undefined) || []));
        if (searchData.errorCode) {
          input.warnings.push(`Web search unavailable or incomplete: ${searchData.errorCode}`);
        }
        sourcesUsed.push(
          ...(((searchData.results as any[]) || []).slice(0, input.limit).map((result) =>
            this.vestingReviewSourceUsed(result)
          ))
        );
      }
    }

    const seen = new Set<string>();
    return sourcesUsed.filter((source) => {
      if (!source.url) return false;
      const key = source.url.toLowerCase();
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    }).slice(0, input.limit);
  }

  private vestingReviewSourceUsed(source: any) {
    const rawType = source?.sourceType || source?.type || this.classifySourceUrl(source?.url);
    const sourceType = this.vestingReviewSourceType(rawType);
    const officialLikelihood = this.safeEnum(
      source?.officialLikelihood,
      ["high", "medium", "low"],
      sourceType === "third_party" ? "low" : "medium"
    );
    const evidenceStrength = this.safeEnum(
      source?.evidenceStrength,
      ["strong", "medium", "weak"],
      officialLikelihood === "high" ? "strong" : officialLikelihood === "medium" ? "medium" : "weak"
    );

    return {
      url: this.normalizeHttpUrl(source?.url),
      sourceType,
      officialLikelihood,
      evidenceStrength,
      usedForDecision: sourceType !== "third_party" && officialLikelihood !== "low",
    };
  }

  private vestingReviewSourceType(value: unknown) {
    const type = String(value || "").toLowerCase();
    if (type === "docs") return "docs";
    if (type === "blog") return "blog";
    if (type === "whitepaper") return "whitepaper";
    if (type === "third_party") return "third_party";
    if (["official", "website", "tokenomics", "github"].includes(type)) return "official";
    return "unknown";
  }

  private buildVestingReviewNameChanges(currentJson: any, proposedJson: any) {
    const currentBySaleId = new Map<number, any>();
    [
      ...(currentJson?.tokenAllocation || []),
      ...(currentJson?.vestingRounds || []),
      ...(currentJson?.vestingSchedule || []),
      ...(currentJson?.vestingTimeline || []),
    ].forEach((record: any) => {
      const saleId = this.saleIdNumber(record.saleId);
      if (saleId !== undefined) currentBySaleId.set(saleId, record);
    });
    const changes: any[] = [];
    const addChange = (record: any, path: string, proposedName: string) => {
      const sourceName = this.safeString(record?.sourceName, 180);
      const current = currentBySaleId.get(Number(record?.saleId));
      const currentName = this.safeString(current?.name || current?.roundName, 180);
      if (!sourceName && !currentName) return;
      const changedFromSource = sourceName && this.normalizeName(sourceName) !== this.normalizeName(proposedName);
      const changedFromCurrent = currentName && this.normalizeName(currentName) !== this.normalizeName(proposedName);
      if (!changedFromSource && !changedFromCurrent) return;
      changes.push({
        path,
        currentName: currentName || undefined,
        sourceName: sourceName || undefined,
        proposedName,
        reason: "Canonical/display name differs from source/current wording; sourceName is preserved separately.",
        confidence: changedFromSource ? 0.74 : 0.68,
      });
    };

    (proposedJson.tokenAllocation || []).forEach((record: any, index: number) =>
      addChange(record, `tokenAllocation[${index}].name`, record.name)
    );
    (proposedJson.vestingRounds || []).forEach((record: any, index: number) =>
      addChange(record, `vestingRounds[${index}].roundName`, record.roundName)
    );
    (proposedJson.vestingSchedule || []).forEach((record: any, index: number) =>
      addChange(record, `vestingSchedule[${index}].roundName`, record.roundName)
    );
    (proposedJson.vestingTimeline || []).forEach((record: any, index: number) =>
      addChange(record, `vestingTimeline[${index}].roundName`, record.roundName)
    );
    return changes.slice(0, 50);
  }

  private buildVestingReviewIssues(input: {
    currentJson: any;
    proposedJson: any;
    saleIdMap: any[];
    nameChanges: any[];
    sourcesUsed: any[];
    validationErrors: Array<{ path: string; type: string; message: string }>;
  }) {
    const issues: any[] = input.validationErrors.map((error) => ({
      severity: this.vestingIssueSeverity(error.type),
      type: this.vestingIssueType(error.type),
      path: error.path,
      reason: error.message,
    }));

    input.saleIdMap.forEach((group) => {
      (group.warnings || []).forEach((warning: string) => {
        const type = warning === "sale_id_without_allocation"
          ? "schedule_without_allocation"
          : warning === "sale_id_without_schedule"
            ? "allocation_without_schedule"
            : warning === "timeline_without_schedule"
              ? "schedule_without_allocation"
              : "sale_id_conflict";
        issues.push({
          severity: warning.includes("multiple") ? "high" : "medium",
          type,
          path: `saleIdMap.${group.saleId}`,
          proposedValue: group.saleId,
          reason: warning.replace(/_/g, " "),
        });
      });
    });
    input.nameChanges.forEach((change) => {
      issues.push({
        severity: "low",
        type: "name_quality",
        path: change.path,
        currentValue: change.currentName || change.sourceName,
        proposedValue: change.proposedName,
        reason: change.reason,
        suggestedFix: change.proposedName,
      });
    });
    if (!this.hasSufficientOfficialEvidence(input.sourcesUsed)) {
      issues.push({
        severity: "medium",
        type: "needs_more_sources",
        path: "sourcesUsed",
        reason: "No high-likelihood official/docs/blog/whitepaper evidence was found; third-party sources can only support the decision.",
      });
    }

    const seen = new Set<string>();
    return issues.filter((issue) => {
      const key = `${issue.type}:${issue.path}:${issue.reason}`;
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    }).slice(0, 80);
  }

  private vestingIssueType(type: string) {
    if (type === "sale_id_missing") return "sale_id_missing";
    if (type === "sale_id_conflict") return "sale_id_conflict";
    if (type === "percent_sum_invalid") return "percent_sum_invalid";
    if (type === "category_invalid") return "category_mismatch";
    if (type === "date_invalid") return "date_conflict";
    if (type === "number_invalid") return "amount_mismatch";
    return "source_conflict";
  }

  private vestingIssueSeverity(type: string) {
    if (["sale_id_missing", "sale_id_conflict", "percent_sum_invalid"].includes(type)) return "high";
    if (["date_invalid", "number_invalid", "category_invalid"].includes(type)) return "medium";
    return "low";
  }

  private buildVestingJsonDiffSummary(currentJson: any, proposedJson: any, issues: any[]) {
    const summary = this.emptyVestingDiffSummary();
    const add = (value: { added: number; changed: number; removed: number; unchanged: number }) => {
      summary.added += value.added;
      summary.changed += value.changed;
      summary.removed += value.removed;
      summary.unchanged += value.unchanged;
    };
    add(this.diffRows(currentJson?.tokenAllocation || [], proposedJson?.tokenAllocation || [], "name"));
    add(this.diffRows(currentJson?.vestingRounds || [], proposedJson?.vestingRounds || [], "roundName"));
    add(this.diffRows(currentJson?.vestingSchedule || [], proposedJson?.vestingSchedule || [], "roundName"));
    add(this.diffRows(currentJson?.vestingTimeline || [], proposedJson?.vestingTimeline || [], "roundName"));
    const currentSummary = JSON.stringify(currentJson?.vestingSummary || {});
    const proposedSummary = JSON.stringify(proposedJson?.vestingSummary || {});
    if (currentSummary || proposedSummary) {
      if (!currentSummary && proposedSummary) summary.added += 1;
      else if (currentSummary && !proposedSummary) summary.removed += 1;
      else if (currentSummary === proposedSummary) summary.unchanged += 1;
      else summary.changed += 1;
    }
    summary.criticalIssues = issues.filter((issue) => issue.severity === "critical").length;
    return summary;
  }

  private diffRows(currentRows: any[], proposedRows: any[], nameKey: string) {
    const keyFor = (record: any) => {
      const saleId = this.saleIdNumber(record?.saleId);
      if (saleId !== undefined) return `sale:${saleId}`;
      return `name:${this.normalizeName(String(record?.[nameKey] || record?.name || record?.sourceName || ""))}`;
    };
    const current = new Map(currentRows.map((record) => [keyFor(record), record]));
    const proposed = new Map(proposedRows.map((record) => [keyFor(record), record]));
    let added = 0;
    let changed = 0;
    let removed = 0;
    let unchanged = 0;
    proposed.forEach((record, key) => {
      if (!current.has(key)) {
        added += 1;
        return;
      }
      if (JSON.stringify(current.get(key)) === JSON.stringify(record)) unchanged += 1;
      else changed += 1;
    });
    current.forEach((_, key) => {
      if (!proposed.has(key)) removed += 1;
    });
    return { added, changed, removed, unchanged };
  }

  private vestingReviewCompareRecommendation(input: {
    proposedJson: any;
    issues: any[];
    sourcesUsed: any[];
    useOfficialSources: boolean;
  }) {
    if (!this.hasVestingReviewJsonData(input.proposedJson)) return "manual_review";
    if (input.issues.some((issue) => issue.severity === "critical")) return "reject";
    if (input.useOfficialSources && !this.hasSufficientOfficialEvidence(input.sourcesUsed)) return "needs_more_sources";
    if (input.issues.some((issue) => issue.severity === "high" || issue.severity === "medium")) return "approve_with_edits";
    return "approve";
  }

  private vestingReviewCompareConfidence(input: {
    recommendation: string;
    issues: any[];
    sourcesUsed: any[];
    validationValid: boolean;
  }) {
    let score = input.validationValid ? 0.72 : 0.42;
    if (this.hasSufficientOfficialEvidence(input.sourcesUsed)) score += 0.14;
    score -= input.issues.filter((issue) => issue.severity === "high").length * 0.08;
    score -= input.issues.filter((issue) => issue.severity === "medium").length * 0.04;
    if (input.recommendation === "approve") score += 0.06;
    if (input.recommendation === "needs_more_sources") score = Math.min(score, 0.58);
    return Math.max(0.1, Math.min(0.95, Number(score.toFixed(2))));
  }

  private arrayValue(value: unknown) {
    return Array.isArray(value) ? value : [];
  }

  private dateOrNull(value: unknown) {
    if (value === undefined || value === null || value === "") return null;
    if (value instanceof Date) return value.toISOString();
    return String(value).slice(0, 40);
  }

  private vestingFinalRecommendation(input: {
    sourcesUsed: any[];
    riskFlags: string[];
    hasProposedData: boolean;
    useOfficialSources: boolean;
  }) {
    if (input.useOfficialSources && !this.hasSufficientOfficialEvidence(input.sourcesUsed)) return "needs_more_sources";
    if (input.riskFlags.length) return "approve_with_edits";
    if (input.hasProposedData) return "approve_proposed";
    return "approve_current";
  }

  private hasSufficientOfficialEvidence(sources: any[]) {
    return sources.some((source) =>
      source?.officialLikelihood === "high" &&
      source?.sourceType !== "third_party"
    );
  }

  private vestingComparison(currentData: any, proposedData: any, sourcesUsed: any[], saleIdAnalysis: any) {
    const hasProposedData =
      (proposedData.tokenAllocations || []).length > 0 ||
      (proposedData.vestingSchedules || []).length > 0 ||
      (proposedData.unlockEvents || []).length > 0;
    const saleWarnings = (saleIdAnalysis.warnings || []).length;
    return [
      {
        field: "vesting_records",
        currentValue: {
          allocations: (currentData.tokenAllocations || []).length,
          vestingSchedules: (currentData.vestingSchedules || []).length,
          unlockEvents: (currentData.unlockEvents || []).length,
        },
        proposedValue: {
          allocations: (proposedData.tokenAllocations || []).length,
          vestingSchedules: (proposedData.vestingSchedules || []).length,
          unlockEvents: (proposedData.unlockEvents || []).length,
        },
        decision: hasProposedData ? "accept_proposed" : "keep_current",
        confidence: hasProposedData ? 0.62 : 0.78,
        reason: hasProposedData ? "Proposed/review vesting records exist and should be checked against sources." : "No proposed vesting records were found.",
      },
      {
        field: "saleId_consistency",
        currentValue: saleIdAnalysis.saleIdGroups?.length || 0,
        proposedValue: saleIdAnalysis.recommendations?.length || 0,
        decision: saleWarnings ? "edit_proposed" : "keep_current",
        confidence: saleWarnings ? 0.7 : 0.86,
        reason: saleWarnings ? "saleId warnings require review before approval." : "No saleId consistency warnings were found in sampled context.",
      },
      {
        field: "official_sources",
        currentValue: sourcesUsed.length,
        proposedValue: sourcesUsed.map((source: any) => source.url).slice(0, 5),
        decision: sourcesUsed.length ? "keep_current" : "needs_more_sources",
        confidence: sourcesUsed.length ? 0.74 : 0.4,
        reason: sourcesUsed.length ? "Stored source links are available for evidence review." : "No official source evidence was available from stored links.",
      },
    ];
  }

  private async buildOfficialSourceContext(input: Record<string, unknown>, limit: number) {
    const resolved = await this.resolveProject(input);
    if (!resolved.canonicalProjectId) {
      return {
        project: {},
        links: [],
        recommendedSearchQueries: [],
        warnings: ["canonicalProjectId is required or could not be resolved for source link discovery."],
      };
    }

    const canonicalProjectId = resolved.canonicalProjectId as Types.ObjectId;
    const [project, sourceContext, marketContext] = await Promise.all([
      this.findById(this.canonicalProjectModel, canonicalProjectId, PROJECT_FIELDS),
      this.getSourceContextData(canonicalProjectId, limit),
      this.getMarketContextData(resolved, limit),
    ]);
    const officialDomains = this.officialDomainsFromSourceContext(project, sourceContext, marketContext);
    const links = this.sourceLinksFromContext(project, sourceContext, limit, officialDomains);
    (marketContext.marketProjectReadModels || []).forEach((readModel: any) => {
      this.linksFromObject(readModel?.links).forEach((url) => {
        links.push(this.sourceLinkRecord(url, "fomo_v2", project, "market_project_read_models.links", officialDomains));
      });
      if (readModel?.website) {
        links.push(this.sourceLinkRecord(readModel.website, "fomo_v2", project, "market_project_read_models.website", officialDomains));
      }
    });

    const deduped = this.dedupeSourceLinks(links).slice(0, limit);
    const projectSummary = {
      name: project?.name,
      symbol: project?.symbol,
      slug: project?.slug,
      website: project?.primaryWebsiteDomain || officialDomains[0],
    };
    const recommendedSearchQueries = this.officialSourceSearchQueries(projectSummary, "tokenomics", officialDomains);
    const warnings = [];
    if (input.includeParserLinks !== false) {
      warnings.push("Parser source links are not loaded in this fomo_dev tool; use parser tools for ico/dropstab links.");
    }
    if (!deduped.length) {
      warnings.push("No official/source links were found in fomo_dev records.");
    }

    return {
      project: projectSummary,
      links: deduped,
      recommendedSearchQueries,
      warnings,
    };
  }

  private sourceLinksFromContext(project: any, sourceContext: any, limit: number, officialDomains: string[] = []) {
    const links: any[] = [];
    if (project?.primaryWebsiteDomain) {
      links.push(this.sourceLinkRecord(`https://${project.primaryWebsiteDomain}`, "fomo_v2", project, "canonical_projects.primaryWebsiteDomain", officialDomains));
    }
    (sourceContext.canonicalProjectSources || sourceContext.projectSources || []).forEach((source: any) => {
      if (source?.sourceUrl) links.push(this.sourceLinkRecord(source.sourceUrl, "fomo_v2", project, "canonical_project_sources.sourceUrl", officialDomains));
    });
    (sourceContext.sourceEntities || []).forEach((source: any) => {
      if (source?.sourceUrl) links.push(this.sourceLinkRecord(source.sourceUrl, "fomo_v2", project, "source_entities.sourceUrl", officialDomains));
      if (source?.websiteDomain) links.push(this.sourceLinkRecord(`https://${source.websiteDomain}`, "fomo_v2", project, "source_entities.websiteDomain", officialDomains));
    });
    (sourceContext.projectDomainSources || []).forEach((source: any) => {
      if (source?.url) links.push(this.sourceLinkRecord(source.url, "fomo_v2", project, "project_domain_sources.url", officialDomains));
      if (source?.website) links.push(this.sourceLinkRecord(source.website, "fomo_v2", project, "project_domain_sources.website", officialDomains));
    });
    return this.dedupeSourceLinks(links).slice(0, limit);
  }

  private sourceLinkRecord(url: string, source: "fomo_v2" | "parser_db" | "manual", project: any, reasonPath: string, officialDomains: string[] = []) {
    const normalizedUrl = this.normalizeHttpUrl(url);
    const projectHost = this.hostFromDomainOrUrl(project?.primaryWebsiteDomain || project?.website);
    const host = this.hostFromDomainOrUrl(normalizedUrl);
    const type = this.classifySourceUrl(normalizedUrl);
    const trustedHost = [projectHost, ...officialDomains].filter(Boolean).some((domain) =>
      host === domain || host.endsWith(`.${domain}`)
    );
    const officialLikelihood =
      type === "third_party"
        ? "low"
        : trustedHost
        ? "high"
        : ["docs", "blog", "whitepaper", "tokenomics", "github"].includes(type)
          ? "medium"
          : "low";

    return {
      url: normalizedUrl,
      type,
      source,
      officialLikelihood,
      reason: officialLikelihood === "high"
        ? `Host matches project website (${reasonPath}).`
        : `Stored source link from ${reasonPath}. Verify against official project channels before write approval.`,
    };
  }

  private officialDomainsFromSourceContext(project: any, sourceContext: any, marketContext: any) {
    const domains = new Set<string>();
    const add = (value: unknown) => {
      const url = this.normalizeHttpUrl(value);
      const type = this.classifySourceUrl(url);
      const host = this.hostFromDomainOrUrl(url);
      if (!host || type === "third_party") return;
      if (type === "website" || type === "docs" || type === "blog") {
        domains.add(this.rootOfficialDomain(host));
      }
    };

    if (project?.primaryWebsiteDomain) domains.add(this.rootOfficialDomain(project.primaryWebsiteDomain));
    (sourceContext.canonicalProjectSources || sourceContext.projectSources || []).forEach((source: any) => add(source?.sourceUrl));
    (sourceContext.sourceEntities || []).forEach((source: any) => {
      add(source?.sourceUrl);
      add(source?.websiteDomain);
    });
    (sourceContext.projectDomainSources || []).forEach((source: any) => {
      add(source?.url);
      add(source?.website);
    });
    (marketContext.marketProjectReadModels || []).forEach((readModel: any) => {
      add(readModel?.website);
      this.linksFromObject(readModel?.links).forEach(add);
    });

    return Array.from(domains).slice(0, 10);
  }

  private rootOfficialDomain(value: unknown) {
    const host = this.hostFromDomainOrUrl(value);
    if (!host) return "";
    return host.replace(/^(docs|blog|www)\./, "");
  }

  private normalizeHttpUrl(value: unknown) {
    const text = String(value || "").trim();
    if (!text) return "";
    if (/^https?:\/\//i.test(text)) return text;
    return `https://${text.replace(/^\/+/, "")}`;
  }

  private dedupeSourceLinks(links: any[]) {
    const seen = new Set<string>();
    return links.filter((link) => {
      if (!link.url) return false;
      const key = link.url.toLowerCase().replace(/\/+$/, "");
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });
  }

  private linksFromObject(value: unknown) {
    if (!value || typeof value !== "object") return [];
    return Object.values(value as Record<string, unknown>)
      .flatMap((item) => Array.isArray(item) ? item : [item])
      .filter((item) => typeof item === "string")
      .map((item) => String(item))
      .filter(Boolean)
      .slice(0, 30);
  }

  private officialSourceSearchQueries(
    project: Record<string, any>,
    intent: string,
    trustedDomains: string[] = []
  ) {
    const name = this.safeString(project.name, 160);
    const symbol = this.safeString(project.symbol, 40);
    const website = this.safeString(project.website, 240);
    const officialDomain = this.hostFromDomainOrUrl(website);
    const base = [name, symbol ? `${name} ${symbol}` : ""].filter(Boolean);
    const intentQueries: Record<string, string[]> = {
      tokenomics: ["tokenomics vesting official", "token allocation vesting docs", "whitepaper tokenomics"],
      vesting: ["tokenomics vesting official", "vesting schedule official", "token allocation vesting docs"],
      "unlock schedule": ["token unlock schedule official", "vesting schedule official", "tokenomics unlocks"],
      allocation: ["token allocation vesting docs", "tokenomics allocation official", "whitepaper allocation"],
      whitepaper: ["whitepaper tokenomics", "whitepaper vesting", "tokenomics official"],
      docs: ["docs tokenomics", "official docs vesting", "developer docs tokenomics"],
    };
    const intents = intentQueries[intent] || intentQueries.tokenomics;
    const queries = base.flatMap((prefix) => intents.map((suffix) => `${prefix} ${suffix}`));
    if (officialDomain) {
      queries.unshift(
        `site:${officialDomain} tokenomics`,
        `site:${officialDomain} vesting`,
        `site:${officialDomain} unlock schedule`,
        `site:${officialDomain} allocation`,
        `site:docs.${officialDomain} tokenomics`
      );
    }
    trustedDomains.forEach((domain) => {
      if (domain) {
        queries.unshift(`site:${domain} ${intent}`, `site:${domain} tokenomics vesting`);
      }
    });
    return Array.from(new Set(queries)).slice(0, 10);
  }

  private webSearchResult(input: {
    providerStatus: any;
    queries: string[];
    executedQueries?: string[];
    results: any[];
    error?: string;
    errorCode?: string;
    warnings: string[];
    limit: number;
  }) {
    const officialHighCount = input.results.filter((item) => item.officialLikelihood === "high").length;
    const officialMediumCount = input.results.filter((item) => item.officialLikelihood === "medium").length;
    const thirdPartyCount = input.results.filter((item) => item.sourceType === "third_party").length;
    return this.result(
      "fomoWebSearchOfficialSources",
      {
        provider: input.providerStatus.provider || "tavily",
        status: input.error ? "error" : "done",
        queries: input.queries.slice(0, 10),
        executedQueries: (input.executedQueries || []).slice(0, 10),
        queryCount: (input.executedQueries || []).length,
        resultCount: input.results.length,
        officialHighCount,
        officialMediumCount,
        thirdPartyCount,
        results: input.results,
        summary: {
          provider: input.providerStatus.provider || "tavily",
          queryCount: (input.executedQueries || []).length,
          resultCount: input.results.length,
          officialHighCount,
          officialMediumCount,
          thirdPartyCount,
          warnings: input.warnings,
        },
        error: input.error,
        errorCode: input.errorCode,
        warnings: input.warnings,
      },
      { limit: input.limit }
    );
  }

  private classifyWebSearchResult(result: any, context: {
    projectName: string;
    symbol?: string;
    website?: string;
    trustedDomains: string[];
  }) {
    const url = this.canonicalWebUrl(result?.url);
    const domain = this.hostFromDomainOrUrl(url);
    const officialDomain = this.hostFromDomainOrUrl(context.website);
    const title = this.safeString(result?.title, 240);
    const snippet = this.safeString(result?.content || result?.snippet, 500);
    const sourceType = this.webSearchSourceType(url, domain);
    const trusted = context.trustedDomains.some((trustedDomain) =>
      domain === trustedDomain || domain.endsWith(`.${trustedDomain}`)
    );
    const officialMatch = officialDomain &&
      (domain === officialDomain || domain.endsWith(`.${officialDomain}`));
    const text = `${title} ${snippet} ${url}`.toLowerCase();
    const mentionsProject = context.projectName
      ? text.includes(context.projectName.toLowerCase())
      : false;
    const mediumHost =
      /(^|\.)medium\.com$|(^|\.)substack\.com$|(^|\.)gitbook\.io$|(^|\.)notion\.site$|(^|\.)github\.io$|(^|\.)github\.com$/i.test(domain);
    const thirdParty = sourceType === "third_party";
    const officialLikelihood = trusted || officialMatch
      ? "high"
      : thirdParty
        ? "low"
        : mediumHost && mentionsProject
          ? "medium"
          : ["docs", "blog", "whitepaper"].includes(sourceType)
            ? "medium"
            : "low";
    const reason = trusted
      ? "Domain is in trustedDomains."
      : officialMatch
        ? "Domain matches the official website or its subdomain."
        : thirdParty
          ? "Known third-party crypto data domain; use as supporting evidence only."
          : officialLikelihood === "medium"
            ? "Likely source channel, but not proven as official from DB/website domain."
            : "Domain is not linked to official website or trusted domains.";

    return {
      title,
      url,
      domain,
      snippet,
      sourceType,
      officialLikelihood,
      reason,
      score: Number(result?.score || 0),
    };
  }

  private webSearchSourceType(url: string, domain: string) {
    const text = `${domain} ${url}`.toLowerCase();
    if (/coingecko|coinmarketcap|dropstab|cryptorank|icodrops|messari|binance|kucoin|gate\.io|okx|bybit/.test(text)) return "third_party";
    if (/whitepaper|white-paper|litepaper/.test(text)) return "whitepaper";
    if (/docs|gitbook|developer/.test(text) || /^docs\./.test(domain)) return "docs";
    if (/blog|news|medium|substack/.test(text) || /^blog\./.test(domain)) return "blog";
    if (!domain) return "unknown";
    return "official";
  }

  private rankWebSearchResults(results: any[], officialPriority: boolean) {
    const likelihoodScore: Record<string, number> = { high: 3, medium: 2, low: 1 };
    const sourceTypeScore: Record<string, number> = {
      docs: 5,
      whitepaper: 4,
      official: 3,
      blog: 2,
      unknown: 1,
      third_party: 0,
    };
    return results.sort((left, right) => {
      if (officialPriority) {
        const officialDiff =
          (likelihoodScore[right.officialLikelihood] || 0) -
          (likelihoodScore[left.officialLikelihood] || 0);
        if (officialDiff) return officialDiff;
      }
      const typeDiff =
        (sourceTypeScore[right.sourceType] || 0) -
        (sourceTypeScore[left.sourceType] || 0);
      if (typeDiff) return typeDiff;
      return Number(right.score || 0) - Number(left.score || 0);
    });
  }

  private dedupeWebSearchResults(results: any[]) {
    const seen = new Set<string>();
    return results.filter((item) => {
      if (!item.url) return false;
      const key = this.canonicalWebUrl(item.url);
      const pathKey = `${item.domain}:${new URL(key).pathname.replace(/\/+$/, "")}`;
      if (seen.has(key) || seen.has(pathKey)) return false;
      seen.add(key);
      seen.add(pathKey);
      return true;
    });
  }

  private canonicalWebUrl(value: unknown) {
    const text = this.normalizeHttpUrl(value);
    try {
      const url = new URL(text);
      [
        "utm_source",
        "utm_medium",
        "utm_campaign",
        "utm_term",
        "utm_content",
        "ref",
      ].forEach((key) => url.searchParams.delete(key));
      url.hash = "";
      url.hostname = url.hostname.replace(/^www\./, "").toLowerCase();
      return url.toString().replace(/\/+$/, "");
    } catch (error) {
      return text;
    }
  }

  private classifySourceUrl(value: unknown) {
    const text = String(value || "").toLowerCase();
    if (/coingecko|coinmarketcap|dropstab|cryptorank|icodrops|messari|binance|tokenomist\.ai/.test(text)) return "third_party";
    if (/whitepaper|white-paper|litepaper/.test(text)) return "whitepaper";
    if (/docs|gitbook|developer/.test(text)) return "docs";
    if (/blog|news|medium|substack/.test(text)) return "blog";
    if (/tokenomics|allocation|vesting|unlock/.test(text)) return "tokenomics";
    if (/github\.com/.test(text)) return "github";
    if (/twitter\.com|x\.com/.test(text)) return "twitter";
    if (/discord\.gg|discord\.com/.test(text)) return "discord";
    return "website";
  }

  private validateSafeFetchUrl(value: string) {
    if (!value) {
      return { ok: false, error: "url is required", errorCode: "WEB_FETCH_URL_REQUIRED" } as const;
    }
    let parsed: URL;
    try {
      parsed = new URL(value);
    } catch (error) {
      return { ok: false, error: "Invalid URL", errorCode: "WEB_FETCH_INVALID_URL" } as const;
    }
    if (!["http:", "https:"].includes(parsed.protocol)) {
      return { ok: false, error: "Only http/https URLs are allowed", errorCode: "WEB_FETCH_PROTOCOL_BLOCKED" } as const;
    }
    const host = parsed.hostname.toLowerCase();
    if (this.isPrivateOrLocalHost(host)) {
      return { ok: false, error: "Private, local, or metadata URLs are blocked", errorCode: "WEB_FETCH_PRIVATE_URL_BLOCKED" } as const;
    }
    return { ok: true, url: parsed.toString() } as const;
  }

  private isPrivateOrLocalHost(host: string) {
    if (!host) return true;
    if (host === "localhost" || host.endsWith(".localhost")) return true;
    if (host === "::1" || host === "[::1]" || host === "0:0:0:0:0:0:0:1") return true;
    if (host === "metadata.google.internal") return true;
    if (/^0\./.test(host) || /^127\./.test(host) || /^10\./.test(host) || /^192\.168\./.test(host) || /^169\.254\./.test(host)) return true;
    const match172 = host.match(/^172\.(\d+)\./);
    if (match172) {
      const octet = Number(match172[1]);
      if (octet >= 16 && octet <= 31) return true;
    }
    if (/^100\.(6[4-9]|[7-9]\d|1[01]\d|12[0-7])\./.test(host)) return true;
    return false;
  }

  private hostFromDomainOrUrl(value: unknown) {
    const text = String(value || "").trim();
    if (!text) return "";
    try {
      const url = /^https?:\/\//i.test(text) ? new URL(text) : new URL(`https://${text}`);
      return url.hostname.replace(/^www\./, "").toLowerCase();
    } catch (error) {
      return text.replace(/^www\./, "").toLowerCase();
    }
  }

  private firstStringByPaths(source: any, paths: string[]) {
    for (const path of paths) {
      const value = this.valueAtPath(source, path);
      if (value !== undefined && value !== null && value !== "") return String(value);
    }
    return undefined;
  }

  private valueAtPath(source: any, path: string): unknown {
    return String(path || "")
      .split(".")
      .filter(Boolean)
      .reduce((current, key) => (current && typeof current === "object" ? current[key] : undefined), source);
  }

  private async getMarketContextData(resolved: Record<string, any>, limit: number) {
    const match = this.projectOrAssetMatch(resolved);
    const [readModels, projectAssetLinks, marketAssets] = await Promise.all([
      match
        ? this.findMany(this.marketReadModel, match, MARKET_READ_MODEL_FIELDS, { rank: 1, _id: 1 }, limit)
        : [],
      resolved.canonicalProjectId
        ? this.findMany(this.projectAssetLinkModel, { canonicalProjectId: resolved.canonicalProjectId }, PROJECT_ASSET_LINK_FIELDS, { verified: -1, _id: 1 }, limit)
        : resolved.marketAssetId
          ? this.findMany(this.projectAssetLinkModel, { marketAssetId: resolved.marketAssetId }, PROJECT_ASSET_LINK_FIELDS, { verified: -1, _id: 1 }, limit)
          : [],
      resolved.marketAssetId
        ? this.findMany(this.marketAssetModel, { _id: resolved.marketAssetId }, MARKET_ASSET_FIELDS, { _id: 1 }, 1)
        : [],
    ]);

    const marketAssetIds = this.uniqueIds([
      resolved.marketAssetId,
      ...readModels.map((item: any) => item.marketAssetId),
      ...projectAssetLinks.map((item: any) => item.marketAssetId),
    ]);
    const historyMatch = marketAssetIds.length
      ? { marketAssetId: { $in: marketAssetIds } }
      : resolved.canonicalProjectId
        ? { canonicalProjectId: resolved.canonicalProjectId }
        : null;
    const latestHistory = historyMatch
      ? await this.findMany(this.marketHistoryModel, historyMatch, MARKET_HISTORY_FIELDS, { bucketTimestamp: -1, timestamp: -1, _id: -1 }, limit)
      : [];

    return {
      marketProjectReadModels: readModels,
      projectAssetLinks,
      marketAssets,
      latestMarketHistoryPoints: latestHistory,
    };
  }

  private async getSourceContextData(canonicalProjectId: Types.ObjectId, limit: number) {
    const [sources, sourceEntities, domainSources, reviewConflicts] = await Promise.all([
      this.findMany(this.canonicalProjectSourceModel, { canonicalProjectId }, SOURCE_FIELDS, { verified: -1, updatedAt: -1, _id: -1 }, limit),
      this.findMany(this.sourceEntityModel, { canonicalProjectId }, SOURCE_ENTITY_FIELDS, { lastSeenAt: -1, _id: -1 }, limit),
      this.findMany(this.projectDomainSourceModel, { canonicalProjectId }, "_id canonicalProjectId domain selectedSourceType status reason createdAt updatedAt", { updatedAt: -1, _id: -1 }, limit),
      this.findMany(
        this.reviewBatchModel,
        { canonicalProjectId, reason: { $in: ["source_conflict", "SOURCE_CONFLICT"] } },
        REVIEW_BATCH_FIELDS,
        { lastSeenAt: -1, _id: -1 },
        limit
      ),
    ]);

    const sourceSnapshotIds = this.uniqueIds([
      ...sources.map((item: any) => item.sourceSnapshotId),
      ...sourceEntities.map((item: any) => item.latestSourceSnapshotId),
    ]);
    const sourceSnapshots = sourceSnapshotIds.length
      ? await this.findMany(this.sourceSnapshotModel, { _id: { $in: sourceSnapshotIds } }, SOURCE_SNAPSHOT_FIELDS, { capturedAt: -1, _id: -1 }, limit)
      : [];
    const sourceEvidenceSummary = await this.findById(
      this.canonicalProjectModel,
      canonicalProjectId,
      "_id sourceEvidence originSourceType identitySource identityConfidence"
    );

    return {
      canonicalProjectSources: sources,
      sourceEntities,
      sourceSnapshots,
      sourceEvidenceSummary,
      projectDomainSources: domainSources,
      sourceConflicts: reviewConflicts,
    };
  }

  private async getFundingContextData(canonicalProjectId: Types.ObjectId, limit: number) {
    const fundingRounds = await this.findMany(
      this.fundingRoundModel,
      { canonicalProjectId },
      FUNDING_ROUND_FIELDS,
      { announcedDate: -1, date: -1, _id: -1 },
      limit
    );
    const roundIds = this.uniqueIds(fundingRounds.map((item: any) => item._id));
    const participants = roundIds.length
      ? await this.findMany(
          this.fundingParticipantModel,
          { fundingRoundId: { $in: roundIds } },
          FUNDING_PARTICIPANT_FIELDS,
          { isLead: -1, backerName: 1, _id: 1 },
          limit
        )
      : [];
    const backerIds = this.uniqueIds(participants.map((item: any) => item.backerId));
    const linkedBackers = backerIds.length
      ? await this.findMany(this.backerModel, { _id: { $in: backerIds } }, BACKER_FIELDS, { name: 1 }, limit)
      : [];
    const unresolvedBackers = await this.findMany(
      this.importCandidateModel,
      {
        status: "open",
        entityType: { $regex: /backer|investor/i },
      },
      IMPORT_CANDIDATE_FIELDS,
      { lastSeenAt: -1, _id: -1 },
      Math.min(10, limit)
    );

    return {
      fundingRounds,
      fundingRoundParticipants: participants,
      linkedBackers,
      unresolvedBackers,
    };
  }

  private async getTokenomicsContextData(canonicalProjectId: Types.ObjectId, limit: number) {
    const [tokenAllocations, vestingRounds, vestingSchedules, vestingSummaries, unlockEvents] =
      await Promise.all([
        this.findMany(this.tokenAllocationModel, { canonicalProjectId }, TOKEN_ALLOCATION_FIELDS, { allocationPercent: -1, _id: 1 }, limit),
        this.findMany(this.vestingRoundModel, { canonicalProjectId }, VESTING_ROUND_FIELDS, { allocationPercent: -1, _id: 1 }, limit),
        this.findMany(this.vestingScheduleModel, { canonicalProjectId }, VESTING_SCHEDULE_FIELDS, { startDate: 1, _id: 1 }, limit),
        this.findMany(this.vestingSummaryModel, { canonicalProjectId }, VESTING_SUMMARY_FIELDS, { calculatedAt: -1, _id: -1 }, limit),
        this.findMany(this.unlockEventModel, { canonicalProjectId }, UNLOCK_EVENT_FIELDS, { unlockDate: 1, _id: 1 }, limit),
      ]);

    return {
      tokenAllocations,
      tokenAllocationSnapshots: {
        configured: false,
        note: "No token_allocation_snapshots Mongoose model found in current backend.",
      },
      vestingRounds,
      vestingSchedules,
      vestingSummaries,
      vestingEvents: {
        configured: false,
        note: "No separate vesting_events Mongoose model found; using vesting schedules/summaries plus unlock events.",
      },
      unlockEvents,
    };
  }

  private async resolveProject(input: Record<string, unknown>) {
    const canonicalProjectId = this.objectId(input.canonicalProjectId || input.projectId);
    const marketAssetId = this.objectId(input.marketAssetId);

    if (canonicalProjectId) {
      const link = await this.findOne(this.projectAssetLinkModel, { canonicalProjectId }, PROJECT_ASSET_LINK_FIELDS, { verified: -1, _id: 1 });
      return { canonicalProjectId, marketAssetId: marketAssetId || link?.marketAssetId, resolvedBy: "canonicalProjectId" };
    }

    if (marketAssetId) {
      const [link, readModel] = await Promise.all([
        this.findOne(this.projectAssetLinkModel, { marketAssetId }, PROJECT_ASSET_LINK_FIELDS, { verified: -1, _id: 1 }),
        this.findOne(this.marketReadModel, { marketAssetId }, "_id canonicalProjectId marketAssetId name slug symbol", { _id: 1 }),
      ]);

      return {
        canonicalProjectId: link?.canonicalProjectId || readModel?.canonicalProjectId,
        marketAssetId,
        resolvedBy: "marketAssetId",
      };
    }

    const query = String(input.slug || input.query || "").trim();
    if (!query) return { resolvedBy: "none" };

    const candidates = await this.findProjectCandidates(query, 1);
    const first = candidates[0] || {};

    return {
      canonicalProjectId: this.objectId(first.canonicalProjectId),
      marketAssetId: this.objectId(first.marketAssetId),
      resolvedBy: first.matchedBy || "query",
      query,
    };
  }

  private async resolveBacker(input: Record<string, unknown>) {
    const backerId = this.objectId(input.backerId || input.id);
    if (backerId) return this.findById(this.backerModel, backerId, BACKER_FIELDS);

    const query = String(input.query || "").trim();
    if (!query) return null;

    const normalized = this.normalizeName(query);
    const regex = this.regex(query);

    return this.findOne(
      this.backerModel,
      {
        $or: [
          { slug: query },
          { normalizedName: normalized },
          { name: regex },
          { sourceId: query },
        ],
      },
      BACKER_FIELDS,
      { updatedAt: -1, _id: 1 }
    );
  }

  private async findProjectCandidates(query: string, limit: number) {
    const normalized = this.normalizeName(query);
    const normalizedSymbol = query.toUpperCase();
    const regex = this.regex(query);
    const objectId = this.objectId(query);
    const candidates: Record<string, any>[] = [];

    if (objectId) {
      const [project, asset, link] = await Promise.all([
        this.findById(this.canonicalProjectModel, objectId, PROJECT_FIELDS),
        this.findById(this.marketAssetModel, objectId, MARKET_ASSET_FIELDS),
        this.findOne(this.projectAssetLinkModel, { marketAssetId: objectId }, PROJECT_ASSET_LINK_FIELDS, { verified: -1, _id: 1 }),
      ]);

      if (project) candidates.push(this.projectCandidate(project, "canonical_projects._id"));
      if (asset) candidates.push(this.assetCandidate(asset, link, "market_assets._id"));
    }

    const [projects, assets, sources, entities, readModels] = await Promise.all([
      this.findMany(
        this.canonicalProjectModel,
        {
          $or: [
            { slug: query },
            { normalizedName: normalized },
            { normalizedSymbol },
            { name: regex },
            { symbol: regex },
            { "providerIds.coingeckoId": query },
            { "providerIds.coinMarketCapId": query },
            { "aliases.normalizedValue": normalized },
          ],
        },
        PROJECT_FIELDS,
        { hasMarketData: -1, fomoScore: -1, _id: 1 },
        limit
      ),
      this.findMany(
        this.marketAssetModel,
        {
          $or: [
            { slug: query },
            { normalizedName: normalized },
            { normalizedSymbol },
            { name: regex },
            { symbol: regex },
            { "providerIds.coingeckoId": query },
            { "providerIds.coinMarketCapId": query },
          ],
        },
        MARKET_ASSET_FIELDS,
        { lastSeenAt: -1, _id: 1 },
        limit
      ),
      this.findMany(
        this.canonicalProjectSourceModel,
        { $or: [{ sourceId: query }, { sourceSlug: query }, { sourceSlug: regex }, { sourceUrl: regex }] },
        SOURCE_FIELDS,
        { verified: -1, updatedAt: -1, _id: -1 },
        limit
      ),
      this.findMany(
        this.sourceEntityModel,
        { $or: [{ sourceId: query }, { sourceSlug: query }, { sourceSlug: regex }, { sourceUrl: regex }, { entityKey: query }] },
        SOURCE_ENTITY_FIELDS,
        { lastSeenAt: -1, _id: -1 },
        limit
      ),
      this.findMany(
        this.marketReadModel,
        { $or: [{ slug: query }, { name: regex }, { symbol: regex }, { legacyRouteId: query }] },
        MARKET_READ_MODEL_FIELDS,
        { rank: 1, _id: 1 },
        limit
      ),
    ]);

    projects.forEach((project: any) => candidates.push(this.projectCandidate(project, "canonical_projects")));

    const assetIds = this.uniqueIds(assets.map((item: any) => item._id));
    const assetLinks = assetIds.length
      ? await this.findMany(this.projectAssetLinkModel, { marketAssetId: { $in: assetIds } }, PROJECT_ASSET_LINK_FIELDS, { verified: -1, _id: 1 }, limit)
      : [];
    assets.forEach((asset: any) => {
      const link = assetLinks.find((item: any) => String(item.marketAssetId) === String(asset._id));
      candidates.push(this.assetCandidate(asset, link, "market_assets"));
    });

    readModels.forEach((item: any) => {
      candidates.push({
        canonicalProjectId: this.idString(item.canonicalProjectId),
        marketAssetId: this.idString(item.marketAssetId),
        name: item.name,
        slug: item.slug,
        symbol: item.symbol,
        status: item.status,
        rank: item.rank,
        tier: item.tier,
        matchedBy: "market_project_read_models",
      });
    });
    sources.forEach((source: any) => {
      candidates.push({
        canonicalProjectId: this.idString(source.canonicalProjectId),
        sourceId: source.sourceId,
        sourceSlug: source.sourceSlug,
        source: source.source,
        status: source.status,
        confidence: source.confidence,
        matchedBy: "canonical_project_sources",
      });
    });
    entities.forEach((entity: any) => {
      candidates.push({
        canonicalProjectId: this.idString(entity.canonicalProjectId),
        sourceEntityId: this.idString(entity._id),
        sourceId: entity.sourceId,
        sourceSlug: entity.sourceSlug,
        source: entity.source,
        resolutionStatus: entity.resolutionStatus,
        matchedBy: "source_entities",
      });
    });

    return this.dedupeCandidates(candidates).slice(0, limit);
  }

  private async findDuplicateCandidates(entityType: string, query: string, limit: number) {
    const normalized = this.normalizeName(query);
    const regex = this.regex(query);
    const normalizedSymbol = query.toUpperCase();

    if (entityType === "canonicalProject") {
      const candidates = await this.findMany(
        this.canonicalProjectModel,
        { $or: [{ normalizedName: normalized }, { slug: query }, { normalizedSymbol }, { name: regex }, { symbol: regex }] },
        PROJECT_FIELDS,
        { hasMarketData: -1, fomoScore: -1, _id: 1 },
        limit
      );
      return { candidates };
    }

    if (entityType === "backer") {
      const candidates = await this.findMany(
        this.backerModel,
        { $or: [{ normalizedName: normalized }, { slug: query }, { name: regex }, { sourceId: query }] },
        BACKER_FIELDS,
        { updatedAt: -1, _id: 1 },
        limit
      );
      return { candidates };
    }

    const candidates = await this.findMany(
      this.sourceEntityModel,
      { $or: [{ sourceSlug: query }, { sourceId: query }, { entityKey: query }, { sourceSlug: regex }, { sourceUrl: regex }] },
      SOURCE_ENTITY_FIELDS,
      { lastSeenAt: -1, _id: -1 },
      limit
    );
    return { candidates };
  }

  private async findDuplicateGroups(entityType: string, limit: number) {
    const model =
      entityType === "canonicalProject"
        ? this.canonicalProjectModel
        : entityType === "backer"
          ? this.backerModel
          : this.sourceEntityModel;
    const field =
      entityType === "sourceEntity"
        ? "sourceSlug"
        : "normalizedName";

    const groups = await model
      .aggregate([
        { $match: { [field]: { $type: "string", $ne: "" } } },
        { $group: { _id: `$${field}`, count: { $sum: 1 }, ids: { $push: "$_id" } } },
        { $match: { count: { $gt: 1 } } },
        { $sort: { count: -1 } },
        { $limit: limit },
      ])
      .option({ maxTimeMS: MAX_TIME_MS });

    return { duplicateGroups: groups };
  }

  private async buildMissingDataDiagnostic(resolved: Record<string, any>, field: string) {
    const canonicalProjectId = resolved.canonicalProjectId;
    const [project, market, sources, funding, tokenomics] = await Promise.all([
      this.findById(this.canonicalProjectModel, canonicalProjectId, PROJECT_FIELDS),
      this.getMarketContextData(resolved, 10),
      this.getSourceContextData(canonicalProjectId, 10),
      this.getFundingContextData(canonicalProjectId, 10),
      this.getTokenomicsContextData(canonicalProjectId, 10),
    ]);

    const checks = {
      logo: {
        exists: Boolean(market.marketProjectReadModels?.some((item: any) => item.logo) || project?.metadata?.logo),
        collectionsChecked: ["canonical_projects", "market_project_read_models", "market_assets", "canonical_project_sources", "source_snapshots.normalizedPreview"],
      },
      marketData: {
        exists: Boolean(project?.hasMarketData || market.marketProjectReadModels?.length || market.latestMarketHistoryPoints?.length),
        collectionsChecked: ["canonical_projects", "market_project_read_models", "market_project_histories", "project_asset_links", "market_assets"],
      },
      fundingRounds: {
        exists: Boolean(funding.fundingRounds?.length),
        collectionsChecked: ["funding_rounds", "funding_round_participants", "backers", "import_candidates"],
      },
      backers: {
        exists: Boolean(funding.linkedBackers?.length || funding.fundingRoundParticipants?.length),
        collectionsChecked: ["funding_round_participants", "backers", "backer_portfolio_holdings", "import_candidates"],
      },
      allocation: {
        exists: Boolean(tokenomics.tokenAllocations?.length),
        collectionsChecked: ["token_allocations", "vesting_rounds", "vesting_summaries"],
      },
      vesting: {
        exists: Boolean(tokenomics.vestingSchedules?.length || tokenomics.vestingSummaries?.length),
        collectionsChecked: ["vesting_schedules", "vesting_summaries", "vesting_rounds"],
      },
      unlocks: {
        exists: Boolean(tokenomics.unlockEvents?.length),
        collectionsChecked: ["unlock_events", "vesting_schedules", "vesting_summaries"],
      },
      sourceLinks: {
        exists: Boolean(sources.canonicalProjectSources?.length || sources.sourceEntities?.length),
        collectionsChecked: ["canonical_project_sources", "source_entities", "project_domain_sources", "review_batches"],
      },
    } as Record<string, { exists: boolean; collectionsChecked: string[] }>;

    const check = checks[field] || { exists: false, collectionsChecked: [] };

    return {
      resolved,
      field,
      whatExists: {
        canonicalProject: Boolean(project),
        marketReadModels: market.marketProjectReadModels?.length || 0,
        marketHistoryPoints: market.latestMarketHistoryPoints?.length || 0,
        sourceLinks: sources.canonicalProjectSources?.length || 0,
        sourceEntities: sources.sourceEntities?.length || 0,
        fundingRounds: funding.fundingRounds?.length || 0,
        backers: funding.linkedBackers?.length || 0,
        tokenAllocations: tokenomics.tokenAllocations?.length || 0,
        vestingSchedules: tokenomics.vestingSchedules?.length || 0,
        unlockEvents: tokenomics.unlockEvents?.length || 0,
      },
      whatIsMissing: check.exists ? [] : [field],
      likelyReason: check.exists
        ? `Field ${field} appears to have data in the read-only context.`
        : this.likelyMissingReason(field),
      collectionsChecked: check.collectionsChecked,
      suggestedSafeNextAction: this.suggestedNextAction(field),
      readOnly: true,
    };
  }

  private likelyMissingReason(field: string) {
    const reasons: Record<string, string> = {
      logo: "Logo is not present in market_project_read_models and may be absent from parser source previews or not materialized yet.",
      marketData: "No active project asset link/read model/history was found, or the market sync has not materialized this project.",
      fundingRounds: "Funding import has no linked rounds for this canonical project, or source mappings are still unresolved.",
      backers: "Funding participants/backers are not linked yet, or unresolved source backers still need review.",
      allocation: "Token allocation import has no normalized allocations for this canonical project.",
      vesting: "Vesting schedules/summaries are missing or not linked to this canonical project.",
      unlocks: "Unlock events are missing, not imported, or not linked through vesting schedules/rounds.",
      sourceLinks: "No canonical source links or source entities are linked to this project.",
    };

    return reasons[field] || "Relevant FOMO v2 crypto-domain records were not found in the checked collections.";
  }

  private suggestedNextAction(field: string) {
    const actions: Record<string, string> = {
      logo: "Inspect source context and market read model; if source has logo, run the existing safe materialization/import flow outside this chat.",
      marketData: "Inspect project asset links and market assets; resolve mapping before running market read-model materialization outside this chat.",
      fundingRounds: "Inspect funding context and open import candidates; resolve mappings outside this read-only chat.",
      backers: "Inspect unresolved backer mappings and funding participants; resolve mappings outside this read-only chat.",
      allocation: "Inspect tokenomics source context; run or repair allocation import outside this chat if source data exists.",
      vesting: "Inspect vesting schedules and source snapshots; repair vesting import outside this chat if needed.",
      unlocks: "Inspect unlock events and vesting links; run unlock import/apply flow outside this chat if data exists.",
      sourceLinks: "Inspect source entities and review cases; resolve source link conflicts outside this read-only chat.",
    };

    return actions[field] || "Use the relevant read-only tool to inspect records, then perform any changes through approved backend flows outside this chat.";
  }

  private projectCandidate(project: any, matchedBy: string) {
    return {
      canonicalProjectId: this.idString(project._id),
      name: project.name,
      slug: project.slug,
      symbol: project.symbol,
      status: project.status,
      hasMarketData: project.hasMarketData,
      fomoScore: project.fomoScore,
      rating: project.rating,
      matchedBy,
    };
  }

  private assetCandidate(asset: any, link: any, matchedBy: string) {
    return {
      canonicalProjectId: this.idString(link?.canonicalProjectId),
      marketAssetId: this.idString(asset?._id),
      name: asset?.name,
      slug: asset?.slug,
      symbol: asset?.symbol,
      status: asset?.status,
      relationType: link?.relationType,
      linkStatus: link?.status,
      matchedBy,
    };
  }

  private dedupeCandidates(candidates: Record<string, any>[]) {
    const seen = new Set<string>();
    return candidates.filter((candidate) => {
      const key =
        candidate.canonicalProjectId ||
        candidate.marketAssetId ||
        candidate.sourceEntityId ||
        `${candidate.name}:${candidate.symbol}:${candidate.matchedBy}`;
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });
  }

  private projectOrAssetMatch(resolved: Record<string, any>) {
    const conditions = [];
    if (resolved.canonicalProjectId) conditions.push({ canonicalProjectId: resolved.canonicalProjectId });
    if (resolved.marketAssetId) conditions.push({ marketAssetId: resolved.marketAssetId });
    if (!conditions.length) return null;
    return conditions.length === 1 ? conditions[0] : { $or: conditions };
  }

  private async findById(model: Model<any>, id: Types.ObjectId, fields: string) {
    return model.findById(id).select(fields).maxTimeMS(MAX_TIME_MS).lean();
  }

  private async findOne(model: Model<any>, match: Record<string, unknown>, fields: string, sort?: Record<string, 1 | -1>) {
    return model.findOne(match).select(fields).sort(sort || {}).maxTimeMS(MAX_TIME_MS).lean();
  }

  private async findMany(
    model: Model<any>,
    match: Record<string, unknown>,
    fields: string,
    sort: Record<string, 1 | -1>,
    limit: number
  ) {
    return model
      .find(match)
      .select(fields)
      .sort(sort)
      .limit(limit)
      .maxTimeMS(MAX_TIME_MS)
      .lean();
  }

  private async count(model: Model<any>, match: Record<string, unknown> = {}) {
    return model.countDocuments(match).maxTimeMS(MAX_TIME_MS);
  }

  private async groupCount(model: Model<any>, field: string) {
    return model
      .aggregate([
        { $group: { _id: `$${field}`, count: { $sum: 1 } } },
        { $sort: { count: -1 } },
        { $limit: 20 },
      ])
      .option({ maxTimeMS: MAX_TIME_MS });
  }

  private objectId(value: unknown): Types.ObjectId | null {
    const stringValue = String(value || "").trim();
    if (!mongoose.Types.ObjectId.isValid(stringValue)) return null;
    return new mongoose.Types.ObjectId(stringValue);
  }

  private uniqueIds(values: unknown[]) {
    const ids = values
      .map((value) => this.objectId(value))
      .filter(Boolean) as Types.ObjectId[];
    const seen = new Set<string>();

    return ids.filter((id) => {
      const key = String(id);
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });
  }

  private idString(value: unknown) {
    return value ? String(value) : undefined;
  }

  private normalizeName(value: string) {
    return value.trim().toLowerCase().replace(/\s+/g, " ");
  }

  private regex(value: string) {
    return new RegExp(this.escapeRegExp(value.trim()).slice(0, 80), "i");
  }

  private escapeRegExp(value: string) {
    return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  }

  private limit(value: unknown, fallback: number) {
    const parsed = Number(value);
    if (!Number.isFinite(parsed) || parsed <= 0) return fallback;
    return Math.min(Math.floor(parsed), MAX_LIMIT);
  }

  private result(
    tool: string,
    data: Record<string, unknown>,
    limits: Record<string, unknown> = {}
  ): FomoV2AiToolResult {
    const collectionsRead =
      (limits.collectionsRead as string[] | undefined) ||
      this.collectionsForTool(tool);

    return {
      tool,
      generatedAt: new Date().toISOString(),
      data: {
        collectionsRead,
        ...data,
      },
      limits: {
        maxTimeMS: MAX_TIME_MS,
        defaultLimit: DEFAULT_LIMIT,
        maxLimit: MAX_LIMIT,
        dbTarget: this.adminAiConfig.getDbName(),
        ...limits,
      },
    };
  }

  private tool(name: FomoV2AiToolName, description: string, parameters: Record<string, unknown>) {
    return {
      type: "function",
      name,
      description,
      parameters,
      strict: false,
    };
  }

  private collectionsForTool(tool: string) {
    const mainCollections = ADMIN_AI_COLLECTION_REGISTRY
      .filter((item) => item.dbTarget === "mainV2Db")
      .map((item) => item.collectionName);

    const map: Record<string, string[]> = {
      fomoV2CollectionStats: mainCollections,
      fomoV2FindProject: [
        "canonical_projects",
        "market_assets",
        "project_asset_links",
        "canonical_project_sources",
        "source_entities",
        "market_project_read_models",
      ],
      fomoV2GetProjectFullContext: mainCollections,
      fomoV2GetMarketContext: [
        "market_project_read_models",
        "project_asset_links",
        "market_assets",
        "market_project_histories",
      ],
      fomoV2GetSourceContext: [
        "canonical_project_sources",
        "source_entities",
        "source_snapshots",
        "project_domain_sources",
        "review_batches",
        "canonical_projects",
      ],
      fomoV2GetFundingContext: [
        "funding_rounds",
        "funding_round_participants",
        "backers",
        "import_candidates",
      ],
      fomoV2GetBackerContext: [
        "backers",
        "backer_source_profiles",
        "backer_portfolio_holdings",
        "funding_round_participants",
        "canonical_projects",
      ],
      fomoV2GetTokenomicsContext: [
        "token_allocations",
        "vesting_rounds",
        "vesting_schedules",
        "vesting_summaries",
        "unlock_events",
      ],
      fomoV2FindVestingReviewCases: [
        "token_allocations",
        "vesting_schedules",
        "unlock_events",
        "review_batches",
        "import_candidates",
        "canonical_projects",
        "market_project_read_models",
        "canonical_project_sources",
        "source_entities",
      ],
      fomoV2GetVestingReviewContext: [
        "canonical_projects",
        "token_allocations",
        "vesting_schedules",
        "unlock_events",
        "review_batches",
        "import_candidates",
        "canonical_project_sources",
        "source_entities",
        "source_snapshots",
        "project_domain_sources",
      ],
      fomoV2AnalyzeVestingSaleIds: [
        "canonical_projects",
        "token_allocations",
        "vesting_schedules",
        "unlock_events",
      ],
      fomoV2NormalizeVestingNames: [
        "canonical_projects",
        "token_allocations",
        "vesting_schedules",
      ],
      fomoV2FindOfficialSourceLinks: [
        "canonical_projects",
        "canonical_project_sources",
        "source_entities",
        "source_snapshots",
        "project_domain_sources",
        "market_project_read_models",
      ],
      fomoWebSearchOfficialSources: [],
      fomoWebFetchSourceSummary: [],
      fomoV2AnalyzeVestingReviewCase: [
        "canonical_projects",
        "token_allocations",
        "vesting_rounds",
        "vesting_schedules",
        "vesting_summaries",
        "unlock_events",
        "review_batches",
        "import_candidates",
        "canonical_project_sources",
        "source_entities",
        "market_project_read_models",
      ],
      fomoV2BuildVestingReviewProposal: [
        "canonical_projects",
        "token_allocations",
        "vesting_rounds",
        "vesting_schedules",
        "vesting_summaries",
        "unlock_events",
        "review_batches",
        "import_candidates",
        "canonical_project_sources",
        "source_entities",
        "market_project_read_models",
      ],
      fomoV2FindDuplicates: [
        "canonical_projects",
        "backers",
        "source_entities",
      ],
      fomoV2ExplainMissingData: mainCollections,
      fomoDevFindProject: [
        "canonical_projects",
        "market_assets",
        "project_asset_links",
        "canonical_project_sources",
        "source_entities",
        "market_project_read_models",
      ],
      fomoDevGetProjectFullContext: mainCollections,
      fomoDevGetMarketContext: [
        "market_project_read_models",
        "project_asset_links",
        "market_assets",
        "market_project_histories",
      ],
      fomoDevGetFundingContext: [
        "funding_rounds",
        "funding_round_participants",
        "backers",
        "import_candidates",
      ],
      fomoDevGetBackerContext: [
        "backers",
        "backer_source_profiles",
        "backer_portfolio_holdings",
        "funding_round_participants",
        "canonical_projects",
      ],
      fomoDevGetTokenomicsContext: [
        "token_allocations",
        "vesting_rounds",
        "vesting_schedules",
        "vesting_summaries",
        "unlock_events",
      ],
      fomoDevGetSourceEvidence: [
        "canonical_project_sources",
        "source_entities",
        "source_snapshots",
        "project_domain_sources",
        "review_batches",
        "canonical_projects",
      ],
      fomoDevSearchReviewCases: ["review_batches"],
      fomoDevCreateReviewCase: ["review_batches"],
      fomoDevResolveReviewCase: ["review_batches"],
      fomoDevLinkParserSourceToProject: ["canonical_project_sources"],
      fomoDevUnlinkParserSourceFromProject: ["canonical_project_sources"],
      fomoDevUpdateProjectFields: ["canonical_projects"],
      fomoDevUpsertSourceEvidence: ["canonical_projects"],
      fomoDevMarkSourceConflict: ["review_batches", "canonical_project_sources"],
      fomoDevRebuildProjectReadModel: [
        "market_project_read_models",
        "canonical_projects",
        "market_assets",
      ],
      fomoDevRunImporterForProject: [
        "canonical_projects",
        "canonical_project_sources",
        "source_entities",
        "source_snapshots",
      ],
      fomoDevListCollections: mainCollections,
      fomoDevCollectionStats: mainCollections,
      fomoDevFind: [],
      fomoDevFindMany: [],
      fomoDevFindOne: [],
      fomoDevCount: [],
      fomoDevAggregate: [],
      fomoDevAggregateReadOnly: [],
      fomoDevCreateWriteProposal: [],
      fomoDevPreviewWriteDiff: [],
      fomoDevExecuteApprovedWrite: [],
      fomoDevInsertOne: [],
      fomoDevUpdateOne: [],
      fomoDevUpdateMany: [],
      fomoDevDeleteOne: [],
      fomoDevDeleteMany: [],
    };

    return map[tool] || mainCollections;
  }
}
