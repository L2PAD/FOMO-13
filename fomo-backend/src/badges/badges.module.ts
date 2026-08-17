import { Module } from "@nestjs/common";
import { MongooseModule } from "@nestjs/mongoose";
import { JwtModule } from "@nestjs/jwt";
import { ConfigModule } from "@nestjs/config";
import { BadgesController } from "./badges.controller";
import { BadgesService } from "./badges.service";
import { BadgeMetricResolver } from "./metrics/badge-metric-resolver";
import { BadgeDefinition, BadgeDefinitionSchema } from "./models/badge-definition.model";
import { UserBadge, UserBadgeSchema } from "./models/user-badge.model";
import { BadgeAuditLog, BadgeAuditLogSchema } from "./models/badge-audit-log.model";
import { User, UserSchema } from "../user/user.model";

@Module({
  imports: [
    JwtModule.register({}),
    ConfigModule.forRoot(),
    MongooseModule.forFeature([
      { name: BadgeDefinition.name, schema: BadgeDefinitionSchema },
      { name: UserBadge.name, schema: UserBadgeSchema },
      { name: BadgeAuditLog.name, schema: BadgeAuditLogSchema },
      { name: User.name, schema: UserSchema },
    ]),
  ],
  controllers: [BadgesController],
  providers: [BadgesService, BadgeMetricResolver],
  exports: [BadgesService],
})
export class BadgesModule {}
