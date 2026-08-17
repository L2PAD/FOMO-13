import { Prop, Schema, SchemaFactory } from "@nestjs/mongoose";
import mongoose, { HydratedDocument, Types } from "mongoose";

export type MessageDocument = HydratedDocument<Message>;

const messageSchemaOptions = {
  suppressReservedKeysWarning: true,
  supressReservedKeysWarning: true,
};

@Schema(messageSchemaOptions)
export class Message {
  @Prop({ default: new Date() })
  date: Date;

  @Prop({required:true})
  from:mongoose.Types.ObjectId

  @Prop({required:true})
  to:mongoose.Types.ObjectId

  @Prop()
  title:string

  @Prop()
  message:string

  @Prop({ type: Array, default: [] })
  attachments: Array<{
    url: string;
    name?: string;
    type?: string;
    size?: number;
  }>;

  @Prop()
  replyTo?: mongoose.Types.ObjectId

  @Prop({default:true})
  isNew:boolean

  @Prop({ type: [mongoose.Types.ObjectId], default: [] })
  reports: mongoose.Types.ObjectId[]

  @Prop()
  chatId:mongoose.Types.ObjectId

  @Prop({ default: false })
  isSystem: boolean

  @Prop()
  dealId: mongoose.Types.ObjectId

  @Prop()
  systemType: 'funds_reserved' | 'payment_marked' | 'appeal_created' | 'deal_completed'
}

export const MessageSchema = SchemaFactory.createForClass(Message);

