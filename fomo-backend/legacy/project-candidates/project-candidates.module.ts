import { Module } from "@nestjs/common";
import { ConfigModule } from "@nestjs/config";
import { JwtModule } from "@nestjs/jwt";
import { MongooseModule } from "@nestjs/mongoose";
import { ProjectCandidate, ProjectCandidateSchema } from "./models/project-candidate.model";
import { ProjectCandidatesController } from "./project-candidates.controller";
import { ProjectCandidateService } from "./project-candidates.service";

@Module({
  imports: [
    ConfigModule.forRoot(),
    JwtModule.register({}),
    MongooseModule.forFeature([{ name: ProjectCandidate.name, schema: ProjectCandidateSchema }]),
  ],
  controllers: [ProjectCandidatesController],
  providers: [ProjectCandidateService],
  exports: [ProjectCandidateService],
})
export class ProjectCandidatesModule {}
