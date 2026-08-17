import { Prop, Schema, SchemaFactory } from "@nestjs/mongoose";
import mongoose, { HydratedDocument, Mongoose, Types } from "mongoose";

export type BannerDocument = HydratedDocument<Banner>;

@Schema()
export class Banner {
    @Prop()
    title:string

    @Prop()
    description:string

    @Prop()
    link:string 

    @Prop()
    timeStart:string 

    @Prop({default:new Date()})
    date:Date

    @Prop()
    img:string

    @Prop()
    page:string

    @Prop({default:false})
    isTimerVisible:boolean
}

export const BannerSchema = SchemaFactory.createForClass(Banner);