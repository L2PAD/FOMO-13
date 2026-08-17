import { Prop, Schema, SchemaFactory } from "@nestjs/mongoose";
import { HydratedDocument } from "mongoose";

export type NftDocument = HydratedDocument<Nft>;

@Schema()
export class Nft {
  @Prop({required:true,default:'nft'})
  projectType:string
  
  @Prop({required:true,default:'moderation'})
  projectStatus:string

  @Prop({required:true})
  status: string;

  @Prop({required:true})
  name: string;

  @Prop()
  logo: string

  @Prop()
  type: string

  @Prop()
  investments:string

  @Prop()
  rating:string

  @Prop()
  occupancy:string

  @Prop()
  banner:string

  @Prop({type:Array})
  socialmedia

  @Prop({type:Array})
  topfollowers

  @Prop({type:Array})
  links

  @Prop()
  sales:string

  @Prop()
  supply:number

  @Prop()
  sale:number

  @Prop()
  ticket: string

  @Prop()
  tokenType:string

  @Prop()
  ICO: string

  @Prop()
  preSale:string

  @Prop()
  KYC:string

  @Prop()
  whitelist:string

  @Prop()
  NftalCap:string

  @Prop()
  accepts:string

  @Prop({type:Array})
  fundraising

  @Prop({type:Array})
  news

  @Prop({type:Array})
  comparison

  @Prop({type:Array,default:[]})
  investors

  @Prop({type:Array})
  team

  @Prop({type:Array})
  advisors

  @Prop({type:Array})
  partners

  @Prop({type:Array})
  comments

  @Prop({type:Array})
  exchange

  @Prop({type:Array})
  overview

  @Prop({type:Array})
  info

  @Prop({default:0})
  redFlags:number

  @Prop()
  redFlagsList:Array<string>
    
  @Prop()
  greenFlagsList:Array<string>

  @Prop({default:false})
  redStatus:boolean

  @Prop({default:'0'})
  totalRaised:string

  @Prop()
  lastFunding:string
  
  @Prop({default:'0%'})
  fullness:string

  @Prop()
  floorPrice:string

  @Prop()
  niche:string

  @Prop()
  items:Array<string>
  
  @Prop()
  owners:Array<string>

  @Prop({default:'nft'})
  actionType:string

  @Prop({default:'Publication on Nfts page'})
  action:string

  @Prop({default:new Date()})
  actionDate: Date

  @Prop()
  actionInitiator: string

  @Prop({default:''})
  bio:string
}

export const NftSchema = SchemaFactory.createForClass(Nft);
