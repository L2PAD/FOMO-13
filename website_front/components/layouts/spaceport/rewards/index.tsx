import React, { useContext, useMemo, useState } from "react";
import { Gift, Lock, CheckCircle2, Clock, Sparkles } from "lucide-react";
import { toast } from "react-toastify";
import {
  ActionButton,
  CardBadgeRow,
  CardImageArea,
  CardInfo,
  CardMeta,
  EmptyRewards,
  HowToCard,
  HowToSection,
  RewardCard,
  RewardsGrid,
  RewardsWrapper,
  SectionTitle,
  StatCard,
  StatsRow,
  StatusBadge,
  StepNumber,
  StepText,
} from "./styles";
import { RewardStatus, RewardItem } from "./types";
import { HOW_TO_STEPS } from "./data";
import BadgeHex from "../../../global/BadgeHex";
import { AuthContext } from "../../../global/Layout";
import claimSpaceportReward from "../../../../http/user/claimSpaceportReward";
import { useTranslation } from "i18n";

const BadgeIcon: React.FC<{ status: RewardStatus }> = ({ status }) => {
  if (status === "ready") return <Gift size={16} />;
  if (status === "claimed") return <CheckCircle2 size={16} />;
  return <Lock size={16} />;
};

const getBadgeLabel = (status: RewardStatus, t: (key: string) => string): string => {
  if (status === "ready") return t("spaceport.rewards.readyToClaim");
  if (status === "claimed") return t("spaceport.rewards.claimed");
  return t("spaceport.rewards.locked");
};

const ActionIcon: React.FC<{ status: RewardStatus }> = ({ status }) => {
  if (status === "ready") return <Gift size={16} color="#fff" />;
  if (status === "claimed") return <CheckCircle2 size={16} />;
  return <Lock size={16} />;
};

const statusToBadgeVariant = (status: RewardStatus): "ready" | "claimed" | "locked" => {
  if (status === "ready") return "ready";
  if (status === "claimed") return "claimed";
  return "locked";
};

const statusToActionVariant = (status: RewardStatus): "claim" | "claimed" | "locked" => {
  if (status === "ready") return "claim";
  if (status === "claimed") return "claimed";
  return "locked";
};

const getActionLabel = (
  item: RewardItem,
  isClaiming: boolean,
  t: (key: string, options?: any) => string
): string => {
  if (isClaiming) {
    return t("spaceport.rewards.claiming");
  }

  if (item.status === "ready") {
    return item.claimXp && item.claimXp > 0
      ? t("spaceport.rewards.claimXp", { values: { xp: item.claimXp } })
      : t("spaceport.rewards.claimReward");
  }

  if (item.status === "claimed") {
    return t("spaceport.rewards.claimed");
  }

  return t("spaceport.rewards.locked");
};

const RewardCardItem: React.FC<{
  item: RewardItem;
  isClaiming: boolean;
  onClaim: (badgeKey: string) => void;
}> = ({ item, isClaiming, onClaim }) => {
  const { t } = useTranslation();

  return (
    <RewardCard glow={item.status === "ready"}>
      <CardImageArea>
        <BadgeHex
          icon="clock"
          size={72}
          earned={item.status !== "locked"}
          progress={item.status === "locked" ? item.progressPercent ?? 0 : null}
        />
        <CardBadgeRow>
          <StatusBadge variant={statusToBadgeVariant(item.status)}>
            <BadgeIcon status={item.status} />
            <span>{getBadgeLabel(item.status, t)}</span>
          </StatusBadge>
        </CardBadgeRow>
      </CardImageArea>

      <CardInfo>
        <CardMeta>
          <div className="text-group">
            <span className="name">{item.name}</span>
            <span className="requirement">{item.requirement}</span>
          </div>
          <span
            className={`progress ${item.progressComplete ? "progress-complete" : "progress-incomplete"
              }`}
          >
            {item.progress}
          </span>
        </CardMeta>

        <ActionButton
          variant={statusToActionVariant(item.status)}
          disabled={item.status !== "ready" || isClaiming}
          onClick={() => item.badgeKey && onClaim(item.badgeKey)}
        >
          <ActionIcon status={item.status} />
          <span>{getActionLabel(item, isClaiming, t)}</span>
        </ActionButton>
      </CardInfo>
    </RewardCard>
  );
};

export const Rewards: React.FC = () => {
  const { t } = useTranslation();
  const { userData, refetchAuthData } = useContext(AuthContext);
  const [claimingKey, setClaimingKey] = useState<string>("");
  const [showAllRewards, setShowAllRewards] = useState(false);
  const REWARDS_PREVIEW = 9;

  const rewardItems = useMemo<RewardItem[]>(() => {
    const stakingRewards = Array.isArray(userData?.spaceportProgression?.stakingRewards)
      ? userData.spaceportProgression.stakingRewards
      : [];

    return stakingRewards.map((reward: any) => {
      const rewardKey = String(reward?.key || "");
      const status: RewardStatus = reward?.claimed
        ? "claimed"
        : reward?.claimable
          ? "ready"
          : "locked";

      return {
        id: rewardKey,
        badgeKey: rewardKey,
        name: reward?.name || t("spaceport.rewards.stakingReward"),
        requirement: reward?.requirementText || t("spaceport.rewards.noRequirements"),
        progress: reward?.progressLabel || "",
        progressComplete: reward?.claimable || reward?.claimed || false,
        status,
        progressPercent: Number(reward?.progressPercent || 0),
        claimXp: Number(reward?.rewardXp || 0),
      };
    });
  }, [t, userData?.spaceportProgression?.stakingRewards]);

  const total = rewardItems.length;
  const claimed = rewardItems.filter((item) => item.status === "claimed").length;
  const locked = rewardItems.filter((item) => item.status === "locked").length;

  const handleClaim = async (badgeKey: string) => {
    if (!badgeKey || claimingKey) {
      return;
    }

    if (!userData?.isFullAuth) {
      toast.error(t("spaceport.rewards.loginRequired"));
      return;
    }

    try {
      setClaimingKey(badgeKey);

      const response = await claimSpaceportReward(badgeKey);

      if (!response?.success) {
        toast.error(response?.message || t("spaceport.rewards.claimFailed"));
        return;
      }

      const xpAwarded = Number(response?.xpAwarded || 0);
      toast.success(
        xpAwarded > 0
          ? t("spaceport.rewards.rewardClaimedXp", { values: { xp: xpAwarded } })
          : t("spaceport.rewards.rewardClaimed")
      );

      if (typeof refetchAuthData === "function") {
        await refetchAuthData();
      }
    } catch (error) {
      toast.error(t("spaceport.rewards.claimFailed"));
    } finally {
      setClaimingKey("");
    }
  };

  return (
    <RewardsWrapper>
      <StatsRow>
        <StatCard>
          <div className="text">
            <span className="label">{t("spaceport.rewards.totalRewards")}</span>
            <span className="value">{total}</span>
          </div>
          <Gift size={56} className="icon" strokeWidth={0.9} color="#2082EA" />
        </StatCard>
        <StatCard>
          <div className="text">
            <span className="label">{t("spaceport.rewards.claimed")}</span>
            <span className="value">{claimed}</span>
          </div>
          <CheckCircle2 size={56} className="icon" strokeWidth={0.9} color="#05a584" />
        </StatCard>
        <StatCard>
          <div className="text">
            <span className="label">{t("spaceport.rewards.locked")}</span>
            <span className="value">{locked}</span>
          </div>
          <Lock size={56} className="icon" strokeWidth={0.9} color="#728094" />
        </StatCard>
      </StatsRow>

      <RewardsGrid>
        {(showAllRewards ? rewardItems : rewardItems.slice(0, REWARDS_PREVIEW)).map((item) => (
          <RewardCardItem
            key={item.id}
            item={item}
            isClaiming={claimingKey === item.badgeKey}
            onClaim={handleClaim}
          />
        ))}
      </RewardsGrid>
      {rewardItems.length > REWARDS_PREVIEW ? (
        <button
          type="button"
          data-testid="rewards-show-more"
          onClick={() => setShowAllRewards((v) => !v)}
          style={{
            display: "block",
            margin: "16px auto 0",
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
          {showAllRewards ? "Show less" : `Show more (${rewardItems.length - REWARDS_PREVIEW})`}
        </button>
      ) : null}

      {rewardItems.length === 0 && (
        <EmptyRewards data-testid="spaceport-rewards-empty">
          <span className="empty-icon" aria-hidden="true">
            <Gift size={28} />
          </span>
          <span className="empty-title">No rewards unlocked yet</span>
          <span className="empty-text">
            Stake your Spaceport NFTs and keep them staked to reach milestone rewards. Every staking milestone you reach will show up here, ready to claim for XP.
          </span>
          <div className="empty-steps">
            <span className="empty-chip">
              <Sparkles size={14} />
              Stake your NFTs
            </span>
            <span className="empty-chip">
              <Clock size={14} />
              Keep staking to reach milestones
            </span>
            <span className="empty-chip">
              <Gift size={14} />
              Claim rewards for XP
            </span>
          </div>
        </EmptyRewards>
      )}

      <HowToSection>
        <SectionTitle>{t("spaceport.rewards.howToUnlock")}</SectionTitle>
        {HOW_TO_STEPS.map((step, index) => {
          const stepKeys = [
            ["spaceport.rewards.howTo.stakeTitle", "spaceport.rewards.howTo.stakeDescription"],
            ["spaceport.rewards.howTo.timerTitle", "spaceport.rewards.howTo.timerDescription"],
            ["spaceport.rewards.howTo.claimTitle", "spaceport.rewards.howTo.claimDescription"],
          ][index] || [];

          return (
          <HowToCard key={step.number}>
            <StepNumber>
              <span>{step.number}</span>
            </StepNumber>
            <StepText>
              <span className="title">{stepKeys[0] ? t(stepKeys[0]) : step.title}</span>
              <span className="description">{stepKeys[1] ? t(stepKeys[1]) : step.description}</span>
            </StepText>
          </HowToCard>
          );
        })}
      </HowToSection>
    </RewardsWrapper>
  );
};
