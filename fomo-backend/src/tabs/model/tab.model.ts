import { Schema, Prop, SchemaFactory } from "@nestjs/mongoose";
import mongoose, { Document, Mongoose } from "mongoose";

export class ICustomTabs {
  label: string;
  name: string;
  isActive: boolean;
  key:string 
  index?:number
}

export class IAdminTabColumn {
  key: string;
  label: string;
  enabled: boolean;
  order: number;
  blockName?: string;
  name?: string;
}
export type TabDocument = CryptoTab & Document;

@Schema({ timestamps: true })
export class CryptoTab {
  @Prop()
  image?: string;

  @Prop({ default: [] })
  includedAssets: mongoose.Types.ObjectId[];

  @Prop({ default: [] })
  excludedAssets: mongoose.Types.ObjectId[];

  @Prop({
    default: [],
  })
  tabs: (ICustomTabs & { blockName: string })[];

  @Prop({ required: true })
  name: string;

  @Prop()
  key?: string;

  @Prop()
  description: string;

  @Prop({ default: [] })
  saved: mongoose.Types.ObjectId[];

  @Prop({ default: [] })
  pined: mongoose.Types.ObjectId[];

  @Prop({ enum: ["New", "Trending"], default: "New" })
  status: "New" | "Trending";

  @Prop({ default: "custom" })
  type?: string;

  @Prop({ type: Date, default: Date.now })
  dateUpdate: Date;

  @Prop({ required: true })
  creator: mongoose.Types.ObjectId;

  @Prop()
  updatedBy?: mongoose.Types.ObjectId;

  @Prop({ default: 0 })
  arrayPlace: number;

  @Prop({default:false})
  isPublic:boolean

  @Prop({ default: false })
  isActive?: boolean;

  @Prop({ default: false })
  isGlobal?: boolean;

  @Prop({ default: false })
  isAdminCreated?: boolean;

  @Prop({ default: 0 })
  sortOrder?: number;

  @Prop({
    type: [
      {
        key: String,
        label: String,
        enabled: Boolean,
        order: Number,
        blockName: String,
        name: String,
      },
    ],
    default: [],
  })
  columns?: IAdminTabColumn[];

  @Prop({ type: mongoose.Schema.Types.Mixed, default: {} })
  filters?: Record<string, any>;
}

export const CryptoTabSchema = SchemaFactory.createForClass(CryptoTab);

CryptoTabSchema.index({ creator: 1 });
CryptoTabSchema.index({ isPublic: 1 });
CryptoTabSchema.index({ isAdminCreated: 1, isGlobal: 1, isActive: 1 });
CryptoTabSchema.index({ sortOrder: 1, createdAt: -1 });
CryptoTabSchema.index({ saved: 1 });
CryptoTabSchema.index({ pined: 1 });
CryptoTabSchema.index({ dateUpdate: -1 });

