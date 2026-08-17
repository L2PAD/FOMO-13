import mongoose from "mongoose"

export class BannerDto {
    _id?:mongoose.Types.ObjectId
    title:string
    description:string
    link:string 
    timeStart:string 
    date:Date
    img:File | string
}