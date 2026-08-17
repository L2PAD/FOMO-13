import React from "react";
import { ArrowRight, Eye, Info } from "lucide-react";
import EmptyList from "../../../global/EmptyList";
import SparklesIcon from "../../../global/Icons/SparklesIcon";
import SingularityIcon from "../../../global/Icons/Singularity";
import { WalletNftGridPlaceholder } from "./LoadingPlaceholders";
import { CollectionFilter, NFTItem } from "./types";
import {
  CardBottomBadges,
  CardImage,
  CardInfo,
  CardNameRow,
  CardPriceRow,
  CardStats,
  CardTopBadges,
  FilterTab,
  FilterTabs,
  HiddenBadge,
  NFTCard,
  NFTGrid,
  SectionHeader,
  SectionTitle,
  SingularityBadge,
  SmallBadge,
  StakedBadge,
  rarityColor,
} from "./styles";
import { useTranslation } from "i18n";

const getRarityTranslationKey = (value: string): string => {
  const normalized = value.toLowerCase();

  if (normalized.includes("fomo")) return "spaceport.rarity.fomoGold";
  if (normalized.includes("legendary")) return "spaceport.rarity.legendary";
  if (normalized.includes("epic")) return "spaceport.rarity.epic";
  if (normalized.includes("rare")) return "spaceport.rarity.rare";
  if (normalized.includes("uncommon")) return "spaceport.rarity.uncommon";
  return "spaceport.rarity.common";
};

type NFTCollectionCardProps = {
  nft: NFTItem;
  floorPrice: string;
  onSelect: (nft: NFTItem) => void;
};

const NFTCollectionCard: React.FC<NFTCollectionCardProps> = ({
  nft,
  floorPrice,
  onSelect,
}) => {
  const { t } = useTranslation();

  return (
    <NFTCard onClick={() => onSelect(nft)} style={{ cursor: "pointer" }}>
      <CardImage>
        <img src={nft.image} alt={nft.name} />
      </CardImage>

      <CardTopBadges>
        <div>
          {nft.staked && (
            <StakedBadge>
              <SparklesIcon size="small" stroke="#fff" />
              {t("spaceport.myNft.staked")}
            </StakedBadge>
          )}
        </div>
        <SmallBadge color={rarityColor[nft.rarity]}>
          {t(getRarityTranslationKey(nft.rarity))}
        </SmallBadge>
      </CardTopBadges>

      <CardBottomBadges>
        <SmallBadge>{nft.number}</SmallBadge>
        {nft.singularityRarity && (
          <SingularityBadge>
            <SingularityIcon size={14} />
            {t("spaceport.myNft.singularity")}
          </SingularityBadge>
        )}
        {!nft.singularityRarity && nft.hiddenRarity && (
          <button className="tooltip-button">
            <HiddenBadge>
              <Eye size={14} />
              {t("spaceport.myNft.hidden")}
            </HiddenBadge>
            <span
              className="tooltip-text"
              style={{
                width: 300,
                whiteSpace: "wrap",
                textAlign: "left",
                fontSize: 14,
                color: "#000",
              }}
            >
              <p style={{ fontWeight: "var(--font-weight-semibold)" }}>{t("spaceport.myNft.hiddenBenefits")}</p>
              <ul>
                <li>{t("spaceport.myNft.hiddenXpBoost")}</li>
                <li>{t("spaceport.myNft.hiddenPriority")}</li>
                <li>{t("spaceport.myNft.hiddenMissions")}</li>
                <li>{t("spaceport.myNft.hiddenVisual")}</li>
              </ul>
            </span>
          </button>
        )}
      </CardBottomBadges>

      <CardInfo>
        <CardNameRow>
          <span className="name">{nft.name}</span>
        </CardNameRow>

        <CardStats>
          <div className="row">
            <span className="label">{t("spaceport.myNft.floorPrice")}:</span>
            <span className="value">{floorPrice}</span>
          </div>
          <div className="row">
            <div style={{ display: "flex", alignItems: "center", gap: 2 }}>
              <span className="label">{t("spaceport.myNft.hiddenRarity")}</span>
              <button
                className="tooltip-button"
                style={{
                  height: 14,
                  marginLeft: 4,
                }}
              >
                <Info size={14} color="#738094" />
                <span
                  className="tooltip-text"
                  style={{
                    width: 300,
                    whiteSpace: "wrap",
                  }}
                >
                  {t("spaceport.myNft.hiddenRarityTooltip")}
                </span>
              </button>
            </div>
            <span className={`value ${nft.hiddenRarity ? "green" : "red"}`}>
              {nft.hiddenRarity ? t("spaceport.myNft.yes") : t("spaceport.myNft.no")}
            </span>
          </div>
        </CardStats>
      </CardInfo>
    </NFTCard>
  );
};

type Props = {
  collectionFilter: CollectionFilter;
  isLoading: boolean;
  nfts: NFTItem[];
  connectedAccount: string;
  floorPrice: string;
  onFilterChange: (filter: CollectionFilter) => void;
  onSelectNft: (nft: NFTItem) => void;
};

export const NFTCollectionSection: React.FC<Props> = ({
  collectionFilter,
  isLoading,
  nfts,
  connectedAccount,
  floorPrice,
  onFilterChange,
  onSelectNft,
}) => {
  const { t } = useTranslation();

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
      <SectionHeader>
        <SectionTitle>
          {isLoading
            ? t("spaceport.myNft.collectionTitle")
            : t("spaceport.myNft.collectionTitleWithCount", {
              values: { count: nfts.length },
            })}
        </SectionTitle>
        <FilterTabs>
          <FilterTab active={collectionFilter === "all"} onClick={() => onFilterChange("all")}>
            {t("spaceport.myNft.all")}
          </FilterTab>
          <FilterTab
            active={collectionFilter === "staked"}
            onClick={() => onFilterChange("staked")}
          >
            {t("spaceport.myNft.staked")}
          </FilterTab>
          <FilterTab active={collectionFilter === "ready"} onClick={() => onFilterChange("ready")}>
            {t("spaceport.myNft.ready")}
          </FilterTab>
        </FilterTabs>
      </SectionHeader>

      {isLoading ? (
        <WalletNftGridPlaceholder />
      ) : nfts.length === 0 ? (
        connectedAccount ? (
          <div style={{ width: "100%", display: "flex", justifyContent: "center", padding: "20px 0" }}>
            <EmptyList imgWidth={180} textWidth={320} fontSize={18} gap={20} lineHeight={170} />
          </div>
        ) : (
          <p style={{ margin: 0, color: "#738094", fontSize: 14 }}>
            {t("spaceport.myNft.connectWalletToLoadNfts")}
          </p>
        )
      ) : (
        <NFTGrid>
          {nfts.map((nft) => (
            <NFTCollectionCard
              key={nft.id}
              nft={nft}
              floorPrice={floorPrice}
              onSelect={onSelectNft}
            />
          ))}
        </NFTGrid>
      )}
    </div>
  );
};
