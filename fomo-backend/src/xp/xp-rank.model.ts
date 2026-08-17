import { Prop, Schema, SchemaFactory } from "@nestjs/mongoose";
import { Document } from "mongoose";

/**
 * Single source of truth for the XP -> Rank progression (SpacePort/Fomies ranks).
 * Config-driven and editable from Admin ("XP / Ранги"). Thresholds are activityXP based.
 * Uses a UUID string _id (project rule: no ObjectId for new collections).
 */
@Schema({ collection: "xp_ranks", timestamps: true, _id: false })
export class XpRank extends Document {
  @Prop({ type: String, required: true })
  _id: string; // uuid

  @Prop({ required: true, unique: true })
  key: string;

  @Prop({ required: true })
  name: string;

  @Prop({ required: true, default: 0 })
  order: number; // 1..N (level)

  @Prop({ required: true, default: 0 })
  minXp: number;

  @Prop({ required: true, default: 0 })
  maxXp: number;

  @Prop({ default: "" })
  icon: string;

  @Prop({ default: "" })
  description: string;

  @Prop({ type: [String], default: [] })
  privileges: string[];

  @Prop({ default: true })
  enabled: boolean;
}

export const XpRankSchema = SchemaFactory.createForClass(XpRank);

/** Default progression extracted from legacy code (user.service getFomiesStatistics switch). */
export const DEFAULT_XP_RANKS: Array<Omit<XpRank, keyof Document | "_id">> = [
  { key: "stellar_awakening", name: "Stellar Awakening", order: 1, minXp: 0, maxXp: 199, icon: "🌠", description: "Entry rank", privileges: [], enabled: true },
  { key: "cosmic_explorer", name: "Cosmic Explorer", order: 2, minXp: 200, maxXp: 399, icon: "🚀", description: "", privileges: [], enabled: true },
  { key: "galactic_navigator", name: "Galactic Navigator", order: 3, minXp: 400, maxXp: 599, icon: "🪐", description: "", privileges: [], enabled: true },
  { key: "celestial_master", name: "Celestial Master", order: 4, minXp: 600, maxXp: 799, icon: "✨", description: "", privileges: [], enabled: true },
  { key: "astral_sage", name: "Astral Sage", order: 5, minXp: 800, maxXp: 899, icon: "🌌", description: "", privileges: [], enabled: true },
  { key: "universal_enlightenment", name: "Universal Enlightenment", order: 6, minXp: 900, maxXp: 1000, icon: "🌟", description: "Top rank", privileges: [], enabled: true },
] as any;

/** XP cap (mirrors platformActivity.maxPoints in unified-rating.defaults.ts). */
export const XP_MAX = 1000;
