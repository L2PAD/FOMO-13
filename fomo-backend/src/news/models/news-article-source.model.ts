import { Prop, Schema, SchemaFactory } from "@nestjs/mongoose";
import mongoose, { HydratedDocument } from "mongoose";

export const NEWS_ARTICLES_CONNECTION = "newsArticlesConnection";

export type NewsArticleSourceDocument = HydratedDocument<NewsArticleSource>;

@Schema({ collection: "news_articles", strict: false })
export class NewsArticleSource {
  @Prop()
  id?: string;

  @Prop()
  source_id?: string;

  @Prop()
  source_name?: string;

  @Prop()
  source?: string;

  @Prop()
  feedId?: string;

  @Prop()
  title?: string;

  @Prop()
  content?: string;

  @Prop()
  summary?: string;

  @Prop()
  description?: string;

  @Prop()
  text?: string;

  @Prop()
  url?: string;

  @Prop()
  link?: string;

  @Prop()
  image_url?: string;

  @Prop()
  image?: string;

  @Prop()
  thumbnail?: string;

  @Prop()
  author?: string;

  @Prop({ type: mongoose.Schema.Types.Mixed })
  published_at?: any;

  @Prop({ type: mongoose.Schema.Types.Mixed })
  pubDate?: any;

  @Prop({ type: mongoose.Schema.Types.Mixed })
  created_at?: any;

  @Prop({ type: mongoose.Schema.Types.Mixed })
  createdAt?: any;

  @Prop()
  content_hash?: string;

  @Prop()
  contentHash?: string;

  @Prop()
  language?: string;

  @Prop({ type: [String], default: undefined })
  tags?: string[];

  @Prop({ type: [String], default: undefined })
  categories?: string[];
}

export const NewsArticleSourceSchema = SchemaFactory.createForClass(NewsArticleSource);
