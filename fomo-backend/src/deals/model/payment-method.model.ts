import { Prop, Schema, SchemaFactory } from "@nestjs/mongoose";
import mongoose, { HydratedDocument } from "mongoose";

export type PaymentMethodDocument = HydratedDocument<PaymentMethod>;

export type PaymentMethodType =
  | "card"
  | "google_pay"
  | "apple_pay"
  | "bank"
  | "other";

@Schema()
export class PaymentMethod {
  @Prop({ required: true })
  userId: mongoose.Types.ObjectId;

  @Prop({ default: "card" })
  type: PaymentMethodType;

  @Prop({ required: true })
  label: string;

  @Prop()
  holderName: string;

  @Prop()
  bankName: string;

  @Prop()
  cardLast4: string;

  @Prop()
  cardNumber: string;

  @Prop()
  expMonth: number;

  @Prop()
  expYear: number;

  @Prop({ default: false })
  isDefault: boolean;

  @Prop({ type: Object })
  meta?: Record<string, any>;

  @Prop({ type: Date, default: Date.now })
  createdAt: Date;
}

export const PaymentMethodSchema = SchemaFactory.createForClass(PaymentMethod);
