import React from "react";
import {
  BoxGridWrapper,
  BoxGrid,
  BoxCard,
  BoxImageWrapper,
  BoxCardContent,
  BoxCardHeader,
  ProgressBar,
  ProgressFill,
  DropChances,
  BoxPrice,
  BoxInfoPanel,
  ProbabilityBar,
  ProbabilityLegend,
  ProbabilityLegendItem,
  ProbabilitySegment,
} from "./styles";
import { BoxData } from "./data";
import { useTranslation } from "i18n";

interface BoxTypeSelectorProps {
  boxes: BoxData[];
  isLoading?: boolean;
}

const getRarityColor = (value: string) => {
  const normalizedValue = value.toLowerCase();

  if (normalizedValue.includes("legendary")) {
    return "#04A584";
  }

  if (normalizedValue.includes("epic")) {
    return "#04A584";
  }

  if (normalizedValue.includes("uncommon")) {
    return "#04A584";
  }

  return "#05A584";
};

const getRarityGradient = (value: string) => {
  const normalizedValue = value.toLowerCase();

  if (normalizedValue.includes("legendary")) {
    return "linear-gradient(90deg, #FF4FCF 0%, #FF8A1E 100%)";
  }

  if (normalizedValue.includes("epic")) {
    return "linear-gradient(90deg, #AE46F4 0%, #FF38B5 100%)";
  }

  return "linear-gradient(90deg, #1F86FF 0%, #18B7D8 100%)";
};

const formatRarityLabel = (value: string) =>
  value.replace(/ nft/gi, "").replace(/\s+/g, " ").trim();

const getRarityKey = (value: string): string => {
  const normalizedValue = value.toLowerCase();

  if (normalizedValue.includes("legendary")) return "spaceport.rarity.legendary";
  if (normalizedValue.includes("epic")) return "spaceport.rarity.epic";
  if (normalizedValue.includes("rare")) return "spaceport.rarity.rare";
  if (normalizedValue.includes("uncommon")) return "spaceport.rarity.uncommon";
  return "spaceport.rarity.common";
};

const BoxTypeSelector: React.FC<BoxTypeSelectorProps> = ({
  boxes,
  isLoading = false,
}) => {
  const { t } = useTranslation();
  const box = boxes[0];

  if (!box) {
    return null;
  }

  const remainingPercentage = box.total > 0 ? (box.remaining / box.total) * 100 : 0;
  const soldCount = Math.max(box.total - box.remaining, 0);
  const soldPercentage = box.total > 0 ? (soldCount / box.total) * 100 : 0;

  return (
    <BoxGridWrapper>
      <BoxGrid>
        <BoxCard>
          <BoxImageWrapper>
            <img src={box.image} alt={box.name} />
          </BoxImageWrapper>

          <BoxCardContent>
            <BoxCardHeader>
              <h4>{t("spaceport.boxShop.boxName")}</h4>
              <p>
                {t("spaceport.boxShop.boxDescription")}
              </p>
            </BoxCardHeader>

            <BoxInfoPanel>
              <div className="panel-top">
                <span className="panel-label">{t("spaceport.boxShop.remaining")}</span>
                <span className="panel-value">
                  {isLoading ? "-- / --" : `${box.remaining} / ${box.total}`}
                </span>
              </div>
              <ProgressBar>
                <ProgressFill percentage={remainingPercentage} color="#17B18C" />
              </ProgressBar>
              <div className="panel-meta">
                <span>
                  {isLoading
                    ? `-- ${t("spaceport.boxShop.sold")}`
                    : `${soldCount} ${t("spaceport.boxShop.sold")}`}
                </span>
                <span>
                  {isLoading
                    ? `--% ${t("spaceport.boxShop.sold")}`
                    : `${Math.round(soldPercentage)}% ${t("spaceport.boxShop.sold")}`}
                </span>
              </div>
            </BoxInfoPanel>

            <DropChances>
              <div className="title">{t("spaceport.boxShop.probabilityDistribution")}</div>
              <ProbabilityBar>
                {box.dropChances.map((drop, index) => (
                  <ProbabilitySegment
                    key={`${drop.rarity}-${index}`}
                    chance={drop.chance}
                    background={getRarityGradient(drop.rarity)}
                  >
                    {drop.chance >= 8 ? `${drop.chance}%` : ""}
                  </ProbabilitySegment>
                ))}
              </ProbabilityBar>
              <ProbabilityLegend>
                {box.dropChances.map((drop, index) => (
                  <ProbabilityLegendItem key={`${drop.rarity}-legend-${index}`}>
                    <span className="legend-name">
                      {t(getRarityKey(formatRarityLabel(drop.rarity)))}
                    </span>
                    <span
                      className="legend-value"
                      style={{ color: getRarityColor(drop.rarity) }}
                    >
                      {drop.chance}%
                    </span>
                  </ProbabilityLegendItem>
                ))}
              </ProbabilityLegend>
            </DropChances>

            <BoxPrice>
              {isLoading ? "-- USDT" : `${box.price} USDT`}
              <span>{t("spaceport.boxShop.perBox")}</span>
            </BoxPrice>
          </BoxCardContent>
        </BoxCard>
      </BoxGrid>
    </BoxGridWrapper>
  );
};

export default BoxTypeSelector;
