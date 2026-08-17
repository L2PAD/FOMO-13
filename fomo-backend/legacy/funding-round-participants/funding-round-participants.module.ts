import { Module } from "@nestjs/common";
import { ConfigModule } from "@nestjs/config";
import { JwtModule } from "@nestjs/jwt";
import { MongooseModule } from "@nestjs/mongoose";
import { CanonicalProjectsModule } from "src/canonical-projects/canonical-projects.module";
import { FundingRound, FundingRoundSchema } from "src/funding-rounds/models/funding-round.model";
import { Funds, FundsSchema } from "src/funds/funds.model";
import { InvestorCandidatesModule } from "src/investor-candidates/investor-candidates.module";
import { Person, PersonSchema } from "src/persons/person.model";
import { FundingRoundParticipantsController } from "./funding-round-participants.controller";
import {
  FundingRoundParticipant,
  FundingRoundParticipantSchema,
} from "./models/funding-round-participant.model";
import {
  FundingRoundParticipantAuditLog,
  FundingRoundParticipantAuditLogSchema,
} from "./models/funding-round-participant-audit-log.model";
import { FundingRoundParticipantResolverService } from "./services/funding-round-participant-resolver.service";
import { FundingRoundParticipantService } from "./services/funding-round-participant.service";

@Module({
  imports: [
    ConfigModule.forRoot(),
    JwtModule.register({}),
    MongooseModule.forFeature([
      { name: FundingRound.name, schema: FundingRoundSchema },
      { name: Funds.name, schema: FundsSchema },
      { name: Person.name, schema: PersonSchema },
      { name: FundingRoundParticipant.name, schema: FundingRoundParticipantSchema },
      { name: FundingRoundParticipantAuditLog.name, schema: FundingRoundParticipantAuditLogSchema },
    ]),
    CanonicalProjectsModule,
    InvestorCandidatesModule,
  ],
  controllers: [FundingRoundParticipantsController],
  providers: [FundingRoundParticipantResolverService, FundingRoundParticipantService],
  exports: [FundingRoundParticipantResolverService, FundingRoundParticipantService],
})
export class FundingRoundParticipantsModule {}
