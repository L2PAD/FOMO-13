export interface ICollectionTypes {
    'FOMO Key':'FOMO Key',
    'Early rounds':'Early rounds',
    'Public rounds':'Public rounds',
    'NFT Launch':'NFT Launch'
}

export class CollectionDto {
    _id?:string
    name:string
    type:keyof ICollectionTypes
    smart:string
    royalty:number
    project:string
    nftQuantity:number
    nfts:Array<any>
    creatorFee:number 
    revenue:number 
    mintPrice:number 
    lastFunding:Date 
    tokenStandart:string 
    isPinned:boolean
    metadataLink?:string
    creator?:string
    likes?:Array<string>
    dislikes?:Array<string>
    viewsCount?:number
    greenFlags?:Array<string>
    yellowFlags?:Array<string>
    redFlags?:Array<string>
    __v?:number
}
