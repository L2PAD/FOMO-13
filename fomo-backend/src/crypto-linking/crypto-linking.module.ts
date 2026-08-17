import { Module } from "@nestjs/common";
import { ConfigModule } from "@nestjs/config";
import { JwtModule } from "@nestjs/jwt";
import { MongooseModule } from "@nestjs/mongoose";
import { CryptoLinkingController } from "./crypto-linking.controller";
import { CryptoLinkingPublicController } from "./crypto-linking-public.controller";
import { CryptoLinkingDiagnosticsService } from "./crypto-linking-diagnostics.service";
import { CryptoLinkingAuditLog, CryptoLinkingAuditLogSchema } from "./models/crypto-linking-audit-log.model";
import { CryptoEntityLinkerService } from "./services/crypto-entity-linker.service";
import { CryptoLinkingGraphService } from "./services/crypto-linking-graph.service";
import { CryptoLinkingPublicService } from "./services/crypto-linking-public.service";
import { CryptoLinkingProgressService } from "./services/crypto-linking-progress.service";
import { InvestorResolverService } from "./services/investor-resolver.service";
import { ProjectResolverService } from "./services/project-resolver.service";
import { Funds, FundsSchema } from "src/funds/funds.model";
import { Person, PersonSchema } from "src/persons/person.model";
import { Project, ProjectSchema } from "src/projects/project.model";
import { ProjectSourceMap, ProjectSourceMapSchema } from "src/projects/intel-sync/models/project-source-map.model";

@Module({
  imports: [
    ConfigModule.forRoot(),
    JwtModule.register({}),
    MongooseModule.forFeature([
      { name: Project.name, schema: ProjectSchema },
      { name: Funds.name, schema: FundsSchema },
      { name: Person.name, schema: PersonSchema },
      { name: ProjectSourceMap.name, schema: ProjectSourceMapSchema },
      { name: CryptoLinkingAuditLog.name, schema: CryptoLinkingAuditLogSchema },
    ]),
  ],
  controllers: [CryptoLinkingController, CryptoLinkingPublicController],
  providers: [
    CryptoLinkingDiagnosticsService,
    ProjectResolverService,
    InvestorResolverService,
    CryptoEntityLinkerService,
    CryptoLinkingGraphService,
    CryptoLinkingPublicService,
    CryptoLinkingProgressService,
  ],
  exports: [ProjectResolverService, InvestorResolverService, CryptoLinkingPublicService],
})
export class CryptoLinkingModule {}
