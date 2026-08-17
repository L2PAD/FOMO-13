import React from "react";
import {
  Flag,
  Star,
  ThumbsDown,
  ThumbsUp,
} from "lucide-react";
import SocialLinks from "../../../../../global/common/SocialLinks";
import UserAvatar from "../../../../../global/common/UserAvatar";
import DateRangeSelect from "../../../../../UI/inputs/DateRangeSelect";
import { CopyIcon } from "../../../../../global/Icons";
import imageLoader from "../../../../../../helpers/imageLoader";
import { clarifyAmount } from "../../../../../../helpers/clarifyAmount";
import { simplifyAmount } from "../../../../../../helpers/simplifyAmount";
import {
  ICollection,
  ICollectionMarketStatsPeriod,
  ICollectionMarketStatsPoint,
} from "../../../../../../types/global_types";
import humans from "../../../../../../assets/images/nft/humans.png";
import {
  CollectionHeaderContractButton,
  CollectionHeaderDesktopActions,
  CollectionHeaderMetricCard,
  CollectionHeaderMetricLabel,
  CollectionHeaderMetricRow,
  CollectionHeaderMetricValue,
  CollectionHeaderPriceChange,
  CollectionHeaderPriceRow,
  CollectionHeaderRange,
  CollectionHeaderRangeFill,
  CollectionHeaderRangeMeta,
  CollectionHeaderSocialsRow,
  CollectionHeaderSubtitle,
  CollectionHeaderTitle,
  CollectionHeaderTopRow,
  CollectionHeaderVisualCard,
  HeaderWrapper,
  LeftHeaderWrapper,
  RightHeaderWrapper,
} from "../styles";
import {
  CollectionHeaderActions,
  CollectionFlagColor,
} from "./CollectionHeaderActions";

const EMPTY_STATS: ICollectionMarketStatsPoint = {
  minPriceUsd: 0,
  maxPriceUsd: 0,
  avgPriceUsd: 0,
  listingsCount: 0,
};

const formatUsdPrice = (value?: number) =>
  `$${simplifyAmount(Number(value || 0), 2)}`;

const getRangeProgress = (
  minPriceUsd?: number,
  maxPriceUsd?: number,
  avgPriceUsd?: number
) => {
  const min = Number(minPriceUsd || 0);
  const max = Number(maxPriceUsd || 0);
  const avg = Number(avgPriceUsd || 0);

  if (max <= 0) return 0;
  if (max === min) return avg > 0 ? 100 : 0;

  const progress = ((avg - min) / (max - min)) * 100;

  return Math.max(0, Math.min(100, Number.isFinite(progress) ? progress : 0));
};

interface CollectionHeaderProps {
  collection?: ICollection;
  priceData: {
    percent?: number;
    marketCap?: number;
    totalVolume?: number;
    supply?: number;
  };
  ownersCount: number;
  interval: string;
  onIntervalChange: (value: string) => void;
  onCopySmartContract: () => void;
  actionsProps: {
    isMobile: boolean;
    isActionsPopoverOpen: boolean;
    isSocialsPopoverOpen: boolean;
    socialLinks: Array<{ href: string; key: string }>;
    isInWatchlist: boolean;
    isInFavorites: boolean;
    isLiked: boolean;
    isDisliked: boolean;
    activeFlag: CollectionFlagColor | null;
    onActionsToggle: () => void;
    onActionsClose: () => void;
    onSocialsToggle: () => void;
    onSocialsClose: () => void;
    onWatchlist: () => void;
    onFavorites: () => void;
    onLike: () => void;
    onDislike: () => void;
    onFlag: (color: CollectionFlagColor) => void;
  };
}

const formatMetricValue = (value?: number, digits = 0) => {
  const normalized = Number(value || 0);
  if (!Number.isFinite(normalized) || normalized <= 0) {
    return "0";
  }

  if (digits > 0) {
    return new Intl.NumberFormat("en-US", {
      minimumFractionDigits: 0,
      maximumFractionDigits: digits,
    }).format(normalized);
  }

  return new Intl.NumberFormat("en-US").format(Math.trunc(normalized));
};

const formatPercentChange = (value?: number) => {
  const normalized = Number(value || 0);
  const prefix = normalized > 0 ? "+" : "";
  return `${prefix}${normalized.toFixed(2)}%`;
};

const getContractLabel = (smart?: string) => {
  if (!smart) {
    return "-";
  }

  return `${smart.slice(0, 6)}...${smart.slice(-6)}`;
};

const renderDesktopActions = (
  actionsProps: CollectionHeaderProps["actionsProps"]
) => (
  <CollectionHeaderDesktopActions>
    <button
      type="button"
      aria-label="Toggle watchlist"
      className={actionsProps.isInWatchlist ? "active amber" : "amber"}
      onClick={actionsProps.onWatchlist}
    >
      <Star size={18} />
    </button>
    <button
      type="button"
      aria-label="Like collection"
      className={actionsProps.isLiked ? "active green" : "green"}
      onClick={actionsProps.onLike}
    >
      <ThumbsUp size={18} />
    </button>
    <button
      type="button"
      aria-label="Dislike collection"
      className={actionsProps.isDisliked ? "active red" : "red"}
      onClick={actionsProps.onDislike}
    >
      <ThumbsDown size={18} />
    </button>
    <button
      type="button"
      aria-label="Set green flag"
      className={actionsProps.activeFlag === "green" ? "active green" : "green"}
      onClick={() => actionsProps.onFlag("green")}
    >
      <Flag size={18} />
    </button>
    <button
      type="button"
      aria-label="Set yellow flag"
      className={actionsProps.activeFlag === "yellow" ? "active amber" : "amber"}
      onClick={() => actionsProps.onFlag("yellow")}
    >
      <Flag size={18} />
    </button>
    <button
      type="button"
      aria-label="Set red flag"
      className={actionsProps.activeFlag === "red" ? "active red" : "red"}
      onClick={() => actionsProps.onFlag("red")}
    >
      <Flag size={18} />
    </button>
  </CollectionHeaderDesktopActions>
);

export const CollectionHeader: React.FC<CollectionHeaderProps> = ({
  collection,
  priceData,
  ownersCount,
  interval,
  onIntervalChange,
  onCopySmartContract,
  actionsProps,
}) => {
  const periodKey = interval as ICollectionMarketStatsPeriod;
  const periodStats = collection?.marketStats?.periods?.[periodKey] || EMPTY_STATS;
  const allTimeStats = collection?.marketStats?.allTime || EMPTY_STATS;
  const periodProgress = getRangeProgress(
    periodStats.minPriceUsd,
    periodStats.maxPriceUsd,
    periodStats.avgPriceUsd
  );
  const priceChange = Number(priceData?.percent || 0);
  const marketCap = Number(collection?.project?.marketCap || priceData.marketCap || 0);
  const totalSupply =
    Number(collection?.nftQuantity || collection?.nfts?.length || priceData.supply || 0);
  const listedCount = Array.isArray(collection?.nfts) ? collection?.nfts.length : 0;
  const totalVolume = Number(priceData?.totalVolume || 0);

  return (
    <HeaderWrapper>
      <LeftHeaderWrapper as={CollectionHeaderVisualCard}>
        <div className="mobile-actions">
          {actionsProps.isMobile && (
            <CollectionHeaderActions {...actionsProps} />
          )}
        </div>
        <CollectionHeaderTopRow>
          <UserAvatar
            avatar={
              collection?.project?.logo
                ? imageLoader(String(collection?.project?.logo))
                : humans.src
            }
            variant="default"
            size="medium"
            name={collection?.project?.name || "Collection"}
          />
          <div>
            <CollectionHeaderTitle>
              {collection?.project?.name || "SharkRace Club"}
            </CollectionHeaderTitle>
            <CollectionHeaderSubtitle>
              {collection?.project?.niche || "NFT & Collectibles"}
            </CollectionHeaderSubtitle>
          </div>
          <div className="buttons">
            {actionsProps.isMobile ? (
              <CollectionHeaderActions {...actionsProps} />
            ) : (
              renderDesktopActions(actionsProps)
            )}
          </div>
        </CollectionHeaderTopRow>

        <CollectionHeaderPriceRow>
          <div className="price-group">
            <div className="value">{formatUsdPrice(periodStats.avgPriceUsd)}</div>
            <CollectionHeaderPriceChange
              isPositive={priceChange >= 0}
            >
              {formatPercentChange(priceChange)}
            </CollectionHeaderPriceChange>
          </div>
          <div className="range-select">
            <DateRangeSelect value={interval} onChange={onIntervalChange} />
          </div>
        </CollectionHeaderPriceRow>

        <CollectionHeaderRange>
          <CollectionHeaderRangeFill percentage={periodProgress} />
        </CollectionHeaderRange>

        <CollectionHeaderRangeMeta>
          <div>
            Low: <strong>{formatUsdPrice(periodStats.minPriceUsd)}</strong>
          </div>
          <div>
            High: <strong>{formatUsdPrice(periodStats.maxPriceUsd)}</strong>
          </div>
        </CollectionHeaderRangeMeta>

        <CollectionHeaderSocialsRow>
          <div className="socials">
            <SocialLinks
              limit={6}
              className="projects"
              links={actionsProps.socialLinks}
            />
          </div>
          <CollectionHeaderContractButton
            type="button"
            onClick={onCopySmartContract}
          >
            <span>{getContractLabel(collection?.smart)}</span>
            <CopyIcon fill="#7081a7" />
          </CollectionHeaderContractButton>
        </CollectionHeaderSocialsRow>
      </LeftHeaderWrapper>

      <RightHeaderWrapper as={CollectionHeaderMetricCard}>
        <CollectionHeaderMetricRow>
          <CollectionHeaderMetricLabel>Market Cap</CollectionHeaderMetricLabel>
          <CollectionHeaderMetricValue>
            ${clarifyAmount(marketCap)}
          </CollectionHeaderMetricValue>
        </CollectionHeaderMetricRow>
        <CollectionHeaderMetricRow>
          <CollectionHeaderMetricLabel>Total Supply</CollectionHeaderMetricLabel>
          <CollectionHeaderMetricValue>
            {formatMetricValue(totalSupply)}
          </CollectionHeaderMetricValue>
        </CollectionHeaderMetricRow>
        <CollectionHeaderMetricRow>
          <CollectionHeaderMetricLabel>Listed</CollectionHeaderMetricLabel>
          <CollectionHeaderMetricValue>
            {formatMetricValue(listedCount)}
          </CollectionHeaderMetricValue>
        </CollectionHeaderMetricRow>
        <CollectionHeaderMetricRow>
          <CollectionHeaderMetricLabel>Owners</CollectionHeaderMetricLabel>
          <CollectionHeaderMetricValue>
            {formatMetricValue(ownersCount)}
          </CollectionHeaderMetricValue>
        </CollectionHeaderMetricRow>
        <CollectionHeaderMetricRow>
          <CollectionHeaderMetricLabel>Total Volume</CollectionHeaderMetricLabel>
          <CollectionHeaderMetricValue>
            ${clarifyAmount(totalVolume)}
          </CollectionHeaderMetricValue>
        </CollectionHeaderMetricRow>
        <CollectionHeaderMetricRow>
          <CollectionHeaderMetricLabel>Mint Price</CollectionHeaderMetricLabel>
          <CollectionHeaderMetricValue>
            ${formatMetricValue(Number(collection?.mintPrice || 0), 2)}
          </CollectionHeaderMetricValue>
        </CollectionHeaderMetricRow>
        <CollectionHeaderMetricRow>
          <CollectionHeaderMetricLabel>Royalty Fee</CollectionHeaderMetricLabel>
          <CollectionHeaderMetricValue>
            {formatMetricValue(Number(collection?.royalty || 0), 2)}%
          </CollectionHeaderMetricValue>
        </CollectionHeaderMetricRow>

      </RightHeaderWrapper>
    </HeaderWrapper>
  );
};
