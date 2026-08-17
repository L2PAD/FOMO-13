import { Prop, Schema, SchemaFactory } from "@nestjs/mongoose";
import mongoose, { HydratedDocument, Types } from "mongoose";
import { ActionCategories } from "src/actions/models/action.model";

export type NotificationDocument = HydratedDocument<Notification>;

@Schema()
export class Notification {
    @Prop()
    itemId:mongoose.Types.ObjectId

    @Prop()
    userId:mongoose.Types.ObjectId
}

export const NotificationSchema = SchemaFactory.createForClass(Notification);
