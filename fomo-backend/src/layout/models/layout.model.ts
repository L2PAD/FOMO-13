import { Prop, Schema, SchemaFactory } from "@nestjs/mongoose";
import { HydratedDocument, Types } from "mongoose";
import { HeaderDto } from "../dto/header.dto";
import { FooterDto } from "../dto/footer.dto";
import { BannerDto } from "../dto/banner.dto";

export type LayoutDocument = HydratedDocument<Layout>;

@Schema()
export class Layout {
    @Prop()
    header:HeaderDto

    @Prop()
    footer:FooterDto

    @Prop()
    banner:BannerDto

    @Prop({ default: "https://i.fomo.cx/" })
    intelUrl: string

    @Prop({ type: Object, default: null })
    promo: any

    @Prop({ default: "" })
    appStoreUrl: string

    @Prop({ default: "" })
    googlePlayUrl: string
}

export const LayoutSchema = SchemaFactory.createForClass(Layout);
