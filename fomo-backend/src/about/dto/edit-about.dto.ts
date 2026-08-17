import mongoose from "mongoose";

export class EditAboutDto {
    members:Array<mongoose.Types.ObjectId>
    partners:Array<mongoose.Types.ObjectId>
    text:string
}