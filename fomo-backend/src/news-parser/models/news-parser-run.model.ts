import { Prop, Schema, SchemaFactory } from "@nestjs/mongoose";
import { HydratedDocument } from "mongoose";

export type NewsParserRunDocument = HydratedDocument<NewsParserRun>;

// P5 — every parser run leaves a trace (collection: news_parser_runs).
export type NewsParserRunStatus =
  | "RUNNING"
  | "SUCCESS"
  | "PARTIAL"
  | "FAILED";

@Schema({ collection: "news_parser_runs", timestamps: true })
export class NewsParserRun {
  @Prop({ required: true, index: true })
  sourceId: string;

  @Prop()
  sourceName: string;

  @Prop({ index: true })
  correlationId: string;

  @Prop({ default: "schedule" })
  trigger: "manual" | "schedule";

  @Prop()
  requestedBy: string;

  @Prop({ default: () => new Date(), index: true })
  startedAt: Date;

  @Prop()
  finishedAt: Date;

  @Prop({ default: "RUNNING", index: true })
  status: NewsParserRunStatus;

  @Prop({ default: 0 })
  fetchedItems: number;

  @Prop({ default: 0 })
  parsedItems: number;

  @Prop({ default: 0 })
  newItems: number;

  @Prop({ default: 0 })
  duplicates: number;

  @Prop({ default: 0 })
  rejected: number;

  @Prop({ default: 0 })
  failed: number;

  @Prop({ default: 0 })
  durationMs: number;

  @Prop({ default: 0 })
  retryCount: number;

  @Prop()
  errorCode: string;

  @Prop()
  errorMessage: string;

  @Prop()
  workerId: string;
}

export const NewsParserRunSchema = SchemaFactory.createForClass(NewsParserRun);
