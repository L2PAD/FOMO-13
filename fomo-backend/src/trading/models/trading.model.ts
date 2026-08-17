import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import mongoose, { Document } from 'mongoose';
import { TwitterAccMood } from 'src/social-parcing/models/twitter-person.model';

export type NNHistoryItem = {
  predictedPrice: number;
  actualPrice: number;
  realChangePct: number;
  date: Date;
  predictedVsActualPct:number
};

export type TradingDocument = Trading & Document;

export type TradingStatsData = {
  name?: string;
  logo?: string;
  symbol: string;
  priceUSD: number;
  percentChange1h: number;
  percentChange24h: number;
  volume24h: number;
  circulatingSupply: number;
  maxSupply: number;
  marketCap: number;
  auditInfo: any;
  neuralNetworkPrediction?: {
    probabilityUp: number;
    date: Date;
  };
  mood?: TwitterAccMood;
  otherSources: any;
  twitterAccs: mongoose.Types.ObjectId[];
  keywords: mongoose.Types.ObjectId[];
  timestamp: Date;
};

@Schema({ timestamps: true })
export class Trading {
  @Prop({ type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null })
  userId: mongoose.Types.ObjectId | null;

  @Prop()
  coinId: number;

  @Prop()
  projectId: mongoose.Types.ObjectId;

  @Prop({ required: true })
  name: string;

  @Prop()
  logo: string;

  @Prop({ default: [] })
  data: TradingStatsData[];

  @Prop({ type: Object })
  currentData: TradingStatsData;

  @Prop({ default: false })
  isPrivate: boolean;

  @Prop({ type: Object })
  mood: TwitterAccMood;

  @Prop({ type: [{ 
    predictedPrice: Number, 
    actualPrice: Number, 
    realChangePct: Number, 
    date: Date 
  }], default: [] })
  nnHistory: NNHistoryItem[];
}

export const TradingSchema = SchemaFactory.createForClass(Trading);
