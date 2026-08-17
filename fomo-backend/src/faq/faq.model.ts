import { Prop, Schema, SchemaFactory } from "@nestjs/mongoose";
import { HydratedDocument, Types } from "mongoose";

export type FaqDocument = HydratedDocument<Faq>;

export class FaqItem {
    title:string
    description:string
}

@Schema()
export class Faq {
    @Prop({default:''})
    title:string 

    @Prop({default:''})
    description:string 

    @Prop({default:[]})
    items:Array<FaqItem>
}

export const FaqSchema = SchemaFactory.createForClass(Faq);
