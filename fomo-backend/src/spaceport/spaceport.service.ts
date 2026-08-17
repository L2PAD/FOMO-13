import { Injectable } from "@nestjs/common";
import { InjectModel } from "@nestjs/mongoose";
import { Model } from "mongoose";
import { User, UserDocument } from "src/user/user.model";
import { XpLedgerService } from "src/xp/xp-ledger.service";
import { RankResolverService } from "src/xp/rank-resolver.service";
import { SpaceportStakingService } from "src/spaceport-staking/spaceport-staking.service";
import {
  SpaceportConfig,
  SpaceportUserState,
  DEFAULT_SPACEPORT_MILESTONES,
  DEFAULT_SPACEPORT_LEVELS,
} from "./spaceport.models";

@Injectable()
export class SpaceportService {
  constructor(
    @InjectModel(User.name) private userModel: Model<UserDocument>,
    @InjectModel(SpaceportConfig.name) private configModel: Model<SpaceportConfig>,
    @InjectModel(SpaceportUserState.name) private stateModel: Model<SpaceportUserState>,
    private readonly xpLedger: XpLedgerService,
    private readonly rankResolver: RankResolverService,
    private readonly staking: SpaceportStakingService,
  ) {}

  /** Whether real chain/NFT verification is wired (no emulation when absent). */
  private get integrationStatus() {
    const rpc =
      process.env.SPACEPORT_RPC_URL ||
      process.env.FOMO_V2_LAUNCHPAD_RPC_URL ||
      process.env.BSC_TESTNET_RPC_URL ||
      process.env.WEB3_RPC_URL ||
      process.env.ZKSYNC_RPC_URL ||
      "";
    return rpc ? "connected" : "not_connected";
  }

  async getConfig(): Promise<any> {
    let cfg = await this.configModel.findOne().lean();
    if (!cfg) {
      const created = await this.configModel.create({
        milestones: DEFAULT_SPACEPORT_MILESTONES,
        levels: DEFAULT_SPACEPORT_LEVELS,
        stakingPeriodsMonths: [1, 3, 6, 12, 18, 24],
        version: 1,
      });
      cfg = created.toObject();
    }
    return cfg;
  }

  async updateConfig(patch: any): Promise<any> {
    const cfg = await this.getConfig();
    const update: any = {};
    if (Array.isArray(patch?.milestones)) update.milestones = patch.milestones;
    if (Array.isArray(patch?.levels)) update.levels = patch.levels;
    if (Array.isArray(patch?.stakingPeriodsMonths)) update.stakingPeriodsMonths = patch.stakingPeriodsMonths;
    update.version = Number(cfg.version || 1) + 1;
    await this.configModel.updateOne({ _id: cfg._id }, { $set: update });
    return this.getConfig();
  }

  /**
   * Per-USER aggregate staking (NOT multiplied by NFT count).
   * lifetimeQualifiedStakeDays = the single longest cumulative timeline across the user's tokens,
   * so holding many NFTs cannot multiply XP. currentContinuousStakeDays = longest active cycle.
   */
  private aggregateStaking(summary: Record<string, any>) {
    const tokens = Object.values(summary || {});
    let lifetimeQualifiedStakeDays = 0;
    let currentContinuousStakeDays = 0;
    let active = false;
    let startedAt: string | null = null;
    let lastEndedAt: string | null = null;
    let activeCount = 0;
    for (const t of tokens as any[]) {
      lifetimeQualifiedStakeDays = Math.max(lifetimeQualifiedStakeDays, Number(t.totalDays || 0));
      if (t.isCurrentlyStaked) {
        activeCount += 1;
        active = true;
        const cur = Math.floor(Number(t.currentCycleSeconds || 0) / 86400);
        if (cur > currentContinuousStakeDays) {
          currentContinuousStakeDays = cur;
          startedAt = t.lastStakedAt || null;
        }
      }
      if (t.lastUnstakedAt && (!lastEndedAt || t.lastUnstakedAt > lastEndedAt)) lastEndedAt = t.lastUnstakedAt;
    }
    return { lifetimeQualifiedStakeDays, currentContinuousStakeDays, active, startedAt, lastEndedAt, activeCount };
  }

  /** Award any newly-reached staking milestones into the single XP ledger (idempotent). */
  private async awardMilestones(userId: string, lifetimeDays: number, milestones: any[]) {
    for (const m of milestones) {
      if (!m.active) continue;
      if (lifetimeDays >= Number(m.days)) {
        await this.xpLedger.award({
          userId,
          eventType: "spaceport_staking_milestone",
          source: "system",
          sourceType: "spaceport",
          sourceId: `milestone:${m.days}d`,
          baseXpOverride: Number(m.xp || 0),
          verified: true,
          reason: `Веха стейкинга: ${m.days} дней`,
          metadata: { days: m.days },
        });
      }
    }
  }

  private resolveLevel(
    levels: any[],
    ctx: { lifetimeDays: number; activityXp: number; activeNft: number; launchpad: number; trades: number },
  ) {
    const sorted = [...(levels || [])].filter((l) => l.active !== false).sort((a, b) => a.level - b.level);
    let current = sorted[0] || null;
    const levelMet = (l: any) =>
      ctx.lifetimeDays >= Number(l.minLifetimeDays || 0) &&
      ctx.activityXp >= Number(l.minActivityXp || 0) &&
      (!l.requiresNft || ctx.activeNft > 0) &&
      ctx.launchpad >= Number(l.minLaunchpad || 0) &&
      ctx.trades >= Number(l.minTrades || 0);
    for (const l of sorted) {
      if (levelMet(l)) current = l;
    }
    const next = sorted.find((l) => l.level === (current?.level || 0) + 1) || null;
    const evalLevel = (l: any) => {
      if (!l) return null;
      const requirements: any[] = [
        { key: "staking", label: `${l.minLifetimeDays || 0} дней стейкинга`, met: ctx.lifetimeDays >= Number(l.minLifetimeDays || 0), current: ctx.lifetimeDays, target: Number(l.minLifetimeDays || 0), unit: "дней" },
        { key: "xp", label: `${l.minActivityXp || 0} XP`, met: ctx.activityXp >= Number(l.minActivityXp || 0), current: ctx.activityXp, target: Number(l.minActivityXp || 0), unit: "XP" },
        { key: "nft", label: "Активный NFT в стейкинге", met: !l.requiresNft || ctx.activeNft > 0, current: ctx.activeNft, target: l.requiresNft ? 1 : 0 },
      ];
      if (Number(l.minLaunchpad || 0) > 0) {
        requirements.push({ key: "launchpad", label: `Участие в Launchpad: ${l.minLaunchpad}`, met: ctx.launchpad >= Number(l.minLaunchpad || 0), current: ctx.launchpad, target: Number(l.minLaunchpad || 0) });
      }
      if (Number(l.minTrades || 0) > 0) {
        requirements.push({ key: "trades", label: `Сделки: ${l.minTrades}`, met: ctx.trades >= Number(l.minTrades || 0), current: ctx.trades, target: Number(l.minTrades || 0) });
      }
      const metCount = requirements.filter((r) => r.met).length;
      return {
        level: l.level,
        name: l.name,
        description: l.description,
        requirements,
        requirementsMet: metCount,
        requirementsTotal: requirements.length,
        requirementsRemaining: requirements.length - metCount,
        benefits: l.benefits || [],
      };
    };
    return {
      currentLevel: current?.level || 0,
      currentLevelName: current?.name || "—",
      levels: sorted.map((l) => {
        const status =
          l.level < (current?.level || 0) ? "completed" : l.level === (current?.level || 0) ? "current" : l.level === (current?.level || 0) + 1 ? "next" : "locked";
        return { ...evalLevel(l), status };
      }),
      nextLevel: evalLevel(next),
      unlockedBenefits: sorted.filter((l) => l.level <= (current?.level || 0)).flatMap((l) => l.benefits || []),
    };
  }

  async buildMe(userId: string): Promise<any> {
    const user = await this.userModel.findById(userId).lean();
    if (!user) return { error: "user_not_found" };
    const wallet = String((user as any).wallet || "");
    const cfg = await this.getConfig();

    let summary: Record<string, any> = {};
    if (wallet) {
      try {
        const hist = await this.staking.getWalletHistory(wallet);
        summary = hist?.summary || {};
      } catch {
        summary = {};
      }
    }
    const agg = this.aggregateStaking(summary);

    // Award newly-qualified milestones into the single XP ledger (idempotent), then reload XP.
    await this.awardMilestones(userId, agg.lifetimeQualifiedStakeDays, cfg.milestones || []);
    const fresh = await this.userModel.findById(userId, { activityXP: 1 }).lean();
    const activityXp = Number((fresh as any)?.activityXP || 0);
    const rank = this.rankResolver.resolveSync(activityXp);

    const milestones = [...(cfg.milestones || [])].filter((m) => m.active).sort((a, b) => a.days - b.days);
    const nextM = milestones.find((m) => agg.lifetimeQualifiedStakeDays < Number(m.days)) || null;

    const state = await this.stateModel.findOne({ userId }).lean();
    const launchpadCount = Array.isArray((user as any).claimedProjects) ? (user as any).claimedProjects.length : 0;
    const levelInfo = this.resolveLevel(cfg.levels || [], {
      lifetimeDays: agg.lifetimeQualifiedStakeDays,
      activityXp,
      activeNft: agg.activeCount,
      launchpad: launchpadCount,
      trades: 0,
    });

    return {
      integrationStatus: this.integrationStatus,
      activityXp,
      xpRank: rank.name,
      xpProgress: rank.progressPct,
      nft: {
        eligible: agg.activeCount > 0,
        activeCount: agg.activeCount,
        primaryNftId: Object.keys(summary)[0] || null,
        tier: "basic",
        entitlementStatus: agg.activeCount > 0 ? "active" : "none",
      },
      staking: {
        active: agg.active,
        selectedPeriodDays: Number(state?.selectedPeriodDays || 0),
        currentContinuousStakeDays: agg.currentContinuousStakeDays,
        lifetimeQualifiedStakeDays: agg.lifetimeQualifiedStakeDays,
        startedAt: agg.startedAt,
        lastEndedAt: agg.lastEndedAt,
        nextMilestoneDays: nextM ? Number(nextM.days) : null,
        daysToNextMilestone: nextM ? Math.max(0, Number(nextM.days) - agg.lifetimeQualifiedStakeDays) : null,
        nextMilestoneXp: nextM ? Number(nextM.xp) : null,
      },
      spaceport: {
        currentLevel: levelInfo.currentLevel,
        currentLevelName: levelInfo.currentLevelName,
        progress: levelInfo.nextLevel
          ? Math.min(100, Math.round((agg.lifetimeQualifiedStakeDays / Math.max(1, levelInfo.nextLevel.requirements[0].target)) * 100))
          : 100,
        levels: levelInfo.levels,
        nextLevel: levelInfo.nextLevel,
        unlockedBenefits: levelInfo.unlockedBenefits,
        badges: [],
      },
    };
  }

  async getRewards(userId: string): Promise<any> {
    const me = await this.buildMe(userId);
    const cfg = await this.getConfig();
    const lifetime = me?.staking?.lifetimeQualifiedStakeDays || 0;
    const rewards = (cfg.milestones || [])
      .filter((m: any) => m.active)
      .sort((a: any, b: any) => a.days - b.days)
      .map((m: any) => ({
        days: m.days,
        xp: m.xp,
        status: lifetime >= m.days ? "awarded" : "locked",
      }));
    return { rewards };
  }

  async getHistory(userId: string): Promise<any> {
    const tx = await this.xpLedger.getTransactions(userId, 200);
    const spaceportTx = (tx || []).filter((t: any) => t.sourceType === "spaceport" || String(t.eventType).startsWith("spaceport"));
    return { transactions: spaceportTx };
  }

  async setSelectedPeriod(userId: string, periodDays: number) {
    await this.stateModel.updateOne(
      { userId },
      { $set: { selectedPeriodDays: Math.max(0, Number(periodDays) || 0) } },
      { upsert: true },
    );
    return this.buildMe(userId);
  }

  get stakingService() {
    return this.staking;
  }
}
