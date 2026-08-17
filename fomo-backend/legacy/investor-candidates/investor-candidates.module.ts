import { Module } from "@nestjs/common";
import { ConfigModule } from "@nestjs/config";
import { JwtModule } from "@nestjs/jwt";
import { MongooseModule } from "@nestjs/mongoose";
import { InvestorCandidate, InvestorCandidateSchema } from "./models/investor-candidate.model";
import { InvestorCandidatesController } from "./investor-candidates.controller";
import { InvestorCandidateService } from "./investor-candidates.service";

@Module({
  imports: [
    ConfigModule.forRoot(),
    JwtModule.register({}),
    MongooseModule.forFeature([{ name: InvestorCandidate.name, schema: InvestorCandidateSchema }]),
  ],
  controllers: [InvestorCandidatesController],
  providers: [InvestorCandidateService],
  exports: [InvestorCandidateService],
})
export class InvestorCandidatesModule {}
