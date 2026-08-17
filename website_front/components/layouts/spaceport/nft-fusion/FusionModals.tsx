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
} from "../my-nft/styles";
import { FuseAgainButton } from "./styles";
import { useTranslation } from "i18n";

export type Rarity = "Common" | "Rare" | "Epic" | "Legendary" | "FOMO Gold";

export interface FusionResultData {
  name: string;
  rarity: Rarity;
  image: string;
}

interface FusionProgressModalProps {
  progress: number;
}

export const FusionProgressModal: React.FC<FusionProgressModalProps> = ({
  progress,
}) => {
  const { t } = useTranslation();

  return (
    <ModalOverlay>
      <CrossingModalContainer>
        <Zap size={40} color="#05a584" />
        <CrossingProgressSection>
          <p className="title">{t("spaceport.nftFusion.progressTitle")}</p>
          <div className="progress-track">
            <div className="progress-fill" style={{ width: `${progress}%` }} />
          </div>
          <p className="subtitle">{t("spaceport.nftFusion.progressSubtitle")}</p>
        </CrossingProgressSection>
      </CrossingModalContainer>
    </ModalOverlay>
  );
};

interface FusionResultModalProps {
  result: FusionResultData;
  onClose: () => void;
  onFuseAgain: () => void;
}

export const FusionResultModal: React.FC<FusionResultModalProps> = ({
  result,
  onClose,
  onFuseAgain,
}) => {
  const { t } = useTranslation();
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
            style={{ color: badgeColor, background: "#fff" }}
          >
            {result.rarity}
          </span>
        </CrossedImageWrapper>

        <CrossedInfoSection>
          <p className="name">{result.name}</p>
          <p className="meta">{t("spaceport.nftFusion.resultMeta")}</p>
        </CrossedInfoSection>

        <div style={{ display: "flex", gap: 12 }}>
          <FuseAgainButton onClick={onFuseAgain}>{t("spaceport.nftFusion.fuseAgain")}</FuseAgainButton>
          <ViewCollectionButton>
            <SparklesIcon stroke="#fff" size="small" />
            {t("spaceport.boxShop.viewInCollection")}
          </ViewCollectionButton>
        </div>
      </CrossedResultContainer>
    </ModalOverlay>
  );
};
