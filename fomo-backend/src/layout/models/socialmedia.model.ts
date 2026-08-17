import { Prop, Schema, SchemaFactory } from "@nestjs/mongoose";
import { HydratedDocument, Types } from "mongoose";
import { SocialItem } from '../dto/footer.dto';

export type SocialMediaDocument = HydratedDocument<SocialMedia>;

@Schema()
export class SocialMedia {
    @Prop({default:[]})
    items:Array<SocialItem>
}

export const SocialMediaSchema = SchemaFactory.createForClass(SocialMedia);
