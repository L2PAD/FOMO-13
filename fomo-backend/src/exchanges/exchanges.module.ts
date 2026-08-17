import { Module } from "@nestjs/common";
import { ExchangesController } from "./exchanges.controller";
import { ExchangesService } from "./exchanges.service";
import { MongooseModule } from "@nestjs/mongoose";
import { HttpModule } from "@nestjs/axios";
import { JwtModule } from "@nestjs/jwt";
import { ConfigModule } from "@nestjs/config";
import { Exchange, ExchangeSchema } from "./models/exchange.model";

@Module({
  imports: [
    HttpModule,
    JwtModule,
    ConfigModule.forRoot(),
    MongooseModule.forFeature([
      { name: Exchange.name, schema: ExchangeSchema },
    ]),
  ],
  controllers: [ExchangesController],
  providers: [ExchangesService],
  exports:[ExchangesService]
})
export class ExchangesModule {}
