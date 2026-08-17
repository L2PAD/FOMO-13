import { Module } from '@nestjs/common';
import { FundingRoundsController } from './funding-rounds.controller';
import { FundingRoundsService } from './funding-rounds.service';
import { HttpModule } from '@nestjs/axios';
import { JwtModule } from '@nestjs/jwt';
import { ConfigModule } from '@nestjs/config';
import { MongooseModule } from '@nestjs/mongoose';
import { FundingRound, FundingRoundSchema } from './models/funding-round.model';
import { Funds, FundsSchema } from 'src/funds/funds.model';
import { Person, PersonSchema } from 'src/persons/person.model';
import { Project, ProjectSchema } from 'src/projects/project.model';
import { FundingRoundsIntelSyncService } from './funding-rounds-intel-sync.service';
import { IntelSyncModule } from 'src/intel-sync/intel-sync.module';
import { CryptoLinkingModule } from 'src/crypto-linking/crypto-linking.module';
import { ProjectIntelInternalSyncGuard } from 'src/projects/intel-sync/project-intel-internal-sync.guard';

@Module({
  imports: [
    HttpModule,
    JwtModule.register({}),
    ConfigModule,
    MongooseModule.forFeature([
      { name: FundingRound.name, schema: FundingRoundSchema },
      { name: Funds.name, schema: FundsSchema },
      { name: Person.name, schema: PersonSchema },
      { name: Project.name, schema: ProjectSchema },
    ]),
    IntelSyncModule,
    CryptoLinkingModule,
  ],
  controllers: [FundingRoundsController],
  providers: [FundingRoundsService, FundingRoundsIntelSyncService, ProjectIntelInternalSyncGuard],
  exports: [FundingRoundsService],
})
export class FundingRoundsModule {}
