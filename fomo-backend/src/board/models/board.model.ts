import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type BoardDocument = Board & Document;

@Schema()
export class Board {
  @Prop({ required: true })
  name: string;

  @Prop({type:Types.ObjectId,ref: 'User',required:true})
  owner:Types.ObjectId

  @Prop({ type: [Types.ObjectId], ref: 'User' ,default:[]})
  users: Types.ObjectId[];

  @Prop()
  img:string

  @Prop({default:new Date()})
  created:Date

  @Prop()
  projectId:Types.ObjectId

  @Prop({ type: [{ name: String, tasks: [{ type: Types.ObjectId, ref: 'Task' }] }], default: [] })
  columns: { name: string; tasks: Types.ObjectId[] }[];
}

export const BoardSchema = SchemaFactory.createForClass(Board);