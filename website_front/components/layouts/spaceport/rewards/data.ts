import { HowToStep } from "./types";

/**
 * Staking rewards are driven by the canonical admin `SpaceportConfig.milestones`
 * (measured in staking DAYS). Mock NFT reward images were removed (P0) — reward
 * cards now render the unified badge visual instead of hardcoded artwork.
 */
export const HOW_TO_STEPS: HowToStep[] = [
  {
    number: 1,
    title: "Stake Your NFTs",
    description: "Keep your NFTs staked until you reach each staking day milestone",
  },
  {
    number: 2,
    title: "Track Your Days",
    description: "Rewards unlock by total staking days configured by the team",
  },
  {
    number: 3,
    title: "Claim XP",
    description: "When a staking day milestone is reached, claim the reward to add XP to activityXP",
  },
];
