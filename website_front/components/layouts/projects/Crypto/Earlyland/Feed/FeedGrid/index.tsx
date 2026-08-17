import React, { FC } from "react";
import FeedCard, { FeedCardSkeleton } from "../FeedCard";
import { EarlylandCardData } from "../FeedCard/types";
import { GridWrapper } from "./styles";

interface Props {
  items: EarlylandCardData[];
  isLoading?: boolean;
  searchValue?: string;
  onToggleFavourite?: (id: string, interactionId?: string) => void;
  onDetails?: (id: string) => void;
}

const SKELETON_CARD_COUNT = 9;

const FeedGrid: FC<Props> = ({
  items,
  isLoading = false,
  searchValue = "",
  onToggleFavourite,
  onDetails,
}) => {
  return (
    <GridWrapper>
      {isLoading
        ? Array.from({ length: SKELETON_CARD_COUNT }).map((_, index) => (
            <FeedCardSkeleton key={`earlyland-card-skeleton-${index}`} />
          ))
        : items.map((item) => (
            <FeedCard
              key={item.id}
              {...item}
              searchValue={searchValue}
              onToggleFavourite={onToggleFavourite}
              onDetails={onDetails}
            />
          ))}
    </GridWrapper>
  );
};

export default FeedGrid;
