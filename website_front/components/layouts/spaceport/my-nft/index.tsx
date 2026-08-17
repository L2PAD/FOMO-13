import React from "react";
import NFTDetailsModal from "./NFTDetailsModal";
import NFTHiddenDetailsModal from "./NFTHiddenDetailsModal";
import NFTSingularityDetailsModal from "./NFTSingularityDetailsModal";
import Modal from "../../../global/common/Modal";
import {
  HistoryItems,
  HistoryList,
  HistoryRow,
  HistoryTime,
  MyNFTWrapper,
  SectionTitle,
  SmallBadge,
  rarityColor,
} from "./styles";
import { CROSSING_HISTORY } from "./data";
import { FeaturedNFTCard } from "./FeaturedNFTCard";
import { NFTCollectionSection } from "./NFTCollectionSection";
import FomoNftAccess from "./FomoNftAccess";
import { FeaturedCardPlaceholder } from "./LoadingPlaceholders";
import { SPACEPORT_FLOOR_PRICE } from "./constants";
import { useMyNft } from "./useMyNft";
import { useTranslation } from "i18n";

export const MyNFT: React.FC = () => {
  const { t } = useTranslation();
  const {
    collectionFilter,
    connectedAccount,
    featuredNFT,
    featuredOwnerName,
    filteredNFTs,
    handleStakeToggle,
    hiddenModalData,
    isFeaturedStakePending,
    isNftLoading,
    modalData,
    openFeaturedModal,
    openImageModal,
    selectFeaturedNft,
    setCollectionFilter,
    showImageModal,
    singularityModalData,
    closeHiddenModal,
    closeImageModal,
    closeModal,
    closeSingularityModal,
  } = useMyNft();

  return (
    <>
      <MyNFTWrapper>
        <FomoNftAccess wallet={connectedAccount} />
        {isNftLoading && !featuredNFT ? (
          <FeaturedCardPlaceholder />
        ) : featuredNFT && (
          <FeaturedNFTCard
            nft={featuredNFT}
            ownerName={featuredOwnerName}
            floorPrice={SPACEPORT_FLOOR_PRICE}
            isStakePending={isFeaturedStakePending}
            onOpenDetails={openFeaturedModal}
            onExpandImage={openImageModal}
            onStakeToggle={handleStakeToggle}
          />
        )}

        <NFTCollectionSection
          collectionFilter={collectionFilter}
          isLoading={isNftLoading}
          nfts={filteredNFTs}
          connectedAccount={connectedAccount}
          floorPrice={SPACEPORT_FLOOR_PRICE}
          onFilterChange={setCollectionFilter}
          onSelectNft={selectFeaturedNft}
        />

        {false && (
          <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
            <SectionTitle>{t("spaceport.myNft.crossingHistory")}</SectionTitle>

            <HistoryList>
              {CROSSING_HISTORY.map((entry) => (
                <HistoryRow key={entry.id}>
                  <HistoryItems>
                    {entry.inputs.map((input, idx) => (
                      <React.Fragment key={`${entry.id}-${input.name}-${idx}`}>
                        <span className="shard-name">{input.name}</span>
                        <SmallBadge color={rarityColor[input.rarity]}>
                          {input.rarity}
                        </SmallBadge>
                        {idx < entry.inputs.length - 1 && <span className="separator">+</span>}
                      </React.Fragment>
                    ))}
                    <span className="arrow">в†’</span>
                    <span className="shard-name">{entry.output.name}</span>
                    <SmallBadge color={rarityColor[entry.output.rarity]}>
                      {entry.output.rarity}
                    </SmallBadge>
                  </HistoryItems>
                  <HistoryTime>{entry.time}</HistoryTime>
                </HistoryRow>
              ))}
            </HistoryList>
          </div>
        )}

        {showImageModal && featuredNFT && (
          <Modal className="image-modal" onClose={closeImageModal} title={featuredNFT.name}>
            <img
              src={featuredNFT.image}
              alt={featuredNFT.name}
              style={{ width: 740, height: 740, objectFit: "cover", borderRadius: 12 }}
            />
          </Modal>
        )}
      </MyNFTWrapper>

      <NFTDetailsModal nft={modalData} onClose={closeModal} />
      <NFTHiddenDetailsModal nft={hiddenModalData} onClose={closeHiddenModal} />
      <NFTSingularityDetailsModal nft={singularityModalData} onClose={closeSingularityModal} />
    </>
  );
};
