import { EventsModule } from './events/events.module';
import { NewsModule } from './news/news.module';
import { NewsParserModule } from './news-parser/news-parser.module';
import { NewsAiModule } from './news-ai/news-ai.module';
import { AdminAuditModule } from './admin-audit/admin-audit.module';
import { Module } from "@nestjs/common";
import { ConfigModule } from "@nestjs/config";
import { MongooseModule } from "@nestjs/mongoose";
import { AppController } from "./app.controller";
import { AppService } from "./app.service";
import { ProjectsModule } from "./projects/projects.module";
import { UserModule } from "./user/user.module";
import { AuthModule } from "./auth/auth.module";
import { PersonsModule } from './persons/persons.module';
import { FundsModule } from './funds/funds.module';
import { NftModule } from './nft/nft.module';
import { RatingModule } from './rating/rating.module';
import { RatingCanonicalModule } from './rating/unified/rating-canonical.module';
import { SocialParcingModule } from './social-parcing/social-parcing.module';
import { ScheduleModule } from '@nestjs/schedule';
import { CommentsModule } from './comments/comments.module';
import { TopicsModule } from './topics/topics.module';
import { LayoutModule } from './layout/layout.module';
import { AboutModule } from './about/about.module';
import { ActionsModule } from './actions/actions.module';
import { WatchlistModule } from './watchlist/watchlist.module';
import { SupportModule } from './support/support.module';
import { TrustModule } from './trust/trust.module';
import { TelegramModule } from './telegram/telegram.module';
import { DiscordModule } from './discord/discord.module';
import { RefModule } from './ref/ref.module';
import { TwitterModule } from './twitter/twitter.module';
import { EmailModule } from './email/email.module';
import { FaqModule } from './faq/faq.module';
import { ExcelModule } from './excel/excel.module';
import { BannerModule } from './banner/banner.module';
import { AdvertisingModule } from './advertising/advertising.module';
import { InfoModule } from './info/info.module';
import { TasksModule } from './tasks/tasks.module';
import { LimitsModule } from './limits/limits.module';
import { UtilsModule } from './utils/utils.module';
import { LeaderboardModule } from './leaderboard/leaderboard.module';
import { SearchModule } from './search/search.module';
import { CollectionsModule } from './collections/collections.module';
import { MessageModule } from './message/message.module';
import { CoinmarketcapModule } from './coinmarketcap/coinmarketcap.module';
import { BoardModule } from './board/board.module';
import { NotificationsModule } from './notifications/notifications.module';
import { BadgesModule } from './badges/badges.module';
import { UsermgmtModule } from './usermgmt/usermgmt.module';
import { InvitesModule } from './invites/invites.module';
import { MetadataModule } from './metadata/metadata.module';
import { CollectionNftModule } from './collection-nft/collection-nft.module';
import { CartModule } from './cart/cart.module';
import { OrdersModule } from './orders/orders.module';
import { ChatModule } from './chat/chat.module';
import { ChatGateway } from './chat/chat.gateway';
import { DealsModule } from './deals/deals.module';
import { AssetsModule } from './assets/assets.module';
import { TabsModule } from './tabs/tabs.module';
import { ActivityModule } from './activity/activity.module';
import { DropstabSyncModule } from './dropstab-sync/dropstab-sync.module';
import { AnalyticsModule } from './analytics/analytics.module';
import { ReportsModule } from './reports/reports.module';
import { ExchangesModule } from './exchanges/exchanges.module';
import { CryptoActivitiesModule } from './crypto-activities/activities.module';
import { CategoriesModule } from './categories/categories.module';
import { TradingModule } from './trading/trading.module';
import { ControllerModule } from './controller/controller.module';
import { PortfolioModule } from './portfolio/portfolio.module';
import { DepositsModule } from './deposits/deposits.module';
import { WithdrawsModule } from './withdraws/withdraws.module';
import { SpaceportPurchasesModule } from './spaceport-purchases/spaceport-purchases.module';
import { SpaceportStakingModule } from './spaceport-staking/spaceport-staking.module';
import { SpaceportOpeningsModule } from './spaceport-openings/spaceport-openings.module';
import { SpaceportFusionsModule } from './spaceport-fusions/spaceport-fusions.module';
import { SpaceportNftModule } from './spaceport-nft/spaceport-nft.module';
import { ThrottlerGuard, ThrottlerModule } from '@nestjs/throttler';
import { APP_GUARD } from '@nestjs/core';
import { BullModule } from '@nestjs/bull';
import { getBullModuleOptions } from './config/bull.config';
import { isCronEnabled } from './config/cron.config';
import { buildMongoUri } from './config/mongo.config';
import { InvestorsModule } from './investors/investors.module';
import { CoinGeckoModule } from './coingecko/coingecko.module';
import { CryptoLinkingModule } from './crypto-linking/crypto-linking.module';
import { AppCacheModule } from './common/cache/cache.module';
import { FomoV2Module } from './fomo-v2/fomo-v2.module';
import { EntitlementsModule } from './entitlements/entitlements.module';
import { BootstrapModule } from './bootstrap/bootstrap.module';
import { MoneyModule } from './money/money.module';
import { FomoV2UnlockReminderModule } from './fomo-v2/domains/unlocks/unlock-reminder.module';
import { isFomoV2UnlockReminderWorkerEnabled } from './fomo-v2/domains/unlocks/unlock-reminder.config';
import { UserActionLogsModule } from './user-action-logs/user-action-logs.module';
import { AdminAiChatModule } from './admin-ai-chat/admin-ai-chat.module';
import { AdminDataSyncModule } from './admin-data-sync/admin-data-sync.module';
import { XpModule } from './xp/xp.module';
import { SpaceportModule } from './spaceport/spaceport.module';
import { SpaceportControlModule } from './spaceport-control/spaceport-control.module';
import { PlatformAnalyticsModule } from './platform-analytics/platform-analytics.module';

function parseThrottleTtlMs(value: string | undefined, fallbackMs: number): number {
  const parsed = Number(value);
  if (!Number.isFinite(parsed) || parsed <= 0) return fallbackMs;
  return parsed < 1000 ? parsed * 1000 : parsed;
}

function parseThrottleLimit(value: string | undefined, fallback: number): number {
  const parsed = Number(value);
  if (!Number.isFinite(parsed) || parsed <= 0) return fallback;
  return Math.trunc(parsed);
}

@Module({
  imports: [
    ConfigModule.forRoot(),
    AppCacheModule,
    BullModule.forRoot(getBullModuleOptions()),
    ThrottlerModule.forRoot({
      throttlers: [
        {
          ttl: parseThrottleTtlMs(process.env.THROTTLE_TTL, 60_000),
          limit: parseThrottleLimit(process.env.THROTTLE_LIMIT, 500),
        },
      ],
    }),
    MongooseModule.forRoot(buildMongoUri(),
      {
        maxPoolSize: parseInt(process.env.DB_MAX_POOL_SIZE || '10'),
        minPoolSize: parseInt(process.env.DB_MIN_POOL_SIZE || '2'),
        autoIndex: process.env.DB_AUTO_INDEX === 'true',
      }
    ),
    RatingCanonicalModule,
    XpModule,
    PlatformAnalyticsModule,
    UserActionLogsModule, AdminAiChatModule, AdminDataSyncModule, UserModule, EventsModule,
    NewsModule, NewsParserModule, NewsAiModule, AdminAuditModule, AuthModule,
    PersonsModule, FundsModule,
    NftModule, RatingModule,
    CommentsModule, TopicsModule, LayoutModule,
    AboutModule, ActionsModule, TrustModule,
    WatchlistModule, SupportModule,
    TelegramModule, ProjectsModule,
    DiscordModule, RefModule,
    TwitterModule, EmailModule,
    FaqModule, ExcelModule,
    SocialParcingModule, BannerModule, AdvertisingModule,
    InfoModule, TasksModule,
    ...(isCronEnabled() ? [ScheduleModule.forRoot()] : []), LimitsModule,
    UtilsModule, LeaderboardModule,
    SearchModule, CollectionsModule,
    MessageModule, CoinmarketcapModule,
    BoardModule, NotificationsModule, BadgesModule,
    UsermgmtModule,
    InvitesModule, MetadataModule,
    CollectionNftModule, CartModule,
    OrdersModule, DealsModule, ChatModule, AssetsModule, TabsModule, ActivityModule, DropstabSyncModule, AnalyticsModule, ReportsModule, ExchangesModule, CryptoActivitiesModule, CategoriesModule, TradingModule, ControllerModule, PortfolioModule, DepositsModule, WithdrawsModule, SpaceportPurchasesModule, SpaceportStakingModule, SpaceportOpeningsModule, SpaceportFusionsModule, SpaceportNftModule, SpaceportModule, SpaceportControlModule, InvestorsModule, CoinGeckoModule, CryptoLinkingModule, FomoV2Module, EntitlementsModule, BootstrapModule, MoneyModule,
    ...(isFomoV2UnlockReminderWorkerEnabled() ? [FomoV2UnlockReminderModule] : []),
  ],
  controllers: [AppController],
  providers: [AppService, {
    provide: APP_GUARD,
    useClass: ThrottlerGuard,
  },],
})
export class AppModule { }
