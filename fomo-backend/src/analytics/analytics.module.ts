import { Module } from "@nestjs/common";
import { AnalyticsController } from "./analytics.controller";
import { AnalyticsService } from "./analytics.service";
import { HttpModule } from "@nestjs/axios";
import { JwtModule } from "@nestjs/jwt";
import { ConfigModule } from "@nestjs/config";
import { MongooseModule } from "@nestjs/mongoose";
import { User, UserSchema } from "src/user/user.model";
import { Action, ActionSchema } from "src/actions/models/action.model";
import { Project, ProjectSchema } from "src/projects/project.model";
import { News, NewsSchema } from "src/news/models/news.model";
import { Event, EventSchema } from "src/events/models/event.model";
import { Funds, FundsSchema } from "src/funds/funds.model";
import { Person, PersonSchema } from "src/persons/person.model";
import { Nft, NftSchema } from "src/nft/nft.model";
import { Comment, CommentSchema } from "src/comments/models/comment.model";
import {
  Notification,
  NotificationSchema,
} from "src/notifications/model/notification.model";
import { Deal, DealSchema } from "src/deals/model/deal.model";
import { Ref, RefSchema } from "src/ref/ref.model";
import { Chart, ChartSchema } from "./models/chart.model";
import { FomoV2PersistenceModule } from "src/fomo-v2/persistence";
import { ProjectChartHistory, ProjectChartHistorySchema } from "src/projects/project-chart-history.model";
import { ChartImageRendererService } from "./chart-image-renderer.service";

@Module({
  imports: [
    HttpModule,
    JwtModule.register({}),
    ConfigModule.forRoot(),
    MongooseModule.forFeature([
      { name: User.name, schema: UserSchema },
      { name: Action.name, schema: ActionSchema },
      { name: Project.name, schema: ProjectSchema },
      { name: News.name, schema: NewsSchema },
      { name: Event.name, schema: EventSchema },
      { name: Funds.name, schema: FundsSchema },
      { name: Person.name, schema: PersonSchema },
      { name: Nft.name, schema: NftSchema },
      { name: Comment.name, schema: CommentSchema },
      { name: Notification.name, schema: NotificationSchema },
      { name: Deal.name, schema: DealSchema },
      { name: Ref.name, schema: RefSchema },
      { name: Chart.name, schema: ChartSchema },
      { name: ProjectChartHistory.name, schema: ProjectChartHistorySchema },
    ]),
    FomoV2PersistenceModule,
  ],
  controllers: [AnalyticsController],
  providers: [AnalyticsService, ChartImageRendererService],
  exports: [AnalyticsService, ChartImageRendererService]
})
export class AnalyticsModule { }
