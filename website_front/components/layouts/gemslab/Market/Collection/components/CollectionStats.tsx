import React from "react";
import { clarifyAmount } from "../../../../../../helpers/clarifyAmount";
import { ICollection } from "../../../../../../types/global_types";
import { IPriceData } from "../../Project";
import {
  ProjectDescriptionDataWrapper,
  ProjectDescriptionItem,
} from "../styles";

interface CollectionStatsProps {
  collection?: ICollection;
  priceData: IPriceData;
  ownersCount: number;
  viewsCount: number;
  likesCount: number;
  dislikesCount: number;
}

export const CollectionStats: React.FC<CollectionStatsProps> = ({
  collection,
  priceData,
  ownersCount,
  viewsCount,
  likesCount,
  dislikesCount,
}) => (
  <ProjectDescriptionDataWrapper>
    <ProjectDescriptionItem variant="p">
      <span>Market Cap</span>$
      {clarifyAmount(Number(collection?.project?.marketCap || priceData.marketCap || 0))}
    </ProjectDescriptionItem>
    <ProjectDescriptionItem percentage={58.17} variant="p">
      <span>Supply</span>
      {collection?.nftQuantity || collection?.nfts?.length || priceData.supply || 0}
    </ProjectDescriptionItem>
    <ProjectDescriptionItem percentage={7.01} variant="p">
      <span>Listed</span>
      {collection ? collection.nfts?.length : 0}
    </ProjectDescriptionItem>
    <ProjectDescriptionItem variant="p">
      <span>Owners</span>
      {ownersCount}
    </ProjectDescriptionItem>
    <ProjectDescriptionItem variant="p">
      <span>Total Volume</span>${clarifyAmount(priceData.totalVolume || 0)}
    </ProjectDescriptionItem>
    <ProjectDescriptionItem variant="p">
      <span>Mint price</span>${collection ? collection.mintPrice : "100"}
    </ProjectDescriptionItem>
    <ProjectDescriptionItem variant="p">
      <span>Royalty Fee</span>
      {collection ? collection?.royalty : "0.5"}%
    </ProjectDescriptionItem>
  </ProjectDescriptionDataWrapper>
);
