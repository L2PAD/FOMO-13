import { Prop, Schema, SchemaFactory } from "@nestjs/mongoose";
import { HydratedDocument } from "mongoose";

export type BadgeCategory =
  | "STAKING"
  | "SPACEPORT"
  | "TRADE"
  | "ACTIVITY"
  | "REFERRAL"
  | "NFT"
  | "CONTENT"
  | "PORTFOLIO"
  | "EARLYLAND"
  | "CONTRIBUTION"
  | "LAUNCHPAD"
  | "SPECIAL";

export type BadgeAwardMode = "automatic" | "manual" | "both";
export type BadgeRarity = "common" | "uncommon" | "rare" | "epic" | "legendary";
export type ConditionOperator = ">=" | ">" | "=" | "<=" | "<";

export interface BadgeCondition {
  metric: string;
  op: ConditionOperator;
  value: number;
  unit?: string;
  label?: string;
}

export interface BadgeCriteria {
  logic: "AND" | "OR";
  conditions: BadgeCondition[];
}

export type BadgeDefinitionDocument = HydratedDocument<BadgeDefinition>;

@Schema({ collection: "badge_definitions", timestamps: true })
export class BadgeDefinition {
  @Prop({ required: true, unique: true, index: true })
  code: string;

  @Prop({ required: true })
  name: string;

  @Prop({ default: "" })
  description: string;

  @Prop({ required: true, index: true })
  category: BadgeCategory;

  // Frontend-resolvable icon key (svg key like "nova" or asset name like "XP Pioneer").
  @Prop({ default: "" })
  icon: string;

  @Prop({ default: "blue" })
  visualTier: string;

  @Prop({ default: "common" })
  rarity: BadgeRarity;

  @Prop({ default: true, index: true })
  active: boolean;

  @Prop({ default: "automatic" })
  awardMode: BadgeAwardMode;

  @Prop({ type: Object, default: { logic: "AND", conditions: [] } })
  criteria: BadgeCriteria;

  // Default 0 => badge does NOT grant XP (avoids double counting).
  @Prop({ default: 0 })
  xpReward: number;

  @Prop({ default: 100 })
  displayPriority: number;

  @Prop({ default: true })
  publicVisible: boolean;

  @Prop({ default: false })
  hiddenProgress: boolean;

  // permanent: kept forever once earned. dynamic: revoked automatically when criteria no longer met.
  @Prop({ default: "permanent" })
  retentionMode: "permanent" | "dynamic";
}

export const BadgeDefinitionSchema = SchemaFactory.createForClass(BadgeDefinition);
