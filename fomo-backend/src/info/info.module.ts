import { Module } from "@nestjs/common";
import { ConfigModule } from "@nestjs/config";
import { JwtModule } from "@nestjs/jwt";

import { JwtAuthGuard } from "src/auth/jwt.auth.guard";
import { FilesModule } from "src/files/files.module";
import {
  InfoAdminAnalyticsController,
  InfoAnalyticsController,
} from "./controllers/info-analytics.controller";
import { InfoAssetsController } from "./controllers/info-assets.controller";
import {
  InfoAdminContentController,
  InfoPublicController,
} from "./controllers/info-content.controller";
import {
  InfoAdminMarketController,
  InfoMarketController,
} from "./controllers/info-market.controller";
import { InfoRoadmapAdminController } from "./controllers/info-roadmap.controller";
import { InfoWalletController } from "./controllers/info-wallet.controller";
import { InfoAnalyticsService } from "./info-analytics.service";
import { InfoAssetsService } from "./info-assets.service";
import { InfoContentService } from "./info-content.service";
import { InfoMarketService } from "./info-market.service";
import { InfoRepositoryService } from "./info-repository.service";
import { InfoWalletService } from "./info-wallet.service";

@Module({
  imports: [ConfigModule, JwtModule.register({}), FilesModule],
  controllers: [
    InfoAssetsController,
    InfoAnalyticsController,
    InfoAdminAnalyticsController,
    InfoMarketController,
    InfoAdminMarketController,
    InfoWalletController,
    InfoRoadmapAdminController,
    InfoAdminContentController,
    InfoPublicController,
  ],
  providers: [
    JwtAuthGuard,
    InfoRepositoryService,
    InfoContentService,
    InfoAssetsService,
    InfoAnalyticsService,
    InfoMarketService,
    InfoWalletService,
  ],
  exports: [InfoRepositoryService, InfoContentService],
})
export class InfoModule {}
