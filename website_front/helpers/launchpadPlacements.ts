import { IProject } from "../types/global_types";
import {
  LaunchpadPlacement,
  LaunchpadPlacementDisplayProject,
} from "../types/launchpadPlacements";

type UnknownRecord = Record<string, unknown>;

export type LaunchpadPlacementCryptoProject = IProject & {
  _promotionKind: "launchpad";
  _placementId: string;
  _launchpadPoolId: string;
  _placementHref: string;
  _placementFeatured: boolean;
  _placementAd: boolean;
  _placementBanner: LaunchpadPlacement["banner"];
  _placementPoolId?: string;
};

const asRecord = (value: unknown): UnknownRecord =>
  value && typeof value === "object" && !Array.isArray(value)
    ? (value as UnknownRecord)
    : {};

const stringValue = (...values: unknown[]): string => {
  const value = values.find(
    (item) => typeof item === "string" && item.trim().length > 0
  );
  return typeof value === "string" ? value.trim() : "";
};

const numberValue = (...values: unknown[]): number | undefined => {
  for (const value of values) {
    if (value === null || value === undefined || value === "") continue;
    const parsed = Number(value);
    if (Number.isFinite(parsed)) return parsed;
  }
  return undefined;
};

const arrayValues = (...values: unknown[]): string[] => {
  const output: string[] = [];
  values.forEach((value) => {
    const items = Array.isArray(value) ? value : value ? [value] : [];
    items.forEach((item) => {
      const text =
        typeof item === "string"
          ? item.trim()
          : stringValue(asRecord(item).name, asRecord(item).value);
      if (text && !output.includes(text)) output.push(text);
    });
  });
  return output;
};

const unixSeconds = (value: unknown): number | undefined => {
  const parsed = numberValue(value);
  if (parsed === undefined || parsed <= 0) return undefined;
  return parsed > 10_000_000_000 ? Math.floor(parsed / 1000) : Math.floor(parsed);
};

const formatDate = (value: unknown): string => {
  if (!value) return "—";
  const numeric = unixSeconds(value);
  const date = numeric ? new Date(numeric * 1000) : new Date(String(value));
  if (Number.isNaN(date.getTime())) return "—";
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  }).format(date);
};

const groupDigits = (value: string): string =>
  value.replace(/\B(?=(\d{3})+(?!\d))/g, ",");

const formatContractAmount = (value: unknown, decimals: number): string => {
  const raw = stringValue(value);
  if (!raw) return "—";
  if (!/^\d+$/.test(raw)) return raw;

  const safeDecimals = Math.max(0, Math.min(36, Math.floor(decimals)));
  const padded = safeDecimals ? raw.padStart(safeDecimals + 1, "0") : raw;
  const whole = safeDecimals ? padded.slice(0, -safeDecimals) : padded;
  const fraction = safeDecimals
    ? padded.slice(-safeDecimals).replace(/0+$/, "").slice(0, 4)
    : "";
  return `${groupDigits(whole)}${fraction ? `.${fraction}` : ""}`;
};

const percentFromRawAmounts = (raised: unknown, target: unknown): number => {
  const raisedRaw = stringValue(raised);
  const targetRaw = stringValue(target);
  if (!/^\d+$/.test(raisedRaw) || !/^\d+$/.test(targetRaw)) return 0;
  try {
    const denominator = BigInt(targetRaw);
    if (denominator === BigInt(0)) return 0;
    const basisPoints = (BigInt(raisedRaw) * BigInt(10_000)) / denominator;
    return Math.max(0, Math.min(100, Number(basisPoints) / 100));
  } catch {
    return 0;
  }
};

const formatTimeLeft = (target?: number): string => {
  if (!target) return "—";
  const seconds = Math.max(0, target - Math.floor(Date.now() / 1000));
  if (seconds === 0) return "Ended";
  const days = Math.floor(seconds / 86_400);
  const hours = Math.floor((seconds % 86_400) / 3_600);
  const minutes = Math.floor((seconds % 3_600) / 60);
  if (days > 0) return `${days}d ${hours}h`;
  if (hours > 0) return `${hours}h ${minutes}m`;
  return `${Math.max(1, minutes)}m`;
};

const scheduleState = (
  placement: LaunchpadPlacement,
  explicitStatus: string
): { status: string; timeLeft: string; endsAt?: number } => {
  const params = placement.pool?.createParams || {};
  const onchain = asRecord(placement.pool?.onchainState);
  const now = Math.floor(Date.now() / 1000);
  const stakeStart = unixSeconds(params.stakeStart);
  const greenStart = unixSeconds(params.greenStart);
  const greenEnd = unixSeconds(params.greenEnd);
  const yellowSeats = numberValue(params.yellowSeats) || 0;
  const yellowSlotDuration = numberValue(params.yellowSlotDuration) || 0;
  const endsAt = greenEnd
    ? greenEnd + Math.max(0, yellowSeats) * Math.max(0, yellowSlotDuration)
    : undefined;

  if (onchain.closed === true || onchain.isClosed === true) {
    return { status: "Completed", timeLeft: "Ended", endsAt };
  }
  if (explicitStatus) {
    return {
      status: explicitStatus,
      timeLeft: formatTimeLeft(endsAt || greenEnd),
      endsAt,
    };
  }
  if (stakeStart && now < stakeStart) {
    return { status: "Upcoming", timeLeft: formatTimeLeft(stakeStart), endsAt };
  }
  if (greenStart && now < greenStart) {
    return {
      status: "Staking Live",
      timeLeft: formatTimeLeft(greenStart),
      endsAt,
    };
  }
  if (endsAt && now < endsAt) {
    return {
      status: "Purchase Live",
      timeLeft: formatTimeLeft(endsAt),
      endsAt,
    };
  }
  if (greenEnd && now >= (endsAt || greenEnd)) {
    return { status: "Ended", timeLeft: "Ended", endsAt };
  }
  return { status: "Active", timeLeft: "—", endsAt };
};

export const getLaunchpadPlacementHref = (
  placement: LaunchpadPlacement
): string => {
  const configuredHref = stringValue(placement.banner?.linkUrl);
  if (/^(?:https?:\/\/|\/(?!\/))/i.test(configuredHref)) return configuredHref;
  const poolId = placement.launchpadPoolId || placement.pool?.id;
  return `/utility/launchpad/${encodeURIComponent(String(poolId))}`;
};

export const toLaunchpadPlacementDisplayProject = (
  placement: LaunchpadPlacement
): LaunchpadPlacementDisplayProject => {
  const poolMetadata = asRecord(placement.pool?.metadata);
  const projectMetadata = asRecord(placement.canonicalProject?.metadata);
  const onchainState = asRecord(placement.pool?.onchainState);
  const params = placement.pool?.createParams || {};
  const categories = arrayValues(
    poolMetadata.categories,
    poolMetadata.category,
    projectMetadata.categories,
    projectMetadata.category,
    projectMetadata.sector,
    projectMetadata.niche
  );
  const decimals = numberValue(poolMetadata.amountDisplayDecimals) ?? 18;
  const investTokenSymbol =
    stringValue(
      poolMetadata.investTokenSymbol,
      projectMetadata.investTokenSymbol
    ) || "USDT";
  const targetAmount = formatContractAmount(params.targetAmount, decimals);
  const minInvestment = formatContractAmount(params.minInvestment, decimals);
  const raisedAmount =
    onchainState.raisedAmount ??
    onchainState.totalInvested ??
    onchainState.sumInvest ??
    onchainState.investedAmount;
  const explicitStatus = stringValue(
    poolMetadata.displayStatus,
    poolMetadata.launchStatus,
    onchainState.displayStatus
  );
  const schedule = scheduleState(placement, explicitStatus);
  const participantCount = numberValue(
    onchainState.participants,
    onchainState.participantCount,
    poolMetadata.participants
  );

  return {
    placementId: placement.id,
    launchpadPoolId: placement.launchpadPoolId,
    href: getLaunchpadPlacementHref(placement),
    name: placement.canonicalProject?.name || "Untitled project",
    symbol: placement.canonicalProject?.symbol,
    logo: stringValue(
      placement.canonicalProject?.logo,
      projectMetadata.logo
    ),
    description:
      stringValue(
        placement.canonicalProject?.description,
        projectMetadata.description,
        poolMetadata.description
      ) || "Launchpad project",
    categories,
    category: categories.join(" • ") || "Launchpad",
    dealType:
      stringValue(poolMetadata.dealType, poolMetadata.saleType, poolMetadata.type) ||
      "Launchpad",
    status: schedule.status,
    target:
      targetAmount === "—" ? targetAmount : `${targetAmount} ${investTokenSymbol}`,
    allocation:
      minInvestment === "—"
        ? minInvestment
        : `${minInvestment} ${investTokenSymbol} min`,
    participants:
      participantCount === undefined
        ? undefined
        : `${participantCount.toLocaleString("en-US")} participants`,
    timeLeft: schedule.timeLeft,
    progress: percentFromRawAmounts(raisedAmount, params.targetAmount),
    created: formatDate(placement.pool?.publishedAt),
    promotedUntil: formatDate(schedule.endsAt),
    featured: placement.featured === true,
    ad: placement.ad === true,
    banner: placement.banner || {},
    poolId: placement.pool?.poolId,
  };
};

export const toLaunchpadPlacementCryptoProject = (
  placement: LaunchpadPlacement
): LaunchpadPlacementCryptoProject => {
  const display = toLaunchpadPlacementDisplayProject(placement);
  const stakeStart = unixSeconds(placement.pool?.createParams?.stakeStart);
  const startDate = stakeStart ? new Date(stakeStart * 1000) : undefined;

  return {
    _id: `launchpad:${placement.id}`,
    name: display.name,
    symbol: display.symbol,
    logo: display.logo || "",
    image: display.logo || "",
    status: display.status,
    niche: display.category,
    categories: display.categories,
    type: display.dealType,
    projectType: "launchpad",
    description: display.description,
    totalRaised: display.target,
    investors: [],
    rating: "",
    fullness: String(display.progress),
    banner: display.banner.desktopUrl || display.banner.mobileUrl || "",
    lastFunding: startDate,
    dateAdded: startDate,
    isSponsored: display.ad,
    _promotionKind: "launchpad",
    _placementId: placement.id,
    _launchpadPoolId: placement.launchpadPoolId,
    _placementHref: display.href,
    _placementFeatured: display.featured,
    _placementAd: display.ad,
    _placementBanner: display.banner,
    _placementPoolId: display.poolId,
  } as LaunchpadPlacementCryptoProject;
};

export const isLaunchpadPlacementCryptoProject = (
  project?: IProject | null
): project is LaunchpadPlacementCryptoProject =>
  (project as LaunchpadPlacementCryptoProject | undefined)?._promotionKind ===
  "launchpad";
