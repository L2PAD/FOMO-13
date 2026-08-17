import React from "react";
import EmptyList from "../../../../../global/EmptyList";
import { NFTItem } from "../../NFTsMarket/nft-item";
import { CollectionEmptyState, NFTsWrapper } from "../styles";

interface CollectionNftGridProps {
  items: any[];
  currency: "ETH" | "USDC";
  onOpenCart: () => void;
}

export const CollectionNftGrid: React.FC<CollectionNftGridProps> = ({
  items,
  currency,
  onOpenCart,
}) => {
  if (!items.length) {
    return (
      <CollectionEmptyState>
        <EmptyList imgWidth={180} textWidth={360} fontSize={18} gap={20} />
      </CollectionEmptyState>
    );
  }

  return (
    <NFTsWrapper>
      {items.map((nft, index) => (
        <NFTItem
          key={`${nft._id}-${index}`}
          item={nft}
          currency={currency}
          onOpenCart={onOpenCart}
        />
      ))}
    </NFTsWrapper>
  );
};
