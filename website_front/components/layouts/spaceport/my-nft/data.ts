import mock1 from "../../../../assets/images/nft/alverse.png";
import mock2 from "../../../../assets/images/nft/cloud.png";
import mock3 from "../../../../assets/images/nft/humans.png";
import mock4 from "../../../../assets/images/nft/shark.png";
import mock5 from "../../../../assets/images/nft/skull.png";
import { NFTAchievement } from "./NFTSingularityDetailsModal";
import { NFTRequirement } from "./NFTHiddenDetailsModal";
import { NFTItem, ShardItem, CrossingEntry } from "./types";
import { CrossingResultData } from "./CrossingModals";

export const FEATURED_NFT = {
  name: "Molten Guardian",
  number: "#2643",
  collection: "SharkRace Club",
  collectionAvatar: mock1,
  creator: "Jane Cooper",
  creatorAvatar: mock1,
  owner: "0x5d3...a8d5q1",
};

const DEFAULT_REWARDS = [
  {
    id: "r1",
    name: "Stardust Shard",
    date: "January 15, 2026",
    status: "Claimed" as const,
  },
  {
    id: "r2",
    name: "Cosmic Fragment",
    date: "January 15, 2026",
    status: "Pending" as const,
  },
];

const DEFAULT_STAKING_HISTORY = [
  { id: "sh1", name: "Early Unstake", date: "January 15, 2026", xp: "0" },
  { id: "sh2", name: "Staked", date: "January 15, 2026", xp: "5" },
  { id: "sh3", name: "Unstaked", date: "January 15, 2026", xp: "25" },
  { id: "sh4", name: "Staked", date: "January 15, 2026", xp: "5" },
];

const DEFAULT_PROPERTIES = [
  { label: "Type", value: "Explorer" },
  { label: "Element", value: "Cosmic" },
  { label: "Power", value: "250" },
  { label: "Level", value: "3" },
];

export const DEFAULT_ACHIEVEMENTS: NFTAchievement[] = [
  { emoji: "🏆", label: "Hall of Fame Member" },
  { emoji: "⚡", label: "Maximum XP Boost (x2.5)" },
  { emoji: "🗳️", label: "DAO Governance Access" },
  { emoji: "💎", label: "Priority Token Allocations" },
  { emoji: "🎯", label: "Exclusive Quest Access" },
];

const DEFAULT_SINGULARITY_REQUIREMENTS: NFTRequirement[] = [
  {
    title: "Reach Level 5",
    description: "5000+ XP required",
    progress: "4,012/5,000",
  },
  {
    title: "Collect all 7 Cosmic Badges",
    description: "Complete all badge challenges",
    progress: "5/7",
  },
  {
    title: "Complete special quest",
    description: '"Universe Merge" mission',
    progress: "0/1",
  },
  { title: "Obtain Burn Token", description: "Rare consumable item" },
];

const DEFAULT_SINGULARITY = {
  singularityNotice:
    "This NFT can ascend to Singularity - the ultimate form with maximum bonuses.",
  requirements: DEFAULT_SINGULARITY_REQUIREMENTS,
  benefits: [
    "XP Boost x2.5 (highest multiplier)",
    "DAO voting rights",
    "Exclusive Singularity quests",
    "Hall of Fame membership",
    "Maximum allocation priority",
  ],
  tradingRestriction:
    "Singularity applies trading restrictions (OTC only, 90-day lock)",
};

export const NFT_ITEMS: NFTItem[] = [
  {
    id: "1",
    name: "Molten Guardian",
    number: "#2643",
    rarity: "Epic",
    image: mock2.src,
    views: 234,
    floorPrice: "$100",
    hiddenRarity: true,
    priceEth: "$250",
    priceUsd: "ETH 0.136",
    staked: true,
    tokenId: "1",
    status: "Staked",
    floorPriceEth: "1.2 ETH",
    properties: DEFAULT_PROPERTIES,
    stakingHistory: DEFAULT_STAKING_HISTORY,
    rewards: DEFAULT_REWARDS,
    timeToNextLevel: "11 days",
    progressPercent: 66,
    totalStakedDays: 19,
    nextRewardUnlock: "2 days, 5 hours",
    ...DEFAULT_SINGULARITY,
  },
  {
    id: "2",
    name: "NFT Name",
    number: "#4600",
    rarity: "Rare",
    image: mock2.src,
    views: 456,
    floorPrice: "$100",
    hiddenRarity: true,
    priceEth: "$1000",
    priceUsd: "ETH 0.544",
    staked: false,
    tokenId: "2",
    status: "Unstaked",
    floorPriceEth: "0.5 ETH",
    properties: DEFAULT_PROPERTIES,
    stakingHistory: DEFAULT_STAKING_HISTORY,
    ...DEFAULT_SINGULARITY,
  },
  {
    id: "3",
    name: "NFT Name",
    number: "#153",
    rarity: "FOMO Gold",
    image: mock3.src,
    views: "1.2k",
    floorPrice: "$100",
    hiddenRarity: false,
    singularityRarity: true,
    priceEth: "ETH 1.00",
    priceUsd: "$1,838.04",
    staked: true,
    tokenId: "3",
    status: "Staked",
    floorPriceEth: "1.0 ETH",
    properties: DEFAULT_PROPERTIES,
    stakingHistory: DEFAULT_STAKING_HISTORY,
    rewards: DEFAULT_REWARDS,
    congratsNotice:
      "Congratulations! You have reached Singularity - the ultimate NFT form.",
    achievements: DEFAULT_ACHIEVEMENTS,
    tradingRestrictions: [
      "Trading available via OTC marketplace only",
      "External marketplace transfers reset badges",
      "90-day trading lock may apply after transformation",
    ],
  },
  {
    id: "4",
    name: "NFT Name",
    number: "#53",
    rarity: "Legendary",
    image: mock4.src,
    views: 234,
    floorPrice: "$100",
    hiddenRarity: true,
    priceEth: "ETH 0.25",
    priceUsd: "$459.51",
    staked: false,
    tokenId: "4",
    status: "Unstaked",
    floorPriceEth: "0.25 ETH",
    properties: DEFAULT_PROPERTIES,
    stakingHistory: DEFAULT_STAKING_HISTORY,
    ...DEFAULT_SINGULARITY,
  },
  {
    id: "5",
    name: "NFT Name",
    number: "#53",
    rarity: "Legendary",
    image: mock5.src,
    views: 234,
    floorPrice: "$100",
    hiddenRarity: true,
    priceEth: "ETH 0.25",
    priceUsd: "$459.51",
    staked: false,
    tokenId: "5",
    status: "Unstaked",
    floorPriceEth: "0.25 ETH",
    properties: DEFAULT_PROPERTIES,
    stakingHistory: DEFAULT_STAKING_HISTORY,
    ...DEFAULT_SINGULARITY,
  },
];

export const SHARD_ITEMS: ShardItem[] = [
  {
    id: "1",
    name: "Stardust Shard",
    rarity: "Common",
    image: mock1.src,
    selected: true,
  },
  {
    id: "2",
    name: "Cosmic Crystal",
    rarity: "Common",
    image: mock1.src,
    selected: false,
  },
  {
    id: "3",
    name: "Nebula Fragment",
    rarity: "Common",
    image: mock1.src,
    selected: false,
  },
  {
    id: "4",
    name: "Stellar Essence",
    rarity: "Common",
    image: mock1.src,
    selected: false,
  },
  {
    id: "5",
    name: "Galaxy Core",
    rarity: "Rare",
    image: mock1.src,
    selected: false,
  },
  {
    id: "6",
    name: "Cosmic Crystal",
    rarity: "Epic",
    image: mock1.src,
    selected: false,
  },
  {
    id: "7",
    name: "Galaxy Spark",
    rarity: "Rare",
    image: mock1.src,
    selected: false,
  },
];

export const CROSSING_HISTORY: CrossingEntry[] = [
  {
    id: "1",
    inputs: [
      { name: "Nebula Fragment", rarity: "Common" },
      { name: "Stardust Shard", rarity: "Rare" },
      { name: "Cosmic Crystal", rarity: "Common" },
    ],
    output: { name: "Galaxy Core", rarity: "Epic" },
    time: "1 day ago",
  },
  {
    id: "2",
    inputs: [
      { name: "Stardust Shard", rarity: "Common" },
      { name: "Cosmic Crystal", rarity: "Common" },
    ],
    output: { name: "Nebula Fragment", rarity: "Rare" },
    time: "2 days ago",
  },
];

export const MOCK_CROSSING_RESULT: CrossingResultData = {
  name: "Black Stone",
  rarity: "Epic",
  image: mock5.src,
  level: 3,
};
