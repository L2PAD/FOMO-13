import mongoose from "mongoose";
import { FundraisingDto } from "./fundraising.dto";

export class RolesDto {
    isAdmin:boolean
    isModerator:boolean
    isUser:boolean
}

export class UpdateProjectDto {
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
  
    fundraising?:Array<FundraisingDto>

    comparison:Array<string>

    news:Array<any>
  
    investors:Array<string>
  
    team:Array<string>
  
    advisors:Array<string>
  
    partners:Array<string>
  
    comments:Array<mongoose.Types.ObjectId>
  
    exchange:Array<any>
  
    overview:Array<any>
  
    info:Array<any>

    redFlags:number

    redFlagsList:Array<any>
    
    greenFlagsList:Array<any>

    totalRaised:number

    price: number
  
    lowPrice: number
  
    highPrice: number
}


export class UpdateProjectByUserDto {
    status: string;
  
    name: string;
  
    niche: string
  
    logo: File

    descriptionImagesToUpdate?:string
    
    descriptionImagesOld?:string

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
  
    investors:Array<string>
  
    team:Array<string>
  
    advisors:Array<string>
  
    partners:Array<string>
  
    comments:Array<mongoose.Types.ObjectId>
  
    exchange:Array<any>
  
    overview:Array<any>
  
    info:Array<any>

    redFlags:number

    redFlagsList:Array<any>
    
    greenFlagsList:Array<any>

    totalRaised:number

    price: number
  
    lowPrice: number
  
    highPrice: number

    isIdea?:boolean
}