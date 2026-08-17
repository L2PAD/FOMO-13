import { FaqItem } from "../faq.model"

export class FaqDto {
    title:string 
    description:string 
    items:Array<FaqItem>
}