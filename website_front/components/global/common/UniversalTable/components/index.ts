import { FC } from "react";
import { TableTypes } from "../types";
import type { UniversalTableCaseProps } from "./shared";
import OrdersRowContent from "./OrdersRowContent";
import CryptoRowContent from "./CryptoRowContent";
import FundingFeedRowContent from "./FundingFeedRowContent";
import BackersFundsRowContent from "./BackersFundsRowContent";
import FundsRowContent from "./FundsRowContent";
import UnlockingRowContent from "./UnlockingRowContent";
import ProjectsIcoRowContent from "./ProjectsIcoRowContent";
import RecentlyRowContent from "./RecentlyRowContent";
import AccumulationRowContent from "./AccumulationRowContent";
import GainersRowContent from "./GainersRowContent";
import PersonsRowContent from "./PersonsRowContent";
import TrendingRowContent from "./TrendingRowContent";
import RefsRowContent from "./RefsRowContent";
import CustomRowContent from "./CustomRowContent";
import OnchainTransfersRowContent from "./OnchainTransfersRowContent";
import InfluenceRelationsRowContent from "./InfluenceRelationsRowContent";
import InfluenceLinkedinRowContent from "./InfluenceLinkedinRowContent";
import InfluenceThreadsRowContent from "./InfluenceThreadsRowContent";
import InfluenceXRowContent from "./InfluenceXRowContent";
import InfluenceTiktokRowContent from "./InfluenceTiktokRowContent";
import InfluenceTelegramRowContent from "./InfluenceTelegramRowContent";
import InfluenceDiscordRowContent from "./InfluenceDiscordRowContent";
import InfluenceInstagramRowContent from "./InfluenceInstagramRowContent";
import DealsRowContent from "./DealsRowContent";
import OtcRowContent from "./OtcRowContent";
import FomonautsRowContent from "./FomonautsRowContent";

export const tableContentComponents: Partial<
  Record<TableTypes, FC<UniversalTableCaseProps>>
> = {
  orders: OrdersRowContent,
  crypto: CryptoRowContent,
  "funding-feed": FundingFeedRowContent,
  "backers-funds": BackersFundsRowContent,
  funds: FundsRowContent,
  unlocking: UnlockingRowContent,
  "projects-ico": ProjectsIcoRowContent,
  recently: RecentlyRowContent,
  accumulation: AccumulationRowContent,
  gainers: GainersRowContent,
  persons: PersonsRowContent,
  trending: TrendingRowContent,
  refs: RefsRowContent,
  custom: CustomRowContent,
  "onchain-transfers": OnchainTransfersRowContent,
  "influence-relations": InfluenceRelationsRowContent,
  "influence-linkedin": InfluenceLinkedinRowContent,
  "influence-threads": InfluenceThreadsRowContent,
  "influence-x": InfluenceXRowContent,
  "influence-tiktok": InfluenceTiktokRowContent,
  "influence-telegram": InfluenceTelegramRowContent,
  "influence-discord": InfluenceDiscordRowContent,
  "influence-instagram": InfluenceInstagramRowContent,
  deals: DealsRowContent,
  otc: OtcRowContent,
  fomonauts: FomonautsRowContent,
};
