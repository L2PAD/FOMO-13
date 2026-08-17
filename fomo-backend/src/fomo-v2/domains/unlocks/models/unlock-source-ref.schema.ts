import mongoose from "mongoose";
import { FOMO_V2_CONFIDENCE_LEVELS } from "../../../fomo-v2.types";

export const FomoV2UnlockSourceRefSchema = new mongoose.Schema(
  {
    source: { type: String, required: true },
    sourceId: { type: String },
    sourceSlug: { type: String },
    sourceUrl: { type: String },
    sourcePath: { type: String },
    sourceEntityKey: { type: String },
    sourceEntityId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "FomoV2SourceEntity",
    },
    sourceSnapshotId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "FomoV2SourceSnapshot",
    },
    observedAt: { type: Date },
    confidence: {
      type: String,
      enum: FOMO_V2_CONFIDENCE_LEVELS,
      default: "none",
    },
    metadata: { type: mongoose.Schema.Types.Mixed, default: {} },
  },
  { _id: false }
);
