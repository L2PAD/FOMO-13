import { Prop, Schema, SchemaFactory } from "@nestjs/mongoose";
import mongoose, { HydratedDocument } from "mongoose";
import { ProjectSource } from "./project-source-map.model";

export type PendingProjectMatchStatus = "pending" | "approved" | "rejected" | "ignored";
export type PendingProjectMatchDocument = HydratedDocument<PendingProjectMatch>;

const PENDING_PROJECT_MATCH_SOURCES = ["icodrops", "dropstab"] as const;
const PENDING_PROJECT_MATCH_STATUSES = ["pending", "approved", "rejected", "ignored"] as const;

@Schema({ collection: "pending_project_matches", timestamps: true, strict: false })
export class PendingProjectMatch {
  @Prop({ type: String, enum: PENDING_PROJECT_MATCH_SOURCES, required: true, index: true })
  source: Extract<ProjectSource, "icodrops" | "dropstab">;

  @Prop({ index: true })
  sourceSlug?: string;

  @Prop({ index: true })
  sourceId?: string;

  @Prop()
  sourceName?: string;

  @Prop()
  sourceSymbol?: string;

  @Prop()
  sourceUrl?: string;

  @Prop({ type: mongoose.Schema.Types.ObjectId, ref: "Project", index: true })
  candidateProjectId?: mongoose.Types.ObjectId;

  @Prop()
  candidateName?: string;

  @Prop()
  candidateSymbol?: string;

  @Prop()
  candidateSlug?: string;

  @Prop({ required: true, min: 0, max: 100 })
  confidence: number;

  @Prop({ type: [String], default: [] })
  reasons: string[];

  @Prop({ type: String, enum: PENDING_PROJECT_MATCH_STATUSES, required: true, default: "pending", index: true })
  status: PendingProjectMatchStatus;
}

export const PendingProjectMatchSchema = SchemaFactory.createForClass(PendingProjectMatch);

PendingProjectMatchSchema.index({ source: 1, sourceSlug: 1, status: 1 });
PendingProjectMatchSchema.index({ source: 1, sourceId: 1, status: 1 });
PendingProjectMatchSchema.index({ status: 1, confidence: -1 });
