import { BadRequestException, Injectable } from "@nestjs/common";
import { InjectConnection } from "@nestjs/mongoose";
import { randomUUID } from "crypto";
import { Connection } from "mongoose";

import { INFO_ANALYTICS_COLLECTION } from "./info.constants";
import { sanitizeInfoValue } from "./helpers/info-normalization";

type RequestContext = {
  ip?: string;
  user_agent?: string;
  referrer?: string;
};

@Injectable()
export class InfoAnalyticsService {
  constructor(@InjectConnection() private readonly connection: Connection) {}

  async track(
    type: string,
    rawPayload: unknown,
    context: RequestContext = {}
  ): Promise<Record<string, unknown>> {
    const normalizedType = String(type || "")
      .trim()
      .toLowerCase()
      .replace(/[^a-z0-9:_-]+/g, "_")
      .slice(0, 80);
    if (!normalizedType) {
      throw new BadRequestException("Analytics event type is required");
    }

    const payload = sanitizeInfoValue(rawPayload || {});
    const encoded = JSON.stringify(payload);
    if (encoded.length > 64 * 1024) {
      throw new BadRequestException("Analytics payload is too large");
    }

    const now = new Date();
    const event = {
      id: randomUUID(),
      type: normalizedType,
      timestamp: now,
      session_id: this.pickString(payload, "session_id", "sessionId"),
      visitor_id: this.pickString(payload, "visitor_id", "visitorId"),
      ip: String(context.ip || "").slice(0, 100) || undefined,
      user_agent: String(context.user_agent || "").slice(0, 1_000) || undefined,
      referrer: String(context.referrer || "").slice(0, 2_000) || undefined,
      payload,
    };

    await this.collection().insertOne(event);
    return {
      status: "success",
      event: {
        ...event,
        timestamp: now.toISOString(),
      },
    };
  }

  async getStats(periodInput: unknown): Promise<Record<string, unknown>> {
    const days = this.parsePeriod(periodInput);
    const from = new Date(Date.now() - days * 24 * 60 * 60 * 1_000);
    const events = await this.collection()
      .find({ timestamp: { $gte: from } })
      .sort({ timestamp: 1 })
      .limit(250_000)
      .toArray();

    const pageViews = events.filter((event) =>
      ["page_view", "pageview"].includes(event.type)
    );
    const buttonClicks = events.filter((event) =>
      ["button_click", "click"].includes(event.type)
    );
    const conversions = events.filter((event) =>
      ["conversion", "registration", "wallet_registered"].includes(event.type)
    );
    const sessions = new Map<string, { first: number; last: number }>();
    const visitors = new Map<string, number>();
    const devices = new Map<string, number>();
    const countries = new Map<string, number>();
    const cities = new Map<string, number>();
    const sources = new Map<string, number>();

    for (const event of events) {
      const payload = event.payload || {};
      const sessionId =
        event.session_id || payload.session_id || payload.sessionId;
      if (sessionId) {
        const timestamp = new Date(event.timestamp).getTime();
        const current = sessions.get(String(sessionId));
        sessions.set(String(sessionId), {
          first: current ? Math.min(current.first, timestamp) : timestamp,
          last: current ? Math.max(current.last, timestamp) : timestamp,
        });
      }

      const visitorId =
        event.visitor_id || payload.visitor_id || payload.visitorId;
      if (visitorId) {
        visitors.set(
          String(visitorId),
          (visitors.get(String(visitorId)) || 0) + 1
        );
      }

      this.increment(
        devices,
        String(
          payload.device_type ||
            payload.device ||
            this.inferDevice(event.user_agent)
        )
      );
      this.increment(countries, String(payload.country || ""));
      this.increment(cities, String(payload.city || ""));
      this.increment(
        sources,
        String(
          payload.source ||
            payload.utm_source ||
            this.sourceFromReferrer(event.referrer)
        )
      );
    }

    const avgSessionDuration = sessions.size
      ? Math.round(
          Array.from(sessions.values()).reduce(
            (total, session) =>
              total + Math.max(0, (session.last - session.first) / 1_000),
            0
          ) / sessions.size
        )
      : 0;
    const returningVisitors = Array.from(visitors.values()).filter(
      (count) => count > 1
    ).length;
    const newVisitors = Math.max(0, visitors.size - returningVisitors);
    const desktop = devices.get("desktop") || 0;
    const mobile = devices.get("mobile") || 0;
    const trafficTotal = Array.from(sources.values()).reduce(
      (total, value) => total + value,
      0
    );
    const direct = sources.get("direct") || 0;
    const search = Array.from(sources.entries())
      .filter(([source]) =>
        ["google", "bing", "yandex", "duckduckgo", "search"].includes(source)
      )
      .reduce((sum, [, count]) => sum + count, 0);
    const referral = Math.max(0, trafficTotal - direct - search);

    return {
      period_days: days,
      from: from.toISOString(),
      page_views: pageViews.length,
      unique_sessions: sessions.size,
      button_clicks: buttonClicks.length,
      conversions: conversions.length,
      conversion_rate: this.percent(conversions.length, sessions.size),
      avg_session_duration: avgSessionDuration,
      new_visitors: newVisitors,
      new_visitors_percent: this.percent(newVisitors, visitors.size),
      returning_visitors: returningVisitors,
      returning_visitors_percent: this.percent(
        returningVisitors,
        visitors.size
      ),
      desktop_visitors: desktop,
      desktop_percent: this.percent(desktop, desktop + mobile),
      mobile_visitors: mobile,
      mobile_percent: this.percent(mobile, desktop + mobile),
      top_countries: this.rank(countries, "name"),
      top_cities: this.rank(cities, "name"),
      direct_traffic: direct,
      direct_percent: this.percent(direct, trafficTotal),
      referral_traffic: referral,
      referral_percent: this.percent(referral, trafficTotal),
      search_traffic: search,
      search_percent: this.percent(search, trafficTotal),
      detailed_sources: this.rank(sources, "source", trafficTotal),
      event_count: events.length,
    };
  }

  async clear(): Promise<{ deleted_count: number }> {
    const result = await this.collection().deleteMany({});
    return { deleted_count: result.deletedCount || 0 };
  }

  private parsePeriod(input: unknown): number {
    const normalized = String(input || "30")
      .trim()
      .toLowerCase();
    const aliases: Record<string, number> = {
      "24h": 1,
      "7d": 7,
      "30d": 30,
      "90d": 90,
    };
    const value = aliases[normalized] || Number(normalized);
    return Number.isFinite(value)
      ? Math.max(1, Math.min(365, Math.trunc(value)))
      : 30;
  }

  private pickString(
    payload: Record<string, unknown>,
    ...keys: string[]
  ): string | undefined {
    for (const key of keys) {
      const value = payload[key];
      if (value !== undefined && value !== null && value !== "") {
        return String(value).slice(0, 200);
      }
    }
    return undefined;
  }

  private inferDevice(userAgent: unknown): string {
    return /android|iphone|ipad|mobile/i.test(String(userAgent || ""))
      ? "mobile"
      : "desktop";
  }

  private sourceFromReferrer(referrer: unknown): string {
    const value = String(referrer || "")
      .trim()
      .toLowerCase();
    if (!value) return "direct";
    for (const source of ["google", "bing", "yandex", "duckduckgo"]) {
      if (value.includes(source)) return source;
    }
    try {
      return new URL(value).hostname.replace(/^www\./, "") || "referral";
    } catch {
      return "referral";
    }
  }

  private increment(target: Map<string, number>, rawKey: string): void {
    const key = rawKey.trim().toLowerCase();
    if (!key) return;
    target.set(key, (target.get(key) || 0) + 1);
  }

  private rank(
    source: Map<string, number>,
    label: string,
    total = Array.from(source.values()).reduce((sum, value) => sum + value, 0)
  ): Array<Record<string, unknown>> {
    return Array.from(source.entries())
      .sort((a, b) => b[1] - a[1])
      .map(([name, count]) => ({
        [label]: name,
        count,
        percent: this.percent(count, total),
      }));
  }

  private percent(value: number, total: number): number {
    return total ? Number(((value / total) * 100).toFixed(1)) : 0;
  }

  private collection(): any {
    if (!this.connection.db) throw new Error("MongoDB connection is not ready");
    return this.connection.db.collection(INFO_ANALYTICS_COLLECTION);
  }
}
