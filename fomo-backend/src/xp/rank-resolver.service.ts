import { Injectable, OnModuleInit, BadRequestException } from "@nestjs/common";
import { InjectModel } from "@nestjs/mongoose";
import { Model } from "mongoose";
import { randomUUID } from "crypto";
import { XpRank, DEFAULT_XP_RANKS, XP_MAX } from "./xp-rank.model";

export interface ResolvedRank {
  key: string;
  name: string;
  order: number;
  minXp: number;
  maxXp: number;
  icon: string;
  xp: number;
  xpIntoRank: number;
  xpToNext: number; // 0 if top rank
  progressPct: number; // progress within current rank, 0..100
  isMax: boolean;
}

/**
 * THE single source of truth: activityXP -> Rank.
 * All other rank computations (fomonauts list/statistics, SpacePort progression, stored
 * user.rank) MUST read from here instead of their own hardcoded thresholds.
 */
@Injectable()
export class RankResolverService implements OnModuleInit {
  private cache: XpRank[] | null = null;

  constructor(
    @InjectModel(XpRank.name) private readonly rankModel: Model<XpRank>
  ) {}

  async onModuleInit(): Promise<void> {
    const count = await this.rankModel.estimatedDocumentCount();
    if (count === 0) {
      await this.rankModel.insertMany(
        DEFAULT_XP_RANKS.map((r) => ({ ...r, _id: randomUUID() }))
      );
    }
    await this.reload();
  }

  async reload(): Promise<XpRank[]> {
    this.cache = await this.rankModel.find().sort({ minXp: 1 }).lean().exec() as any;
    return this.cache!;
  }

  async getRanks(): Promise<XpRank[]> {
    if (!this.cache) await this.reload();
    return this.cache!;
  }

  /** Synchronous resolve against cached config. Falls back to defaults if cache empty. */
  resolveSync(rawXp: number): ResolvedRank {
    const xp = Math.max(0, Math.min(Number(rawXp) || 0, XP_MAX));
    const ranks = (this.cache && this.cache.length ? this.cache : (DEFAULT_XP_RANKS as any))
      .filter((r: any) => r.enabled !== false)
      .sort((a: any, b: any) => a.minXp - b.minXp);

    let current = ranks[0];
    for (const r of ranks) {
      if (xp >= r.minXp && xp <= r.maxXp) { current = r; break; }
      if (xp > r.maxXp) current = r; // keep highest passed
    }

    const idx = ranks.findIndex((r: any) => r.key === current.key);
    const next = ranks[idx + 1] || null;
    const span = Math.max(1, current.maxXp - current.minXp);
    const into = Math.max(0, xp - current.minXp);
    const progressPct = Math.round(Math.min(100, (into / span) * 100));

    return {
      key: current.key,
      name: current.name,
      order: current.order,
      minXp: current.minXp,
      maxXp: current.maxXp,
      icon: current.icon || "",
      xp,
      xpIntoRank: into,
      xpToNext: next ? Math.max(0, next.minXp - xp) : 0,
      progressPct,
      isMax: !next,
    };
  }

  async resolve(xp: number): Promise<ResolvedRank> {
    if (!this.cache) await this.reload();
    return this.resolveSync(xp);
  }

  /** Admin bulk update with validation (sorted, contiguous, starts at 0). */
  async updateRanks(input: Array<Partial<XpRank>>, adminId?: string): Promise<XpRank[]> {
    if (!Array.isArray(input) || input.length === 0) {
      throw new BadRequestException("ranks must be a non-empty array");
    }
    const rows = input
      .map((r) => ({
        key: String(r.key || "").trim(),
        name: String(r.name || "").trim(),
        order: Number(r.order || 0),
        minXp: Number(r.minXp),
        maxXp: Number(r.maxXp),
        icon: String((r as any).icon || ""),
        description: String((r as any).description || ""),
        privileges: Array.isArray((r as any).privileges) ? (r as any).privileges : [],
        enabled: (r as any).enabled !== false,
      }))
      .sort((a, b) => a.minXp - b.minXp);

    for (let i = 0; i < rows.length; i++) {
      const r = rows[i];
      if (!r.key || !r.name) throw new BadRequestException("each rank needs key and name");
      if (Number.isNaN(r.minXp) || Number.isNaN(r.maxXp) || r.minXp > r.maxXp) {
        throw new BadRequestException(`invalid range for ${r.key}: min must be <= max`);
      }
      if (i === 0 && r.minXp !== 0) {
        throw new BadRequestException("first rank must start at 0 XP");
      }
      if (i > 0 && r.minXp !== rows[i - 1].maxXp + 1) {
        throw new BadRequestException(
          `ranks must be contiguous: ${r.key}.minXp must equal previous.maxXp + 1`
        );
      }
    }

    // Upsert by key; assign order by sorted position.
    await Promise.all(
      rows.map((r, i) =>
        this.rankModel.updateOne(
          { key: r.key },
          { $set: { ...r, order: i + 1 }, $setOnInsert: { _id: randomUUID() } },
          { upsert: true }
        )
      )
    );
    // Remove ranks no longer present.
    const keepKeys = rows.map((r) => r.key);
    await this.rankModel.deleteMany({ key: { $nin: keepKeys } });

    return this.reload();
  }
}
