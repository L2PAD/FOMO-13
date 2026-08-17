import React from "react";
import EmptyList from "../../../../../global/EmptyList";
import { NFTItem } from "../../NFTsMarket/nft-item";
import {
  FooterSection,
  NFTGrid,
  RelatedEmptyState,
  SectionTitle,
} from "../styles";
import { ICollectionNftPageRelatedItem } from "../../../../../../types/global_types";

interface NFTPageRelatedSectionProps {
  title: string;
  items: ICollectionNftPageRelatedItem[];
}

export const NFTPageRelatedSection: React.FC<NFTPageRelatedSectionProps> = ({
  title,
  items,
}) => (
  <FooterSection>
    <SectionTitle>{title}</SectionTitle>
    {items.length > 0 ? (
      <NFTGrid>
        {items.map((item, index) => (
          <NFTItem
            key={`${item._id}-${index}`}
            item={item}
            detailsHref={`/utility/market/collection/nft/${item._id}`}
          />
        ))}
      </NFTGrid>
    ) : (
      <RelatedEmptyState>
        <EmptyList imgWidth={180} textWidth={360} fontSize={18} gap={20} />
      </RelatedEmptyState>
    )}
  </FooterSection>
);
