import { Prop, Schema, SchemaFactory } from "@nestjs/mongoose";
import { HydratedDocument, Types } from "mongoose";

export type CollectionDocument = HydratedDocument<Collection>;

@Schema()
export class Collection {
    @Prop({required:true})
    name:string

    @Prop({required:true})
    type:string 

    @Prop({required:true})
    smart:string 

    @Prop({required:true})
    tokenStandart:string 
    
    @Prop({default:false})
    isPinned:boolean 
        
    @Prop({required:true})
    metadataLink:string 

    @Prop({required:true})
    project:Types.ObjectId

    @Prop()
    creator:string
    
    @Prop({required:true})
    royalty:number 

    @Prop({required:true})
    nftQuantity:number 

    @Prop()
    nfts:Array<Types.ObjectId> 

    @Prop()
    lastFunding:Date

    @Prop({required:true})
    creatorFee:number 

    @Prop()
    revenue:number 

    @Prop()
    mintPrice:number 

    @Prop({ type: [Types.ObjectId], default: [] })
    likes: Array<Types.ObjectId>

    @Prop({ type: [Types.ObjectId], default: [] })
    dislikes: Array<Types.ObjectId>

    @Prop({ default: 0 })
    viewsCount: number

    @Prop({ type: [Types.ObjectId], default: [] })
    viewedBy: Array<Types.ObjectId>

    @Prop({ type: [Types.ObjectId], default: [] })
    greenFlags: Array<Types.ObjectId>

    @Prop({ type: [Types.ObjectId], default: [] })
    yellowFlags: Array<Types.ObjectId>

    @Prop({ type: [Types.ObjectId], default: [] })
    redFlags: Array<Types.ObjectId>
}

export const CollectionSchema = SchemaFactory.createForClass(Collection);
