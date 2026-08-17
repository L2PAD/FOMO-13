import { IAdminTabColumn } from "../../services/tabs/adminTabs";

export const TAB_COLUMN_OPTIONS: Array<
  Pick<IAdminTabColumn, "key" | "label" | "blockName" | "name">
> = [
  { key: "usdPrice", blockName: "Price", label: "USD Price", name: "Price" },
  { key: "btcPrice", blockName: "Price", label: "BTC Price", name: "Price" },
  { key: "ethPrice", blockName: "Price", label: "ETH Price", name: "Price" },
  { key: "priceChange1h", blockName: "Price Change %", label: "1h", name: "1h" },
  { key: "priceChange24h", blockName: "Price Change %", label: "24h", name: "24h" },
  { key: "priceChange7d", blockName: "Price Change %", label: "7d", name: "7d" },
  { key: "priceChange1m", blockName: "Price Change %", label: "1m", name: "1m" },
  { key: "priceChange3m", blockName: "Price Change %", label: "3m", name: "3m" },
  { key: "priceChange6m", blockName: "Price Change %", label: "6m", name: "6m" },
  { key: "priceChange1y", blockName: "Price Change %", label: "1y", name: "1y" },
  { key: "priceChangeYtd", blockName: "Price Change %", label: "Ytd", name: "Ytd" },
  {
    key: "marketCap",
    blockName: "Market Capitalisation",
    label: "Market Cap",
    name: "Market Cap",
  },
  {
    key: "fdv",
    blockName: "Market Capitalisation",
    label: "Fully Diluted Valuation (FDV)",
    name: "Fully Diluted Valuation (FDV)",
  },
  {
    key: "circulationSupply",
    blockName: "Market Capitalisation",
    label: "Circulation Supply",
    name: "Circulation Supply",
  },
  { key: "volume24h", blockName: "Volume", label: "24h", name: "24h" },
  { key: "volume7d", blockName: "Volume", label: "7d", name: "7d" },
  { key: "volume1m", blockName: "Volume", label: "1m", name: "1m" },
  { key: "chart24h", blockName: "Charts", label: "24h Chart", name: "24h Chart" },
  { key: "chart7d", blockName: "Charts", label: "7d Chart", name: "7d Chart" },
  { key: "chart1m", blockName: "Charts", label: "1m Chart", name: "1m Chart" },
  { key: "chart3m", blockName: "Charts", label: "3m Chart", name: "3m Chart" },
  { key: "chart6m", blockName: "Charts", label: "6m Chart", name: "6m Chart" },
  { key: "chart1y", blockName: "Charts", label: "1y Chart", name: "1y Chart" },
  { key: "athPrice", blockName: "ATH/ATL", label: "ATH Price", name: "ATH Price" },
  { key: "athDate", blockName: "ATH/ATL", label: "ATH Date", name: "ATH Date" },
  { key: "fromAth", blockName: "ATH/ATL", label: "% from ATH", name: "% from ATH" },
  { key: "atlPrice", blockName: "ATH/ATL", label: "ATL Price", name: "ATL Price" },
  { key: "atlDate", blockName: "ATH/ATL", label: "ATL Date", name: "ATL Date" },
  { key: "fromAtl", blockName: "ATH/ATL", label: "% from ATL", name: "% from ATL" },
  {
    key: "icoPlatform",
    blockName: "Fundraising & Vesting",
    label: "ICO Platform",
    name: "ICO Platform",
  },
  {
    key: "investors",
    blockName: "Fundraising & Vesting",
    label: "Investors",
    name: "Investors",
  },
  {
    key: "unlockProgress",
    blockName: "Fundraising & Vesting",
    label: "Unlock Progress",
    name: "Unlock Progress",
  },
  {
    key: "nextUnlock",
    blockName: "Fundraising & Vesting",
    label: "Next Unlock",
    name: "Next Unlock",
  },
  {
    key: "nextUnlockDate",
    blockName: "Fundraising & Vesting",
    label: "Next Unlock Date",
    name: "Next Unlock Date",
  },
  {
    key: "totalFundsRaised",
    blockName: "Fundraising & Vesting",
    label: "Total Funds Raised",
    name: "Total Funds Raised",
  },
  { key: "category", blockName: "Other", label: "Category", name: "Category" },
  { key: "exchanges", blockName: "Other", label: "Exchanges", name: "Exchanges" },
  { key: "performance", blockName: "Other", label: "Performance", name: "Performance" },
  {
    key: "bullishPeriod",
    blockName: "Other",
    label: "Bullish Period",
    name: "Bullish Period",
  },
  {
    key: "launchDate",
    blockName: "Other",
    label: "Trade Launch Date",
    name: "Trade Launch Date",
  },
];

export const TAB_TYPE_OPTIONS: Array<{ value: string; label: string }> = [
  { value: "custom", label: "Кастомная" },
  { value: "market", label: "Рыночная" },
  { value: "trending", label: "В тренде" },
  { value: "gainers", label: "Лидеры роста" },
  { value: "losers", label: "Лидеры падения" },
  { value: "new", label: "Новые" },
  { value: "volume", label: "По объёму" },
];

const BLOCK_NAME_RU: Record<string, string> = {
  "Price": "Цена",
  "Price Change %": "Изм. цены, %",
  "Market Capitalisation": "Капитализация",
  "Volume": "Объём",
  "Charts": "Графики",
  "ATH/ATL": "ATH/ATL",
  "Fundraising & Vesting": "Фандрайзинг и вестинг",
  "Other": "Прочее",
};

const COLUMN_LABEL_RU: Record<string, string> = {
  usdPrice: "Цена USD",
  btcPrice: "Цена BTC",
  ethPrice: "Цена ETH",
  priceChange1h: "1ч",
  priceChange24h: "24ч",
  priceChange7d: "7д",
  priceChange1m: "1мес",
  priceChange3m: "3мес",
  priceChange6m: "6мес",
  priceChange1y: "1год",
  priceChangeYtd: "С начала года",
  marketCap: "Капитализация",
  fdv: "Полная оценка (FDV)",
  circulationSupply: "Оборотное предложение",
  volume24h: "24ч",
  volume7d: "7д",
  volume1m: "1мес",
  chart24h: "График 24ч",
  chart7d: "График 7д",
  chart1m: "График 1мес",
  chart3m: "График 3мес",
  chart6m: "График 6мес",
  chart1y: "График 1год",
  athPrice: "Цена ATH",
  athDate: "Дата ATH",
  fromAth: "% от ATH",
  atlPrice: "Цена ATL",
  atlDate: "Дата ATL",
  fromAtl: "% от ATL",
  icoPlatform: "ICO-платформа",
  investors: "Инвесторы",
  unlockProgress: "Прогресс анлока",
  nextUnlock: "След. анлок",
  nextUnlockDate: "Дата след. анлока",
  totalFundsRaised: "Всего привлечено",
  category: "Категория",
  exchanges: "Биржи",
  performance: "Доходность",
  bullishPeriod: "Бычий период",
  launchDate: "Дата запуска торгов",
};

export const blockNameRu = (blockName: string): string =>
  BLOCK_NAME_RU[blockName] || blockName;

export const columnLabelRu = (key: string, fallback: string): string =>
  COLUMN_LABEL_RU[key] || fallback;

export const formatColumnOptionRu = (option: {
  key: string;
  blockName: string;
  label: string;
}): string => `${blockNameRu(option.blockName)} / ${columnLabelRu(option.key, option.label)}`;
