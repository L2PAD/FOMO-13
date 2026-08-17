import { Prop, Schema, SchemaFactory } from "@nestjs/mongoose";
import mongoose, { HydratedDocument, Types } from "mongoose";

export const FOMO_V2_REACTION_ENTITY_TYPES = ["canonicalProject", "backer"] as const;
export const FOMO_V2_REACTIONS = ["like", "dislike"] as const;

export type FomoV2ReactionEntityType =
  (typeof FOMO_V2_REACTION_ENTITY_TYPES)[number];
export type FomoV2Reaction = (typeof FOMO_V2_REACTIONS)[number];

export type FomoV2EntityReactionDocument =
  HydratedDocument<FomoV2EntityReaction>;

@Schema({
  collection: "fomo_v2_entity_reactions",
  timestamps: true,
  strict: true,
  autoIndex: false,
})
export class FomoV2EntityReaction {
  _id?: Types.ObjectId;
  createdAt?: Date;
  updatedAt?: Date;

  @Prop({ type: String, required: true, enum: FOMO_V2_REACTION_ENTITY_TYPES })
  entityType: FomoV2ReactionEntityType;

  @Prop({ type: mongoose.Schema.Types.ObjectId, required: true })
  entityId: Types.ObjectId;

  @Prop({ type: mongoose.Schema.Types.ObjectId, ref: "User", required: true })
  userId: Types.ObjectId;

  @Prop({ type: String, required: true, enum: FOMO_V2_REACTIONS })
  reaction: FomoV2Reaction;
}

export const FomoV2EntityReactionSchema =
  SchemaFactory.createForClass(FomoV2EntityReaction);

FomoV2EntityReactionSchema.index(
  { entityType: 1, entityId: 1, userId: 1 },
  { unique: true }
);
FomoV2EntityReactionSchema.index({ entityType: 1, entityId: 1, reaction: 1 });
FomoV2EntityReactionSchema.index({ userId: 1, entityType: 1, updatedAt: -1 });
