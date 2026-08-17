import boxHero from "../../../../assets/images/image 28.png";
import uncommonBox from "../../../../assets/images/box1.png";
import epicBox from "../../../../assets/images/box2.png";
import legendaryBox from "../../../../assets/images/box3.png";

export type BoxType = "uncommon" | "epic" | "legendary";

export interface BoxData {
  type: BoxType;
  name: string;
  remaining: number;
  total: number;
  price: number;
  image: string;
  badgeLabel?: string;
  dropChances: { rarity: string; chance: number }[];
}

export interface PossibleRarityBoxData {
  type: BoxType;
  name: string;
  image: string;
  chance: number;
  dropChances: { label: string; chance: number }[];
}

export const BOXES_DATA: BoxData[] = [
  {
    type: "uncommon",
    name: "FOMO NFT Box",
    remaining: 666,
    total: 666,
    price: 100,
    image: boxHero.src,
    dropChances: [
      { rarity: "Uncommon NFT", chance: 70 },
      { rarity: "Epic NFT", chance: 29 },
      { rarity: "Legendary NFT", chance: 1 },
    ],
  },
];

export const HOW_IT_WORKS_STEPS = [
  { number: 1, title: "Purchase Box", description: "Buy 1-4 boxes" },
  { number: 2, title: "Open Box", description: "Reveal your NFT or shards" },
  {
    number: 3,
    title: "Collect & Fuse",
    description: "4 shards = 1 complete NFT",
  },
  { number: 4, title: "Stake & Earn", description: "Stake for XP and rewards" },
];

export const POSSIBLE_RARITY_BOXES: PossibleRarityBoxData[] = [
  {
    type: "uncommon",
    name: "Uncommon Box",
    image: uncommonBox.src,
    chance: 70,
    dropChances: [
      { label: "Uncommon NFT", chance: 50 },
      { label: "NFT Shards (4x)", chance: 50 },
    ],
  },
  {
    type: "epic",
    name: "Epic Box",
    image: epicBox.src,
    chance: 29,
    dropChances: [
      { label: "Epic NFT", chance: 20 },
      { label: "Rare NFT", chance: 35 },
      { label: "Uncommon NFT", chance: 44 },
      { label: "Legendary NFT", chance: 1 },
    ],
  },
  {
    type: "legendary",
    name: "Legendary Box",
    image: legendaryBox.src,
    chance: 1,
    dropChances: [
      { label: "Legendary NFT", chance: 5 },
      { label: "Epic NFT", chance: 40 },
      { label: "Rare NFT", chance: 55 },
    ],
  },
];
