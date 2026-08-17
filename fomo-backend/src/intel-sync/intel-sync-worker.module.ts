import { Module } from "@nestjs/common";
import { ConfigModule } from "@nestjs/config";
import { MongooseModule } from "@nestjs/mongoose";
import { buildMongoUri } from "src/config/mongo.config";
import { CryptoLinkingModule } from "src/crypto-linking/crypto-linking.module";
import { CryptoActivitiesSyncLock, CryptoActivitiesSyncLockSchema } from "src/crypto-activities/models/crypto-activities-sync-lock.model";
import { CryptoActivitiesSyncRun, CryptoActivitiesSyncRunSchema } from "src/crypto-activities/models/crypto-activities-sync-run.model";
import { CryptoActivity, CryptoActivitySchema } from "src/crypto-activities/models/crypto-activity.model";
import { CryptoActivitiesSyncService } from "src/crypto-activities/services/crypto-activities-sync.service";
import { Funds, FundsSchema } from "src/funds/funds.model";
import { FundsIntelInvestorsSyncService } from "src/funds/funds-intel-investors-sync.service";
import { FundsRatingService } from "src/funds/funds-rating.service";
import { DropstabInvestorsSyncService } from "src/investors/dropstab-investors-sync.service";
import { Investor, InvestorSchema } from "src/investors/investor.model";
import { Person, PersonSchema } from "src/persons/person.model";
import { PersonsRatingService } from "src/persons/persons-rating.service";
import { Project, ProjectSchema } from "src/projects/project.model";
import { RatingModule } from "src/rating/rating.module";
import { IntelSyncModule } from "./intel-sync.module";
import { FomoV2ParserControlPolicyModule } from "src/fomo-v2/domains/parser-control";

@Module({
  imports: [
    ConfigModule.forRoot(),
    IntelSyncModule,
    CryptoLinkingModule,
    RatingModule,
    FomoV2ParserControlPolicyModule,
    MongooseModule.forRoot(buildMongoUri(), {
      maxPoolSize: parseInt(process.env.DB_MAX_POOL_SIZE || "10"),
      minPoolSize: parseInt(process.env.DB_MIN_POOL_SIZE || "2"),
      autoIndex: process.env.DB_AUTO_INDEX === "true",
    }),
    MongooseModule.forFeature([
      { name: Funds.name, schema: FundsSchema },
      { name: Person.name, schema: PersonSchema },
      { name: Project.name, schema: ProjectSchema },
      { name: Investor.name, schema: InvestorSchema },
      { name: CryptoActivity.name, schema: CryptoActivitySchema },
      { name: CryptoActivitiesSyncRun.name, schema: CryptoActivitiesSyncRunSchema },
      { name: CryptoActivitiesSyncLock.name, schema: CryptoActivitiesSyncLockSchema },
    ]),
  ],
  providers: [
    FundsIntelInvestorsSyncService,
    DropstabInvestorsSyncService,
    FundsRatingService,
    PersonsRatingService,
    CryptoActivitiesSyncService,
  ],
})
export class IntelSyncWorkerModule {}
