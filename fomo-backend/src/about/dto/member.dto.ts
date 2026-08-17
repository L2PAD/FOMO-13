import mongoose from "mongoose"

export class MemberDto {
    _id?:mongoose.Types.ObjectId
    avatar:string 
    name:string
    lastname:string
    profession:string
}