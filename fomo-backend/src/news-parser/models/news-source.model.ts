import { Prop, Schema, SchemaFactory } from "@nestjs/mongoose";
import { HydratedDocument } from "mongoose";

export type NewsSourceDocument = HydratedDocument<NewsSource>;

export type NewsSourceStatus = "ACTIVE" | "PAUSED" | "ERROR" | "DISABLED";
export type NewsSourceType = "RSS" | "HTML" | "API" | "CUSTOM";

// P1 — canonical managed Source Registry (collection: news_sources).
@Schema({ collection: "news_sources", timestamps: true })
export class NewsSource {
  @Prop({ required: true, unique: true, index: true })
  id: string; // stable slug e.g. "coindesk"

  @Prop({ required: true })
  name: string;

  @Prop()
  slug: string;

  @Prop({ default: "RSS" })
  sourceType: NewsSourceType;

  @Prop()
  url: string; // site/domain

  @Prop()
  feedUrl: string; // rss url

  @Prop({ default: "en" })
  language: string;

  @Prop({ default: "C", index: true })
  tier: "A" | "B" | "C";

  @Prop({ default: [] })
  categories: string[];

  @Prop({ default: "ACTIVE", index: true })
  status: NewsSourceStatus;

  @Prop({ default: "rss.generic" })
  parserKey: string;

  @Prop({ default: 1 })
  parserVersion: number;

  @Prop({ default: 60 })
  pollingIntervalMinutes: number;

  @Prop({ default: 30000 })
  timeoutMs: number;

  @Prop({ default: 2 })
  maxRetries: number;

  @Prop()
  rateLimitPerMinute: number;

  @Prop({ default: true })
  aiEnabled: boolean;

  @Prop({ default: 0.7 })
  trustLevel: number;

  @Prop({ default: 0 })
  priority: number;

  @Prop({ default: "US" })
  region: string;

  @Prop({ default: false })
  isOfficial: boolean;

  // runtime state
  @Prop()
  lastRunAt: Date;

  @Prop()
  lastSuccessAt: Date;

  @Prop()
  lastArticleAt: Date;

  @Prop()
  nextRunAt: Date;

  @Prop({ default: 0 })
  consecutiveFailures: number;

  @Prop()
  lastError: string;

  // rolling counters (last run)
  @Prop({ default: 0 })
  lastFetched: number;

  @Prop({ default: 0 })
  lastNew: number;

  @Prop({ default: 0 })
  lastDuplicates: number;

  @Prop({ default: 0 })
  totalArticles: number;
}

export const NewsSourceSchema = SchemaFactory.createForClass(NewsSource);
