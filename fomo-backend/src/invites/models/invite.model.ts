import { Prop, Schema, SchemaFactory } from "@nestjs/mongoose";
import mongoose,{ HydratedDocument } from "mongoose";

export type InviteCategories = 'board'

export type InviteDocument = HydratedDocument<Invite>;

@Schema()
export class Invite {
    @Prop()
    inviterId:mongoose.Types.ObjectId

    @Prop()
    senderId:mongoose.Types.ObjectId

    @Prop()
    boardId:mongoose.Types.ObjectId

    @Prop({default:'board'})
    category:InviteCategories

    @Prop({default:false})
    isAccepted:boolean

    @Prop({default:false})
    isCanceled:boolean
}

export const InviteSchema = SchemaFactory.createForClass(Invite);
