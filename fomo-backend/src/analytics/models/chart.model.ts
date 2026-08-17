import { Prop, Schema, SchemaFactory } from "@nestjs/mongoose";
import mongoose, { HydratedDocument, Mongoose, Types } from "mongoose";

export type EntityTypes = "project" | "fund" | "person" | "user" | 'category' | 'funding-dynamics';

export type ChartTypes =
  | "chart24h"
  | "chart7d"
  | "chart30d"
  | "chart90d"
  | "chart1y"
  | "chartAll";

export type ChartDocument = HydratedDocument<Chart>;

@Schema()
export class Chart {
  @Prop({ required: true })
  entityId: mongoose.Types.ObjectId;

  @Prop({ default: "project" })
  entityType: EntityTypes;

  @Prop({ default: new Date() })
  createdAt: Date;

  @Prop({ type: Array, default: [] })
  chart24h: Array<any>;

  @Prop({ type: Array, default: [] })
  chart7d: Array<any>;

  @Prop({ type: Array, default: [] })
  chart30d: Array<any>;

  @Prop({ type: Array, default: [] })
  chart90d: Array<any>;

  @Prop({ type: Array, default: [] })
  chart1y: Array<any>;

  @Prop({ type: Array, default: [] })
  chartAll: Array<any>;
}

export const ChartSchema = SchemaFactory.createForClass(Chart);

ChartSchema.index({ entityId: 1, entityType: 1 }, { unique: true });
