import { Injectable } from "@nestjs/common";
import { InjectModel } from "@nestjs/mongoose";
import { Model } from "mongoose";
import { User, UserDocument } from "src/user/user.model";
import { XpTransaction } from "src/xp/xp-transaction.model";
import { DEFAULT_XP_RANKS, XP_MAX } from "src/xp/xp-rank.model";
import { UserActionLog } from "src/user-action-logs/user-action-log.model";
import { RatingCanonicalService, unifiedToLegacyScoreResult } from "src/rating/unified/rating-canonical.service";
import { UserSession, UserActivityEvent } from "./platform-analytics.models";
import { Task, TaskDocument } from "src/tasks/models/task.model";
import { TaskUserProgress, TaskUserProgressDocument } from "src/tasks/models/task-user-progress.model";

export interface StatQuery {
  from?: string;
  to?: string;
  tzOffset?: string; // minutes offset from UTC (client)
  granularity?: "day" | "week";
}

const EVENT_GROUP: Record<string, string> = {
  twitter_action: "activity",
  chat_message: "content",
  comment_created: "content",
  earlyland_task: "earlyland",
  contribution_verified: "contribution",
  referral_l1: "referral",
  referral_l2: "referral",
  spaceport_reward: "spaceport",
  spaceport_stake_started: "spaceport",
  spaceport_staking_milestone: "spaceport",
  spaceport_staking_continuous_30d: "spaceport",
  spaceport_level_unlocked: "spaceport",
  spaceport_badge_unlocked: "spaceport",
};

const NOT_COLLECTED = (label: string) => ({
  available: false,
  note: `Данные пока не собираются: ${label}`,
});

@Injectable()
export class StatisticsService {
  constructor(
    @InjectModel(User.name) private userModel: Model<UserDocument>,
    @InjectModel(XpTransaction.name) private xpModel: Model<XpTransaction>,
    @InjectModel(UserActionLog.name) private logModel: Model<UserActionLog>,
    @InjectModel(UserSession.name) private sessionModel: Model<UserSession>,
    @InjectModel(UserActivityEvent.name) private eventModel: Model<UserActivityEvent>,
    @InjectModel(Task.name) private taskModel: Model<TaskDocument>,
    @InjectModel(TaskUserProgress.name) private progressModel: Model<TaskUserProgressDocument>,
    private readonly canonical: RatingCanonicalService
  ) {}

  private range(q: StatQuery) {
    const to = q?.to ? new Date(q.to) : new Date();
    const from = q?.from
      ? new Date(q.from)
      : new Date(to.getTime() - 30 * 86400000);
    // Date-only `to` (e.g. "2026-08-09") parses to midnight UTC, which would
    // exclude everything that happened later "today". Make it inclusive to the
    // end of that day so current-day activity is counted across all tabs.
    if (q?.to && /^\d{4}-\d{2}-\d{2}$/.test(String(q.to))) {
      to.setUTCHours(23, 59, 59, 999);
    }
    if (Number.isNaN(from.getTime()) || Number.isNaN(to.getTime())) {
      const t = new Date();
      return { from: new Date(t.getTime() - 30 * 86400000), to: t };
    }
    return { from, to };
  }

  private daysBetween(from: Date, to: Date): string[] {
    const out: string[] = [];
    const d = new Date(Date.UTC(from.getUTCFullYear(), from.getUTCMonth(), from.getUTCDate()));
    const end = new Date(Date.UTC(to.getUTCFullYear(), to.getUTCMonth(), to.getUTCDate()));
    while (d <= end) {
      out.push(d.toISOString().slice(0, 10));
      d.setUTCDate(d.getUTCDate() + 1);
    }
    return out;
  }

  private async dau(from: Date, to: Date) {
    const rows = await this.sessionModel.aggregate([
      { $match: { userId: { $ne: null }, lastActivityAt: { $gte: from, $lte: to } } },
      { $group: { _id: { day: { $dateToString: { format: "%Y-%m-%d", date: "$lastActivityAt" } }, u: "$userId" } } },
      { $group: { _id: "$_id.day", count: { $sum: 1 } } },
      { $sort: { _id: 1 } },
    ]);
    const map = new Map(rows.map((r: any) => [r._id, r.count]));
    return this.daysBetween(from, to).map((day) => ({ day, count: map.get(day) || 0 }));
  }

  private async uniqueUsers(from: Date, to: Date): Promise<number> {
    const r = await this.sessionModel.distinct("userId", {
      userId: { $ne: null },
      lastActivityAt: { $gte: from, $lte: to },
    });
    return r.length;
  }

  /* ---------------- OVERVIEW ---------------- */
  async overview(q: StatQuery) {
    const { from, to } = this.range(q);
    const now = new Date();
    const d1 = new Date(now.getTime() - 86400000);
    const d7 = new Date(now.getTime() - 7 * 86400000);
    const d30 = new Date(now.getTime() - 30 * 86400000);
    const online = new Date(now.getTime() - 5 * 60000);

    const [totalUsers, newUsers, activeToday, dauSeries, wau, mau, onlineNow, sessionAgg] =
      await Promise.all([
        this.userModel.countDocuments({}),
        this.userModel.countDocuments({ createdAt: { $gte: from, $lte: to } }),
        this.uniqueUsers(d1, now),
        this.dau(from, to),
        this.uniqueUsers(d7, now),
        this.uniqueUsers(d30, now),
        this.sessionModel.distinct("userId", { userId: { $ne: null }, lastActivityAt: { $gte: online } }),
        this.sessionModel.aggregate([
          { $match: { startedAt: { $gte: from, $lte: to } } },
          { $group: { _id: null, avgActive: { $avg: "$activeMs" }, cnt: { $sum: 1 } } },
        ]),
      ]);

    const dauToday = dauSeries.length ? dauSeries[dauSeries.length - 1].count : 0;

    // XP KPIs
    const xpAgg = await this.xpModel.aggregate([
      { $match: { occurredAt: { $gte: from, $lte: to } } },
      {
        $group: {
          _id: "$status",
          xp: { $sum: "$finalXp" },
          users: { $addToSet: "$userId" },
          tx: { $sum: 1 },
        },
      },
    ]);
    const xpByStatus: Record<string, any> = {};
    let xpRecipients = new Set<string>();
    for (const r of xpAgg) {
      xpByStatus[r._id] = { xp: r.xp, tx: r.tx };
      if (r._id === "awarded") r.users.forEach((u: string) => xpRecipients.add(u));
    }
    const xpTodayAgg = await this.xpModel.aggregate([
      { $match: { status: "awarded", occurredAt: { $gte: d1, $lte: now } } },
      { $group: { _id: null, xp: { $sum: "$finalXp" } } },
    ]);

    const avgXpRow = await this.userModel.aggregate([
      { $group: { _id: null, avg: { $avg: "$activityXP" } } },
    ]);

    // FOMO Score quick summary (stored per-user score).
    const fomoAgg = await this.userModel.aggregate([
      { $match: { fomoScore: { $gt: 0 } } },
      { $group: { _id: null, avg: { $avg: "$fomoScore" }, cnt: { $sum: 1 }, max: { $max: "$fomoScore" } } },
    ]);
    const fomo = fomoAgg[0] || {};

    return {
      range: { from, to },
      kpis: {
        totalUsers,
        newUsers,
        activeToday,
        dau: dauToday,
        wau,
        mau,
        stickiness: mau ? Math.round((dauToday / mau) * 1000) / 10 : 0,
        onlineNow: onlineNow.length,
        avgSessionSec: sessionAgg[0]?.avgActive ? Math.round(sessionAgg[0].avgActive / 1000) : 0,
        sessions: sessionAgg[0]?.cnt || 0,
      },
      xp: {
        awardedInRange: xpByStatus.awarded?.xp || 0,
        awardedToday: xpTodayAgg[0]?.xp || 0,
        pending: xpByStatus.pending?.xp || 0,
        reversed: xpByStatus.reversed?.xp || 0,
        rejected: xpByStatus.rejected?.xp || 0,
        recipients: xpRecipients.size,
        avgXpPerUser: Math.round(avgXpRow[0]?.avg || 0),
      },
      charts: { dau: dauSeries },
      trading: NOT_COLLECTED("объёмы OTC/P2P в аналитике"),
      launchpad: NOT_COLLECTED("участия в Launchpad в аналитике"),
      fomoScore: {
        available: true,
        avg: Math.round((fomo.avg || 0) * 10) / 10,
        scoredUsers: fomo.cnt || 0,
        max: fomo.max || 0,
      },
    };
  }

  /* ---------------- AUDIENCE ---------------- */
  async audience(q: StatQuery) {
    const { from, to } = this.range(q);
    const now = new Date();
    const d7 = new Date(now.getTime() - 7 * 86400000);
    const d30 = new Date(now.getTime() - 30 * 86400000);

    const regSeries = await this.userModel.aggregate([
      { $match: { createdAt: { $gte: from, $lte: to } } },
      { $group: { _id: { $dateToString: { format: "%Y-%m-%d", date: "$createdAt" } }, count: { $sum: 1 } } },
      { $sort: { _id: 1 } },
    ]);
    const regMap = new Map(regSeries.map((r: any) => [r._id, r.count]));

    const activeUserIds = await this.sessionModel.distinct("userId", { userId: { $ne: null }, lastActivityAt: { $gte: d30 } });
    const [total, active7, active30] = await Promise.all([
      this.userModel.countDocuments({}),
      this.uniqueUsers(d7, now),
      this.uniqueUsers(d30, now),
    ]);

    // Retention D1/D7/D30: of users created in range, share active on day+N.
    const retention = await this.retention(from, to);

    return {
      range: { from, to },
      totals: {
        registered: total,
        active7,
        active30,
        inactive: Math.max(0, total - activeUserIds.length),
      },
      dauWauMau: {
        wau: active7,
        mau: active30,
      },
      charts: {
        registrations: this.daysBetween(from, to).map((day) => ({ day, count: regMap.get(day) || 0 })),
        activeUsers: await this.dau(from, to),
      },
      retention,
      geo: NOT_COLLECTED("страна/устройство/язык (не собираются)"),
      registrationSource: NOT_COLLECTED("источник регистрации (не собирается)"),
    };
  }

  private async retention(from: Date, to: Date) {
    // Cohort of users registered in range; check if they had a session N days later.
    const cohort = await this.userModel.find({ createdAt: { $gte: from, $lte: to } }, { _id: 1, createdAt: 1 }).lean();
    if (!cohort.length) return { D1: 0, D7: 0, D30: 0, cohortSize: 0 };
    const ids = cohort.map((u: any) => String(u._id));
    const sessions = await this.sessionModel.find(
      { userId: { $in: ids } },
      { userId: 1, lastActivityAt: 1 }
    ).lean();
    const byUser = new Map<string, Date[]>();
    for (const s of sessions as any[]) {
      const arr = byUser.get(String(s.userId)) || [];
      arr.push(new Date(s.lastActivityAt));
      byUser.set(String(s.userId), arr);
    }
    const check = (createdAt: Date, n: number, uid: string) => {
      const start = new Date(createdAt.getTime() + n * 86400000);
      const end = new Date(start.getTime() + 86400000);
      return (byUser.get(uid) || []).some((d) => d >= start && d < end);
    };
    let d1 = 0, d7 = 0, d30 = 0;
    for (const u of cohort as any[]) {
      const uid = String(u._id);
      const c = new Date(u.createdAt);
      if (check(c, 1, uid)) d1++;
      if (check(c, 7, uid)) d7++;
      if (check(c, 30, uid)) d30++;
    }
    const pct = (x: number) => Math.round((x / cohort.length) * 1000) / 10;
    return { D1: pct(d1), D7: pct(d7), D30: pct(d30), cohortSize: cohort.length };
  }

  /* ---------------- FUNNEL ---------------- */
  async funnel(q: StatQuery) {
    const { from, to } = this.range(q);
    const [visitors, anonSessions, withWallet, withEmail, active, verified, twitter] =
      await Promise.all([
        this.sessionModel.distinct("anonymousId", { startedAt: { $gte: from, $lte: to } }),
        this.sessionModel.countDocuments({ userId: null, startedAt: { $gte: from, $lte: to } }),
        this.userModel.countDocuments({ wallet: { $nin: ["", null] }, createdAt: { $gte: from, $lte: to } }),
        this.userModel.countDocuments({ email: { $nin: ["", null] }, createdAt: { $gte: from, $lte: to } }),
        this.userModel.countDocuments({ isActive: true, createdAt: { $gte: from, $lte: to } }),
        this.userModel.countDocuments({ verificationStatus: true, createdAt: { $gte: from, $lte: to } }),
        this.userModel.countDocuments({ "twitterData.username": { $nin: ["", null] }, createdAt: { $gte: from, $lte: to } }),
      ]);

    const registered = await this.userModel.countDocuments({ createdAt: { $gte: from, $lte: to } });
    const steps = [
      { key: "visitors", label: "Посетители (анонимные сессии)", users: visitors.length },
      { key: "connect_wallet", label: "Подключили кошелёк", users: withWallet },
      { key: "registered", label: "Зарегистрировались", users: registered },
      { key: "email", label: "Указали email", users: withEmail },
      { key: "twitter", label: "Привязали Twitter", users: twitter },
      { key: "activated", label: "Активированы (isActive)", users: active },
      { key: "verified", label: "Верифицированы", users: verified },
    ];
    const top = steps[0].users || 1;
    let prev = steps[0].users;
    const withRates = steps.map((s, i) => {
      const conv = top ? Math.round((s.users / top) * 1000) / 10 : 0;
      const drop = i === 0 ? 0 : Math.max(0, prev - s.users);
      const dropPct = i === 0 || !prev ? 0 : Math.round((drop / prev) * 1000) / 10;
      prev = s.users;
      return { ...s, conversion: conv, dropOff: drop, dropOffPct: dropPct };
    });

    return {
      range: { from, to },
      steps: withRates,
      verification: {
        twitterVerified: twitter,
        twitterSkipped: Math.max(0, registered - twitter),
        emailVerified: withEmail,
        emailSkipped: Math.max(0, registered - withEmail),
      },
      anonymousSessions: anonSessions,
    };
  }

  /* ---------------- ACTIVITY ---------------- */
  async activity(q: StatQuery) {
    const { from, to } = this.range(q);
    const [sessionAgg, topEvents, topPages, eventsByDay] = await Promise.all([
      this.sessionModel.aggregate([
        { $match: { startedAt: { $gte: from, $lte: to } } },
        {
          $group: {
            _id: null,
            sessions: { $sum: 1 },
            avgActive: { $avg: "$activeMs" },
            activeMs: { $sum: "$activeMs" },
            users: { $addToSet: "$userId" },
          },
        },
      ]),
      this.eventModel.aggregate([
        { $match: { occurredAt: { $gte: from, $lte: to } } },
        { $group: { _id: "$eventType", count: { $sum: 1 } } },
        { $sort: { count: -1 } },
        { $limit: 20 },
      ]),
      this.eventModel.aggregate([
        { $match: { eventType: "page_view", occurredAt: { $gte: from, $lte: to } } },
        { $group: { _id: "$page", count: { $sum: 1 }, visitors: { $addToSet: { $ifNull: ["$userId", "$anonymousId"] } } } },
        { $sort: { count: -1 } },
        { $limit: 20 },
      ]),
      this.eventModel.aggregate([
        { $match: { occurredAt: { $gte: from, $lte: to } } },
        { $group: { _id: { $dateToString: { format: "%Y-%m-%d", date: "$occurredAt" } }, count: { $sum: 1 } } },
        { $sort: { _id: 1 } },
      ]),
    ]);

    const s = sessionAgg[0] || {};
    const uniqueUsers = (s.users || []).filter((x: any) => x).length;
    const evMap = new Map(eventsByDay.map((r: any) => [r._id, r.count]));

    return {
      range: { from, to },
      sessions: {
        total: s.sessions || 0,
        uniqueUsers,
        perUser: uniqueUsers ? Math.round(((s.sessions || 0) / uniqueUsers) * 10) / 10 : 0,
        avgDurationSec: s.avgActive ? Math.round(s.avgActive / 1000) : 0,
        totalActiveHours: s.activeMs ? Math.round(s.activeMs / 3600000) : 0,
      },
      topEvents: topEvents.map((e: any) => ({ eventType: e._id, count: e.count })),
      topPages: topPages.map((p: any) => ({ page: p._id || "(unknown)", views: p.count, visitors: p.visitors.length })),
      charts: { events: this.daysBetween(from, to).map((day) => ({ day, count: evMap.get(day) || 0 })) },
    };
  }

  /* ---------------- XP / RATING ---------------- */
  async xp(q: StatQuery) {
    const { from, to } = this.range(q);
    const byEvent = await this.xpModel.aggregate([
      { $match: { occurredAt: { $gte: from, $lte: to } } },
      {
        $group: {
          _id: { eventType: "$eventType", status: "$status" },
          xp: { $sum: "$finalXp" },
          tx: { $sum: 1 },
          users: { $addToSet: "$userId" },
        },
      },
    ]);

    const groups: Record<string, any> = {};
    const events: Record<string, any> = {};
    for (const r of byEvent) {
      const et = r._id.eventType;
      const grp = EVENT_GROUP[et] || "other";
      const status = r._id.status;
      events[et] = events[et] || { eventType: et, group: grp, awarded: 0, pending: 0, reversed: 0, rejected: 0, tx: 0, users: new Set() };
      events[et][status] = (events[et][status] || 0) + r.xp;
      events[et].tx += r.tx;
      r.users.forEach((u: string) => events[et].users.add(u));
      groups[grp] = groups[grp] || { group: grp, awarded: 0, pending: 0, reversed: 0, rejected: 0, tx: 0 };
      groups[grp][status] = (groups[grp][status] || 0) + r.xp;
      groups[grp].tx += r.tx;
    }
    const eventsList = Object.values(events).map((e: any) => ({
      ...e,
      users: e.users.size,
      net: (e.awarded || 0) - (e.reversed || 0),
    }));

    const byDay = await this.xpModel.aggregate([
      { $match: { status: "awarded", occurredAt: { $gte: from, $lte: to } } },
      { $group: { _id: { $dateToString: { format: "%Y-%m-%d", date: "$occurredAt" } }, xp: { $sum: "$finalXp" } } },
      { $sort: { _id: 1 } },
    ]);
    const dayMap = new Map(byDay.map((r: any) => [r._id, r.xp]));

    const topEarners = await this.xpModel.aggregate([
      { $match: { status: "awarded", occurredAt: { $gte: from, $lte: to } } },
      { $group: { _id: "$userId", xp: { $sum: "$finalXp" }, tx: { $sum: 1 } } },
      { $sort: { xp: -1 } },
      { $limit: 15 },
    ]);
    const earnerIds = topEarners.map((e: any) => e._id);
    const earnerUsers = await this.userModel.find({ _id: { $in: earnerIds } }, { name: 1, email: 1, wallet: 1, activityXP: 1 }).lean();
    const uMap = new Map(earnerUsers.map((u: any) => [String(u._id), u]));

    // Rank distribution from activityXP.
    const ranks = [...DEFAULT_XP_RANKS].sort((a, b) => a.order - b.order);
    const rankDist = await Promise.all(
      ranks.map(async (r) => ({
        key: r.key,
        name: r.name,
        min: r.minXp,
        max: r.maxXp,
        users: await this.userModel.countDocuments({ activityXP: { $gte: r.minXp, $lte: r.maxXp } }),
      }))
    );

    return {
      range: { from, to },
      groups: Object.values(groups),
      events: eventsList,
      charts: { xpIssuance: this.daysBetween(from, to).map((day) => ({ day, xp: dayMap.get(day) || 0 })) },
      topEarners: topEarners.map((e: any) => ({
        userId: e._id,
        xpInRange: e.xp,
        tx: e.tx,
        name: uMap.get(String(e._id))?.name || "",
        email: uMap.get(String(e._id))?.email || "",
        wallet: uMap.get(String(e._id))?.wallet || "",
        totalXp: uMap.get(String(e._id))?.activityXP || 0,
      })),
      rankDistribution: rankDist,
      xpMax: XP_MAX,
      fomoScoreComponents: NOT_COLLECTED("разбор компонентов FOMO Score (см. раздел «Рейтинг»)"),
    };
  }

  /* ---------------- FOMO SCORE ---------------- */
  private median(sorted: number[]): number {
    const n = sorted.length;
    if (!n) return 0;
    return n % 2 ? sorted[(n - 1) / 2] : (sorted[n / 2 - 1] + sorted[n / 2]) / 2;
  }

  async fomoScore(q: StatQuery) {
    const { from, to } = this.range(q);

    // Distribution + avg/median from the stored fomoScore (fast, no recompute).
    const scored = await this.userModel.find({ fomoScore: { $gt: 0 } }, { fomoScore: 1 }).lean();
    const scores = scored.map((u: any) => Number(u.fomoScore) || 0).sort((a, b) => a - b);
    const n = scores.length;
    const avg = n ? scores.reduce((a, b) => a + b, 0) / n : 0;

    const bands: [number, number][] = [[0, 20], [20, 40], [40, 60], [60, 80], [80, 101]];
    const distribution = bands.map(([lo, hi]) => ({
      band: `${lo}–${hi === 101 ? 100 : hi}`,
      count: scores.filter((s) => s >= lo && s < hi).length,
    }));

    // Component contribution — computed LIVE from the rating engine (breakdown
    // is not always persisted). Averaged across scored users.
    const docs = await this.userModel.find({ fomoScore: { $gt: 0 } }).limit(500).lean();
    const compAgg: Record<string, { sum: number; count: number }> = {};
    for (const d of docs) {
      try {
        const result = this.canonical.scoreUserDoc(d);
        const flat = unifiedToLegacyScoreResult(result, "analytics");
        for (const [key, val] of Object.entries(flat.components || {})) {
          compAgg[key] = compAgg[key] || { sum: 0, count: 0 };
          compAgg[key].sum += Number(val) || 0;
          compAgg[key].count += 1;
        }
      } catch {
        /* skip un-scoreable doc */
      }
    }
    const componentLabels: Record<string, string> = {
      xpReputation: "XP репутация",
      platformActivity: "Активность (XP репутация)",
      reputation: "Репутация",
      tradeReputation: "Трейдинг",
      trade: "Трейдинг",
      launchpad: "Launchpad",
      nftSubscription: "NFT подписка",
      nft: "NFT",
    };
    const components = Object.entries(compAgg)
      .map(([key, v]) => ({
        key,
        label: componentLabels[key] || key,
        avgContribution: Math.round((v.sum / Math.max(1, v.count)) * 100) / 100,
        coverage: v.count,
      }))
      .sort((a, b) => b.avgContribution - a.avgContribution);

    // Dynamics: rating recalculations per day (honest — full per-user score
    // time-series requires snapshots which are not yet stored).
    const recalc = await this.userModel.aggregate([
      { $match: { lastRatingCalculatedAt: { $gte: from, $lte: to } } },
      { $group: { _id: { $dateToString: { format: "%Y-%m-%d", date: "$lastRatingCalculatedAt" } }, count: { $sum: 1 } } },
      { $sort: { _id: 1 } },
    ]);
    const rMap = new Map(recalc.map((r: any) => [r._id, r.count]));

    return {
      range: { from, to },
      summary: {
        scoredUsers: n,
        avg: Math.round(avg * 10) / 10,
        median: Math.round(this.median(scores) * 10) / 10,
        min: scores[0] || 0,
        max: scores[n - 1] || 0,
      },
      distribution,
      components,
      dynamics: { recalcByDay: this.daysBetween(from, to).map((day) => ({ day, count: rMap.get(day) || 0 })) },
      dynamicsNote: "Динамика показывает перерасчёты рейтинга по дням. Полная история значений FOMO Score появится после включения снапшотов рейтинга.",
    };
  }

  /* ---------------- CONTENT ---------------- */
  async content(q: StatQuery) {
    const { from, to } = this.range(q);
    // Real signals we have: content XP events (chat/comment) + action logs.
    const contentEvents = await this.xpModel.aggregate([
      { $match: { eventType: { $in: ["comment_created", "chat_message"] }, occurredAt: { $gte: from, $lte: to } } },
      { $group: { _id: "$eventType", tx: { $sum: 1 }, users: { $addToSet: "$userId" } } },
    ]);
    const logCats = await this.logModel.aggregate([
      { $match: { createdAt: { $gte: from, $lte: to } } },
      { $group: { _id: "$category", count: { $sum: 1 } } },
      { $sort: { count: -1 } },
      { $limit: 20 },
    ]);
    return {
      range: { from, to },
      contentXpEvents: contentEvents.map((e: any) => ({ eventType: e._id, count: e.tx, uniqueAuthors: e.users.length })),
      actionCategories: logCats.map((c: any) => ({ category: c._id || "(none)", count: c.count })),
      moderation: NOT_COLLECTED("report/delete/spam rate по контенту (частично; расширяется)"),
    };
  }

  /* ---------------- ANTI-FRAUD ---------------- */
  async antifraud(q: StatQuery) {
    const { from, to } = this.range(q);
    const [reversed, rejected, capHits, velocity, criticalLogs] = await Promise.all([
      this.xpModel.aggregate([
        { $match: { status: "reversed", reversedAt: { $gte: from, $lte: to } } },
        { $group: { _id: "$userId", tx: { $sum: 1 }, xp: { $sum: "$finalXp" } } },
        { $sort: { tx: -1 } },
        { $limit: 25 },
      ]),
      this.xpModel.countDocuments({ status: "rejected", occurredAt: { $gte: from, $lte: to } }),
      this.xpModel.aggregate([
        { $match: { status: "rejected", occurredAt: { $gte: from, $lte: to } } },
        { $group: { _id: "$reason", count: { $sum: 1 } } },
        { $sort: { count: -1 } },
        { $limit: 15 },
      ]),
      // XP velocity: users with unusually many awarded tx in range.
      this.xpModel.aggregate([
        { $match: { status: "awarded", occurredAt: { $gte: from, $lte: to } } },
        { $group: { _id: "$userId", tx: { $sum: 1 }, xp: { $sum: "$finalXp" } } },
        { $match: { tx: { $gte: 50 } } },
        { $sort: { tx: -1 } },
        { $limit: 25 },
      ]),
      this.logModel.aggregate([
        { $match: { severity: { $in: ["warning", "critical"] }, createdAt: { $gte: from, $lte: to } } },
        { $group: { _id: "$severity", count: { $sum: 1 } } },
      ]),
    ]);

    const flaggedUserIds = Array.from(new Set([...reversed, ...velocity].map((r: any) => String(r._id))));
    const users = await this.userModel.find({ _id: { $in: flaggedUserIds } }, { name: 1, email: 1, wallet: 1, activityXP: 1 }).lean();
    const uMap = new Map(users.map((u: any) => [String(u._id), u]));
    const velMap = new Map(velocity.map((v: any) => [String(v._id), v]));
    const revMap = new Map(reversed.map((v: any) => [String(v._id), v]));

    const suspicious = flaggedUserIds.map((id) => {
      const vel = velMap.get(id);
      const rev = revMap.get(id);
      let risk = 0;
      if (rev) risk += Math.min(50, (rev.tx || 0) * 10);
      if (vel) risk += Math.min(50, Math.floor((vel.tx || 0) / 10) * 5);
      const severity = risk >= 60 ? "high" : risk >= 30 ? "medium" : "low";
      return {
        userId: id,
        name: uMap.get(id)?.name || "",
        email: uMap.get(id)?.email || "",
        wallet: uMap.get(id)?.wallet || "",
        reversedTx: rev?.tx || 0,
        awardedTx: vel?.tx || 0,
        risk,
        severity,
      };
    }).sort((a, b) => b.risk - a.risk);

    const sev: Record<string, number> = {};
    for (const c of criticalLogs) sev[c._id] = c.count;

    return {
      range: { from, to },
      summary: {
        rejectedTx: rejected,
        reversedUsers: reversed.length,
        highVelocityUsers: velocity.length,
        warnings: sev.warning || 0,
        critical: sev.critical || 0,
      },
      capHits: capHits.map((c: any) => ({ reason: c._id || "(none)", count: c.count })),
      suspicious,
      multiAccount: NOT_COLLECTED("IP/device fingerprint (не собираются)"),
    };
  }

  /* ---------------- TASK ANALYTICS (canonical TaskUserProgress) ---------------- */
  async tasks(q: StatQuery & { taskType?: string; domain?: string }) {
    const { from, to } = this.range(q);
    const match: any = { updatedAt: { $gte: from, $lte: to } };
    if (q?.taskType === "default" || q?.taskType === "special") match.taskType = q.taskType;
    if (q?.domain === "core") match.activityId = { $in: [null, undefined] as any };
    if (q?.domain === "earlyland") match.activityId = { $nin: [null, undefined] as any };

    const notNull = (f: string) => ({ $cond: [{ $ne: [`$${f}`, null] }, 1, 0] });
    const isRejected = { $cond: [{ $eq: ["$state", "rejected"] }, 1, 0] };
    const isReview = { $cond: [{ $eq: ["$state", "under_review"] }, 1, 0] };
    const isSubmitted = { $cond: [{ $eq: ["$state", "submitted"] }, 1, 0] };

    // Cumulative "furthest stage reached" flags — robust regardless of which
    // lifecycle timestamps a completion mode happens to populate (AUTO_METRIC vs
    // USER_CLAIM vs MODERATOR_REVIEW). Guarantees a monotonic funnel.
    const reachedStarted = { $cond: [{ $ne: ["$state", "not_started"] }, 1, 0] };
    const reachedSubmitted = {
      $cond: [
        { $or: [
          { $ne: ["$submittedAt", null] },
          { $ne: ["$verifiedAt", null] },
          { $ne: ["$completedAt", null] },
          { $in: ["$state", ["submitted", "under_review", "completed", "rejected"]] },
        ] },
        1, 0,
      ],
    };
    const reachedVerified = {
      $cond: [
        { $or: [
          { $ne: ["$verifiedAt", null] },
          { $ne: ["$completedAt", null] },
          { $eq: ["$state", "completed"] },
        ] },
        1, 0,
      ],
    };
    const reachedCompleted = {
      $cond: [
        { $or: [{ $ne: ["$completedAt", null] }, { $eq: ["$state", "completed"] }] },
        1, 0,
      ],
    };

    const agg = await this.progressModel.aggregate([
      { $match: match },
      {
        $facet: {
          totals: [
            {
              $group: {
                _id: null,
                users: { $addToSet: "$userId" },
                tasks: { $addToSet: "$taskId" },
                records: { $sum: 1 },
                started: { $sum: reachedStarted },
                submitted: { $sum: reachedSubmitted },
                verified: { $sum: reachedVerified },
                completed: { $sum: reachedCompleted },
                rejected: { $sum: isRejected },
                underReview: { $sum: isReview },
                pendingSubmit: { $sum: isSubmitted },
                xpAwarded: { $sum: "$awardedXpSnapshot" },
              },
            },
            {
              $project: {
                _id: 0,
                uniqueUsers: { $size: "$users" },
                uniqueTasks: { $size: "$tasks" },
                records: 1, started: 1, submitted: 1, verified: 1,
                completed: 1, rejected: 1, underReview: 1, pendingSubmit: 1, xpAwarded: 1,
              },
            },
          ],
          byState: [
            { $group: { _id: "$state", count: { $sum: 1 }, users: { $addToSet: "$userId" } } },
            { $project: { _id: 0, state: "$_id", count: 1, users: { $size: "$users" } } },
          ],
          domain: [
            {
              $group: {
                _id: { $cond: [{ $gt: ["$activityId", null] }, "earlyland", "core"] },
                started: { $sum: notNull("startedAt") },
                completed: { $sum: notNull("completedAt") },
                rejected: { $sum: isRejected },
                xp: { $sum: "$awardedXpSnapshot" },
                users: { $addToSet: "$userId" },
              },
            },
            { $project: { _id: 0, domain: "$_id", started: 1, completed: 1, rejected: 1, xp: 1, users: { $size: "$users" } } },
          ],
          byDay: [
            { $match: { completedAt: { $ne: null } } },
            {
              $group: {
                _id: { $dateToString: { format: "%Y-%m-%d", date: "$completedAt" } },
                completed: { $sum: 1 },
                xp: { $sum: "$awardedXpSnapshot" },
              },
            },
            { $sort: { _id: 1 } },
          ],
          topTasks: [
            {
              $group: {
                _id: "$taskId",
                started: { $sum: notNull("startedAt") },
                completed: { $sum: notNull("completedAt") },
                rejected: { $sum: isRejected },
                underReview: { $sum: isReview },
                xp: { $sum: "$awardedXpSnapshot" },
                users: { $addToSet: "$userId" },
              },
            },
            { $project: { _id: 0, taskId: "$_id", started: 1, completed: 1, rejected: 1, underReview: 1, xp: 1, users: { $size: "$users" } } },
            { $sort: { started: -1, completed: -1 } },
            { $limit: 25 },
          ],
          topUsers: [
            {
              $group: {
                _id: "$userId",
                started: { $sum: notNull("startedAt") },
                completed: { $sum: notNull("completedAt") },
                rejected: { $sum: isRejected },
                xp: { $sum: "$awardedXpSnapshot" },
                tasks: { $addToSet: "$taskId" },
              },
            },
            { $project: { _id: 0, userId: "$_id", started: 1, completed: 1, rejected: 1, xp: 1, tasks: { $size: "$tasks" } } },
            { $sort: { xp: -1, completed: -1 } },
            { $limit: 25 },
          ],
        },
      },
    ]);

    const f = agg?.[0] || {};
    const totals = f.totals?.[0] || {
      uniqueUsers: 0, uniqueTasks: 0, records: 0, started: 0, submitted: 0,
      verified: 0, completed: 0, rejected: 0, underReview: 0, pendingSubmit: 0, xpAwarded: 0,
    };

    // Resolve task + user display names for drill-down tables.
    const taskIds = (f.topTasks || []).map((t: any) => t.taskId).filter(Boolean);
    const userIds = (f.topUsers || []).map((u: any) => u.userId).filter(Boolean);
    const [taskDocs, userDocs] = await Promise.all([
      taskIds.length
        ? this.taskModel.find({ _id: { $in: taskIds } }, { name: 1, points: 1, accessTier: 1, type: 1, completionMode: 1 }).lean()
        : Promise.resolve([]),
      userIds.length
        ? this.userModel.find({ _id: { $in: userIds } }, { name: 1, email: 1, wallet: 1, activityXP: 1 }).lean()
        : Promise.resolve([]),
    ]);
    const taskMap = new Map((taskDocs as any[]).map((t) => [String(t._id), t]));
    const userMap = new Map((userDocs as any[]).map((u) => [String(u._id), u]));

    const conv = (num: number, den: number) => (den > 0 ? Math.round((num / den) * 1000) / 10 : 0);

    // Cumulative funnel by lifecycle timestamps (monotonic).
    const funnel = [
      { key: "started", label: "Начали", users: totals.started, conversion: 100, dropOff: 0 },
      { key: "submitted", label: "Отправили", users: totals.submitted, conversion: conv(totals.submitted, totals.started), dropOff: Math.max(0, totals.started - totals.submitted) },
      { key: "verified", label: "Проверено", users: totals.verified, conversion: conv(totals.verified, totals.started), dropOff: Math.max(0, totals.submitted - totals.verified) },
      { key: "completed", label: "Завершили", users: totals.completed, conversion: conv(totals.completed, totals.started), dropOff: Math.max(0, totals.verified - totals.completed) },
    ];

    const days = this.daysBetween(from, to);
    const dayMap = new Map((f.byDay || []).map((d: any) => [d._id, d]));
    const seriesCompletions = days.map((day) => ({
      day,
      completed: (dayMap.get(day) as any)?.completed || 0,
      xp: (dayMap.get(day) as any)?.xp || 0,
    }));

    const domainRows = (f.domain || []).map((d: any) => ({
      domain: d.domain,
      label: d.domain === "earlyland" ? "EarlyLand" : "Core",
      started: d.started, completed: d.completed, rejected: d.rejected, xp: d.xp, users: d.users,
    }));

    return {
      range: { from, to },
      kpis: {
        uniqueUsers: totals.uniqueUsers,
        uniqueTasks: totals.uniqueTasks,
        started: totals.started,
        submitted: totals.submitted,
        underReview: totals.underReview,
        completed: totals.completed,
        rejected: totals.rejected,
        xpAwarded: totals.xpAwarded,
        approvalRate: conv(totals.completed, totals.completed + totals.rejected),
      },
      funnel,
      byState: f.byState || [],
      domain: domainRows,
      charts: { completions: seriesCompletions },
      topTasks: (f.topTasks || []).map((t: any) => {
        const meta = taskMap.get(String(t.taskId));
        return {
          taskId: String(t.taskId),
          name: meta?.name || "(без названия)",
          accessTier: meta?.accessTier || "public",
          completionMode: meta?.completionMode || "",
          points: meta?.points || 0,
          started: t.started, completed: t.completed, rejected: t.rejected,
          underReview: t.underReview, xp: t.xp, users: t.users,
          conversion: conv(t.completed, t.started),
        };
      }),
      topUsers: (f.topUsers || []).map((u: any) => {
        const meta = userMap.get(String(u.userId));
        return {
          userId: String(u.userId),
          name: meta?.name || "",
          email: meta?.email || "",
          wallet: meta?.wallet || "",
          activityXP: meta?.activityXP || 0,
          started: u.started, completed: u.completed, rejected: u.rejected,
          xp: u.xp, tasks: u.tasks,
        };
      }),
    };
  }

  /* ---------------- USERS TABLE ---------------- */
  async users(q: StatQuery & { search?: string; limit?: string; offset?: string; sort?: string }) {
    const limit = Math.min(100, Number(q?.limit) || 25);
    const offset = Math.max(0, Number(q?.offset) || 0);
    const search = String(q?.search || "").trim();
    const now = new Date();
    const d30 = new Date(now.getTime() - 30 * 86400000);

    const match: any = {};
    if (search) {
      match.$or = [
        { name: { $regex: search, $options: "i" } },
        { email: { $regex: search, $options: "i" } },
        { wallet: { $regex: search, $options: "i" } },
      ];
    }

    const [total, list] = await Promise.all([
      this.userModel.countDocuments(match),
      this.userModel.find(match, {
        name: 1, email: 1, wallet: 1, activityXP: 1, isActive: 1,
        verificationStatus: 1, lastLogin: 1, createdAt: 1,
      }).sort({ activityXP: -1 }).skip(offset).limit(limit).lean(),
    ]);

    const ids = list.map((u: any) => String(u._id));
    const sessions = await this.sessionModel.aggregate([
      { $match: { userId: { $in: ids }, lastActivityAt: { $gte: d30 } } },
      { $group: { _id: "$userId", sessions: { $sum: 1 }, activeMs: { $sum: "$activeMs" }, lastActive: { $max: "$lastActivityAt" } } },
    ]);
    const sMap = new Map(sessions.map((s: any) => [String(s._id), s]));

    const ranks = [...DEFAULT_XP_RANKS].sort((a, b) => a.order - b.order);
    const rankOf = (xp: number) => {
      let r = ranks[0];
      for (const x of ranks) if (xp >= x.minXp) r = x;
      return r.name;
    };

    return {
      total,
      limit,
      offset,
      rows: list.map((u: any) => {
        const s = sMap.get(String(u._id));
        return {
          userId: String(u._id),
          name: u.name || "",
          email: u.email || "",
          wallet: u.wallet || "",
          activityXP: u.activityXP || 0,
          rank: rankOf(u.activityXP || 0),
          isActive: !!u.isActive,
          verified: !!u.verificationStatus,
          lastLogin: u.lastLogin || null,
          lastActive: s?.lastActive || null,
          sessions30d: s?.sessions || 0,
          activeMin30d: s ? Math.round((s.activeMs || 0) / 60000) : 0,
          createdAt: u.createdAt || null,
        };
      }),
    };
  }

  /* ---------------- USER DRILLDOWN ---------------- */
  async userDetail(userId: string) {
    const id = String(userId || "").trim();
    const user = await this.userModel.findById(id, {
      name: 1, email: 1, wallet: 1, activityXP: 1, isActive: 1,
      verificationStatus: 1, lastLogin: 1, createdAt: 1, role: 1,
    }).lean();
    if (!user) return { found: false };

    const [xpTx, sessions, events, logs, xpByGroup] = await Promise.all([
      this.xpModel.find({ userId: id }).sort({ occurredAt: -1 }).limit(50).lean(),
      this.sessionModel.find({ userId: id }).sort({ startedAt: -1 }).limit(30).lean(),
      this.eventModel.find({ userId: id }).sort({ occurredAt: -1 }).limit(50).lean(),
      this.logModel.find({ userId: id as any }).sort({ createdAt: -1 }).limit(50).lean().catch(() => []),
      this.xpModel.aggregate([
        { $match: { userId: id, status: "awarded" } },
        { $group: { _id: "$eventType", xp: { $sum: "$finalXp" }, tx: { $sum: 1 } } },
      ]),
    ]);

    const totalActiveMs = sessions.reduce((a: number, s: any) => a + (s.activeMs || 0), 0);

    return {
      found: true,
      user: {
        userId: id,
        name: (user as any).name || "",
        email: (user as any).email || "",
        wallet: (user as any).wallet || "",
        activityXP: (user as any).activityXP || 0,
        isActive: !!(user as any).isActive,
        verified: !!(user as any).verificationStatus,
        role: (user as any).role || [],
        lastLogin: (user as any).lastLogin || null,
        createdAt: (user as any).createdAt || null,
      },
      stats: {
        sessions: sessions.length,
        totalActiveMin: Math.round(totalActiveMs / 60000),
        events: events.length,
      },
      xpByGroup: xpByGroup.map((g: any) => ({
        eventType: g._id,
        group: EVENT_GROUP[g._id] || "other",
        xp: g.xp,
        tx: g.tx,
      })),
      xpTransactions: xpTx.map((t: any) => ({
        eventType: t.eventType, finalXp: t.finalXp, status: t.status,
        reason: t.reason, occurredAt: t.occurredAt, source: t.source,
      })),
      sessions: sessions.map((s: any) => ({
        sessionId: s.sessionId, startedAt: s.startedAt, endedAt: s.endedAt,
        activeMin: Math.round((s.activeMs || 0) / 60000), pageViews: s.pageViews,
      })),
      activity: events.map((e: any) => ({ eventType: e.eventType, page: e.page, occurredAt: e.occurredAt })),
      moderationLogs: (logs as any[]).map((l: any) => ({
        category: l.category, action: l.action, severity: l.severity,
        title: l.title, createdAt: l.createdAt,
      })),
    };
  }
}
