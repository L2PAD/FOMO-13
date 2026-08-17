import React from "react";
import NovaIcon from "../../../global/Icons/Nova";
import NebulaIcon from "../../../global/Icons/Nebula";
import PulsarIcon from "../../../global/Icons/Pulsar";
import QuasarIcon from "../../../global/Icons/Quasar";
import SupernovaIcon from "../../../global/Icons/Supernova";
import GalaxyIcon from "../../../global/Icons/Galaxy";
import CosmosIcon from "../../../global/Icons/Cosmos";
import GxpStellarAwakening from "../../../global/Icons/gxp/GxpStellarAwakening";
import GxpCosmicExplorer from "../../../global/Icons/gxp/GxpCosmicExplorer";
import GxpGalacticNavigator from "../../../global/Icons/gxp/GxpGalacticNavigator";
import GxpCelestialMaster from "../../../global/Icons/gxp/GxpCelestialMaster";
import GxpAstralSage from "../../../global/Icons/gxp/GxpAstralSage";
import GxpUniversalEnlightenment from "../../../global/Icons/gxp/GxpUniversalEnlightenment";

export const EARN_XP = [
  { label: "Daily Staking", value: "5-10 XP per day based on total staking days" },
  { label: "Milestone Bonus", value: "+100 to +1,200 XP at key staking milestones" },
  { label: "Additional NFTs", value: "+15 XP one-time for each extra NFT in staking" },
];

export const BADGE_ICON_MAP: Record<string, React.FC<{ fill?: string }>> = {
  Nova: NovaIcon,
  Nebula: NebulaIcon,
  Pulsar: PulsarIcon,
  Quasar: QuasarIcon,
  Supernova: SupernovaIcon,
  Galaxy: GalaxyIcon,
  Cosmos: CosmosIcon,
};

// Custom hand-drawn SVG icons for the 6 GLOBAL XP RANKS (replaces emojis).
// Keyed by canonical rank name AND lowercase key for resilient matching.
export const GLOBAL_RANK_ICON_MAP: Record<string, React.FC<{ width?: number; height?: number; className?: string }>> = {
  "Stellar Awakening": GxpStellarAwakening,
  "Cosmic Explorer": GxpCosmicExplorer,
  "Galactic Navigator": GxpGalacticNavigator,
  "Celestial Master": GxpCelestialMaster,
  "Astral Sage": GxpAstralSage,
  "Universal Enlightenment": GxpUniversalEnlightenment,
  stellar_awakening: GxpStellarAwakening,
  cosmic_explorer: GxpCosmicExplorer,
  galactic_navigator: GxpGalacticNavigator,
  celestial_master: GxpCelestialMaster,
  astral_sage: GxpAstralSage,
  universal_enlightenment: GxpUniversalEnlightenment,
};
