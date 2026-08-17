import { Prop, Schema, SchemaFactory } from "@nestjs/mongoose";
import { Document } from "mongoose";
import { v4 as uuidv4 } from "uuid";

/**
 * Admin-editable Spaceport configuration (single document).
 * Spaceport is NOT a second XP scale: it is one SOURCE of the single global activityXP.
 * Levels Lv.1-Lv.5 are a staking STATUS ladder (not the XP rank).
 */
@Schema({ collection: "spaceport_config", timestamps: true })
export class SpaceportConfig extends Document {
  @Prop({ type: String, default: () => uuidv4() })
  _id: string;

  @Prop({ type: [{ days: Number, xp: Number, active: Boolean }], default: [] })
  milestones: { days: number; xp: number; active: boolean }[];

  @Prop({ type: [Number], default: [1, 3, 6, 12, 18, 24] })
  stakingPeriodsMonths: number[];

  @Prop({ type: Array, default: [] })
  levels: any[];

  @Prop({ type: Number, default: 1 })
  version: number;
}
export const SpaceportConfigSchema = SchemaFactory.createForClass(SpaceportConfig);

/** Per-user Spaceport state (selected staking commitment period). */
@Schema({ collection: "spaceport_user_state", timestamps: true })
export class SpaceportUserState extends Document {
  @Prop({ type: String, default: () => uuidv4() })
  _id: string;

  @Prop({ type: String, index: true, required: true })
  userId: string;

  @Prop({ type: Number, default: 0 })
  selectedPeriodDays: number;
}
export const SpaceportUserStateSchema = SchemaFactory.createForClass(SpaceportUserState);

export const DEFAULT_SPACEPORT_MILESTONES = [
  { days: 30, xp: 15, active: true },
  { days: 60, xp: 15, active: true },
  { days: 90, xp: 20, active: true },
  { days: 180, xp: 30, active: true },
  { days: 365, xp: 50, active: true },
  { days: 540, xp: 60, active: true },
  { days: 730, xp: 80, active: true },
];

export const DEFAULT_SPACEPORT_LEVELS = [
  { level: 1, name: "Novice", description: "NFT staking activated.", minLifetimeDays: 0, minActivityXp: 0, requiresNft: true, minLaunchpad: 0, minTrades: 0, benefits: ["Access to Launchpad participation"], active: true },
  { level: 2, name: "Explorer", description: "First weeks of staking and basic activity.", minLifetimeDays: 30, minActivityXp: 200, requiresNft: true, minLaunchpad: 0, minTrades: 0, benefits: ["Early access to new drops"], active: true },
  { level: 3, name: "Collector", description: "Long-term staking and ecosystem participation.", minLifetimeDays: 90, minActivityXp: 400, requiresNft: true, minLaunchpad: 1, minTrades: 0, benefits: ["Launchpad allocation bonus"], active: true },
  { level: 4, name: "Master", description: "Long-term staking and platform activity.", minLifetimeDays: 180, minActivityXp: 600, requiresNft: true, minLaunchpad: 2, minTrades: 5, benefits: ["Priority access to drops"], active: true },
  { level: 5, name: "Legend", description: "Top long-term Spaceport status.", minLifetimeDays: 365, minActivityXp: 800, requiresNft: true, minLaunchpad: 3, minTrades: 10, benefits: ["Maximum Spaceport status and perks"], active: true },
];
