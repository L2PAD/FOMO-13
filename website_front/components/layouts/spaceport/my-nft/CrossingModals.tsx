import React from "react";
import { X, Zap } from "lucide-react";
import SparklesIcon from "../../../global/Icons/SparklesIcon";
import {
  ModalOverlay,
  ModalCloseButton,
  CrossingModalContainer,
  CrossingProgressSection,
  CrossedResultContainer,
  CrossedImageWrapper,
  CrossedInfoSection,
  ViewCollectionButton,
  rarityColor,
} from "./styles";

type Rarity = "Common" | "Rare" | "Epic" | "Legendary" | "FOMO Gold";

export interface CrossingResultData {
  name: string;
  rarity: Rarity;
  image: string;
  level: number;
}

interface CrossingProgressModalProps {
  count: number;
  progress: number;
}

export const CrossingProgressModal: React.FC<CrossingProgressModalProps> = ({
  count,
  progress,
}) => {
  return (
    <ModalOverlay>
      <CrossingModalContainer>
        <Zap size={40} color="#05a584" />
        <CrossingProgressSection>
          <p className="title">Crossing Shards...</p>
          <div className="progress-track">
            <div className="progress-fill" style={{ width: `${progress}%` }} />
          </div>
          <p className="subtitle">
            Combining {count} shard{count === 1 ? "" : "s"} into elite fragment
          </p>
        </CrossingProgressSection>
      </CrossingModalContainer>
    </ModalOverlay>
  );
};

interface CrossedResultModalProps {
  result: CrossingResultData;
  onClose: () => void;
}

export const CrossedResultModal: React.FC<CrossedResultModalProps> = ({
  result,
  onClose,
}) => {
  const badgeColor = rarityColor[result.rarity] ?? "#738094";

  return (
    <ModalOverlay onClick={onClose}>
      <CrossedResultContainer onClick={(e) => e.stopPropagation()}>
        <div className="close-row">
          <ModalCloseButton onClick={onClose}>
            <X size={24} />
          </ModalCloseButton>
        </div>

        <CrossedImageWrapper>
          <img src={result.image} alt={result.name} />
          <span
            className="rarity-badge"
            style={{
              color: badgeColor,
              background: `#fff`,
            }}
          >
            {result.rarity}
          </span>
        </CrossedImageWrapper>

        <CrossedInfoSection>
          <p className="name">{result.name}</p>
          <p className="meta">
            Level {result.level} • {result.rarity} Rarity
          </p>
        </CrossedInfoSection>

        <ViewCollectionButton>
          <SparklesIcon stroke="#fff" size={"small"} />
          View in Collection
        </ViewCollectionButton>
      </CrossedResultContainer>
    </ModalOverlay>
  );
};
