import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import mongoose,{ HydratedDocument } from 'mongoose';

export type ReviewDocument = HydratedDocument<Review>;

@Schema({ timestamps: true })
export class Review {
    @Prop({ type: mongoose.Types.ObjectId, ref: 'User', required: true })
    userId:mongoose.Types.ObjectId;

    @Prop({ type: mongoose.Types.ObjectId, ref: 'Deal', required: true })
    dealId: mongoose.Types.ObjectId;

    @Prop({default:new Date()})
    date: Date;

    @Prop()
    type:'like' | 'dislike'

    @Prop({default:''})
    text:string
}

export const ReviewSchema = SchemaFactory.createForClass(Review);
