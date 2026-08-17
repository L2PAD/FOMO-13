import { Injectable } from "@nestjs/common";

/**
 * A resolved metric value.
 * IMPORTANT: `connected=false` means "no authoritative source yet" — the criterion
 * is currently NOT verifiable. This is NOT the same as value 0.
 */
export interface MetricValue {
  value: number;
  connected: boolean;
}

/**
 * A domain provider owns a small set of metric keys and knows their canonical source.
 * Add a new category/source by adding a provider — the engine never changes.
 */
export interface BadgeMetricProvider {
  readonly domain: string;
  readonly source: string;
  readonly connected: boolean;
  readonly metrics: string[];
  resolve(user: any, extra: Record<string, number>): Record<string, MetricValue>;
}

const mk = (value: number, connected: boolean): MetricValue => ({ value: Number(value || 0), connected });

// ---- CONNECTED providers (authoritative sources exist today) --------------------

class XpBadgeMetricProvider implements BadgeMetricProvider {
  domain = "xp"; source = "XP Ledger (user.activityXP)"; connected = true;
  metrics = ["xp"];
  resolve(user: any, extra: Record<string, number>): Record<string, MetricValue> {
    const xp = extra.xp != null ? extra.xp : Number(user?.activityXP || 0);
    return { xp: mk(xp, true) };
  }
}

class SpaceportBadgeMetricProvider implements BadgeMetricProvider {
  domain = "spaceport"; source = "SpacePort canonical progression"; connected = true;
  metrics = ["stakingDays", "accountLevel"];
  resolve(_user: any, extra: Record<string, number>): Record<string, MetricValue> {
    return {
      stakingDays: mk(extra.stakingDays || 0, true),
      accountLevel: mk(extra.accountLevel || 0, true),
    };
  }
}

class NftBadgeMetricProvider implements BadgeMetricProvider {
  domain = "nft-entitlement"; source = "NFT entitlement (user.nfts)"; connected = true;
  metrics = ["nftActive"];
  resolve(user: any): Record<string, MetricValue> {
    return { nftActive: mk(Array.isArray(user?.nfts) && user.nfts.length > 0 ? 1 : 0, true) };
  }
}

class LaunchpadBadgeMetricProvider implements BadgeMetricProvider {
  domain = "launchpad"; source = "Launchpad participations (user.claimedProjects)"; connected = true;
  metrics = ["launchpads"];
  resolve(user: any, extra: Record<string, number>): Record<string, MetricValue> {
    const fromUser = Array.isArray(user?.claimedProjects) ? user.claimedProjects.length : 0;
    const value = extra.launchpads != null ? extra.launchpads : fromUser;
    return { launchpads: mk(value, true) };
  }
}

// ---- NOT-CONNECTED providers (declare metrics as missing until wired) -----------
// They intentionally return connected=false so the engine treats them as unverifiable.

class NotConnectedProvider implements BadgeMetricProvider {
  connected = false;
  constructor(public domain: string, public source: string, public metrics: string[]) {}
  resolve(): Record<string, MetricValue> {
    const out: Record<string, MetricValue> = {};
    for (const m of this.metrics) out[m] = mk(0, false);
    return out;
  }
}

@Injectable()
export class BadgeMetricResolver {
  private readonly providers: BadgeMetricProvider[] = [
    new XpBadgeMetricProvider(),
    new SpaceportBadgeMetricProvider(),
    new NftBadgeMetricProvider(),
    new LaunchpadBadgeMetricProvider(),
    // Pending canonical sources — replace each with a real provider when wired:
    new NotConnectedProvider("nft-age", "NFT entitlement age", ["nftMembershipDays"]),
    new NotConnectedProvider("trade", "Trade ledger / Unified OTC-P2P", ["tradesCompleted", "uniqueCounterparties", "tradeScore", "otcVolumeUsd"]),
    new NotConnectedProvider("activity", "user_activity_daily / session analytics", ["activeDays30", "activeDays90", "activeDays365", "tasks"]),
    new NotConnectedProvider("referral", "referral canonical service", ["qualifiedReferralsL1"]),
    new NotConnectedProvider("earlyland", "EarlyLand task/campaign verification", ["verifiedCampaigns"]),
    new NotConnectedProvider("content", "content service", ["publishedIdeas"]),
    new NotConnectedProvider("portfolio", "portfolio service", ["publicPortfolio", "portfolioAgeDays", "qualifiedPortfolioUpdates"]),
    new NotConnectedProvider("contribution", "moderation/contribution source", ["verifiedReports"]),
    new NotConnectedProvider("launchpad-prime", "Prime launchpad projects source", ["primeProjects"]),
  ];

  private readonly metricIndex: Record<string, BadgeMetricProvider> = (() => {
    const idx: Record<string, BadgeMetricProvider> = {};
    for (const p of this.providers) for (const m of p.metrics) idx[m] = p;
    return idx;
  })();

  /** Resolve all metrics for a user. Missing sources are marked connected=false (NOT zero-truth). */
  resolve(user: any, extra: Record<string, number> = {}): Record<string, MetricValue> {
    const out: Record<string, MetricValue> = {};
    for (const p of this.providers) Object.assign(out, p.resolve(user, extra));
    return out;
  }

  isConnected(metric: string): boolean {
    return this.metricIndex[metric]?.connected === true;
  }

  sourceOf(metric: string): { source: string; connected: boolean } {
    const p = this.metricIndex[metric];
    return p ? { source: p.source, connected: p.connected } : { source: "unknown", connected: false };
  }
}
