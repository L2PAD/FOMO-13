import { Injectable } from "@nestjs/common";
import { InjectModel } from "@nestjs/mongoose";
import { Model } from "mongoose";
import {
  UserSession,
  UserActivityEvent,
  UserActivityDaily,
} from "./platform-analytics.models";

interface IncomingEvent {
  eventType: string;
  page?: string;
  occurredAt?: string | number | Date;
  activeMsDelta?: number;
  metadata?: Record<string, any>;
}

interface TrackPayload {
  sessionId: string;
  anonymousId?: string;
  userId?: string | null;
  referrer?: string;
  userAgent?: string;
  events?: IncomingEvent[];
}

const HEARTBEAT_INTERVAL_MS = 15000;
// Never trust the client blindly: cap a single reported active delta.
const MAX_ACTIVE_DELTA_MS = 60000;

const dayKey = (d: Date): string => d.toISOString().slice(0, 10);

@Injectable()
export class TrackingService {
  constructor(
    @InjectModel(UserSession.name) private sessionModel: Model<UserSession>,
    @InjectModel(UserActivityEvent.name) private eventModel: Model<UserActivityEvent>,
    @InjectModel(UserActivityDaily.name) private dailyModel: Model<UserActivityDaily>
  ) {}

  /** Ingest a batch of raw analytics events + advance session heartbeat. */
  async track(payload: TrackPayload): Promise<{ ok: boolean; accepted: number }> {
    const sessionId = String(payload?.sessionId || "").trim();
    if (!sessionId) return { ok: false, accepted: 0 };

    const anonymousId = String(payload?.anonymousId || "").trim();
    const userId = payload?.userId ? String(payload.userId).trim() : null;
    const events = Array.isArray(payload?.events) ? payload.events.slice(0, 100) : [];

    const now = new Date();
    let activeDelta = 0;
    let pageViews = 0;
    const docs: Partial<UserActivityEvent>[] = [];

    for (const ev of events) {
      const type = String(ev?.eventType || "").trim();
      if (!type) continue;
      const occurredAt = ev?.occurredAt ? new Date(ev.occurredAt) : now;
      if (type === "session_heartbeat") {
        activeDelta += Math.max(0, Math.min(MAX_ACTIVE_DELTA_MS, Number(ev?.activeMsDelta) || 0));
        continue; // heartbeats are not stored as discrete events
      }
      if (type === "page_view") pageViews += 1;
      docs.push({
        sessionId,
        anonymousId,
        userId,
        eventType: type,
        page: String(ev?.page || "").slice(0, 300),
        occurredAt: Number.isNaN(occurredAt.getTime()) ? now : occurredAt,
        metadata: ev?.metadata && typeof ev.metadata === "object" ? ev.metadata : {},
      });
    }

    if (docs.length) await this.eventModel.insertMany(docs, { ordered: false }).catch(() => null);

    const lastPage =
      [...events].reverse().find((e) => e?.page)?.page || undefined;

    await this.sessionModel.updateOne(
      { sessionId },
      {
        $set: {
          lastActivityAt: now,
          ...(anonymousId ? { anonymousId } : {}),
          ...(userId ? { userId, isAuthenticated: true } : {}),
          ...(lastPage ? { lastPage: String(lastPage).slice(0, 300) } : {}),
        },
        $inc: { activeMs: activeDelta, pageViews, eventsCount: docs.length },
        $setOnInsert: {
          startedAt: now,
          entryPage: String(lastPage || "").slice(0, 300),
          referrer: String(payload?.referrer || "").slice(0, 300),
          userAgent: String(payload?.userAgent || "").slice(0, 400),
        },
      },
      { upsert: true }
    ).catch(() => null);

    // Daily rollup (UTC).
    await this.dailyModel.updateOne(
      { day: dayKey(now), userId: userId, anonymousId: userId ? "" : anonymousId },
      { $inc: { activeMs: activeDelta, events: docs.length, pageViews } },
      { upsert: true }
    ).catch(() => null);

    return { ok: true, accepted: docs.length };
  }

  /** Start (or resume) a session. */
  async startSession(payload: TrackPayload): Promise<{ ok: boolean }> {
    const sessionId = String(payload?.sessionId || "").trim();
    if (!sessionId) return { ok: false };
    const now = new Date();
    await this.sessionModel.updateOne(
      { sessionId },
      {
        $setOnInsert: {
          sessionId,
          anonymousId: String(payload?.anonymousId || "").trim(),
          userId: payload?.userId ? String(payload.userId).trim() : null,
          isAuthenticated: Boolean(payload?.userId),
          startedAt: now,
          referrer: String(payload?.referrer || "").slice(0, 300),
          userAgent: String(payload?.userAgent || "").slice(0, 400),
        },
        $set: { lastActivityAt: now },
      },
      { upsert: true }
    ).catch(() => null);
    return { ok: true };
  }

  /** Link anonymous browsing to a user after login/registration. */
  async identify(sessionId: string, userId: string, anonymousId?: string): Promise<{ ok: boolean }> {
    const sid = String(sessionId || "").trim();
    const uid = String(userId || "").trim();
    if (!sid || !uid) return { ok: false };
    await this.sessionModel.updateOne(
      { sessionId: sid },
      { $set: { userId: uid, isAuthenticated: true, ...(anonymousId ? { anonymousId } : {}) } }
    ).catch(() => null);
    // Backfill recent anonymous events for this session to the user.
    await this.eventModel.updateMany(
      { sessionId: sid, userId: null },
      { $set: { userId: uid } }
    ).catch(() => null);
    return { ok: true };
  }

  /** Mark a session ended. */
  async endSession(sessionId: string, activeMsDelta?: number): Promise<{ ok: boolean }> {
    const sid = String(sessionId || "").trim();
    if (!sid) return { ok: false };
    const now = new Date();
    const delta = Math.max(0, Math.min(MAX_ACTIVE_DELTA_MS, Number(activeMsDelta) || 0));
    await this.sessionModel.updateOne(
      { sessionId: sid },
      { $set: { endedAt: now, lastActivityAt: now }, $inc: { activeMs: delta } }
    ).catch(() => null);
    return { ok: true };
  }
}

export const HEARTBEAT_MS = HEARTBEAT_INTERVAL_MS;
