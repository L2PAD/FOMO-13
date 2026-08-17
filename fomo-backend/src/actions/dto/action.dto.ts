import { ActionValue } from "./action-value.dto";
import { ActionCategories } from "../models/action.model";

export class ActionDto {
    user:any

    item?:any

    name:string

    type:string

    value:ActionValue

    date?:Date

    category:ActionCategories 

    status:'moderator' | 'admin'

}