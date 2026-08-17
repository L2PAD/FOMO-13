import React, { useEffect, useState } from "react";
import { Expand } from "lucide-react";
import {
  ButtonsWrapper,
  ImageWrapper,
  LeftColumn,
  PriceCard,
  PriceLabel,
  PriceUSD,
  PriceValue,
  TimerItem,
  TimerLabel,
  TimerNumber,
  TimerUnit,
  TimerValues,
} from "../styles";
import { getCountdownParts, isExpiredDate } from "../helpers";
import { NFTPageDetailsData, NFTPageTimerItem } from "../types";

interface NFTPageSidebarProps {
  details: NFTPageDetailsData;
  isInCart: boolean;
  disablePurchase?: boolean;
  purchaseButtonLabel?: string;
  disableMakeOffer?: boolean;
  onExpandImage: () => void;
  onPurchaseNow: () => void;
  onMakeOffer: () => void;
}

export const NFTPageSidebar: React.FC<NFTPageSidebarProps> = ({
  details,
  isInCart,
  disablePurchase = false,
  purchaseButtonLabel = "Purchase Now",
  disableMakeOffer = false,
  onExpandImage,
  onPurchaseNow,
  onMakeOffer,
}) => {
  const [auctionEndsIn, setAuctionEndsIn] = useState<NFTPageTimerItem[]>([
    { value: "00", unit: "days" },
    { value: "00", unit: "hrs" },
    { value: "00", unit: "mins" },
    { value: "00", unit: "secs" },
  ]);
  const [isAuctionEnded, setIsAuctionEnded] = useState(false);

  useEffect(() => {
    const updateCountdown = () => {
      const countdown = getCountdownParts(details.endDate);
      const expired = isExpiredDate(details.endDate);

      setAuctionEndsIn([
        { value: countdown.days, unit: "days" },
        { value: countdown.hours, unit: "hrs" },
        { value: countdown.minutes, unit: "mins" },
        { value: countdown.seconds, unit: "secs" },
      ]);
      setIsAuctionEnded(expired);
    };

    updateCountdown();
    if (!details.endDate) {
      return;
    }

    const intervalId = window.setInterval(updateCountdown, 1000);

    return () => {
      window.clearInterval(intervalId);
    };
  }, [details.endDate]);

  return (
    <LeftColumn>
      <ImageWrapper>
        <img src={details.image} alt={details.title} />
        <button className="expand" onClick={onExpandImage}>
          <Expand size={16} color="#ffffff" />
        </button>
      </ImageWrapper>

      <PriceCard>
        <div className="wrapper">
          <div className="div">
            <PriceLabel>Price</PriceLabel>
            <PriceValue>{`${details.currency} ${details.priceAmount}`}</PriceValue>
            <PriceUSD>{`$${details.priceUsd}`}</PriceUSD>
          </div>

          <div>
            <TimerLabel>{isAuctionEnded ? "Auction ended" : "Auction ends in"}</TimerLabel>
            <TimerValues>
              {auctionEndsIn.map((item) => (
                <TimerItem key={item.unit}>
                  <TimerNumber>{item.value}</TimerNumber>
                  <TimerUnit>{item.unit}</TimerUnit>
                </TimerItem>
              ))}
            </TimerValues>
          </div>
        </div>

        <ButtonsWrapper>
          <button
            disabled={(isAuctionEnded && !isInCart) || (disablePurchase && !isInCart)}
            onClick={onPurchaseNow}
            type="button"
          >
            {isInCart ? "Open Cart" : purchaseButtonLabel}
          </button>
          <button
            disabled={isAuctionEnded || disableMakeOffer}
            onClick={onMakeOffer}
            type="button"
          >
            Make Offer
          </button>
        </ButtonsWrapper>
      </PriceCard>
    </LeftColumn>
  );
};
