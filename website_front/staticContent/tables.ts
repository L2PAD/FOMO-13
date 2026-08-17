import { ISortHeaderItem } from "../components/global/common/UniversalTable";
import { oneWeekInMs } from "../components/global/Filter/otc_filter";
import { IProject } from "../types/global_types";

export const cryptoMarketSortHeaders: Array<ISortHeaderItem> = [
  {
    label: "№",
    type: "div",
  },
  {
    label: "Asset",
  },
  {
    label: "Price",
  },
  {
    label: "1h",
  },
  {
    label: "24h",
  },
  {
    label: "7d",
  },
  {
    label: "Market Cap",
  },
  {
    label: "Volume (24h)",
  },
  {
    label: "Circulating Supply",
  },
  {
    label: "Last 7 days",
    type: "div",
  },
];

export const recentlyAddedSortHeaders: Array<ISortHeaderItem> = [
  {
    label: "№",
    type: "div",
  },
  {
    label: "Asset",
    type: "div",
  },
  {
    label: "Price",
  },
  {
    label: "1h",
  },
  {
    label: "24h",
  },
  {
    label: "7d",
  },
  {
    label: "Market Cap",
  },
  {
    label: "Volume (24h)",
  },
  {
    label: "Circulating Supply",
  },
  {
    label: "Launch Date",
    type: "div",
  },
];

export const gainersSortHeaders: Array<ISortHeaderItem> = [
  {
    label: "№",
    type: "div",
  },
  {
    label: "Asset",
    type: "div",
  },
  {
    label: "Price",
  },
  {
    label: "1h",
  },
  {
    label: "24h",
  },
  {
    label: "7d",
  },
  {
    label: "Market Cap",
  },
  {
    label: "Volume (24h)",
  },
  {
    label: "Circulating Supply",
  },
  {
    label: "Last 7 days",
    type: "div",
  },
];

export const trandingSortHeaders: Array<ISortHeaderItem> = [
  {
    label: "№",
    type: "div",
  },
  {
    label: "Asset",
    type: "div",
  },
  {
    label: "Category",
    type: "div",
  },
  {
    label: "Price",
  },
  {
    label: "1h",
  },
  {
    label: "24h",
  },
  {
    label: "7d",
  },
  {
    label: "Market Cap",
  },
  {
    label: "Volume (24h)",
  },
  {
    label: "Circulating Supply",
  },
];

export const accumulationSortHeaders: Array<ISortHeaderItem> = [
  {
    label: "№",
    type: "div",
  },
  {
    label: "Asset",
    type: "div",
  },
  {
    label: "Accumulation",
  },
  {
    label: "Volume Change",
  },
  {
    label: "Price Change",
  },
  {
    label: "Market Cap",
  },
  {
    label: "Last 7 days",
  },
];

export const fundingFeedSortHeader: Array<ISortHeaderItem> = [
  {
    label: "№",
    type: "div",
  },
  {
    label: "Project",
    type: "div",
  },
  {
    label: "Type",
    type: "div",
  },
  {
    label: "Funds raised",
    type: "div",
  },
  {
    label: "Pre-valuation",
  },
  {
    label: "Investors",
    type: "div",
  },
  {
    label: "Category",
    type: "div",
  },
  {
    label: "Last Funding",
    type: "div",
  },
  {
    label: "Token",
    type: "div",
  },
  {
    label: "Red flags",
    type: "div",
  },
  {
    label: "FOMO Score",
  },
];

export const orderdSortHeader: Array<ISortHeaderItem> = [
  {
    label: "ID",
    type: "div",
  },
  {
    label: "Project",
    type: "div",
  },
  {
    label: "Alloc size (USDT)",
    type: "div",
  },
  {
    label: "Order Type",
    type: "div",
  },
  {
    label: "Date & Time",
    type: "div",
  },
  {
    label: "Status",
    type: "div",
  },
];

export const projectsIcoSortHeader: Array<ISortHeaderItem> = [
  {
    label: "№",
    type: "div",
  },
  {
    label: "Project",
    type: "div",
  },
  {
    label: "Category",
    type: "div",
  },
  {
    label: "Status",
    type: "div",
  },
  {
    label: "Platform",
    type: "div",
  },
  {
    label: "Total Raised",
    type: "div",
  },
  {
    label: "Type",
    type: "div",
  },
  {
    label: "Last Funding",
    type: "div",
  },
  {
    label: "Investors",
    type: "div",
  },
  {
    label: "Red flags",
    type: "div",
  },
  {
    label: "FOMO Score",
    type: "div",
  },
];

export const fomonaudsSortHeader: Array<ISortHeaderItem> = [
  {
    label: "№",
    type: "div",
  },
  {
    label: "Name",
    type: "div",
  },
  {
    label: "Wallet Address",
    type: "div",
  },
  {
    label: "Followers",
    type: "div",
  },
  {
    label: "NFT",
    type: "div",
  },
  {
    label: "Rank",
    type: "div",
  },
  {
    label: "XP",
    type: "div",
    textAlign: "right",
  },
  {
    label: "Verification",
    type: "div",
  },
  {
    label: "Red flags",
    type: "div",
  },
  {
    label: "FOMO Score",
    type: "div",
  },
  {
    label: "Contacts",
    type: "div",
  },
];

export const personsSortHeader: Array<ISortHeaderItem> = [
  {
    label: "№",
    type: "div",
  },
  {
    label: "Persons",
    type: "div",
  },
  {
    label: "Specialization",
    type: "div",
  },
  {
    label: "ATH ROI",
    type: "div",
  },
  {
    label: "Investments",
    type: "div",
  },
  {
    label: "Location",
    type: "div",
  },
  {
    label: "Red flags",
    type: "div",
  },
  {
    label: "FOMO Score",
    type: "div",
  },
  {
    label: "Contacts",
    type: "div",
  },
];

export const backersPersonsSortHeader: Array<ISortHeaderItem> = [
  {
    label: "в„–",
    type: "div",
  },
  {
    label: "Persons",
    type: "div",
  },
  {
    label: "Specialization",
    type: "div",
  },
  {
    label: "ATH ROI",
  },
  {
    label: "Investments",
  },
  {
    label: "Location",
    type: "div",
  },
  {
    label: "Red flags",
    type: "div",
  },
  {
    label: "FOMO Score",
  },
  {
    label: "Contacts",
    type: "div",
  },
];

export const fundsSortHeader: Array<ISortHeaderItem> = [
  {
    label: "№",
    type: "div",
  },
  {
    label: "Fund Name",
    type: "div",
  },
  {
    label: "Investment Amount",
    type: "div",
  },
  {
    label: "Projects Supported",
    type: "div",
  },
  {
    label: "Region",
    type: "div",
  },
  {
    label: "Date Founded",
    type: "div",
  },
  {
    label: "Contacts",
    type: "div",
  },
];

export const backersFundsSortHeader: Array<ISortHeaderItem> = [
  {
    label: "№",
    type: "div",
  },
  {
    label: "Fund Name",
    type: "div",
  },
  {
    label: "Invested Amount",
  },
  {
    label: "ROI",
  },
  {
    label: "Projects Supported",
  },
  {
    label: "Region",
    type: "div",
  },
  {
    label: "Rating",
  },
  {
    label: "Fullness",
  },
  {
    label: "Contacts",
    type: "div",
  },
];

export const unlockingSortHeaders: Array<ISortHeaderItem> = [
  {
    label: "№",
    type: "div",
  },
  {
    label: "Asset",
    type: "div",
  },
  {
    label: "Price",
  },
  {
    label: "Market Cap Short",
  },
  {
    label: "Circulating Supply",
  },
  {
    label: "Next Unlock",
  },
  {
    label: "Unlock Progress",
  },
  {
    label: "Date",
  },
  {
    label: "Actions",
    type: "div",
  },
];

export const refListLvlOneSortHeaders: Array<ISortHeaderItem> = [
  {
    label: "№",
    type: "div",
  },
  {
    type: "div",
    label: "Name",
  },
  {
    type: "div",
    label: "Username",
  },
  {
    type: "div",
    label: "Wallet Address",
  },
  {
    type: "div",
    label: "User ID",
  },
  {
    type: "div",
    label: "Joined Date",
  },
  {
    type: "div",
    label: "Status",
  },
  {
    type: "div",
    label: "L1 Refferals",
  },
];

export const dealsSortHeaders: Array<ISortHeaderItem> = [
  {
    type: "div",
    label: "Deal ID",
  },
  {
    type: "div",
    label: "Asset",
  },
  {
    type: "div",
    label: "Amount",
  },
  {
    type: "div",
    label: "Type",
  },
  {
    type: "div",
    label: "Price per Unit",
  },
  {
    label: "Total",
    type: "div",
  },
  {
    label: "Buyer / Seller",
    type: "div",
  },
  {
    label: "Date & Time",
    type: "div",
  },
  {
    label: "Status",
    type: "div",
  },
];

export const personsGridColumns =
  "0.4fr 0.4fr 2.2fr 1.45fr 1.2fr 1.2fr 1.7fr 0.8fr 1.3fr 1.7fr";

export const cryptoMarketGridColumns =
  "0.35fr 0.3fr 1.75fr 1.5fr 0.7fr 0.7fr 1fr 1.5fr 1.3fr 2fr 1.4fr";

export const trendingGridColumns =
  "0.35fr 0.3fr 1.6fr 1.2fr 1.3fr 0.7fr 1fr 1.5fr 1.3fr 2fr 1.8fr";

export const accumulationGridColumns = "0.35fr 0.3fr 1.6fr 2fr 2fr 2fr 2fr 1fr";

export const fundingFeedGridColumns =
  "0.35fr 0.4fr 2fr 1.1fr 1fr 1.3fr 1.2fr 1.2fr 1.05fr 0.65fr 0.7fr 1fr";

export const ordersGridColumns = "0.35fr 1fr 1.5fr 1.1fr 1fr 1fr";

export const projectsIcoGridColumns =
  "0.35fr 0.4fr 1.5fr 1.1fr 0.75fr 1.2fr 0.9fr 1.3fr 1.2fr 0.85fr 0.75fr 1fr 0.4fr";

export const fomonaudsGridColumns =
  "0.35fr 0.4fr 2fr 1.45fr 0.8fr 0.45fr 1.5fr 0.8fr 0.9fr 0.8fr 1.3fr 1.3fr";

export const fundingFeedGridRowColumns =
  "0.35fr 0.4fr 2fr 1.1fr 1fr 1.3fr 1.2fr 1.2fr 1.05fr 0.65fr 0.7fr 0.5fr 0.4fr";

export const projectsIcoGridRowColumns =
  "0.35fr 0.4fr 1.47fr 1.1fr 0.75fr 1.2fr 0.9fr 1.3fr 1.2fr 0.85fr 0.75fr 1fr 0.4fr";

export const fundsGridColumns = "0.35fr 0.3fr 2fr 1.4fr 1.4fr 1.4fr 1.4fr 1fr";

export const backersFundsGridColumns =
  "0.35fr 0.3fr 2fr 1.05fr 0.85fr 1.35fr 1.45fr 0.58fr 0.62fr 1fr";

export const unlockingGridColumns =
  "0.35fr 0.3fr 1.35fr 1fr 0.78fr 1.35fr 1.38fr 1.2fr 1.04fr 0.6fr";

export const refLinksGridColumns =
  "0.35fr 0.3fr 3.2fr 1.4fr 1.4fr 1.4fr 1.4fr 1.4fr 1.4fr";

export const dealsGridColumns = "1fr 1fr 1fr 1fr 1.4fr 1.4fr 2fr 2fr 1.6fr";

export const unlockingMockData: Array<any> = [
  {
    _id: 1,
    name: "Token A",
    niche: "TKNA",
    price: 1.25,
    priceChange: -0.5,
    totalSupply: 35000000,
    totalSupplyChange: 35,
    logo: "https://s2.coinmarketcap.com/static/img/coins/64x64/1.png",
    marketCap: 350000000,
    banner: "",
    publicVestingValue: 7.5,
    publicVestingDate: new Date(new Date().getTime() - oneWeekInMs * 5),
    stage: "Ongoing unlock",
    historicalUnlockValue: 10,
    historicalUnlockDate: new Date(new Date().getTime() - oneWeekInMs * 2),
    nextUnlockValue: 10,
    nextUnlockDate: new Date(new Date().getTime() - oneWeekInMs * 2),
    investorts: [],
  },
  {
    _id: 2,
    name: "Token A",
    niche: "TKNA",
    price: 1.25,
    priceChange: -0.5,
    totalSupply: 35000000,
    totalSupplyChange: 35,
    logo: "https://s2.coinmarketcap.com/static/img/coins/64x64/1.png",
    marketCap: 350000000,
    banner: "",
    publicVestingValue: 7.5,
    publicVestingDate: new Date(new Date().getTime() - oneWeekInMs * 5),
    stage: "Ongoing unlock",
    historicalUnlockValue: 10,
    historicalUnlockDate: new Date(new Date().getTime() - oneWeekInMs * 2),
    nextUnlockValue: 10,
    nextUnlockDate: new Date(new Date().getTime() - oneWeekInMs * 2),
    investorts: [],
  },
  {
    _id: 3,
    name: "Token A",
    niche: "TKNA",
    price: 1.25,
    priceChange: -0.5,
    totalSupply: 35000000,
    totalSupplyChange: 35,
    logo: "https://s2.coinmarketcap.com/static/img/coins/64x64/1.png",
    marketCap: 350000000,
    banner: "",
    publicVestingValue: 7.5,
    publicVestingDate: new Date(new Date().getTime() - oneWeekInMs * 5),
    stage: "Ongoing unlock",
    historicalUnlockValue: 10,
    historicalUnlockDate: new Date(new Date().getTime() - oneWeekInMs * 2),
    nextUnlockValue: 10,
    nextUnlockDate: new Date(new Date().getTime() - oneWeekInMs * 2),
    investorts: [],
  },
  {
    _id: 4,
    name: "Token A",
    niche: "TKNA",
    price: 1.25,
    priceChange: -0.5,
    totalSupply: 35000000,
    totalSupplyChange: 35,
    logo: "https://s2.coinmarketcap.com/static/img/coins/64x64/1.png",
    marketCap: 350000000,
    banner: "",
    publicVestingValue: 7.5,
    publicVestingDate: new Date(new Date().getTime() - oneWeekInMs * 5),
    stage: "Ongoing unlock",
    historicalUnlockValue: 10,
    historicalUnlockDate: new Date(new Date().getTime() - oneWeekInMs * 2),
    nextUnlockValue: 10,
    nextUnlockDate: new Date(new Date().getTime() - oneWeekInMs * 2),
    investorts: [],
  },
  {
    _id: 5,
    name: "Token A",
    niche: "TKNA",
    price: 1.25,
    priceChange: -0.5,
    totalSupply: 35000000,
    totalSupplyChange: 35,
    logo: "https://s2.coinmarketcap.com/static/img/coins/64x64/1.png",
    marketCap: 350000000,
    banner: "",
    publicVestingValue: 7.5,
    publicVestingDate: new Date(new Date().getTime() - oneWeekInMs * 5),
    stage: "Ongoing unlock",
    historicalUnlockValue: 10,
    historicalUnlockDate: new Date(new Date().getTime() - oneWeekInMs * 2),
    nextUnlockValue: 10,
    nextUnlockDate: new Date(new Date().getTime() - oneWeekInMs * 2),
    investorts: [],
  },
  {
    _id: 6,
    name: "Token A",
    niche: "TKNA",
    price: 1.25,
    priceChange: -0.5,
    totalSupply: 35000000,
    totalSupplyChange: 35,
    logo: "https://s2.coinmarketcap.com/static/img/coins/64x64/1.png",
    marketCap: 350000000,
    banner: "",
    publicVestingValue: 7.5,
    publicVestingDate: new Date(new Date().getTime() - oneWeekInMs * 5),
    stage: "Ongoing unlock",
    historicalUnlockValue: 10,
    historicalUnlockDate: new Date(new Date().getTime() - oneWeekInMs * 2),
    nextUnlockValue: 10,
    nextUnlockDate: new Date(new Date().getTime() - oneWeekInMs * 2),
    investorts: [],
  },
  {
    _id: 7,
    name: "Token A",
    niche: "TKNA",
    price: 1.25,
    priceChange: -0.5,
    totalSupply: 35000000,
    totalSupplyChange: 35,
    logo: "https://s2.coinmarketcap.com/static/img/coins/64x64/1.png",
    marketCap: 350000000,
    banner: "",
    publicVestingValue: 7.5,
    publicVestingDate: new Date(new Date().getTime() - oneWeekInMs * 5),
    stage: "Ongoing unlock",
    historicalUnlockValue: 10,
    historicalUnlockDate: new Date(new Date().getTime() - oneWeekInMs * 2),
    nextUnlockValue: 10,
    nextUnlockDate: new Date(new Date().getTime() - oneWeekInMs * 2),
    investorts: [],
  },
  {
    _id: 8,
    name: "Token A",
    niche: "TKNA",
    price: 1.25,
    priceChange: -0.5,
    totalSupply: 35000000,
    totalSupplyChange: 35,
    logo: "https://s2.coinmarketcap.com/static/img/coins/64x64/1.png",
    marketCap: 350000000,
    banner: "",
    publicVestingValue: 7.5,
    publicVestingDate: new Date(new Date().getTime() - oneWeekInMs * 5),
    stage: "Ongoing unlock",
    historicalUnlockValue: 10,
    historicalUnlockDate: new Date(new Date().getTime() - oneWeekInMs * 2),
    nextUnlockValue: 10,
    nextUnlockDate: new Date(new Date().getTime() - oneWeekInMs * 2),
    investorts: [],
  },
  {
    _id: 9,
    name: "Token A",
    niche: "TKNA",
    price: 1.25,
    priceChange: -0.5,
    totalSupply: 35000000,
    totalSupplyChange: 35,
    logo: "https://s2.coinmarketcap.com/static/img/coins/64x64/1.png",
    marketCap: 350000000,
    banner: "",
    publicVestingValue: 7.5,
    publicVestingDate: new Date(new Date().getTime() - oneWeekInMs * 5),
    stage: "Ongoing unlock",
    historicalUnlockValue: 10,
    historicalUnlockDate: new Date(new Date().getTime() - oneWeekInMs * 2),
    nextUnlockValue: 10,
    nextUnlockDate: new Date(new Date().getTime() - oneWeekInMs * 2),
    investorts: [],
  },
  {
    _id: 10,
    name: "Token A",
    niche: "TKNA",
    price: 1.25,
    priceChange: -0.5,
    totalSupply: 35000000,
    totalSupplyChange: 35,
    logo: "https://s2.coinmarketcap.com/static/img/coins/64x64/1.png",
    marketCap: 350000000,
    banner: "",
    publicVestingValue: 7.5,
    publicVestingDate: new Date(new Date().getTime() - oneWeekInMs * 5),
    stage: "Ongoing unlock",
    historicalUnlockValue: 10,
    historicalUnlockDate: new Date(new Date().getTime() - oneWeekInMs * 2),
    nextUnlockValue: 10,
    nextUnlockDate: new Date(new Date().getTime() - oneWeekInMs * 2),
    investorts: [],
  },
];
