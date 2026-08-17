import { Module } from "@nestjs/common";
import { MongooseModule } from "@nestjs/mongoose";
import { FOMO_V2_PRIMARY_REGISTRATION_MODEL_DEFINITIONS } from "./fomo-v2-model.registry";

/**
 * Lightweight primary-connection model boundary for feature modules that need
 * FOMO v2 persistence without importing controllers, jobs, or ingestion logic.
 */
@Module({
  imports: [
    MongooseModule.forFeature([
      ...FOMO_V2_PRIMARY_REGISTRATION_MODEL_DEFINITIONS,
    ]),
  ],
  exports: [MongooseModule],
})
export class FomoV2PersistenceModule {}
