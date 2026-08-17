import { Prop, Schema, SchemaFactory } from "@nestjs/mongoose";
import { Document } from "mongoose";

export type UniqueBy = "none" | "source" | "entity" | "day";

/** Config-driven XP earning rules (anti-farm lives here). */
@Schema({ collection: "xp_rules", timestamps: true, _id: false })
export class XpRule extends Document {
  @Prop({ type: String, required: true })
  _id: string; // uuid

  @Prop({ required: true, unique: true })
  eventType: string;

  @Prop({ default: "" })
  group: string; // activity | content | earlyland | contribution | referral | spaceport

  @Prop({ default: true })
  enabled: boolean;

  @Prop({ default: 0 })
  baseXp: number;

  @Prop({ default: 1 })
  multiplier: number;

  @Prop({ default: 0 })
  cooldownSec: number;

  @Prop({ default: 0 })
  dailyCap: number; // 0 = unlimited

  @Prop({ default: 0 })
  lifetimeCap: number; // 0 = unlimited

  @Prop({ default: "none" })
  uniqueBy: UniqueBy;

  @Prop({ default: 0 })
  maxPerEntity: number; // 0 = unlimited (dedup by sourceId)

  @Prop({ default: false })
  verificationRequired: boolean;

  @Prop({ default: true })
  reversible: boolean;

  @Prop({ default: "" })
  description: string;
}

export const XpRuleSchema = SchemaFactory.createForClass(XpRule);

export const DEFAULT_XP_RULES: Array<Omit<XpRule, keyof Document | "_id">> = [
  // Referral
  { eventType: "referral_l1", group: "referral", enabled: true, baseXp: 10, multiplier: 1, cooldownSec: 0, dailyCap: 0, lifetimeCap: 0, uniqueBy: "entity", maxPerEntity: 1, verificationRequired: true, reversible: true, description: "Qualified L1 referral (once per referred user)" },
  { eventType: "referral_l2", group: "referral", enabled: true, baseXp: 5, multiplier: 1, cooldownSec: 0, dailyCap: 0, lifetimeCap: 0, uniqueBy: "entity", maxPerEntity: 1, verificationRequired: true, reversible: true, description: "Qualified L2 referral (once per referred user)" },
  // EarlyLand
  { eventType: "earlyland_task", group: "earlyland", enabled: true, baseXp: 0, multiplier: 1, cooldownSec: 0, dailyCap: 0, lifetimeCap: 0, uniqueBy: "entity", maxPerEntity: 1, verificationRequired: true, reversible: true, description: "Verified EarlyLand task completion; XP from task.points" },
  // Unified user task completion (Core/global & campaign tasks) — the canonical
  // reward path for the Task Center. XP comes from task.points (baseXpOverride).
  { eventType: "task_completed", group: "activity", enabled: true, baseXp: 0, multiplier: 1, cooldownSec: 0, dailyCap: 0, lifetimeCap: 0, uniqueBy: "entity", maxPerEntity: 1, verificationRequired: true, reversible: true, description: "Verified user task completion (Core/global & campaign); XP from task.points" },
  // Content
  { eventType: "chat_message", group: "content", enabled: true, baseXp: 1, multiplier: 1, cooldownSec: 15, dailyCap: 30, lifetimeCap: 0, uniqueBy: "none", maxPerEntity: 0, verificationRequired: false, reversible: true, description: "Chat message (anti-spam capped)" },
  { eventType: "comment_created", group: "content", enabled: true, baseXp: 2, multiplier: 1, cooldownSec: 10, dailyCap: 20, lifetimeCap: 0, uniqueBy: "none", maxPerEntity: 0, verificationRequired: false, reversible: true, description: "Comment created (anti-spam capped)" },
  // Social
  { eventType: "twitter_action", group: "activity", enabled: true, baseXp: 3, multiplier: 1, cooldownSec: 0, dailyCap: 0, lifetimeCap: 0, uniqueBy: "source", maxPerEntity: 1, verificationRequired: true, reversible: true, description: "Verified Twitter/social action (dedup per task/account/action)" },
  // Contribution (Phase 5 wiring; rule ready)
  { eventType: "contribution_verified", group: "contribution", enabled: true, baseXp: 8, multiplier: 1, cooldownSec: 0, dailyCap: 0, lifetimeCap: 0, uniqueBy: "entity", maxPerEntity: 1, verificationRequired: true, reversible: true, description: "Verified flag/report/data-correction/source" },
  // SpacePort
  { eventType: "spaceport_reward", group: "spaceport", enabled: true, baseXp: 0, multiplier: 1, cooldownSec: 0, dailyCap: 0, lifetimeCap: 0, uniqueBy: "entity", maxPerEntity: 1, verificationRequired: true, reversible: true, description: "Confirmed SpacePort action reward; XP from reward.rewardXp (staking != rank)" },
  { eventType: "spaceport_stake_started", group: "spaceport", enabled: true, baseXp: 0, multiplier: 1, cooldownSec: 0, dailyCap: 0, lifetimeCap: 0, uniqueBy: "source", maxPerEntity: 1, verificationRequired: false, reversible: true, description: "SpacePort NFT staking started (event log, 0 XP)" },
  { eventType: "spaceport_staking_milestone", group: "spaceport", enabled: true, baseXp: 0, multiplier: 1, cooldownSec: 0, dailyCap: 0, lifetimeCap: 0, uniqueBy: "source", maxPerEntity: 1, verificationRequired: false, reversible: true, description: "One-time staking milestone (7/30/90/180/365d); XP from milestone override, moderated by tier multiplier + diminishing returns" },
  { eventType: "spaceport_staking_continuous_30d", group: "spaceport", enabled: true, baseXp: 10, multiplier: 1, cooldownSec: 0, dailyCap: 0, lifetimeCap: 12, uniqueBy: "source", maxPerEntity: 1, verificationRequired: false, reversible: true, description: "Continuous staking bonus per full 30 days after first 30 (lifetime cap ~120 XP/yr)" },
  { eventType: "spaceport_level_unlocked", group: "spaceport", enabled: true, baseXp: 0, multiplier: 1, cooldownSec: 0, dailyCap: 0, lifetimeCap: 0, uniqueBy: "entity", maxPerEntity: 1, verificationRequired: false, reversible: true, description: "One-time SpacePort level unlock bonus (Lv2 +25 / Lv3 +50 / Lv4 +75 / Lv5 +100)" },
  { eventType: "spaceport_badge_unlocked", group: "spaceport", enabled: true, baseXp: 0, multiplier: 1, cooldownSec: 0, dailyCap: 0, lifetimeCap: 0, uniqueBy: "entity", maxPerEntity: 1, verificationRequired: false, reversible: true, description: "One-time SpacePort badge/achievement bonus (per badgeId)" },
  { eventType: "spaceport_stake_broken", group: "spaceport", enabled: true, baseXp: 0, multiplier: 1, cooldownSec: 0, dailyCap: 0, lifetimeCap: 0, uniqueBy: "none", maxPerEntity: 0, verificationRequired: false, reversible: false, description: "SpacePort stake broken (event log; stops future milestones, does not remove historical XP)" },
  { eventType: "spaceport_nft_unstaked", group: "spaceport", enabled: true, baseXp: 0, multiplier: 1, cooldownSec: 0, dailyCap: 0, lifetimeCap: 0, uniqueBy: "none", maxPerEntity: 0, verificationRequired: false, reversible: false, description: "SpacePort NFT unstaked (event log, 0 XP)" },
] as any;
