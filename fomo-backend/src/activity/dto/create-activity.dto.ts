import mongoose from "mongoose";
import { ActivityTypes } from "../models/activity.model";

export class CreateActivityDto {
  userId: mongoose.Types.ObjectId;
  createdAt: Date;
  title: string;
  type: ActivityTypes;
  link:string
  text?:string
}
