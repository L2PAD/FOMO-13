import { Module } from "@nestjs/common";
import { MongooseModule } from "@nestjs/mongoose";
import { JwtModule } from "@nestjs/jwt/dist/jwt.module";
import { ConfigModule } from "@nestjs/config";
import mongoose from "mongoose";
import { NEWS_ARTICLES_CONNECTION } from "../news/models/news-article-source.model";
import { EntitlementsModule } from "../entitlements/entitlements.module";
import { NewsAiService } from "./news-ai.service";
import { NewsAiController } from "./news-ai.controller";
import { NewsAiEntityExtractor } from "./entity-extractor.service";
import { NewsAiEntityNormalizer } from "./entity-normalizer.service";
import { NewsAiClustering } from "./news-clustering.service";
import { NewsAiRanking } from "./news-ranking.service";

const GeneratedNewsSchema = new mongoose.Schema({ unique_hash: { type: String, index: true, unique: true } }, { strict: false, timestamps: false });
const NewsAiRunSchema = new mongoose.Schema({ correlationId: { type: String, index: true } }, { strict: false, timestamps: false });
const RawReadSchema = new mongoose.Schema({}, { strict: false });
const AiGlobalSettingsSchema = new mongoose.Schema({}, { strict: false });

@Module({
  imports: [
    EntitlementsModule, // provides FomoAiGateway
    JwtModule.register({}),
    ConfigModule.forRoot(),
    // fomo_market collections (news_articles read, generated_news, news_ai_runs)
    MongooseModule.forFeature(
      [
        { name: "news_articles", schema: RawReadSchema, collection: "news_articles" },
        { name: "generated_news", schema: GeneratedNewsSchema, collection: "generated_news" },
        { name: "news_ai_runs", schema: NewsAiRunSchema, collection: "news_ai_runs" },
      ],
      NEWS_ARTICLES_CONNECTION,
    ),
    // default connection (fomo_dev): read active managed credential id
    MongooseModule.forFeature([{ name: "ai_global_settings", schema: AiGlobalSettingsSchema, collection: "ai_global_settings" }]),
  ],
  controllers: [NewsAiController],
  providers: [NewsAiService, NewsAiEntityExtractor, NewsAiEntityNormalizer, NewsAiClustering, NewsAiRanking],
  exports: [NewsAiService],
})
export class NewsAiModule {}
