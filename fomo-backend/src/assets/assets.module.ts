import { Module } from "@nestjs/common";
import { AssetsController } from "./assets.controller";
import { AssetsService } from "./assets.service";
import { HttpModule } from "@nestjs/axios";
import { JwtModule } from "@nestjs/jwt";
import { ConfigModule } from "@nestjs/config";
import { MongooseModule } from "@nestjs/mongoose";
import { Asset, AssetSchema } from "./models/asset.model";
import { FilesService } from "src/files/files.service";
import { User, UserSchema } from "src/user/user.model";
import { UserModule } from "src/user/user.module";
import { FomoV2Module } from "src/fomo-v2/fomo-v2.module";

@Module({
  imports: [
    HttpModule,
    JwtModule.register({}),
    ConfigModule.forRoot(),
    UserModule,
    FomoV2Module,
    MongooseModule.forFeature([
      { name: Asset.name, schema: AssetSchema },
    ]),
  ],
  controllers: [AssetsController],
  providers: [AssetsService,FilesService],
})
export class AssetsModule {}
