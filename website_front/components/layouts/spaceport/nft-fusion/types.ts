export type Rarity = "Common" | "Rare" | "Epic" | "Legendary" | "FOMO Gold";

export interface NFTOption {
  id: string;
  tokenId: number;
  name: string;
  number: number;
  rarity: Rarity;
  image: string;
  rarityId: number;
  rarityName: string;
  tokenUri?: string;
}

export interface FusionHistoryEntry {
  id: string;
  nft1: { name: string; number: number; rarity: Rarity };
  nft2: { name: string; number: number; rarity: Rarity };
  result: { name: string; number: number; rarity: Rarity };
  time: string;
}
