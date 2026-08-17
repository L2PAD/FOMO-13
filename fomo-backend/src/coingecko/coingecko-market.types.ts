export interface CoinGeckoMarketDto {
  id: string;
  symbol: string;
  name: string;
  image?: string | null;
  market_cap_rank?: number | null;
  current_price?: number | null;
  market_cap?: number | null;
  total_volume?: number | null;
  circulating_supply?: number | null;
  total_supply?: number | null;
  max_supply?: number | null;
  fully_diluted_valuation?: number | null;
  ath?: number | null;
  ath_change_percentage?: number | null;
  ath_date?: string | null;
  atl?: number | null;
  atl_change_percentage?: number | null;
  atl_date?: string | null;
  price_change_percentage_24h?: number | null;
  price_change_percentage_1h_in_currency?: number | null;
  price_change_percentage_24h_in_currency?: number | null;
  price_change_percentage_7d_in_currency?: number | null;
  last_updated?: string | null;
  sparkline_in_7d?: {
    price?: number[];
  } | null;
}

export interface CoinGeckoMarketChartDto {
  prices?: [number, number][];
  market_caps?: [number, number][];
  total_volumes?: [number, number][];
}

export type CoinGeckoProjectMappingMethod =
  | "source_map"
  | "manual_override"
  | "rawIcoData"
  | "tokenMetrics"
  | "safe_slug";

export interface ResolvedCoinGeckoProject {
  projectId: string;
  coingeckoId: string;
  mappingMethod: CoinGeckoProjectMappingMethod;
  rank?: number;
  slug?: string;
  symbol?: string;
  name?: string;
}

export interface CoinGeckoResolutionResult {
  resolved: ResolvedCoinGeckoProject[];
  skippedUnmapped: number;
}

export type MarketDataTier = "HOT" | "WARM" | "COLD";

export interface CoinGeckoReferencePrices {
  btcUsdPrice: number;
  ethUsdPrice: number;
  solUsdPrice: number;
}

export interface CoinGeckoListCoinDto {
  id: string;
  symbol: string;
  name: string;
  platforms?: Record<string, string>;
}

export interface CoinGeckoSearchCoinDto {
  id: string;
  name: string;
  api_symbol?: string;
  symbol: string;
  market_cap_rank?: number | null;
}

export interface CoinGeckoSearchResponseDto {
  coins?: CoinGeckoSearchCoinDto[];
}

export interface CoinGeckoTickerDto {
  base?: string;
  target?: string;
  market?: {
    name?: string;
    identifier?: string;
    logo?: string;
    has_trading_incentive?: boolean;
  };
  last?: number | null;
  volume?: number | null;
  converted_last?: Record<string, number | null>;
  converted_volume?: Record<string, number | null>;
  trust_score?: string | null;
  bid_ask_spread_percentage?: number | null;
  timestamp?: string | null;
  last_traded_at?: string | null;
  last_fetch_at?: string | null;
  is_anomaly?: boolean;
  is_stale?: boolean;
  trade_url?: string | null;
  token_info_url?: string | null;
  coin_id?: string | null;
  target_coin_id?: string | null;
}

export interface CoinGeckoTickersResponseDto {
  name?: string;
  tickers?: CoinGeckoTickerDto[];
}

export interface CoinGeckoDerivativeDto {
  market?: string | null;
  symbol?: string | null;
  index_id?: string | null;
  price?: string | number | null;
  price_percentage_change_24h?: string | number | null;
  contract_type?: string | null;
  index?: string | number | null;
  basis?: string | number | null;
  spread?: string | number | null;
  funding_rate?: string | number | null;
  open_interest?: string | number | null;
  volume_24h?: string | number | null;
  last_traded_at?: string | null;
  expired_at?: string | null;
}

export interface CoinGeckoApiUsageDto {
  plan?: string | null;
  rate_limit_request_per_minute?: number | string | null;
  monthly_call_credit?: number | string | null;
  current_total_monthly_calls?: number | string | null;
  current_remaining_monthly_calls?: number | string | null;
  api_key_rate_limit_request_per_minute?: number | string | null;
  api_key_monthly_call_credit?: number | string | null;
  api_key_current_total_monthly_calls?: number | string | null;
}

export interface CoinGeckoCoinDetailsDto {
  id?: string;
  symbol?: string;
  name?: string;
  categories?: string[];
  image?: {
    thumb?: string | null;
    small?: string | null;
    large?: string | null;
  };
  description?: Record<string, string | null>;
  links?: {
    homepage?: string[];
    blockchain_site?: string[];
    official_forum_url?: string[];
    chat_url?: string[];
    announcement_url?: string[];
    twitter_screen_name?: string | null;
    telegram_channel_identifier?: string | null;
    subreddit_url?: string | null;
    repos_url?: {
      github?: string[];
      bitbucket?: string[];
    };
  };
  platforms?: Record<string, string | null>;
  detail_platforms?: Record<
    string,
    {
      contract_address?: string | null;
      decimal_place?: number | null;
    }
  >;
  market_data?: {
    current_price?: Record<string, number | null>;
    ath?: Record<string, number | null>;
    ath_change_percentage?: Record<string, number | null>;
    ath_date?: Record<string, string | null>;
    atl?: Record<string, number | null>;
    atl_change_percentage?: Record<string, number | null>;
    atl_date?: Record<string, string | null>;
  };
}
