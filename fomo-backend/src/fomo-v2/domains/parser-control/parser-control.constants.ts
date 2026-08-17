import {
  FomoV2ParserRunMode,
} from "../../models/parser-control.model";

export interface FomoV2ManagedParserDefinition {
  parserKey: string;
  label: string;
  description: string;
  pipeline: string;
  sourceType: string;
  feed?: string;
  target: string;
  defaultIntervalMinutes: number;
  defaultRunMode: FomoV2ParserRunMode;
  defaultLimit: number;
  /** Exact upstream parser identity required by immutable snapshot imports. */
  upstreamParserKey?: string;
  /** Managed WRITE is rejected unless the run carries an exact snapshot id. */
  writeRequiresSnapshot?: boolean;
}

/**
 * Closed registry: a parser key always resolves to one pipeline and one source.
 * In particular, Dropstab and ICODrops never share control state or runs.
 */
export const FOMO_V2_MANAGED_PARSERS: readonly FomoV2ManagedParserDefinition[] =
  Object.freeze([
    {
      parserKey: "market:coingecko",
      label: "Projects catalog · CoinGecko",
      description: "Imports the immutable CoinGecko project snapshot; live market refresh is configured through environment variables.",
      pipeline: "market",
      sourceType: "coingecko",
      target: "FOMO v2 project catalog",
      defaultIntervalMinutes: 360,
      defaultRunMode: "dry-run",
      defaultLimit: 100,
      upstreamParserKey: "coingecko:projects",
      writeRequiresSnapshot: true,
    },
    {
      parserKey: "funding:dropstab",
      label: "Funding · Dropstab",
      description: "Funding rounds imported from Dropstab parser data.",
      pipeline: "funding",
      sourceType: "dropstab",
      target: "FOMO v2 funding",
      defaultIntervalMinutes: 360,
      defaultRunMode: "dry-run",
      defaultLimit: 100,
      upstreamParserKey: "dropstab:coin-details",
      writeRequiresSnapshot: true,
    },
    {
      parserKey: "funding:icodrops",
      label: "Funding · ICODrops fallback",
      description: "Fallback funding rounds from ICODrops, isolated from Dropstab.",
      pipeline: "funding",
      sourceType: "icodrops",
      target: "FOMO v2 funding",
      defaultIntervalMinutes: 360,
      defaultRunMode: "dry-run",
      defaultLimit: 100,
      upstreamParserKey: "icodrops:projects",
      writeRequiresSnapshot: true,
    },
    {
      parserKey: "funding:intel_fundraising",
      label: "Funding · Intel feed",
      description: "Intel feed gap-fill for funding rows whose domain identity is Dropstab.",
      pipeline: "funding",
      sourceType: "dropstab",
      feed: "intel_fundraising",
      target: "FOMO v2 funding",
      defaultIntervalMinutes: 360,
      defaultRunMode: "dry-run",
      defaultLimit: 100,
      upstreamParserKey: "dropstab:fundraising",
      writeRequiresSnapshot: true,
    },
    {
      parserKey: "ico:icodrops",
      label: "ICO profiles · ICODrops",
      description: "ICO project profiles from ICODrops parser data.",
      pipeline: "ico",
      sourceType: "icodrops",
      target: "FOMO v2 ICO profiles",
      defaultIntervalMinutes: 360,
      defaultRunMode: "dry-run",
      defaultLimit: 100,
      upstreamParserKey: "icodrops:projects",
      writeRequiresSnapshot: true,
    },
    {
      parserKey: "backers:dropstab",
      label: "Backers · Dropstab",
      description: "Investor and fund profiles from an immutable Dropstab snapshot.",
      pipeline: "backers",
      sourceType: "dropstab",
      target: "FOMO v2 backers",
      defaultIntervalMinutes: 360,
      defaultRunMode: "dry-run",
      defaultLimit: 100,
      upstreamParserKey: "dropstab:investors",
      writeRequiresSnapshot: true,
    },
    {
      parserKey: "backers:intel",
      label: "Backers · Intel",
      description: "Investor and fund profiles from the Intel parser collection.",
      pipeline: "backers",
      sourceType: "intel",
      target: "FOMO v2 backers",
      defaultIntervalMinutes: 360,
      defaultRunMode: "dry-run",
      defaultLimit: 100,
    },
    {
      parserKey: "vesting:dropstab",
      label: "Vesting · Dropstab",
      description: "Vesting allocations and schedules from Dropstab.",
      pipeline: "vesting",
      sourceType: "dropstab",
      target: "FOMO v2 vesting",
      defaultIntervalMinutes: 720,
      defaultRunMode: "dry-run",
      defaultLimit: 100,
      upstreamParserKey: "dropstab:coin-details",
      writeRequiresSnapshot: true,
    },
    {
      parserKey: "unlocks:dropstab",
      label: "Unlocks · Dropstab",
      description: "Unlock events from Dropstab vesting data.",
      pipeline: "unlocks",
      sourceType: "dropstab",
      target: "FOMO v2 unlocks",
      defaultIntervalMinutes: 360,
      defaultRunMode: "dry-run",
      defaultLimit: 100,
      upstreamParserKey: "dropstab:coin-details",
      writeRequiresSnapshot: true,
    },
    {
      parserKey: "activities:dropstab",
      label: "Activities · Dropstab",
      description: "Activity documents whose parser provider is Dropstab.",
      pipeline: "activities",
      sourceType: "dropstab",
      target: "FOMO v2 activities review",
      defaultIntervalMinutes: 60,
      defaultRunMode: "dry-run",
      defaultLimit: 100,
      upstreamParserKey: "activities:dropstab",
      writeRequiresSnapshot: true,
    },
    {
      parserKey: "activities:icodrops",
      label: "Activities · ICODrops",
      description: "Activity documents whose parser provider is ICODrops.",
      pipeline: "activities",
      sourceType: "icodrops",
      target: "FOMO v2 activities review",
      defaultIntervalMinutes: 60,
      defaultRunMode: "dry-run",
      defaultLimit: 100,
    },
    {
      parserKey: "activities:legacy",
      label: "Activities · Legacy parser",
      description: "Legacy activity/news parser rows from the primary source collection.",
      pipeline: "activities",
      sourceType: "legacy",
      target: "FOMO v2 activities review",
      defaultIntervalMinutes: 60,
      defaultRunMode: "dry-run",
      defaultLimit: 100,
    },
  ] as FomoV2ManagedParserDefinition[]);

const MANAGED_PARSERS_BY_KEY = new Map(
  FOMO_V2_MANAGED_PARSERS.map((definition) => [
    definition.parserKey,
    definition,
  ])
);

export function managedParserDefinition(
  parserKey: string
): FomoV2ManagedParserDefinition | undefined {
  return MANAGED_PARSERS_BY_KEY.get(String(parserKey || "").trim());
}

export const FOMO_V2_PARSER_GLOBAL_DOCUMENT_ID =
  "000000000000000000000001";
export const FOMO_V2_PARSER_CONTROL_MIN_INTERVAL_MINUTES = 1;
export const FOMO_V2_PARSER_CONTROL_MAX_INTERVAL_MINUTES = 7 * 24 * 60;
export const FOMO_V2_PARSER_CONTROL_DEFAULT_LEASE_MS = 30 * 60 * 1000;
export const FOMO_V2_PARSER_CONTROL_HEARTBEAT_MS = 30 * 1000;

export function isFomoV2ParserControlWorkerEnabled(
  env: NodeJS.ProcessEnv = process.env,
  argv: string[] = process.argv
): boolean {
  const explicit = String(
    env.FOMO_V2_PARSER_CONTROL_WORKER_ENABLED ?? ""
  )
    .trim()
    .toLowerCase();
  if (["1", "true", "yes", "on"].includes(explicit)) return true;
  if (["0", "false", "no", "off"].includes(explicit)) return false;
  // FomoV2Module is shared with the dedicated market worker. Parser imports
  // belong to the API/control process unless explicitly opted in there.
  return !argv.some((value) => /fomo-v2-market-worker/i.test(String(value)));
}
