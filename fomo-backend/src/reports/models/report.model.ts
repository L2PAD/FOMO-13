import { Prop, Schema, SchemaFactory } from "@nestjs/mongoose";
import mongoose, { HydratedDocument } from "mongoose";

export type ReportTypes = 'impersonality' | 'inappropriateBehavior' | 'underageAccount'
export type ReportSubTypes = 'me' | 'publicFigure' | 'someoneIknow'

export type ReportDocument = HydratedDocument<Report>;

@Schema({ timestamps: true })
export class Report {
  @Prop()
  creatorId: mongoose.Types.ObjectId;

  @Prop()
  userId: mongoose.Types.ObjectId;

  @Prop({default:'impersonality'})
  type:ReportTypes

  @Prop()
  subType:ReportSubTypes

  @Prop({ default: "" })
  body: string;

  @Prop()
  attachment: string;
}

export const ReportSchema = SchemaFactory.createForClass(Report);
