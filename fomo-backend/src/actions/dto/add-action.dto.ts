import mongoose from "mongoose";
import { ActionValue } from "./action-value.dto";
import { ActionCategories, ActionTypes } from "../models/action.model";

export class AddActionDto {
    user:mongoose.Types.ObjectId
    
    itemId:mongoose.Types.ObjectId

    name:string

    type:string

    value?:ActionValue

    date?:Date
    
    category:ActionCategories 

    status:'moderator' | 'admin'

    actionType?:ActionTypes

    moderatorId?:mongoose.Types.ObjectId

    oldFunds?:Array<mongoose.Types.ObjectId>

    newFunds?:Array<mongoose.Types.ObjectId>

    newProjectIds?:Array<mongoose.Types.ObjectId>

    oldProjectIds?:Array<mongoose.Types.ObjectId>
}