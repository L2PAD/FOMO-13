import React from "react";
import Image from "next/image";
import { X, Sparkles } from "lucide-react";
import {
  ModalOverlay,
  ModalContent,
  ModalCloseButton,
  ModalTitle,
  NFTImageWrapper,
  NFTImage,
  NFTRarityBadge,
  NFTName,
  NFTDescription,
  ModalButtons,
  ModalButton,
} from "./styles";
import SparklesIcon from "../../../global/Icons/SparklesIcon";
import { useTranslation } from "i18n";

export type RewardType = "nft" | "shard";

export interface NFTReward {
  type: "nft";
  rarity: "uncommon" | "rare" | "epic" | "legendary";
  name: string;
  image: string;
  number: string;
}

export interface ShardReward {
  type: "shard";
  rarity: "uncommon" | "rare" | "epic" | "legendary";
  name: string;
  image: string;
  level: number;
  description?: string;
}

export type BoxReward = NFTReward | ShardReward;

interface OpenBoxModalProps {
  isOpen: boolean;
  onClose: () => void;
  reward: BoxReward | null;
  onOpenAnother: () => void;
  onViewCollection: () => void;
}

const OpenBoxModal: React.FC<OpenBoxModalProps> = ({
  isOpen,
  onClose,
  reward,
  onOpenAnother,
  onViewCollection,
}) => {
  const { t } = useTranslation();

  if (!isOpen || !reward) return null;

  const rarityColors = {
    uncommon: "#728094",
    rare: "#3B82F6",
    epic: "#9333EA",
    legendary: "#FF5858",
  };

  const getTitle = () => {
    if (reward.type === "nft") {
      return t("spaceport.boxShop.nftReceived", {
        values: { rarity: t(`spaceport.rarity.${reward.rarity}`) },
      });
    }
    return t("spaceport.boxShop.nftShardReceived");
  };

  const getSubtext = () => {
    if (reward.type === "shard") {
      return t("spaceport.boxShop.shardDescription");
    }
    return "";
  };

  const rarityLabel = t(`spaceport.rarity.${reward.rarity}`);

  return (
    <ModalOverlay onClick={onClose}>
      <ModalContent onClick={(e) => e.stopPropagation()}>
        <ModalCloseButton onClick={onClose}>
          <X size={20} />
        </ModalCloseButton>

        <ModalTitle>{getTitle()}</ModalTitle>
        {getSubtext() && <NFTDescription>{getSubtext()}</NFTDescription>}

        <NFTImageWrapper glowColor={rarityColors[reward.rarity]}>
          <NFTImage>
            <Image
              src={reward.image}
              alt={reward.name}
              fill
              style={{ objectFit: "cover" }}
            />
          </NFTImage>
          <NFTRarityBadge rarity={reward.rarity}>
            {rarityLabel}
          </NFTRarityBadge>
        </NFTImageWrapper>

        <NFTName>
          <span>{reward.name}</span>
          <span className="rarity">
            {reward.type === "shard" &&
              t("spaceport.boxShop.levelRarity", {
                values: { level: reward.level, rarity: rarityLabel },
              })}
          </span>
        </NFTName>

        <ModalButtons>
          <ModalButton variant="secondary" onClick={onOpenAnother}>
            {t("spaceport.boxShop.openAnotherBox")}
          </ModalButton>
          <ModalButton variant="primary" onClick={onViewCollection}>
            <SparklesIcon size={"small"} stroke="#fff" />
            {t("spaceport.boxShop.viewInCollection")}
          </ModalButton>
        </ModalButtons>
      </ModalContent>
    </ModalOverlay>
  );
};

export default OpenBoxModal;
