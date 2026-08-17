import React, { useState, useEffect } from "react";
import { X, Star, Sparkles } from "lucide-react";
import {
  ModalOverlay,
  ModalContainer,
  ModalHeader,
  ModalCloseButton,
  ModalBody,
  ModalImageCol,
  ModalInfoCol,
  RewardStatusBadge,
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
  rarityColor,
} from "./styles";

export interface NFTProperty {
  label: string;
  value: string;
}

export interface StakingEvent {
  id: string;
  name: string;
  date: string;
  xp: string;
  value?: string;
  valueTone?: "positive" | "neutral";
}

export interface RewardEvent {
  id: string;
  name: string;
  date: string;
  status: "Claimed" | "Pending";
}

export interface NFTDetailsData {
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
}

interface NFTDetailsModalProps {
  nft: NFTDetailsData | null;
  onClose: () => void;
}

const NFTDetailsModal: React.FC<NFTDetailsModalProps> = ({ nft, onClose }) => {
  const [activeTab, setActiveTab] = useState<"history" | "rewards">("history");

  // Close on Escape key
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
      <ModalContainer onClick={(e) => e.stopPropagation()}>
        <ModalHeader>
          <span className="title">{nft.name} - Details</span>
          <ModalCloseButton onClick={onClose} aria-label="Close">
            <X size={24} />
          </ModalCloseButton>
        </ModalHeader>

        <ModalBody>
          <ModalImageCol>
            <img src={nft.image} alt={nft.name} />
          </ModalImageCol>

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
                {activeTab === "history" ? (
                  historyEvents.length === 0 ? (
                    <p style={{ color: "#738094", fontSize: 14 }}>No staking history yet.</p>
                  ) : (
                    historyEvents.map((event) => (
                      <HistoryEventRow key={event.id}>
                        <div className="event-info">
                          <span className="event-name">{event.name}</span>
                          <span className="event-date">{event.date}</span>
                        </div>
                        {renderHistoryValue(event)}
                      </HistoryEventRow>
                    ))
                  )
                ) : (
                  rewardEvents.length === 0 ? (
                    <p style={{ color: "#738094", fontSize: 14 }}>No rewards yet.</p>
                  ) : (
                    rewardEvents.map((event) => (
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
                  )
                )}
              </HistoryEventList>
            </DetailCard>
          </ModalInfoCol>
        </ModalBody>
      </ModalContainer>
    </ModalOverlay>
  );
};

export default NFTDetailsModal;
