// EPIC CAL-2 · Editorial Market Digests (calendar_digests)
// Separate editorial entity that lives INSIDE the calendar domain (NOT a parallel
// calendar engine). A digest is a market-outlook review for a given period.
import { Prop, Schema, SchemaFactory } from "@nestjs/mongoose";
import { HydratedDocument } from "mongoose";

export type DigestDocument = HydratedDocument<Digest>;

export const DIGEST_PERIODS = ["WEEK", "MONTH", "QUARTER", "HALF_YEAR", "YEAR"] as const;
export type DigestPeriod = (typeof DIGEST_PERIODS)[number];

// WEEK = recurring routine; the rest are one-off special releases.
export const DIGEST_KINDS = ["ROUTINE", "SPECIAL"] as const;
export const DIGEST_STATUSES = ["DRAFT", "PUBLISHED", "ARCHIVED"] as const;
export const DIGEST_OUTLOOKS = ["BULLISH", "BEARISH", "NEUTRAL", "MIXED"] as const;

@Schema({ collection: "calendar_digests", timestamps: true })
export class Digest {
  @Prop({ required: true, trim: true })
  title: string;

  @Prop({ default: "" })
  slug: string;

  @Prop({ type: String, enum: DIGEST_PERIODS, default: "WEEK", index: true })
  period: DigestPeriod;

  @Prop({ type: String, enum: DIGEST_KINDS, default: "ROUTINE" })
  kind: string;

  // Short teaser shown in cards/lists.
  @Prop({ default: "" })
  summary: string;

  // AI/manual key highlights shown in the digest sidebar (news-feed style).
  @Prop({ type: [String], default: [] })
  keyTakeaways: string[];

  // Rich HTML body produced by the CRM editor (supports links / images / video embeds).
  @Prop({ default: "" })
  bodyHtml: string;

  @Prop({ default: "" })
  coverImage: string;

  @Prop({ type: [String], default: [] })
  tags: string[];

  @Prop({ type: String, enum: DIGEST_OUTLOOKS, default: "NEUTRAL" })
  outlook: string;

  @Prop({ type: String, enum: DIGEST_STATUSES, default: "DRAFT", index: true })
  status: string;

  // The period window this digest covers.
  @Prop({ type: Date })
  periodStart: Date;

  @Prop({ type: Date })
  periodEnd: Date;

  @Prop({ type: Date })
  publishedAt: Date;

  // Optional highlighted media links (video/article) beyond the body.
  @Prop({ type: [{ label: String, url: String, kind: String }], default: [] })
  media: Array<{ label: string; url: string; kind: string }>;

  @Prop({ default: false })
  aiGenerated: boolean;

  @Prop({ default: "" })
  aiModel: string;

  @Prop({ type: Number, default: 0 })
  aiProviderCostUsd: number;

  @Prop({ default: "" })
  createdBy: string;

  @Prop({ default: "" })
  updatedBy: string;

  // Live community reactions (arrays of userIds → counts are derived).
  @Prop({ type: [String], default: [] })
  likes: string[];

  @Prop({ type: [String], default: [] })
  reposts: string[];

  // Idempotency marker for the weekly auto-digest cron (ISO week key e.g. 2026-W33).
  @Prop({ default: "" })
  autoWeekKey: string;
}

export const DigestSchema = SchemaFactory.createForClass(Digest);
