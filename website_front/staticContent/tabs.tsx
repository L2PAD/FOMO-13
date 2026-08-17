import Market from "../components/global/Icons/nav/market";
import React from "react";
import Feed from "../components/global/Icons/nav/feed";
import Echo from "../components/global/Icons/nav/echo";
import Eralash from "../components/global/Icons/nav/eralash";
import Unlocking from "../components/global/Icons/nav/unlocking";
import { LucideMic, NewspaperIcon } from "lucide-react";
import FomoChat from "../components/global/Icons/nav/fomo-chat";
import Buzz from "../components/global/Icons/nav/buzz";
import Parsing from "../components/global/Icons/nav/parsing";
import DashMarket from "../components/global/Icons/nav/dash-market";
import Backers from "../components/global/Icons/nav/backers";
import Nft from "../components/global/Icons/nav/nft";
import Platforms from "../components/global/Icons/nav/platforms";
import Events from "../components/global/Icons/nav/events";
import Watchlist from "../components/global/Icons/nav/watchlist";

export const Tabs = [
  { title: "Crypto", link: "" },
  { title: "EarlyLand", link: "earlyland" },
  { title: "GemsLab", link: "gemslab/profile" },
  { title: "Utility", link: "utility", isUpdates: true },
  // { title: "Dashboard", link: "dashboard" },
];

export const MainPages = [
  "/crypto",
  "/earlyland",
  "/gemslab",
  "/utility",
  "/dashboard",
];

export enum TopByTabsEnum {
  "Main" = "Main",
  "Sales count" = "Sales count",
  "Volume" = "Volume",
  "Listings Percent" = "Listings Percent",
  "Holders Count" = "Holders Count",
  "NBCP" = "NBCP",
}
export const NFTsProjectsTabs = Object.keys(TopByTabsEnum);

export const UtilityPages = [
  {
    title: "Bazaar",
    link: "",
    tabs: [
      {
        title: "Classic OTC Market",
        link: "otc",
        icon: "otc",
      },
      {
        title: "Alloc Market",
        link: "market",
        icon: "alloc-market",
      },
    ],
  },
  {
    title: "Connections",
    link: "",
    icon: <FomoChat />,
    tabs: [
      {
        title: "Ecosystem Graph",
        link: "ecosystem-graph",
        icon: "ecosystem-graph",
      },
      {
        title: "Influence",
        link: "influence",
        icon: "influence",
      },
      {
        title: "On-Chain",
        link: "on-chain",
        icon: "on-chain",
      },
    ],
  },
  { title: "Arena", link: "arena", icon: <Parsing /> },
  { title: "Parcing", link: "parcing", icon: <Parsing /> },
  { title: "Alpha AI", link: "alpha-ai", icon: <Parsing /> },
  {
    title: "Buzz",
    link: "news",
    icon: <Buzz />,
  },
  {
    title: "Podcast",
    link: "podcasts",
    icon: <LucideMic width={20} height={20} />,
  },
  { title: "Dash", link: "dash", icon: <FomoChat /> },
];

export const DashboardPages = [
  { title: "Markets", link: "markets", icon: <DashMarket /> },
  { title: "Crypto projects", link: "", icon: <Parsing /> },
  { title: "Backers", link: "backers", icon: <Backers /> },
  { title: "NFTs", link: "nfts", icon: <Nft /> },
  { title: "Platforms", link: "platforms", icon: <Platforms /> },
  { title: "Events", link: "events", icon: <Events /> },
  { title: "Watchlist", link: "watchlist", icon: <Watchlist /> },
];

export const ProjectPages = [
  { title: "Market", link: "", icon: <Market /> },
  { title: "F-Feed", link: "funding-feed", icon: <Feed /> },
  { title: "Echo", link: "projects", icon: <Echo /> },
  { title: "Backer", link: "backers", icon: <Backers /> },
  { title: "Eralash", link: "eralash", icon: <Eralash /> },
  { title: "Unlocking", link: "unlocking", icon: <Unlocking /> },
];

export const ProjectsProjectsTabs = [
  "FAV",
  "New",
  "Active",
  "Upcoming",
  "Ended",
  "Sandbox",
  "ICO Stats",
];
export const EchoNFTTabs = [
  "All",
  "Trending",
  "Newly added",
  "Lowest price",
  "Upcoming",
  "Ended",
];
export const EralashTabs = ["Projects", "Persons"];
export const EarlylandProjectsTabs = ["Tech", "NFT", "Drops", "Promo"];
export const SpaceportTabs = ["NFT Staking", "Native", "Stablecoin"];

export const RandomOptionsForSelect = [
  { name: "ETH 1", value: "et243h" },
  { name: "USDT 2", value: "u24sdt" },
  { name: "BTC 3", value: "234" },
  { name: "ETH 4", value: "et234h" },
  { name: "USDT 5", value: "u324sdt" },
  { name: "BTC 6", value: "bt43c" },
];

export interface ICustomTabs {
  __id?: string;
  key: string;
  blockName: string;
  label: string;
  name: string;
  isActive: boolean;
  index?: number;
}

export const getCustomTabDisplayLabel = (
  tab: Pick<ICustomTabs, "key" | "blockName"> &
    Partial<Pick<ICustomTabs, "label" | "name">>
): string => {
  const label = tab.label || tab.name || tab.key;

  if (tab.key === "fdv") return "FDV";

  if (tab.blockName === "Volume" && ["24h", "7d", "1m"].includes(label)) {
    return `Volume ${label}`;
  }

  return label;
};

export const gridTemplateColumnsMap: { [key: string]: string } = {
  usdPrice: "0.8fr",
  btcPrice: "0.8fr",
  ethPrice: "0.8fr",
  price: "0.8fr",

  priceChange1h: "0.8fr",
  priceChange24h: "0.8fr",
  priceChange7d: "0.8fr",
  "usdQuote.percent_change_1h": "0.8fr",
  "usdQuote.percent_change_24h": "0.8fr",
  "usdQuote.percent_change_7d": "0.8fr",
  priceChange1m: "0.8fr",
  priceChange3m: "0.8fr",
  priceChange6m: "0.8fr",
  priceChange1y: "0.8fr",
  priceChangeYtd: "0.8fr",

  marketCap: "0.8fr",
  fullyDilutedMarketCap: "0.8fr",
  circulatingSupply: "1.4fr",

  volume24h: "0.8fr",
  volume7d: "0.8fr",
  volume1m: "0.8fr",

  chart24h: "1.4fr",
  chart7d: "1.4fr",
  chart1m: "1.4fr",
  chart3m: "1.4fr",
  chart6m: "1.4fr",
  chart1y: "1.4fr",
  history: "1.4fr",

  athPrice: "0.8fr",
  athDate: "0.8fr",
  fromAth: "0.8fr",
  atlPrice: "0.8fr",
  atlDate: "0.8fr",
  fromAtl: "0.8fr",

  icoPlatform: "0.8fr",
  investors: "0.8fr",
  usdRoi: "0.8fr",
  btcRoi: "0.8fr",
  ethRoi: "0.8fr",
  unlockProgress: "0.8fr",
  nextUnlock: "0.8fr",
  nextUnlockDate: "0.8fr",
  totalFundsRaised: "0.8fr",

  category: "0.8fr",
  exchanges: "0.8fr",
  performance: "0.8fr",
  bullishPeriod: "0.8fr",
  launchDate: "0.8fr",
};

export const CustomTabsDefault: Array<ICustomTabs> = [
  {
    key: "usdPrice",
    blockName: "Price",
    label: "USD Price",
    name: "Price",
    isActive: false,
  },
  {
    key: "btcPrice",
    blockName: "Price",
    label: "BTC Price",
    name: "Price",
    isActive: false,
  },
  {
    key: "ethPrice",
    blockName: "Price",
    label: "ETH Price",
    name: "Price",
    isActive: false,
  },

  {
    key: "priceChange1h",
    blockName: "Price Change %",
    label: "1h",
    name: "1h",
    isActive: false,
  },
  {
    key: "priceChange24h",
    blockName: "Price Change %",
    label: "24h",
    name: "24h",
    isActive: false,
  },
  {
    key: "priceChange7d",
    blockName: "Price Change %",
    label: "7d",
    name: "7d",
    isActive: false,
  },
  {
    key: "priceChange1m",
    blockName: "Price Change %",
    label: "1m",
    name: "1m",
    isActive: false,
  },
  {
    key: "priceChange3m",
    blockName: "Price Change %",
    label: "3m",
    name: "3m",
    isActive: false,
  },
  {
    key: "priceChange6m",
    blockName: "Price Change %",
    label: "6m",
    name: "6m",
    isActive: false,
  },
  {
    key: "priceChange1y",
    blockName: "Price Change %",
    label: "1y",
    name: "1y",
    isActive: false,
  },
  {
    key: "priceChangeYtd",
    blockName: "Price Change %",
    label: "Ytd",
    name: "Ytd",
    isActive: false,
  },

  {
    key: "marketCap",
    blockName: "Market Capitalisation",
    label: "Market Cap",
    name: "Market Cap",
    isActive: false,
  },
  {
    key: "fdv",
    blockName: "Market Capitalisation",
    label: "Fully Diluted Valuation (FDV)",
    name: "Fully Diluted Valuation (FDV)",
    isActive: false,
  },
  {
    key: "circulationSupply",
    blockName: "Market Capitalisation",
    label: "Circulation Supply",
    name: "Circulation Supply",
    isActive: false,
  },

  {
    key: "volume24h",
    blockName: "Volume",
    label: "24h",
    name: "24h",
    isActive: false,
  },
  {
    key: "volume7d",
    blockName: "Volume",
    label: "7d",
    name: "7d",
    isActive: false,
  },
  {
    key: "volume1m",
    blockName: "Volume",
    label: "1m",
    name: "1m",
    isActive: false,
  },

  {
    key: "chart24h",
    blockName: "Charts",
    label: "24h Chart",
    name: "24h Chart",
    isActive: false,
  },
  {
    key: "chart7d",
    blockName: "Charts",
    label: "7d Chart",
    name: "7d Chart",
    isActive: false,
  },
  {
    key: "chart1m",
    blockName: "Charts",
    label: "1m Chart",
    name: "1m Chart",
    isActive: false,
  },
  {
    key: "chart3m",
    blockName: "Charts",
    label: "3m Chart",
    name: "3m Chart",
    isActive: false,
  },
  {
    key: "chart6m",
    blockName: "Charts",
    label: "6m Chart",
    name: "6m Chart",
    isActive: false,
  },
  {
    key: "chart1y",
    blockName: "Charts",
    label: "1y Chart",
    name: "1y Chart",
    isActive: false,
  },

  {
    key: "athPrice",
    blockName: "ATH/ATL",
    label: "ATH Price",
    name: "ATH Price",
    isActive: false,
  },
  {
    key: "athDate",
    blockName: "ATH/ATL",
    label: "ATH Date",
    name: "ATH Date",
    isActive: false,
  },
  {
    key: "fromAth",
    blockName: "ATH/ATL",
    label: "% from ATH",
    name: "% from ATH",
    isActive: false,
  },
  {
    key: "atlPrice",
    blockName: "ATH/ATL",
    label: "ATL Price",
    name: "ATL Price",
    isActive: false,
  },
  {
    key: "atlDate",
    blockName: "ATH/ATL",
    label: "ATL Date",
    name: "ATL Date",
    isActive: false,
  },
  {
    key: "fromAtl",
    blockName: "ATH/ATL",
    label: "% from ATL",
    name: "% from ATL",
    isActive: false,
  },

  {
    key: "icoPlatform",
    blockName: "Fundraising & Vesting",
    label: "ICO Platform",
    name: "ICO Platform",
    isActive: false,
  },
  {
    key: "investors",
    blockName: "Fundraising & Vesting",
    label: "Investors",
    name: "Investors",
    isActive: false,
  },
  {
    key: "usdRoi",
    blockName: "Fundraising & Vesting",
    label: "USD ROI",
    name: "USD ROI",
    isActive: false,
  },
  {
    key: "btcRoi",
    blockName: "Fundraising & Vesting",
    label: "BTC ROI",
    name: "BTC ROI",
    isActive: false,
  },
  {
    key: "ethRoi",
    blockName: "Fundraising & Vesting",
    label: "ETH ROI",
    name: "ETH ROI",
    isActive: false,
  },
  {
    key: "unlockProgress",
    blockName: "Fundraising & Vesting",
    label: "Unlock Progress",
    name: "Unlock Progress",
    isActive: false,
  },
  {
    key: "nextUnlock",
    blockName: "Fundraising & Vesting",
    label: "Next Unlock",
    name: "Next Unlock",
    isActive: false,
  },
  {
    key: "nextUnlockDate",
    blockName: "Fundraising & Vesting",
    label: "Next Unlock Date",
    name: "Next Unlock Date",
    isActive: false,
  },
  {
    key: "totalFundsRaised",
    blockName: "Fundraising & Vesting",
    label: "Total Funds Raised",
    name: "Total Funds Raised",
    isActive: false,
  },

  {
    key: "category",
    blockName: "Other",
    label: "Category",
    name: "Category",
    isActive: false,
  },
  {
    key: "exchanges",
    blockName: "Other",
    label: "Exchanges",
    name: "Exchanges",
    isActive: false,
  },
  {
    key: "performance",
    blockName: "Other",
    label: "Performance",
    name: "Performance",
    isActive: false,
  },
  {
    key: "bullishPeriod",
    blockName: "Other",
    label: "Bullish Period",
    name: "Bullish Period",
    isActive: false,
  },
  {
    key: "launchDate",
    blockName: "Other",
    label: "Trade Launch Date",
    name: "Trade Launch Date",
    isActive: false,
  },
];
