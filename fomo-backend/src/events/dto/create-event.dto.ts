import mongoose from "mongoose";

export class CreateEventDto {
  name: string;

  date: Date;

  endDate:Date

  projectId: string

  page:string

  isPrivate?:boolean

  userId?:mongoose.Types.ObjectId

  isProjectEvent?:boolean
}