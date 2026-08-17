import { Prop, Schema, SchemaFactory } from "@nestjs/mongoose"; 
import mongoose, { HydratedDocument, Types } from "mongoose";
import { ParsingTypes } from "../dto/add-twiiter-acc.dto";

export type TwitterAccMood = {
  score:string | number,
  label:string,
}

export type TwitterPersonDocument = HydratedDocument<TwitterPerson>;
 
@Schema({ timestamps: true })
export class TwitterPerson {
  @Prop()
  name: string;

  @Prop()
  twitterId: string;  

  @Prop()
  username: string;

  @Prop()
  avatar: string;

  @Prop()
  followersCount: number;

  @Prop()
  followingCount: number;

  @Prop()
  tweetCount: number;

  @Prop({default:[]})
  tweets: Array<any>;

  @Prop()
  description: string;

  @Prop({type:Array, default:[]})
  followers: Array<any>;

  @Prop()
  isBlueVerified: boolean; 

  @Prop()
  location: string;

  @Prop({default:false})
  isPrivate:boolean

  @Prop()
  userId:mongoose.Types.ObjectId

  @Prop()
  keywords:string

  @Prop({ type: String, default: 'account' })
  type:ParsingTypes

  @Prop()
  registrationDate:Date

  @Prop({type:Object})
  mood:TwitterAccMood

  @Prop({default:false})
  isSentiment:boolean

  @Prop({default:'Other'})
  category:string
  
}

export const TwitterPersonSchema = SchemaFactory.createForClass(TwitterPerson);
