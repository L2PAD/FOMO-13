import { Prop, Schema, SchemaFactory } from "@nestjs/mongoose";
import { HydratedDocument } from "mongoose";

export interface ExchangeTicker {
  base: string;
  quote: string;
  priceUsd: number;
  volume24h: number;
  link: string;
  verified: boolean;
  marginAvailable: boolean;
  type: string;
  marginLeverage: number;
  tradingViewBase: string | null;
  tradingViewQuote: string | null;
}
export type ExchangeDocument = HydratedDocument<Exchange>;

@Schema({ timestamps: true })
export class Exchange {
  @Prop({ required: true })
  id: number;

  @Prop({ required: true })
  slug: string;

  @Prop({ required: true })
  name: string;

  @Prop()
  image: string;

  @Prop({ default: false })
  verified: boolean;

  @Prop()
  type: string;

  @Prop()
  rankVerified: number;

  @Prop()
  rankReported: number;

  @Prop()
  volume24hReported: number;

  @Prop()
  volume24hVerified: number;

  @Prop()
  marketsCount: number;

  @Prop({ default: [] })
  tickers: Array<ExchangeTicker>;
}

export const ExchangeSchema = SchemaFactory.createForClass(Exchange);
