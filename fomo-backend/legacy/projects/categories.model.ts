import { Prop, Schema, SchemaFactory } from "@nestjs/mongoose";
import mongoose, { HydratedDocument, Types } from "mongoose";

export type ProjectsCategoriesDocument = HydratedDocument<ProjectsCategories>;

export type ProjectCategoryData = {
  volume24hChange: number;
  price: number;
  priceChange: number;
  volume24h: number;
  dateAdded: Date;
  name: string;
  niche: string;
  symbol: string;
  logo: string;
  fundsRaised?: number;
  fundsRounds?: number;
};

@Schema()
export class ProjectsCategories {
  @Prop({ type: Array, default: [] })
  trending: Array<ProjectCategoryData>;

  @Prop({ type: Array, default: [] })
  recentlyAdded: Array<ProjectCategoryData>;

  @Prop({ type: Array, default: [] })
  topGainers: Array<ProjectCategoryData>;

  @Prop({ type: Array, default: [] })
  accumulation: Array<ProjectCategoryData>;
}

export const ProjectsCategoriesSchema =
  SchemaFactory.createForClass(ProjectsCategories);
