import { Prop, Schema, SchemaFactory } from "@nestjs/mongoose";
import mongoose, { HydratedDocument, Types } from "mongoose";

export type NewsSections = 'default' | 'fomo-update' | 'fomo-academy'

export type NewsDocument = HydratedDocument<News>;

@Schema()
export class News {
  @Prop({ required: true, index: true })
  title: string;

  @Prop({ required: true, default: new Date() })
  date: Date;

  @Prop({ default: [] })
  recommendations: Array<mongoose.Types.ObjectId>;

  @Prop({ default: 'Crypto' })
  type: string;

  @Prop({ required: true })
  text: string;

  @Prop({ required: false })
  image: string;

  @Prop({ default: "news" })
  actionType: string;

  @Prop()
  action: string;

  @Prop({ default: new Date() })
  actionDate: Date;

  @Prop()
  actionInitiator: string;

  @Prop({ required: true })
  page: string;

  @Prop({ default: "moderator" })
  status: string;

  @Prop()
  creator: mongoose.Types.ObjectId;

  @Prop({ default: false })
  isAdminCreate: boolean;

  @Prop({ default: [] })
  likes: Array<mongoose.Types.ObjectId>;

  @Prop({ default: [] })
  dislikes: Array<mongoose.Types.ObjectId>;

  @Prop()
  sourceUrl: string;

  @Prop()
  externalId: string;

  @Prop()
  sourceId: string;

  @Prop()
  sourceName: string;

  @Prop()
  contentHash: string;

  @Prop()
  language: string;

  @Prop({ default: [] })
  tags: string[];

  @Prop()
  author: string

  @Prop({ default: false })
  isUserCreator: boolean

  @Prop({ default: 'default' })
  newsSection: NewsSections

  @Prop()
  readTime: string

  @Prop({ default: [] })
  views: Array<mongoose.Types.ObjectId>;
}

export const NewsSchema = SchemaFactory.createForClass(News);
