import { Prop, Schema, SchemaFactory } from "@nestjs/mongoose";
import mongoose, { HydratedDocument, Types } from "mongoose";
import { TwitterAccMood } from "./twitter-person.model";

export type IKeywordTweet = {
  id: string;
  text: string;
  createdAt: Date;
  description: string;
  statuses_count: number;
  media_count: number;
  friends_count: number;
  favourites_count: number;
  listed_count: number;
  author: {
    name: string;
    screenName: string;
  };
  photos: string[] | null;
  views: string;
  mood: TwitterAccMood
}

export type KeywordItem = {
  index: number
  value: string
}

export type TwitterKeywordsDocument = HydratedDocument<TwitterKeywords>;

@Schema({ timestamps: true })
export class TwitterKeywords {
  @Prop()
  userId: mongoose.Types.ObjectId;

  @Prop({ default: [] })
  keywords: Array<KeywordItem>

  @Prop({ default: false })
  isPrivate: boolean

  @Prop({ default: '' })
  stringKeywords: string

  @Prop({ default: [] })
  tweets: Array<IKeywordTweet>

  @Prop({ default: false })
  isSentiment: boolean

  @Prop({ type: Object })
  mood: TwitterAccMood
}

export const TwitterKeywordsSchema =
  SchemaFactory.createForClass(TwitterKeywords);
