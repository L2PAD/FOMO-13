import { Module } from "@nestjs/common";
import { MongooseModule } from "@nestjs/mongoose";
import { JwtModule } from "@nestjs/jwt";
import { ConfigModule } from "@nestjs/config";
import { XpRank, XpRankSchema } from "./xp-rank.model";
import { XpTransaction, XpTransactionSchema } from "./xp-transaction.model";
import { XpRule, XpRuleSchema } from "./xp-rule.model";
import { User, UserSchema } from "src/user/user.model";
import { RankResolverService } from "./rank-resolver.service";
import { XpLedgerService } from "./xp-ledger.service";
import { XpController } from "./xp.controller";
import { BadgesModule } from "../badges/badges.module";

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: XpRank.name, schema: XpRankSchema },
      { name: XpTransaction.name, schema: XpTransactionSchema },
      { name: XpRule.name, schema: XpRuleSchema },
      { name: User.name, schema: UserSchema },
    ]),
    JwtModule.register({}),
    ConfigModule.forRoot(),
    BadgesModule,
  ],
  controllers: [XpController],
  providers: [RankResolverService, XpLedgerService],
  exports: [RankResolverService, XpLedgerService],
})
export class XpModule {}
