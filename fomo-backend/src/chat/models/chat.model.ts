import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import mongoose, { Document } from 'mongoose';

export type ChatDocument = Chat & Document;

@Schema()
export class Chat {
    @Prop({ required: true })
    participants: Array<mongoose.Types.ObjectId>;

    @Prop()
    owner: mongoose.Types.ObjectId

    @Prop({ default: new Date() })
    created: Date

    @Prop()
    participantsHash: string

    @Prop({ default: [] })
    pinnedUsers: Array<mongoose.Types.ObjectId>;
}

export const ChatSchema = SchemaFactory.createForClass(Chat);

ChatSchema.index({ participantsHash: 1 }, { unique: true });
