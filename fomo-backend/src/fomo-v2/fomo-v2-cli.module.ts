import { Module } from "@nestjs/common";
import { ConfigModule } from "@nestjs/config";
import { MongooseModule } from "@nestjs/mongoose";
import { CoinGeckoProClientService } from "src/coingecko/coingecko-pro-client.service";
import { buildMongoUri } from "src/config/mongo.config";
import { FomoV2Module } from "./fomo-v2.module";
import {
  CoinGeckoMarketUniverseDryRunService,
  CoinGeckoMarketUniverseImportService,
  CoinGeckoMarketUniverseRepairService,
  CoinGeckoMarketUniverseReportService,
} from "./services";

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    MongooseModule.forRoot(buildMongoUri(), {
      maxPoolSize: parseInt(process.env.DB_MAX_POOL_SIZE || "10", 10),
      minPoolSize: parseInt(process.env.DB_MIN_POOL_SIZE || "2", 10),
      autoIndex: false,
    }),
    FomoV2Module,
  ],
  providers: [
    CoinGeckoProClientService,
    CoinGeckoMarketUniverseDryRunService,
    CoinGeckoMarketUniverseImportService,
    CoinGeckoMarketUniverseRepairService,
    CoinGeckoMarketUniverseReportService,
  ],
})
export class FomoV2CliModule {}
