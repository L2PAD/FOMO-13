import React, { useState, useEffect } from "react";
import { Flame, Sparkles, Star, X } from "lucide-react";
import {
  ModalOverlay,
  ModalContainer,
  ModalHeader,
  ModalCloseButton,
  ModalBody,
  ModalInfoCol,
  DetailCard,
  DetailCardTitle,
  DetailGrid,
  DetailField,
  StatusBadge,
  PropertyBox,
  TabBar,
  HistoryTab,
  HistoryEventList,
  HistoryEventRow,
  XPBadge,
  SmallBadge,
  RewardStatusBadge,
  rarityColor,
  HiddenModalImageCol,
  SingularityNotice,
  SingularityBadge,
  AchievementsBlock,
  AchievementRow,
  TradingRestrictionsBlock,
} from "./styles";
import { NFTProperty, StakingEvent, RewardEvent } from "./NFTDetailsModal";
import SparklesIcon from "../../../global/Icons/SparklesIcon";
import SingularityIcon from "../../../global/Icons/Singularity";

export interface NFTAchievement {
  emoji: string;
  label: string;
}

export interface NFTSingularityDetailsData {
  id: string;
  name: string;
  number: string;
  rarity: string;
  image: string;
  tokenId: string;
  floorPrice: string;
  status: "Staked" | "Unstaked";
  properties: NFTProperty[];
  stakingHistory: StakingEvent[];
  rewards?: RewardEvent[];
  congratsNotice?: string;
  achievements?: NFTAchievement[];
  tradingRestrictions?: string[];
}

interface NFTSingularityDetailsModalProps {
  nft: NFTSingularityDetailsData | null;
  onClose: () => void;
}

const NFTSingularityDetailsModal: React.FC<NFTSingularityDetailsModalProps> = ({
  nft,
  onClose,
}) => {
  const [activeTab, setActiveTab] = useState<"history" | "rewards">("history");

  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", handleKey);
    return () => document.removeEventListener("keydown", handleKey);
  }, [onClose]);

  if (!nft) return null;

  const historyEvents = nft.stakingHistory;
  const rewardEvents = nft.rewards ?? [];

  const renderHistoryValue = (event: StakingEvent) => {
    const explicitValue = String(event.value || "").trim();
    const fallbackXp = String(event.xp || "").trim();
    const badgeValue = explicitValue || (fallbackXp ? `+${fallbackXp} XP` : "");

    if (!badgeValue) {
      return null;
    }

    const isNeutral =
      event.valueTone === "neutral" || (!explicitValue && Number(fallbackXp) === 0);

    return (
      <XPBadge className={isNeutral ? "xp-loss" : ""}>
        {badgeValue}
      </XPBadge>
    );
  };

  return (
    <ModalOverlay onClick={onClose}>
      <ModalContainer onClick={(e) => e.stopPropagation()} style={{ maxWidth: 980 }}>
        <ModalHeader>
          <span className="title">
            {nft.name} {nft.number} – Details
          </span>
          <ModalCloseButton onClick={onClose} aria-label="Close">
            <X size={24} />
          </ModalCloseButton>
        </ModalHeader>

        <ModalBody>
          <HiddenModalImageCol>
            {/* Image with Singularity badge overlay */}
            <div style={{ position: "relative", width: "100%" }}>
              <img
                src={nft.image}
                alt={nft.name}
                style={{
                  width: "100%",
                  borderRadius: 12,
                  objectFit: "cover",
                  aspectRatio: "1",
                  display: "block",
                  boxShadow: "2px 2px 8px 0 rgba(0,5,48,0.08)",
                }}
              />
              <SingularityBadge style={{ position: "absolute", left: 20, top: 20 }}>
                <SingularityIcon size={16} />
                Singularity
              </SingularityBadge>
            </div>

            {/* Congratulations notice */}
            {nft.congratsNotice && (
              <SingularityNotice>
                <SparklesIcon size={20} stroke="#FFC704" />
                <span>{nft.congratsNotice}</span>
              </SingularityNotice>
            )}

            {/* Achievements */}
            {nft.achievements && nft.achievements.length > 0 && (
              <AchievementsBlock>
                <DetailCardTitle>Your Achievements</DetailCardTitle>
                {nft.achievements.map((item) => (
                  <AchievementRow key={item.label}>
                    <span className="achievement-emoji">{item.emoji}</span>
                    <span className="achievement-label">{item.label}</span>
                  </AchievementRow>
                ))}
              </AchievementsBlock>
            )}

            {/* Trading Restrictions */}
            {nft.tradingRestrictions && nft.tradingRestrictions.length > 0 && (
              <TradingRestrictionsBlock>
                <span className="restrictions-title">Trading Restrictions</span>
                <ul className="restrictions-list">
                  {nft.tradingRestrictions.map((r) => (
                    <li key={r}>{r}</li>
                  ))}
                </ul>
              </TradingRestrictionsBlock>
            )}
          </HiddenModalImageCol>

          <ModalInfoCol>
            {/* Metadata */}
            <DetailCard>
              <DetailCardTitle>Metadata</DetailCardTitle>
              <DetailGrid>
                <DetailField>
                  <span className="label">Token ID</span>
                  <span className="value">{nft.tokenId}</span>
                </DetailField>
                <DetailField>
                  <span className="label">Rarity</span>
                  <SmallBadge color={rarityColor[nft.rarity]}>
                    {nft.rarity}
                  </SmallBadge>
                </DetailField>
              </DetailGrid>
              <DetailGrid>
                <DetailField>
                  <span className="label">Floor Price</span>
                  <div className="floor-value">
                    <Star size={16} fill="#ffc702" stroke="#ffc702" />
                    {nft.floorPrice}
                  </div>
                </DetailField>
                <DetailField>
                  <span className="label">Status</span>
                  <StatusBadge>{nft.status}</StatusBadge>
                </DetailField>
              </DetailGrid>
            </DetailCard>

            {/* Properties */}
            {nft.properties.length > 0 && (
              <DetailCard>
                <DetailCardTitle>Properties</DetailCardTitle>
                <DetailGrid>
                  {nft.properties.map((prop) => (
                    <PropertyBox key={prop.label}>
                      <span className="prop-label">{prop.label}</span>
                      <span className="prop-value">{prop.value}</span>
                    </PropertyBox>
                  ))}
                </DetailGrid>
              </DetailCard>
            )}

            {/* Staking History / Rewards */}
            <DetailCard style={{ gap: 20 }}>
              <TabBar>
                <HistoryTab
                  active={activeTab === "history"}
                  onClick={() => setActiveTab("history")}
                >
                  Staking History
                </HistoryTab>
                <HistoryTab
                  active={activeTab === "rewards"}
                  onClick={() => setActiveTab("rewards")}
                >
                  Rewards
                </HistoryTab>
              </TabBar>

              <HistoryEventList>
                {activeTab === "history" && (
                  historyEvents.length === 0
                    ? <p style={{ color: "#738094", fontSize: 14 }}>No staking history yet.</p>
                    : historyEvents.map((event) => (
                      <HistoryEventRow key={event.id}>
                        <div className="event-info">
                          <span className="event-name">{event.name}</span>
                          <span className="event-date">{event.date}</span>
                        </div>
                        {renderHistoryValue(event)}
                      </HistoryEventRow>
                    ))
                )}
                {activeTab === "rewards" && (
                  rewardEvents.length === 0
                    ? <p style={{ color: "#738094", fontSize: 14 }}>No rewards yet.</p>
                    : rewardEvents.map((event) => (
                      <HistoryEventRow key={event.id}>
                        <div className="event-info">
                          <span className="event-name">{event.name}</span>
                          <span className="event-date">{event.date}</span>
                        </div>
                        <RewardStatusBadge status={event.status}>
                          {event.status}
                        </RewardStatusBadge>
                      </HistoryEventRow>
                    ))
                )}
              </HistoryEventList>
            </DetailCard>
          </ModalInfoCol>
        </ModalBody>
      </ModalContainer>
    </ModalOverlay>
  );
};

export default NFTSingularityDetailsModal;
