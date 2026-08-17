import React, { FC, useContext, useEffect, useState } from "react";
import { useRouter } from "next/router";
import { AuthContext } from "../../../../../global/Layout";
import BreadCrumbs from "../../../../../global/BreadCrumbs";
import { ProjectDetailsData } from "./types";
import { getActivityRichTextHtml } from "../../../../../../helpers/activityRichText";
import { sanitizedHtml } from "../../../../../../helpers/sanitizeHtml";
import FeedCard from "../Feed/FeedCard";
import {
  LeftColumn,
  RightColumn,
  Card,
  HeroTop,
  HeroLeft,
  ProjectLogo,
  ProjectInfo,
  ProjectName,
  TypeRow,
  ProjectType,
  StatusBadge,
  HeroActions,
  ActionButton,
  StatsBanner,
  StatItem,
  StatLabel,
  StatValue,
  HoverTooltipValue,
  TaskTypeBadge,
  ProgressSection,
  DateRow,
  DateGroup,
  DateLabel,
  DateValue,
  ProgressBarWrapper,
  ProgressBarFill,
  SocialRow,
  SocialButton,
  SocialLinkButton,
  SectionTitle,
  SectionTitleRow,
  AboutTextBlock,
  RaisedBanner,
  RaisedLeft,
  RaisedTextGroup,
  RaisedLabel,
  RaisedValue,
  FundingTypeGroup,
  ReviewText,
  ScoresRow,
  ScoreCard,
  ScoreLabel,
  ScoreValue,
  TaskTitle,
  TaskDescription,
  TaskDivider,
  TaskProgressRow,
  TaskProgressLabel,
  TaskProgressValue,
  TaskProgressSteps,
  TaskProgressBarWrap,
  TaskProgressBarFill,
  TaskMetaRow,
  TaskMetaItem,
  TaskMetaText,
  StepsHeading,
  StepCard,
  StepLeftCol,
  StepNumberBadge,
  StepNumberText,
  StepCheckButton,
  StepContent,
  StepCardTitle,
  StepCardText,
  StepCardImage,
  StepTimeCol,
  StepTimeText,
  StepCtaGreen,
  SuccessMessage,
  StepCtaGray,
  DailyTaskBanner,
  DailyTaskLeft,
  DailyTaskLabel,
  DailyTaskSubtitle,
  DailyTaskTimer,
  DailyTimerUnit,
  DailyTimerBox,
  DailyTimerSep,
  WeekPhasesRow,
  WeekPhaseCard,
  WeekPhaseTitle,
  WeekPhaseSubtitle,
  WeekPhaseStatusText,
  WeekPhaseLockRow,
  StepLockedText,
  RepeatableBanner,
  RepeatableBannerLeft,
  RepeatableBannerTitle,
  RepeatableBannerSubtitle,
  RepeatableBannerRight,
  RepeatableCyclesGroup,
  RepeatableCyclesCount,
  RepeatableCyclesLabel,
  NewCycleBtn,
  ExpiredBanner,
  ExpiredBannerLeft,
  ExpiredBannerTitle,
  ExpiredBannerSubtitle,
  ExpiredBannerStatus,
  TaskMetaDeadline,
  BlurOverlay,
  LockedTitle,
  LockedSubtitle,
  MetricRow,
  MetricLabel,
  MetricValue,
  FlagList,
  FlagItemRow,
  FlagText,
  FlagDivider,
  FlagCountBadge,
  SimilarSection,
  SimilarSectionTitle,
  SimilarGrid,
} from "./styles";
import { PageWrapper } from "../../../CryptoMarket/styles";
import { useSelector } from "react-redux";
import { authState } from "../../../../../../store/slices/authSlice";
import ActivityTasksBlock from "../ActivityTasksBlock";
import ActivityDiscussion from "./ActivityDiscussion";
import Image from "next/image";
import {
  GlobeIcon,
  TwitterIcon,
  TelegramIcon,
  DiscordIcon, LinkSmIcon,
  CalendarIcon,
  ThumbsUpIcon, ThumbsDownIcon, FlagActionIcon, StarIcon, BullishIcon,
  LockSmIcon, GoldMedalIcon, FlagBullet, AirdropIcon,
  ClockSmIcon,
  CopySmIcon, LockMiniIcon, LockIcon, RefreshIcon, AlertTriangleIcon,
} from "../../../../../global/Icons/Earlyland/icons";
import SparklesIcon from "../../../../../global/Icons/SparklesIcon";
import GridIcon from "../../../../../global/Icons/GridIcon";
import TaskIcon from "../../../../../global/Icons/TaskIcon";
import { useTranslation } from "i18n";
import { toast } from "react-toastify";

/*
  id: "zklink-nova",
  projectName: "zkLink Nova",
  type: "Testnet",
  status: "Active",
  isFavourite: false,
  cost: "Free",
  category: "DeFi",
  difficulty: "Easy",
  reward: "High Potential",
  taskType: "One-time task",
  startDate: "Oct 01, 2025",
  endDate: "Mar 10, 2026",
  progress: 78,
  totalRaised: "$18.4M",
  fundingType: "Seed, Series A",
  socialLinks: [
    { type: "website", url: "https://zklink.io" },
    { type: "twitter", url: "https://twitter.com/zkLinkNova" },
    { type: "telegram", url: "https://t.me/zkLinkNova" },
    { type: "discord", url: "https://discord.gg/zkLink" },
    { type: "custom", url: "https://zklink.io/docs" },
  ],
  aboutText:
    "zkLink Nova is a blockchain network designed to serve as the first aggregated Layer-3 (L3) zkEVM Rollup built on top of Ethereum and various Ethereum Layer-2 (L2) rollups. It's part of the zkLink ecosystem and aims to unify and streamline liquidity, assets, and decentralized applications (DApps) across multiple Ethereum scaling networks.\n\nHere's a clear breakdown of what it is and why it matters:\n\n- **Layer-3 zkEVM Rollup:** Nova is a Layer-3 network, meaning it sits above Ethereum L1 and multiple L2s (like Arbitrum, zkSync, Linea, etc.). It uses zero-knowledge proof technology (ZK) — specifically the zkSync 'ZK Stack' — to bundle transactions and verify them efficiently, inheriting Ethereum's security.\n\n- **Aggregated Liquidity & Interoperability:** One of Nova's key innovations is aggregating fragmented assets from many Ethereum L2s into a single network, enabling interoperable transactions and shared liquidity.",
  reviewText:
    "Our research team has analyzed this project extensively. zkLink Nova shows strong fundamentals with backing from top-tier investors. The team has a proven track record and the technology demonstrates real innovation in the space. We rate this opportunity as HIGH POTENTIAL based on our proprietary scoring methodology.",
  reviewScores: [
    { label: "Team Score", value: "9/10" },
    { label: "Technology", value: "8.5/10" },
  ],
  isReviewLocked: false,
  riskLevel: "Low",
  riskLevelColor: "green",
  complexity: "Easy",
  timeRequired: "20-30 min/day",
  potentialReward: "High",
  potentialRewardColor: "green",
  timeline: [
    { label: "Testnet Launch", date: "Dec 01, 2025 at 12:00 UTC" },
    { label: "Phase 2 Start", date: "Mar 15, 2026 at 00:00 UTC" },
    { label: "Mainnet Expected", date: "Jul 05, 2026 at 00:00 UTC" },
  ],
  greenFlags: [
    { text: "Support for multiple blockchains with diverse protocols" },
    { text: "Strong partnerships" },
    { text: "Solid team" },
    { text: "Detailed roadmap" },
    { text: "Regular updates and communication" },
    { text: "Active community engagement" },
    { text: "Established track record in the market" },
  ],
  yellowFlags: [
    { text: "Support for multiple blockchains with diverse protocols" },
    { text: "Strong partnerships" },
    { text: "Solid team" },
  ],
  redFlags: [
    { text: "No support for multiple blockchains with diverse protocols" },
    { text: "Lack of strong partnerships" },
  ],
  taskTitle: "What You Need to Do",
  taskDescription:
    "Bridge assets and interact with zkLink Nova testnet to increase your chances for future rewards.",
  taskProgress: 67,
  taskCompletedSteps: 4,
  taskTotalSteps: 6,
  steps: [
    {
      title: "Connect a Wallet",
      description:
        "Click the 'Connect Wallet' button in the top right-hand corner of the screen to set a secure connection with the wallet of your choice. Use any you like!",
      image: step1Img as unknown as string,
      timeEstimate: "2 min",
      isCompleted: true,
      ctaType: "website",
      ctaUrl: "https://zklink.io",
      ctaLabel: "Open website",
    },
    {
      title: "Choose Tokens to Exchange",
      description:
        "Specify which tokens you want to exchange. To specify which tokens you want to receive, click on the necessary network and the USDT token within that network.",
      image: step2Img as unknown as string,
      timeEstimate: "3 min",
      isCompleted: true,
      ctaType: "website",
      ctaUrl: "https://zklink.io",
      ctaLabel: "Open website",
    },
    {
      title: "Check the Recipient Address",
      description:
        "If you want to change the recipient's address, click the 'Receive <token> to another wallet' button.",
      image: step3Img as unknown as string,
      timeEstimate: "1 min",
      isCompleted: true,
      ctaType: "address",
      ctaAddress: "0xAbcd4 . . . 9f12",
    },
    {
      title: "Enter the Amount",
      description:
        "Specify the amount of the currency you want to move. Our system will calculate the corresponding token amount you'll receive based on the current exchange rates.",
      image: step4Img as unknown as string,
      timeEstimate: "2 min",
      isCompleted: true,
    },
    {
      title: "Initiate the Process",
      description:
        "Check all details. Once you're satisfied with them, proceed by clicking the big green button.",
      image: step5Img as unknown as string,
      timeEstimate: "1 min",
      isCompleted: false,
    },
    {
      title: "Confirm the Transaction",
      description:
        "Confirm the transaction within your wallet if required. The bridge will be created automatically.",
      image: step6Img as unknown as string,
      timeEstimate: "1 min",
      isCompleted: false,
    },
  ],
  isTasksLocked: false,
  similarProjects: [
    {
      id: "linea",
      projectName: "Linea",
      type: "Quests",
      status: "Active",
      category: "DeFi",
      difficulty: "Easy",
      reward: "Points",
      tags: [{ label: "New", variant: "green" }],
      description: "Complete Linea Voyage activities for LXP",
      timeEstimate: "~45 min",
      cost: "$10+",
      raised: "–",
      startDate: "Oct 01, 2025",
      endDate: "Sep 30, 2025",
      progress: 24,
      taskType: "Weekly tasks",
    },
    {
      id: "monad",
      projectName: "Monad",
      isHot: true,
      type: "Testnet",
      status: "Active",
      category: "DeFi",
      difficulty: "Medium",
      reward: "High Potential",
      tags: [
        { label: "New", variant: "green" },
        { label: "Most Hyped", variant: "type" },
      ],
      description: "Join testnet waitlist and complete Discord tasks",
      timeEstimate: "~10 min",
      cost: "Free",
      raised: "$225M",
      startDate: "Oct 01, 2025",
      endDate: "Dec 31, 2026",
      progress: 14,
    },
    {
      id: "zklink-nova-2",
      projectName: "zkLink Nova",
      type: "Testnet",
      status: "Active",
      category: "DeFi",
      difficulty: "Easy",
      reward: "High Potential",
      tags: [{ label: "Deadline Soon", variant: "deadline" }],
      description: "Complete bridge and swap tasks on Nova network",
      timeEstimate: "~20 min",
      cost: "Free",
      raised: "$18.4M",
      startDate: "Oct 01, 2025",
      endDate: "Mar 10, 2026",
      progress: 78,
      taskType: "Monthly tasks",
    },
  ],
};
*/

type ReactionType = "like" | "dislike" | "hot" | "interested";
type FlagReason = "green" | "yellow" | "red";
type ActionKey = "watchlist" | "calendar" | "step" | "board" | ReactionType | FlagReason;
type ActionResult = { isSuccess: boolean; authRequired?: boolean };
type MaybePromise<T> = T | Promise<T>;
type ReactionCounts = { like: number; dislike: number };

const safeCount = (value?: number): number => {
  const numberValue = Number(value);
  return Number.isFinite(numberValue) && numberValue > 0 ? numberValue : 0;
};

const reactionCountsFromData = (data?: ProjectDetailsData): ReactionCounts => ({
  like: safeCount(data?.likesCount),
  dislike: safeCount(data?.dislikesCount),
});

const displayDateValue = (value?: string | null): string => {
  const text = String(value ?? "").trim();
  if (!text || text === "--" || text === "-") return "--";
  const lower = text.toLowerCase();
  if (lower === "invalid date" || lower === "n/a" || lower === "null" || lower === "undefined") {
    return "--";
  }
  return text;
};

const nextReactionCounts = (
  counts: ReactionCounts,
  previousReaction: ReactionType | null,
  nextReaction: ReactionType | null
): ReactionCounts => {
  let like = counts.like;
  let dislike = counts.dislike;

  if (previousReaction === "like") like -= 1;
  if (previousReaction === "dislike") dislike -= 1;
  if (nextReaction === "like") like += 1;
  if (nextReaction === "dislike") dislike += 1;

  return {
    like: Math.max(0, like),
    dislike: Math.max(0, dislike),
  };
};

export const MOCK_SCROLL_PROJECT: ProjectDetailsData = {
  id: "scroll",
  projectName: "Scroll",
  type: "Quests",
  status: "Active",
  isFavourite: false,
  cost: "Free",
  category: "DeFi",
  difficulty: "Easy",
  reward: "High Potential",
  taskType: "Daily",
  startDate: "Oct 01, 2025",
  endDate: "Dec 31, 2026",
  progress: 0,
  totalRaised: "$80M",
  fundingType: "Series A",
  socialLinks: [
    { type: "website", url: "https://scroll.io" },
    { type: "twitter", url: "https://twitter.com/Scroll_ZKP" },
    { type: "discord", url: "https://discord.gg/scroll" },
  ],
  aboutText:
    "Scroll is a zkEVM-based zkRollup on Ethereum that enables native compatibility with existing Ethereum applications and tools. It aims to scale Ethereum while maintaining the full security and decentralization guarantees of the base layer.\n\nComplete daily tasks to earn Scroll Marks, which may be converted to future token rewards. Consecutive day streaks earn bonus multipliers.",
  reviewText:
    "Scroll is one of the most technically ambitious zkEVM rollups in the ecosystem. Backed by major investors and with a strong engineering team, the project has a high reward potential for early participants. Our research team rates this as HIGH POTENTIAL.",
  reviewScores: [
    { label: "Team Score", value: "9/10" },
    { label: "Technology", value: "9.5/10" },
  ],
  isReviewLocked: false,
  riskLevel: "Low",
  riskLevelColor: "green",
  complexity: "Easy",
  timeRequired: "5-10 min/day",
  potentialReward: "High",
  potentialRewardColor: "green",
  timeline: [
    { label: "Mainnet Launch", date: "Oct 17, 2023 at 00:00 UTC" },
    { label: "Marks Program", date: "Jan 01, 2025 at 00:00 UTC" },
    { label: "TGE Expected", date: "Dec 31, 2026 at 00:00 UTC" },
  ],
  greenFlags: [
    { text: "Native zkEVM — full Ethereum compatibility" },
    { text: "Strong backing from top-tier investors ($80M raised)" },
    { text: "Active mainnet with real usage" },
    { text: "Daily task system with streak bonuses" },
    { text: "Transparent roadmap and regular updates" },
  ],
  yellowFlags: [
    { text: "Token launch timeline not confirmed" },
    { text: "Competitive L2/L3 landscape" },
  ],
  redFlags: [],
  taskTitle: "What You Need to Do",
  taskDescription:
    "Complete daily tasks on Scroll to earn Marks. Tasks reset at 00:00 UTC. Consecutive day streaks earn bonus multipliers.",
  taskProgress: 0,
  taskCompletedSteps: 0,
  taskTotalSteps: 4,
  steps: [
    {
      title: "Visit Scroll Portal",
      description: "Navigate to the Scroll daily check-in portal and connect your wallet.",
      timeEstimate: "1 min",
      isCompleted: false,
      ctaType: "website",
      ctaUrl: "https://scroll.io",
      ctaLabel: "Open website",
    },
    {
      title: "Claim Daily Bonus",
      description: `Click the "Claim" button to receive your daily Scroll Marks bonus. Streak multipliers apply.`,
      timeEstimate: "1 min",
      isCompleted: false,
    },
    {
      title: "Complete a Swap",
      description: "Perform at least one swap on any Scroll DEX (Ambient, SyncSwap, etc.) to earn extra marks.",
      timeEstimate: "3 min",
      isCompleted: false,
      ctaType: "website",
      ctaUrl: "https://scroll.io",
      ctaLabel: "Open website",
    },
    {
      title: "Check Marks Balance",
      description: "Verify your Scroll Marks have been credited and check your current streak status.",
      timeEstimate: "1 min",
      isCompleted: false,
    },
  ],
  isTasksLocked: false,
  similarProjects: [
    {
      id: "zklink-nova",
      projectName: "zkLink Nova",
      type: "Testnet",
      status: "Active",
      category: "DeFi",
      difficulty: "Easy",
      reward: "High Potential",
      tags: [{ label: "Deadline Soon", variant: "deadline" }],
      description: "Complete bridge and swap tasks on Nova network",
      timeEstimate: "~20 min",
      cost: "Free",
      raised: "$18.4M",
      startDate: "Oct 01, 2025",
      endDate: "Mar 10, 2026",
      progress: 78,
      taskType: "One-time task",
    },
    {
      id: "linea",
      projectName: "Linea",
      type: "Quests",
      status: "Active",
      category: "DeFi",
      difficulty: "Easy",
      reward: "Points",
      tags: [{ label: "New", variant: "green" }],
      description: "Complete Linea Voyage activities for LXP",
      timeEstimate: "~45 min",
      cost: "$10+",
      raised: "–",
      startDate: "Oct 01, 2025",
      endDate: "Sep 30, 2025",
      progress: 24,
      taskType: "Weekly tasks",
    },
  ],
};

export const MOCK_LINEA_PROJECT: ProjectDetailsData = {
  id: "linea",
  projectName: "Linea Voyage",
  type: "Quests",
  status: "Active",
  isFavourite: false,
  cost: "$10+",
  category: "DeFi",
  difficulty: "Easy",
  reward: "Points",
  taskType: "Weekly tasks",
  startDate: "Oct 01, 2025",
  endDate: "Sep 30, 2026",
  progress: 38,
  socialLinks: [
    { type: "website", url: "https://linea.build" },
    { type: "twitter", url: "https://twitter.com/lineabuild" },
    { type: "discord", url: "https://discord.gg/linea" },
  ],
  aboutText:
    "Linea Voyage is Consensys' flagship engagement program for the Linea network — a zkEVM Layer-2 built on Ethereum. Participants complete on-chain activities each week to earn LXP (Linea Experience Points), which may factor into future rewards.",
  taskTitle: "What You Need to Do",
  taskDescription:
    "Complete Linea Voyage activities in weekly phases to earn LXP. New tasks unlock each week as the program progresses.",
  taskProgress: 25,
  taskCompletedSteps: 1,
  taskTotalSteps: 4,
  weekPhases: [
    { label: "Week 1", subtitle: "Phase 1 \u2013 Bridge", status: "available" },
    { label: "Week 2", subtitle: "Phase 2 \u2014 Swap & LP", status: "available" },
    { label: "Week 3", subtitle: "Phase 3 \u2014 Lending", status: "locked", unlocksIn: "5d" },
    { label: "Week 4", subtitle: "Phase 4 \u2014 NFT Mint", status: "locked", unlocksIn: "12d" },
  ],
  steps: [
    {
      title: "Bridge ETH to Linea",
      description:
        "Use the official Linea Bridge to transfer ETH from Ethereum mainnet to Linea network.",
      timeEstimate: "10 min",
      isCompleted: true,
      ctaType: "website",
      ctaUrl: "https://bridge.linea.build",
      ctaLabel: "Open website",
    },
    {
      title: "Add Linea Network to Wallet",
      description:
        "Add Linea network to MetaMask using the official chain settings (Chain ID: 59144).",
      timeEstimate: "2 min",
      isCompleted: false,
      ctaType: "address",
      ctaAddress: "59144",
    },
    {
      title: "Swap Tokens on SyncSwap",
      description:
        "Perform a token swap on SyncSwap DEX on the Linea network to earn swap LXP.",
      timeEstimate: "5 min",
      isCompleted: false,
      ctaType: "website",
      ctaUrl: "https://syncswap.xyz",
      ctaLabel: "Open website",
    },
    {
      title: "Provide Liquidity",
      description: "Add liquidity to any pool on a Linea DEX to earn LP LXP rewards.",
      timeEstimate: "10 min",
      isCompleted: false,
    },
    {
      title: "Supply Assets on ZeroLend",
      description: "Supply ETH or USDC on ZeroLend lending protocol on Linea.",
      timeEstimate: "8 min",
      isLocked: true,
    },
    {
      title: "Mint Voyage NFT",
      description: "Mint the weekly Linea Voyage commemorative NFT to prove participation.",
      timeEstimate: "5 min",
      isLocked: true,
    },
  ],
  isTasksLocked: false,
  riskLevel: "Low",
  riskLevelColor: "green",
  complexity: "Easy",
  timeRequired: "45 min/week",
  potentialReward: "High",
  potentialRewardColor: "green",
  similarProjects: [],
};

export const MOCK_MONAD_PROJECT: ProjectDetailsData = {
  id: "monad",
  projectName: "Monad Testnet",
  type: "Testnet",
  status: "Active",
  isFavourite: false,
  cost: "Free",
  category: "DeFi",
  difficulty: "Easy",
  reward: "High Potential",
  taskType: "Repeatable",
  startDate: "Mar 01, 2026",
  endDate: "Dec 31, 2026",
  progress: 14,
  totalRaised: "$225M",
  fundingType: "Series B",
  socialLinks: [
    { type: "website", url: "https://monad.xyz" },
    { type: "twitter", url: "https://twitter.com/monad_xyz" },
    { type: "discord", url: "https://discord.gg/monad" },
  ],
  aboutText:
    "Monad is a high-performance Layer-1 blockchain compatible with the Ethereum Virtual Machine (EVM). The Monad testnet allows users to test transactions, farm points through repeating on-chain cycles, and position themselves for potential future rewards.",
  taskTitle: "What You Need to Do",
  taskDescription:
    "Farm Monad testnet points by repeating swap and bridge transactions. Each full cycle completion earns points with no limit.",
  taskProgress: 100,
  taskCompletedSteps: 4,
  taskTotalSteps: 4,
  repeatableCyclesDone: 1,
  steps: [
    {
      title: "Connect to Monad Testnet",
      description: "Add Monad testnet RPC to your wallet and connect to the network.",
      timeEstimate: "2 min",
      isCompleted: true,
      ctaType: "website",
      ctaUrl: "https://monad.xyz",
      ctaLabel: "Open website",
      ctaAddress: "https://rpc.testnet.monad.xyz",
    },
    {
      title: "Claim Testnet Tokens",
      description: "Use the Monad faucet to claim free testnet MON tokens for transactions.",
      timeEstimate: "1 min",
      isCompleted: true,
      ctaType: "website",
      ctaUrl: "https://faucet.monad.xyz",
      ctaLabel: "Open website",
    },
    {
      title: "Execute a Swap",
      description: "Swap MON for any available testnet token on the Monad DEX.",
      timeEstimate: "3 min",
      isCompleted: true,
      ctaType: "website",
      ctaUrl: "https://app.monad.xyz",
      ctaLabel: "Open website",
    },
    {
      title: "Bridge Back",
      description: "Bridge tokens back to complete one farming cycle. Points are awarded per cycle.",
      timeEstimate: "3 min",
      isCompleted: true,
    },
  ],
  isTasksLocked: false,
  riskLevel: "Low",
  riskLevelColor: "green",
  complexity: "Easy",
  timeRequired: "10 min",
  potentialReward: "High",
  potentialRewardColor: "green",
  similarProjects: [],
};

export const MOCK_STARKNET_PROJECT: ProjectDetailsData = {
  id: "starknet",
  projectName: "StarkNet Provisions",
  type: "Quests",
  status: "Ended",
  isFavourite: false,
  cost: "Free",
  category: "DeFi",
  difficulty: "Easy",
  reward: "STRK Tokens",
  taskType: "Daily",
  isExpired: true,
  startDate: "Jan 01, 2024",
  endDate: "Feb 28, 2024",
  progress: 0,
  totalRaised: "$100M",
  fundingType: "Series B",
  socialLinks: [
    { type: "website", url: "https://starknet.io" },
    { type: "twitter", url: "https://twitter.com/starknet" },
    { type: "discord", url: "https://discord.gg/starknet" },
  ],
  aboutText:
    "StarkNet Provisions is a retroactive STRK token airdrop program for early users who completed on-chain activities on StarkNet. Participants who performed ecosystem tasks before the snapshot date received STRK token allocations proportional to their activity.",
  taskTitle: "What You Need to Do",
  taskDescription:
    "Complete StarkNet ecosystem tasks before the snapshot deadline to qualify for STRK token provisions. Higher activity = larger allocation.",
  taskProgress: 0,
  taskCompletedSteps: 0,
  taskTotalSteps: 7,
  steps: [
    {
      title: "Deploy an Argent X Wallet",
      description: "Install Argent X browser extension and deploy a StarkNet wallet account.",
      timeEstimate: "5 min",
      isCompleted: false,
      ctaType: "website",
      ctaUrl: "https://www.argent.xyz/argent-x/",
      ctaLabel: "Open website",
    },
    {
      title: "Bridge ETH to StarkNet",
      description: "Use StarkGate to bridge ETH from Ethereum mainnet to StarkNet.",
      timeEstimate: "10 min",
      isCompleted: false,
      ctaType: "website",
      ctaUrl: "https://starkgate.starknet.io/",
      ctaLabel: "Open website",
    },
    {
      title: "Swap on JediSwap",
      description: "Perform a token swap on JediSwap DEX to generate on-chain activity.",
      timeEstimate: "5 min",
      isCompleted: false,
      ctaType: "website",
      ctaUrl: "https://app.jediswap.xyz/",
      ctaLabel: "Open website",
    },
    {
      title: "Provide Liquidity on Ekubo",
      description: "Add liquidity to an ETH/USDC pool on Ekubo protocol.",
      timeEstimate: "10 min",
      isCompleted: false,
      ctaType: "website",
      ctaUrl: "https://app.ekubo.org/",
      ctaLabel: "Open website",
    },
    {
      title: "Mint a StarkNet ID",
      description: "Register a .stark domain name through StarkNet ID service.",
      timeEstimate: "5 min",
      isCompleted: false,
      ctaType: "website",
      ctaUrl: "https://app.starknet.id/",
      ctaLabel: "Open website",
      ctaAddress: "yourname.stark",
    },
    {
      title: "Vote on Governance",
      description: "Participate in StarkNet governance by voting on any active proposal.",
      timeEstimate: "5 min",
      isCompleted: false,
      ctaType: "website",
      ctaUrl: "https://snapshot.org/#/starknet.eth",
      ctaLabel: "Open website",
    },
    {
      title: "Reach 10+ Unique Transactions",
      description: "Ensure you have at least 10 unique transactions across different StarkNet protocols.",
      timeEstimate: "15 min",
      isCompleted: false,
    },
  ],
  isTasksLocked: false,
  riskLevel: "Low",
  riskLevelColor: "green",
  complexity: "Easy",
  timeRequired: "60 min",
  potentialReward: "High",
  potentialRewardColor: "green",
  similarProjects: [],
};

interface Props {
  data?: ProjectDetailsData;
  onToggleFavourite?: (id: string, nextValue: boolean) => MaybePromise<ActionResult | void>;
  onToggleSimilarFavourite?: (
    id: string,
    interactionId: string | undefined,
    nextValue: boolean
  ) => MaybePromise<ActionResult | void>;
  onSimilarDetails?: (id: string) => void;
  onReaction?: (id: string, reaction: ReactionType | null) => MaybePromise<ActionResult | void>;
  onReport?: (id: string, reason: FlagReason) => MaybePromise<ActionResult | void>;
  onCalendar?: (id: string, nextValue: boolean) => MaybePromise<ActionResult | void>;
  onAddToBoard?: (id: string) => MaybePromise<ActionResult | void>;
  onToggleStep?: (id: string, stepId: string, completed: boolean) => MaybePromise<ActionResult | void>;
}

const ProjectDetails: FC<Props> = ({
  data,
  onToggleFavourite,
  onToggleSimilarFavourite,
  onSimilarDetails,
  onReaction,
  onCalendar,
  onAddToBoard,
  onToggleStep,
}) => {
  const { translateText } = useTranslation();
  const earlylandRouter = useRouter();
  const cameFrom = String(earlylandRouter.query.from || "");
  const sourceCrumb = cameFrom === "prime"
    ? { title: "Prime", link: "/crypto/earlyland?tab=prime" }
    : { title: "Feed", link: "/crypto/earlyland" };
  // Auth is resolved by Layout via getUserByToken and exposed through AuthContext.
  // The legacy Redux `authState.isLogin` flag is never dispatched, so consume the
  // canonical AuthContext here (otherwise the Tasks block never renders).
  const earlylandAuth = useContext(AuthContext);
  const isLogin = !!earlylandAuth?.isAuth;
  const [isFav, setIsFav] = useState(data?.isFavourite ?? false);
  const [reaction, setReaction] = useState<ReactionType | null>(
    data?.userReaction ?? null
  );
  const [reactionCounts, setReactionCounts] = useState<ReactionCounts>(
    reactionCountsFromData(data)
  );
  const [isCalendarAdded, setIsCalendarAdded] = useState(
    data?.isAddedToCalendar ?? false
  );
  const [completedStepIds, setCompletedStepIds] = useState<string[]>(
    data?.completedStepIds ?? []
  );
  const [pendingAction, setPendingAction] = useState<ActionKey | null>(null);
  const [isMobile, setIsMobile] = useState(false);
  const [dailyCountdown, setDailyCountdown] = useState({ h: "00", m: "00", s: "00" });
  const [cycleActive, setCycleActive] = useState(false);
  const [boardAddedLocal, setBoardAddedLocal] = useState(false);

  useEffect(() => {
    setBoardAddedLocal(false);
  }, [data?.id]);

  useEffect(() => {
    setCycleActive(false);
  }, [data?.id]);

  useEffect(() => {
    const steps = data?.steps || [];
    if (cycleActive && steps.length > 0 && completedStepIds.length >= steps.length) {
      setCycleActive(false);
    }
  }, [completedStepIds.length, cycleActive, data?.steps]);

  useEffect(() => {
    if (data?.taskType !== "Daily") return;
    const tick = () => {
      const now = new Date();
      const midnight = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate() + 1));
      const diff = Math.max(0, Math.floor((midnight.getTime() - now.getTime()) / 1000));
      setDailyCountdown({
        h: String(Math.floor(diff / 3600)).padStart(2, "0"),
        m: String(Math.floor((diff % 3600) / 60)).padStart(2, "0"),
        s: String(diff % 60).padStart(2, "0"),
      });
    };
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, [data?.taskType]);
  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth <= 1000);
    checkMobile();
    window.addEventListener("resize", checkMobile);
    return () => window.removeEventListener("resize", checkMobile);
  }, []);

  useEffect(() => {
    setIsFav(data?.isFavourite ?? false);
  }, [data?.isFavourite]);

  useEffect(() => {
    setReaction(data?.userReaction ?? null);
  }, [data?.userReaction]);

  useEffect(() => {
    setReactionCounts(reactionCountsFromData(data));
  }, [data?.dislikesCount, data?.id, data?.likesCount]);

  useEffect(() => {
    setIsCalendarAdded(data?.isAddedToCalendar ?? false);
  }, [data?.isAddedToCalendar]);

  useEffect(() => {
    if (pendingAction === "step") return;
    setCompletedStepIds(data?.completedStepIds ?? []);
  }, [data?.completedStepIds, data?.id]);

  if (!data) return null;

  const isActionSuccess = (result: ActionResult | void) =>
    !result || result.isSuccess !== false;
  const shouldShowActionError = (result: ActionResult | void) =>
    !!result && result.isSuccess === false && !result.authRequired;
  const stepIdSet = new Set(completedStepIds);
  const validStepIds = new Set(
    (data.steps || []).map((step, index) => step.id || `step-${index + 1}`)
  );
  const stepsTotal = data.steps?.length || data.stepsTotal || 0;
  const stepsCompleted = completedStepIds.filter((stepId) =>
    validStepIds.has(stepId)
  ).length;
  const stepsProgress = stepsTotal
    ? Math.round((stepsCompleted / stepsTotal) * 100)
    : data.stepsProgress || 0;
  const flagCounts = {
    green: data.greenFlags?.length || 0,
    yellow: data.yellowFlags?.length || 0,
    red: data.redFlags?.length || 0,
  };
  const taskProgressPercent = Math.max(0, Math.min(100, stepsProgress));
  const aboutDisplayHtml = displayRichHtml(data.aboutHtml, data.aboutText);
  const taskDescriptionDisplayHtml = displayRichHtml(
    data.taskDescriptionHtml,
    data.taskDescription
  );
  const reviewDisplayHtml = displayRichHtml(data.reviewHtml, data.reviewText);
  const hasTaskCard = Boolean(
    data.taskTitle ||
    taskDescriptionDisplayHtml ||
    data.weekPhases?.length ||
    data.taskType === "Daily" ||
    data.taskType === "Repeatable" ||
    data.isExpired ||
    data.steps?.length ||
    data.isTasksLocked
  );
  const hasTaskMeta = Boolean(data.timeRequired || data.cost || data.category);
  const hasReviewCard = Boolean(
    reviewDisplayHtml || data.reviewScores?.length || data.isReviewLocked
  );

  const handleWatchlist = async () => {
    if (pendingAction) return;

    const previousValue = isFav;
    const nextValue = !isFav;

    setPendingAction("watchlist");
    setIsFav(nextValue);

    const result = await onToggleFavourite?.(data.id, nextValue);

    if (isActionSuccess(result)) {
      toast.success(
        translateText(nextValue ? "Added to watchlist" : "Removed from watchlist")
      );
    } else {
      setIsFav(previousValue);
      if (shouldShowActionError(result)) {
        toast.error(translateText("Failed to update watchlist"));
      }
    }

    setPendingAction(null);
  };

  const handleCalendar = async () => {
    if (pendingAction) return;

    const previousValue = isCalendarAdded;
    const nextValue = !isCalendarAdded;

    setPendingAction("calendar");
    setIsCalendarAdded(nextValue);

    const result = await onCalendar?.(data.id, nextValue);

    if (isActionSuccess(result)) {
      toast.success(
        translateText(nextValue ? "Added to calendar" : "Removed from calendar")
      );
    } else {
      setIsCalendarAdded(previousValue);
      if (shouldShowActionError(result)) {
        toast.error(translateText("Failed to update calendar"));
      }
    }

    setPendingAction(null);
  };

  const handleAddToBoard = async () => {
    if (pendingAction) return;
    setPendingAction("board");
    setBoardAddedLocal(true);
    const result = await onAddToBoard?.(data.id);
    if (isActionSuccess(result)) {
      toast.success(translateText("Added to board"));
    } else {
      setBoardAddedLocal(false);
      if (shouldShowActionError(result)) {
        toast.error(translateText("Failed to add to board"));
      }
    }
    setPendingAction(null);
  };

  const handleReaction = async (nextReaction: ReactionType) => {
    if (pendingAction) return;

    const previousReaction = reaction;
    const nextValue = reaction === nextReaction ? null : nextReaction;
    const previousCounts = reactionCounts;
    const nextCounts = nextReactionCounts(reactionCounts, previousReaction, nextValue);

    setPendingAction(nextReaction);
    setReaction(nextValue);
    setReactionCounts(nextCounts);

    const result = await onReaction?.(data.id, nextValue);

    if (isActionSuccess(result)) {
      toast.success(
        translateText(nextValue ? "Reaction saved" : "Reaction removed")
      );
    } else {
      setReaction(previousReaction);
      setReactionCounts(previousCounts);
      if (shouldShowActionError(result)) {
        toast.error(translateText("Failed to update reaction"));
      }
    }

    setPendingAction(null);
  };

  const handleToggleStep = async (stepId: string, completed: boolean) => {
    if (pendingAction) return;

    const previousIds = completedStepIds;
    const nextIds = completed
      ? Array.from(new Set([...completedStepIds, stepId]))
      : completedStepIds.filter((id) => id !== stepId);

    setPendingAction("step");
    setCompletedStepIds(nextIds);

    const result = await onToggleStep?.(data.id, stepId, completed);

    if (!isActionSuccess(result)) {
      setCompletedStepIds(previousIds);
      if (shouldShowActionError(result)) {
        toast.error(translateText("Failed to update step"));
      }
    }

    setPendingAction(null);
  };

  const handleNewCycle = () => {
    setCompletedStepIds([]);
    setCycleActive(true);
  };

  const renderSocialButton = (type: string, url: string, i: number) => {
    if (type === "website") {
      return (
        <SocialButton key={i} href={url} target="_blank" rel="noopener noreferrer" title="Website">
          <GlobeIcon />
        </SocialButton>
      );
    }
    if (type === "twitter") {
      return (
        <SocialButton key={i} href={url} target="_blank" rel="noopener noreferrer" title="Twitter">
          <TwitterIcon />
        </SocialButton>
      );
    }
    if (type === "telegram") {
      return (
        <SocialButton key={i} href={url} target="_blank" rel="noopener noreferrer" title="Telegram">
          <TelegramIcon />
        </SocialButton>
      );
    }
    if (type === "discord") {
      return (
        <SocialButton key={i} href={url} target="_blank" rel="noopener noreferrer" title="Discord">
          <DiscordIcon />
        </SocialButton>
      );
    }
    return (
      <SocialLinkButton key={i} href={url} target="_blank" rel="noopener noreferrer" title="Link">
        <LinkSmIcon />
      </SocialLinkButton>
    );
  };

  return (
    <PageWrapper style={{ display: "flex", flexDirection: "column" }}>
      <div style={{ padding: "18px 0 14px" }}>
        <BreadCrumbs
          items={[
            { title: "EarlyLand", link: "/crypto/earlyland" },
            sourceCrumb,
            { title: data.projectName || "Project", link: "#" },
          ]}
        />
      </div>
      <div style={{ display: "flex", flexDirection: isMobile ? "column" : "row", gap: "20px" }}>
        <LeftColumn>
          <ActivityTasksBlock activityId={data?.id} isLogin={isLogin} />
          {/* Hero card */}
          <Card>
            <HeroTop>
              <HeroLeft>
                <ProjectLogo>
                  {data.projectLogo ? (
                    <img src={data.projectLogo} alt={data.projectName} />
                  ) : (
                    (data.projectName ?? "").slice(0, 2).toUpperCase()
                  )}
                </ProjectLogo>
                <ProjectInfo>
                  <ProjectName>{data.projectName}</ProjectName>
                  <TypeRow>
                    <ProjectType>{translateText(data.type)}</ProjectType>
                    <StatusBadge status={data.status}>{translateText(data.status)}</StatusBadge>
                  </TypeRow>
                </ProjectInfo>
              </HeroLeft>
              <HeroActions>
                <ActionButton
                  $active={isFav}
                  $activeColor="#FFC704"
                  disabled={pendingAction === "watchlist"}
                  onClick={handleWatchlist}
                  title={translateText(isFav ? "Remove from watchlist" : "Add to watchlist")}
                >
                  <StarIcon filled={isFav} />
                </ActionButton>
                <ActionButton
                  $active={isCalendarAdded}
                  $activeColor="#05A584"
                  disabled={pendingAction === "calendar"}
                  title={translateText(isCalendarAdded ? "Remove from calendar" : "Add to calendar")}
                  onClick={handleCalendar}
                >
                  <CalendarIcon stroke={isCalendarAdded ? "#05A584" : "#728094"} />
                </ActionButton>
                <ActionButton
                  $active={reaction === "like"}
                  $activeColor="#05A584"
                  disabled={pendingAction === "like"}
                  title={translateText("Like")}
                  onClick={() => handleReaction("like")}
                >
                  <ThumbsUpIcon stroke={reaction === "like" ? "#05A584" : "#728094"} />
                  {reactionCounts.like > 0 && (
                    <FlagCountBadge $color="#05A584">{reactionCounts.like}</FlagCountBadge>
                  )}
                </ActionButton>
                <ActionButton
                  $active={reaction === "dislike"}
                  $activeColor="#FF5857"
                  disabled={pendingAction === "dislike"}
                  title={translateText("Dislike")}
                  onClick={() => handleReaction("dislike")}
                >
                  <ThumbsDownIcon stroke={reaction === "dislike" ? "#FF5857" : "#728094"} />
                  {reactionCounts.dislike > 0 && (
                    <FlagCountBadge $color="#FF5857">{reactionCounts.dislike}</FlagCountBadge>
                  )}
                </ActionButton>
                <ActionButton
                  $active={flagCounts.green > 0}
                  $activeColor="#05A584"
                  $readOnly
                  tabIndex={-1}
                  title={translateText("Green flags")}
                >
                  <FlagActionIcon stroke={flagCounts.green > 0 ? "#05A584" : "#728094"} />
                  {flagCounts.green > 0 && (
                    <FlagCountBadge $color="#05A584">{flagCounts.green}</FlagCountBadge>
                  )}
                </ActionButton>
                <ActionButton
                  $active={flagCounts.yellow > 0}
                  $activeColor="#FFC704"
                  $readOnly
                  tabIndex={-1}
                  title={translateText("Yellow flags")}
                >
                  <FlagActionIcon stroke={flagCounts.yellow > 0 ? "#FFC704" : "#728094"} />
                  {flagCounts.yellow > 0 && (
                    <FlagCountBadge $color="#FFC704">{flagCounts.yellow}</FlagCountBadge>
                  )}
                </ActionButton>
                <ActionButton
                  $active={flagCounts.red > 0}
                  $activeColor="#FF5857"
                  $readOnly
                  tabIndex={-1}
                  title={translateText("Red flags")}
                >
                  <FlagActionIcon stroke={flagCounts.red > 0 ? "#FF5857" : "#728094"} />
                  {flagCounts.red > 0 && (
                    <FlagCountBadge $color="#FF5857">{flagCounts.red}</FlagCountBadge>
                  )}
                </ActionButton>
              </HeroActions>
            </HeroTop>

            {/* Stats bar */}
            <StatsBanner>
              <StatItem>
                <StatLabel>Cost</StatLabel>
                <StatValue>{data.cost || "--"}</StatValue>
              </StatItem>
              <StatItem>
                <StatLabel>Category</StatLabel>
                <StatValue>{data.category}</StatValue>
              </StatItem>
              <StatItem>
                <StatLabel>Difficulty</StatLabel>
                <StatValue difficulty={data.difficulty}>{data.difficulty}</StatValue>
              </StatItem>
              <StatItem>
                <StatLabel>Reward</StatLabel>
                <StatValue>
                  <HoverTooltipValue data-tooltip={data.reward}>
                    <span>{data.reward}</span>
                  </HoverTooltipValue>
                </StatValue>
              </StatItem>
              {data.taskType && (
                <StatItem>
                  <StatLabel>Task Type</StatLabel>
                  <TaskTypeBadge>{data.taskType}</TaskTypeBadge>
                </StatItem>
              )}
            </StatsBanner>

            {/* Progress */}
            <ProgressSection>
              <DateRow>
                <DateGroup>
                  <DateLabel>Started:</DateLabel>
                  <DateValue>{displayDateValue(data.startDate)}</DateValue>
                </DateGroup>
                <DateGroup>
                  <DateLabel>Ends:</DateLabel>
                  <DateValue>{displayDateValue(data.endDate)}</DateValue>
                </DateGroup>
              </DateRow>
              <ProgressBarWrapper>
                <ProgressBarFill percent={data.progress} />
              </ProgressBarWrapper>
            </ProgressSection>

            {/* Social links */}
            {data.socialLinks && data.socialLinks.length > 0 && (
              <SocialRow>
                {data.socialLinks.map((link, i) =>
                  renderSocialButton(link.type, link.url, i)
                )}
              </SocialRow>
            )}
          </Card>

          {/* About card */}
          {aboutDisplayHtml && (
            <Card style={{ position: "relative", overflow: "hidden" }}>
              <SectionTitle>About</SectionTitle>
              <AboutTextBlock dangerouslySetInnerHTML={sanitizedHtml(aboutDisplayHtml)} />
              {(data.totalRaised || data.fundingType) && (
                <RaisedBanner>
                  <RaisedLeft>
                    <BullishIcon />
                    <RaisedTextGroup>
                      <RaisedLabel>Total Raised:</RaisedLabel>
                      <RaisedValue>{data.totalRaised}</RaisedValue>
                    </RaisedTextGroup>
                  </RaisedLeft>
                  {data.fundingType && (
                    <FundingTypeGroup>
                      <RaisedLabel>Type:</RaisedLabel>
                      <RaisedValue>{data.fundingType}</RaisedValue>
                    </FundingTypeGroup>
                  )}
                </RaisedBanner>
              )}
            </Card>
          )}

          {/* FOMO Review card */}
          {hasReviewCard && (
            <Card style={{ position: "relative", overflow: "hidden" }}>
              <SectionTitleRow>
                <GoldMedalIcon />
                <SectionTitle>FOMO Review</SectionTitle>
              </SectionTitleRow>
              {reviewDisplayHtml && (
                <ReviewText
                  as="div"
                  dangerouslySetInnerHTML={sanitizedHtml(reviewDisplayHtml)}
                />
              )}
              {data.reviewScores && data.reviewScores.length > 0 && (
                <ScoresRow>
                  {data.reviewScores.map((score) => (
                    <ScoreCard key={score.label}>
                      <ScoreLabel>{score.label}</ScoreLabel>
                      <ScoreValue>{score.value}</ScoreValue>
                    </ScoreCard>
                  ))}
                </ScoresRow>
              )}
              {data.isReviewLocked && (
                <BlurOverlay>
                  <LockSmIcon />
                  <LockedTitle>Prime access required</LockedTitle>
                  <LockedSubtitle>Unlock with a FOMO AI membership</LockedSubtitle>
                </BlurOverlay>
              )}
            </Card>
          )}

          {/* Tasks card */}
          {hasTaskCard && (
            <Card style={{ position: "relative", overflow: "hidden" }}>
              <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
                <TaskTitle>{translateText("What You Need to Do")}</TaskTitle>
                {taskDescriptionDisplayHtml ? (
                  <TaskDescription
                    dangerouslySetInnerHTML={sanitizedHtml(taskDescriptionDisplayHtml)}
                  />
                ) : null}
              </div>

              {stepsTotal > 0 && (
                <>
                  <TaskDivider />
                  <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
                    <TaskProgressRow>
                      <div style={{ display: "flex", gap: "4px", alignItems: "center" }}>
                        <TaskProgressLabel>{translateText("Progress")}:</TaskProgressLabel>
                        <TaskProgressValue>{taskProgressPercent}%</TaskProgressValue>
                      </div>
                      <TaskProgressSteps>
                        {stepsCompleted} / {stepsTotal} {translateText("steps")}
                      </TaskProgressSteps>
                    </TaskProgressRow>
                    <TaskProgressBarWrap>
                      <TaskProgressBarFill $percent={taskProgressPercent} />
                    </TaskProgressBarWrap>
                    {hasTaskMeta && (
                      <TaskMetaRow>
                        {data.timeRequired && (
                          <TaskMetaItem>
                            <TaskClockIcon />
                            <TaskMetaText>{data.timeRequired}</TaskMetaText>
                          </TaskMetaItem>
                        )}
                        {data.cost && (
                          <TaskMetaItem>
                            <AirdropIcon />
                            <TaskMetaText>{data.cost}</TaskMetaText>
                          </TaskMetaItem>
                        )}
                        {data.category && <TaskMetaText>{data.category}</TaskMetaText>}
                        {data.isExpired && (
                          <TaskMetaDeadline>
                            <AlertTriangleIcon />
                            {translateText("Deadline")}: {translateText("Expired")}
                          </TaskMetaDeadline>
                        )}
                      </TaskMetaRow>
                    )}
                  </div>
                </>
              )}

              {data.weekPhases && data.weekPhases.length > 0 && (
                <>
                  <TaskDivider />
                  <SectionTitle>{translateText("Phase Progress")}</SectionTitle>
                  <WeekPhasesRow>
                    {data.weekPhases.map((phase, index) => (
                      <WeekPhaseCard
                        key={`${phase.label}-${index}`}
                        $active={phase.status === "available"}
                      >
                        <WeekPhaseTitle $active={phase.status === "available"}>
                          {translateText(phase.label)}
                        </WeekPhaseTitle>
                        <WeekPhaseSubtitle>{translateText(phase.subtitle)}</WeekPhaseSubtitle>
                        {phase.status === "available" ? (
                          <WeekPhaseStatusText>{translateText("Available")}</WeekPhaseStatusText>
                        ) : (
                          <WeekPhaseLockRow>
                            <LockMiniIcon />
                            <WeekPhaseSubtitle>
                              {translateText("Unlocks in")} {phase.unlocksIn}
                            </WeekPhaseSubtitle>
                          </WeekPhaseLockRow>
                        )}
                      </WeekPhaseCard>
                    ))}
                  </WeekPhasesRow>
                </>
              )}

              {data.taskType === "Repeatable" && (
                <RepeatableBanner>
                  <RepeatableBannerLeft>
                    <RepeatableBannerTitle>{translateText("Repeatable Task")}</RepeatableBannerTitle>
                    <RepeatableBannerSubtitle>
                      {translateText("Complete and restart for more points. No limit.")}
                    </RepeatableBannerSubtitle>
                  </RepeatableBannerLeft>
                  <RepeatableBannerRight>
                    <RepeatableCyclesGroup>
                      <RepeatableCyclesCount>{data.repeatableCyclesDone ?? 0}</RepeatableCyclesCount>
                      <RepeatableCyclesLabel>{translateText("cycles done")}</RepeatableCyclesLabel>
                    </RepeatableCyclesGroup>
                    {!cycleActive && (
                      <NewCycleBtn type="button" onClick={handleNewCycle}>
                        <RefreshIcon />
                        {translateText("New Cycle")}
                      </NewCycleBtn>
                    )}
                  </RepeatableBannerRight>
                </RepeatableBanner>
              )}

              {data.isExpired && (
                <ExpiredBanner>
                  <ExpiredBannerLeft>
                    <ExpiredBannerTitle>{translateText("Deadline Approaching")}</ExpiredBannerTitle>
                    <ExpiredBannerSubtitle>
                      {translateText("Complete all steps before the snapshot")}
                    </ExpiredBannerSubtitle>
                  </ExpiredBannerLeft>
                  <ExpiredBannerStatus>{translateText("Expired")}</ExpiredBannerStatus>
                </ExpiredBanner>
              )}

              {data.taskType === "Daily" && !data.isExpired && (
                <DailyTaskBanner>
                  <DailyTaskLeft>
                    <DailyTaskLabel>{translateText("Daily Task")}</DailyTaskLabel>
                    <DailyTaskSubtitle>
                      {translateText("Resets automatically at 00:00 UTC")}
                    </DailyTaskSubtitle>
                  </DailyTaskLeft>
                  <DailyTaskTimer>
                    <ClockSmIcon />
                    <DailyTimerUnit>
                      <DailyTimerBox>{dailyCountdown.h}</DailyTimerBox>
                      <DailyTimerSep>h</DailyTimerSep>
                    </DailyTimerUnit>
                    <DailyTimerUnit>
                      <DailyTimerBox>{dailyCountdown.m}</DailyTimerBox>
                      <DailyTimerSep>m</DailyTimerSep>
                    </DailyTimerUnit>
                    <DailyTimerUnit>
                      <DailyTimerBox>{dailyCountdown.s}</DailyTimerBox>
                      <DailyTimerSep>s</DailyTimerSep>
                    </DailyTimerUnit>
                  </DailyTaskTimer>
                </DailyTaskBanner>
              )}

              {data.steps && data.steps.length > 0 && (
                <>
                  <TaskDivider />
                  <StepsHeading>
                    <StepsBoltIcon />
                    <span>{translateText("Steps to Complete")}</span>
                  </StepsHeading>
                </>
              )}
              {data.steps?.map((step, i) => {
                const stepId = step.id || `step-${i + 1}`;
                const isStepCompleted = stepIdSet.has(stepId);
                const stepHtml = displayRichHtml(step.descriptionHtml, step.description);
                const stepTitle = stepDisplayTitle(step.title, i);
                const stepCtaUrl = step.ctaUrl || (i === 0 ? data.taskCtaUrl : undefined);
                const stepCtaLabel = step.ctaLabel || data.taskCtaLabel || "Open website";
                const isStepLocked = !!step.isLocked;

                return (
                  // eslint-disable-next-line react/no-array-index-key
                  <StepCard key={`step-${i}`} $completed={isStepCompleted} $locked={isStepLocked}>
                    <StepLeftCol>
                      <StepNumberBadge $completed={isStepCompleted} $locked={isStepLocked}>
                        {isStepLocked ? (
                          <LockIcon />
                        ) : (
                          <StepNumberText $completed={isStepCompleted}>
                            {String(i + 1).padStart(2, "0")}
                          </StepNumberText>
                        )}
                      </StepNumberBadge>
                      {!isStepLocked && !data.isExpired && (
                        <StepCheckButton
                          type="button"
                          disabled={pendingAction === "step"}
                          onClick={() => handleToggleStep(stepId, !isStepCompleted)}
                          aria-label={translateText(isStepCompleted ? "Mark step incomplete" : "Mark step complete")}
                        >
                          {isStepCompleted ? <StepCheckedIcon /> : <StepUncheckedIcon />}
                        </StepCheckButton>
                      )}
                    </StepLeftCol>
                    <StepContent>
                      <StepCardTitle $completed={isStepCompleted} $locked={isStepLocked}>
                        {stepTitle}
                      </StepCardTitle>
                      {stepHtml ? (
                        <StepCardText
                          $completed={isStepCompleted}
                          $locked={isStepLocked}
                          dangerouslySetInnerHTML={sanitizedHtml(stepHtml)}
                        />
                      ) : step.description ? (
                        <StepCardText $completed={isStepCompleted} $locked={isStepLocked}>
                          {step.description}
                        </StepCardText>
                      ) : null}
                      {isStepLocked && (
                        <StepLockedText>{translateText("Locked - unlocks in a future phase")}</StepLockedText>
                      )}
                      {!isStepLocked && step.image && (
                        <StepCardImage>
                          <Image src={step.image} alt={stepTitle} />
                        </StepCardImage>
                      )}
                      {!isStepLocked && (stepCtaUrl || step.ctaAddress) && (
                        <div style={{ display: "flex", gap: "12px", flexWrap: "wrap", alignItems: "center" }}>
                          {stepCtaUrl && (
                            <StepCtaGreen href={stepCtaUrl} target="_blank" rel="noopener noreferrer">
                              <TaskExternalIcon />
                              {stepCtaLabel}
                            </StepCtaGreen>
                          )}
                          {step.ctaAddress && (
                            <StepCtaGray>
                              <CopySmIcon />
                              {step.ctaAddress}
                            </StepCtaGray>
                          )}
                        </div>
                      )}
                    </StepContent>
                    {step.timeEstimate && (
                      <StepTimeCol $locked={isStepLocked}>
                        <TaskClockIcon />
                        <StepTimeText $locked={isStepLocked}>{step.timeEstimate}</StepTimeText>
                      </StepTimeCol>
                    )}
                  </StepCard>
                );
              })}
              {data.taskSuccessMessage && (
                <SuccessMessage>
                  {data.taskSuccessMessage.split("\n").map((line, i) => (
                    // eslint-disable-next-line react/no-array-index-key
                    <p key={`msg-${i}`} style={{ margin: 0 }}>{line}</p>
                  ))}
                </SuccessMessage>
              )}
              {data.isTasksLocked && (
                <BlurOverlay>
                  <LockSmIcon />
                  <LockedTitle>Prime access required</LockedTitle>
                  <LockedSubtitle>Unlock with a FOMO AI membership</LockedSubtitle>
                </BlurOverlay>
              )}
            </Card>
          )}
        </LeftColumn>

        <RightColumn>
          {/* Activity Metrics */}
          {(data.riskLevel || data.complexity || data.timeRequired || data.potentialReward) && (
            <Card style={{ position: "relative", overflow: "visible" }}>
              <SectionTitle>Activity Metrics</SectionTitle>
              {data.riskLevel && (
                <MetricRow>
                  <MetricLabel>Risk Level</MetricLabel>
                  <MetricValue color={data.riskLevelColor ?? "green"}>{data.riskLevel}</MetricValue>
                </MetricRow>
              )}
              {data.complexity && (
                <MetricRow>
                  <MetricLabel>Complexity</MetricLabel>
                  <MetricValue color="green">{data.complexity}</MetricValue>
                </MetricRow>
              )}
              {data.timeRequired && (
                <MetricRow>
                  <MetricLabel>Time Required</MetricLabel>
                  <MetricValue color="dark">{data.timeRequired}</MetricValue>
                </MetricRow>
              )}
              {data.potentialReward && (
                <MetricRow>
                  <MetricLabel>Potential Reward</MetricLabel>
                  <MetricValue
                    color={data.potentialRewardColor ?? "green"}
                  >
                    <HoverTooltipValue $align="right" $placement="top" data-tooltip={data.potentialReward}>
                      <span>{data.potentialReward}</span>
                    </HoverTooltipValue>
                  </MetricValue>
                </MetricRow>
              )}
            </Card>
          )}

          {/* Timeline */}
          {data.timeline && data.timeline.length > 0 && (
            <Card style={{ position: "relative", overflow: "hidden" }}>
              <SectionTitle>Timeline</SectionTitle>
              {data.timeline.map((event) => (
                <MetricRow key={event.label}>
                  <MetricLabel>{event.label}</MetricLabel>
                  <MetricValue color="dark">
                    {event.date}
                  </MetricValue>
                </MetricRow>
              ))}
            </Card>
          )}

          {/* Green & Red Flags */}
          {(data.greenFlags?.length || data.yellowFlags?.length || data.redFlags?.length) ? (
            <Card style={{ position: "relative", overflow: "hidden" }}>
              <SectionTitle>Green &amp; Red Flags</SectionTitle>

              {data.greenFlags && data.greenFlags.length > 0 && (
                <FlagList>
                  {data.greenFlags.map((flag, i) => (
                    // eslint-disable-next-line react/no-array-index-key
                    <FlagItemRow key={`gf-${i}`}>
                      <FlagBullet color="#04a584" />
                      <FlagText>{flag.text}</FlagText>
                    </FlagItemRow>
                  ))}
                </FlagList>
              )}

              {data.yellowFlags && data.yellowFlags.length > 0 && (
                <>
                  <FlagDivider />
                  <FlagList>
                    {data.yellowFlags.map((flag, i) => (
                      // eslint-disable-next-line react/no-array-index-key
                      <FlagItemRow key={`yf-${i}`}>
                        <FlagBullet color="#ffc702" />
                        <FlagText>{flag.text}</FlagText>
                      </FlagItemRow>
                    ))}
                  </FlagList>
                </>
              )}

              {data.redFlags && data.redFlags.length > 0 && (
                <>
                  <FlagDivider />
                  <FlagList>
                    {data.redFlags.map((flag, i) => (
                      // eslint-disable-next-line react/no-array-index-key
                      <FlagItemRow key={`rf-${i}`}>
                        <FlagBullet color="#ff5858" />
                        <FlagText>{flag.text}</FlagText>
                      </FlagItemRow>
                    ))}
                  </FlagList>
                </>
              )}
            </Card>
          ) : null}

          {/* ── Your Activity Workspace (EL-1: single workspace, canonical systems) ── */}
          {(() => {
            const ws = data.workspace;
            const calAdded = ws?.calendar?.added ?? isCalendarAdded;
            const boardAdded = Boolean(ws?.board?.added || boardAddedLocal);
            const boardStatus = ws?.board?.status || "";
            const boardNote = ws?.board?.notePreview || "";
            const ft = ws?.fomoTasks;
            const ftCount = Number(ft?.count || 0);
            const ftXp = Number(ft?.totalXp || 0);
            const nextDate = displayDateValue(
              ws?.calendar?.nextDate
                ? new Date(ws.calendar.nextDate).toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" })
                : data.endDate
            );
            const chip = (label: string, value: number, color: string) => (
              <span style={{ fontSize: 11, fontWeight: 700, color, background: "var(--color-surface)", border: "1px solid var(--color-border)", borderRadius: 999, padding: "2px 8px" }}>
                {label}: {value}
              </span>
            );
            return (
          <div data-testid="activity-workspace" style={{ marginTop: 16, background: "var(--color-surface)", border: "1px solid var(--color-border)", borderRadius: 16, padding: 18, boxShadow: "var(--shadow-card)" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4 }}>
              <SparklesIcon size={18} stroke="#04A584" />
              <div style={{ fontSize: 16, fontWeight: 700, color: "var(--color-text-primary)" }}>{translateText("Your Activity Workspace")}</div>
            </div>
            <div style={{ fontSize: 12.5, color: "var(--color-text-secondary)", marginBottom: 14 }}>{translateText("Track, organise and complete this activity with your tools.")}</div>

            {/* Calendar */}
            <div data-testid="ws-calendar" style={{ border: "1px solid var(--color-border)", borderLeft: `3px solid ${calAdded ? "#04A584" : "var(--color-border-strong)"}`, borderRadius: 12, padding: 13, marginBottom: 10, background: "var(--color-surface-raised)" }}>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                <div style={{ display: "flex", alignItems: "center", gap: 8 }}><CalendarIcon stroke={calAdded ? "#04A584" : "#728094"} /><b style={{ fontSize: 13.5, color: "var(--color-text-primary)" }}>{translateText("Calendar")}</b></div>
                {calAdded ? <span data-testid="ws-calendar-added" style={{ fontSize: 11, fontWeight: 700, color: "#04A584", background: "var(--color-primary-soft)", borderRadius: 999, padding: "3px 9px" }}>✓ {translateText("Added")}</span> : null}
              </div>
              <div style={{ fontSize: 12.5, color: "var(--color-text-secondary)", margin: "6px 0 10px" }}>
                {calAdded ? translateText("This activity and its key dates are on your calendar.") : translateText("Track this activity and important dates.")}
                {nextDate !== "--" ? <span style={{ display: "block", marginTop: 4, color: "var(--color-text-primary)", fontWeight: 600 }}>{translateText("Next date")}: {nextDate}</span> : null}
              </div>
              <div style={{ display: "flex", gap: 8 }}>
                <button data-testid="ws-calendar-cta" disabled={pendingAction === "calendar"} onClick={handleCalendar} style={{ flex: 1, border: calAdded ? "1px solid var(--color-border)" : "none", background: calAdded ? "transparent" : "#04A584", color: calAdded ? "var(--color-text-secondary)" : "#fff", fontWeight: 700, fontSize: 12.5, padding: "8px 10px", borderRadius: 9, cursor: "pointer" }}>{calAdded ? translateText("Remove") : translateText("Add to Calendar")}</button>
                {calAdded ? <button data-testid="ws-calendar-open" onClick={() => earlylandRouter.push(ws?.calendar?.href || "/crypto/earlyland/calendar")} style={{ flex: 1, border: "1px solid #04A584", background: "var(--color-primary-soft)", color: "var(--color-primary-dark)", fontWeight: 700, fontSize: 12.5, padding: "8px 10px", borderRadius: 9, cursor: "pointer" }}>{translateText("Open Calendar")}</button> : null}
              </div>
            </div>

            {/* Board */}
            <div data-testid="ws-board" style={{ border: "1px solid var(--color-border)", borderLeft: `3px solid ${boardAdded ? "#04A584" : "var(--color-border-strong)"}`, borderRadius: 12, padding: 13, marginBottom: 10, background: "var(--color-surface-raised)" }}>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                <div style={{ display: "flex", alignItems: "center", gap: 8 }}><GridIcon fill="#04A584" /><b style={{ fontSize: 13.5, color: "var(--color-text-primary)" }}>{translateText("Board")}</b></div>
                {boardAdded ? <span data-testid="ws-board-added" style={{ fontSize: 11, fontWeight: 700, color: "#04A584", background: "var(--color-primary-soft)", borderRadius: 999, padding: "3px 9px" }}>✓ {translateText("On your Board")}</span> : null}
              </div>
              <div style={{ fontSize: 12.5, color: "var(--color-text-secondary)", margin: "6px 0 10px" }}>
                {boardAdded ? translateText("Saved to your personal board.") : translateText("Save this activity to your personal workspace.")}
                {boardAdded && boardStatus ? <span style={{ display: "block", marginTop: 4, color: "var(--color-text-primary)", fontWeight: 600, textTransform: "capitalize" }}>{translateText("Status")}: {boardStatus}</span> : null}
                {boardAdded && boardNote ? <span style={{ display: "block", marginTop: 2, fontStyle: "italic" }}>“{boardNote}”</span> : null}
              </div>
              {boardAdded ? (
                <button data-testid="ws-board-open" onClick={() => earlylandRouter.push(ws?.board?.href || "/crypto/earlyland?tab=board")} style={{ width: "100%", border: "1px solid #04A584", background: "var(--color-primary-soft)", color: "var(--color-primary-dark)", fontWeight: 700, fontSize: 12.5, padding: "8px 10px", borderRadius: 9, cursor: "pointer" }}>{translateText("Open Board")}</button>
              ) : (
                <button data-testid="ws-board-cta" disabled={pendingAction === "board"} onClick={handleAddToBoard} style={{ width: "100%", border: "none", background: "#04A584", color: "#fff", fontWeight: 700, fontSize: 12.5, padding: "8px 10px", borderRadius: 9, cursor: "pointer" }}>{translateText("Add to Board")}</button>
              )}
            </div>

            {/* FOMO Tasks */}
            <div data-testid="ws-tasks" style={{ border: "1px solid var(--color-border)", borderLeft: `3px solid ${ftCount > 0 ? "#04A584" : "var(--color-border-strong)"}`, borderRadius: 12, padding: 13, background: "var(--color-surface-raised)" }}>
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}><TaskIcon fill="#04A584" /><b style={{ fontSize: 13.5, color: "var(--color-text-primary)" }}>{translateText("FOMO Tasks")}</b></div>
              {ftCount > 0 ? (
                <>
                  <div style={{ fontSize: 12.5, color: "var(--color-text-primary)", margin: "6px 0 8px", fontWeight: 600 }}>
                    {ftCount} {translateText("FOMO Tasks")}{ftXp > 0 ? ` · ${translateText("up to")} ${ftXp} XP` : ""}
                  </div>
                  <div data-testid="ws-tasks-breakdown" style={{ display: "flex", flexWrap: "wrap", gap: 6, marginBottom: 10 }}>
                    {chip(translateText("Available"), Number(ft?.available || 0), "#04A584")}
                    {chip(translateText("In progress"), Number(ft?.inProgress || 0), "#B8860B")}
                    {chip(translateText("Review"), Number(ft?.review || 0), "#728094")}
                    {chip(translateText("Completed"), Number(ft?.completed || 0), "#04A584")}
                  </div>
                  <button data-testid="ws-tasks-cta" onClick={() => earlylandRouter.push(ws?.fomoTasks?.href || "/crypto/earlyland?tab=tasks")} style={{ width: "100%", border: "1px solid #04A584", background: "var(--color-primary-soft)", color: "var(--color-primary-dark)", fontWeight: 700, fontSize: 12.5, padding: "8px 10px", borderRadius: 9, cursor: "pointer" }}>{translateText("View Tasks")}</button>
                </>
              ) : (
                <div data-testid="ws-tasks-empty" style={{ fontSize: 12.5, color: "var(--color-text-secondary)", marginTop: 6 }}>{translateText("No team tasks for this activity.")}</div>
              )}
            </div>
          </div>
            );
          })()}
        </RightColumn>
      </div>

      {data.similarProjects && data.similarProjects.length > 0 && (
        <SimilarSection>
          <SimilarSectionTitle>You May Also Like</SimilarSectionTitle>
          <SimilarGrid>
            {data.similarProjects.map((item) => (
              <FeedCard
                key={item.id}
                {...item}
                onToggleFavourite={(itemId, interactionId) =>
                  onToggleSimilarFavourite?.(
                    itemId,
                    interactionId,
                    !item.isFavourite
                  )
                }
                onDetails={onSimilarDetails}
              />
            ))}
          </SimilarGrid>
        </SimilarSection>
      )}

      {/* ── Discussion (EL-1: one canonical thread per activity) — always last ── */}
      <div id="discussion" data-testid="activity-discussion" style={{ marginTop: 24 }}>
        <ActivityDiscussion activityId={data.id} isLogin={isLogin} />
      </div>
    </PageWrapper>
  );
};

export default ProjectDetails;

function displayRichHtml(html?: string, fallbackText?: string): string | undefined {
  return getActivityRichTextHtml(html, fallbackText) || undefined;
}

function stepDisplayTitle(title: string, index: number): string {
  const cleaned = String(title || "")
    .replace(/^step\s+\d+\s*:?\s*/i, "")
    .trim();

  return cleaned || `Step ${index + 1}`;
}

const TaskClockIcon: FC = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 18 18" fill="none">
    <path d="M11.7481 11.1618C12.0101 11.2492 12.2933 11.1076 12.3806 10.8456C12.4679 10.5836 12.3263 10.3005 12.0644 10.2132L11.9062 10.6875L11.7481 11.1618ZM9.375 9.84375H8.875C8.875 10.059 9.01271 10.25 9.21689 10.3181L9.375 9.84375ZM9.875 6.31565C9.875 6.03951 9.65114 5.81565 9.375 5.81565C9.09886 5.81565 8.875 6.03951 8.875 6.31565H9.375H9.875ZM11.9062 10.6875L12.0644 10.2132L9.53311 9.36941L9.375 9.84375L9.21689 10.3181L11.7481 11.1618L11.9062 10.6875ZM9.375 9.84375H9.875V6.31565H9.375H8.875V9.84375H9.375ZM16.125 9H15.625C15.625 12.4518 12.8268 15.25 9.375 15.25V15.75V16.25C13.3791 16.25 16.625 13.0041 16.625 9H16.125ZM9.375 15.75V15.25C5.92322 15.25 3.125 12.4518 3.125 9H2.625H2.125C2.125 13.0041 5.37094 16.25 9.375 16.25V15.75ZM2.625 9H3.125C3.125 5.54822 5.92322 2.75 9.375 2.75V2.25V1.75C5.37094 1.75 2.125 4.99594 2.125 9H2.625ZM9.375 2.25V2.75C12.8268 2.75 15.625 5.54822 15.625 9H16.125H16.625C16.625 4.99594 13.3791 1.75 9.375 1.75V2.25Z" fill="#728094" />
  </svg>
);

const StepsBoltIcon: FC = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none">
    <path d="M5.28881 13.6308L12.278 2.64781C12.5465 2.22579 13.1998 2.41602 13.1998 2.91625V10.6992C13.1998 10.7544 13.2446 10.7992 13.2998 10.7992H18.2395C18.644 10.7992 18.8811 11.2546 18.6491 11.5859L11.7094 21.4998C11.4291 21.9003 10.7998 21.7019 10.7998 21.213V14.4992C10.7998 14.444 10.755 14.3992 10.6998 14.3992H5.71064C5.3161 14.3992 5.07699 13.9636 5.28881 13.6308Z" stroke="#05A584" />
  </svg>
);

const StepCheckedIcon: FC = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none">
    <rect x="3" y="3" width="18" height="18" rx="3" fill="#04A584" />
    <path d="M8.25 12.75L10.5 15L16.5 9" stroke="white" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

const StepUncheckedIcon: FC = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none">
    <path d="M6.375 21C4.51104 21 3 19.489 3 17.625V6.37498C3 4.51103 4.51104 3 6.375 3H17.625C19.489 3 21 4.51103 21 6.37498L21 17.625C21 19.489 19.489 21 17.625 21H6.375Z" stroke="#728094" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

const TaskExternalIcon: FC = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 16 16" fill="none">
    <path d="M7.33317 2.66797H4.6665C3.56193 2.66797 2.6665 3.56339 2.6665 4.66796V11.3346C2.6665 12.4392 3.56193 13.3346 4.6665 13.3346H11.3332C12.4377 13.3346 13.3332 12.4392 13.3332 11.3346V8.66794M9.99951 2.66813L13.3332 2.66797M13.3332 2.66797V5.66803M13.3332 2.66797L7.66602 8.33444" stroke="white" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);
