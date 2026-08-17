import { ReactNode } from "react";
import { INftDisplayCurrency } from "../../../../../types/global_types";

export const NFT_PAGE_TABS = ["Info", "Price", "Offers"] as const;

export type NFTPageTab = (typeof NFT_PAGE_TABS)[number];

export interface NFTPageTimerItem {
  value: string;
  unit: string;
}

export interface NFTPageDetailsData {
  cartId: string;
  title: string;
  tokenId: string;
  rarity: string;
  views: string;
  collectionName: string;
  collectionAvatar: string;
  creatorName: string;
  creatorAvatar: string;
  description: string;
  image: string;
  priceAmount: number;
  priceUsd: number;
  currency: INftDisplayCurrency;
  endDate?: Date | string | null;
}

export interface NFTPageInfoRow {
  label: string;
  value: ReactNode;
  copyValue?: string;
}

export interface NFTPagePricePoint {
  id: string;
  date: string;
  price: number;
  priceUsd: number;
  currency: INftDisplayCurrency;
}

export interface NFTPageOffer {
  id: string;
  userName: string;
  avatar: string;
  price: number;
  priceUSD: number;
  currency: INftDisplayCurrency;
  time: string;
  canCancel: boolean;
  canConfirm: boolean;
  canBuy: boolean;
  isConfirmed: boolean;
  isExpired: boolean;
  status: string;
  smartOrderId?: number;
}

export interface NFTPageActivity {
  id: string;
  type: string;
  status: string;
  itemImage: string;
  collectionName: string;
  itemName: string;
  price: number;
  priceUSD: number;
  currency: INftDisplayCurrency;
  from: string;
  to: string;
  date: string;
}
