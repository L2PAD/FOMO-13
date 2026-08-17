import { formatUnits, parseUnits } from "viem";
import { LOADER_API } from "../config/api";
import type {
  FomoV2LaunchpadDetail,
  FomoV2LaunchpadSummary,
  FomoV2LaunchpadToken,
  FomoV2LaunchpadTransactionAction,
  LaunchpadLifecycle,
  LaunchpadZone,
} from "../types/fomoV2Launchpad";
import type {
  LaunchpadProjectDetailData,
  SimilarProject,
  TimelineStep,
  ZoneVariant,
} from "../components/layouts/launchpad/LaunchpadProjectDetail/types";
import type {
  FeaturedProjectData,
  LaunchpadProject,
} from "../components/layouts/launchpad/LaunchpadProjects/types";

const UINT_PATTERN = /^(0|[1-9][0-9]*)$/;
const DECIMAL_PATTERN = /^(?:0|[1-9][0-9]*)(?:\.[0-9]*)?$/;

export const rawUint = (value: unknown, fallback = "0"): string => {
  const normalized = String(value ?? "").trim();
  return UINT_PATTERN.test(normalized) ? normalized : fallback;
};

export const rawBigInt = (value: unknown): bigint => BigInt(rawUint(value));

const groupedInteger = (value: string): string => value.replace(/\B(?=(\d{3})+(?!\d))/g, ",");

const formatCanonicalFunding = (value?: number): string => {
  if (!Number.isFinite(value) || !value) return "";
  return `$${new Intl.NumberFormat("en-US", { maximumFractionDigits: 2 }).format(value)}`;
};

export const formatRawAmount = (
  value: unknown,
  decimals = 18,
  maxFractionDigits = 4
): string => {
  const formatted = formatUnits(rawBigInt(value), Math.max(0, decimals));
  const [whole, fraction = ""] = formatted.split(".");
  const compactFraction = fraction.slice(0, Math.max(0, maxFractionDigits)).replace(/0+$/, "");
  return `${groupedInteger(whole)}${compactFraction ? `.${compactFraction}` : ""}`;
};

export const formatTokenAmount = (
  value: unknown,
  token?: Partial<FomoV2LaunchpadToken> | null,
  maxFractionDigits = 4
): string => {
  const decimals = Number.isInteger(token?.decimals) ? Number(token?.decimals) : 18;
  const symbol = token?.symbol?.trim();
  const amount = formatRawAmount(value, decimals, maxFractionDigits);
  return symbol ? `${amount} ${symbol}` : amount;
};

export const amountToRaw = (value: string, decimals: number): bigint => {
  const normalized = value.trim();
  if (!DECIMAL_PATTERN.test(normalized) || normalized.endsWith(".")) {
    throw new Error("Enter a valid investment amount.");
  }
  return parseUnits(normalized, decimals);
};

export const validateInvestmentAmount = (
  value: string,
  decimals: number,
  minRaw: string,
  maxRaw: string
): { raw?: bigint; error?: string } => {
  try {
    const raw = amountToRaw(value, decimals);
    if (raw <= 0n) return { error: "Investment amount must be greater than zero." };
    if (raw < rawBigInt(minRaw)) return { error: "Investment amount is below the minimum." };
    const max = rawBigInt(maxRaw);
    if (max > 0n && raw > max) return { error: "Investment amount exceeds your current allocation." };
    return { raw };
  } catch (error) {
    return { error: error instanceof Error ? error.message : "Invalid investment amount." };
  }
};

export const fundingProgress = (raisedRaw: unknown, targetRaw: unknown): number => {
  const raised = rawBigInt(raisedRaw);
  const target = rawBigInt(targetRaw);
  if (target === 0n) return 0;
  const basisPoints = (raised * 10_000n) / target;
  return Number(basisPoints > 10_000n ? 10_000n : basisPoints) / 100;
};

export const resolveMediaUrl = (value?: string): string => {
  const url = String(value || "").trim();
  if (!url || /^(?:https?:|data:|blob:)/i.test(url)) return url;
  return `${LOADER_API}${url.startsWith("/") ? "" : "/"}${url}`;
};

export const truncateWallet = (value: string): string => {
  const wallet = String(value || "");
  return wallet.length > 12 ? `${wallet.slice(0, 6)}...${wallet.slice(-4)}` : wallet;
};

export const normalizeLaunchpadZone = (
  zone: LaunchpadZone | number | undefined,
  activeStakeCount = 0
): LaunchpadZone => {
  if (zone === "green" || zone === 1) return "green";
  if (zone === "yellow" || zone === 2) return "yellow";
  if (zone === "red") return "red";
  return activeStakeCount > 0 ? "red" : "none";
};

export const isCurrentLaunchpadInvestZone = (
  lifecycle: LaunchpadLifecycle,
  zone: LaunchpadZone
): boolean => (lifecycle === "green" && zone === "green")
  || (lifecycle === "yellow" && zone === "yellow");

export const lifecycleTimelineIndex = (lifecycle: LaunchpadLifecycle): number => {
  switch (lifecycle) {
    case "green":
    case "yellow":
    case "ended_awaiting_close":
      return 1;
    case "closed_awaiting_settlement":
    case "claim":
    case "completed":
      return 2;
    case "scheduled":
    case "staking":
    default:
      return 0;
  }
};

const makeTimeline = (lifecycle: LaunchpadLifecycle): TimelineStep[] => {
  const activeIndex = lifecycleTimelineIndex(lifecycle);
  const steps: Array<Omit<TimelineStep, "isActive" | "isDone">> = [
    {
      id: "staking",
      label: "Staking",
      descriptionLines: ["Stake FOMO NFTs", "to secure allocation"],
      icon: "layers",
    },
    {
      id: "purchase",
      label: "Purchase",
      descriptionLines: ["Invest in the token", "sale"],
      icon: "cart",
    },
    {
      id: "distribution",
      label: "Distribution",
      descriptionLines: ["Claim", "your tokens"],
      icon: "gift",
    },
  ];
  return steps.map((step, index) => ({
    ...step,
    isActive: index === activeIndex && lifecycle !== "completed",
    isDone: index < activeIndex || lifecycle === "completed",
  }));
};

const lifecycleLabel = (lifecycle: LaunchpadLifecycle): string => {
  const labels: Record<string, string> = {
    scheduled: "Upcoming",
    staking: "Staking Live",
    green: "Purchase Live",
    yellow: "Purchase Live",
    ended_awaiting_close: "Sale Ended",
    closed_awaiting_settlement: "Settlement Pending",
    claim: "Claim Available",
    completed: "Completed",
  };
  return labels[lifecycle] || lifecycle.replace(/_/g, " ");
};

const unixValue = (value: unknown): bigint => rawBigInt(value);

export const formatTimeUntil = (timestampRaw: unknown, nowSeconds = BigInt(Math.floor(Date.now() / 1000))): string => {
  const timestamp = unixValue(timestampRaw);
  if (timestamp <= nowSeconds) return "Ended";
  let seconds = timestamp - nowSeconds;
  const days = seconds / 86_400n;
  seconds %= 86_400n;
  const hours = seconds / 3_600n;
  seconds %= 3_600n;
  const minutes = seconds / 60n;
  if (days > 0n) return `${days}d ${hours}h`;
  if (hours > 0n) return `${hours}h ${minutes}m`;
  return `${minutes}m`;
};

const endTimeFor = (item: FomoV2LaunchpadSummary): string => {
  const params = item.pool.createParams || {};
  if (item.lifecycle === "scheduled") return rawUint(params.stakeStartTime ?? params.stakeStart);
  if (item.lifecycle === "staking") return rawUint(params.greenStartTime ?? params.greenStart);
  if (item.lifecycle === "green") return rawUint(params.greenEndTime ?? params.greenEnd);
  if (item.lifecycle === "yellow") {
    const slotStart = rawBigInt(item.participation?.yellowSlotStart);
    const slotEnd = rawBigInt(item.participation?.yellowSlotEnd);
    const now = BigInt(Math.floor(Date.now() / 1_000));
    if (slotStart > 0n && slotEnd > slotStart) {
      return (now < slotStart ? slotStart : slotEnd).toString();
    }
    const greenEnd = rawBigInt(params.greenEndTime ?? params.greenEnd);
    const seats = rawBigInt(params.yellowSeats);
    const duration = rawBigInt(params.slotDuration ?? params.yellowSlotDuration);
    return (greenEnd + seats * duration).toString();
  }
  return "0";
};

const purchaseEndTimeFor = (item: FomoV2LaunchpadSummary): string => {
  const params = item.pool.createParams || {};
  const state = item.pool.onchainState || {};
  const greenEnd = rawBigInt(
    state.greenEnd ?? params.greenEndTime ?? params.greenEnd
  );
  const seats = rawBigInt(state.yellowSeats ?? params.yellowSeats);
  const duration = rawBigInt(
    state.yellowSlotDuration ?? params.slotDuration ?? params.yellowSlotDuration
  );
  return (greenEnd + seats * duration).toString();
};

const nextStageCountdownFor = (
  item: FomoV2LaunchpadSummary
): { label: string; value: string } => {
  const params = item.pool.createParams || {};
  const state = item.pool.onchainState || {};
  const countdown = (timestamp: unknown): string => {
    const normalized = rawUint(timestamp);
    return normalized === "0" ? "Pending" : formatTimeUntil(normalized);
  };

  switch (item.lifecycle) {
    case "scheduled":
      return {
        label: "Staking opens in",
        value: countdown(state.stakeStart ?? params.stakeStartTime ?? params.stakeStart),
      };
    case "staking":
      return {
        label: "Purchase opens in",
        value: countdown(state.greenStart ?? params.greenStartTime ?? params.greenStart),
      };
    case "green":
    case "yellow":
      return {
        label: "Distribution opens in",
        value: countdown(purchaseEndTimeFor(item)),
      };
    case "claim":
      return { label: "Distribution", value: "Live" };
    case "completed":
      return { label: "Distribution", value: "Completed" };
    case "ended_awaiting_close":
    case "closed_awaiting_settlement":
    default:
      return { label: "Distribution", value: "Pending" };
  }
};

const targetRawFor = (item: FomoV2LaunchpadSummary): string => rawUint(
  item.pool.onchainState?.targetAmount ?? item.pool.targetAmount ?? item.pool.createParams?.targetAmount
);

const raisedRawFor = (item: FomoV2LaunchpadSummary): string => rawUint(
  item.pool.onchainState?.raisedAmount ?? item.pool.raisedAmount
);

const investTokenFor = (item: FomoV2LaunchpadSummary): FomoV2LaunchpadToken => {
  if (item.contract?.investToken) return item.contract.investToken;
  if (item.pool.investToken && typeof item.pool.investToken === "object") return item.pool.investToken;
  return {
    address: typeof item.pool.investToken === "string" ? item.pool.investToken : "",
    symbol: "USDT",
    decimals: 18,
  };
};

export const isLaunchpadFeatured = (item: FomoV2LaunchpadSummary): boolean =>
  item.placement?.featured === true || item.featured === true;

export const isLaunchpadAd = (item: FomoV2LaunchpadSummary): boolean =>
  item.placement?.ad === true || item.ad === true;

const statusVariantFor = (lifecycle: LaunchpadLifecycle): SimilarProject["statusVariant"] => {
  if (lifecycle === "claim" || lifecycle === "completed") return "green";
  if (lifecycle === "green" || lifecycle === "yellow" || lifecycle === "staking") return "blue";
  return "yellow";
};

const mapSimilar = (item: FomoV2LaunchpadSummary): SimilarProject => {
  const token = investTokenFor(item);
  const target = targetRawFor(item);
  const raised = raisedRawFor(item);
  const maxAllowed = item.participation?.maxAllowedNow || "0";
  return {
    id: item.slug || item.id,
    name: item.launch.title || item.project.name,
    category: item.launch.category || item.project.categories?.join(" • ") || "—",
    logo: resolveMediaUrl(item.launch.logoUrl || item.project.logoUrl),
    statusLabel: lifecycleLabel(item.lifecycle),
    statusVariant: statusVariantFor(item.lifecycle),
    totalRaise: formatTokenAmount(target, token),
    allocation: item.launch.tokenDisplay?.allocationLabel || formatTokenAmount(maxAllowed, token),
    fundingProgress: fundingProgress(raised, target),
    timeLeft: item.launch.flags?.showCountdown === false
      ? undefined
      : endTimeFor(item) === "0" ? "Ended" : formatTimeUntil(endTimeFor(item)),
    isEligible: Boolean(item.participation?.canInvestNow),
  };
};

export const mapLaunchpadSummaryToCard = (item: FomoV2LaunchpadSummary): LaunchpadProject => {
  const token = investTokenFor(item);
  const target = targetRawFor(item);
  const raised = raisedRawFor(item);
  const maxAllowed = item.participation?.maxAllowedNow || "0";
  return {
    id: item.slug || item.id,
    name: item.launch.title || item.project.name,
    category: item.launch.category || item.project.categories?.join(" • ") || "—",
    logo: resolveMediaUrl(item.launch.logoUrl || item.project.logoUrl),
    status: lifecycleLabel(item.lifecycle),
    raise: formatTokenAmount(target, token),
    allocation: item.launch.tokenDisplay?.allocationLabel || formatTokenAmount(maxAllowed, token),
    participants: item.launch.flags?.showParticipants === false
      ? undefined
      : `${item.pool.onchainState?.participantCount ?? item.pool.onchainState?.participants ?? 0} participants`,
    timeLeft: item.launch.flags?.showCountdown === false
      ? undefined
      : endTimeFor(item) === "0" ? "Ended" : formatTimeUntil(endTimeFor(item)),
    progress: fundingProgress(raised, target),
    isEligible: Boolean(item.participation?.canInvestNow),
  };
};

export const mapLaunchpadSummaryToFeaturedCard = (
  item: FomoV2LaunchpadSummary
): FeaturedProjectData => ({
  ...mapLaunchpadSummaryToCard(item),
  description: item.launch.shortDescription || item.launch.description || item.project.description || "",
  badges: [
    ...(isLaunchpadFeatured(item) ? [{ label: "Featured", variant: "featured" as const }] : []),
    { label: lifecycleLabel(item.lifecycle), variant: "live" as const },
    ...(item.launch.saleType ? [{ label: item.launch.saleType, variant: "outline" as const }] : []),
  ],
});

const mapZoneVariant = (zone: LaunchpadZone | number | undefined, stakeCount = 0): ZoneVariant => {
  const normalized = normalizeLaunchpadZone(zone, stakeCount);
  return normalized === "none" ? "red" : normalized;
};

export const mapLaunchpadDetailToView = (
  detail: FomoV2LaunchpadDetail
): LaunchpadProjectDetailData => {
  const participation = detail.participation;
  const onchain = detail.pool.onchainState || {};
  const params = detail.pool.createParams || {};
  const investToken = detail.contract.investToken;
  const target = targetRawFor(detail);
  const raised = raisedRawFor(detail);
  const minInvestment = rawUint(params.minInvestmentAmount ?? params.minInvestment ?? onchain.minInvestment);
  const maxAllowed = rawUint(participation?.maxAllowedNow);
  const category = detail.launch.category || detail.project.categories?.join(" • ") || "—";
  const name = detail.launch.title || detail.project.name;
  const socials = { ...detail.project.socials, ...detail.launch.links };
  if (!socials.website && detail.project.website) socials.website = detail.project.website;
  const timeEnd = endTimeFor(detail);
  const projectToken = detail.contract.projectToken;
  const claimToken = participation?.claimAsset || projectToken || investToken;
  const claimAmount = rawUint(participation?.claimAmount);
  const claimedAllocation = participation?.claimed
    ? formatTokenAmount(claimAmount, claimToken)
    : "—";
  const leaderboardClaimToken = detail.contract.claimKind === "payment_token_refund"
    ? investToken
    : projectToken || investToken;
  const nextStageCountdown = nextStageCountdownFor(detail);
  const zone = normalizeLaunchpadZone(participation?.zone, participation?.activeStakeCount);

  return {
    id: detail.id,
    name,
    logo: resolveMediaUrl(detail.launch.logoUrl || detail.project.logoUrl),
    statusBadge: lifecycleLabel(detail.lifecycle),
    typeBadge: detail.launch.saleType || "Token Sale",
    category,
    description: detail.launch.shortDescription || detail.launch.description || detail.project.description || "",
    socialLinks: socials,
    totalRaised: formatTokenAmount(raised, investToken),
    tokenPrice: detail.launch.tokenDisplay?.priceLabel || "—",
    participants: String(onchain.participantCount ?? onchain.participants ?? detail.leaderboard.length),
    saleTimeline: makeTimeline(detail.lifecycle),
    aboutTitle: "About",
    aboutText: detail.launch.about || detail.launch.description || detail.project.description || "",
    aboutTotalRaised: detail.launch.funding?.totalRaisedLabel
      || detail.project.funding?.totalRaisedLabel
      || formatCanonicalFunding(detail.project.funding?.totalRaisedUsd)
      || formatTokenAmount(raised, investToken),
    aboutFundingType: detail.launch.funding?.fundingType
      || detail.project.funding?.fundingType
      || detail.project.funding?.fundingTypes?.join(", ")
      || detail.launch.saleType
      || "—",
    problem: detail.launch.problem || "—",
    solution: detail.launch.solution || "—",
    tokenUtility: detail.launch.tokenUtility || "—",
    investors: (detail.launch.investors || detail.project.investors || []).map((investor, index) => ({
      id: investor.id || `investor-${index}`,
      name: investor.name,
      logo: resolveMediaUrl(investor.logoUrl),
    })),
    team: (detail.launch.team || detail.project.team || []).map((member, index) => ({
      id: member.id || `team-${index}`,
      name: member.name,
      role: member.role || "",
      avatar: resolveMediaUrl(member.avatarUrl),
    })),
    revenueModel: detail.launch.revenueModel || "—",
    faq: (detail.launch.faq || []).map((item, index) => ({
      id: `faq-${index}`,
      question: item.question,
      answer: item.answer,
    })),
    allocation: {
      position: participation?.rank && String(participation.rank) !== "0" ? `#${participation.rank}` : "—",
      amount: claimedAllocation,
      zone: mapZoneVariant(zone, participation?.activeStakeCount),
      congratsMessage: "You have guaranteed access to this allocation round.",
    },
    nftStaked: {
      subtitle: participation?.activeStakeCount
        ? `${participation.activeStakeCount} NFT${participation.activeStakeCount === 1 ? "" : "s"} staked`
        : "Stake your FOMO NFT to join the allocation queue",
      countdownLabel: nextStageCountdown.label,
      countdownValue: nextStageCountdown.value,
    },
    leaderboard: detail.leaderboard.map((entry, index) => ({
      rank: Number(entry.rank) || index + 1,
      name: entry.displayName || truncateWallet(entry.wallet),
      avatar: resolveMediaUrl(entry.avatarUrl),
      nftCount: entry.activeStakeCount,
      nftLevel: entry.activeStakeCount,
      nftsStaked: entry.activeStakeCount,
      allocation: entry.claimed
        ? formatTokenAmount(entry.claimAmount, leaderboardClaimToken)
        : "—",
      zone: mapZoneVariant(entry.zone, entry.activeStakeCount),
      isCurrentUser: Boolean(participation?.wallet) &&
        participation?.wallet.toLowerCase() === entry.wallet.toLowerCase(),
    })),
    flags: {
      greenFlags: detail.launch.analysisFlags?.green || detail.project.analysisFlags?.green || [],
      yellowFlags: detail.launch.analysisFlags?.yellow || detail.project.analysisFlags?.yellow || [],
      redFlags: detail.launch.analysisFlags?.red || detail.project.analysisFlags?.red || [],
    },
    participationRules: detail.launch.participationRules || [],
    ido: {
      raised: formatTokenAmount(raised, investToken),
      hardCap: formatTokenAmount(target, investToken),
      progress: fundingProgress(raised, target),
      participants: onchain.participantCount ?? onchain.participants ?? detail.leaderboard.length,
      tokenPrice: detail.launch.tokenDisplay?.priceLabel || "—",
      allocationSize: detail.launch.tokenDisplay?.allocationLabel || formatTokenAmount(maxAllowed, investToken),
      minInvestment: formatTokenAmount(minInvestment, investToken),
      maxInvestment: formatTokenAmount(maxAllowed, investToken),
      timeRemaining: timeEnd === "0" ? "Ended" : formatTimeUntil(timeEnd),
      zoneDescriptions: {
        green: detail.launch.zoneDescriptions?.green || "Guaranteed purchase window.",
        yellow: detail.launch.zoneDescriptions?.yellow || "Time-slot purchase window.",
        red: detail.launch.zoneDescriptions?.red || "Not currently eligible to invest.",
      },
    },
    similarProjects: (detail.similar || detail.similarProjects || []).map(mapSimilar),
    claimDisplay: {
      amount: formatRawAmount(claimAmount, claimToken?.decimals ?? 18),
      symbol: claimToken?.symbol || "Token",
      isRefund: participation?.canRefund === true || participation?.claimKind === "payment_token_refund",
      investment: formatTokenAmount(participation?.investedAmount, investToken),
    },
    display: {
      showLeaderboard: detail.launch.flags?.showLeaderboard !== false,
      showParticipants: detail.launch.flags?.showParticipants !== false,
      showCountdown: detail.launch.flags?.showCountdown !== false,
    },
  };
};

export interface LaunchpadRecoveryRecord {
  launchpadId: string;
  wallet: string;
  txHash: `0x${string}`;
  action: FomoV2LaunchpadTransactionAction;
  createdAt: string;
}

const RECOVERY_PREFIX = "fomo:launchpad:tx:v1";
const TX_HASH_PATTERN = /^0x[a-fA-F0-9]{64}$/;
const RECOVERY_ACTIONS: FomoV2LaunchpadTransactionAction[] = ["invest", "claim", "stake", "unstake"];

export const launchpadRecoveryKey = (launchpadId: string, wallet: string): string =>
  `${RECOVERY_PREFIX}:${launchpadId}:${wallet.toLowerCase()}`;

export const parseLaunchpadRecovery = (value: string | null): LaunchpadRecoveryRecord | null => {
  if (!value) return null;
  try {
    const parsed = JSON.parse(value) as Partial<LaunchpadRecoveryRecord>;
    if (!parsed.launchpadId || !parsed.wallet || !parsed.txHash || !parsed.createdAt) return null;
    if (!TX_HASH_PATTERN.test(parsed.txHash)) return null;
    if (!parsed.action || !RECOVERY_ACTIONS.includes(parsed.action)) return null;
    return parsed as LaunchpadRecoveryRecord;
  } catch {
    return null;
  }
};

export const readLaunchpadRecovery = (launchpadId: string, wallet: string): LaunchpadRecoveryRecord | null => {
  if (typeof window === "undefined") return null;
  try {
    return parseLaunchpadRecovery(
      window.localStorage.getItem(launchpadRecoveryKey(launchpadId, wallet))
    );
  } catch {
    return null;
  }
};

export const saveLaunchpadRecovery = (record: LaunchpadRecoveryRecord): void => {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(
      launchpadRecoveryKey(record.launchpadId, record.wallet),
      JSON.stringify(record)
    );
  } catch {
    // Receipt verification still runs in-memory when browser storage is unavailable.
  }
};

export const clearLaunchpadRecovery = (launchpadId: string, wallet: string): void => {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.removeItem(launchpadRecoveryKey(launchpadId, wallet));
  } catch {
    // Nothing else is required when browser storage is unavailable.
  }
};
