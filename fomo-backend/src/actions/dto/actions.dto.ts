import { ActionValue } from "./action-value.dto";
import { ActionCategories } from "../models/action.model";

export class ActionsDto {
    user:any

    item?:any

    name:string

    type:string

    value:ActionValue

    date?:Date

    category:ActionCategories 

    categoryData:any 

    status:'moderator' | 'admin'
}