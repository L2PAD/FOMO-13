
export class CollectionNftDto {
    _id?:string
    nftId:number
    description:string
    external_url:string
    image:string
    name:string
    attributes:Array<any>
    collectionId:string
    price:number 
    orderId:number
    isEth:boolean 
    isUsdc:boolean
    ownerId:string
    tokenAddress:string
    endDate?: Date | string | null
}
