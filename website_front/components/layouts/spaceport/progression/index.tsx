import React, { useContext, useEffect, useMemo, useState } from "react";
import { CheckCircle2, Gift, Trophy, Lock, Star } from "lucide-react";
import {
  BadgeCard,
  BadgeGrid,
  BadgeProgress,
  EarnXPCard,
  EarnXPRow,
  HiddenHintRow,
  LevelBadge,
  LevelCard,
  LevelsRow,
  ProgressBarBg,
  ProgressBarFill,
  ProgressionWrapper,
  RequirementCard,
  RequirementGrid,
  SectionPanel,
  SectionTitle,
  SingularityPanel,
  SingularityStat,
  SingularityStatsRow,
  StarMapCard,
  StatusBadge,
  UnlockRow,
  XPCard,
} from "./styles";
import StarIcon from "../../../global/Icons/Star";
import LockIcon from "../../../global/Icons/Lock";
import SparklesIcon from "../../../global/Icons/SparklesIcon";
import { AuthContext } from "../../../global/Layout";
import BadgeHex from "../../../global/BadgeHex";
import fetchUserBadges, { PublicUserBadge } from "../../../../http/user/fetchUserBadges";
import fetchAllBadges, { PublicBadge } from "../../../../http/badges/fetchAllBadges";
import { BadgeStatus } from "./types";
import { EARN_XP, BADGE_ICON_MAP, GLOBAL_RANK_ICON_MAP } from "./data";
import fetchSpaceportLevelsConfig, {
  SpaceportLevelConfig,
} from "../../../../http/spaceport/fetchSpaceportLevelsConfig";
import { useTranslation } from "i18n";

type SpaceportBadgeKey =
  | "nova"
  | "quasar"
  | "nebula"
  | "pulsar"
  | "supernova"
  | "galaxy"
  | "cosmos";

type SpaceportBadgeMetric =
  | "stakingDays"
  | "xp"
  | "stakedNfts"
  | "tasks"
  | "otcVolumeUsd"
  | "launchpads"
  | "primeProjects"
  | "accountLevel";

type SpaceportBadgeRequirement = {
  metric?: SpaceportBadgeMetric;
  label?: string;
  required?: number;
  current?: number;
  complete?: boolean;
  progressPercent?: number;
};

const SPACEPORT_BADGE_ORDER: SpaceportBadgeKey[] = [
  "nova",
  "quasar",
  "nebula",
  "pulsar",
  "supernova",
  "galaxy",
  "cosmos",
];
const SPACEPORT_BADGE_NAMES: Record<SpaceportBadgeKey, string> = {
  nova: "Nova",
  quasar: "Quasar",
  nebula: "Nebula",
  pulsar: "Pulsar",
  supernova: "Supernova",
  galaxy: "Galaxy",
  cosmos: "Cosmos",
};
const EARN_XP_KEYS = [
  ["spaceport.progression.earnXp.dailyStaking", "spaceport.progression.earnXp.dailyStakingValue"],
  ["spaceport.progression.earnXp.milestoneBonus", "spaceport.progression.earnXp.milestoneBonusValue"],
  ["spaceport.progression.earnXp.additionalNfts", "spaceport.progression.earnXp.additionalNftsValue"],
];
const XP_FORMATTER = new Intl.NumberFormat("en-US");

const formatXp = (value: number): string => {
  return XP_FORMATTER.format(Math.max(0, Math.round(Number(value) || 0)));
};

const normalizeValue = (value: unknown): number => {
  const numericValue = Number(value || 0);

  if (!Number.isFinite(numericValue) || numericValue <= 0) {
    return 0;
  }

  return numericValue;
};

const toPercent = (current: number, required: number): number => {
  if (required <= 0) {
    return 100;
  }

  return Math.max(0, Math.min(100, Math.round((current / required) * 100)));
};

const BadgeStatusTag: React.FC<{ status: BadgeStatus }> = ({ status }) => {
  const { t } = useTranslation();

  if (status === "earned") {
    return (
      <StatusBadge>
        <CheckCircle2 size={16} color="#05A584" />
        <span>{t("spaceport.progression.earned")}</span>
      </StatusBadge>
    );
  }
  return (
    <StatusBadge className="locked">
      <Lock size={16} color="#728094" />
      <span>{t("spaceport.progression.locked")}</span>
    </StatusBadge>
  );
};

const BadgeIcon: React.FC<{ name: string; earned: boolean }> = ({ name, earned }) => {
  const Icon = BADGE_ICON_MAP[name];
  if (!Icon) return null;
  return <Icon fill={earned ? "#05A584" : "#b5bcc7"} />;
};

export const Progression: React.FC = () => {
  const { t } = useTranslation();
  const { userData } = useContext(AuthContext);
  const spaceportProgression = userData?.spaceportProgression;
  const currentXP = normalizeValue(userData?.activityXP);

  // P6: live badges from the Universal Badge Engine (no more static/empty maps).
  const userId = (userData as any)?._id ? String((userData as any)._id) : "";
  const [liveEarned, setLiveEarned] = useState<Record<string, PublicUserBadge>>({});
  const [badgeCatalog, setBadgeCatalog] = useState<PublicBadge[]>([]);
  const [showAllBadges, setShowAllBadges] = useState(false);
  const BADGES_PREVIEW = 9;
  useEffect(() => {
    let active = true;
    fetchAllBadges().then((list) => { if (active) setBadgeCatalog(list); });
    return () => { active = false; };
  }, []);
  useEffect(() => {
    let active = true;
    if (!userId) { setLiveEarned({}); return; }
    fetchUserBadges(userId).then((list) => {
      if (!active) return;
      const map: Record<string, PublicUserBadge> = {};
      for (const b of list) map[b.code] = b;
      setLiveEarned(map);
    });
    return () => { active = false; };
  }, [userId]);

  // GLOBAL XP RANK — single platform scale (activityXP 0–1000 -> 6 ranks).
  const globalXp: any = spaceportProgression?.globalXp;
  const gxpActivity = normalizeValue(globalXp?.activityXp ?? currentXP);
  const gxpMax = normalizeValue(globalXp?.xpMax) || 1000;
  const gxpRankName = globalXp?.rankName || "Stellar Awakening";
  const gxpToNext = normalizeValue(globalXp?.xpToNextRank ?? 200);
  const gxpNextRankName = globalXp ? globalXp.nextRankName : "Cosmic Explorer";
  const gxpPercent = globalXp ? normalizeValue(globalXp.progressPercent) : 0;

  // SPACEPORT LEVEL — status ladder (requirement-based), NOT a separate XP scale.
  // Authenticated users get the ladder from their live progression payload; anyone
  // else falls back to the PUBLIC backend config so the ladder, real requirements
  // and "What You Unlock" privileges are ALWAYS backend-driven (never hardcoded).
  const backendLevels: any[] = Array.isArray((spaceportProgression as any)?.levels)
    ? (spaceportProgression as any).levels
    : [];

  const [configLevels, setConfigLevels] = useState<SpaceportLevelConfig[]>([]);

  useEffect(() => {
    let active = true;

    // Only fetch the public config when the user has no live progression ladder.
    if (backendLevels.length > 0) {
      return;
    }

    fetchSpaceportLevelsConfig()
      .then((config) => {
        if (active && Array.isArray(config?.levels)) {
          setConfigLevels(config.levels);
        }
      })
      .catch(() => {
        /* handled inside helper */
      });

    return () => {
      active = false;
    };
  }, [backendLevels.length]);

  const spLevels: any[] = backendLevels.length > 0 ? backendLevels : configLevels;
  const currentSp = spLevels.find((l) => l.isCurrent) || spLevels[0] || null;
  const nextSp = spLevels.find((l) => l.isNext) || null;

  const getLevelName = (name: string) =>
    t(`spaceport.progression.levelNames.${(name || "").toLowerCase()}`, {
      defaultValue: name,
    });

  const computedBadges = useMemo(() => {
    return SPACEPORT_BADGE_ORDER.map((key) => {
      const badge = spaceportProgression?.badges?.[key];

      if (!badge) {
        return {
          name: SPACEPORT_BADGE_NAMES[key],
          requirement: "",
          status: "locked" as BadgeStatus,
          progressPercent: 0,
          progressLabel: t("spaceport.progression.noProgressionData"),
        };
      }

      const normalizedRequirements: Array<
        SpaceportBadgeRequirement & {
          required: number;
          current: number;
          complete: boolean;
          progressPercent: number;
        }
      > = Array.isArray(badge.requirements)
        ? (badge.requirements as SpaceportBadgeRequirement[]).map((requirement) => {
            const required = normalizeValue(requirement?.required);
            const current =
              requirement?.metric === "xp"
                ? currentXP
                : normalizeValue(requirement?.current);
            const complete = current >= required;

            return {
              ...requirement,
              required,
              current,
              complete,
              progressPercent: toPercent(current, required),
            };
          })
        : [];

      const completedRequirements = normalizedRequirements.filter(
        (requirement: SpaceportBadgeRequirement & { complete: boolean }) => requirement.complete
      ).length;
      const totalRequirements = normalizedRequirements.length;
      const progressPercent =
        totalRequirements > 0
          ? Math.round(
              normalizedRequirements.reduce(
                (
                  sum: number,
                  requirement: SpaceportBadgeRequirement & { progressPercent: number }
                ) => sum + requirement.progressPercent,
                0
              ) / totalRequirements
            )
          : 0;
      const isEarned = completedRequirements === totalRequirements && totalRequirements > 0;

      return {
        name: badge.name || SPACEPORT_BADGE_NAMES[key],
        requirement:
          badge.requirementText ||
          normalizedRequirements
            .map((requirement: SpaceportBadgeRequirement) => requirement.label || "")
            .filter(Boolean)
            .join(" | "),
        status: isEarned
          ? ("earned" as BadgeStatus)
          : progressPercent > 0
            ? ("progress" as BadgeStatus)
            : ("locked" as BadgeStatus),
        progressPercent,
        progressLabel:
          totalRequirements > 0
            ? t("spaceport.progression.requirementsCompleted", {
              values: { completed: completedRequirements, total: totalRequirements },
            })
            : (badge.progressLabel || ""),
      };
    });
  }, [currentXP, spaceportProgression?.badges]);

  const earnedBadgesCount = Object.keys(liveEarned).length;

  return (
    <ProgressionWrapper>
      {/* GLOBAL XP PROGRESS — platform-wide rank derived from activityXP (0–1000) */}
      <StarMapCard>
        <div className="header">
          <span className="title">{t("spaceport.progression.globalXpTitle")}</span>
          <span className="subtitle">{t("spaceport.progression.globalXpSubtitle")}</span>
        </div>
        <XPCard>
          <div className="top-row">
            <div className="level-group">
              <span className="level-label">{t("spaceport.progression.globalRank")}</span>
              <div className="level-value-row">
                <span className="level-number" style={{ display: "inline-flex", alignItems: "center" }}>
                  {(() => {
                    const RankIcon =
                      GLOBAL_RANK_ICON_MAP[gxpRankName] ||
                      GLOBAL_RANK_ICON_MAP[(globalXp?.rankKey as string) || ""] ||
                      GLOBAL_RANK_ICON_MAP["Stellar Awakening"];
                    return <RankIcon width={40} height={40} />;
                  })()}
                </span>
                <LevelBadge><span>{gxpRankName}</span></LevelBadge>
              </div>
            </div>
            <div className="xp-group">
              <span className="xp-label">{t("spaceport.progression.xpProgress")}</span>
              <span className="xp-value">{formatXp(gxpActivity)} / {formatXp(gxpMax)} XP</span>
            </div>
          </div>
          <ProgressBarBg><ProgressBarFill percent={gxpPercent} /></ProgressBarBg>
          <span className="xp-hint">
            {gxpNextRankName
              ? t("spaceport.progression.toNextRank", { values: { xp: formatXp(gxpToNext), rank: gxpNextRankName } })
              : t("spaceport.progression.maxRankReached")}
          </span>
        </XPCard>
      </StarMapCard>

      {/* SPACEPORT LEVEL — status ladder (staking + XP + activity), not a second XP */}
      <StarMapCard>
        <div className="header">
          <span className="title">{t("spaceport.progression.starMapProgression")}</span>
          <span className="subtitle">{t("spaceport.progression.spaceportLevelSubtitle")}</span>
        </div>
        <XPCard>
          <div className="top-row">
            <div className="level-group">
              <span className="level-label">{t("spaceport.progression.currentLevel")}</span>
              <div className="level-value-row">
                <span className="level-number">{t("spaceport.progression.levelPrefix")}{currentSp?.level ?? 1}</span>
                <LevelBadge><span>{getLevelName(currentSp?.name ?? "Novice")}</span></LevelBadge>
              </div>
            </div>
            {nextSp && (
              <div className="xp-group">
                <span className="xp-label">{t("spaceport.progression.nextLevel")}</span>
                <span className="xp-value">{t("spaceport.progression.levelPrefix")}{nextSp.level} · {getLevelName(nextSp.name)}</span>
              </div>
            )}
          </div>
        </XPCard>
      </StarMapCard>

      <LevelsRow>
        {spLevels.map((lvl) => (
          <LevelCard key={lvl.level} active={lvl.isCurrent}>
            {lvl.reached ? <StarIcon /> : <LockIcon />}
            <div style={{ display: "flex", flexDirection: "column", gap: 8, alignItems: "center", width: "100%" }}>
              <span className="level-num">{t("spaceport.progression.levelPrefix")}{lvl.level}</span>
              <span className="level-name">{getLevelName(lvl.name)}</span>
            </div>
            <span className="level-req">
              {lvl.totalRequirements > 0
                ? t("spaceport.progression.reqMet", { values: { met: lvl.metRequirements, total: lvl.totalRequirements } })
                : t("spaceport.progression.baseAccess")}
            </span>
          </LevelCard>
        ))}
      </LevelsRow>

      {/* Requirements checklist for the NEXT SpacePort level (real conditions) */}
      {nextSp && Array.isArray(nextSp.requirements) && nextSp.requirements.length > 0 && (
        <SectionPanel>
          <SectionTitle>
            {t("spaceport.progression.requirementsForLevel", { values: { level: nextSp.level, name: getLevelName(nextSp.name) } })}
          </SectionTitle>
          {nextSp.requirements.map((req: any) => (
            <UnlockRow key={`${req.metric}-${req.label}`}>
              {req.met ? <CheckCircle2 size={20} color="#05a584" /> : <Lock size={20} color="#728094" />}
              <span className="text">{req.label} — {formatXp(req.current)}/{formatXp(req.required)}</span>
            </UnlockRow>
          ))}
        </SectionPanel>
      )}

      {/* What You Unlock at the next level — privileges from backend (planned marked) */}
      {nextSp && Array.isArray(nextSp.privileges) && nextSp.privileges.length > 0 && (
        <SectionPanel>
          <SectionTitle>{t("spaceport.progression.unlockAtLevel", { values: { level: nextSp.level } })}</SectionTitle>
          {nextSp.privileges.map((p: any) => (
            <UnlockRow key={p.key}>
              {p.status === "active" ? <CheckCircle2 size={20} color="#05a584" /> : <Lock size={20} color="#728094" />}
              <span className="text">{p.label}{p.status === "planned" ? ` · ${t("spaceport.progression.planned")}` : ""}</span>
            </UnlockRow>
          ))}
        </SectionPanel>
      )}

      <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
        <SectionTitle>{t("spaceport.progression.badgesAchievements")}</SectionTitle>

        <BadgeGrid>
          {badgeCatalog.length === 0 ? (
            <span className="badge-req">{t("spaceport.progression.badgesAchievements")}</span>
          ) : (
            (showAllBadges ? badgeCatalog : badgeCatalog.slice(0, BADGES_PREVIEW)).map((badge) => {
              const earnedRec = liveEarned[badge.code];
              const isEarned = !!earnedRec;
              const isSecret = !!badge.hiddenProgress && !isEarned;
              return (
                <BadgeCard key={badge.code} earned={isEarned}>
                  <BadgeHex icon={badge.icon} size={56} earned={isEarned} hidden={isSecret} />
                  <div
                    style={{
                      display: "flex",
                      flexDirection: "column",
                      gap: 8,
                      alignItems: "center",
                      width: "100%",
                    }}
                  >
                    <span className="badge-name">{isSecret ? "Secret" : badge.name}</span>
                    <span className="badge-req">{isSecret ? "Hidden achievement" : badge.description || ""}</span>
                  </div>
                  <BadgeStatusTag status={isEarned ? "earned" : "locked"} />
                </BadgeCard>
              );
            })
          )}
        </BadgeGrid>
        {badgeCatalog.length > BADGES_PREVIEW ? (
          <button
            type="button"
            data-testid="badges-show-more"
            onClick={() => setShowAllBadges((v) => !v)}
            style={{
              alignSelf: "center",
              marginTop: 4,
              padding: "10px 22px",
              borderRadius: 999,
              border: "1px solid rgba(32,130,234,0.35)",
              background: "rgba(32,130,234,0.06)",
              color: "#2082EA",
              fontSize: 14,
              fontWeight: 700,
              cursor: "pointer",
            }}
          >
            {showAllBadges ? "Show less" : `Show more (${badgeCatalog.length - BADGES_PREVIEW})`}
          </button>
        ) : null}
      </div>

      <SectionPanel>
        <SectionTitle>{t("spaceport.progression.howToEarnXp")}</SectionTitle>
        <EarnXPRow>
          {EARN_XP.map((item, index) => (
            <EarnXPCard key={item.label}>
              <Gift size={44} color="#2082EA" strokeWidth={0.9} />
              <div className="text-group">
                <span className="earn-title">{EARN_XP_KEYS[index]?.[0] ? t(EARN_XP_KEYS[index][0]) : item.label}</span>
                <span className="earn-value">{EARN_XP_KEYS[index]?.[1] ? t(EARN_XP_KEYS[index][1]) : item.value}</span>
              </div>
            </EarnXPCard>
          ))}
        </EarnXPRow>
      </SectionPanel>
    </ProgressionWrapper>
  );
};
