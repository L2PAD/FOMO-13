import { Schema, SchemaFactory } from "@nestjs/mongoose";
import { HydratedDocument } from "mongoose";

export type NewsArticleRawDocument = HydratedDocument<NewsArticleRaw>;

// Flexible write-model over the SAME collection the importer reads (news_articles).
// Keeps compatibility with NewsArticleSource (strict:false) in the news module.
@Schema({ collection: "news_articles", strict: false, timestamps: false })
export class NewsArticleRaw {}

export const NewsArticleRawSchema = SchemaFactory.createForClass(NewsArticleRaw);
