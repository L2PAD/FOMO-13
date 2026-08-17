import React from "react";
import Placeholder from "../../../global/common/Placeholder";
import {
  CardBottomBadges,
  CardImage,
  CardInfo,
  CardTopBadges,
  FeaturedCard,
  FeaturedImageSide,
  FeaturedInfoSide,
  NFTCard,
  NFTGrid,
} from "./styles";

const NFT_LOADING_PLACEHOLDER_IDS = [0, 1, 2, 3, 4, 5];

export const FeaturedCardPlaceholder: React.FC = () => (
  <FeaturedCard aria-hidden="true">
    <FeaturedImageSide>
      <div style={{ width: "100%", maxWidth: 440 }}>
        <Placeholder width="100%" height="440px" borderRadius="12px" marginBottom="0" />
      </div>
      <Placeholder width="148px" height="18px" borderRadius="999px" marginBottom="0" />
    </FeaturedImageSide>

    <FeaturedInfoSide>
      <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
        <Placeholder width="62%" height="40px" borderRadius="10px" marginBottom="0" />
        <Placeholder width="34%" height="18px" borderRadius="999px" marginBottom="0" />
        <Placeholder width="100%" height="60px" borderRadius="8px" marginBottom="0" />
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
        <Placeholder width="100%" height="52px" borderRadius="8px" marginBottom="0" />
        <Placeholder width="68%" height="16px" borderRadius="8px" marginBottom="0" />
      </div>
    </FeaturedInfoSide>
  </FeaturedCard>
);

export const WalletNftGridPlaceholder: React.FC = () => (
  <NFTGrid aria-hidden="true">
    {NFT_LOADING_PLACEHOLDER_IDS.map((placeholderId) => (
      <NFTCard
        key={`wallet-nft-placeholder-${placeholderId}`}
        style={{ cursor: "default", pointerEvents: "none" }}
      >
        <CardImage>
          <Placeholder width="100%" height="100%" borderRadius="0" marginBottom="0" />
        </CardImage>

        <CardTopBadges>
          <Placeholder width="74px" height="28px" borderRadius="8px" marginBottom="0" />
          <Placeholder width="86px" height="28px" borderRadius="8px" marginBottom="0" />
        </CardTopBadges>

        <CardBottomBadges>
          <Placeholder width="56px" height="28px" borderRadius="8px" marginBottom="0" />
          <Placeholder width="92px" height="28px" borderRadius="8px" marginBottom="0" />
        </CardBottomBadges>

        <CardInfo>
          <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
            <div
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                gap: 12,
                padding: "0 20px",
              }}
            >
              <Placeholder width="58%" height="20px" borderRadius="8px" marginBottom="0" />
              <Placeholder width="44px" height="18px" borderRadius="8px" marginBottom="0" />
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: 12, padding: "0 20px" }}>
              <Placeholder width="100%" height="18px" borderRadius="8px" marginBottom="0" />
              <Placeholder width="100%" height="18px" borderRadius="8px" marginBottom="0" />
            </div>

            <div
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                gap: 12,
                padding: "0 20px",
              }}
            >
              <div style={{ display: "flex", flexDirection: "column", gap: 8, flex: 1 }}>
                <Placeholder width="44%" height="22px" borderRadius="8px" marginBottom="0" />
                <Placeholder width="36%" height="18px" borderRadius="8px" marginBottom="0" />
              </div>
              <Placeholder width="20px" height="20px" borderRadius="999px" marginBottom="0" />
            </div>
          </div>
        </CardInfo>
      </NFTCard>
    ))}
  </NFTGrid>
);
