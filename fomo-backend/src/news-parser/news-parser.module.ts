import { Module } from "@nestjs/common";
import { BullModule } from "@nestjs/bull";
import { MongooseModule } from "@nestjs/mongoose";
import { JwtModule } from "@nestjs/jwt/dist/jwt.module";
import { ConfigModule } from "@nestjs/config";
import { NEWS_ARTICLES_CONNECTION } from "../news/models/news-article-source.model";
import { NewsModule } from "../news/news.module";
import { NewsParserController } from "./news-parser.controller";
import { NewsParserService } from "./news-parser.service";
import { NewsFetcherService } from "./news-fetcher.service";
import { NewsParserProcessor } from "./news-parser.processor";
import { NewsParserScheduler } from "./news-parser.scheduler";
import { NEWS_PARSER_QUEUE } from "./news-parser.constants";
import { NewsSource, NewsSourceSchema } from "./models/news-source.model";
import { NewsParserRun, NewsParserRunSchema } from "./models/news-parser-run.model";
import { NewsArticleRaw, NewsArticleRawSchema } from "./models/news-article-raw.model";

@Module({
  imports: [
    NewsModule, // provides NewsService (news_articles -> News importer)
    JwtModule.register({}),
    ConfigModule.forRoot(),
    BullModule.registerQueue({ name: NEWS_PARSER_QUEUE }),
    MongooseModule.forFeature(
      [
        { name: NewsSource.name, schema: NewsSourceSchema },
        { name: NewsParserRun.name, schema: NewsParserRunSchema },
        { name: NewsArticleRaw.name, schema: NewsArticleRawSchema },
      ],
      NEWS_ARTICLES_CONNECTION
    ),
  ],
  controllers: [NewsParserController],
  providers: [NewsParserService, NewsFetcherService, NewsParserProcessor, NewsParserScheduler],
  exports: [NewsParserService],
})
export class NewsParserModule {}
