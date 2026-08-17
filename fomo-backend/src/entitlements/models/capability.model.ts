import { Prop, Schema, SchemaFactory } from "@nestjs/mongoose";
import { Document } from "mongoose";

@Schema({ collection: "entitlement_capabilities", timestamps: true })
export class Capability {
  @Prop({ type: String, required: true, unique: true })
  key: string;

  @Prop({ type: String, required: true })
  name: string;

  @Prop({ type: String, default: "" })
  domain: string;

  // ACCESS_ONLY | EXTERNAL_ELIGIBILITY | HYBRID (B4)
  @Prop({ type: String, default: "ACCESS_ONLY" })
  accessType: string;

  @Prop({ type: String, default: "" })
  eligibilityProvider: string;

  @Prop({ type: String, default: "" })
  description: string;

  // system capabilities cannot be deleted from CRM (only deactivated safely).
  @Prop({ type: Boolean, default: true })
  system: boolean;

  @Prop({ type: Boolean, default: true })
  active: boolean;
}

export type CapabilityDocument = Capability & Document;
export const CapabilitySchema = SchemaFactory.createForClass(Capability);
