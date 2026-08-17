export const FOMO_V2_UPSTREAM_PARSER_FLOWS = Object.freeze([
  {
    parserKey: "dropstab:coin-details",
    sourceType: "dropstab",
    label: "Dropstab · Coin details",
    importTargets: [
      { pipelineKey: "funding:dropstab", label: "Funding · Dropstab" },
      { pipelineKey: "vesting:dropstab", label: "Vesting · Dropstab" },
      { pipelineKey: "unlocks:dropstab", label: "Unlocks · Dropstab" },
    ],
  },
  {
    parserKey: "icodrops:projects",
    sourceType: "icodrops",
    label: "ICODrops · Projects",
    importTargets: [
      { pipelineKey: "ico:icodrops", label: "ICO profiles · ICODrops" },
      { pipelineKey: "funding:icodrops", label: "Funding · ICODrops" },
    ],
  },
  {
    parserKey: "dropstab:fundraising",
    sourceType: "dropstab",
    label: "Dropstab · Fundraising feed",
    importTargets: [
      {
        pipelineKey: "funding:intel_fundraising",
        label: "Funding · Dropstab Intel feed",
      },
    ],
  },
  {
    parserKey: "dropstab:investors",
    sourceType: "dropstab",
    label: "Dropstab · Investors",
    importTargets: [
      { pipelineKey: "backers:dropstab", label: "Backers · Dropstab" },
    ],
  },
  {
    parserKey: "coingecko:projects",
    sourceType: "coingecko",
    label: "CoinGecko · Projects",
    importTargets: [
      {
        pipelineKey: "market:coingecko",
        label: "Projects catalog · CoinGecko",
      },
    ],
  },
  {
    parserKey: "activities:dropstab",
    sourceType: "dropstab",
    label: "Activities · Dropstab",
    importTargets: [
      { pipelineKey: "activities:dropstab", label: "Activities · Dropstab" },
    ],
  },
] as const);

export type FomoV2UpstreamParserKey =
  (typeof FOMO_V2_UPSTREAM_PARSER_FLOWS)[number]["parserKey"];
export type FomoV2UpstreamPipelineKey =
  (typeof FOMO_V2_UPSTREAM_PARSER_FLOWS)[number]["importTargets"][number]["pipelineKey"];

export const FOMO_V2_UPSTREAM_PIPELINE_KEYS = Object.freeze(
  FOMO_V2_UPSTREAM_PARSER_FLOWS.flatMap((flow) =>
    flow.importTargets.map((target) => target.pipelineKey)
  )
);

export function upstreamParserFlow(parserKey: unknown) {
  const normalized = String(parserKey || "").trim();
  return FOMO_V2_UPSTREAM_PARSER_FLOWS.find(
    (flow) => flow.parserKey === normalized
  );
}

export function upstreamFlowForPipeline(pipelineKey: unknown) {
  const normalized = String(pipelineKey || "").trim();
  return FOMO_V2_UPSTREAM_PARSER_FLOWS.find((flow) =>
    flow.importTargets.some((target) => target.pipelineKey === normalized)
  );
}

export function upstreamPipelineAllowed(
  parserKey: unknown,
  sourceType: unknown,
  pipelineKey: unknown
): boolean {
  const flow = upstreamParserFlow(parserKey);
  return Boolean(
    flow &&
      flow.sourceType === String(sourceType || "").trim().toLowerCase() &&
      flow.importTargets.some(
        (target) => target.pipelineKey === String(pipelineKey || "").trim()
      )
  );
}
