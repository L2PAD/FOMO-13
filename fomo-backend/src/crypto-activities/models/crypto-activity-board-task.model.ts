import { Prop, Schema, SchemaFactory } from "@nestjs/mongoose";
import mongoose, { HydratedDocument } from "mongoose";

export type CryptoActivityBoardTaskDocument =
  HydratedDocument<CryptoActivityBoardTask>;

@Schema({ timestamps: true })
export class CryptoActivityBoardTask {
  @Prop({ type: mongoose.Schema.Types.ObjectId, required: true, index: true })
  userId: mongoose.Types.ObjectId;

  @Prop({ type: mongoose.Schema.Types.ObjectId, required: false, index: true })
  activityId?: mongoose.Types.ObjectId;

  @Prop({ type: mongoose.Schema.Types.ObjectId, required: false, index: true })
  v2ActivityId?: mongoose.Types.ObjectId;

  @Prop({ enum: ["legacy", "fomo_v2"], default: "legacy", index: true })
  activityEntity?: "legacy" | "fomo_v2";

  @Prop({ type: mongoose.Schema.Types.ObjectId, required: true, index: true })
  columnId: mongoose.Types.ObjectId;

  @Prop({ type: mongoose.Schema.Types.ObjectId, required: false, index: true })
  boardId?: mongoose.Types.ObjectId;

  @Prop({ required: true })
  title: string;

  @Prop()
  projectName?: string;

  @Prop()
  projectPlatform?: string;

  @Prop()
  projectLogo?: string;

  @Prop()
  description?: string;

  @Prop()
  category?: string;

  @Prop()
  difficulty?: string;

  @Prop()
  notes?: string;

  @Prop()
  sourceUrl?: string;

  @Prop({ type: [String], default: [] })
  tags?: string[];

  @Prop({ type: [mongoose.Schema.Types.Mixed], default: [] })
  rewards?: any[];

  @Prop({ type: [String], default: [] })
  requirements?: string[];

  @Prop()
  dueDate?: Date;

  @Prop()
  status?: string;

  @Prop({ default: 0 })
  order: number;

  // ── Reference to a canonical FOMO Task (Team Task) ───────────────────────
  // When a user runs "Add to Board" on a FOMO Task we create a REFERENCE card,
  // never a clone. XP / criteria / verification / reward stay owned by the
  // canonical Task; the board only stores the user's own organisation
  // (column, note, priority, position).
  @Prop({ enum: ["USER", "FOMO_TASK"], default: "USER", index: true })
  sourceType?: "USER" | "FOMO_TASK";

  @Prop({ type: mongoose.Schema.Types.ObjectId, required: false, index: true })
  sourceTaskId?: mongoose.Types.ObjectId;

  @Prop()
  personalPriority?: string;
}

export const CryptoActivityBoardTaskSchema = SchemaFactory.createForClass(
  CryptoActivityBoardTask
);

CryptoActivityBoardTaskSchema.index({ userId: 1, columnId: 1, order: 1 });
CryptoActivityBoardTaskSchema.index({ userId: 1, boardId: 1, order: 1 });
CryptoActivityBoardTaskSchema.index(
  { userId: 1, v2ActivityId: 1 },
  { name: "idx_crypto_activity_board_tasks_user_v2_activity" }
);
CryptoActivityBoardTaskSchema.index(
  { userId: 1, dueDate: 1, order: 1, createdAt: 1 },
  { name: "idx_crypto_activity_board_tasks_user_due_order" }
);
