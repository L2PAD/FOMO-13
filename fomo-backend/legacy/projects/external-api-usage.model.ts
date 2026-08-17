import { Prop, Schema, SchemaFactory } from "@nestjs/mongoose";
import { HydratedDocument } from "mongoose";

export type ExternalApiUsageDocument = HydratedDocument<ExternalApiUsage>;

@Schema({ collection: "external_api_usage", timestamps: true })
export class ExternalApiUsage {
  @Prop({ required: true })
  date: string;

  @Prop({ required: true })
  provider: string;

  @Prop({ required: true })
  endpoint: string;

  @Prop({ default: 0 })
  count: number;

  @Prop()
  lastUsedAt?: Date;
}

export const ExternalApiUsageSchema = SchemaFactory.createForClass(ExternalApiUsage);

ExternalApiUsageSchema.index({ date: 1, provider: 1, endpoint: 1 }, { unique: true });
