import { Prop, Schema, SchemaFactory } from "@nestjs/mongoose";
import mongoose, { HydratedDocument } from "mongoose";

export type RefDocument = HydratedDocument<Ref>;

@Schema()
export class Ref {
  @Prop({required:true})
  userAddress:string

  @Prop({required:true,unique:true})
  code:string

  @Prop({default:[]})
  partnersList:Array<string>
}

export const RefSchema = SchemaFactory.createForClass(Ref);
