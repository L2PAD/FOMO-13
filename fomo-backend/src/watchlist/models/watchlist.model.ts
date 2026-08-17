import { Prop, Schema, SchemaFactory } from "@nestjs/mongoose";
import mongoose, { HydratedDocument } from "mongoose";

export type WatchlistDocument = HydratedDocument<Watchlist>;

export enum Pages {
    'projects',
    'nfts',
    'gemslab'
}

@Schema()
export class Watchlist {
    @Prop({required:true})
    userId:mongoose.Types.ObjectId

    @Prop()
    projectsList:Array<{projectId:mongoose.Types.ObjectId,page:string}>
}

export const WatchlistSchema = SchemaFactory.createForClass(Watchlist);
