import { Prop, Schema, SchemaFactory } from "@nestjs/mongoose";
import mongoose, { HydratedDocument } from "mongoose";

export type ProjectUnlocksDocument = HydratedDocument<ProjectUnlocks>;

@Schema({ collection: "project_unlocks", timestamps: true, strict: false })
export class ProjectUnlocks {
  @Prop({ type: mongoose.Schema.Types.ObjectId, ref: "Project", required: true, index: true })
  projectId: mongoose.Types.ObjectId;

  @Prop({ required: true, default: "dropstab", index: true })
  source: "dropstab";

  // Dropstab percentages are stored as human percent: 0.78 means 0.78%, not 0.0078 ratio.
  @Prop({ type: [Object], default: [] })
  tokenAllocation?: any[];

  @Prop({ type: Object, default: {} })
  vestingSummary?: any;

  @Prop({ type: [Object], default: [] })
  vestingSchedule?: any[];

  @Prop({ type: [Object], default: [] })
  vestingRounds?: any[];

  @Prop({ type: [Object], default: [] })
  vestingTimeline?: any[];

  @Prop({ type: [Object], default: [] })
  unlockingEvents?: any[];

  @Prop({ type: Object, default: null })
  nextUnlockingEvent?: any;

  @Prop({ type: Object, default: null })
  publicVesting?: any;

  @Prop({ type: [Object], default: [] })
  sourceLinks?: any[];

  @Prop({ type: Object, default: {} })
  dataQuality?: any;

  @Prop({ type: Object, default: {} })
  sourceRefs: {
    dropstab?: {
      sourceProjectId?: mongoose.Types.ObjectId | string;
      slug?: string;
      sourceUrl?: string;
      lastSyncedAt?: Date;
    };
  };
}

export const ProjectUnlocksSchema = SchemaFactory.createForClass(ProjectUnlocks);

ProjectUnlocksSchema.index({ projectId: 1, source: 1 });
ProjectUnlocksSchema.index({ "sourceRefs.dropstab.slug": 1 });
ProjectUnlocksSchema.index({ "nextUnlockingEvent.date": 1 });
ProjectUnlocksSchema.index({ "nextUnlockingEvent.unlockDate": 1 });
