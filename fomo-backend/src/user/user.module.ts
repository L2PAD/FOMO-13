import { Module } from "@nestjs/common";
import { ConfigModule } from "@nestjs/config";
import { MongooseModule } from "@nestjs/mongoose";
import { JwtModule } from "@nestjs/jwt/dist/jwt.module";
import { NestjsFormDataModule } from "nestjs-form-data";
import { UserController } from "./user.controller";

import { Action, ActionSchema } from "src/actions/models/action.model";

import { UserSchema, User } from "./user.model";
import { Project, ProjectSchema } from "src/projects/project.model";
import { Board, BoardSchema } from "src/board/models/board.model";
import { Invite, InviteSchema } from "src/invites/models/invite.model";
import { Portfolio, PortfolioSchema } from "src/portfolio/model/portfolio.model";
import { Comment, CommentSchema } from "src/comments/models/comment.model";
import { Ref, RefSchema } from "src/ref/ref.model";
import { Activity, ActivitySchema } from "src/activity/models/activity.model";
import { Deal, DealSchema } from "src/deals/model/deal.model";
import { Appeal, AppealSchema } from "src/deals/model/appeal.model";
import { Withdraw, WithdrawSchema } from "src/withdraws/model/withdraw.model";
import { Deposit, DepositSchema } from "src/deposits/model/deposit.model";
import { Support, SupportSchema } from "src/support/support.model";

import { UserService } from "./user.service";
import { FilesService } from "src/files/files.service";
import { EmailService } from "src/email/email.service";
import { RatingService } from "src/rating/rating.service";
import { InvitesService } from "src/invites/invites.service";
import { AuthService } from "src/auth/auth.service";
import { TwoFactorService } from "src/auth/two-factor/two-factor.service";
import { AuthModule } from "src/auth/auth.module";
import { ProjectTwitter, ProjectTwitterSchema } from "src/twitter/project-twitter.model";
import { SpaceportStakingModule } from "src/spaceport-staking/spaceport-staking.module";
import { SpaceportNftModule } from "src/spaceport-nft/spaceport-nft.module";
import { XpModule } from "src/xp/xp.module";
import { BadgesModule } from "src/badges/badges.module";
import { FomoV2MarketProjectReadModel, FomoV2MarketProjectReadModelSchema } from "src/fomo-v2/models";
import { SpaceportConfig, SpaceportConfigSchema } from "src/spaceport/spaceport.models";

@Module({
  imports: [
    NestjsFormDataModule,
    MongooseModule.forFeature([
      { name: User.name, schema: UserSchema },
      { name: Action.name, schema: ActionSchema },
      { name: Project.name, schema: ProjectSchema },
      { name: Board.name, schema: BoardSchema },
      { name: Invite.name, schema: InviteSchema },
      { name: ProjectTwitter.name, schema: ProjectTwitterSchema },
      { name: Portfolio.name, schema: PortfolioSchema },
      { name: FomoV2MarketProjectReadModel.name, schema: FomoV2MarketProjectReadModelSchema },
      { name: Comment.name, schema: CommentSchema },
      { name: Ref.name, schema: RefSchema },
      { name: Activity.name, schema: ActivitySchema },
      { name: Deal.name, schema: DealSchema },
      { name: Appeal.name, schema: AppealSchema },
      { name: Withdraw.name, schema: WithdrawSchema },
      { name: Deposit.name, schema: DepositSchema },
      { name: Support.name, schema: SupportSchema },
      { name: SpaceportConfig.name, schema: SpaceportConfigSchema },
    ]),
    ConfigModule.forRoot(),
    JwtModule.register({}),
    AuthModule,
    SpaceportStakingModule,
    SpaceportNftModule,
    XpModule,
    BadgesModule,
  ],
  providers: [
    UserService,
    FilesService,
    EmailService,
    RatingService,
    InvitesService,
    TwoFactorService,
  ],
  exports: [UserService],
  controllers: [UserController],
})
export class UserModule {}
