import { Prop, Schema, SchemaFactory } from "@nestjs/mongoose";
import { HydratedDocument, Mongoose, Types } from "mongoose";

export type MemberDocument = HydratedDocument<Member>;

@Schema()
export class Member {
    @Prop({required:true})
    name:string

    @Prop({required:true})
    lastname:string

    @Prop({required:true})
    profession:string

    @Prop({required:false})
    avatar:string
}

export const MemberSchema = SchemaFactory.createForClass(Member);