import { Module } from "@nestjs/common";
import { ConfigModule, ConfigService } from "@nestjs/config";
import { MongooseModule } from "@nestjs/mongoose";
import { buildMongoUri } from "src/config/mongo.config";
import { RatingModule } from "src/rating/rating.module";
import { InvestorsModule } from "./investors.module";

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    MongooseModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: async (configService: ConfigService) => {
        return {
          uri: buildMongoUri({
            DB_URL: configService.get<string>("DB_URL"),
            DB_NAME: configService.get<string>("DB_NAME"),
          } as NodeJS.ProcessEnv),
          maxPoolSize: parseInt(
            configService.get<string>("DB_MAX_POOL_SIZE") || "10",
            10
          ),
          minPoolSize: parseInt(
            configService.get<string>("DB_MIN_POOL_SIZE") || "2",
            10
          ),
          autoIndex: configService.get<string>("DB_AUTO_INDEX") === "true",
        };
      },
      inject: [ConfigService],
    }),
    RatingModule,
    InvestorsModule,
  ],
})
export class DropstabInvestorsCliModule {}
