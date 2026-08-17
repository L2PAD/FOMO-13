
export class CreateOrderDto {
    userId:string
    collectionId:string
    collectionNftId:string
    projectId:string
    created:Date
    price:number
    isEth:boolean
    isUsdc:boolean
    endDate:Date
    belowFloor:number
    smartOrderId?:number
}
