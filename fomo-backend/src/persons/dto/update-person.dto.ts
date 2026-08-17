import mongoose from "mongoose";

export default class UpdatePersonDto {
    status: string;
  
    name: string;
  
    niche: string
  
    logo: File
  
    type: string
  
    investments:string
  
    rating:string
  
    occupancy:string
  
    banner:string
  
    socialmedia:Array<any>
  
    topfollowers:Array<any>
  
    links:Array<any>
  
    sales:string
  
    supply:number
  
    sale:number
  
    ticket: string
  
    tokenType:string
  
    ICO: string
  
    preSale:string
  
    KYC:string
  
    whitelist:string
  
    personalCap:string
  
    accepts:string
  
    fundraising:Array<any>
  
    news:Array<any>
  
    comparison:Array<any>
  
    investors:string
  
    team:Array<any>
  
    advisors:Array<any>
  
    partners:Array<any>
  
    comments:Array<mongoose.Types.ObjectId>
  
    exchange:Array<any>
  
    overview:Array<any>
  
    info:Array<any>

    redFlags:number

    redFlagsList:Array<any>
    
    greenFlagsList:Array<any>

    totalRaised:string

    price: number
  
    lowPrice: number
  
    highPrice: number

    participated:Array<any>
    colleagues:Array<any>
}

export class UpdatePersonByUser {
    name: string
    bio: string
    banner: string
    niche: string
    greenFlagsList: any
    redFlagsList: any
    lastFunding: any
    totalInvested:any
    categories:any
    athRoi:any
    highestRoi:any
    educationBlock: any
    experienceBlock: any
    contributionsBlock: any
    achievementsBlock: any
    networkBlock: any
    influenceBlock: any
    topFundedProject:any
    projectSupported:any
    regionData:any
    descriptionText:any
    socialmedia:any
}