import { Prop, Schema, SchemaFactory } from "@nestjs/mongoose";
import { HydratedDocument, Mongoose, Types } from "mongoose";

export type TeamItemDocument = HydratedDocument<TeamItem>;

@Schema()
export class TeamItem {
    @Prop({required:true})
    name:string

    @Prop({required:true})
    lastname:string

    @Prop({required:true})
    profession:string

    @Prop({required:false})
    avatar:string
}

export const TeamItemSchema = SchemaFactory.createForClass(TeamItem);