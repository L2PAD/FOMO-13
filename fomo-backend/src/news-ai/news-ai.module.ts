import { Module } from "@nestjs/common";
import { MongooseModule } from "@nestjs/mongoose";
import { JwtModule } from "@nestjs/jwt/dist/jwt.module";
import { ConfigModule } from "@nestjs/config";
import { BullModule } from "@nestjs/bull";
import mongoose from "mongoose";
import { NEWS_ARTICLES_CONNECTION } from "../news/models/news-article-source.model";
import { EntitlementsModule } from "../entitlements/entitlements.module";
import { NewsModule } from "../news/news.module";
import { NewsAiService } from "./news-ai.service";
import { NewsAiController } from "./news-ai.controller";
import { NewsAiProcessor } from "./news-ai.processor";
import { NewsAiScheduler } from "./news-ai.scheduler";
import { NEWS_AI_QUEUE } from "./news-ai.constants";
import { NewsAiEntityExtractor } from "./entity-extractor.service";
import { NewsAiEntityNormalizer } from "./entity-normalizer.service";
import { NewsAiClustering } from "./news-clustering.service";
import { NewsAiRanking } from "./news-ranking.service";
import { AdminAuditModule } from "../admin-audit/admin-audit.module";

const GeneratedNewsSchema = new mongoose.Schema({ unique_hash: { type: String, index: true, unique: true } }, { strict: false, timestamps: false });
const NewsAiRunSchema = new mongoose.Schema({ correlationId: { type: String, index: true } }, { strict: false, timestamps: false });
const NewsAiSettingsSchema = new mongoose.Schema({ _id: String }, { strict: false, timestamps: false, _id: false });
const RawReadSchema = new mongoose.Schema({}, { strict: false });
const AiGlobalSettingsSchema = new mongoose.Schema({}, { strict: false });
const AiUsageEventSchema = new mongoose.Schema({}, { strict: false });

@Module({
  imports: [
    EntitlementsModule, // provides FomoAiGateway
    NewsModule, // provides NewsService (canonical News publish)
    AdminAuditModule, // provides AdminAuditService (audit trail)
    JwtModule.register({}),
    ConfigModule.forRoot(),
    BullModule.registerQueue({ name: NEWS_AI_QUEUE }),
    MongooseModule.forFeature(
      [
        { name: "news_articles", schema: RawReadSchema, collection: "news_articles" },
        { name: "generated_news", schema: GeneratedNewsSchema, collection: "generated_news" },
        { name: "news_ai_runs", schema: NewsAiRunSchema, collection: "news_ai_runs" },
        { name: "news_ai_settings", schema: NewsAiSettingsSchema, collection: "news_ai_settings" },
      ],
      NEWS_ARTICLES_CONNECTION,
    ),
    // default connection (fomo_dev): read managed credential + COGS usage events
    MongooseModule.forFeature([
      { name: "ai_global_settings", schema: AiGlobalSettingsSchema, collection: "ai_global_settings" },
      { name: "ai_usage_events", schema: AiUsageEventSchema, collection: "ai_usage_events" },
    ]),
  ],
  controllers: [NewsAiController],
  providers: [NewsAiService, NewsAiProcessor, NewsAiScheduler, NewsAiEntityExtractor, NewsAiEntityNormalizer, NewsAiClustering, NewsAiRanking],
  exports: [NewsAiService],
})
export class NewsAiModule {}
