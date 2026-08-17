import React from "react";
import { Eye } from "lucide-react";
import UserAvatar from "../../../../../global/common/UserAvatar";
import {
  CollectionInfo,
  CreatorInfo,
  Description,
  Header,
  InfoLabel,
  InfoValue,
  NFTId,
  NFTMeta,
  NFTTitle,
  RarityBadge,
  RightColumn,
  ViewCount,
} from "../styles";
import {
  NFTPageDetailsData,
  NFTPageInfoRow,
  NFTPageOffer,
  NFTPagePricePoint,
  NFTPageTab,
} from "../types";
import { NFTPageTabs } from "./NFTPageTabs";

interface NFTPageDetailsProps {
  details: NFTPageDetailsData;
  activeTab: NFTPageTab;
  onTabChange: (tab: NFTPageTab) => void;
  infoRows: NFTPageInfoRow[];
  priceData: NFTPagePricePoint[];
  offersData: NFTPageOffer[];
  pendingOfferId?: string | null;
  pendingOfferAction?: "cancel" | "confirm" | "buy" | null;
  onCancelOffer: (offerId: string) => void;
  onConfirmOffer: (offerId: string) => void;
  onBuyOffer: (offerId: string) => void;
}

export const NFTPageDetails: React.FC<NFTPageDetailsProps> = ({
  details,
  activeTab,
  onTabChange,
  infoRows,
  priceData,
  offersData,
  pendingOfferId,
  pendingOfferAction,
  onCancelOffer,
  onConfirmOffer,
  onBuyOffer,
}) => (
  <RightColumn>
    <Header>
      <NFTTitle>{details.title}</NFTTitle>
      <NFTMeta>
        <NFTId>{details.tokenId}</NFTId>
        <RarityBadge rarity={details.rarity}>{details.rarity}</RarityBadge>
        <ViewCount>
          <Eye size={16} />
          {details.views}
        </ViewCount>
      </NFTMeta>
    </Header>

    <CollectionInfo>
      <CreatorInfo>
        <UserAvatar
          avatar={details.collectionAvatar}
          variant="default"
          size="small"
          name={details.collectionName}
        />
        <div>
          <InfoLabel>Collection</InfoLabel>
          <InfoValue>{details.collectionName}</InfoValue>
        </div>
      </CreatorInfo>
      <CreatorInfo style={{ marginLeft: "auto" }}>
        <UserAvatar
          avatar={details.creatorAvatar}
          variant="default"
          size="small"
          name={details.creatorName}
        />
        <div>
          <InfoLabel>Creator</InfoLabel>
          <InfoValue>{details.creatorName}</InfoValue>
        </div>
      </CreatorInfo>
    </CollectionInfo>

    <Description>
      {details.description || "Description is not available."}
    </Description>

    <NFTPageTabs
      activeTab={activeTab}
      onTabChange={onTabChange}
      infoRows={infoRows}
      priceData={priceData}
      offersData={offersData}
      pendingOfferId={pendingOfferId}
      pendingOfferAction={pendingOfferAction}
      onCancelOffer={onCancelOffer}
      onConfirmOffer={onConfirmOffer}
      onBuyOffer={onBuyOffer}
    />
  </RightColumn>
);
