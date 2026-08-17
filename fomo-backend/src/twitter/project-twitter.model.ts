import { Prop, Schema, SchemaFactory } from "@nestjs/mongoose";
import mongoose, { HydratedDocument, Types } from "mongoose";

export type ProjectTwitterDocument = HydratedDocument<ProjectTwitter>;

export interface ParsingTwitterData {
  id: string;
  rest_id: string;
  name: string;
  screen_name: string;
  avatar_url: string;
  created_at: string;
  description: string;
  followers_count: number;
  friends_count: number;
  statuses_count: number;
  is_blue_verified: boolean;
  location: string;
}

@Schema()
export class ProjectTwitter {
  @Prop()
  projectId: mongoose.Types.ObjectId;

  @Prop()
  twitterName: string;

  @Prop()
  tweets: Array<any>;

  @Prop()
  followers: Array<any>;
}

export const ProjectTwitterSchema =
  SchemaFactory.createForClass(ProjectTwitter);
