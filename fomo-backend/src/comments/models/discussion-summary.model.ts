import { Prop, Schema, SchemaFactory } from "@nestjs/mongoose";
import { HydratedDocument } from "mongoose";

export type DiscussionSummaryDocument = HydratedDocument<DiscussionSummary>;

/**
 * NEWS-1 Phase 6A P3 — cached AI summary for a page-scoped discussion
 * (e.g. a News item: page = "crypto-news-<newsId>").
 *
 * This is a READ-MODEL CACHE, not a parallel engine: the actual summary is
 * produced by the existing CommentsService + FomoAiGateway (BUZZ-AI
 * "buzz_post_summary" operation), mirroring the exact aiSummary shape used for
 * topic threads. Lazy regeneration only — a new comment marks it STALE but does
 * NOT trigger an automatic LLM call.
 */
@Schema({ collection: "discussion_summaries" })
export class DiscussionSummary {
  @Prop({ required: true, unique: true, index: true })
  page: string;

  @Prop({ default: "" })
  overview: string;

  @Prop({ type: [String], default: [] })
  keyTakeaways: string[];

  @Prop({ default: "" })
  communityPulse: string;

  @Prop()
  provider: string;

  @Prop()
  model: string;

  @Prop()
  latencyMs: number;

  @Prop({ default: null })
  providerCostUsd: number | null;

  @Prop({ default: 0 })
  creditsCharged: number;

  @Prop()
  generatedAt: Date;

  @Prop()
  contentVersion: string;

  @Prop({ default: 0 })
  commentsVersion: number;

  @Prop({ enum: ["READY", "STALE", "FAILED"], default: "READY" })
  status: "READY" | "STALE" | "FAILED";
}

export const DiscussionSummarySchema =
  SchemaFactory.createForClass(DiscussionSummary);
