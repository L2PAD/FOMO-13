import { Module } from "@nestjs/common";
import { ConfigModule } from "@nestjs/config";
import { JwtModule } from "@nestjs/jwt";
import { MongooseModule } from "@nestjs/mongoose";
import { CryptoLinkingModule } from "src/crypto-linking/crypto-linking.module";
import { Project, ProjectSchema } from "src/projects/project.model";
import { FundingRound, FundingRoundSchema } from "src/funding-rounds/models/funding-round.model";
import { TokenUnlock, TokenUnlockSchema } from "src/token-unlocks/models/token-unlock.model";
import { ProjectChartHistory, ProjectChartHistorySchema } from "src/projects/project-chart-history.model";
import {
  ProjectComparisonSnapshot,
  ProjectComparisonSnapshotSchema,
} from "src/projects/project-comparison-snapshot.model";
import { CryptoActivity, CryptoActivitySchema } from "src/crypto-activities/models/crypto-activity.model";
import {
  ProjectExchangeTickerCache,
  ProjectExchangeTickerCacheSchema,
} from "src/projects/project-exchange-ticker-cache.model";
import { ProjectIntel, ProjectIntelSchema } from "src/projects/intel-sync/models/project-intel.model";
import { ProjectUnlocks, ProjectUnlocksSchema } from "src/projects/intel-sync/models/project-unlocks.model";
import { ProjectSourceMap, ProjectSourceMapSchema } from "src/projects/intel-sync/models/project-source-map.model";
import { ProjectCandidatesModule } from "src/project-candidates/project-candidates.module";
import { CanonicalProject, CanonicalProjectSchema } from "./models/canonical-project.model";
import {
  CanonicalProjectLink,
  CanonicalProjectLinkSchema,
} from "./models/canonical-project-link.model";
import {
  CanonicalProjectLinkAuditLog,
  CanonicalProjectLinkAuditLogSchema,
} from "./models/canonical-project-link-audit-log.model";
import { CanonicalProjectsController } from "./canonical-projects.controller";
import { CanonicalProjectService } from "./services/canonical-project.service";
import { CanonicalProjectLinkService } from "./services/canonical-project-link.service";
import { CanonicalProjectResolverAdapter } from "./services/canonical-project-resolver.adapter";
import { CanonicalProjectBackfillService } from "./services/canonical-project-backfill.service";

@Module({
  imports: [
    ConfigModule.forRoot(),
    JwtModule.register({}),
    MongooseModule.forFeature([
      { name: CanonicalProject.name, schema: CanonicalProjectSchema },
      { name: CanonicalProjectLink.name, schema: CanonicalProjectLinkSchema },
      { name: CanonicalProjectLinkAuditLog.name, schema: CanonicalProjectLinkAuditLogSchema },
      { name: Project.name, schema: ProjectSchema },
      { name: FundingRound.name, schema: FundingRoundSchema },
      { name: TokenUnlock.name, schema: TokenUnlockSchema },
      { name: ProjectChartHistory.name, schema: ProjectChartHistorySchema },
      { name: ProjectComparisonSnapshot.name, schema: ProjectComparisonSnapshotSchema },
      { name: CryptoActivity.name, schema: CryptoActivitySchema },
      { name: ProjectExchangeTickerCache.name, schema: ProjectExchangeTickerCacheSchema },
      { name: ProjectIntel.name, schema: ProjectIntelSchema },
      { name: ProjectUnlocks.name, schema: ProjectUnlocksSchema },
      { name: ProjectSourceMap.name, schema: ProjectSourceMapSchema },
    ]),
    CryptoLinkingModule,
    ProjectCandidatesModule,
  ],
  controllers: [CanonicalProjectsController],
  providers: [
    CanonicalProjectService,
    CanonicalProjectLinkService,
    CanonicalProjectResolverAdapter,
    CanonicalProjectBackfillService,
  ],
  exports: [
    CanonicalProjectService,
    CanonicalProjectLinkService,
    CanonicalProjectResolverAdapter,
    CanonicalProjectBackfillService,
  ],
})
export class CanonicalProjectsModule {}
