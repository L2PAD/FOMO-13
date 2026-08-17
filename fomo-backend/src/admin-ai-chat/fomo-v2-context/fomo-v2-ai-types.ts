export const FOMO_V2_AI_TOOL_NAMES = [
  "fomoV2FindProject",
  "fomoV2GetProjectFullContext",
  "fomoV2GetMarketContext",
  "fomoV2GetSourceContext",
  "fomoV2GetFundingContext",
  "fomoV2GetBackerContext",
  "fomoV2GetTokenomicsContext",
  "fomoV2FindVestingReviewCases",
  "fomoV2GetVestingReviewContext",
  "fomoV2ExportVestingReviews",
  "fomoV2AnalyzeVestingSaleIds",
  "fomoV2NormalizeVestingNames",
  "fomoV2FindOfficialSourceLinks",
  "fomoWebSearchOfficialSources",
  "fomoWebFetchSourceSummary",
  "fomoV2AnalyzeVestingReviewCase",
  "fomoV2BuildVestingReviewProposal",
  "fomoV2FindDuplicates",
  "fomoV2ExplainMissingData",
  "fomoV2CollectionStats",
  "fomoDevFindProject",
  "fomoDevGetProjectFullContext",
  "fomoDevGetMarketContext",
  "fomoDevGetFundingContext",
  "fomoDevGetBackerContext",
  "fomoDevGetTokenomicsContext",
  "fomoDevGetSourceEvidence",
  "fomoDevSearchReviewCases",
  "fomoDevCreateReviewCase",
  "fomoDevResolveReviewCase",
  "fomoDevLinkParserSourceToProject",
  "fomoDevUnlinkParserSourceFromProject",
  "fomoDevUpdateProjectFields",
  "fomoDevUpsertSourceEvidence",
  "fomoDevMarkSourceConflict",
  "fomoDevRebuildProjectReadModel",
  "fomoDevRunImporterForProject",
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
] as const;

export type FomoV2AiToolName = (typeof FOMO_V2_AI_TOOL_NAMES)[number];

export type AdminAiAccessMode =
  | "read_only"
  | "write_with_approval"
  | "full_access";

export type FomoV2AiToolCallRecord = {
  name: string;
  arguments: Record<string, unknown>;
  status: "done" | "error" | "blocked" | "pending";
  durationMs: number;
  resultSummary?: Record<string, unknown>;
  errorCode?: string;
};

export type FomoV2AiToolResult = {
  tool: string;
  generatedAt: string;
  data: Record<string, unknown>;
  limits?: Record<string, unknown>;
};

export type AdminAiChatHistoryItem = {
  role?: string;
  content?: string;
  createdAt?: Date | string;
};

export type AdminAiProviderResponse = {
  content: string;
  status: "done" | "error";
  metadata: Record<string, unknown>;
};

export type AdminAiToolExecutionContext = {
  userId?: string;
  chatId?: string;
  messageId?: string;
  accessMode?: AdminAiAccessMode;
  approvalExecution?: boolean;
};
