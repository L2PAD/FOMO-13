import { Prop, Schema, SchemaFactory } from "@nestjs/mongoose";
import { HydratedDocument } from "mongoose";

export type TopicDocument = HydratedDocument<Topic>;
export type TopicStatus = "ACTIVE" | "HIDDEN" | "ARCHIVED";

@Schema({ timestamps: true, collection: "topics" })
export class Topic {
  @Prop({ required: true, unique: true, trim: true, lowercase: true, maxlength: 64 })
  slug: string;

  @Prop({ required: true, trim: true, maxlength: 120 })
  name: string;

  @Prop({ trim: true, maxlength: 500 })
  description?: string;

  @Prop({ trim: true, maxlength: 64 })
  icon?: string;

  @Prop({ trim: true, maxlength: 32, default: "gray" })
  colorKey?: string;

  @Prop({ enum: ["ACTIVE", "HIDDEN", "ARCHIVED"], default: "ACTIVE", index: true })
  status: TopicStatus;

  @Prop({ default: 0 })
  sortOrder: number;

  @Prop({ default: 0 })
  followersCount: number;
}

export const TopicSchema = SchemaFactory.createForClass(Topic);
