import { Prop, Schema, SchemaFactory } from "@nestjs/mongoose";
import mongoose, { HydratedDocument, Mongoose, Types } from "mongoose";
import { ActionValue } from "../dto/action-value.dto";

export type ActionCategories = 'projects' | 'news' | 'nfts' | 'events' | 'funds' | 'persons'

export type ActionTypes = 'create' | 'update'

export type ActionDocument = HydratedDocument<Action>;

@Schema()
export class Action {
    @Prop({required:true})
    user:mongoose.Types.ObjectId

    @Prop({required:true})
    itemId:mongoose.Types.ObjectId

    @Prop({requied:true,default:'projects'})
    category:ActionCategories

    @Prop({default:'create'})
    actionType:ActionTypes

    @Prop({required:true,default:'moderator'})
    status:'moderator' | 'admin'

    @Prop({required:true})
    name:string

    @Prop({required:true})
    type:string

    @Prop({required:false})
    value:ActionValue

    @Prop({default:new Date()})
    date:Date

    @Prop({required:false})
    moderatorId:mongoose.Types.ObjectId

    @Prop()
    oldFunds:Array<mongoose.Types.ObjectId>

    @Prop()
    newFunds:Array<mongoose.Types.ObjectId>

    @Prop()
    newProjectIds:Array<mongoose.Types.ObjectId>

    @Prop()
    oldProjectIds:Array<mongoose.Types.ObjectId>
}

export const ActionSchema = SchemaFactory.createForClass(Action);