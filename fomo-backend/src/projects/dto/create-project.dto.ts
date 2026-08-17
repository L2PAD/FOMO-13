import mongoose from "mongoose";

export class CreateProjectDto {
    projectType:string 

    projectStatus:'moderator' | 'admin' | 'active'

    status:string;
  
    name:string;
  
    niche:string
  
    logo:File
  
    type:string
  
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
  
    comparison:Array<any>
  
    investors:string
  
    totalRaised:number

    descriptionImage?:File

    recommendations?:string

    team?:string

    partners?:string

    faq?:string

    twitterAcc?:string

    isIdea?:boolean

    regionData?:string
}