import mongoose from "mongoose";

export class CreatePersonDto {
    status: string;
  
    name: string;
  
    niche: string

    participated:string
  
    logo: File
  
    type: string
  
    investments:string
  
    rating:string
  
    occupancy:string
  
    banner:string
  
    socialmedia:string
  
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
    
    projectStatus:string

    regionData?:string
}