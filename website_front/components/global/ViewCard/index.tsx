/* eslint-disable */
import React, { FC } from "react";
import DefaultCard, { DefaultCardInterface } from "./DefaultCard";
import { IProject } from "../../../types/global_types";
import EarlyLandCard from "./EarlyLandCard";
import NFTCard from "./NFTCard";
import GemsLabCard from "./GemslabCard";
import MarketCard, { MarketCardInterface } from "./MarketCard";
import PersonCard from "../PersonCard";
import SpotlightCard from "./SpotlightCard";
import FundingFeedCard from "./FundingFeedCard";
import UnlockingCard from "./UnlockingCard";
import FundSpotlightCard from "./FundSpotlightCard";
import PersonSpotlightCard from "./PersonSpotlightCard";
import TopFomonautCard from "./TopFomonautCard";

export interface ViewCardInterface {
  type:
  | "default"
  | "earlyLand"
  | "nft"
  | "gemslab"
  | "market"
  | "funds"
  | "spotlight"
  | "funding-feed"
  | "unlocking"
  | "fund-spotlight"
  | "person-spotlight"
  | string;
  cardData: IProject | MarketCardInterface;
  className?: string;
  isFavorite?: boolean;
  onToggleFavorite?: () => void;
  searchValue?: string;
}

const ViewCard: FC<ViewCardInterface> = ({
  type,
  cardData,
  className,
  isFavorite,
  onToggleFavorite,
  searchValue,
}) => {
  switch (type) {
    case "default": {
      const defaultCardData = cardData as IProject;

      return (
        <DefaultCard
          className={className}
          isFavorite={isFavorite}
          onToggleFavorite={onToggleFavorite}
          searchValue={searchValue}
          {...defaultCardData}
        />
      );
    }
    case "earlyLand":
      // @ts-ignore
      return <EarlyLandCard className={className} {...cardData} />;
    case "nft":
      // @ts-ignore
      return <NFTCard className={className} {...cardData} />;
    case "gemslab":
      // @ts-ignore
      return <GemsLabCard className={className} {...cardData} />;
    case "market":
      // @ts-ignore
      return <MarketCard className={className} {...cardData} />;
    case "funds":
      // @ts-ignore
      return <PersonCard {...cardData} />;
    case "spotlight":
      // @ts-ignore
      return <SpotlightCard {...cardData} />;
    case "funding-feed":
      // @ts-ignore
      return <FundingFeedCard {...cardData} />;
    case "unlocking":
      // @ts-ignore
      return <UnlockingCard {...cardData} />;
    case "fund-spotlight":
      // @ts-ignore
      return <FundSpotlightCard {...cardData} />;
    case "person-spotlight":
      // @ts-ignore
      return <PersonSpotlightCard {...cardData} />;
    case "top-fomonaut":
      // @ts-ignore
      return <TopFomonautCard {...cardData} />;
    case "persons":
      // @ts-ignore
      return <PersonCard {...cardData} />;
    default:
      return null;
  }
};

export default ViewCard;
