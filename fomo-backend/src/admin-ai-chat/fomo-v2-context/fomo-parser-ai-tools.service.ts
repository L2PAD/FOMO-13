import { Injectable, Optional } from "@nestjs/common";
import { InjectConnection } from "@nestjs/mongoose";
import { Connection, Types } from "mongoose";
import {
  ADMIN_AI_CONNECTION_NAME,
  ADMIN_AI_COLLECTION_REGISTRY,
  ADMIN_AI_PARSER_CONNECTION_NAME,
} from "../admin-ai-chat.constants";
import { AdminAiChatConfigService } from "../admin-ai-chat-config.service";
import { FomoV2AiRedactionService } from "./fomo-v2-ai-redaction.service";
import {
  AdminAiAccessMode,
  AdminAiToolExecutionContext,
  FomoV2AiToolResult,
} from "./fomo-v2-ai-types";

export const FOMO_PARSER_AI_TOOL_NAMES = [
  "fomoParserDbStatus",
  "fomoParserCollectionStats",
  "fomoParserSearchIcoProjects",
  "fomoParserGetIcoProject",
  "fomoParserSearchDropstabCatalog",
  "fomoParserGetDropstabCatalogItem",
  "fomoParserGetDropstabDetailData",
  "fomoParserSearchDropstabCoins",
  "fomoParserGetDropstabCoinDetail",
  "fomoParserSearchInvestors",
  "fomoParserGetInvestor",
  "fomoParserSearchFundraising",
  "fomoParserGetFundraisingContext",
  "fomoParserSearchUnlocks",
  "fomoParserGetUnlockContext",
  "fomoParserFindProjectParserContext",
  "fomoParserFindTopDataSources",
  "fomoParserDiscovery",
  "fomoParserProfileCollections",
  "fomoParserInspectCollectionSchema",
  "fomoParserSampleDocuments",
  "fomoParserFindCrossSourceMatches",
  "fomoParserFindTopProjectsByCollection",
  "fomoParserDataQualityReport",
  "fomoParserFindV2LinkCandidates",
  "fomoParserCompareProjectContext",
  "fomoAiToolHealthCheck",
  "fomoAiExplainLastToolError",
  "fomoAiListCapabilities",
  "fomoParserListRunnableScripts",
  "fomoParserCreateRunProposal",
  "fomoParserSendRunConfirmationCode",
  "fomoParserConfirmRunCode",
  "fomoParserExecuteApprovedRun",
  "fomoParserGetRunStatus",
  "fomoParserListRecentRuns",
  "fomoParserListRuns",
  "fomoParserGetRunContext",
  "fomoParserGetRawDocument",
  "fomoParserSearchRawDocuments",
  "fomoParserListExtractions",
  "fomoParserGetReviewCase",
  "fomoParserListReviewCases",
  "fomoParserDevListCollections",
  "fomoParserDevCollectionStats",
  "fomoParserDevFind",
  "fomoParserDevFindMany",
  "fomoParserDevFindOne",
  "fomoParserDevCount",
  "fomoParserDevAggregate",
  "fomoParserDevAggregateReadOnly",
  "fomoParserDevCreateWriteProposal",
  "fomoParserDevPreviewWriteDiff",
  "fomoParserDevExecuteApprovedWrite",
  "fomoParserDevInsertOne",
  "fomoParserDevUpdateOne",
  "fomoParserDevUpdateMany",
  "fomoParserDevDeleteOne",
  "fomoParserDevDeleteMany",
] as const;

export type FomoParserAiToolName = (typeof FOMO_PARSER_AI_TOOL_NAMES)[number];

const PARSER_V2_COLLECTIONS = [
  "parser_sources",
  "parser_runs",
  "parser_raw_documents",
  "parser_extractions",
  "parser_identity_candidates",
  "parser_review_cases",
  "parser_ai_reviews",
  "parser_write_batches",
  "parser_write_audit_logs",
  "parser_conflicts",
] as const;

const LEGACY_PARSER_COLLECTIONS = [
  "ico_projects",
  "dropstab_coin_catalog",
  "dropstab_coin_detail_data",
  "dropstab_project_candidates",
  "dropstab_project_data",
  "intel_fundraising",
  "intel_investors",
  "intel_unlocks",
  "project_external_data",
  "ico_parser_errors",
  "ico_parser_locks",
] as const;

const LEGACY_PARSER_STATS_COLLECTIONS = [
  "ico_projects",
  "dropstab_coin_catalog",
  "dropstab_coin_detail_data",
  "intel_fundraising",
  "intel_investors",
  "intel_unlocks",
] as const;

const MAX_TIME_MS = 5000;
const DEFAULT_LIMIT = 20;
const MAX_LIMIT = 50;
const MAX_PROFILE_TIME_MS = 10000;
const DEFAULT_SAMPLE_SIZE = 5;
const MAX_SAMPLE_SIZE = 100;
const MAX_OUTPUT_ARRAY_ITEMS = 20;
const MAX_OUTPUT_STRING_LENGTH = 700;
const GENERIC_DEFAULT_LIMIT = 20;
const GENERIC_MAX_LIMIT = 100;
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
const FOMO_PARSER_DEV_WRITE_TOOL_NAMES = [
  "fomoParserDevCreateWriteProposal",
  "fomoParserDevExecuteApprovedWrite",
  "fomoParserDevInsertOne",
  "fomoParserDevUpdateOne",
  "fomoParserDevUpdateMany",
  "fomoParserDevDeleteOne",
  "fomoParserDevDeleteMany",
] as const;

const PROFILE_ALLOWED_COLLECTIONS = [
  ...LEGACY_PARSER_COLLECTIONS,
  "test",
] as const;

const CROSS_SOURCE_COLLECTIONS = [
  "ico_projects",
  "dropstab_coin_catalog",
  "dropstab_coin_detail_data",
  "intel_fundraising",
  "intel_investors",
  "intel_unlocks",
] as const;

const V2_LINK_SOURCE_COLLECTIONS = [
  "ico_projects",
  "dropstab_coin_catalog",
  "dropstab_coin_detail_data",
  "intel_fundraising",
  "intel_unlocks",
] as const;

const FOMO_V2_READ_COLLECTIONS = [
  "canonical_projects",
  "market_project_read_models",
  "market_assets",
  "project_asset_links",
  "canonical_project_sources",
  "source_entities",
  "import_candidates",
] as const;

const SCRIPT_PROPOSAL_BLOCKED_MESSAGE =
  "Parser script execution requires a dedicated admin-approved backend endpoint with JWT and email OTP. This chat tool only creates a safe proposal preview and never starts a process.";

const PARSER_SCRIPT_ALLOWLIST = [
  {
    scriptKey: "dropstab_investors_dry_run",
    label: "Dropstab investors sync dry-run",
    packageScript: "sync:dropstab:investors:dry",
    command: "npm",
    argsTemplate: ["run", "sync:dropstab:investors:dry", "--"],
    allowedArgs: {
      limit: { type: "number", min: 1, max: 1000 },
      dryRun: { type: "boolean", default: true, forced: true },
    },
    defaultArgs: { dryRun: true, limit: 50 },
    requiresEmailConfirmation: true,
    requiresAdminJwt: true,
    writesParserDb: false,
    writesProdDb: false,
  },
  {
    scriptKey: "dropstab_investors_audit",
    label: "Dropstab investors sync audit",
    packageScript: "audit:dropstab:investors:sync",
    command: "npm",
    argsTemplate: ["run", "audit:dropstab:investors:sync", "--"],
    allowedArgs: {
      limit: { type: "number", min: 1, max: 1000 },
    },
    defaultArgs: { limit: 50 },
    requiresEmailConfirmation: true,
    requiresAdminJwt: true,
    writesParserDb: false,
    writesProdDb: false,
  },
  {
    scriptKey: "icodrops_funding_fallback_dry_run",
    label: "ICODrops funding fallback dry-run",
    packageScript: "fomo-v2:icodrops-funding-fallback-dry-run",
    command: "npm",
    argsTemplate: ["run", "fomo-v2:icodrops-funding-fallback-dry-run", "--"],
    allowedArgs: {
      limit: { type: "number", min: 1, max: 1000 },
      dryRun: { type: "boolean", default: true, forced: true },
    },
    defaultArgs: { dryRun: true, limit: 50 },
    requiresEmailConfirmation: true,
    requiresAdminJwt: true,
    writesParserDb: false,
    writesProdDb: false,
  },
  {
    scriptKey: "funding_import_dry_run",
    label: "Dropstab funding import dry-run",
    packageScript: "fomo-v2:funding-import-dry-run",
    command: "npm",
    argsTemplate: ["run", "fomo-v2:funding-import-dry-run", "--"],
    allowedArgs: {
      limit: { type: "number", min: 1, max: 1000 },
      dryRun: { type: "boolean", default: true, forced: true },
    },
    defaultArgs: { dryRun: true, limit: 50 },
    requiresEmailConfirmation: true,
    requiresAdminJwt: true,
    writesParserDb: false,
    writesProdDb: false,
  },
  {
    scriptKey: "intel_fundraising_gap_fill_dry_run",
    label: "Intel fundraising gap fill dry-run",
    packageScript: "fomo-v2:intel-fundraising-gap-fill-dry-run",
    command: "npm",
    argsTemplate: ["run", "fomo-v2:intel-fundraising-gap-fill-dry-run", "--"],
    allowedArgs: {
      limit: { type: "number", min: 1, max: 1000 },
      dryRun: { type: "boolean", default: true, forced: true },
    },
    defaultArgs: { dryRun: true, limit: 50 },
    requiresEmailConfirmation: true,
    requiresAdminJwt: true,
    writesParserDb: false,
    writesProdDb: false,
  },
] as const;

const LEGACY_PROJECT_PROJECTION = {
  _id: 1,
  name: 1,
  symbol: 1,
  slug: 1,
  source: 1,
  sourceId: 1,
  sourceUrl: 1,
  detailUrl: 1,
  website: 1,
  url: 1,
  dropstabSlug: 1,
  dropstabId: 1,
  icodropsSlug: 1,
  icodropsId: 1,
  status: 1,
  projectType: 1,
  categories: 1,
  ecosystems: 1,
  launchpads: 1,
  fundraising: 1,
  saleRounds: 1,
  tokenomics: 1,
  createdAt: 1,
  updatedAt: 1,
  firstSeenAt: 1,
  lastSeenAt: 1,
  lastParsedAt: 1,
  icoDetailsLastParsedAt: 1,
};

const DROPSTAB_COIN_PROJECTION = {
  _id: 1,
  name: 1,
  coinName: 1,
  symbol: 1,
  coinSymbol: 1,
  slug: 1,
  coinSlug: 1,
  dropstabSlug: 1,
  currencyId: 1,
  source: 1,
  detailUrl: 1,
  website: 1,
  url: 1,
  rank: 1,
  categories: 1,
  tags: 1,
  ecosystems: 1,
  funding: 1,
  fundraising: 1,
  investors: 1,
  parsedAt: 1,
  createdAt: 1,
  updatedAt: 1,
  lastSeenAt: 1,
  lastParsedAt: 1,
  lastDetailParsedAt: 1,
};

const INVESTOR_PROJECTION = {
  _id: 1,
  key: 1,
  name: 1,
  slug: 1,
  source: 1,
  sourceId: 1,
  sourceRank: 1,
  detailUrl: 1,
  website: 1,
  url: 1,
  type: 1,
  tier: 1,
  projects: 1,
  portfolio: 1,
  portfolioCount: 1,
  createdAt: 1,
  updatedAt: 1,
  listLastSeenAt: 1,
  lastParsedAt: 1,
  lastDetailParsedAt: 1,
};

const FUNDRAISING_PROJECTION = {
  _id: 1,
  key: 1,
  project_key: 1,
  projectKey: 1,
  project_slug: 1,
  projectSlug: 1,
  project_name: 1,
  projectName: 1,
  name: 1,
  round_type: 1,
  roundType: 1,
  type: 1,
  source: 1,
  date: 1,
  announcedAt: 1,
  amount: 1,
  amountUsd: 1,
  investors: 1,
  leadInvestors: 1,
  createdAt: 1,
  updatedAt: 1,
};

const UNLOCK_PROJECTION = {
  _id: 1,
  key: 1,
  project_key: 1,
  projectKey: 1,
  project_slug: 1,
  projectSlug: 1,
  project_name: 1,
  projectName: 1,
  name: 1,
  symbol: 1,
  slug: 1,
  source: 1,
  unlock_date: 1,
  unlockDate: 1,
  date: 1,
  amount: 1,
  amountUsd: 1,
  tokens: 1,
  round: 1,
  createdAt: 1,
  updatedAt: 1,
};


const FORBIDDEN_INPUT_KEYS = [
  "insert",
  "insertOne",
  "insertMany",
  "update",
  "updateOne",
  "updateMany",
  "delete",
  "deleteOne",
  "deleteMany",
  "bulkWrite",
  "replace",
  "replaceOne",
  "drop",
  "$out",
  "$merge",
  "$function",
  "$accumulator",
];

const RAW_DOCUMENT_PROJECTION = {
  _id: 1,
  rawId: 1,
  sourceKey: 1,
  source: 1,
  source_key: 1,
  sourceUrl: 1,
  source_url: 1,
  url: 1,
  sourceEntityId: 1,
  source_entity_id: 1,
  parserRunId: 1,
  runId: 1,
  payloadHash: 1,
  payload_hash: 1,
  contentHash: 1,
  contentType: 1,
  content_type: 1,
  mimeType: 1,
  status: 1,
  createdAt: 1,
  updatedAt: 1,
  capturedAt: 1,
  normalizedPreview: 1,
  payloadPreview: 1,
  textPreview: 1,
  summary: 1,
  title: 1,
  description: 1,
};

const RUN_PROJECTION = {
  _id: 1,
  runId: 1,
  sourceKey: 1,
  source: 1,
  source_key: 1,
  parserKey: 1,
  parser_key: 1,
  status: 1,
  startedAt: 1,
  finishedAt: 1,
  createdAt: 1,
  updatedAt: 1,
  errorCode: 1,
  errorMessage: 1,
  stats: 1,
};

const EXTRACTION_PROJECTION = {
  _id: 1,
  extractionId: 1,
  parserRunId: 1,
  runId: 1,
  rawDocumentId: 1,
  rawId: 1,
  sourceKey: 1,
  source: 1,
  sourceUrl: 1,
  entityType: 1,
  extractionType: 1,
  status: 1,
  confidence: 1,
  payloadHash: 1,
  resultHash: 1,
  fieldCount: 1,
  normalizedPreview: 1,
  summary: 1,
  createdAt: 1,
  updatedAt: 1,
};

const REVIEW_CASE_PROJECTION = {
  _id: 1,
  caseId: 1,
  parserRunId: 1,
  runId: 1,
  rawDocumentId: 1,
  rawId: 1,
  sourceKey: 1,
  status: 1,
  reason: 1,
  riskFlags: 1,
  confidenceScore: 1,
  projectName: 1,
  normalizedProjectName: 1,
  summary: 1,
  createdAt: 1,
  updatedAt: 1,
};

@Injectable()
export class FomoParserAiToolsService {
  constructor(
    @InjectConnection(ADMIN_AI_PARSER_CONNECTION_NAME)
    private readonly parserConnection: Connection,
    private readonly adminAiConfig: AdminAiChatConfigService,
    private readonly redactionService: FomoV2AiRedactionService,
    @Optional()
    @InjectConnection(ADMIN_AI_CONNECTION_NAME)
    private readonly adminConnection?: Connection
  ) {}

  getToolDefinitions() {
    return [
      this.tool("fomoParserDbStatus", "Get read-only parser DB connectivity and collection status.", {
        type: "object",
        properties: {},
      }),
      this.tool("fomoParserCollectionStats", "Get counts and compact health stats for legacy parser DB collections. Read-only batch-capable.", {
        type: "object",
        properties: {
          collectionNames: { type: "array", items: { type: "string" } },
        },
      }),
      this.tool("fomoParserSearchIcoProjects", "Search legacy ico_projects by name, symbol, slug, source ids, or website. Read-only.", {
        type: "object",
        properties: {
          query: { type: "string" },
          limit: { type: "number" },
        },
      }),
      this.tool("fomoParserGetIcoProject", "Get one safe legacy ico_projects summary by id or slug. Read-only.", {
        type: "object",
        properties: {
          id: { type: "string" },
          slug: { type: "string" },
        },
      }),
      this.tool("fomoParserSearchDropstabCatalog", "Search legacy Dropstab catalog parser collection. Read-only.", {
        type: "object",
        properties: {
          query: { type: "string" },
          limit: { type: "number" },
        },
      }),
      this.tool("fomoParserGetDropstabCatalogItem", "Get one safe Dropstab catalog item by id, slug, or currency id. Read-only.", {
        type: "object",
        properties: {
          id: { type: "string" },
          slug: { type: "string" },
          currencyId: { type: "string" },
        },
      }),
      this.tool("fomoParserGetDropstabDetailData", "Get one safe Dropstab detail data item by id, slug, or currency id. Read-only.", {
        type: "object",
        properties: {
          id: { type: "string" },
          slug: { type: "string" },
          currencyId: { type: "string" },
        },
      }),
      this.tool("fomoParserSearchDropstabCoins", "Search legacy Dropstab catalog/detail parser collections. Read-only.", {
        type: "object",
        properties: {
          query: { type: "string" },
          limit: { type: "number" },
        },
      }),
      this.tool("fomoParserGetDropstabCoinDetail", "Get one safe Dropstab coin detail by id, slug, or currency id. Read-only.", {
        type: "object",
        properties: {
          id: { type: "string" },
          slug: { type: "string" },
          currencyId: { type: "string" },
        },
      }),
      this.tool("fomoParserSearchInvestors", "Search legacy intel_investors by name, slug, website, or portfolio/project text. Read-only.", {
        type: "object",
        properties: {
          query: { type: "string" },
          limit: { type: "number" },
        },
      }),
      this.tool("fomoParserGetInvestor", "Get one safe legacy intel_investors summary by id, key, or slug. Read-only.", {
        type: "object",
        properties: {
          id: { type: "string" },
          slug: { type: "string" },
          key: { type: "string" },
        },
      }),
      this.tool("fomoParserSearchFundraising", "Search legacy intel_fundraising by project, investor, round type, or source. Read-only.", {
        type: "object",
        properties: {
          query: { type: "string" },
          source: { type: "string" },
          limit: { type: "number" },
        },
      }),
      this.tool("fomoParserGetFundraisingContext", "Get safe fundraising context by id or project query. Read-only.", {
        type: "object",
        properties: {
          id: { type: "string" },
          query: { type: "string" },
          limit: { type: "number" },
        },
      }),
      this.tool("fomoParserSearchUnlocks", "Search legacy intel_unlocks by project, symbol, source, or optional date range. Read-only.", {
        type: "object",
        properties: {
          query: { type: "string" },
          source: { type: "string" },
          dateFrom: { type: "string" },
          dateTo: { type: "string" },
          limit: { type: "number" },
        },
      }),
      this.tool("fomoParserGetUnlockContext", "Get safe unlock context by id or project query. Read-only.", {
        type: "object",
        properties: {
          id: { type: "string" },
          query: { type: "string" },
          limit: { type: "number" },
        },
      }),
      this.tool("fomoParserFindProjectParserContext", "Find compact project context across legacy parser collections without requiring a project id. Read-only.", {
        type: "object",
        properties: {
          query: { type: "string" },
          limit: { type: "number" },
        },
      }),
      this.tool("fomoParserFindTopDataSources", "Summarize top legacy parser data sources and coverage counts. Read-only.", {
        type: "object",
        properties: {
          limit: { type: "number" },
        },
      }),
      this.tool("fomoParserDiscovery", "Discover candidate parser data across legacy collections by domain. Read-only.", {
        type: "object",
        properties: {
          domain: {
            type: "string",
            enum: [
              "projects",
              "fundraising",
              "investors",
              "unlocks",
              "dropstab",
              "icodrops",
              "coverage",
              "v2_linking",
              "data_quality",
              "review_candidates",
            ],
          },
          limit: { type: "number" },
          sortBy: { type: "string" },
          filters: { type: "object" },
        },
      }),
      this.tool("fomoParserProfileCollections", "Batch profile multiple legacy parser collections in one call: fields, nested paths, identity candidates, compact samples.", {
        type: "object",
        properties: {
          collectionNames: { type: "array", items: { type: "string" } },
          sampleSize: { type: "number" },
          includeCompactSamples: { type: "boolean" },
          includeFieldFrequency: { type: "boolean" },
          includeNestedPaths: { type: "boolean" },
          includeIdentityCandidates: { type: "boolean" },
        },
        required: ["collectionNames"],
      }),
      this.tool("fomoParserInspectCollectionSchema", "Deep schema profile for one parser collection with field path filtering and safe examples.", {
        type: "object",
        properties: {
          collectionName: { type: "string" },
          sampleSize: { type: "number" },
          includeExamples: { type: "boolean" },
          fieldPathFilter: { type: "array", items: { type: "string" } },
        },
        required: ["collectionName"],
      }),
      this.tool("fomoParserSampleDocuments", "Return safe compact parser document previews with projection presets. No raw payload.", {
        type: "object",
        properties: {
          collectionName: { type: "string" },
          filter: { type: "object" },
          limit: { type: "number" },
          projectionPreset: {
            type: "string",
            enum: [
              "identity",
              "fundraising",
              "investor",
              "unlock",
              "dropstab_detail",
              "icodrops",
              "debug_compact",
            ],
          },
        },
        required: ["collectionName"],
      }),
      this.tool("fomoParserFindCrossSourceMatches", "Find cross-source matches between legacy parser collections by normalized slug, website, name, symbol, and source URL.", {
        type: "object",
        properties: {
          leftCollection: { type: "string" },
          rightCollection: { type: "string" },
          matchBy: { type: "array", items: { type: "string" } },
          limit: { type: "number" },
          minConfidence: { type: "number" },
        },
        required: ["leftCollection", "rightCollection"],
      }),
      this.tool("fomoParserFindTopProjectsByCollection", "Find top grouped parser records in one collection without requiring projectId.", {
        type: "object",
        properties: {
          collectionName: { type: "string" },
          groupBy: { type: "string" },
          limit: { type: "number" },
          includeSamples: { type: "boolean" },
        },
        required: ["collectionName"],
      }),
      this.tool("fomoParserDataQualityReport", "Report parser data quality issues such as missing identity fields, duplicate slugs/names, stale or invalid records.", {
        type: "object",
        properties: {
          collectionName: { type: "string" },
          domain: { type: "string" },
          limit: { type: "number" },
        },
      }),
      this.tool("fomoParserFindV2LinkCandidates", "Find parser records that can be linked to FOMO v2 canonical projects. Read-only cross-db comparison.", {
        type: "object",
        properties: {
          sourceCollection: { type: "string" },
          query: { type: "string" },
          limit: { type: "number" },
          minConfidence: { type: "number" },
          onlyUnlinked: { type: "boolean" },
        },
        required: ["sourceCollection"],
      }),
      this.tool("fomoParserCompareProjectContext", "Compare parser DB context and FOMO v2 context for a project query. Read-only.", {
        type: "object",
        properties: {
          query: { type: "string" },
          includeFunding: { type: "boolean" },
          includeTokenomics: { type: "boolean" },
          includeUnlocks: { type: "boolean" },
          includeSources: { type: "boolean" },
        },
        required: ["query"],
      }),
      this.tool("fomoAiToolHealthCheck", "Check Admin AI tool layer health, DB connections, write permissions, and access mode.", {
        type: "object",
        properties: {},
      }),
      this.tool("fomoAiExplainLastToolError", "Explain the last saved Admin AI tool error if audit logs are readable.", {
        type: "object",
        properties: {},
      }),
      this.tool("fomoAiListCapabilities", "List Admin AI Chat capabilities, current access mode, write rules, and forbidden actions.", {
        type: "object",
        properties: {},
      }),
      this.tool("fomoParserListRunnableScripts", "List allowlisted parser scripts and safety constraints. Does not execute scripts.", {
        type: "object",
        properties: {},
      }),
      this.tool("fomoParserCreateRunProposal", "Create a safe parser script run proposal preview. Does not execute scripts.", {
        type: "object",
        properties: {
          scriptKey: { type: "string" },
          args: { type: "object" },
          reason: { type: "string" },
        },
      }),
      this.tool("fomoParserSendRunConfirmationCode", "Explain parser run email confirmation requirements. Does not send codes from the LLM tool path.", {
        type: "object",
        properties: {},
      }),
      this.tool("fomoParserConfirmRunCode", "Reject code confirmation from the LLM tool path until the dedicated admin endpoint is available.", {
        type: "object",
        properties: {
          code: { type: "string" },
        },
      }),
      this.tool("fomoParserExecuteApprovedRun", "Reject parser run execution from the LLM tool path until JWT and email OTP endpoint support is available.", {
        type: "object",
        properties: {
          proposalId: { type: "string" },
        },
      }),
      this.tool("fomoParserGetRunStatus", "Get parser run status for proposals created by the safe preview tool.", {
        type: "object",
        properties: {
          proposalId: { type: "string" },
        },
      }),
      this.tool("fomoParserListRecentRuns", "List recent parser run proposals visible to the chat tool path.", {
        type: "object",
        properties: {
          limit: { type: "number" },
        },
      }),
      this.tool("fomoParserListRuns", "List parser runs by source, parser, or status. Read-only.", {
        type: "object",
        properties: {
          sourceKey: { type: "string" },
          parserKey: { type: "string" },
          status: { type: "string" },
          limit: { type: "number" },
        },
      }),
      this.tool("fomoParserGetRunContext", "Get one parser run plus linked artifact counts. Read-only.", {
        type: "object",
        properties: {
          runId: { type: "string" },
          id: { type: "string" },
        },
      }),
      this.tool("fomoParserGetRawDocument", "Get a parser raw document safe preview only. Read-only.", {
        type: "object",
        properties: {
          rawId: { type: "string" },
          id: { type: "string" },
        },
      }),
      this.tool("fomoParserSearchRawDocuments", "Search parser raw documents and return safe previews only. Read-only.", {
        type: "object",
        properties: {
          sourceKey: { type: "string" },
          sourceUrl: { type: "string" },
          sourceEntityId: { type: "string" },
          status: { type: "string" },
          limit: { type: "number" },
        },
      }),
      this.tool("fomoParserListExtractions", "List parser extraction summaries. Read-only.", {
        type: "object",
        properties: {
          runId: { type: "string" },
          rawDocumentId: { type: "string" },
          sourceKey: { type: "string" },
          status: { type: "string" },
          limit: { type: "number" },
        },
      }),
      this.tool("fomoParserGetReviewCase", "Get one parser review case summary. Read-only.", {
        type: "object",
        properties: {
          caseId: { type: "string" },
          id: { type: "string" },
        },
      }),
      this.tool("fomoParserListReviewCases", "List parser review case summaries. Read-only.", {
        type: "object",
        properties: {
          sourceKey: { type: "string" },
          status: { type: "string" },
          reason: { type: "string" },
          limit: { type: "number" },
        },
      }),
      this.tool("fomoParserDevListCollections", "List parser_new_dev collections. Read-only.", {
        type: "object",
        properties: {},
      }),
      this.tool("fomoParserDevCollectionStats", "Get parser_new_dev collection stats by collectionName or all safe collections. Read-only.", {
        type: "object",
        properties: { collectionName: { type: "string" }, limit: { type: "number" } },
      }),
      this.tool("fomoParserDevFind", "Find documents in one parser_new_dev collection with a JSON filter, projection, sort, and limit. Read-only.", {
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
      this.tool("fomoParserDevFindMany", "Alias of fomoParserDevFind for safe multi-document parser_new_dev reads.", {
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
      this.tool("fomoParserDevFindOne", "Find one document in one parser_new_dev collection with a JSON filter. Read-only.", {
        type: "object",
        properties: {
          collectionName: { type: "string" },
          filter: { type: "object" },
          projection: { type: "object" },
          sort: { type: "object" },
        },
        required: ["collectionName"],
      }),
      this.tool("fomoParserDevCount", "Count documents in one parser_new_dev collection with a JSON filter. Read-only.", {
        type: "object",
        properties: { collectionName: { type: "string" }, filter: { type: "object" } },
        required: ["collectionName"],
      }),
      this.tool("fomoParserDevAggregate", "Run a safe read-only aggregate on one parser_new_dev collection. Blocks write/admin stages.", {
        type: "object",
        properties: {
          collectionName: { type: "string" },
          pipeline: { type: "array", items: { type: "object" } },
          limit: { type: "number" },
        },
        required: ["collectionName", "pipeline"],
      }),
      this.tool("fomoParserDevAggregateReadOnly", "Alias of fomoParserDevAggregate for safe read-only parser_new_dev aggregation.", {
        type: "object",
        properties: {
          collectionName: { type: "string" },
          pipeline: { type: "array", items: { type: "object" } },
          limit: { type: "number" },
        },
        required: ["collectionName", "pipeline"],
      }),
      this.tool("fomoParserDevCreateWriteProposal", "Create or approve a safe parser_new_dev write proposal. Uses the same approval flow as generic parser writes.", {
        type: "object",
        properties: {
          collectionName: { type: "string" },
          operation: { type: "string", enum: ["insertOne", "updateOne", "replaceOne"] },
          filter: { type: "object" },
          document: { type: "object" },
          update: { type: "object" },
          dryRun: { type: "boolean" },
          confirm: { type: "boolean" },
        },
        required: ["collectionName", "operation"],
      }),
      this.tool("fomoParserDevPreviewWriteDiff", "Preview safe parser_new_dev write diff without executing.", {
        type: "object",
        properties: {
          collectionName: { type: "string" },
          operation: { type: "string", enum: ["insertOne", "updateOne", "replaceOne"] },
          filter: { type: "object" },
          document: { type: "object" },
          update: { type: "object" },
        },
        required: ["collectionName", "operation"],
      }),
      this.tool("fomoParserDevExecuteApprovedWrite", "Execute a backend-approved parser_new_dev write proposal. Direct chat calls still pass through approval guard.", {
        type: "object",
        properties: {
          collectionName: { type: "string" },
          operation: { type: "string", enum: ["insertOne", "updateOne", "replaceOne"] },
          filter: { type: "object" },
          document: { type: "object" },
          update: { type: "object" },
          dryRun: { type: "boolean" },
          confirm: { type: "boolean" },
        },
        required: ["collectionName", "operation"],
      }),
      this.tool("fomoParserDevInsertOne", "Insert one document into one parser_new_dev collection under the current access mode.", {
        type: "object",
        properties: {
          collectionName: { type: "string" },
          document: { type: "object" },
          dryRun: { type: "boolean" },
          confirm: { type: "boolean" },
        },
        required: ["collectionName", "document"],
      }),
      this.tool("fomoParserDevUpdateOne", "Update one document in one parser_new_dev collection with a safe JSON update under the current access mode.", {
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
      this.tool("fomoParserDevUpdateMany", "Update many documents in one parser_new_dev collection. Requires confirm=true for execution.", {
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
      this.tool("fomoParserDevDeleteOne", "Delete one document in one parser_new_dev collection under the current access mode.", {
        type: "object",
        properties: {
          collectionName: { type: "string" },
          filter: { type: "object" },
          dryRun: { type: "boolean" },
          confirm: { type: "boolean" },
        },
        required: ["collectionName", "filter"],
      }),
      this.tool("fomoParserDevDeleteMany", "Delete many documents in one parser_new_dev collection. Requires confirm=true for execution.", {
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

  canExecuteTool(name: string): name is FomoParserAiToolName {
    return FOMO_PARSER_AI_TOOL_NAMES.includes(name as FomoParserAiToolName);
  }

  async executeTool(
    name: string,
    input: Record<string, unknown> = {},
    context: AdminAiToolExecutionContext = {}
  ) {
    const startedAt = Date.now();

    try {
      const accessMode = this.resolveAccessMode(context.accessMode);
      const pendingResult = await this.pendingOrBlockedWriteResult(
        name as FomoParserAiToolName,
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

      this.adminAiConfig.ensureAiToolDbAccess({
        dbName: this.adminAiConfig.getParserDbName(),
        access: this.isParserDevWriteTool(name as FomoParserAiToolName) && !this.isDryRun(input)
          ? "write"
          : "read",
        parserDb: true,
        accessMode,
      });
      if (!this.isParserDevGenericTool(name as FomoParserAiToolName)) {
        this.adminAiConfig.assertSafeAiToolInput(input);
        this.assertReadOnlyInput(input);
      }

      if (!this.canExecuteTool(name)) {
        return this.result(name, {
          error: "Unknown or disabled parser tool",
          allowedTools: FOMO_PARSER_AI_TOOL_NAMES,
        });
      }

      if (
        this.isParserDevWriteTool(name as FomoParserAiToolName) &&
        !this.isDryRun(input) &&
        input.confirm !== true
      ) {
        throw new Error("confirm=true is required when dryRun=false");
      }

      const result = await this.dispatchTool(name, input, context);
      return {
        ...result,
        data: this.redactionService.redact(result.data) as Record<string, unknown>,
        durationMs: Date.now() - startedAt,
      };
    } catch (error: any) {
      if (error?.code === 13 || /not authorized/i.test(String(error?.message || ""))) {
        return this.result(name, {
          error: "PARSER_DEV_WRITE_NOT_AUTHORIZED",
          errorCode: "PARSER_DEV_WRITE_NOT_AUTHORIZED",
        });
      }

      return this.result(name, {
        error: error?.message || "Parser DB tool failed",
        errorCode: error?.code || error?.name || "PARSER_TOOL_ERROR",
      });
    }
  }

  async fomoParserDbStatus() {
    const connected = this.isConnected();
    const warnings: string[] = [];

    if (!connected) {
      warnings.push(
        `Parser DB connection is not ready. readyState=${this.parserConnection.readyState}`
      );
    }

    const legacyParserCollections = connected
      ? await this.collectionStatus([...LEGACY_PARSER_COLLECTIONS], warnings)
      : LEGACY_PARSER_COLLECTIONS.map((name) => ({
          name,
          exists: false,
          count: 0,
          collectionMissing: true,
        }));
    const parserV2Collections = connected
      ? await this.collectionStatus([...PARSER_V2_COLLECTIONS], warnings, false)
      : PARSER_V2_COLLECTIONS.map((name) => ({
          name,
          exists: false,
          count: 0,
          collectionMissing: true,
        }));

    const legacyCollectionsFound = legacyParserCollections.filter(
      (item) => item.exists
    ).length;
    const legacyDocumentsTotal = legacyParserCollections.reduce(
      (total, item) => total + (Number(item.count) || 0),
      0
    );
    const parserV2CollectionsFound = parserV2Collections.filter(
      (item) => item.exists
    ).length;

    return this.result(
      "fomoParserDbStatus",
      {
        connected,
        dbName: this.adminAiConfig.getParserDbName(),
        legacyParserCollections,
        parserV2Collections,
        summary: {
          legacyCollectionsFound,
          legacyDocumentsTotal,
          parserV2CollectionsFound,
          healthy: connected && legacyCollectionsFound > 0,
          warnings,
        },
      },
      {
        collectionsRead: [
          ...LEGACY_PARSER_COLLECTIONS,
          ...PARSER_V2_COLLECTIONS,
        ],
      }
    );
  }

  async fomoParserCollectionStats(input: Record<string, unknown> = {}) {
    const requested = this.safeCollectionNames(
      input.collectionNames,
      [...LEGACY_PARSER_STATS_COLLECTIONS]
    );
    const stats = await Promise.all(
      requested.map((name) => this.collectionDetailedStats(name))
    );
    const totalDocuments = stats.reduce(
      (total, item) => total + (Number(item.count) || 0),
      0
    );
    const warnings = stats.flatMap((item: any) => item.warnings || []);

    return this.result(
      "fomoParserCollectionStats",
      {
        dbName: this.adminAiConfig.getParserDbName(),
        collections: stats,
        summary: {
          collectionsRequested: requested.length,
          collectionsFound: stats.filter((item) => item.exists).length,
          totalDocuments,
          warnings,
        },
      },
      { collectionsRead: requested }
    );
  }

  async fomoParserProfileCollections(input: Record<string, unknown>) {
    const collectionNames = this.safeCollectionNames(
      input.collectionNames,
      [...LEGACY_PARSER_STATS_COLLECTIONS]
    );
    const sampleSize = this.sampleSize(input.sampleSize, DEFAULT_SAMPLE_SIZE, 50);
    const includeCompactSamples = input.includeCompactSamples !== false;
    const includeFieldFrequency = input.includeFieldFrequency !== false;
    const includeNestedPaths = input.includeNestedPaths !== false;
    const includeIdentityCandidates = input.includeIdentityCandidates !== false;
    const collections = await Promise.all(
      collectionNames.map((collectionName) =>
        this.profileCollection(collectionName, {
          sampleSize,
          includeCompactSamples,
          includeFieldFrequency,
          includeNestedPaths,
          includeIdentityCandidates,
        })
      )
    );
    const warnings = collections.flatMap((item) => item.warnings || []);

    return this.result(
      "fomoParserProfileCollections",
      {
        dbName: this.adminAiConfig.getParserDbName(),
        collections,
        summary: {
          collectionsRequested: collectionNames.length,
          collectionsFound: collections.filter((item) => item.exists).length,
          totalDocs: collections.reduce((total, item) => total + (Number(item.count) || 0), 0),
          warnings,
        },
      },
      { collectionsRead: collectionNames, maxTimeMS: MAX_PROFILE_TIME_MS }
    );
  }

  async fomoParserInspectCollectionSchema(input: Record<string, unknown>) {
    const collectionName = this.safeProfileCollectionName(input.collectionName);
    if (!collectionName) {
      return this.result("fomoParserInspectCollectionSchema", {
        error: "collectionName must be an allowed parser collection",
        allowedCollections: PROFILE_ALLOWED_COLLECTIONS,
      });
    }

    const sampleSize = this.sampleSize(input.sampleSize, 25, MAX_SAMPLE_SIZE);
    const profile = await this.profileCollection(collectionName, {
      sampleSize,
      includeCompactSamples: input.includeExamples !== false,
      includeFieldFrequency: true,
      includeNestedPaths: true,
      includeIdentityCandidates: true,
      fieldPathFilter: Array.isArray(input.fieldPathFilter)
        ? input.fieldPathFilter.map((item) => String(item || "").toLowerCase()).filter(Boolean)
        : [],
    });

    return this.result(
      "fomoParserInspectCollectionSchema",
      {
        dbName: this.adminAiConfig.getParserDbName(),
        collection: profile,
      },
      { collectionsRead: [collectionName], maxTimeMS: MAX_PROFILE_TIME_MS }
    );
  }

  async fomoParserSampleDocuments(input: Record<string, unknown>) {
    const collectionName = this.safeProfileCollectionName(input.collectionName);
    if (!collectionName) {
      return this.result("fomoParserSampleDocuments", {
        error: "collectionName must be an allowed parser collection",
        allowedCollections: PROFILE_ALLOWED_COLLECTIONS,
      });
    }

    const missing = await this.missingCollectionResult(
      "fomoParserSampleDocuments",
      collectionName,
      { collectionsRead: [collectionName] }
    );
    if (missing) return missing;

    const limit = Math.min(this.limit(input.limit, 3), 20);
    const docs = await this.collection(collectionName)
      .find(this.safeMongoFilter(input.filter), {
        projection: this.projectionPreset(input.projectionPreset),
        maxTimeMS: MAX_TIME_MS,
      } as any)
      .limit(limit)
      .toArray();

    return this.result(
      "fomoParserSampleDocuments",
      {
        dbName: this.adminAiConfig.getParserDbName(),
        collectionName,
        projectionPreset: String(input.projectionPreset || "debug_compact"),
        documents: docs.map((doc) => this.compactDocumentPreview(doc)),
        summary: {
          returned: docs.length,
          warnings: docs.length ? [] : ["No documents matched this safe filter."],
        },
      },
      { collectionsRead: [collectionName], limit }
    );
  }

  async fomoParserSearchIcoProjects(input: Record<string, unknown>) {
    const limit = this.limit(input.limit, DEFAULT_LIMIT);
    const missing = await this.missingCollectionResult(
      "fomoParserSearchIcoProjects",
      "ico_projects",
      { limit }
    );
    if (missing) return missing;

    const query = String(input.query || "").trim();
    const projects = await this.collection("ico_projects")
      .find(this.legacyTextFilter(query, [
        "name",
        "symbol",
        "slug",
        "source",
        "sourceId",
        "sourceUrl",
        "detailUrl",
        "website",
        "url",
        "dropstabSlug",
        "icodropsSlug",
      ]), { projection: LEGACY_PROJECT_PROJECTION, maxTimeMS: MAX_TIME_MS } as any)
      .sort({ updatedAt: -1, lastParsedAt: -1, _id: -1 })
      .limit(limit)
      .toArray();

    return this.result(
      "fomoParserSearchIcoProjects",
      {
        filter: this.safeFilterEcho(input, ["query"]),
        projects: projects.map((project) => this.safeIcoProject(project)),
      },
      { limit, collectionsRead: ["ico_projects"] }
    );
  }

  async fomoParserGetIcoProject(input: Record<string, unknown>) {
    const lookup = String(input.id || input.slug || "").trim();
    if (!lookup) {
      return this.result("fomoParserGetIcoProject", {
        error: "id or slug is required",
      });
    }

    const missing = await this.missingCollectionResult(
      "fomoParserGetIcoProject",
      "ico_projects"
    );
    if (missing) return missing;

    const project = await this.collection("ico_projects").findOne(
      this.legacyIdOrSlugFilter(lookup, ["slug", "sourceId", "dropstabSlug", "icodropsSlug"]),
      { projection: LEGACY_PROJECT_PROJECTION, maxTimeMS: MAX_TIME_MS } as any
    );

    return this.result(
      "fomoParserGetIcoProject",
      project
        ? { project: this.safeIcoProject(project) }
        : { lookup, error: "ICO project not found" },
      { collectionsRead: ["ico_projects"] }
    );
  }

  async fomoParserSearchDropstabCoins(input: Record<string, unknown>) {
    const limit = this.limit(input.limit, DEFAULT_LIMIT);
    const query = String(input.query || "").trim();
    const collectionsRead: string[] = [];
    const results: Record<string, unknown>[] = [];

    for (const collectionName of [
      "dropstab_coin_catalog",
      "dropstab_coin_detail_data",
    ]) {
      if (!(await this.collectionExists(collectionName))) continue;
      collectionsRead.push(collectionName);
      const docs = await this.collection(collectionName)
        .find(this.legacyTextFilter(query, [
          "name",
          "coinName",
          "symbol",
          "coinSymbol",
          "slug",
          "coinSlug",
          "dropstabSlug",
          "currencyId",
          "detailUrl",
          "website",
          "url",
        ]), { projection: DROPSTAB_COIN_PROJECTION, maxTimeMS: MAX_TIME_MS } as any)
        .sort({ rank: 1, updatedAt: -1, _id: -1 })
        .limit(limit)
        .toArray();

      results.push(
        ...docs.map((doc) => this.safeDropstabCoin(doc, collectionName))
      );
    }

    return this.result(
      "fomoParserSearchDropstabCoins",
      {
        filter: this.safeFilterEcho(input, ["query"]),
        coins: results.slice(0, limit),
      },
      { limit, collectionsRead }
    );
  }

  async fomoParserSearchDropstabCatalog(input: Record<string, unknown>) {
    const limit = this.limit(input.limit, DEFAULT_LIMIT);
    const missing = await this.missingCollectionResult(
      "fomoParserSearchDropstabCatalog",
      "dropstab_coin_catalog",
      { limit }
    );
    if (missing) return missing;

    const query = String(input.query || "").trim();
    const docs = await this.collection("dropstab_coin_catalog")
      .find(this.legacyTextFilter(query, [
        "name",
        "coinName",
        "symbol",
        "coinSymbol",
        "slug",
        "coinSlug",
        "dropstabSlug",
        "currencyId",
        "detailUrl",
        "website",
        "url",
      ]), { projection: DROPSTAB_COIN_PROJECTION, maxTimeMS: MAX_TIME_MS } as any)
      .sort({ rank: 1, updatedAt: -1, _id: -1 })
      .limit(limit)
      .toArray();

    return this.result(
      "fomoParserSearchDropstabCatalog",
      {
        filter: this.safeFilterEcho(input, ["query"]),
        coins: docs.map((doc) => this.safeDropstabCoin(doc, "dropstab_coin_catalog")),
      },
      { limit, collectionsRead: ["dropstab_coin_catalog"] }
    );
  }

  async fomoParserGetDropstabCatalogItem(input: Record<string, unknown>) {
    return this.getDropstabCoinFromCollection(
      "fomoParserGetDropstabCatalogItem",
      "dropstab_coin_catalog",
      input
    );
  }

  async fomoParserGetDropstabDetailData(input: Record<string, unknown>) {
    return this.getDropstabCoinFromCollection(
      "fomoParserGetDropstabDetailData",
      "dropstab_coin_detail_data",
      input
    );
  }

  async fomoParserGetDropstabCoinDetail(input: Record<string, unknown>) {
    const lookup = String(input.id || input.slug || input.currencyId || "").trim();
    if (!lookup) {
      return this.result("fomoParserGetDropstabCoinDetail", {
        error: "id, slug, or currencyId is required",
      });
    }

    const collectionsRead: string[] = [];
    for (const collectionName of [
      "dropstab_coin_detail_data",
      "dropstab_coin_catalog",
    ]) {
      if (!(await this.collectionExists(collectionName))) continue;
      collectionsRead.push(collectionName);
      const doc = await this.collection(collectionName).findOne(
        this.legacyIdOrSlugFilter(lookup, [
          "slug",
          "coinSlug",
          "dropstabSlug",
          "currencyId",
        ]),
        { projection: DROPSTAB_COIN_PROJECTION, maxTimeMS: MAX_TIME_MS } as any
      );
      if (doc) {
        return this.result(
          "fomoParserGetDropstabCoinDetail",
          { coin: this.safeDropstabCoin(doc, collectionName) },
          { collectionsRead }
        );
      }
    }

    return this.result(
      "fomoParserGetDropstabCoinDetail",
      { lookup, error: "Dropstab coin detail not found" },
      { collectionsRead }
    );
  }

  async fomoParserSearchInvestors(input: Record<string, unknown>) {
    const limit = this.limit(input.limit, DEFAULT_LIMIT);
    const missing = await this.missingCollectionResult(
      "fomoParserSearchInvestors",
      "intel_investors",
      { limit }
    );
    if (missing) return missing;

    const query = String(input.query || "").trim();
    const investors = await this.collection("intel_investors")
      .find(this.legacyTextFilter(query, [
        "name",
        "slug",
        "key",
        "source",
        "sourceId",
        "detailUrl",
        "website",
        "url",
        "projects.name",
        "portfolio.name",
        "portfolio.projectName",
      ]), { projection: INVESTOR_PROJECTION, maxTimeMS: MAX_TIME_MS } as any)
      .sort({ sourceRank: 1, updatedAt: -1, _id: -1 })
      .limit(limit)
      .toArray();

    return this.result(
      "fomoParserSearchInvestors",
      {
        filter: this.safeFilterEcho(input, ["query"]),
        investors: investors.map((investor) => this.safeInvestor(investor)),
      },
      { limit, collectionsRead: ["intel_investors"] }
    );
  }

  async fomoParserGetInvestor(input: Record<string, unknown>) {
    const lookup = String(input.id || input.slug || input.key || "").trim();
    if (!lookup) {
      return this.result("fomoParserGetInvestor", {
        error: "id, key, or slug is required",
      });
    }

    const missing = await this.missingCollectionResult(
      "fomoParserGetInvestor",
      "intel_investors"
    );
    if (missing) return missing;

    const investor = await this.collection("intel_investors").findOne(
      this.legacyIdOrSlugFilter(lookup, ["key", "slug", "sourceId"]),
      { projection: INVESTOR_PROJECTION, maxTimeMS: MAX_TIME_MS } as any
    );

    return this.result(
      "fomoParserGetInvestor",
      investor
        ? { investor: this.safeInvestor(investor) }
        : { lookup, error: "Investor not found" },
      { collectionsRead: ["intel_investors"] }
    );
  }

  async fomoParserSearchFundraising(input: Record<string, unknown>) {
    const limit = this.limit(input.limit, DEFAULT_LIMIT);
    const missing = await this.missingCollectionResult(
      "fomoParserSearchFundraising",
      "intel_fundraising",
      { limit }
    );
    if (missing) return missing;

    const query = String(input.query || "").trim();
    const filters = [
      this.legacyTextFilter(query, [
        "project_name",
        "projectName",
        "project_slug",
        "projectSlug",
        "project_key",
        "projectKey",
        "name",
        "round_type",
        "roundType",
        "type",
        "source",
        "investors.name",
        "investors",
        "leadInvestors.name",
      ]),
      this.stringField(input.source, "source"),
    ].filter(Boolean) as Record<string, unknown>[];
    const fundraising = await this.collection("intel_fundraising")
      .find(this.andFilter(filters), {
        projection: FUNDRAISING_PROJECTION,
        maxTimeMS: MAX_TIME_MS,
      } as any)
      .sort({ date: -1, updatedAt: -1, _id: -1 })
      .limit(limit)
      .toArray();

    return this.result(
      "fomoParserSearchFundraising",
      {
        filter: this.safeFilterEcho(input, ["query", "source"]),
        fundraising: fundraising.map((item) => this.safeFundraising(item)),
      },
      { limit, collectionsRead: ["intel_fundraising"] }
    );
  }

  async fomoParserGetFundraisingContext(input: Record<string, unknown>) {
    const limit = this.limit(input.limit, DEFAULT_LIMIT);
    const lookup = String(input.id || "").trim();
    const query = String(input.query || "").trim();
    if (!lookup && !query) {
      return this.result("fomoParserGetFundraisingContext", {
        error: "id or query is required",
      });
    }

    const missing = await this.missingCollectionResult(
      "fomoParserGetFundraisingContext",
      "intel_fundraising",
      { limit }
    );
    if (missing) return missing;

    const filter = lookup
      ? this.legacyIdOrSlugFilter(lookup, ["key", "project_key", "projectKey"])
      : this.legacyTextFilter(query, [
          "project_name",
          "projectName",
          "project_slug",
          "projectSlug",
          "project_key",
          "projectKey",
          "name",
        ]);
    const rows = await this.collection("intel_fundraising")
      .find(filter, { projection: FUNDRAISING_PROJECTION, maxTimeMS: MAX_TIME_MS } as any)
      .sort({ date: -1, updatedAt: -1, _id: -1 })
      .limit(limit)
      .toArray();

    return this.result(
      "fomoParserGetFundraisingContext",
      {
        lookup: lookup || query,
        fundraising: rows.map((item) => this.safeFundraising(item)),
      },
      { limit, collectionsRead: ["intel_fundraising"] }
    );
  }

  async fomoParserSearchUnlocks(input: Record<string, unknown>) {
    const limit = this.limit(input.limit, DEFAULT_LIMIT);
    const missing = await this.missingCollectionResult(
      "fomoParserSearchUnlocks",
      "intel_unlocks",
      { limit }
    );
    if (missing) return missing;

    const query = String(input.query || "").trim();
    const filters = [
      this.legacyTextFilter(query, [
        "project_name",
        "projectName",
        "project_slug",
        "projectSlug",
        "project_key",
        "projectKey",
        "name",
        "symbol",
        "slug",
        "source",
      ]),
      this.stringField(input.source, "source"),
      this.dateRangeFilter(input.dateFrom, input.dateTo, ["unlock_date", "unlockDate", "date"]),
    ].filter(Boolean) as Record<string, unknown>[];
    const unlocks = await this.collection("intel_unlocks")
      .find(this.andFilter(filters), {
        projection: UNLOCK_PROJECTION,
        maxTimeMS: MAX_TIME_MS,
      } as any)
      .sort({ unlock_date: 1, date: 1, _id: -1 })
      .limit(limit)
      .toArray();

    return this.result(
      "fomoParserSearchUnlocks",
      {
        filter: this.safeFilterEcho(input, ["query", "source", "dateFrom", "dateTo"]),
        unlocks: unlocks.map((item) => this.safeUnlock(item)),
      },
      { limit, collectionsRead: ["intel_unlocks"] }
    );
  }

  async fomoParserGetUnlockContext(input: Record<string, unknown>) {
    const limit = this.limit(input.limit, DEFAULT_LIMIT);
    const lookup = String(input.id || "").trim();
    const query = String(input.query || "").trim();
    if (!lookup && !query) {
      return this.result("fomoParserGetUnlockContext", {
        error: "id or query is required",
      });
    }

    const missing = await this.missingCollectionResult(
      "fomoParserGetUnlockContext",
      "intel_unlocks",
      { limit }
    );
    if (missing) return missing;

    const filter = lookup
      ? this.legacyIdOrSlugFilter(lookup, ["key", "project_key", "projectKey"])
      : this.legacyTextFilter(query, [
          "project_name",
          "projectName",
          "project_slug",
          "projectSlug",
          "project_key",
          "projectKey",
          "name",
          "symbol",
          "slug",
        ]);
    const rows = await this.collection("intel_unlocks")
      .find(filter, { projection: UNLOCK_PROJECTION, maxTimeMS: MAX_TIME_MS } as any)
      .sort({ unlock_date: 1, date: 1, _id: -1 })
      .limit(limit)
      .toArray();

    return this.result(
      "fomoParserGetUnlockContext",
      {
        lookup: lookup || query,
        unlocks: rows.map((item) => this.safeUnlock(item)),
      },
      { limit, collectionsRead: ["intel_unlocks"] }
    );
  }

  async fomoParserFindProjectParserContext(input: Record<string, unknown>) {
    const limit = this.limit(input.limit, DEFAULT_LIMIT);
    const query = String(input.query || "").trim();
    if (!query) {
      return this.result("fomoParserFindProjectParserContext", {
        error: "query is required",
      });
    }

    const matches: Record<string, unknown>[] = [];
    const collectionsRead: string[] = [];
    const sources = [
      {
        collectionName: "ico_projects",
        fields: [
          "name",
          "symbol",
          "slug",
          "sourceId",
          "sourceUrl",
          "detailUrl",
          "website",
          "dropstabSlug",
          "icodropsSlug",
        ],
        projection: LEGACY_PROJECT_PROJECTION,
        mapper: (doc: Record<string, any>) =>
          this.projectContextMatch("ico_projects", doc, query),
      },
      {
        collectionName: "dropstab_coin_catalog",
        fields: [
          "name",
          "coinName",
          "symbol",
          "coinSymbol",
          "slug",
          "coinSlug",
          "dropstabSlug",
          "currencyId",
          "detailUrl",
        ],
        projection: DROPSTAB_COIN_PROJECTION,
        mapper: (doc: Record<string, any>) =>
          this.projectContextMatch("dropstab_coin_catalog", doc, query),
      },
      {
        collectionName: "dropstab_coin_detail_data",
        fields: [
          "name",
          "coinName",
          "symbol",
          "coinSymbol",
          "slug",
          "coinSlug",
          "dropstabSlug",
          "currencyId",
          "detailUrl",
          "website",
        ],
        projection: DROPSTAB_COIN_PROJECTION,
        mapper: (doc: Record<string, any>) =>
          this.projectContextMatch("dropstab_coin_detail_data", doc, query),
      },
    ];

    for (const source of sources) {
      if (!(await this.collectionExists(source.collectionName))) continue;
      collectionsRead.push(source.collectionName);
      const rows = await this.collection(source.collectionName)
        .find(this.legacyTextFilter(query, source.fields), {
          projection: source.projection,
          maxTimeMS: MAX_TIME_MS,
        } as any)
        .sort({ updatedAt: -1, _id: -1 })
        .limit(limit)
        .toArray();
      matches.push(...rows.map(source.mapper));
    }

    matches.sort(
      (left: any, right: any) =>
        (Number(right.confidence) || 0) - (Number(left.confidence) || 0)
    );

    return this.result(
      "fomoParserFindProjectParserContext",
      {
        query,
        matches: matches.slice(0, limit),
      },
      { limit, collectionsRead }
    );
  }

  async fomoParserFindTopDataSources(input: Record<string, unknown>) {
    const limit = this.limit(input.limit, 10);
    const collections = await this.collectionStatus(
      [...LEGACY_PARSER_COLLECTIONS],
      [],
      true
    );

    return this.result(
      "fomoParserFindTopDataSources",
      {
        items: collections
          .filter((item) => item.exists)
          .sort((left, right) => (right.count || 0) - (left.count || 0))
          .slice(0, limit)
          .map((item) => ({
            name: item.name,
            count: item.count,
            lastCreatedAt: item.lastCreatedAt,
            parserSourceRole: this.parserSourceRole(item.name),
          })),
        summary: {
          totalCollectionsFound: collections.filter((item) => item.exists).length,
          totalDocuments: collections.reduce(
            (total, item) => total + (Number(item.count) || 0),
            0
          ),
          warnings: [],
        },
      },
      { limit, collectionsRead: [...LEGACY_PARSER_COLLECTIONS] }
    );
  }

  async fomoParserDiscovery(input: Record<string, unknown>) {
    const domain = String(input.domain || "coverage").trim().toLowerCase();
    const limit = this.limit(input.limit, 10);
    const warnings: string[] = [];
    let items: Record<string, unknown>[] = [];
    let collectionsRead: string[] = [];

    switch (domain) {
      case "fundraising": {
        const result = await this.discoveryByGroupedCollection(
          "intel_fundraising",
          ["project_slug", "projectSlug", "project_key", "projectKey", "project_name", "projectName", "name"],
          "fundraising",
          limit
        );
        items = result.items;
        collectionsRead = result.collectionsRead;
        break;
      }
      case "investors": {
        const result = await this.discoveryByGroupedCollection(
          "intel_investors",
          ["slug", "key", "name"],
          "investors",
          limit
        );
        items = result.items;
        collectionsRead = result.collectionsRead;
        break;
      }
      case "unlocks": {
        const result = await this.discoveryByGroupedCollection(
          "intel_unlocks",
          ["project_slug", "projectSlug", "project_key", "projectKey", "name", "symbol", "slug"],
          "unlocks",
          limit
        );
        items = result.items;
        collectionsRead = result.collectionsRead;
        break;
      }
      case "dropstab": {
        const result = await this.discoveryByCollection(
          "dropstab_coin_detail_data",
          "dropstab",
          limit
        );
        items = result.items;
        collectionsRead = result.collectionsRead;
        break;
      }
      case "icodrops": {
        const result = await this.discoveryByCollection("ico_projects", "icodrops", limit);
        items = result.items;
        collectionsRead = result.collectionsRead;
        break;
      }
      case "v2_linking": {
        const result = await this.fomoParserFindV2LinkCandidates({
          sourceCollection: "ico_projects",
          limit,
          minConfidence: 0.72,
        });
        items = ((result.data as any).candidates || []).map((candidate: any) => ({
          ...candidate.parserRecord,
          parserSources: [candidate.parserRecord?.collectionName || "ico_projects"],
          counts: { v2Matches: candidate.v2Matches?.length || 0 },
          reviewPotentialScore: candidate.recommendation === "strong_match" ? 3 : 1,
          reasons: [`v2 recommendation: ${candidate.recommendation}`],
          riskFlags: candidate.riskFlags || [],
          sampleIds: { ico_projects: [candidate.parserRecord?.id].filter(Boolean) },
        }));
        collectionsRead = ["ico_projects", ...FOMO_V2_READ_COLLECTIONS];
        break;
      }
      case "data_quality":
      case "review_candidates": {
        const report = await this.fomoParserDataQualityReport({
          domain: "all",
          limit,
        });
        items = ((report.data as any).issues || []).map((issue: any) => ({
          name: issue.issueType,
          parserSources: [issue.collectionName],
          counts: { [issue.collectionName]: issue.count },
          reviewPotentialScore: issue.severity === "high" ? 3 : issue.severity === "medium" ? 2 : 1,
          reasons: [issue.recommendation],
          riskFlags: [issue.severity],
          sampleIds: {
            [issue.collectionName]: (issue.examples || []).map((example: any) => example.id).filter(Boolean),
          },
        }));
        collectionsRead = [...LEGACY_PARSER_STATS_COLLECTIONS];
        break;
      }
      case "projects":
      case "coverage":
      default: {
        const [ico, dropstab] = await Promise.all([
          this.discoveryByCollection("ico_projects", "icodrops", limit),
          this.discoveryByCollection("dropstab_coin_detail_data", "dropstab", limit),
        ]);
        items = [...ico.items, ...dropstab.items]
          .sort(
            (left: any, right: any) =>
              (Number(right.reviewPotentialScore) || 0) -
              (Number(left.reviewPotentialScore) || 0)
          )
          .slice(0, limit);
        collectionsRead = [...ico.collectionsRead, ...dropstab.collectionsRead];
        break;
      }
    }

    if (!items.length) {
      warnings.push(
        "No matching legacy parser documents found for this discovery domain."
      );
    }

    return this.result(
      "fomoParserDiscovery",
      {
        items,
        summary: {
          domain,
          totalMatched: items.length,
          warnings,
        },
      },
      { limit, collectionsRead }
    );
  }

  async fomoParserFindCrossSourceMatches(input: Record<string, unknown>) {
    const leftCollection = this.safeCrossSourceCollection(input.leftCollection);
    const rightCollection = this.safeCrossSourceCollection(input.rightCollection);
    if (!leftCollection || !rightCollection) {
      return this.result("fomoParserFindCrossSourceMatches", {
        error: "leftCollection and rightCollection must be legacy source collections",
        allowedCollections: CROSS_SOURCE_COLLECTIONS,
      });
    }

    const limit = this.limit(input.limit, DEFAULT_LIMIT);
    const minConfidence = Number(input.minConfidence || 0.72);
    const [leftRows, rightRows] = await Promise.all([
      this.identityRows(leftCollection, Math.min(limit * 25, 500)),
      this.identityRows(rightCollection, Math.min(limit * 40, 800)),
    ]);
    const matches: any[] = [];

    for (const left of leftRows) {
      for (const right of rightRows) {
        const scored = this.identityMatch(left, right);
        if (scored.confidence < minConfidence && scored.category !== "weak") continue;
        matches.push({
          left: this.matchSide(leftCollection, left),
          right: this.matchSide(rightCollection, right),
          confidence: scored.confidence,
          category: scored.category,
          reasonCodes: scored.reasonCodes,
          conflicts: scored.conflicts,
        });
      }
    }

    matches.sort((left, right) => right.confidence - left.confidence);
    const strongMatches = matches.filter((item) => item.category === "strong").slice(0, limit);
    const ambiguousMatches = matches.filter((item) => item.category === "ambiguous").slice(0, limit);
    const weakMatches = matches.filter((item) => item.category === "weak").slice(0, limit);
    const conflicts = matches.filter((item) => item.category === "conflict").slice(0, limit);

    return this.result(
      "fomoParserFindCrossSourceMatches",
      {
        strongMatches,
        ambiguousMatches,
        weakMatches,
        conflicts,
        matches: [...strongMatches, ...conflicts, ...ambiguousMatches].slice(0, limit),
        summary: {
          leftCollection,
          rightCollection,
          checked: leftRows.length * rightRows.length,
          matched: matches.length,
          strong: strongMatches.length,
          ambiguous: ambiguousMatches.length,
          weak: weakMatches.length,
          conflicts: conflicts.length,
          warnings: matches.length
            ? []
            : [
                "No cross-source matches reached minConfidence. This does not prove there is no overlap; inspect identity paths or lower minConfidence.",
              ],
        },
      },
      { collectionsRead: [leftCollection, rightCollection], limit }
    );
  }

  async fomoParserFindTopProjectsByCollection(input: Record<string, unknown>) {
    const collectionName = this.safeCrossSourceCollection(input.collectionName);
    if (!collectionName) {
      return this.result("fomoParserFindTopProjectsByCollection", {
        error: "collectionName must be a supported parser source collection",
        allowedCollections: CROSS_SOURCE_COLLECTIONS,
      });
    }

    const limit = this.limit(input.limit, DEFAULT_LIMIT);
    const groupBy = String(input.groupBy || "project").trim();
    const sample = await this.safeCollectionSample(collectionName, Math.min(limit * 20, 1000));
    const identityPaths = this.identityCandidatePaths(sample);
    const selectedPath = this.groupPathFor(groupBy, identityPaths, sample);

    if (!selectedPath) {
      return this.result(
        "fomoParserFindTopProjectsByCollection",
        {
          collectionName,
          groupBy,
          items: [],
          summary: {
            totalMatched: 0,
            warnings: [
              `No reliable ${groupBy} identity field found. Candidate paths: ${identityPaths.namePaths.concat(identityPaths.slugPaths, identityPaths.symbolPaths).slice(0, 20).join(", ") || "none"}`,
            ],
          },
        },
        { collectionsRead: [collectionName], limit }
      );
    }

    const groups = new Map<string, any>();
    for (const doc of sample) {
      const rawKey = this.valueAtPath(doc, selectedPath);
      const key = this.normalizeKey(rawKey);
      if (!key) continue;
      const existing =
        groups.get(key) ||
        {
          groupKey: key,
          identityPreview: {
            projectName: this.firstStringByPaths(doc, ["project.name", "projectName", "project_name", "coin.name", "name", "coinName"]),
            slug: this.firstStringByPaths(doc, ["slug", "coinSlug", "projectSlug", "project_slug", "dropstabSlug"]),
            symbol: this.firstStringByPaths(doc, ["symbol", "coinSymbol", "project.symbol"]),
            website: this.firstStringByPaths(doc, ["website", "project.website"]),
            sourceUrl: this.firstStringByPaths(doc, ["sourceUrl", "source_url", "detailUrl", "url"]),
            candidateFieldPaths: [selectedPath],
          },
          parserSources: [collectionName],
          counts: { records: 0, rounds: 0, investors: 0, [collectionName]: 0 },
          fundraisingPreview: {
            roundTypes: new Set<string>(),
            investorsPreview: new Set<string>(),
            amountsPreview: new Set<string>(),
            datesPreview: new Set<string>(),
          },
          reasons: [`Grouped by ${selectedPath}`],
          sampleIds: [] as string[],
          warnings: [] as string[],
        };
      existing.counts[collectionName] += 1;
      existing.counts.records += 1;
      const roundType = this.firstStringByPaths(doc, ["roundType", "round_type", "type"]);
      if (roundType) existing.fundraisingPreview.roundTypes.add(roundType);
      this.safeArray((doc as any).investors || (doc as any).leadInvestors)
        .slice(0, 8)
        .forEach((investor: any) => {
          const name = typeof investor === "string" ? investor : investor?.name || investor?.investorName;
          if (name) existing.fundraisingPreview.investorsPreview.add(String(name));
        });
      const amount = this.firstStringByPaths(doc, ["amountUsd", "amount", "raisedAmount"]);
      if (amount) existing.fundraisingPreview.amountsPreview.add(String(amount));
      const date = this.firstStringByPaths(doc, ["date", "announcedAt", "createdAt"]);
      if (date) existing.fundraisingPreview.datesPreview.add(String(date));
      existing.counts.rounds = existing.fundraisingPreview.roundTypes.size;
      existing.counts.investors = existing.fundraisingPreview.investorsPreview.size;
      const id = this.idString(doc._id);
      if (id && existing.sampleIds.length < 5) {
        existing.sampleIds.push(id);
      }
      groups.set(key, existing);
    }

    const items = Array.from(groups.values())
      .sort((left, right) => (right.counts.records || 0) - (left.counts.records || 0))
      .slice(0, limit)
      .map((item) => ({
        name: item.identityPreview.projectName,
        symbol: item.identityPreview.symbol,
        slug: item.identityPreview.slug,
        parserSources: item.parserSources,
        reasons: item.reasons,
        groupKey: item.groupKey,
        identityPreview: item.identityPreview,
        counts: item.counts,
        fundraisingPreview: {
          roundTypes: Array.from(item.fundraisingPreview.roundTypes).slice(0, 10),
          investorsPreview: Array.from(item.fundraisingPreview.investorsPreview).slice(0, 10),
          amountsPreview: Array.from(item.fundraisingPreview.amountsPreview).slice(0, 10),
          datesPreview: Array.from(item.fundraisingPreview.datesPreview).slice(0, 10),
        },
        sampleIds: item.sampleIds,
        warnings: item.warnings,
        reviewPotentialScore: item.counts[collectionName],
      }));

    return this.result(
      "fomoParserFindTopProjectsByCollection",
      {
        collectionName,
        groupBy,
        selectedPath,
        candidatePaths: identityPaths,
        items,
        summary: {
          collectionName,
          groupBy,
          totalGroups: items.length,
          warnings: items.length ? [] : ["No non-empty grouping keys found; inspect schema paths first."],
        },
      },
      { collectionsRead: [collectionName], limit }
    );
  }

  async fomoParserDataQualityReport(input: Record<string, unknown>) {
    const domain = String(input.domain || "all").trim().toLowerCase();
    const collectionNames = input.collectionName
      ? [this.safeProfileCollectionName(input.collectionName)].filter(Boolean)
      : this.collectionsForQualityDomain(domain);
    const limit = this.limit(input.limit, 10);
    const issues: any[] = [];
    const warnings: string[] = [];

    for (const collectionName of collectionNames) {
      const docs = await this.safeCollectionSample(collectionName, 300);
      if (!docs.length) {
        warnings.push(`${collectionName}: no documents sampled`);
        continue;
      }

      issues.push(
        ...this.qualityIssuesForCollection(collectionName, docs, limit)
      );
    }

    return this.result(
      "fomoParserDataQualityReport",
      {
        issues: issues.slice(0, limit * 5),
        summary: {
          totalIssues: issues.length,
          highSeverity: issues.filter((item) => item.severity === "high").length,
          warnings,
        },
      },
      { collectionsRead: collectionNames, limit }
    );
  }

  async fomoParserFindV2LinkCandidates(input: Record<string, unknown>) {
    const sourceCollection = this.safeV2LinkSourceCollection(input.sourceCollection);
    if (!sourceCollection) {
      return this.result("fomoParserFindV2LinkCandidates", {
        error: "sourceCollection must be a supported parser source collection",
        allowedCollections: V2_LINK_SOURCE_COLLECTIONS,
      });
    }

    const limit = this.limit(input.limit, DEFAULT_LIMIT);
    const minConfidence = Number(input.minConfidence || 0.72);
    const parserRows = await this.identityRows(sourceCollection, Math.min(limit * 10, 200), input.query);
    const v2Rows = await this.v2IdentityRows(Math.min(limit * 40, 800), input.query);
    const candidates = parserRows.slice(0, limit).map((parserRecord) => {
      const matches = v2Rows
        .map((v2) => ({ v2, score: this.identityMatch(parserRecord, v2) }))
        .filter((item) => item.score.confidence >= minConfidence)
        .sort((left, right) => right.score.confidence - left.score.confidence)
        .slice(0, 5);
      const recommendation =
        matches.length === 1 && matches[0].score.confidence >= 0.9
          ? "strong_match"
          : matches.length > 1
            ? "ambiguous"
            : matches.length
              ? "unresolved"
              : "unresolved";

      return {
        parserRecord: this.matchSide(sourceCollection, parserRecord),
        v2Matches: matches.map((item) => ({
          canonicalProjectId: this.idString((item.v2 as any)._id),
          name: (item.v2 as any).name,
          symbol: (item.v2 as any).symbol,
          slug: (item.v2 as any).slug,
          confidence: item.score.confidence,
          reasonCodes: item.score.reasonCodes,
          conflicts: item.score.conflicts,
        })),
        recommendation,
        riskFlags: recommendation === "ambiguous" ? ["multiple_v2_candidates"] : [],
      };
    });

    return this.result(
      "fomoParserFindV2LinkCandidates",
      {
        candidates,
        summary: {
          checked: parserRows.length,
          strongMatches: candidates.filter((item) => item.recommendation === "strong_match").length,
          ambiguous: candidates.filter((item) => item.recommendation === "ambiguous").length,
          unresolved: candidates.filter((item) => item.recommendation === "unresolved").length,
          conflicts: candidates.filter((item) => item.recommendation === "conflict").length,
          warnings: this.adminConnection?.db ? [] : ["fomo_dev connection is not available to this tool instance"],
        },
      },
      { collectionsRead: [sourceCollection, ...FOMO_V2_READ_COLLECTIONS], limit }
    );
  }

  async fomoParserCompareProjectContext(input: Record<string, unknown>) {
    const query = String(input.query || "").trim();
    if (!query) return this.result("fomoParserCompareProjectContext", { error: "query is required" });

    const [parserContext, v2Rows] = await Promise.all([
      this.parserProjectContext(query),
      this.v2IdentityRows(20, query),
    ]);
    const v2Project = v2Rows[0] || null;
    const diffs = this.contextDiffs(parserContext, v2Project);

    return this.result(
      "fomoParserCompareProjectContext",
      {
        query,
        parserContext,
        fomoV2Context: {
          canonicalProject: v2Project ? this.compactDocumentPreview(v2Project) : undefined,
          sourceEntities: [],
          fundingSummary: undefined,
          tokenomicsSummary: undefined,
          unlockSummary: undefined,
        },
        diffs,
        missingInV2: diffs.filter((item) => item.v2Value === undefined).map((item) => item.field),
        missingInParser: diffs.filter((item) => item.parserValue === undefined).map((item) => item.field),
        riskFlags: diffs.some((item) => item.severity === "high") ? ["high_severity_diff"] : [],
      },
      { collectionsRead: [...LEGACY_PARSER_STATS_COLLECTIONS, ...FOMO_V2_READ_COLLECTIONS] }
    );
  }

  async fomoAiToolHealthCheck(context: AdminAiToolExecutionContext = {}) {
    const accessMode = this.resolveAccessMode(context.accessMode);
    const parserRead = await this.canDbRead(this.parserConnection, "ico_projects");
    const parserWrite = this.canParserWriteByGuard();
    const fomoRead = await this.canDbRead(this.adminConnection, "canonical_projects");
    const fomoWrite = this.adminAiConfig.isWriteToolsEnabled();

    return this.result(
      "fomoAiToolHealthCheck",
      {
        aiChat: {
          enabled: true,
          openAiEnabled: "unknown",
          model: "configured by OPEN_AI_ADMIN_CHAT_MODEL",
          accessMode,
        },
        dbConnections: {
          fomoDev: {
            connected: this.adminConnection?.readyState === 1,
            dbName: this.adminAiConfig.getDbName?.() || "fomo_dev",
          },
          parserDb: {
            connected: this.isConnected(),
            dbName: this.adminAiConfig.getParserDbName(),
          },
        },
        permissions: {
          fomoDev: { canRead: fomoRead, canWrite: fomoWrite },
          parserDb: { canRead: parserRead, canWrite: parserWrite },
        },
        tools: this.getToolDefinitions().map((tool: any) => ({
          name: tool.name,
          enabled: true,
          access: this.isParserDevWriteTool(tool.name) ? "write_with_approval" : "read",
        })),
        warnings: [
          ...(parserWrite ? [] : ["parser_new_dev write is not available for the current Mongo user or env flags"]),
          ...(this.adminConnection?.db ? [] : ["fomo_dev connection is not available in this tool instance"]),
        ],
      },
      { collectionsRead: ["ico_projects"] }
    );
  }

  async fomoAiExplainLastToolError() {
    if (!this.adminConnection?.db) {
      return this.result("fomoAiExplainLastToolError", {
        lastError: null,
        likelyCause: "AI audit DB connection is not available to this tool instance.",
        recommendedFix: "Check ADMIN_AI_CONNECTION_NAME wiring and backend logs.",
      });
    }

    const lastError = await this.adminConnection.db
      .collection("ai_admin_tool_runs")
      .find({ error: { $exists: true, $ne: "" } }, {
        projection: { toolName: 1, error: 1, resultSummary: 1, targetDb: 1, collectionName: 1, createdAt: 1 },
        maxTimeMS: MAX_TIME_MS,
      } as any)
      .sort({ createdAt: -1, _id: -1 })
      .limit(1)
      .toArray();
    const error = lastError[0];

    return this.result("fomoAiExplainLastToolError", {
      lastError: error
        ? {
            toolName: error.toolName,
            errorCode: error.resultSummary?.errorCode || "TOOL_ERROR",
            message: error.error,
            targetDb: error.targetDb,
            collectionName: Array.isArray(error.collectionName) ? error.collectionName.join(", ") : error.collectionName,
          }
        : null,
      likelyCause: error ? this.likelyToolErrorCause(error) : "No saved tool error found.",
      recommendedFix: error ? this.recommendedToolErrorFix(error) : "Run the failing request again with tool observability open.",
    });
  }

  async fomoAiListCapabilities(context: AdminAiToolExecutionContext = {}) {
    const accessMode = this.resolveAccessMode(context.accessMode);
    return this.result("fomoAiListCapabilities", {
      accessMode,
      readCapabilities: [
        "Read fomo_dev with typed FOMO v2 tools and safe generic read tools",
        "Read parser_new_dev legacy parser collections",
        "Batch profile parser collections with fomoParserProfileCollections",
        "Run parser discovery/cross-source matching without projectId",
        "Compare parser DB context with FOMO v2 context",
      ],
      writeCapabilities: [
        "fomo_dev writes through typed/generic tools with approval flow",
        "parser_new_dev writes through parser dev tools when env and Mongo roles allow it",
      ],
      parserCapabilities: [
        "Legacy collections are first-class parser source/staging data",
        "Schema profiling, sample previews, data quality checks, cross-source matching",
        "Parser script tools are proposal/preview only in this chat path",
      ],
      forbiddenActions: [
        "No fomo_prod/fomo_live/fomo_market/prod/production/live DB access",
        "No raw shell, eval, runCommand, adminCommand, dropDatabase, createUser, grantRoles",
        "No deleteMany/updateMany without explicit confirm and guarded tool path",
        "No raw payload/HTML/secrets in tool output",
      ],
    });
  }

  async fomoParserListRunnableScripts() {
    return this.result(
      "fomoParserListRunnableScripts",
      {
        scripts: PARSER_SCRIPT_ALLOWLIST.map((script) =>
          this.safeScriptDefinition(script)
        ),
        safety: {
          arbitraryScriptsAllowed: false,
          shellStringExecAllowed: false,
          targetDbForced: "parser_new_dev",
          prodDbWritesAllowed: false,
          destructiveArgsBlocked: ["--clear=true", "--drop", "drop", "deleteMany"],
          executionAvailableFromChatTool: false,
          note: SCRIPT_PROPOSAL_BLOCKED_MESSAGE,
        },
      },
      { collectionsRead: [] }
    );
  }

  async fomoParserCreateRunProposal(input: Record<string, unknown>) {
    const scriptKey = String(input.scriptKey || "").trim();
    const script = PARSER_SCRIPT_ALLOWLIST.find(
      (item) => item.scriptKey === scriptKey
    );

    if (!script) {
      return this.result(
        "fomoParserCreateRunProposal",
        {
          error: "Parser script is not allowlisted",
          scriptKey,
          allowedScriptKeys: PARSER_SCRIPT_ALLOWLIST.map((item) => item.scriptKey),
        },
        { collectionsRead: [] }
      );
    }

    const normalized = this.normalizeScriptArgs(script, input.args || {});
    if (normalized.error) {
      return this.result(
        "fomoParserCreateRunProposal",
        {
          scriptKey,
          error: normalized.error,
          warnings: normalized.warnings,
        },
        { collectionsRead: [] }
      );
    }

    const reason = String(input.reason || "").trim();
    const proposalId = this.proposalId(scriptKey, normalized.args, reason);

    return this.result(
      "fomoParserCreateRunProposal",
      {
        proposalId,
        scriptKey,
        label: script.label,
        normalizedArgs: normalized.args,
        riskLevel: script.writesParserDb ? 3 : 1,
        requiresEmailConfirmation: script.requiresEmailConfirmation,
        emailConfirmationActive: false,
        requiresAdminJwt: script.requiresAdminJwt,
        canExecuteFromChatTool: false,
        warnings: [
          ...normalized.warnings,
          SCRIPT_PROPOSAL_BLOCKED_MESSAGE,
        ],
        forcedEnv: this.safeForcedParserEnv(),
      },
      { collectionsRead: [] }
    );
  }

  async fomoParserSendRunConfirmationCode() {
    return this.blockedParserRunTool("fomoParserSendRunConfirmationCode", {
      confirmationEmail: "boikod887@gmail.com",
      otpTtlMinutes: 10,
      confirmationTtlHours: 24,
    });
  }

  async fomoParserConfirmRunCode() {
    return this.blockedParserRunTool("fomoParserConfirmRunCode", {
      codeAcceptedInChatTool: false,
    });
  }

  async fomoParserExecuteApprovedRun() {
    return this.blockedParserRunTool("fomoParserExecuteApprovedRun", {
      processStarted: false,
      requiresAdminJwt: true,
      requiresEmailConfirmation: true,
    });
  }

  async fomoParserGetRunStatus(input: Record<string, unknown>) {
    return this.result(
      "fomoParserGetRunStatus",
      {
        proposalId: String(input.proposalId || "").trim() || undefined,
        status: "blocked",
        message: SCRIPT_PROPOSAL_BLOCKED_MESSAGE,
      },
      { collectionsRead: [] }
    );
  }

  async fomoParserListRecentRuns(input: Record<string, unknown>) {
    return this.result(
      "fomoParserListRecentRuns",
      {
        runs: [],
        status: "blocked",
        message:
          "Recent parser run persistence is not available from the LLM tool path yet.",
      },
      { limit: this.limit(input.limit, 10), collectionsRead: [] }
    );
  }

  async fomoParserListRuns(input: Record<string, unknown>) {
    const limit = this.limit(input.limit, DEFAULT_LIMIT);
    const missing = await this.missingCollectionResult("fomoParserListRuns", "parser_runs", { limit });
    if (missing) return missing;

    const filter = this.compactAndFilter([
      this.stringOrFields(input.sourceKey, ["sourceKey", "source", "source_key"]),
      this.stringOrFields(input.parserKey, ["parserKey", "parser_key"]),
      this.stringField(input.status, "status"),
    ]);

    const runs = await this.collection("parser_runs")
      .find(filter, { projection: RUN_PROJECTION, maxTimeMS: MAX_TIME_MS } as any)
      .sort({ createdAt: -1, _id: -1 })
      .limit(limit)
      .toArray();

    return this.result(
      "fomoParserListRuns",
      {
        filter: this.safeFilterEcho(input, ["sourceKey", "parserKey", "status"]),
        runs: runs.map((run) => this.safeRun(run)),
      },
      { limit, collectionsRead: ["parser_runs"] }
    );
  }

  async fomoParserGetRunContext(input: Record<string, unknown>) {
    const runId = String(input.runId || input.id || "").trim();
    if (!runId) {
      return this.result("fomoParserGetRunContext", {
        error: "runId or id is required",
      });
    }

    const missing = await this.missingCollectionResult("fomoParserGetRunContext", "parser_runs");
    if (missing) return missing;

    const run = await this.collection("parser_runs").findOne(this.idOrKeyFilter(runId, "runId"), {
      projection: RUN_PROJECTION,
      maxTimeMS: MAX_TIME_MS,
    } as any);

    if (!run) {
      return this.result(
        "fomoParserGetRunContext",
        { runId, error: "Parser run not found" },
        { collectionsRead: ["parser_runs"] }
      );
    }

    const linkedCounts = {
      rawDocuments: await this.countLinked("parser_raw_documents", run),
      extractions: await this.countLinked("parser_extractions", run),
      identityCandidates: await this.countLinked("parser_identity_candidates", run),
      reviewCases: await this.countLinked("parser_review_cases", run),
      aiReviews: await this.countLinked("parser_ai_reviews", run),
    };

    return this.result(
      "fomoParserGetRunContext",
      {
        run: this.safeRun(run),
        linkedCounts,
      },
      {
        collectionsRead: [
          "parser_runs",
          "parser_raw_documents",
          "parser_extractions",
          "parser_identity_candidates",
          "parser_review_cases",
          "parser_ai_reviews",
        ],
      }
    );
  }

  async fomoParserGetRawDocument(input: Record<string, unknown>) {
    const rawId = String(input.rawId || input.id || "").trim();
    if (!rawId) {
      return this.result("fomoParserGetRawDocument", {
        error: "rawId or id is required",
      });
    }

    const missing = await this.missingCollectionResult("fomoParserGetRawDocument", "parser_raw_documents");
    if (missing) return missing;

    const rawDocument = await this.collection("parser_raw_documents").findOne(
      this.idOrKeyFilter(rawId, "rawId"),
      { projection: RAW_DOCUMENT_PROJECTION, maxTimeMS: MAX_TIME_MS } as any
    );

    return this.result(
      "fomoParserGetRawDocument",
      rawDocument
        ? { rawDocument: this.safeRawDocument(rawDocument) }
        : { rawId, error: "Parser raw document not found" },
      { collectionsRead: ["parser_raw_documents"] }
    );
  }

  async fomoParserSearchRawDocuments(input: Record<string, unknown>) {
    const limit = this.limit(input.limit, DEFAULT_LIMIT);
    const missing = await this.missingCollectionResult("fomoParserSearchRawDocuments", "parser_raw_documents", { limit });
    if (missing) return missing;

    const filter = this.compactAndFilter([
      this.stringOrFields(input.sourceKey, ["sourceKey", "source", "source_key"]),
      this.stringOrFields(input.sourceUrl, ["sourceUrl", "source_url", "url"]),
      this.stringOrFields(input.sourceEntityId, ["sourceEntityId", "source_entity_id"]),
      this.stringField(input.status, "status"),
    ]);

    const rawDocuments = await this.collection("parser_raw_documents")
      .find(filter, { projection: RAW_DOCUMENT_PROJECTION, maxTimeMS: MAX_TIME_MS } as any)
      .sort({ createdAt: -1, _id: -1 })
      .limit(limit)
      .toArray();

    return this.result(
      "fomoParserSearchRawDocuments",
      {
        filter: this.safeFilterEcho(input, ["sourceKey", "sourceUrl", "sourceEntityId", "status"]),
        rawDocuments: rawDocuments.map((document) => this.safeRawDocument(document)),
      },
      { limit, collectionsRead: ["parser_raw_documents"] }
    );
  }

  async fomoParserListExtractions(input: Record<string, unknown>) {
    const limit = this.limit(input.limit, DEFAULT_LIMIT);
    const missing = await this.missingCollectionResult("fomoParserListExtractions", "parser_extractions", { limit });
    if (missing) return missing;

    const filter = this.compactAndFilter([
      this.runRefFilter(input.runId),
      this.stringOrFields(input.rawDocumentId, ["rawDocumentId", "rawId"]),
      this.stringOrFields(input.sourceKey, ["sourceKey", "source"]),
      this.stringField(input.status, "status"),
    ]);

    const extractions = await this.collection("parser_extractions")
      .find(filter, { projection: EXTRACTION_PROJECTION, maxTimeMS: MAX_TIME_MS } as any)
      .sort({ createdAt: -1, _id: -1 })
      .limit(limit)
      .toArray();

    return this.result(
      "fomoParserListExtractions",
      {
        filter: this.safeFilterEcho(input, ["runId", "rawDocumentId", "sourceKey", "status"]),
        extractions: extractions.map((extraction) => this.safeExtraction(extraction)),
      },
      { limit, collectionsRead: ["parser_extractions"] }
    );
  }

  async fomoParserGetReviewCase(input: Record<string, unknown>) {
    const caseId = String(input.caseId || input.id || "").trim();
    if (!caseId) {
      return this.result("fomoParserGetReviewCase", {
        error: "caseId or id is required",
      });
    }

    const missing = await this.missingCollectionResult("fomoParserGetReviewCase", "parser_review_cases");
    if (missing) return missing;

    const reviewCase = await this.collection("parser_review_cases").findOne(
      this.idOrKeyFilter(caseId, "caseId"),
      { projection: REVIEW_CASE_PROJECTION, maxTimeMS: MAX_TIME_MS } as any
    );

    return this.result(
      "fomoParserGetReviewCase",
      reviewCase
        ? { reviewCase: this.safeReviewCase(reviewCase) }
        : { caseId, error: "Parser review case not found" },
      { collectionsRead: ["parser_review_cases"] }
    );
  }

  async fomoParserListReviewCases(input: Record<string, unknown>) {
    const limit = this.limit(input.limit, DEFAULT_LIMIT);
    const missing = await this.missingCollectionResult("fomoParserListReviewCases", "parser_review_cases", { limit });
    if (missing) return missing;

    const filter = this.compactAndFilter([
      this.stringOrFields(input.sourceKey, ["sourceKey", "source"]),
      this.stringField(input.status, "status"),
      this.stringField(input.reason, "reason"),
    ]);

    const reviewCases = await this.collection("parser_review_cases")
      .find(filter, { projection: REVIEW_CASE_PROJECTION, maxTimeMS: MAX_TIME_MS } as any)
      .sort({ createdAt: -1, _id: -1 })
      .limit(limit)
      .toArray();

    return this.result(
      "fomoParserListReviewCases",
      {
        filter: this.safeFilterEcho(input, ["sourceKey", "status", "reason"]),
        reviewCases: reviewCases.map((reviewCase) => this.safeReviewCase(reviewCase)),
      },
      { limit, collectionsRead: ["parser_review_cases"] }
    );
  }

  async fomoParserDevListCollections() {
    const collections = await this.parserConnection.db
      .listCollections({}, { nameOnly: true })
      .toArray();
    const names = collections
      .map((item: any) => String(item.name || ""))
      .filter((name) => this.isSafeGenericCollectionName(name))
      .sort();

    return this.result(
      "fomoParserDevListCollections",
      {
        dbName: this.adminAiConfig.getParserDbName(),
        collections: names,
        summary: { count: names.length },
      },
      { collectionsRead: names.slice(0, 50) }
    );
  }

  async fomoParserDevCollectionStats(input: Record<string, unknown>) {
    const collectionName = this.safeGenericCollectionName(input.collectionName);
    const limit = this.genericLimit(input.limit);
    const names = collectionName
      ? [collectionName]
      : (await this.parserConnection.db.listCollections({}, { nameOnly: true }).toArray())
          .map((item: any) => String(item.name || ""))
          .filter((name) => this.isSafeGenericCollectionName(name))
          .sort()
          .slice(0, limit);
    const stats = [];

    for (const name of names) {
      const count = await this.collection(name).countDocuments({}, { maxTimeMS: MAX_TIME_MS });
      stats.push({ name, count });
    }

    return this.result(
      "fomoParserDevCollectionStats",
      {
        dbName: this.adminAiConfig.getParserDbName(),
        collections: stats,
        summary: {
          collectionsFound: stats.length,
          totalDocuments: stats.reduce((sum, item) => sum + item.count, 0),
        },
      },
      { collectionsRead: names }
    );
  }

  async fomoParserDevFind(input: Record<string, unknown>) {
    const collectionName = this.safeGenericCollectionName(input.collectionName);
    const limit = this.genericLimit(input.limit);
    if (!collectionName) return this.genericCollectionError("fomoParserDevFind");
    const documents = await this.collection(collectionName)
      .find(this.safeMongoFilter(input.filter), {
        projection: this.safeProjection(input.projection),
        maxTimeMS: MAX_TIME_MS,
      } as any)
      .sort(this.safeSort(input.sort))
      .limit(limit)
      .toArray();

    return this.result(
      "fomoParserDevFind",
      {
        dbName: this.adminAiConfig.getParserDbName(),
        collectionName,
        documents: documents.map((doc) => this.compactDocumentPreview(doc)),
      },
      { limit, collectionsRead: [collectionName] }
    );
  }

  async fomoParserDevFindOne(input: Record<string, unknown>) {
    const collectionName = this.safeGenericCollectionName(input.collectionName);
    if (!collectionName) return this.genericCollectionError("fomoParserDevFindOne");
    const document = await this.collection(collectionName).findOne(
      this.safeMongoFilter(input.filter),
      {
        projection: this.safeProjection(input.projection),
        sort: this.safeSort(input.sort),
        maxTimeMS: MAX_TIME_MS,
      } as any
    );

    return this.result(
      "fomoParserDevFindOne",
      {
        dbName: this.adminAiConfig.getParserDbName(),
        collectionName,
        document: document ? this.compactDocumentPreview(document) : null,
      },
      { collectionsRead: [collectionName] }
    );
  }

  async fomoParserDevCount(input: Record<string, unknown>) {
    const collectionName = this.safeGenericCollectionName(input.collectionName);
    if (!collectionName) return this.genericCollectionError("fomoParserDevCount");
    const count = await this.collection(collectionName).countDocuments(
      this.safeMongoFilter(input.filter),
      { maxTimeMS: MAX_TIME_MS }
    );
    return this.result(
      "fomoParserDevCount",
      { dbName: this.adminAiConfig.getParserDbName(), collectionName, count },
      { collectionsRead: [collectionName] }
    );
  }

  async fomoParserDevAggregate(input: Record<string, unknown>) {
    const collectionName = this.safeGenericCollectionName(input.collectionName);
    if (!collectionName) return this.genericCollectionError("fomoParserDevAggregate");
    const pipeline = this.safeAggregatePipeline(input.pipeline, this.genericLimit(input.limit));
    const documents = await this.collection(collectionName)
      .aggregate(pipeline, { maxTimeMS: GENERIC_AGGREGATE_MAX_TIME_MS })
      .toArray();
    return this.result(
      "fomoParserDevAggregate",
      {
        dbName: this.adminAiConfig.getParserDbName(),
        collectionName,
        documents: documents.map((doc) => this.compactSafeValue(doc)),
      },
      { limit: this.genericLimit(input.limit), collectionsRead: [collectionName] }
    );
  }

  async fomoParserDevCreateWriteProposal(input: Record<string, unknown>) {
    return this.fomoParserDevExecuteApprovedWrite({
      ...input,
      dryRun: this.isDryRun(input),
    });
  }

  async fomoParserDevPreviewWriteDiff(input: Record<string, unknown>) {
    return this.fomoParserDevExecuteApprovedWrite({
      ...input,
      dryRun: true,
      confirm: false,
    });
  }

  async fomoParserDevExecuteApprovedWrite(input: Record<string, unknown>) {
    const operation = String(input.operation || "").trim();
    const collectionName = this.safeGenericCollectionName(input.collectionName);
    if (!collectionName) return this.genericCollectionError("fomoParserDevExecuteApprovedWrite");
    if (!["insertOne", "updateOne", "replaceOne"].includes(operation)) {
      return this.result("fomoParserDevExecuteApprovedWrite", {
        error: "operation must be insertOne, updateOne, or replaceOne",
        errorCode: "UNSUPPORTED_WRITE_OPERATION",
      });
    }

    if (operation === "insertOne") {
      return this.renameToolResult(
        await this.fomoParserDevInsertOne({ ...input, collectionName }),
        "fomoParserDevExecuteApprovedWrite"
      );
    }

    const filter = this.safeMongoFilter(input.filter);
    if (!this.isStrictWriteFilter(filter)) {
      return this.result("fomoParserDevExecuteApprovedWrite", {
        error: "Strict filter is required for parser write proposal execution",
        errorCode: "STRICT_FILTER_REQUIRED",
        plannedChanges: [],
      });
    }

    if (operation === "updateOne") {
      return this.renameToolResult(
        await this.fomoParserDevUpdateOne({ ...input, collectionName, filter }),
        "fomoParserDevExecuteApprovedWrite"
      );
    }

    const dryRun = this.isDryRun(input);
    const confirm = Boolean(input.confirm);
    const document = this.safeGenericDocument(input.document);
    if (dryRun) {
      return this.genericWritePlan("fomoParserDevExecuteApprovedWrite", collectionName, "replaceOne", {
        filter,
        document,
      });
    }

    const result = await (this.collection(collectionName) as any).replaceOne(filter, {
      ...document,
      aiAdminUpdatedAt: new Date(),
    });
    return this.parserWriteResult("fomoParserDevExecuteApprovedWrite", collectionName, {
      dryRun,
      confirm,
      status: "done",
      operation: "replaceOne",
      ...this.mongoWriteCounts(result),
      affectedIds: this.upsertedIds(result),
    });
  }

  async fomoParserDevInsertOne(input: Record<string, unknown>) {
    const collectionName = this.safeGenericCollectionName(input.collectionName);
    const dryRun = this.isDryRun(input);
    const confirm = Boolean(input.confirm);
    const document = this.safeGenericDocument(input.document);
    if (!collectionName) return this.genericCollectionError("fomoParserDevInsertOne");
    if (dryRun) return this.genericWritePlan("fomoParserDevInsertOne", collectionName, "insertOne", { document });

    const result = await this.collection(collectionName).insertOne({
      ...document,
      aiAdminCreatedAt: new Date(),
    });
    return this.parserWriteResult("fomoParserDevInsertOne", collectionName, {
      dryRun,
      confirm,
      status: "done",
      operation: "insertOne",
      createdCount: 1,
      updatedCount: 0,
      modifiedCount: 0,
      affectedIds: [this.idString(result.insertedId)].filter(Boolean),
    });
  }

  async fomoParserDevUpdateOne(input: Record<string, unknown>) {
    return this.fomoParserDevUpdateGeneric("fomoParserDevUpdateOne", input, false);
  }

  async fomoParserDevUpdateMany(input: Record<string, unknown>) {
    if (!input.confirm && input.dryRun === false) {
      return this.result("fomoParserDevUpdateMany", {
        error: "confirm=true is required for updateMany execution",
        errorCode: "CONFIRM_REQUIRED_FOR_UPDATE_MANY",
      });
    }
    return this.fomoParserDevUpdateGeneric("fomoParserDevUpdateMany", input, true);
  }

  async fomoParserDevDeleteOne(input: Record<string, unknown>) {
    return this.fomoParserDevDeleteGeneric("fomoParserDevDeleteOne", input, false);
  }

  async fomoParserDevDeleteMany(input: Record<string, unknown>) {
    if (!input.confirm && input.dryRun === false) {
      return this.result("fomoParserDevDeleteMany", {
        error: "confirm=true is required for deleteMany execution",
        errorCode: "CONFIRM_REQUIRED_FOR_DELETE_MANY",
      });
    }
    return this.fomoParserDevDeleteGeneric("fomoParserDevDeleteMany", input, true);
  }

  private async dispatchTool(
    name: FomoParserAiToolName,
    input: Record<string, unknown>,
    context: AdminAiToolExecutionContext = {}
  ) {
    switch (name) {
      case "fomoParserDbStatus":
        return this.fomoParserDbStatus();
      case "fomoParserCollectionStats":
        return this.fomoParserCollectionStats(input);
      case "fomoParserSearchIcoProjects":
        return this.fomoParserSearchIcoProjects(input);
      case "fomoParserGetIcoProject":
        return this.fomoParserGetIcoProject(input);
      case "fomoParserSearchDropstabCatalog":
        return this.fomoParserSearchDropstabCatalog(input);
      case "fomoParserGetDropstabCatalogItem":
        return this.fomoParserGetDropstabCatalogItem(input);
      case "fomoParserGetDropstabDetailData":
        return this.fomoParserGetDropstabDetailData(input);
      case "fomoParserSearchDropstabCoins":
        return this.fomoParserSearchDropstabCoins(input);
      case "fomoParserGetDropstabCoinDetail":
        return this.fomoParserGetDropstabCoinDetail(input);
      case "fomoParserSearchInvestors":
        return this.fomoParserSearchInvestors(input);
      case "fomoParserGetInvestor":
        return this.fomoParserGetInvestor(input);
      case "fomoParserSearchFundraising":
        return this.fomoParserSearchFundraising(input);
      case "fomoParserGetFundraisingContext":
        return this.fomoParserGetFundraisingContext(input);
      case "fomoParserSearchUnlocks":
        return this.fomoParserSearchUnlocks(input);
      case "fomoParserGetUnlockContext":
        return this.fomoParserGetUnlockContext(input);
      case "fomoParserFindProjectParserContext":
        return this.fomoParserFindProjectParserContext(input);
      case "fomoParserFindTopDataSources":
        return this.fomoParserFindTopDataSources(input);
      case "fomoParserDiscovery":
        return this.fomoParserDiscovery(input);
      case "fomoParserProfileCollections":
        return this.fomoParserProfileCollections(input);
      case "fomoParserInspectCollectionSchema":
        return this.fomoParserInspectCollectionSchema(input);
      case "fomoParserSampleDocuments":
        return this.fomoParserSampleDocuments(input);
      case "fomoParserFindCrossSourceMatches":
        return this.fomoParserFindCrossSourceMatches(input);
      case "fomoParserFindTopProjectsByCollection":
        return this.fomoParserFindTopProjectsByCollection(input);
      case "fomoParserDataQualityReport":
        return this.fomoParserDataQualityReport(input);
      case "fomoParserFindV2LinkCandidates":
        return this.fomoParserFindV2LinkCandidates(input);
      case "fomoParserCompareProjectContext":
        return this.fomoParserCompareProjectContext(input);
      case "fomoAiToolHealthCheck":
        return this.fomoAiToolHealthCheck(context);
      case "fomoAiExplainLastToolError":
        return this.fomoAiExplainLastToolError();
      case "fomoAiListCapabilities":
        return this.fomoAiListCapabilities(context);
      case "fomoParserListRunnableScripts":
        return this.fomoParserListRunnableScripts();
      case "fomoParserCreateRunProposal":
        return this.fomoParserCreateRunProposal(input);
      case "fomoParserSendRunConfirmationCode":
        return this.fomoParserSendRunConfirmationCode();
      case "fomoParserConfirmRunCode":
        return this.fomoParserConfirmRunCode();
      case "fomoParserExecuteApprovedRun":
        return this.fomoParserExecuteApprovedRun();
      case "fomoParserGetRunStatus":
        return this.fomoParserGetRunStatus(input);
      case "fomoParserListRecentRuns":
        return this.fomoParserListRecentRuns(input);
      case "fomoParserListRuns":
        return this.fomoParserListRuns(input);
      case "fomoParserGetRunContext":
        return this.fomoParserGetRunContext(input);
      case "fomoParserGetRawDocument":
        return this.fomoParserGetRawDocument(input);
      case "fomoParserSearchRawDocuments":
        return this.fomoParserSearchRawDocuments(input);
      case "fomoParserListExtractions":
        return this.fomoParserListExtractions(input);
      case "fomoParserGetReviewCase":
        return this.fomoParserGetReviewCase(input);
      case "fomoParserListReviewCases":
        return this.fomoParserListReviewCases(input);
      case "fomoParserDevListCollections":
        return this.fomoParserDevListCollections();
      case "fomoParserDevCollectionStats":
        return this.fomoParserDevCollectionStats(input);
      case "fomoParserDevFind":
        return this.fomoParserDevFind(input);
      case "fomoParserDevFindMany":
        return this.renameToolResult(await this.fomoParserDevFind(input), name);
      case "fomoParserDevFindOne":
        return this.fomoParserDevFindOne(input);
      case "fomoParserDevCount":
        return this.fomoParserDevCount(input);
      case "fomoParserDevAggregate":
        return this.fomoParserDevAggregate(input);
      case "fomoParserDevAggregateReadOnly":
        return this.renameToolResult(await this.fomoParserDevAggregate(input), name);
      case "fomoParserDevCreateWriteProposal":
        return this.fomoParserDevCreateWriteProposal(input);
      case "fomoParserDevPreviewWriteDiff":
        return this.fomoParserDevPreviewWriteDiff(input);
      case "fomoParserDevExecuteApprovedWrite":
        return this.fomoParserDevExecuteApprovedWrite(input);
      case "fomoParserDevInsertOne":
        return this.fomoParserDevInsertOne(input);
      case "fomoParserDevUpdateOne":
        return this.fomoParserDevUpdateOne(input);
      case "fomoParserDevUpdateMany":
        return this.fomoParserDevUpdateMany(input);
      case "fomoParserDevDeleteOne":
        return this.fomoParserDevDeleteOne(input);
      case "fomoParserDevDeleteMany":
        return this.fomoParserDevDeleteMany(input);
      default:
        return this.result(name, { error: "Parser tool not implemented" });
    }
  }

  private resolveAccessMode(value: unknown): AdminAiAccessMode {
    return this.adminAiConfig.normalizeAccessMode(
      value || this.adminAiConfig.getDefaultAccessMode()
    );
  }

  private async pendingOrBlockedWriteResult(
    name: FomoParserAiToolName,
    input: Record<string, unknown>,
    accessMode: AdminAiAccessMode,
    context: AdminAiToolExecutionContext
  ) {
    if (!this.isParserDevWriteTool(name) || context.approvalExecution) return null;

    if (accessMode === "read_only") {
      return this.result(
        name,
        {
          status: "blocked",
          error: "WRITE_TOOLS_DISABLED_BY_ACCESS_MODE",
          errorCode: "WRITE_TOOLS_DISABLED_BY_ACCESS_MODE",
          requiresApproval: false,
          toolName: name,
          targetDb: this.adminAiConfig.getParserDbName(),
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

    this.adminAiConfig.ensureAiToolDbAccess({
      dbName: this.adminAiConfig.getParserDbName(),
      access: "write",
      parserDb: true,
      accessMode,
    });

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
        targetDb: this.adminAiConfig.getParserDbName(),
        collectionName: this.collectionsForTool(name),
        operation: this.operationForTool(name),
        plannedChanges: data.plannedChanges || [],
        summary: {
          dryRun: true,
          targetDb: this.adminAiConfig.getParserDbName(),
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

  private isParserDevWriteTool(name: FomoParserAiToolName) {
    return (FOMO_PARSER_DEV_WRITE_TOOL_NAMES as readonly string[]).includes(name);
  }

  private isParserDevGenericTool(name: FomoParserAiToolName) {
    return String(name).startsWith("fomoParserDev");
  }

  private isDryRun(input: Record<string, unknown>) {
    return input.dryRun !== false;
  }

  private operationForTool(name: FomoParserAiToolName) {
    if (String(name).includes("InsertOne")) return "insertOne";
    if (String(name).includes("UpdateOne")) return "updateOne";
    if (String(name).includes("UpdateMany")) return "updateMany";
    if (String(name).includes("DeleteOne")) return "deleteOne";
    if (String(name).includes("DeleteMany")) return "deleteMany";
    if (String(name).includes("CreateWriteProposal")) return "writeProposal";
    if (String(name).includes("ExecuteApprovedWrite")) return "approvedWrite";
    return "read";
  }

  private async fomoParserDevUpdateGeneric(
    tool: "fomoParserDevUpdateOne" | "fomoParserDevUpdateMany",
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
      ? await this.collection(collectionName).updateMany(filter, update)
      : await this.collection(collectionName).updateOne(filter, update, {
          upsert: Boolean(input.upsert),
        });

    return this.parserWriteResult(tool, collectionName, {
      dryRun,
      confirm,
      status: "done",
      operation,
      ...this.mongoWriteCounts(result),
      affectedIds: this.upsertedIds(result),
    });
  }

  private async fomoParserDevDeleteGeneric(
    tool: "fomoParserDevDeleteOne" | "fomoParserDevDeleteMany",
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
      ? await this.collection(collectionName).deleteMany(filter)
      : await this.collection(collectionName).deleteOne(filter);

    return this.parserWriteResult(tool, collectionName, {
      dryRun,
      confirm,
      status: "done",
      operation,
      createdCount: 0,
      updatedCount: 0,
      modifiedCount: Number(result.deletedCount || 0),
      affectedIds: [],
    });
  }

  private parserWriteResult(
    tool: string,
    collectionName: string,
    data: Record<string, unknown>
  ) {
    return this.result(
      tool,
      {
        dbName: this.adminAiConfig.getParserDbName(),
        targetDb: this.adminAiConfig.getParserDbName(),
        createdCount: 0,
        updatedCount: 0,
        modifiedCount: 0,
        affectedIds: [],
        warnings: [],
        ...data,
      },
      {
        collectionsRead: [collectionName],
        writeDbTarget: this.adminAiConfig.getParserDbName(),
        parserWriteToolsEnabled: this.adminAiConfig.isParserWriteToolsEnabled(),
      }
    );
  }

  private renameToolResult(result: FomoV2AiToolResult, tool: string): FomoV2AiToolResult {
    return {
      ...result,
      tool,
    };
  }

  private genericWritePlan(
    tool: string,
    collectionName: string,
    operation: string,
    payload: Record<string, unknown>
  ) {
    return this.parserWriteResult(tool, collectionName, {
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
    });
  }

  private genericCollectionError(tool: string) {
    return this.result(tool, {
      error: "Safe collectionName is required",
      errorCode: "INVALID_COLLECTION_NAME",
    });
  }

  private safeGenericCollectionName(value: unknown) {
    const name = String(value || "").trim().slice(0, 120);
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
    if (keys.includes("_id") || keys.includes("sourceId") || keys.includes("sourceUrl")) return true;
    if (keys.includes("key") || keys.includes("slug") || keys.includes("coinSlug") || keys.includes("projectSlug")) return true;
    const andFilters = Array.isArray((filter as any).$and) ? (filter as any).$and : [];
    return andFilters.some((item: any) => item && typeof item === "object" && this.isStrictWriteFilter(item));
  }

  private safeProjection(value: unknown) {
    return this.safeMongoObject(value, { allowOperators: false });
  }

  private safeSort(value: unknown) {
    const sort = this.safeMongoObject(value, { allowOperators: false });
    return Object.entries(sort).reduce((acc, [key, item]) => {
      acc[key] = Number(item) === -1 ? -1 : 1;
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

  private safeCollectionNames(value: unknown, fallback: string[]) {
    const requested = Array.isArray(value)
      ? value.map((item) => this.safeProfileCollectionName(item)).filter(Boolean)
      : fallback;
    return Array.from(new Set(requested)).slice(0, 12);
  }

  private safeProfileCollectionName(value: unknown) {
    const name = String(value || "").trim();
    if (!name || FORBIDDEN_COLLECTION_NAME_PATTERN.test(name)) return "";
    return (PROFILE_ALLOWED_COLLECTIONS as readonly string[]).includes(name) ? name : "";
  }

  private safeCrossSourceCollection(value: unknown) {
    const name = String(value || "").trim();
    return (CROSS_SOURCE_COLLECTIONS as readonly string[]).includes(name) ? name : "";
  }

  private safeV2LinkSourceCollection(value: unknown) {
    const name = String(value || "").trim();
    return (V2_LINK_SOURCE_COLLECTIONS as readonly string[]).includes(name) ? name : "";
  }

  private sampleSize(value: unknown, fallback: number, max = MAX_SAMPLE_SIZE) {
    const parsed = Number(value);
    if (!Number.isFinite(parsed) || parsed <= 0) return fallback;
    return Math.min(Math.floor(parsed), max);
  }

  private async collectionDetailedStats(collectionName: string) {
    try {
      const exists = await this.collectionExists(collectionName);
      if (!exists) {
        return {
          collectionName,
          name: collectionName,
          exists: false,
          count: 0,
          lastCreatedAt: null,
          dateFieldsDetected: [],
          statusBreakdown: {},
          sourceBreakdown: {},
          warnings: [`${collectionName}: collection is missing`],
        };
      }

      const collection = this.collection(collectionName);
      const [count, sampleDocs, indexes] = await Promise.all([
        collection.countDocuments({}, { maxTimeMS: MAX_TIME_MS }),
        collection.find({}, { maxTimeMS: MAX_TIME_MS } as any).limit(50).toArray(),
        typeof (collection as any).indexes === "function"
          ? (collection as any).indexes().catch(() => [])
          : Promise.resolve([]),
      ]);
      const paths = this.pathStats(sampleDocs, true);

      return {
        collectionName,
        name: collectionName,
        exists: true,
        count,
        estimatedDocumentSize: sampleDocs.length
          ? `${Math.round(
              sampleDocs.reduce(
                (total, doc) => total + JSON.stringify(this.compactDocumentPreview(doc)).length,
                0
              ) / sampleDocs.length
            )} bytes avg compact`
          : undefined,
        indexes: Array.isArray(indexes)
          ? indexes.slice(0, 20).map((index: any) => ({ name: index.name, key: index.key }))
          : [],
        lastCreatedAt: this.lastDateFromDocs(sampleDocs),
        dateFieldsDetected: paths
          .filter((item) => /date|created|updated|parsed|seen|unlock/i.test(item.path))
          .map((item) => item.path)
          .slice(0, 20),
        statusBreakdown: this.breakdown(sampleDocs, ["status", "state"]),
        sourceBreakdown: this.breakdown(sampleDocs, ["source", "sourceKey", "source_key", "provider"]),
        warnings: [],
      };
    } catch (error: any) {
      return {
        collectionName,
        name: collectionName,
        exists: false,
        count: 0,
        lastCreatedAt: null,
        warnings: [error?.message || "stats failed"],
      };
    }
  }

  private async profileCollection(
    collectionName: string,
    options: {
      sampleSize: number;
      includeCompactSamples: boolean;
      includeFieldFrequency: boolean;
      includeNestedPaths: boolean;
      includeIdentityCandidates: boolean;
      fieldPathFilter?: string[];
    }
  ) {
    const warnings: string[] = [];
    if (!this.safeProfileCollectionName(collectionName)) {
      return {
        collectionName,
        exists: false,
        count: 0,
        topLevelFields: [],
        nestedFieldPaths: [],
        identityFieldCandidates: this.emptyIdentityCandidates(),
        dateFieldCandidates: [],
        sourceFieldCandidates: [],
        warnings: ["Collection is not allowlisted for profiling"],
      };
    }

    const exists = await this.collectionExists(collectionName);
    if (!exists) {
      return {
        collectionName,
        exists: false,
        count: 0,
        topLevelFields: [],
        nestedFieldPaths: [],
        identityFieldCandidates: this.emptyIdentityCandidates(),
        dateFieldCandidates: [],
        sourceFieldCandidates: [],
        warnings: ["Collection is missing"],
      };
    }

    const [count, docs] = await Promise.all([
      this.collection(collectionName).countDocuments({}, { maxTimeMS: MAX_TIME_MS }),
      this.safeCollectionSample(collectionName, options.sampleSize),
    ]);
    if (!docs.length) warnings.push("Collection exists but sampled no documents.");

    const allPathStats = this.pathStats(docs, true).filter((item) =>
      options.fieldPathFilter?.length
        ? options.fieldPathFilter.some((filter) => item.path.toLowerCase().includes(filter))
        : true
    );
    const topLevelFields = options.includeFieldFrequency
      ? allPathStats
          .filter((item) => !item.path.includes("."))
          .map((item) => this.fieldStatForOutput(item, docs.length))
          .slice(0, 80)
      : [];
    const nestedFieldPaths = options.includeNestedPaths
      ? allPathStats
          .filter((item) => item.path.includes("."))
          .map((item) => this.fieldStatForOutput(item, docs.length))
          .slice(0, 120)
      : [];
    const identityFieldCandidates = options.includeIdentityCandidates
      ? this.identityCandidatePaths(docs)
      : this.emptyIdentityCandidates();

    return {
      collectionName,
      exists: true,
      count,
      topLevelFields,
      nestedFieldPaths,
      identityFieldCandidates,
      dateFieldCandidates: allPathStats
        .filter((item) => /date|created|updated|parsed|seen|unlock/i.test(item.path))
        .map((item) => item.path)
        .slice(0, 30),
      sourceFieldCandidates: allPathStats
        .filter((item) => /source|url|provider|origin/i.test(item.path))
        .map((item) => item.path)
        .slice(0, 30),
      compactSamples: options.includeCompactSamples
        ? docs.slice(0, Math.min(options.sampleSize, 10)).map((doc) => this.compactDocumentPreview(doc))
        : undefined,
      warnings,
    };
  }

  private async safeCollectionSample(collectionName: string, limit: number, query?: unknown) {
    if (!this.isConnected() || !(await this.collectionExists(collectionName))) return [];
    const filter = query
      ? this.legacyTextFilter(String(query), [
          "name",
          "coinName",
          "symbol",
          "coinSymbol",
          "slug",
          "coinSlug",
          "projectName",
          "project_name",
          "projectSlug",
          "project_slug",
          "website",
          "sourceUrl",
          "detailUrl",
          "url",
        ])
      : {};
    return this.collection(collectionName)
      .find(filter, { maxTimeMS: MAX_TIME_MS } as any)
      .limit(Math.min(limit, MAX_SAMPLE_SIZE * 10))
      .toArray();
  }

  private pathStats(docs: any[], includeNested: boolean) {
    const stats = new Map<string, { path: string; count: number; typeExamples: Set<string> }>();
    docs.forEach((doc) => this.collectPathStats(doc, "", stats, includeNested, 0));
    return Array.from(stats.values()).sort((left, right) => right.count - left.count);
  }

  private collectPathStats(
    value: unknown,
    prefix: string,
    stats: Map<string, { path: string; count: number; typeExamples: Set<string> }>,
    includeNested: boolean,
    depth: number
  ) {
    if (!value || typeof value !== "object" || depth > 4) return;
    if (Array.isArray(value)) {
      value.slice(0, 5).forEach((item) =>
        this.collectPathStats(item, prefix, stats, includeNested, depth + 1)
      );
      return;
    }

    for (const [key, item] of Object.entries(value as Record<string, unknown>)) {
      if (this.isUnsafeOutputKey(key)) continue;
      const path = prefix ? `${prefix}.${key}` : key;
      const current =
        stats.get(path) || { path, count: 0, typeExamples: new Set<string>() };
      current.count += 1;
      current.typeExamples.add(this.valueType(item));
      stats.set(path, current);
      if (includeNested && item && typeof item === "object") {
        this.collectPathStats(item, path, stats, includeNested, depth + 1);
      }
    }
  }

  private fieldStatForOutput(
    item: { path: string; count: number; typeExamples: Set<string> },
    totalDocs: number
  ) {
    return {
      field: item.path,
      path: item.path,
      typeExamples: Array.from(item.typeExamples).slice(0, 5),
      frequencyPercent: totalDocs ? Math.round((item.count / totalDocs) * 100) : 0,
    };
  }

  private identityCandidatePaths(docs: any[]) {
    const paths = this.pathStats(docs, true).map((item) => item.path);
    const pick = (pattern: RegExp) => paths.filter((path) => pattern.test(path)).slice(0, 25);
    return {
      namePaths: pick(/(^|\.)(name|projectName|project_name|coinName|title)$/i),
      symbolPaths: pick(/(^|\.)(symbol|coinSymbol|ticker)$/i),
      slugPaths: pick(/(^|\.)(slug|projectSlug|project_slug|coinSlug|dropstabSlug|icodropsSlug)$/i),
      websitePaths: pick(/website|homepage|siteUrl/i),
      sourceUrlPaths: pick(/sourceUrl|source_url|detailUrl|url$/i),
      projectIdPaths: pick(/projectId|canonicalProjectId|project_id/i),
      sourceIdPaths: pick(/sourceId|source_id|currencyId|key$/i),
    };
  }

  private emptyIdentityCandidates() {
    return {
      namePaths: [],
      symbolPaths: [],
      slugPaths: [],
      websitePaths: [],
      sourceUrlPaths: [],
      projectIdPaths: [],
      sourceIdPaths: [],
    };
  }

  private compactDocumentPreview(doc: Record<string, any>) {
    const preview: Record<string, unknown> = {};
    const preferred = [
      "_id",
      "id",
      "key",
      "name",
      "coinName",
      "projectName",
      "project_name",
      "symbol",
      "coinSymbol",
      "slug",
      "coinSlug",
      "projectSlug",
      "project_slug",
      "dropstabSlug",
      "website",
      "source",
      "sourceKey",
      "sourceUrl",
      "detailUrl",
      "url",
      "status",
      "roundType",
      "round_type",
      "amount",
      "amountUsd",
      "date",
      "unlockDate",
      "unlock_date",
      "updatedAt",
      "createdAt",
    ];

    preferred.forEach((key) => {
      if (doc[key] !== undefined) preview[key] = this.compactSafeValue(doc[key]);
    });

    const available = this.availableData(doc, [
      ["fundraising", "fundraising"],
      ["saleRounds", "saleRounds"],
      ["tokenomics", "tokenomics"],
      ["funding", "funding"],
      ["investors", "investors"],
      ["projects", "projects"],
      ["portfolio", "portfolio"],
      ["categories", "categories"],
      ["tags", "tags"],
    ]);
    if (available.length) preview.availableData = available;

    return this.redactionService.redact(preview, {
      maxDepth: 4,
      maxArrayLength: MAX_OUTPUT_ARRAY_ITEMS,
      maxStringLength: MAX_OUTPUT_STRING_LENGTH,
    });
  }

  private compactSafeValue(value: unknown): unknown {
    if (value instanceof Date) return value.toISOString();
    if (value instanceof Types.ObjectId) return String(value);
    if (typeof value === "string") {
      return value.length > MAX_OUTPUT_STRING_LENGTH
        ? `${value.slice(0, MAX_OUTPUT_STRING_LENGTH)}...[TRUNCATED]`
        : value;
    }
    if (Array.isArray(value)) {
      return value.slice(0, MAX_OUTPUT_ARRAY_ITEMS).map((item) => this.compactSafeValue(item));
    }
    if (value && typeof value === "object") {
      const output: Record<string, unknown> = {};
      Object.entries(value as Record<string, unknown>)
        .filter(([key]) => !this.isUnsafeOutputKey(key))
        .slice(0, 30)
        .forEach(([key, item]) => {
          output[key] = this.compactSafeValue(item);
        });
      return output;
    }
    return value;
  }

  private isUnsafeOutputKey(key: string) {
    return /raw|html|payload|cookie|token|secret|password|authorization|session/i.test(key);
  }

  private valueType(value: unknown) {
    if (value instanceof Date) return "date";
    if (value instanceof Types.ObjectId) return "objectId";
    if (Array.isArray(value)) return "array";
    if (value === null) return "null";
    return typeof value;
  }

  private projectionPreset(value: unknown) {
    const preset = String(value || "debug_compact");
    const identity = {
      _id: 1,
      key: 1,
      name: 1,
      coinName: 1,
      projectName: 1,
      project_name: 1,
      symbol: 1,
      coinSymbol: 1,
      slug: 1,
      coinSlug: 1,
      projectSlug: 1,
      project_slug: 1,
      dropstabSlug: 1,
      website: 1,
      source: 1,
      sourceUrl: 1,
      detailUrl: 1,
      url: 1,
      status: 1,
      createdAt: 1,
      updatedAt: 1,
    };
    const presets: Record<string, Record<string, number>> = {
      identity,
      debug_compact: identity,
      fundraising: { ...identity, roundType: 1, round_type: 1, amount: 1, amountUsd: 1, investors: 1, date: 1 },
      investor: { ...identity, type: 1, tier: 1, projects: 1, portfolio: 1, portfolioCount: 1 },
      unlock: { ...identity, unlockDate: 1, unlock_date: 1, amount: 1, amountUsd: 1, round: 1 },
      dropstab_detail: { ...identity, funding: 1, fundraising: 1, investors: 1, categories: 1, tags: 1 },
      icodrops: { ...identity, fundraising: 1, saleRounds: 1, tokenomics: 1, categories: 1, ecosystems: 1 },
    };
    return presets[preset] || identity;
  }

  private async identityRows(collectionName: string, limit: number, query?: unknown) {
    const docs = await this.safeCollectionSample(collectionName, limit, query);
    return docs.map((doc) => ({
      ...doc,
      __identity: this.identityForDoc(doc),
    }));
  }

  private identityForDoc(doc: Record<string, any>) {
    const name = this.firstStringByPaths(doc, [
      "project.name",
      "projectName",
      "project_name",
      "coin.name",
      "coinName",
      "name",
      "title",
    ]);
    const symbol = this.firstStringByPaths(doc, ["symbol", "coinSymbol", "project.symbol", "ticker"]);
    const slug = this.firstStringByPaths(doc, [
      "project.slug",
      "projectSlug",
      "project_slug",
      "coin.slug",
      "coinSlug",
      "dropstabSlug",
      "icodropsSlug",
      "slug",
    ]);
    const website = this.firstStringByPaths(doc, ["website", "project.website", "siteUrl", "homepage"]);
    const sourceUrl = this.firstStringByPaths(doc, ["sourceUrl", "source_url", "detailUrl", "url"]);
    return {
      id: this.idString(doc._id),
      name,
      symbol,
      slug,
      website,
      sourceUrl,
      normalizedName: this.normalizeKey(name),
      normalizedSlug: this.normalizeKey(slug),
      normalizedWebsite: this.normalizeHost(website),
      normalizedSourceSlug: this.slugFromUrl(sourceUrl),
    };
  }

  private identityMatch(left: any, right: any) {
    const a = left.__identity || this.identityForDoc(left);
    const b = right.__identity || this.identityForDoc(right);
    const reasonCodes: string[] = [];
    const conflicts: string[] = [];
    let confidence = 0;

    if (a.normalizedSlug && a.normalizedSlug === b.normalizedSlug) {
      confidence = Math.max(confidence, 0.97);
      reasonCodes.push("exact_normalized_slug");
    }
    if (a.normalizedWebsite && a.normalizedWebsite === b.normalizedWebsite) {
      confidence = Math.max(confidence, 0.94);
      reasonCodes.push("exact_website_host");
    }
    if (a.normalizedName && a.normalizedName === b.normalizedName) {
      if (a.normalizedName.length <= 2) {
        confidence = Math.max(confidence, 0.45);
        reasonCodes.push("short_exact_name");
      } else {
        confidence = Math.max(confidence, 0.9);
        reasonCodes.push("exact_normalized_name");
      }
    }
    if (a.normalizedName && b.normalizedName && a.symbol && b.symbol) {
      if (
        a.normalizedName === b.normalizedName &&
        a.normalizedName.length > 2 &&
        String(a.symbol).toLowerCase() === String(b.symbol).toLowerCase()
      ) {
        confidence = Math.max(confidence, 0.95);
        reasonCodes.push("name_and_symbol");
      } else if (String(a.symbol).toLowerCase() !== String(b.symbol).toLowerCase()) {
        conflicts.push("symbol_mismatch");
      }
    }
    if (a.normalizedSourceSlug && (a.normalizedSourceSlug === b.normalizedSlug || a.normalizedSourceSlug === b.normalizedSourceSlug)) {
      confidence = Math.max(confidence, 0.86);
      reasonCodes.push("source_url_slug_match");
    }
    if (!confidence && this.fuzzyNameMatch(a.normalizedName, b.normalizedName)) {
      confidence = 0.76;
      reasonCodes.push("fuzzy_name");
    }

    return {
      confidence,
      category: this.identityMatchCategory(confidence, reasonCodes, conflicts),
      reasonCodes,
      conflicts,
    };
  }

  private identityMatchCategory(
    confidence: number,
    reasonCodes: string[],
    conflicts: string[]
  ): "strong" | "ambiguous" | "weak" | "conflict" {
    if (conflicts.length) return confidence >= 0.7 ? "conflict" : "weak";
    if (
      reasonCodes.includes("exact_normalized_slug") ||
      reasonCodes.includes("exact_website_host") ||
      reasonCodes.includes("name_and_symbol")
    ) {
      return "strong";
    }
    if (reasonCodes.includes("exact_normalized_name")) return "ambiguous";
    if (reasonCodes.includes("source_url_slug_match")) return "ambiguous";
    return "weak";
  }

  private matchSide(collection: string, row: any) {
    const identity = row.__identity || this.identityForDoc(row);
    return {
      collection,
      id: identity.id,
      name: identity.name,
      symbol: identity.symbol,
      slug: identity.slug,
      website: identity.website,
    };
  }

  private firstStringByPaths(source: Record<string, any>, paths: string[]) {
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

  private normalizeKey(value: unknown) {
    return String(value || "")
      .trim()
      .toLowerCase()
      .replace(/^https?:\/\//, "")
      .replace(/^www\./, "")
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "");
  }

  private normalizeHost(value: unknown) {
    const text = String(value || "").trim();
    if (!text) return "";
    try {
      const url = text.startsWith("http") ? new URL(text) : new URL(`https://${text}`);
      return url.hostname.replace(/^www\./, "").toLowerCase();
    } catch (error) {
      return this.normalizeKey(text).replace(/-/g, ".");
    }
  }

  private slugFromUrl(value: unknown) {
    const text = String(value || "").trim();
    if (!text) return "";
    try {
      const url = text.startsWith("http") ? new URL(text) : new URL(`https://example.test/${text}`);
      return this.normalizeKey(url.pathname.split("/").filter(Boolean).pop() || "");
    } catch (error) {
      return "";
    }
  }

  private fuzzyNameMatch(left?: string, right?: string) {
    if (!left || !right) return false;
    if (left.length < 4 || right.length < 4) return false;
    return left.includes(right) || right.includes(left);
  }

  private groupPathFor(groupBy: string, identityPaths: ReturnType<FomoParserAiToolsService["identityCandidatePaths"]>, docs: any[]) {
    const normalized = String(groupBy || "project").toLowerCase();
    if (normalized === "slug") return identityPaths.slugPaths[0];
    if (normalized === "symbol") return identityPaths.symbolPaths[0];
    if (normalized === "source") return this.pathStats(docs, true).map((item) => item.path).find((path) => /(^|\.)source(Key)?$/i.test(path));
    if (normalized === "status") return this.pathStats(docs, true).map((item) => item.path).find((path) => /(^|\.)status$/i.test(path));
    return identityPaths.slugPaths[0] || identityPaths.namePaths[0] || identityPaths.symbolPaths[0];
  }

  private collectionsForQualityDomain(domain: string) {
    const map: Record<string, string[]> = {
      projects: ["ico_projects", "dropstab_coin_catalog", "dropstab_coin_detail_data"],
      fundraising: ["intel_fundraising"],
      investors: ["intel_investors"],
      unlocks: ["intel_unlocks"],
      all: [...LEGACY_PARSER_STATS_COLLECTIONS],
    };
    return map[domain] || map.all;
  }

  private qualityIssuesForCollection(collectionName: string, docs: any[], limit: number) {
    const issues: any[] = [];
    const identity = this.identityCandidatePaths(docs);
    const missingName = docs.filter((doc) => !this.identityForDoc(doc).name);
    const missingSlug = docs.filter((doc) => !this.identityForDoc(doc).slug);
    const missingWebsite = docs.filter((doc) => !this.identityForDoc(doc).website);
    const duplicateSlugs = this.duplicateIssue(collectionName, docs, "slug");
    const duplicateNames = this.duplicateIssue(collectionName, docs, "name");
    const pushIssue = (issueType: string, severity: "low" | "medium" | "high", rows: any[], recommendation: string) => {
      if (!rows.length) return;
      issues.push({
        issueType,
        severity,
        collectionName,
        count: rows.length,
        examples: rows.slice(0, Math.min(limit, 5)).map((doc) => ({
          id: this.idString(doc._id),
          preview: this.compactDocumentPreview(doc),
        })),
        recommendation,
      });
    };

    pushIssue("missing name", "high", missingName, `Inspect identity paths. Candidate name paths: ${identity.namePaths.join(", ") || "none"}`);
    pushIssue("missing slug", "medium", missingSlug, `Use name/symbol/website matching or backfill slug. Candidate slug paths: ${identity.slugPaths.join(", ") || "none"}`);
    pushIssue("missing website", "low", missingWebsite, "Website improves cross-source matching; consider sourceUrl fallback.");
    issues.push(...duplicateSlugs, ...duplicateNames);
    return issues;
  }

  private duplicateIssue(collectionName: string, docs: any[], field: "slug" | "name") {
    const groups = new Map<string, any[]>();
    docs.forEach((doc) => {
      const identity = this.identityForDoc(doc);
      const key = field === "slug" ? identity.normalizedSlug : identity.normalizedName;
      if (!key) return;
      groups.set(key, [...(groups.get(key) || []), doc]);
    });
    const duplicates = Array.from(groups.values()).filter((rows) => rows.length > 1);
    if (!duplicates.length) return [];
    const count = duplicates.reduce((total, rows) => total + rows.length, 0);
    return [
      {
        issueType: `duplicate ${field}`,
        severity: "medium",
        collectionName,
        count,
        examples: duplicates.slice(0, 5).flatMap((rows) =>
          rows.slice(0, 2).map((doc) => ({ id: this.idString(doc._id), preview: this.compactDocumentPreview(doc) }))
        ),
        recommendation: `Review duplicate normalized ${field} groups before linking to FOMO v2.`,
      },
    ];
  }

  private async v2IdentityRows(limit: number, query?: unknown) {
    if (!this.adminConnection?.db) return [];
    const filter = query
      ? {
          $or: [
            { name: new RegExp(this.escapeRegex(String(query)), "i") },
            { symbol: new RegExp(this.escapeRegex(String(query)), "i") },
            { slug: new RegExp(this.escapeRegex(String(query)), "i") },
          ],
        }
      : {};
    const rows = await this.adminConnection.db
      .collection("canonical_projects")
      .find(filter, {
        projection: { _id: 1, name: 1, symbol: 1, slug: 1, website: 1, status: 1, createdAt: 1, updatedAt: 1 },
        maxTimeMS: MAX_TIME_MS,
      } as any)
      .limit(limit)
      .toArray();
    return rows.map((row) => ({ ...row, __identity: this.identityForDoc(row) }));
  }

  private async parserProjectContext(query: string) {
    const [ico, dropstab, fundraising, investors, unlocks] = await Promise.all([
      this.findIdentityMatchesInCollection("ico_projects", query, 3),
      this.findIdentityMatchesInCollection("dropstab_coin_detail_data", query, 3),
      this.findIdentityMatchesInCollection("intel_fundraising", query, 5),
      this.findIdentityMatchesInCollection("intel_investors", query, 5),
      this.findIdentityMatchesInCollection("intel_unlocks", query, 5),
    ]);
    return {
      sourcesFound: [
        ico.length ? "ico_projects" : "",
        dropstab.length ? "dropstab_coin_detail_data" : "",
        fundraising.length ? "intel_fundraising" : "",
        investors.length ? "intel_investors" : "",
        unlocks.length ? "intel_unlocks" : "",
      ].filter(Boolean),
      icoProject: ico[0] ? this.compactDocumentPreview(ico[0]) : undefined,
      dropstabDetail: dropstab[0] ? this.compactDocumentPreview(dropstab[0]) : undefined,
      fundraisingSummary: { count: fundraising.length, samples: fundraising.map((doc) => this.compactDocumentPreview(doc)) },
      investorSummary: { count: investors.length, samples: investors.map((doc) => this.compactDocumentPreview(doc)) },
      unlockSummary: { count: unlocks.length, samples: unlocks.map((doc) => this.compactDocumentPreview(doc)) },
    };
  }

  private async findIdentityMatchesInCollection(collectionName: string, query: string, limit: number) {
    if (!(await this.collectionExists(collectionName))) return [];
    return this.collection(collectionName)
      .find(this.legacyTextFilter(query, [
        "name",
        "coinName",
        "symbol",
        "coinSymbol",
        "slug",
        "coinSlug",
        "projectName",
        "project_name",
        "projectSlug",
        "project_slug",
      ]), { maxTimeMS: MAX_TIME_MS } as any)
      .limit(limit)
      .toArray();
  }

  private contextDiffs(parserContext: any, v2Project: any) {
    const parserPrimary = parserContext.icoProject || parserContext.dropstabDetail || {};
    return ["name", "symbol", "slug", "website"].map((field) => {
      const parserValue = parserPrimary[field] || parserPrimary[field === "slug" ? "coinSlug" : field];
      const v2Value = v2Project?.[field];
      const severity = parserValue && v2Value && this.normalizeKey(parserValue) !== this.normalizeKey(v2Value)
        ? "high"
        : parserValue && !v2Value
          ? "medium"
          : !parserValue && v2Value
            ? "low"
            : "low";
      return {
        field,
        parserValue,
        v2Value,
        severity,
        recommendation:
          severity === "high"
            ? "Review identity conflict before linking."
            : parserValue && !v2Value
              ? "Consider backfilling FOMO v2 from parser source."
              : "No action required from this compact comparison.",
      };
    });
  }

  private lastDateFromDocs(docs: any[]) {
    const dates = docs
      .flatMap((doc) => [
        doc.createdAt,
        doc.updatedAt,
        doc.capturedAt,
        doc.finishedAt,
        doc.parsedAt,
        doc.lastParsedAt,
        doc.lastSeenAt,
        doc.lastDetailParsedAt,
        doc.date,
        doc.unlock_date,
      ])
      .map((item) => this.validDate(item))
      .filter(Boolean) as Date[];
    dates.sort((left, right) => right.getTime() - left.getTime());
    return this.isoDate(dates[0]) || null;
  }

  private breakdown(docs: any[], fields: string[]) {
    const counts: Record<string, number> = {};
    docs.forEach((doc) => {
      const value = fields.map((field) => doc[field]).find(Boolean);
      if (!value) return;
      const key = String(value).slice(0, 80);
      counts[key] = Number(counts[key] || 0) + 1;
    });
    return Object.fromEntries(
      Object.entries(counts)
        .sort((left, right) => right[1] - left[1])
        .slice(0, 20)
    );
  }

  private async canDbRead(connection: Connection | undefined, collectionName: string) {
    try {
      if (!connection?.db) return false;
      await connection.db.collection(collectionName).findOne({}, { maxTimeMS: MAX_TIME_MS } as any);
      return true;
    } catch (error) {
      return false;
    }
  }

  private canParserWriteByGuard() {
    try {
      this.adminAiConfig.ensureAiToolDbAccess({
        dbName: this.adminAiConfig.getParserDbName(),
        access: "write",
        parserDb: true,
        accessMode: "full_access",
      });
      return this.isConnected();
    } catch (error) {
      return false;
    }
  }

  private likelyToolErrorCause(error: any) {
    const message = String(error?.error || "").toLowerCase();
    if (message.includes("not authorized")) return "Mongo user lacks required database role.";
    if (message.includes("forbidden")) return "Safety guard blocked a raw, dangerous, or prod-like operation.";
    if (message.includes("confirm")) return "Write execution was requested without confirm=true.";
    return "Tool input, permission, or connection issue.";
  }

  private recommendedToolErrorFix(error: any) {
    const message = String(error?.error || "").toLowerCase();
    if (message.includes("not authorized")) return "Grant the dev Mongo role or keep the tool in read/proposal mode.";
    if (message.includes("forbidden")) return "Use a typed/batch safe tool instead of raw Mongo operation.";
    if (message.includes("confirm")) return "Use dryRun first, then approve the generated pending tool run.";
    return "Open tool-run details, check targetDb/collectionName/input, and retry with a narrower request.";
  }

  private isConnected() {
    return this.parserConnection.readyState === 1 && Boolean(this.parserConnection.db);
  }

  private collection(name: string) {
    return this.parserConnection.db.collection(name);
  }

  private async collectionExists(name: string) {
    if (!this.isConnected()) return false;
    const collections = await this.parserConnection.db
      .listCollections({ name }, { nameOnly: true })
      .toArray();

    return collections.length > 0;
  }

  private async collectionStatus(
    names: string[],
    warnings: string[],
    includeMissingWarning = true
  ) {
    const results = [];

    for (const name of names) {
      try {
        const exists = await this.collectionExists(name);
        if (!exists) {
          if (includeMissingWarning) {
            warnings.push(`${name}: collection is missing`);
          }
          results.push({
            name,
            exists: false,
            count: 0,
            lastCreatedAt: null,
            collectionMissing: true,
          });
          continue;
        }

        const collection = this.collection(name);
        const [count, lastDocument] = await Promise.all([
          collection.countDocuments({}, { maxTimeMS: MAX_TIME_MS }),
          collection.findOne(
            {},
            {
              projection: {
                createdAt: 1,
                updatedAt: 1,
                capturedAt: 1,
                finishedAt: 1,
                parsedAt: 1,
                lastParsedAt: 1,
                lastSeenAt: 1,
                lastDetailParsedAt: 1,
                date: 1,
                unlock_date: 1,
              },
              sort: { updatedAt: -1, createdAt: -1, _id: -1 },
              maxTimeMS: MAX_TIME_MS,
            } as any
          ),
        ]);

        results.push({
          name,
          exists: true,
          count,
          lastCreatedAt:
            this.isoDate(
              lastDocument?.createdAt ||
                lastDocument?.updatedAt ||
                lastDocument?.capturedAt ||
                lastDocument?.finishedAt ||
                lastDocument?.parsedAt ||
                lastDocument?.lastParsedAt ||
                lastDocument?.lastSeenAt ||
                lastDocument?.lastDetailParsedAt ||
                lastDocument?.date ||
                lastDocument?.unlock_date
            ) || null,
        });
      } catch (error: any) {
        const message = error?.message || "status check failed";
        warnings.push(`${name}: ${message}`);
        results.push({
          name,
          exists: false,
          count: 0,
          lastCreatedAt: null,
          warnings: [message],
        });
      }
    }

    return results;
  }

  private legacyTextFilter(query: string, fields: string[]) {
    const text = String(query || "").trim();
    if (!text) return {};
    const regex = new RegExp(this.escapeRegex(text), "i");
    return { $or: fields.map((field) => ({ [field]: regex })) };
  }

  private legacyIdOrSlugFilter(lookup: string, fields: string[]) {
    const text = String(lookup || "").trim();
    const filters: Record<string, unknown>[] = fields.map((field) => ({
      [field]: text,
    }));
    const objectId = this.objectId(text);
    if (objectId) filters.unshift({ _id: objectId });

    return { $or: filters };
  }

  private andFilter(filters: Record<string, unknown>[]) {
    const compact = filters.filter((item) => Object.keys(item).length > 0);
    if (!compact.length) return {};
    if (compact.length === 1) return compact[0];
    return { $and: compact };
  }

  private dateRangeFilter(from: unknown, to: unknown, fields: string[]) {
    const dateFrom = this.validDate(from);
    const dateTo = this.validDate(to);
    if (!dateFrom && !dateTo) return null;

    const range: Record<string, Date> = {};
    if (dateFrom) range.$gte = dateFrom;
    if (dateTo) range.$lte = dateTo;

    return {
      $or: fields.map((field) => ({
        [field]: range,
      })),
    };
  }

  private validDate(value: unknown) {
    const text = String(value || "").trim();
    if (!text) return null;
    const date = new Date(text);
    return Number.isNaN(date.getTime()) ? null : date;
  }

  private escapeRegex(value: string) {
    return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  }

  private async missingCollectionResult(
    tool: string,
    collectionName: string,
    limits: Record<string, unknown> = {}
  ) {
    if (!this.isConnected()) {
      return this.result(
        tool,
        {
          connected: false,
          dbName: this.adminAiConfig.getParserDbName(),
          collectionName,
          collectionMissing: true,
          error: "Parser DB connection is not ready",
        },
        limits
      );
    }

    if (!(await this.collectionExists(collectionName))) {
      return this.result(
        tool,
        {
          collectionName,
          collectionMissing: true,
          count: 0,
        },
        limits
      );
    }

    return null;
  }

  private async getDropstabCoinFromCollection(
    tool: string,
    collectionName: "dropstab_coin_catalog" | "dropstab_coin_detail_data",
    input: Record<string, unknown>
  ) {
    const lookup = String(input.id || input.slug || input.currencyId || "").trim();
    if (!lookup) {
      return this.result(tool, {
        error: "id, slug, or currencyId is required",
      });
    }

    const missing = await this.missingCollectionResult(tool, collectionName);
    if (missing) return missing;

    const doc = await this.collection(collectionName).findOne(
      this.legacyIdOrSlugFilter(lookup, [
        "slug",
        "coinSlug",
        "dropstabSlug",
        "currencyId",
      ]),
      { projection: DROPSTAB_COIN_PROJECTION, maxTimeMS: MAX_TIME_MS } as any
    );

    return this.result(
      tool,
      doc
        ? { coin: this.safeDropstabCoin(doc, collectionName) }
        : { lookup, error: "Dropstab coin not found" },
      { collectionsRead: [collectionName] }
    );
  }

  private async countLinked(collectionName: string, run: Record<string, any>) {
    if (!this.isConnected() || !(await this.collectionExists(collectionName))) {
      return {
        count: 0,
        collectionMissing: true,
      };
    }

    const filter = this.runRefFilter(this.idString(run._id) || run.runId || run.id);
    const count = await this.collection(collectionName).countDocuments(filter, {
      maxTimeMS: MAX_TIME_MS,
    });

    return {
      count,
      collectionMissing: false,
    };
  }

  private assertReadOnlyInput(value: unknown, path = "input") {
    if (!value || typeof value !== "object") return;

    if (Array.isArray(value)) {
      value.forEach((item, index) => this.assertReadOnlyInput(item, `${path}[${index}]`));
      return;
    }

    for (const [key, item] of Object.entries(value as Record<string, unknown>)) {
      const isForbidden = FORBIDDEN_INPUT_KEYS.some(
        (forbidden) => key.toLowerCase() === forbidden.toLowerCase()
      );

      if (isForbidden) {
        throw new Error(`Forbidden parser DB operation or aggregate stage: ${path}.${key}`);
      }

      this.assertReadOnlyInput(item, `${path}.${key}`);
    }
  }

  private compactAndFilter(parts: Array<Record<string, unknown> | null>) {
    const filters = parts.filter(Boolean) as Record<string, unknown>[];
    if (!filters.length) return {};
    if (filters.length === 1) return filters[0];
    return { $and: filters };
  }

  private stringField(value: unknown, field: string) {
    const text = String(value || "").trim();
    return text ? { [field]: text } : null;
  }

  private stringOrFields(value: unknown, fields: string[]) {
    const text = String(value || "").trim();
    if (!text) return null;
    const filters = fields.map((field) => ({ [field]: text }));
    return filters.length === 1 ? filters[0] : { $or: filters };
  }

  private runRefFilter(value: unknown) {
    const text = String(value || "").trim();
    if (!text) return {};

    const filters: Record<string, unknown>[] = [
      { runId: text },
      { parserRunId: text },
      { parser_run_id: text },
    ];
    const objectId = this.objectId(text);
    if (objectId) {
      filters.push({ _id: objectId }, { runId: objectId }, { parserRunId: objectId });
    }

    return { $or: filters };
  }

  private idOrKeyFilter(value: string, key: string) {
    const filters: Record<string, unknown>[] = [{ [key]: value }];
    const objectId = this.objectId(value);
    if (objectId) filters.push({ _id: objectId });

    return { $or: filters };
  }

  private safeIcoProject(project: Record<string, any>) {
    return {
      id: this.idString(project._id),
      name: project.name,
      symbol: project.symbol,
      slug: project.slug,
      source: project.source,
      sourceId: project.sourceId,
      sourceUrl: project.sourceUrl || project.detailUrl || project.url,
      website: project.website,
      dropstabSlug: project.dropstabSlug,
      icodropsSlug: project.icodropsSlug || project.slug,
      status: project.status,
      projectType: project.projectType,
      categories: this.safeArray(project.categories),
      ecosystems: this.safeArray(project.ecosystems),
      launchpads: this.safeArray(project.launchpads),
      availableData: this.availableData(project, [
        ["fundraising", "fundraising"],
        ["saleRounds", "saleRounds"],
        ["tokenomics", "tokenomics"],
        ["categories", "categories"],
        ["ecosystems", "ecosystems"],
        ["website", "website"],
      ]),
      updatedAt: this.isoDate(project.updatedAt || project.lastParsedAt),
    };
  }

  private safeDropstabCoin(document: Record<string, any>, source: string) {
    return {
      source,
      id: this.idString(document._id),
      name: document.name || document.coinName,
      symbol: document.symbol || document.coinSymbol,
      slug: document.slug || document.coinSlug || document.dropstabSlug,
      dropstabSlug: document.dropstabSlug || document.coinSlug || document.slug,
      currencyId: this.idString(document.currencyId),
      sourceName: document.source,
      sourceUrl: document.detailUrl || document.url,
      website: document.website,
      rank: document.rank,
      categories: this.safeArray(document.categories),
      tags: this.safeArray(document.tags),
      availableData: this.availableData(document, [
        ["funding", "funding"],
        ["fundraising", "fundraising"],
        ["investors", "investors"],
        ["categories", "categories"],
        ["tags", "tags"],
        ["website", "website"],
      ]),
      updatedAt: this.isoDate(
        document.updatedAt ||
          document.lastParsedAt ||
          document.lastDetailParsedAt ||
          document.parsedAt
      ),
    };
  }

  private safeInvestor(investor: Record<string, any>) {
    return {
      id: this.idString(investor._id),
      key: investor.key,
      name: investor.name,
      slug: investor.slug,
      source: investor.source,
      sourceId: this.idString(investor.sourceId),
      sourceRank: investor.sourceRank,
      sourceUrl: investor.detailUrl || investor.url,
      website: investor.website,
      type: investor.type,
      tier: investor.tier,
      portfolioCount:
        investor.portfolioCount ||
        this.arrayLength(investor.projects) ||
        this.arrayLength(investor.portfolio),
      sampleProjects: this.safeArray(investor.projects || investor.portfolio).slice(0, 10),
      updatedAt: this.isoDate(
        investor.updatedAt || investor.lastParsedAt || investor.lastDetailParsedAt
      ),
    };
  }

  private safeFundraising(item: Record<string, any>) {
    return {
      id: this.idString(item._id),
      key: item.key,
      projectKey: item.projectKey || item.project_key,
      projectSlug: item.projectSlug || item.project_slug,
      projectName: item.projectName || item.project_name || item.name,
      roundType: item.roundType || item.round_type || item.type,
      source: item.source,
      date: this.isoDate(item.date || item.announcedAt),
      amount: item.amount,
      amountUsd: item.amountUsd,
      investors: this.safeArray(item.investors).slice(0, 12),
      leadInvestors: this.safeArray(item.leadInvestors).slice(0, 8),
      updatedAt: this.isoDate(item.updatedAt || item.createdAt),
    };
  }

  private safeUnlock(item: Record<string, any>) {
    return {
      id: this.idString(item._id),
      key: item.key,
      projectKey: item.projectKey || item.project_key,
      projectSlug: item.projectSlug || item.project_slug || item.slug,
      projectName: item.projectName || item.project_name || item.name,
      symbol: item.symbol,
      source: item.source,
      unlockDate: this.isoDate(item.unlockDate || item.unlock_date || item.date),
      amount: item.amount,
      amountUsd: item.amountUsd,
      tokens: item.tokens,
      round: item.round,
      updatedAt: this.isoDate(item.updatedAt || item.createdAt),
    };
  }

  private projectContextMatch(source: string, doc: Record<string, any>, query: string) {
    const name = doc.name || doc.coinName;
    const symbol = doc.symbol || doc.coinSymbol;
    const slug = doc.slug || doc.coinSlug || doc.dropstabSlug;
    const sourceUrl = doc.sourceUrl || doc.detailUrl || doc.url;

    return {
      source,
      id: this.idString(doc._id),
      name,
      symbol,
      slug,
      sourceUrl,
      confidence: this.matchConfidence(query, [name, symbol, slug, doc.sourceId]),
      availableData: this.availableData(doc, [
        ["fundraising", "fundraising"],
        ["saleRounds", "saleRounds"],
        ["tokenomics", "tokenomics"],
        ["funding", "funding"],
        ["investors", "investors"],
        ["website", "website"],
        ["categories", "categories"],
      ]),
    };
  }

  private matchConfidence(query: string, values: unknown[]) {
    const needle = String(query || "").trim().toLowerCase();
    if (!needle) return 0;
    for (const value of values) {
      const text = String(value || "").trim().toLowerCase();
      if (!text) continue;
      if (text === needle) return 0.98;
      if (text.includes(needle) || needle.includes(text)) return 0.82;
    }
    return 0.6;
  }

  private availableData(
    source: Record<string, any>,
    entries: Array<[string, string]>
  ) {
    return entries
      .filter(([, key]) => {
        const value = source[key];
        if (Array.isArray(value)) return value.length > 0;
        return value !== undefined && value !== null && value !== "";
      })
      .map(([label]) => label);
  }

  private safeArray(value: unknown) {
    if (!Array.isArray(value)) return [];
    return value.slice(0, 20).map((item) =>
      this.redactionService.redact(this.formatSafeValue(item), {
        maxDepth: 3,
        maxArrayLength: 10,
        maxStringLength: 300,
      })
    );
  }

  private arrayLength(value: unknown) {
    return Array.isArray(value) ? value.length : undefined;
  }

  private parserSourceRole(collectionName: string) {
    const map: Record<string, string> = {
      ico_projects: "ICODrops project profiles and ICO metadata",
      dropstab_coin_catalog: "Dropstab coin catalog and discovery queue",
      dropstab_coin_detail_data: "Dropstab coin detail/source profile data",
      dropstab_project_candidates: "Dropstab project matching candidates",
      dropstab_project_data: "Legacy Dropstab project detail staging",
      intel_fundraising: "Fundraising source facts",
      intel_investors: "Investor/source profiles",
      intel_unlocks: "Token unlock source facts",
      project_external_data: "External project enrichment staging",
      ico_parser_errors: "ICODrops parser errors",
      ico_parser_locks: "ICODrops parser locks",
    };

    return map[collectionName] || "Legacy parser staging collection";
  }

  private async discoveryByCollection(
    collectionName: string,
    parserSource: string,
    limit: number
  ) {
    if (!(await this.collectionExists(collectionName))) {
      return { items: [], collectionsRead: [] };
    }

    const projection =
      collectionName === "ico_projects"
        ? LEGACY_PROJECT_PROJECTION
        : DROPSTAB_COIN_PROJECTION;
    const rows = await this.collection(collectionName)
      .find({}, { projection, maxTimeMS: MAX_TIME_MS } as any)
      .sort({ updatedAt: -1, lastParsedAt: -1, _id: -1 })
      .limit(limit)
      .toArray();

    return {
      collectionsRead: [collectionName],
      items: rows.map((row) => ({
        name: row.name || row.coinName,
        symbol: row.symbol || row.coinSymbol,
        slug: row.slug || row.coinSlug || row.dropstabSlug,
        parserSources: [parserSource],
        counts: { [collectionName]: 1 },
        reviewPotentialScore: this.reviewPotentialScore(row),
        reasons: this.availableData(row, [
          ["has fundraising", "fundraising"],
          ["has sale rounds", "saleRounds"],
          ["has tokenomics", "tokenomics"],
          ["has funding", "funding"],
          ["has investors", "investors"],
          ["has website", "website"],
        ]),
        sampleIds: { [collectionName]: [this.idString(row._id) || ""].filter(Boolean) },
      })),
    };
  }

  private async discoveryByGroupedCollection(
    collectionName: string,
    keyFields: string[],
    parserSource: string,
    limit: number
  ) {
    if (!(await this.collectionExists(collectionName))) {
      return { items: [], collectionsRead: [] };
    }

    const projection =
      collectionName === "intel_fundraising"
        ? FUNDRAISING_PROJECTION
        : collectionName === "intel_unlocks"
          ? UNLOCK_PROJECTION
          : INVESTOR_PROJECTION;
    const rows = await this.collection(collectionName)
      .find({}, { projection, maxTimeMS: MAX_TIME_MS } as any)
      .sort({ updatedAt: -1, date: -1, _id: -1 })
      .limit(Math.min(limit * 20, 1000))
      .toArray();
    const groups = new Map<string, any>();

    for (const row of rows) {
      const key =
        keyFields.map((field) => row[field]).find(Boolean) ||
        this.idString(row._id) ||
        "unknown";
      const existing =
        groups.get(String(key)) ||
        {
          name: row.projectName || row.project_name || row.name,
          symbol: row.symbol,
          slug: row.projectSlug || row.project_slug || row.slug,
          parserSources: [parserSource],
          counts: { [collectionName]: 0 },
          reviewPotentialScore: 0,
          reasons: [] as string[],
          sampleIds: { [collectionName]: [] as string[] },
        };
      existing.counts[collectionName] += 1;
      existing.reviewPotentialScore += 1;
      const id = this.idString(row._id);
      if (id && existing.sampleIds[collectionName].length < 5) {
        existing.sampleIds[collectionName].push(id);
      }
      groups.set(String(key), existing);
    }

    return {
      collectionsRead: [collectionName],
      items: Array.from(groups.values())
        .sort(
          (left, right) =>
            (right.counts[collectionName] || 0) - (left.counts[collectionName] || 0)
        )
        .slice(0, limit)
        .map((item) => ({
          ...item,
          reasons: [
            `${item.counts[collectionName]} records in ${collectionName}`,
          ],
        })),
    };
  }

  private reviewPotentialScore(row: Record<string, any>) {
    return this.availableData(row, [
      ["fundraising", "fundraising"],
      ["saleRounds", "saleRounds"],
      ["tokenomics", "tokenomics"],
      ["funding", "funding"],
      ["investors", "investors"],
      ["website", "website"],
    ]).length;
  }

  private safeScriptDefinition(script: (typeof PARSER_SCRIPT_ALLOWLIST)[number]) {
    return {
      scriptKey: script.scriptKey,
      label: script.label,
      packageScript: script.packageScript,
      command: script.command,
      argsTemplate: script.argsTemplate,
      allowedArgs: script.allowedArgs,
      defaultArgs: script.defaultArgs,
      requiresEmailConfirmation: script.requiresEmailConfirmation,
      requiresAdminJwt: script.requiresAdminJwt,
      writesParserDb: script.writesParserDb,
      writesProdDb: script.writesProdDb,
    };
  }

  private normalizeScriptArgs(
    script: (typeof PARSER_SCRIPT_ALLOWLIST)[number],
    rawArgs: unknown
  ): { args: Record<string, unknown>; warnings: string[]; error?: string } {
    const input =
      rawArgs && typeof rawArgs === "object" && !Array.isArray(rawArgs)
        ? (rawArgs as Record<string, unknown>)
        : {};
    const serialized = JSON.stringify(input);
    if (/--drop|--clear\s*=\s*true|deleteMany|drop\(|renameCollection/i.test(serialized)) {
      return {
        args: {},
        warnings: [],
        error: "Dangerous parser script argument is forbidden",
      };
    }

    const args: Record<string, unknown> = { ...script.defaultArgs };
    const warnings: string[] = [];

    for (const [key, spec] of Object.entries(script.allowedArgs as Record<string, any>)) {
      if (!Object.prototype.hasOwnProperty.call(input, key)) continue;
      const value = input[key];
      if (spec.type === "number") {
        const parsed = Number(value);
        if (!Number.isFinite(parsed) || parsed < spec.min || parsed > spec.max) {
          return {
            args,
            warnings,
            error: `${key} must be a number between ${spec.min} and ${spec.max}`,
          };
        }
        args[key] = Math.floor(parsed);
      } else if (spec.type === "boolean") {
        args[key] = Boolean(value);
      }
    }

    Object.keys(input).forEach((key) => {
      if (!Object.prototype.hasOwnProperty.call(script.allowedArgs, key)) {
        warnings.push(`Ignored non-allowlisted argument: ${key}`);
      }
    });

    Object.entries(script.allowedArgs as Record<string, any>).forEach(([key, spec]) => {
      if (spec.forced) args[key] = spec.default;
    });

    return { args, warnings };
  }

  private proposalId(
    scriptKey: string,
    args: Record<string, unknown>,
    reason: string
  ) {
    const source = `${scriptKey}:${JSON.stringify(args)}:${reason}`;
    let hash = 0;
    for (let index = 0; index < source.length; index += 1) {
      hash = (hash * 31 + source.charCodeAt(index)) >>> 0;
    }
    return `parser-proposal-${scriptKey}-${hash.toString(16)}`;
  }

  private safeForcedParserEnv() {
    return {
      DB_NAME: "parser_new_dev",
      DB_PARSER_NAME: "parser_new_dev",
      MAIN_BACKEND_SYNC_ENABLED: "false",
      PROJECT_INTEL_MAIN_SYNC_ENABLED: "false",
      ICO_PIPELINE_SYNC_MAIN_BACKEND: "false",
      PARSER_LEGACY_WRITES_ENABLED: "true",
      writesToFomoLiveOrProd: false,
    };
  }

  private blockedParserRunTool(tool: FomoParserAiToolName, extra: Record<string, unknown>) {
    return this.result(
      tool,
      {
        status: "blocked",
        message: SCRIPT_PROPOSAL_BLOCKED_MESSAGE,
        ...extra,
      },
      { collectionsRead: [] }
    );
  }

  private safeRun(run: Record<string, any>) {
    return this.safePick(run, [
      "_id",
      "runId",
      "sourceKey",
      "source",
      "source_key",
      "parserKey",
      "parser_key",
      "status",
      "startedAt",
      "finishedAt",
      "createdAt",
      "updatedAt",
      "errorCode",
      "errorMessage",
      "stats",
    ]);
  }

  private safeRawDocument(document: Record<string, any>) {
    return {
      rawId: this.idString(document.rawId || document._id),
      sourceKey: document.sourceKey || document.source || document.source_key,
      sourceUrl: document.sourceUrl || document.source_url || document.url,
      sourceEntityId: this.idString(document.sourceEntityId || document.source_entity_id),
      payloadHash: document.payloadHash || document.payload_hash || document.contentHash,
      contentType: document.contentType || document.content_type || document.mimeType,
      status: document.status,
      createdAt: this.isoDate(document.createdAt || document.capturedAt),
      updatedAt: this.isoDate(document.updatedAt),
      payloadPreview: this.payloadPreview(document),
    };
  }

  private safeExtraction(extraction: Record<string, any>) {
    return this.safePick(extraction, [
      "_id",
      "extractionId",
      "parserRunId",
      "runId",
      "rawDocumentId",
      "rawId",
      "sourceKey",
      "source",
      "sourceUrl",
      "entityType",
      "extractionType",
      "status",
      "confidence",
      "payloadHash",
      "resultHash",
      "fieldCount",
      "normalizedPreview",
      "summary",
      "createdAt",
      "updatedAt",
    ]);
  }

  private safeReviewCase(reviewCase: Record<string, any>) {
    return this.safePick(reviewCase, [
      "_id",
      "caseId",
      "parserRunId",
      "runId",
      "rawDocumentId",
      "rawId",
      "sourceKey",
      "status",
      "reason",
      "riskFlags",
      "confidenceScore",
      "projectName",
      "normalizedProjectName",
      "summary",
      "createdAt",
      "updatedAt",
    ]);
  }

  private safePick(source: Record<string, any>, keys: string[]) {
    const picked: Record<string, unknown> = {};

    keys.forEach((key) => {
      if (source[key] !== undefined) {
        picked[key] = this.formatSafeValue(source[key]);
      }
    });

    return this.redactionService.redact(picked, {
      maxDepth: 4,
      maxArrayLength: 20,
      maxStringLength: 700,
    });
  }

  private formatSafeValue(value: unknown) {
    if (value instanceof Date) return value.toISOString();
    if (value instanceof Types.ObjectId) return String(value);
    if (Array.isArray(value)) return value.map((item) => this.formatSafeValue(item));

    if (value && typeof value === "object") {
      const output: Record<string, unknown> = {};
      Object.entries(value as Record<string, unknown>).forEach(([key, item]) => {
        output[key] = this.formatSafeValue(item);
      });
      return output;
    }

    return value;
  }

  private payloadPreview(document: Record<string, any>) {
    const preview =
      document.normalizedPreview ||
      document.payloadPreview ||
      document.textPreview ||
      document.summary ||
      document.title ||
      document.description ||
      "";

    const redacted = String(
      this.redactionService.redact(preview || "[NO_SAFE_PREVIEW]", {
        maxStringLength: 700,
      })
    );

    return redacted.length > 700 ? `${redacted.slice(0, 700)}...[TRUNCATED_PREVIEW]` : redacted;
  }

  private safeFilterEcho(input: Record<string, unknown>, keys: string[]) {
    const output: Record<string, unknown> = {};
    keys.forEach((key) => {
      if (input[key] !== undefined && input[key] !== null && input[key] !== "") {
        output[key] = input[key];
      }
    });

    return this.redactionService.redact(output, {
      maxDepth: 2,
      maxArrayLength: 10,
      maxStringLength: 500,
    });
  }

  private objectId(value: unknown) {
    const text = String(value || "").trim();
    if (!Types.ObjectId.isValid(text)) return null;
    return new Types.ObjectId(text);
  }

  private idString(value: unknown) {
    return value ? String(value) : undefined;
  }

  private isoDate(value: unknown) {
    if (!value) return undefined;
    const date = value instanceof Date ? value : new Date(String(value));
    return Number.isNaN(date.getTime()) ? undefined : date.toISOString();
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
        dbTarget: this.adminAiConfig.getParserDbName(),
        ...limits,
      },
    };
  }

  private collectionsForTool(tool: string) {
    const registryCollections = ADMIN_AI_COLLECTION_REGISTRY
      .filter((item) => item.dbTarget === "parserDb")
      .map((item) => item.collectionName);

    const map: Record<string, string[]> = {
      fomoParserDbStatus: [
        ...LEGACY_PARSER_COLLECTIONS,
        ...PARSER_V2_COLLECTIONS,
      ],
      fomoParserCollectionStats: [...LEGACY_PARSER_STATS_COLLECTIONS],
      fomoParserSearchIcoProjects: ["ico_projects"],
      fomoParserGetIcoProject: ["ico_projects"],
      fomoParserSearchDropstabCatalog: ["dropstab_coin_catalog"],
      fomoParserGetDropstabCatalogItem: ["dropstab_coin_catalog"],
      fomoParserGetDropstabDetailData: ["dropstab_coin_detail_data"],
      fomoParserSearchDropstabCoins: [
        "dropstab_coin_catalog",
        "dropstab_coin_detail_data",
      ],
      fomoParserGetDropstabCoinDetail: [
        "dropstab_coin_detail_data",
        "dropstab_coin_catalog",
      ],
      fomoParserSearchInvestors: ["intel_investors"],
      fomoParserGetInvestor: ["intel_investors"],
      fomoParserSearchFundraising: ["intel_fundraising"],
      fomoParserGetFundraisingContext: ["intel_fundraising"],
      fomoParserSearchUnlocks: ["intel_unlocks"],
      fomoParserGetUnlockContext: ["intel_unlocks"],
      fomoParserFindProjectParserContext: [
        "ico_projects",
        "dropstab_coin_catalog",
        "dropstab_coin_detail_data",
      ],
      fomoParserFindTopDataSources: [...LEGACY_PARSER_COLLECTIONS],
      fomoParserDiscovery: [...LEGACY_PARSER_COLLECTIONS],
      fomoParserProfileCollections: [...PROFILE_ALLOWED_COLLECTIONS],
      fomoParserInspectCollectionSchema: [...PROFILE_ALLOWED_COLLECTIONS],
      fomoParserSampleDocuments: [...PROFILE_ALLOWED_COLLECTIONS],
      fomoParserFindCrossSourceMatches: [...CROSS_SOURCE_COLLECTIONS],
      fomoParserFindTopProjectsByCollection: [...CROSS_SOURCE_COLLECTIONS],
      fomoParserDataQualityReport: [...LEGACY_PARSER_STATS_COLLECTIONS],
      fomoParserFindV2LinkCandidates: [...V2_LINK_SOURCE_COLLECTIONS, ...FOMO_V2_READ_COLLECTIONS],
      fomoParserCompareProjectContext: [...LEGACY_PARSER_STATS_COLLECTIONS, ...FOMO_V2_READ_COLLECTIONS],
      fomoAiToolHealthCheck: ["ico_projects", "test", "canonical_projects"],
      fomoAiExplainLastToolError: ["ai_admin_tool_runs"],
      fomoAiListCapabilities: [],
      fomoParserListRunnableScripts: [],
      fomoParserCreateRunProposal: [],
      fomoParserSendRunConfirmationCode: [],
      fomoParserConfirmRunCode: [],
      fomoParserExecuteApprovedRun: [],
      fomoParserGetRunStatus: [],
      fomoParserListRecentRuns: [],
      fomoParserListRuns: ["parser_runs"],
      fomoParserGetRunContext: [
        "parser_runs",
        "parser_raw_documents",
        "parser_extractions",
        "parser_identity_candidates",
        "parser_review_cases",
        "parser_ai_reviews",
      ],
      fomoParserGetRawDocument: ["parser_raw_documents"],
      fomoParserSearchRawDocuments: ["parser_raw_documents"],
      fomoParserListExtractions: ["parser_extractions"],
      fomoParserGetReviewCase: ["parser_review_cases"],
      fomoParserListReviewCases: ["parser_review_cases"],
      fomoParserDevListCollections: registryCollections,
      fomoParserDevCollectionStats: registryCollections,
      fomoParserDevFind: [],
      fomoParserDevFindMany: [],
      fomoParserDevFindOne: [],
      fomoParserDevCount: [],
      fomoParserDevAggregate: [],
      fomoParserDevAggregateReadOnly: [],
      fomoParserDevCreateWriteProposal: [],
      fomoParserDevPreviewWriteDiff: [],
      fomoParserDevExecuteApprovedWrite: [],
      fomoParserDevInsertOne: [],
      fomoParserDevUpdateOne: [],
      fomoParserDevUpdateMany: [],
      fomoParserDevDeleteOne: [],
      fomoParserDevDeleteMany: [],
    };

    return map[tool] || registryCollections;
  }

  private tool(
    name: FomoParserAiToolName,
    description: string,
    parameters: Record<string, unknown>
  ) {
    return {
      type: "function",
      name,
      description,
      parameters,
      strict: false,
    };
  }
}
