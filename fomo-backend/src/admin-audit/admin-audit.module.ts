import { Module } from "@nestjs/common";
import { MongooseModule } from "@nestjs/mongoose";
import { JwtModule } from "@nestjs/jwt";
import { ConfigModule, ConfigService } from "@nestjs/config";
import { AdminAuditEvent, AdminAuditEventSchema } from "./admin-audit.model";
import { AdminAuditService } from "./admin-audit.service";
import { AdminAuditController } from "./admin-audit.controller";

@Module({
  imports: [
    JwtModule.register({}),
    ConfigModule,
    MongooseModule.forFeature([
      { name: AdminAuditEvent.name, schema: AdminAuditEventSchema },
    ]),
  ],
  controllers: [AdminAuditController],
  providers: [AdminAuditService, ConfigService],
  exports: [AdminAuditService],
})
export class AdminAuditModule {}
