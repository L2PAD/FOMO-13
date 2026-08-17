import { StepType } from "../types/global_types";

const stepsInitial: StepType[] = [
  {
    text: "Connect your wallet",
    handler: "wallet",
    isActive: false,
    isAvailable: false,
    index: 1,
  },
  {
    text: "Connect and follow FOMO on Twitter",
    handler: "twitter",
    isActive: false,
    isAvailable: false,
    index: 2,
  },
  {
    text: "Join FOMO on Discord",
    handler: "discord",
    isActive: false,
    isAvailable: false,
    index: 3,
  },
  {
    text: "Join FOMO on Telegram",
    handler: "telegram",
    isActive: false,
    isAvailable: false,
    index: 4,
  },
];

export { stepsInitial };
