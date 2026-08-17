import { Prop, Schema, SchemaFactory } from "@nestjs/mongoose";
import { HydratedDocument, Mongoose, Types } from "mongoose";
import mongoose from "mongoose";

export type AboutDocument = HydratedDocument<About>;

@Schema()
export class About {
    @Prop({default:[]})
    members:Array<mongoose.Types.ObjectId>

    @Prop({default:[]})
    partners:Array<mongoose.Types.ObjectId>

    @Prop({default:[]})
    team:Array<mongoose.Types.ObjectId>

    @Prop({default:''})
    text:string

}

export const AboutSchema = SchemaFactory.createForClass(About);