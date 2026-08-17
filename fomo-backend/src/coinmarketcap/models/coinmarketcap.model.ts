import { Prop, Schema, SchemaFactory } from "@nestjs/mongoose";
import { HydratedDocument, Types } from "mongoose";

export type CoinmarketcapDocument = HydratedDocument<Coinmarketcap>;

export type FearAndGreed = {
  value: number;
  value_classification: string;
  update_time: string;
};

export type StatisticType = {
  active_cryptocurrencies: number;
  total_cryptocurrencies: number;
  active_market_pairs: number;
  active_exchanges: number;
  total_exchanges: number;
  eth_dominance: number;
  btc_dominance: number;
  eth_dominance_yesterday: number;
  btc_dominance_yesterday: number;
  eth_dominance_24h_percentage_change: number;
  btc_dominance_24h_percentage_change: number;
  defi_volume_24h: number;
  defi_volume_24h_reported: number;
  defi_market_cap: number;
  defi_24h_percentage_change: number;
  stablecoin_volume_24h: number;
  stablecoin_volume_24h_reported: number;
  stablecoin_market_cap: number;
  stablecoin_24h_percentage_change: number;
  derivatives_volume_24h: number;
  derivatives_volume_24h_reported: number;
  derivatives_24h_percentage_change: number;
  total_market_cap: number;
  total_volume_24h: number;
  total_volume_24h_reported: number;
  altcoin_volume_24h: number;
  altcoin_volume_24h_reported: number;
  altcoin_market_cap: number;
  fear_and_greed: FearAndGreed;
  date: Date;
  altcoinSeasonIndex: number;
  goldPrice: number;
  goldPriceChange: number;
  spPrice: number;
  spPriceChange: number;
  marketCapWithoutBTC: number;
  marketCapWithoutBTCChange:number;
  bitcoinPrice:number;
  bitcoinPriceChange:number;
  ethereumPrice:number;
  ethereumPriceChange:number;
  solanaPrice:number;
  solanaPriceChange:number;
};

@Schema()
export class Coinmarketcap {
  @Prop({ type: {} })
  data: StatisticType;

  @Prop({ type: [Object], default: [] }) 
  history: StatisticType[];

  @Prop({ type: [Object], default: [] }) 
  marketCapWithoutBTCHistory: StatisticType[]; 
}

export const CoinmarketcapSchema = SchemaFactory.createForClass(Coinmarketcap);
