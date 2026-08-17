import { Prop, Schema, SchemaFactory } from "@nestjs/mongoose";
import mongoose, { HydratedDocument } from "mongoose";
import { RatingEntitiesConfig, RatingRuntimeState } from "../rating.types";

export const RATING_CONFIG_DOCUMENT_ID = "global";

export type RatingConfigDocument = HydratedDocument<RatingConfig>;

@Schema({
  collection: "rating_configs",
  timestamps: true,
  strict: true,
  autoIndex: false,
})
export class RatingConfig {
  @Prop({ type: String, default: RATING_CONFIG_DOCUMENT_ID })
  _id: string;

  @Prop({ required: true, default: 1 })
  version: number;

  @Prop({ type: mongoose.Schema.Types.Mixed, required: true })
  entities: RatingEntitiesConfig;

  @Prop({ type: mongoose.Schema.Types.Mixed, required: true })
  runtime: Record<string, RatingRuntimeState>;

  @Prop()
  updatedBy?: string;

  @Prop()
  settingsUpdatedAt?: Date;

  createdAt?: Date;
  updatedAt?: Date;
}

export const RatingConfigSchema = SchemaFactory.createForClass(RatingConfig);
