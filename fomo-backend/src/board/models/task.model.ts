import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type BoardTaskDocument = BoardTask & Document;

@Schema()
export class BoardTask {
  @Prop({ required: true })
  title: string;

  @Prop()
  description: string;

  @Prop()
  status: number;

  @Prop()
  img: string;

  @Prop({ type: Types.ObjectId, ref: 'Board' })
  board: Types.ObjectId;

  @Prop({default:false})
  isInviteUser:boolean
}

export const BoardTaskSchema = SchemaFactory.createForClass(BoardTask);
