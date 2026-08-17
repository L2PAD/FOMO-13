import React, { useMemo, useState } from "react";
import {
  Clock,
  Copy,
  ExpandIcon,
  ExternalLink,
  Gift,
  Shield,
  Sparkles,
  Star,
  Zap,
} from "lucide-react";
import SparklesIcon from "../../../global/Icons/SparklesIcon";
import { NFTItem } from "./types";
import {
  FeaturedBenefitsCard,
  FeaturedCard,
  FeaturedImageSide,
  FeaturedInfoSide,
  FeaturedMetaCard,
  FeaturedMetaGrid,
  FeaturedWalletCard,
  NFTTitle,
  NextRewardRow,
  ProgressBarFill,
  ProgressBarTrack,
  SmallBadge,
  StakeButton,
  StakeSubtext,
  StakingMetaText,
  StakingProgressBlock,
  StakingProgressHeader,
  ViewDetailsLink,
  rarityColor,
} from "./styles";

type Props = {
  nft: NFTItem;
  ownerName: string;
  floorPrice: string;
  isStakePending: boolean;
  onOpenDetails: () => void;
  onExpandImage: () => void;
  onStakeToggle: (nft: NFTItem) => void | Promise<void>;
};

export const FeaturedNFTCard: React.FC<Props> = ({
  nft,
  ownerName,
  floorPrice,
  isStakePending,
  onOpenDetails,
  onExpandImage,
  onStakeToggle,
}) => {
  const [isCopied, setIsCopied] = useState(false);

  const statusLabel = nft.staked ? "Staked" : "Unstaked";
  const statusMeta = nft.staked ? "Active" : "Inactive";
  const rarityRank = useMemo(() => {
    const rarityRanks: Record<string, string> = {
      Common: "Top 45%",
      Rare: "Top 20%",
      Epic: "Top 8%",
      Legendary: "Top 1%",
      "FOMO Gold": "Top 0.1%",
    };

    return rarityRanks[nft.rarity] || "Top tier";
  }, [nft.rarity]);

  const benefitIcons = [Zap, Sparkles, Gift, Shield];
  const visibleBenefits =
    nft.benefits && nft.benefits.length > 0
      ? nft.benefits.slice(0, 4)
      : [
        "Boost: Earn extra XP while staking",
        "Access: Unlock premium Spaceport rewards",
        "Reward: Get priority collection drops",
        "Shield: Reduced unstaking cooldown",
      ];

  const formatTotalStaked = () => {
    const totalSeconds = Math.max(0, Math.trunc(Number(nft.stakingSeconds) || 0));

    if (totalSeconds > 0) {
      const days = Math.floor(totalSeconds / 86400);
      const hours = Math.floor((totalSeconds % 86400) / 3600);
      const minutes = Math.floor((totalSeconds % 3600) / 60);

      if (days > 0) {
        return `${days} ${days === 1 ? "day" : "days"}`;
      }

      if (hours > 0) {
        return `${hours} ${hours === 1 ? "hour" : "hours"}`;
      }

      if (minutes > 0) {
        return `${minutes} ${minutes === 1 ? "min" : "mins"}`;
      }

      return `${totalSeconds} ${totalSeconds === 1 ? "sec" : "secs"}`;
    }

    if ((nft.totalStakedDays ?? 0) > 0) {
      return `${nft.totalStakedDays} ${nft.totalStakedDays === 1 ? "day" : "days"}`;
    }

    if ((nft.totalStakedUnits ?? 0) > 0) {
      const unitLabel = String(nft.stakingRewardUnitLabel || "MIN").toLowerCase();
      return `${nft.totalStakedUnits} ${unitLabel}`;
    }

    return "Just started";
  };

  const nextRewardText =
    nft.nextRewardUnlock && !nft.nextRewardUnlock.startsWith("Next reward at")
      ? nft.nextRewardUnlock
      : nft.nextRewardTarget
        ? `Next reward unlock at ${nft.nextRewardTarget}`
        : "Next reward unlock pending";

  const handleCopyWallet = async () => {
    try {
      if (!ownerName || ownerName === "--") {
        return;
      }

      await navigator.clipboard.writeText(ownerName);
      setIsCopied(true);
      window.setTimeout(() => setIsCopied(false), 1800);
    } catch {
      setIsCopied(false);
    }
  };

  return (
    <FeaturedCard>
      <FeaturedImageSide>
        <div className="nft-image">
          <img src={nft.image} alt={nft.name} />
          <button className="expand-icon" onClick={onExpandImage} aria-label="Expand image">
            <ExpandIcon size={24} color="#fff" />
          </button>
        </div>

        <ViewDetailsLink
          href="#"
          onClick={(event) => {
            event.preventDefault();
            onOpenDetails();
          }}
        >
          <ExternalLink size={16} />
          View Full Details
        </ViewDetailsLink>
      </FeaturedImageSide>

      <FeaturedInfoSide>
        <div className="info-content">
          <NFTTitle>
            <div className="title-row">
              <h2>{nft.name}</h2>
              <SmallBadge>{nft.number}</SmallBadge>
            </div>
            <div className="floor-row">
              <Star size={16} fill="#ffc702" stroke="#ffc702" />
              Floor: {floorPrice}
            </div>
          </NFTTitle>

          <FeaturedMetaGrid>
            <FeaturedMetaCard>
              <span className="card-label">RARITY</span>
              <div className="meta-row">
                <SmallBadge color={rarityColor[nft.rarity]}>{nft.rarity}</SmallBadge>
                <span className="meta-caption">{rarityRank}</span>
              </div>
            </FeaturedMetaCard>

            <FeaturedMetaCard>
              <span className="card-label">STATUS</span>
              <div className="meta-row">
                <span className={`status-pill ${nft.staked ? "active" : "inactive"}`}>
                  <span className="dot" />
                  {statusLabel}
                </span>
                <span className="meta-caption">{statusMeta}</span>
              </div>
            </FeaturedMetaCard>
          </FeaturedMetaGrid>

          <FeaturedWalletCard>
            <div className="wallet-copy-row">
              <div className="wallet-info">
                <span className="card-label">WALLET</span>
                <span className="wallet-value">{ownerName}</span>
              </div>
              <button type="button" onClick={() => void handleCopyWallet()}>
                <Copy size={16} />
                {isCopied ? "Copied" : "Copy"}
              </button>
            </div>
          </FeaturedWalletCard>

          <FeaturedBenefitsCard>
            <span className="card-label">UTILITY & BENEFITS</span>
            <div className="benefits-list">
              {visibleBenefits.map((benefit, index) => {
                const [title, ...rest] = benefit.split(":");
                const description = rest.join(":").trim();
                const Icon = benefitIcons[index % benefitIcons.length];

                return (
                  <div className="benefit-row" key={`${benefit}-${index}`}>
                    <Icon size={16} />
                    <div className="benefit-text">
                      {description ? (
                        <>
                          <strong>{title}:</strong> {description}
                        </>
                      ) : (
                        benefit
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </FeaturedBenefitsCard>

          {nft.staked && (
            <StakingProgressBlock>
              <StakingProgressHeader>
                <span className="label">Time to Next Level</span>
                <span className="value">{nft.timeToNextLevel ?? "--"}</span>
              </StakingProgressHeader>
              <ProgressBarTrack>
                <ProgressBarFill percent={nft.progressPercent ?? 0} />
              </ProgressBarTrack>
              <StakingMetaText>Total staked: {formatTotalStaked()}</StakingMetaText>
              <NextRewardRow>
                <Clock size={16} />
                {nextRewardText}
              </NextRewardRow>
            </StakingProgressBlock>
          )}
        </div>

        <div className="action-block">
          {nft.staked ? (
            <>
              <StakeButton disabled={isStakePending} onClick={() => void onStakeToggle(nft)}>
                {isStakePending ? "Unstaking..." : "Unstake NFT"}
              </StakeButton>
              <StakeSubtext>
                Unstaking finishes the current staking cycle on-chain.
              </StakeSubtext>
            </>
          ) : (
            <>
              <StakeButton disabled={isStakePending} onClick={() => void onStakeToggle(nft)}>
                <SparklesIcon stroke="white" size="small" />
                {isStakePending ? "Staking..." : "Stake NFT"}
              </StakeButton>
              <StakeSubtext>
                Start earning XP and unlock exclusive rewards
              </StakeSubtext>
            </>
          )}
        </div>
      </FeaturedInfoSide>
    </FeaturedCard>
  );
};
