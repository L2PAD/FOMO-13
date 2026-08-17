import { Module } from "@nestjs/common";
import { ConfigModule } from "@nestjs/config";
import { MongooseModule } from "@nestjs/mongoose";
import { buildMongoUri } from "src/config/mongo.config";
import { FundingRoundParticipantsModule } from "./funding-round-participants.module";

@Module({
  imports: [
    ConfigModule.forRoot(),
    MongooseModule.forRoot(buildMongoUri(), {
      maxPoolSize: parseInt(process.env.DB_MAX_POOL_SIZE || "10"),
      minPoolSize: parseInt(process.env.DB_MIN_POOL_SIZE || "2"),
      autoIndex: process.env.DB_AUTO_INDEX === "true",
    }),
    FundingRoundParticipantsModule,
  ],
})
export class FundingRoundParticipantsCliModule {}
