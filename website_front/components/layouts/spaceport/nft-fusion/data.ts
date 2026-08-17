import mock1 from "../../../../assets/images/nft/alverse.png";
import mock2 from "../../../../assets/images/nft/cloud.png";
import mock3 from "../../../../assets/images/nft/humans.png";
import { NFTOption, FusionHistoryEntry } from "./types";

export const MOCK_NFTS: NFTOption[] = [
  {
    id: "1",
    tokenId: 1,
    name: "Nebula Warrior",
    number: 1523,
    rarity: "Common",
    image: mock1.src,
    rarityId: 4,
    rarityName: "Uncommon",
  },
  {
    id: "2",
    tokenId: 2,
    name: "Stardust",
    number: 125,
    rarity: "Rare",
    image: mock2.src,
    rarityId: 5,
    rarityName: "Rare",
  },
  {
    id: "3",
    tokenId: 3,
    name: "Cosmic Stellar",
    number: 365,
    rarity: "Epic",
    image: mock3.src,
    rarityId: 6,
    rarityName: "Epic",
  },
];

export const MOCK_HISTORY: FusionHistoryEntry[] = [
  {
    id: "h1",
    nft1: { name: "Nebula Warrior", number: 34, rarity: "Common" },
    nft2: { name: "Stardust", number: 125, rarity: "Rare" },
    result: { name: "Cosmic Stellar", number: 365, rarity: "Epic" },
    time: "1 day ago",
  },
  {
    id: "h2",
    nft1: { name: "Stardust", number: 125, rarity: "Rare" },
    nft2: { name: "Nebula Warrior", number: 34, rarity: "Common" },
    result: { name: "Cosmic Stellar", number: 365, rarity: "Epic" },
    time: "1 day ago",
  },
];
