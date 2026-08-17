import { Prop, Schema, SchemaFactory } from "@nestjs/mongoose";
import { HydratedDocument, Mongoose, Types } from "mongoose";

export type PartnerDocument = HydratedDocument<Partner>;

@Schema()
export class Partner {
    @Prop({required:true})
    url:string

    @Prop({required:true})
    img:string
}

export const PartnerSchema = SchemaFactory.createForClass(Partner);