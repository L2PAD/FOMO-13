import { Injectable, Logger, OnModuleInit } from "@nestjs/common";
import { InjectModel } from "@nestjs/mongoose";
import { Model, Types } from "mongoose";
import { Comment, CommentDocument } from "./models/comment.model";
import { XpLedgerService } from "../xp/xp-ledger.service";

// The background recompute worker must run exactly once even if the service is
// instantiated in more than one module (e.g. Comments + Persons reuse it as the
// single canonical influence read-model). The rule upsert stays idempotent.
let INFLUENCE_WORKER_STARTED = false;

/**
 * Content Influence XP (canonical, author-centric).
 *
 * NOT a separate "Buzz/Forum/Repost XP" system. A topic author earns XP from the
 * REAL, unique engagement their content attracts (likes / qualified comments /
 * qualified replies / reposts). Reposters get NO XP (anti-farm; v1).
 *
 * rawInfluence = likes*1 + qualifiedComments*4 + qualifiedReplies*2 + reposts*6
 *                (+ attributedFollowers*8 — TODO once follow-attribution exists)
 * Milestones on rawInfluence award incremental XP (the milestone curve itself is
 * the diminishing-returns shape). XP is awarded once per milestone per post via
 * the canonical XP Ledger with an idempotency key; never revoked if metrics drop.
 */
export const CONTENT_INFLUENCE_EVENT = "content_influence_milestone";

const MILESTONES: Array<{ threshold: number; xp: number }> = [
  { threshold: 10, xp: 5 },
  { threshold: 25, xp: 10 },
  { threshold: 50, xp: 20 },
  { threshold: 100, xp: 35 },
  { threshold: 250, xp: 60 },
  { threshold: 500, xp: 100 },
  { threshold: 1000, xp: 150 },
];

@Injectable()
export class ContentInfluenceService implements OnModuleInit {
  private readonly logger = new Logger("ContentInfluenceService");
  private timer: ReturnType<typeof setInterval> | null = null;

  constructor(
    @InjectModel(Comment.name) private readonly commentModel: Model<CommentDocument>,
    private readonly xpLedger: XpLedgerService,
  ) {}

  async onModuleInit(): Promise<void> {
    // Ensure the canonical XP rule exists (upsert; enabled; XP comes per-call via
    // baseXpOverride, caps disabled because idempotency is per-milestone).
    try {
      await this.xpLedger.updateRule(CONTENT_INFLUENCE_EVENT, {
        group: "content",
        enabled: true,
        baseXp: 0,
        multiplier: 1,
        cooldownSec: 0,
        dailyCap: 0,
        lifetimeCap: 0,
        uniqueBy: "none",
        maxPerEntity: 0,
        verificationRequired: false,
        reversible: false,
        description: "Content Influence milestone (author-side; XP from milestone curve)",
      } as any);
    } catch (e: any) {
      this.logger.warn(`ensure content_influence rule failed: ${e?.message || e}`);
    }

    // Background worker: recompute influence for recently active topics.
    // Guarded so only the first instance across modules starts the timer.
    if (!INFLUENCE_WORKER_STARTED) {
      INFLUENCE_WORKER_STARTED = true;
      this.timer = setInterval(() => {
        this.recalcRecent().catch((err) =>
          this.logger.warn(`influence tick failed: ${err?.message || err}`)
        );
      }, 30 * 60 * 1000);
      setTimeout(() => this.recalcRecent().catch(() => undefined), 45 * 1000);
    }
  }

  // ── Canonical influence weights (single source of truth). ─────────────────
  private readonly WEIGHTS = {
    like: 1,
    qualifiedComment: 4,
    qualifiedReply: 2,
    repost: 6,
    follower: 8,
  };

  /** The ONE influence formula. Every surface (leaderboard, Customer 360, public
   *  profile) must derive its number from this — never a second formula. */
  private weighted(c: {
    likes: number;
    qualifiedComments: number;
    qualifiedReplies: number;
    reposts: number;
    attributedFollowers?: number;
  }): number {
    const w = this.WEIGHTS;
    return (
      c.likes * w.like +
      c.qualifiedComments * w.qualifiedComment +
      c.qualifiedReplies * w.qualifiedReply +
      c.reposts * w.repost +
      (c.attributedFollowers || 0) * w.follower
    );
  }

  /** Time-decay half-life (days) + window per period — shared by all surfaces. */
  private periodConfig(period: "7d" | "30d" | "all") {
    return period === "7d"
      ? { windowDays: 7, halfLifeDays: 4 }
      : period === "30d"
      ? { windowDays: 30, halfLifeDays: 15 }
      : { windowDays: 3650, halfLifeDays: 45 };
  }

  /**
   * Batch-load the full reply tree for a set of topics (BFS over `answers`),
   * returning topicId -> flat list of descendant reply docs. Bounded in depth so
   * a pathological thread can't hang the request.
   */
  private async loadRepliesByTopic(topics: any[]): Promise<Map<string, any[]>> {
    const result = new Map<string, any[]>();
    let frontier: Array<{ id: string; root: string }> = [];
    for (const t of topics) {
      const root = String(t._id);
      result.set(root, []);
      for (const a of (t.answers || [])) frontier.push({ id: String(a), root });
    }
    const seen = new Set<string>();
    let depth = 0;
    while (frontier.length && depth < 16) {
      const ids = frontier.map((f) => f.id).filter((id) => id && !seen.has(id));
      ids.forEach((id) => seen.add(id));
      if (!ids.length) break;
      const docs = await this.commentModel.find({ _id: { $in: ids } }).lean();
      const docMap = new Map(docs.map((d: any) => [String(d._id), d]));
      const next: Array<{ id: string; root: string }> = [];
      for (const f of frontier) {
        const d = docMap.get(f.id);
        if (!d) continue;
        result.get(f.root)!.push(d);
        for (const a of ((d as any).answers || [])) next.push({ id: String(a), root: f.root });
      }
      frontier = next;
      depth++;
    }
    return result;
  }

  /**
   * Accurate per-topic influence from the real reply docs. Returns the canonical
   * breakdown AND the anti-farming exclusion counters so Customer 360 can explain
   * why raw engagement (e.g. 120) collapses to qualified engagement (e.g. 83).
   */
  private computeAccurate(
    topic: any,
    replyDocs: any[],
  ): { rawInfluence: number; breakdown: Record<string, number>; exclusions: Record<string, number> } {
    const authorId = String(topic.author || "");
    const isHidden = (c: any) =>
      c?.moderationStatus === "REMOVED" || c?.moderationStatus === "HIDDEN";

    const likesArr = (topic.likes || []).map((x: any) => String(x));
    const repostsArr = (topic.reposts || []).map((x: any) => String(x));
    const uniqLikers = new Set<string>(likesArr.filter((id: string) => id && id !== authorId));
    const uniqReposters = new Set<string>(repostsArr.filter((id: string) => id && id !== authorId));

    let hiddenExcluded = 0;
    let selfReplies = 0;
    const validReplies: any[] = [];
    for (const r of replyDocs) {
      if (String(r.authorType) === "SYSTEM_AI") continue; // AI is not "engagement"
      if (isHidden(r)) { hiddenExcluded++; continue; }
      if (String(r.author) === authorId) { selfReplies++; continue; }
      validReplies.push(r);
    }
    const uniqueReplyAuthors = new Set<string>(validReplies.map((r) => String(r.author)));
    const qualifiedComments = uniqueReplyAuthors.size;
    const qualifiedReplies = Math.max(0, validReplies.length - qualifiedComments);

    const uniqueEngagers = new Set<string>([
      ...uniqLikers,
      ...uniqReposters,
      ...uniqueReplyAuthors,
    ]);

    const rawInfluence = this.weighted({
      likes: uniqLikers.size,
      qualifiedComments,
      qualifiedReplies,
      reposts: uniqReposters.size,
      attributedFollowers: 0,
    });

    const selfLikes = likesArr.filter((id: string) => id === authorId).length;
    const selfReposts = repostsArr.filter((id: string) => id === authorId).length;
    const dupLikes = likesArr.length - new Set(likesArr).size;
    const dupReposts = repostsArr.length - new Set(repostsArr).size;

    return {
      rawInfluence,
      breakdown: {
        views: Number(topic.viewsCount || 0),
        likes: uniqLikers.size,
        qualifiedComments,
        qualifiedReplies,
        reposts: uniqReposters.size,
        attributedFollowers: 0,
        uniqueEngagers: uniqueEngagers.size,
      },
      exclusions: {
        selfInteractionsExcluded: selfLikes + selfReposts + selfReplies,
        duplicateEngagementsExcluded: dupLikes + dupReposts,
        hiddenDeletedExcluded: hiddenExcluded,
      },
    };
  }

  private flatten(nodes: any[]): any[] {
    const out: any[] = [];
    const walk = (arr: any[]) => {
      (arr || []).forEach((n) => {
        out.push(n);
        if (Array.isArray(n.answersList)) walk(n.answersList);
        else if (Array.isArray(n.answers)) walk(n.answers);
      });
    };
    walk(nodes || []);
    return out;
  }

  /** Compute the influence breakdown for one topic document (lean). */
  computeInfluence(topic: any): {
    rawInfluence: number;
    breakdown: Record<string, number>;
  } {
    const authorId = String(topic.author || "");
    const isHidden = (c: any) =>
      c?.moderationStatus === "REMOVED" || c?.moderationStatus === "HIDDEN";

    // Likes / reposts — unique users, excluding the author (no self-farm).
    const uniqExclAuthor = (arr: any[]) =>
      Array.from(new Set((arr || []).map((x: any) => String(x)))).filter(
        (id) => id && id !== authorId
      );
    const likes = uniqExclAuthor(topic.likes).length;
    const reposts = uniqExclAuthor(topic.reposts).length;

    // Thread engagement — dedupe by engager, exclude author + hidden/removed.
    const replies = this.flatten(topic.answersList || topic.answers || []).filter(
      (c: any) => c && !isHidden(c) && String(c.author) !== authorId
    );
    const uniqueEngagers = new Set(replies.map((c: any) => String(c.author)));
    // Top-level qualified comments vs nested qualified replies.
    const qualifiedComments = uniqueEngagers.size;
    const qualifiedReplies = Math.max(0, replies.length - qualifiedComments);

    const attributedFollowers = 0; // TODO: wire once post→follow attribution exists.

    const rawInfluence = this.weighted({
      likes,
      qualifiedComments,
      qualifiedReplies,
      reposts,
      attributedFollowers,
    });

    return {
      rawInfluence,
      breakdown: {
        likes,
        qualifiedComments,
        qualifiedReplies,
        reposts,
        attributedFollowers,
        uniqueEngagers: uniqueEngagers.size,
      },
    };
  }

  /** Award any newly-reached milestones for a single topic (idempotent).
   *  Uses the SAME accurate influence formula as every read surface. */
  async processTopic(
    topic: any,
    replyDocs?: any[],
  ): Promise<{ rawInfluence: number; awarded: number }> {
    const authorId = String(topic.author || "");
    if (!authorId) return { rawInfluence: 0, awarded: 0 };

    const replies =
      replyDocs || (await this.loadRepliesByTopic([topic])).get(String(topic._id)) || [];
    const { rawInfluence, breakdown } = this.computeAccurate(topic, replies);
    let awarded = 0;

    for (const m of MILESTONES) {
      if (rawInfluence < m.threshold) break;
      const res = await this.xpLedger
        .award({
          userId: authorId,
          eventType: CONTENT_INFLUENCE_EVENT,
          source: "system",
          sourceType: "comment",
          sourceId: String(topic._id),
          baseXpOverride: m.xp,
          idempotencyKey: `content_influence:${topic._id}:milestone:${m.threshold}`,
          reason: `Content influence milestone ${m.threshold}`,
          metadata: { milestone: m.threshold, rawInfluence, topicName: topic.topicName || "", ...breakdown },
        })
        .catch(() => null);
      if (res && res.status === "awarded") awarded += res.finalXp || 0;
    }
    return { rawInfluence, awarded };
  }

  /** Recompute influence for topics active in the last `days` days. */
  async recalcRecent(days = 30): Promise<{ processed: number; xpAwarded: number }> {
    const since = new Date(Date.now() - days * 24 * 60 * 60 * 1000);
    const topics = await this.commentModel
      .find({ isTopic: true, moderationStatus: { $ne: "REMOVED" }, date: { $gte: since } })
      .lean();
    const repliesByTopic = await this.loadRepliesByTopic(topics);
    let xpAwarded = 0;
    for (const t of topics) {
      const r = await this.processTopic(t, repliesByTopic.get(String(t._id)) || []);
      xpAwarded += r.awarded;
    }

    // ── NEWS-1 Phase 6A P4: News discussion contributions feed the SAME Content
    // Influence/XP (author-side). A user's root comment on a News item earns XP
    // from the REAL engagement it attracts (likes / unique reply authors), using
    // the exact same milestone curve and ledger event. The AI/system news author
    // is never rewarded; only human contributors are. NO separate "News XP".
    const newsComments = await this.commentModel
      .find({
        page: { $regex: "^crypto-news-" },
        isTopic: { $ne: true },
        moderationStatus: { $ne: "REMOVED" },
        date: { $gte: since },
      })
      .lean();
    // Roots = news comments that are NOT referenced as a reply (answer) of another.
    const replyIds = new Set<string>();
    for (const c of newsComments) {
      for (const a of ((c as any).answers || [])) replyIds.add(String(a));
    }
    const newsRoots = newsComments.filter((c: any) => !replyIds.has(String(c._id)));
    const newsRepliesByRoot = await this.loadRepliesByTopic(newsRoots);
    let newsXp = 0;
    for (const root of newsRoots) {
      const r = await this.processTopic(root, newsRepliesByRoot.get(String(root._id)) || []);
      newsXp += r.awarded;
    }
    xpAwarded += newsXp;

    if (xpAwarded > 0) {
      this.logger.log(`Content influence: processed ${topics.length} topics + ${newsRoots.length} news roots, +${xpAwarded} XP`);
    }
    return { processed: topics.length + newsRoots.length, xpAwarded };
  }

  /** Public influence read-model for a single topic (Customer 360 / profiles). */
  async getTopicInfluence(topicId: string): Promise<any> {
    const topic = await this.commentModel.findById(topicId).lean();
    if (!topic) return null;
    const replies = await this.loadRepliesByTopic([topic]);
    return this.computeAccurate(topic, replies.get(String(topic._id)) || []);
  }

  /**
   * CANONICAL per-user influence read-model. This is the single backend source
   * for Customer 360, the public profile contribution block and (via the same
   * `computeAccurate` + `weighted` formula) the Top Contributors leaderboard.
   *
   * Explainability: the XP timeline / milestones are read straight from the XP
   * Ledger (authoritative), never recomputed on the client. `followersFromContent`
   * is honestly `null` until follow→post attribution exists.
   */
  async getUserInfluence(userId: string): Promise<any> {
    const emptySummary = {
      topicsPublished: 0, totalViews: 0, uniqueEngagers: 0, likesReceived: 0,
      commentsReceived: 0, qualifiedComments: 0, repostsReceived: 0,
      followersFromContent: null, contentInfluence: 0, influenceXpEarned: 0,
    };
    if (!/^[a-f\d]{24}$/i.test(String(userId || ""))) {
      return {
        userId, summary: emptySummary,
        periods: { "7d": emptySummary, "30d": emptySummary, all: emptySummary },
        topTopics: [], milestones: [],
        exclusionStats: { selfInteractionsExcluded: 0, duplicateEngagementsExcluded: 0, hiddenDeletedExcluded: 0 },
        generatedAt: new Date(),
      };
    }
    // The user's own topics (exclude removed). `author` is an ObjectId path, so
    // match with an ObjectId (string matching is unreliable for this schema).
    const authorOid = new Types.ObjectId(userId);
    const topics = await this.commentModel
      .find({ isTopic: true, author: authorOid, moderationStatus: { $ne: "REMOVED" } })
      .lean();

    const repliesByTopic = await this.loadRepliesByTopic(topics);
    const now = Date.now();

    // Follow → content attribution (all-time). Unique followers gained from this
    // author's topics. We only store follower ids (no timestamps yet), so this is
    // an all-time number; period buckets stay null until follow events are dated.
    const followerSet = new Set<string>();
    for (const t of topics) {
      for (const f of ((t as any).followsFromContent || [])) followerSet.add(String(f));
    }
    const followersFromContentAll = followerSet.size;

    // XP ledger is the source of truth for earned XP + milestone reasons.
    const ledger: any[] = await this.xpLedger
      .getEventTransactions(userId, CONTENT_INFLUENCE_EVENT, 500)
      .catch(() => []);
    const awardedLedger = ledger.filter((t) => t.status === "awarded");
    const xpByTopic = new Map<string, number>();
    for (const t of awardedLedger) {
      const tid = String(t.sourceId || "");
      xpByTopic.set(tid, (xpByTopic.get(tid) || 0) + (Number(t.finalXp) || 0));
    }
    const influenceXpEarned = awardedLedger.reduce((s, t) => s + (Number(t.finalXp) || 0), 0);

    // Per-topic accurate rows + rolled-up exclusion counters.
    const allCfg = this.periodConfig("all");
    const rows = topics.map((t: any) => {
      const { rawInfluence, breakdown, exclusions } = this.computeAccurate(
        t,
        repliesByTopic.get(String(t._id)) || [],
      );
      const ageDays = Math.max(0, (now - new Date(t.date).getTime()) / 86400000);
      const decay = Math.pow(0.5, ageDays / allCfg.halfLifeDays);
      const views = Number(t.viewsCount || 0);
      return {
        topicId: String(t._id),
        title: t.topicName || t.text?.slice(0, 80) || "Untitled",
        publishedAt: t.date,
        views,
        uniqueEngagers: breakdown.uniqueEngagers,
        likes: breakdown.likes,
        qualifiedComments: breakdown.qualifiedComments,
        qualifiedReplies: breakdown.qualifiedReplies,
        reposts: breakdown.reposts,
        engagementRate: views > 0 ? Math.round((breakdown.uniqueEngagers / views) * 1000) / 1000 : 0,
        rawInfluence,
        normalizedInfluence: Math.round(rawInfluence * decay * 10) / 10,
        xpEarned: xpByTopic.get(String(t._id)) || 0,
        exclusions,
      };
    });

    // Summary builder for an arbitrary time window (period-scoped surfaces).
    const buildSummary = (period: "7d" | "30d" | "all") => {
      const { windowDays, halfLifeDays } = this.periodConfig(period);
      const since = now - windowDays * 24 * 60 * 60 * 1000;
      const scoped = rows.filter((r) => new Date(r.publishedAt).getTime() >= since);
      const engagers = new Set<string>();
      let contentInfluence = 0;
      const sum = {
        topicsPublished: scoped.length,
        totalViews: 0,
        likesReceived: 0,
        commentsReceived: 0,
        qualifiedComments: 0,
        repostsReceived: 0,
      };
      for (const r of scoped) {
        const ageDays = Math.max(0, (now - new Date(r.publishedAt).getTime()) / 86400000);
        const decay = Math.pow(0.5, ageDays / halfLifeDays);
        contentInfluence += r.rawInfluence * decay;
        sum.totalViews += r.views;
        sum.likesReceived += r.likes;
        sum.commentsReceived += r.qualifiedComments + r.qualifiedReplies;
        sum.qualifiedComments += r.qualifiedComments;
        sum.repostsReceived += r.reposts;
      }
      // uniqueEngagers across the window is approximated by summing per-topic
      // unique engagers (a cross-topic de-dupe would need engager ids we don't
      // retain here); documented so the number is understood, not misread.
      const uniqueEngagers = scoped.reduce((s, r) => s + r.uniqueEngagers, 0);
      const xpEarned = awardedLedger
        .filter((t) => new Date(t.awardedAt || t.occurredAt).getTime() >= since)
        .reduce((s, t) => s + (Number(t.finalXp) || 0), 0);
      return {
        ...sum,
        uniqueEngagers,
        followersFromContent: period === "all" ? followersFromContentAll : null, // dated buckets not tracked yet
        contentInfluence: Math.round(contentInfluence * 10) / 10,
        influenceXpEarned: xpEarned,
      };
    };

    // Rolled-up anti-farming / exclusion totals (all-time).
    const exclusionStats = rows.reduce(
      (acc, r) => {
        acc.selfInteractionsExcluded += r.exclusions.selfInteractionsExcluded;
        acc.duplicateEngagementsExcluded += r.exclusions.duplicateEngagementsExcluded;
        acc.hiddenDeletedExcluded += r.exclusions.hiddenDeletedExcluded;
        return acc;
      },
      { selfInteractionsExcluded: 0, duplicateEngagementsExcluded: 0, hiddenDeletedExcluded: 0 },
    );

    // Milestone timeline straight from the ledger (authoritative, deduped rows).
    const topicTitleById = new Map(rows.map((r) => [r.topicId, r.title]));
    const milestones = awardedLedger
      .map((t) => ({
        type: "CONTENT_INFLUENCE_MILESTONE",
        topicId: String(t.sourceId || ""),
        title: topicTitleById.get(String(t.sourceId || "")) || (t.metadata?.topicName ?? "Topic"),
        milestone: Number(t.metadata?.milestone) || null,
        rawInfluenceAtAward: Number(t.metadata?.rawInfluence) || null,
        xp: Number(t.finalXp) || 0,
        awardedAt: t.awardedAt || t.occurredAt,
        reason: t.reason || "",
      }))
      .sort((a, b) => new Date(b.awardedAt).getTime() - new Date(a.awardedAt).getTime());

    const topTopics = [...rows]
      .sort((a, b) => b.rawInfluence - a.rawInfluence)
      .slice(0, 8)
      .map(({ exclusions, ...rest }) => rest);

    return {
      userId,
      summary: buildSummary("all"),
      periods: {
        "7d": buildSummary("7d"),
        "30d": buildSummary("30d"),
        all: buildSummary("all"),
      },
      topTopics,
      milestones,
      exclusionStats,
      generatedAt: new Date(),
    };
  }

  /**
   * Global Top Contributors leaderboard built from the SAME influence read-model,
   * with time-decay so one old viral post doesn't pin someone at the top forever.
   * ContributorScore = contentInfluence(decayed) + usefulComments (+ audienceGrowth TODO).
   */
  async getTopContributors(
    period: "7d" | "30d" | "all" = "30d",
    limit = 10,
  ): Promise<any[]> {
    const now = Date.now();
    const windowDays = period === "7d" ? 7 : period === "30d" ? 30 : 3650;
    const since = new Date(now - windowDays * 24 * 60 * 60 * 1000);
    const halfLifeDays = period === "7d" ? 4 : period === "30d" ? 15 : 45;

    const topics = await this.commentModel
      .find({ isTopic: true, moderationStatus: { $ne: "REMOVED" }, date: { $gte: since } })
      .lean();

    // Accurate reply trees for every topic in one batched pass (shared formula).
    const repliesByTopic = await this.loadRepliesByTopic(topics);

    const agg = new Map<string, { influence: number; topics: number; comments: number }>();

    for (const t of topics) {
      const authorId = String((t as any).author || "");
      if (!authorId) continue;
      const { rawInfluence } = this.computeAccurate(t, repliesByTopic.get(String(t._id)) || []);
      const ageDays = Math.max(0, (now - new Date((t as any).date).getTime()) / 86400000);
      const decay = Math.pow(0.5, ageDays / halfLifeDays); // time-decay weight
      const cur = agg.get(authorId) || { influence: 0, topics: 0, comments: 0 };
      cur.influence += rawInfluence * decay;
      cur.topics += 1;
      agg.set(authorId, cur);
    }

    // Useful comments = author's qualified (non-topic) contributions in the window.
    const commentCounts = await this.commentModel.aggregate([
      { $match: { isTopic: { $ne: true }, authorType: { $ne: "SYSTEM_AI" }, moderationStatus: { $ne: "REMOVED" }, date: { $gte: since } } },
      { $group: { _id: "$author", n: { $sum: 1 } } },
    ]);
    for (const c of commentCounts) {
      const id = String(c._id || "");
      if (!id) continue;
      const cur = agg.get(id) || { influence: 0, topics: 0, comments: 0 };
      cur.comments = c.n;
      agg.set(id, cur);
    }

    const ranked = Array.from(agg.entries())
      .map(([id, v]) => ({
        id,
        influence: Math.round(v.influence * 10) / 10,
        topics: v.topics,
        usefulComments: v.comments,
        score: Math.round((v.influence + v.comments * 1) * 10) / 10,
      }))
      .filter((r) => r.score > 0)
      .sort((a, b) => b.score - a.score)
      .slice(0, limit);

    // Hydrate author display info.
    const ids = ranked.map((r) => {
      try { return new (require("mongoose").Types.ObjectId)(r.id); } catch { return null; }
    }).filter(Boolean);
    const users = await this.commentModel.db
      .collection("users")
      .find({ _id: { $in: ids } })
      .project({ username: 1, name: 1, fullName: 1, photo: 1, avatar: 1, twitterData: 1 })
      .toArray();
    const uMap = new Map(users.map((u: any) => [String(u._id), u]));

    return ranked.map((r, i) => {
      const u: any = uMap.get(r.id) || {};
      return {
        rank: i + 1,
        id: r.id,
        username: u.username || u.twitterData?.username || "user",
        name: u.name || u.fullName || u.username || "Contributor",
        avatar: u.photo || u.avatar || u.twitterData?.photo || "",
        score: r.score,
        influence: r.influence,
        topics: r.topics,
        usefulComments: r.usefulComments,
        period,
      };
    });
  }
}
