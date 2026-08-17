import { Module } from "@nestjs/common";
import { MongooseModule } from "@nestjs/mongoose";
import {
  FomoV2ParserControlConfig,
  FomoV2ParserControlConfigSchema,
  FomoV2ParserGlobalControl,
  FomoV2ParserGlobalControlSchema,
} from "../../models/parser-control.model";
import { FomoV2ParserControlPolicyService } from "./services/parser-control-policy.service";

/** Lightweight write gate that legacy parser modules can import safely. */
@Module({
  imports: [
    MongooseModule.forFeature([
      {
        name: FomoV2ParserGlobalControl.name,
        schema: FomoV2ParserGlobalControlSchema,
      },
      {
        name: FomoV2ParserControlConfig.name,
        schema: FomoV2ParserControlConfigSchema,
      },
    ]),
  ],
  providers: [FomoV2ParserControlPolicyService],
  exports: [FomoV2ParserControlPolicyService],
})
export class FomoV2ParserControlPolicyModule {}
