import React from "react";
import {
  PossibleRarityBoxesWrapper,
  PossibleRarityBoxesGrid,
  PossibleRarityBoxCard,
} from "./styles";
import { POSSIBLE_RARITY_BOXES } from "./data";
import { useTranslation } from "i18n";

const BOX_NAME_KEYS: Record<string, string> = {
  uncommon: "spaceport.boxShop.uncommonBox",
  epic: "spaceport.boxShop.epicBox",
  legendary: "spaceport.boxShop.legendaryBox",
};

const getDropLabelKey = (value: string): string => {
  const normalized = value.toLowerCase();

  if (normalized.includes("shard")) return "spaceport.boxShop.nftShards4x";
  if (normalized.includes("legendary")) return "spaceport.boxShop.legendaryNft";
  if (normalized.includes("epic")) return "spaceport.boxShop.epicNft";
  if (normalized.includes("rare")) return "spaceport.boxShop.rareNft";
  return "spaceport.boxShop.uncommonNft";
};

const PossibleRarityBoxesSection: React.FC = () => {
  const { t } = useTranslation();

  return (
    <PossibleRarityBoxesWrapper>
      <h3>{t("spaceport.boxShop.possibleRarityBoxes")}</h3>

      <PossibleRarityBoxesGrid>
        {POSSIBLE_RARITY_BOXES.map((box) => (
          <PossibleRarityBoxCard key={box.type} className={box.type}>
            <div className="image-wrap">
              <img src={box.image} alt={box.name} />
              <span className="rarity-badge">
                {t(`spaceport.rarity.${box.type}`)}
              </span>
            </div>

            <div className="content">
              <div className="top-row">
                <h4>{t(BOX_NAME_KEYS[box.type] || "spaceport.boxShop.uncommonBox")}</h4>
                <span className="chance-pill">{box.chance}%</span>
              </div>

              <div className="drop-chances-card">
                <span className="drop-title">{t("spaceport.boxShop.dropChances")}</span>
                <div className="drop-list">
                  {box.dropChances.map((drop) => (
                    <div className="drop-row" key={`${box.type}-${drop.label}`}>
                      <span>{t(getDropLabelKey(drop.label))}</span>
                      <strong>{drop.chance}%</strong>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </PossibleRarityBoxCard>
        ))}
      </PossibleRarityBoxesGrid>
    </PossibleRarityBoxesWrapper>
  );
};

export default PossibleRarityBoxesSection;
