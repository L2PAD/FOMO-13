import mongoose from "mongoose";
import { MemberDto } from "./member.dto";
import { PartnerDto } from "./partner.dto";


export class AboutDto {
    members:Array<MemberDto>
    partners:Array<PartnerDto>
    text:string

}