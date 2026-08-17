import React, { useState, useEffect } from "react";
import { Eye, Lock, Sparkles, Star, X } from "lucide-react";
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
  RequirementsBlock,
  RequirementRow,
  BenefitsBlock,
  TradingRestrictionBlock,
  HiddenBadge,
} from "./styles";
import { NFTProperty, StakingEvent, RewardEvent } from "./NFTDetailsModal";
import SparklesIcon from "../../../global/Icons/SparklesIcon";

export interface NFTRequirement {
  title: string;
  description?: string;
  progress?: string;
}

export interface NFTHiddenDetailsData {
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
  singularityNotice?: string;
  requirements?: NFTRequirement[];
  benefits?: string[];
  tradingRestriction?: string;
}

interface NFTHiddenDetailsModalProps {
  nft: NFTHiddenDetailsData | null;
  onClose: () => void;
}

const NFTHiddenDetailsModal: React.FC<NFTHiddenDetailsModalProps> = ({
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
            {/* Image with Hidden badge */}
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
              <HiddenBadge style={{
                position: "absolute",
                left: 20,
                top: 20
              }}>
                <Eye size={16} />
                Hidden
              </HiddenBadge>
            </div>

            {/* Singularity notice */}
            {nft.singularityNotice && (
              <SingularityNotice>
                <SparklesIcon size={20} stroke="#ffc704" />
                <span>{nft.singularityNotice}</span>
              </SingularityNotice>
            )}

            {/* Requirements */}
            {nft.requirements && nft.requirements.length > 0 && (
              <RequirementsBlock>
                <DetailCardTitle>Requirements</DetailCardTitle>
                {nft.requirements.map((req) => (
                  <RequirementRow key={req.title}>
                    <Lock size={20} color="#728094" style={{ flexShrink: 0 }} />
                    <div className="req-content">
                      <span className="req-title">{req.title}</span>
                      {req.description && (
                        <span className="req-desc">{req.description}</span>
                      )}
                    </div>
                    {req.progress && (
                      <span className="req-progress">{req.progress}</span>
                    )}
                  </RequirementRow>
                ))}
              </RequirementsBlock>
            )}

            {/* Benefits */}
            {nft.benefits && nft.benefits.length > 0 && (
              <BenefitsBlock>
                <div className="benefits-inner">
                  <div className="icon"><SparklesIcon size={24} /></div>
                  <div className="benefits-content">
                    <span className="benefits-title">Benefits</span>
                    <ul className="benefits-list">
                      {nft.benefits.map((benefit) => (
                        <li key={benefit}>{benefit}</li>
                      ))}
                    </ul>
                  </div>
                </div>
              </BenefitsBlock>
            )}

            {/* Trading restriction */}
            {nft.tradingRestriction && (
              <TradingRestrictionBlock>
                {nft.tradingRestriction}
              </TradingRestrictionBlock>
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

export default NFTHiddenDetailsModal;
