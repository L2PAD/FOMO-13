import mongoose from "mongoose";

export const FomoV2BackerSourceRefSchema = new mongoose.Schema(
  {
    sourceType: { type: String, required: true },
    sourceId: { type: String },
    sourceEntityId: { type: mongoose.Schema.Types.Mixed },
    sourceSnapshotId: { type: mongoose.Schema.Types.Mixed },
    sourcePath: { type: String },
    sourceUrl: { type: String },
    confidence: { type: Number },
    metadata: { type: mongoose.Schema.Types.Mixed, default: {} },
  },
  { _id: false }
);
