import mongoose from "mongoose"

export class PartnerDto {
    _id?:mongoose.Types.ObjectId
    img:string
    url:string
}