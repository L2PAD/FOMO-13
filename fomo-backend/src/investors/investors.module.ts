import { Module } from "@nestjs/common";
import { ConfigModule } from "@nestjs/config";
import { JwtModule } from "@nestjs/jwt";
import { MongooseModule } from "@nestjs/mongoose";
import { CryptoLinkingModule } from "src/crypto-linking/crypto-linking.module";
import { FomoV2PersistenceModule } from "src/fomo-v2/persistence";
import { FomoV2ParserControlPolicyModule } from "src/fomo-v2/domains/parser-control";
import { Funds, FundsSchema } from "src/funds/funds.model";
import { FundsRatingService } from "src/funds/funds-rating.service";
import { Person, PersonSchema } from "src/persons/person.model";
import { PersonsRatingService } from "src/persons/persons-rating.service";
import { Project, ProjectSchema } from "src/projects/project.model";
import { DropstabInvestorsSyncService } from "./dropstab-investors-sync.service";
import { Investor, InvestorSchema } from "./investor.model";
import { InvestorsController } from "./investors.controller";
import { InvestorsService } from "./investors.service";
import {
  PersonsAnalyticsSnapshot,
  PersonsAnalyticsSnapshotSchema,
} from "./persons-analytics-snapshot.model";
import { PersonsAnalyticsSnapshotService } from "./persons-analytics-snapshot.service";
import { InternalSyncGuard } from "src/common/guards/internal-sync.guard";
import { IntelSyncModule } from "src/intel-sync/intel-sync.module";

@Module({
  imports: [
    ConfigModule,
    CryptoLinkingModule,
    IntelSyncModule,
    JwtModule.register({}),
    MongooseModule.forFeature([
      { name: Investor.name, schema: InvestorSchema },
      { name: Funds.name, schema: FundsSchema },
      { name: Person.name, schema: PersonSchema },
      { name: Project.name, schema: ProjectSchema },
      {
        name: PersonsAnalyticsSnapshot.name,
        schema: PersonsAnalyticsSnapshotSchema,
      },
    ]),
    FomoV2PersistenceModule,
    FomoV2ParserControlPolicyModule,
  ],
  controllers: [InvestorsController],
  providers: [
    InvestorsService,
    PersonsAnalyticsSnapshotService,
    DropstabInvestorsSyncService,
    FundsRatingService,
    PersonsRatingService,
    InternalSyncGuard,
  ],
  exports: [
    InvestorsService,
    DropstabInvestorsSyncService,
    PersonsAnalyticsSnapshotService,
  ],
})
export class InvestorsModule {}
