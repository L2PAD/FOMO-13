import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import mongoose, { HydratedDocument } from 'mongoose';

export type EarlylandTaskUserStateDocument =
  HydratedDocument<EarlylandTaskUserState>;

export type EarlylandTaskUserStatus =
  | 'todo'
  | 'in-progress'
  | 'completed';

@Schema({ timestamps: true })
export class EarlylandTaskUserState {
  @Prop({ type: mongoose.Schema.Types.ObjectId, required: true, index: true })
  taskId: mongoose.Types.ObjectId;

  @Prop({ type: mongoose.Schema.Types.ObjectId, required: true, index: true })
  userId: mongoose.Types.ObjectId;

  @Prop({
    enum: ['todo', 'in-progress', 'completed'],
    default: 'todo',
  })
  status: EarlylandTaskUserStatus;
}

export const EarlylandTaskUserStateSchema = SchemaFactory.createForClass(
  EarlylandTaskUserState,
);

EarlylandTaskUserStateSchema.index(
  { taskId: 1, userId: 1 },
  { unique: true, name: 'uniq_earlyland_task_user_state' },
);
