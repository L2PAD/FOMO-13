import React, { FC } from "react";
import { ICollection } from "../../../../../types/global_types";
import ShareModal from "../../../../global/modals/ShareModal";
import MakeOfferModal from "../../../../global/modals/MakeOffer";
import CartModal from "../../../../global/modals/CartModal/index";
import CommentBlock from "../../../../global/CommentBlock";
import Pagination from "../../../../global/Pagintaion";
import BreadCrumbs from "../../../../global/BreadCrumbs";
import { PageWrapper } from "./styles";
import { collectionTabs } from "./constants";
import { CollectionHeader } from "./components/CollectionHeader";
import { CollectionFilters } from "./components/CollectionFilters";
import { CollectionNftGrid } from "./components/CollectionNftGrid";
import { useCollection } from "./useCollection";

const Collection: FC<{ collection?: ICollection }> = ({ collection }) => {
  const collectionName = collection?.name || collection?.project?.name || "Collection";
  const projectName = collection?.project?.name || "Projects";
  const crumbs = [
    { title: "NFT Market", link: "/utility/market" },
    { title: collectionName, link: "#" },
  ];

  const {
    currency,
    setCurrency,
    modal,
    cartModal,
    filterValue,
    setFilterValue,
    interval,
    setInterval,
    page,
    setPage,
    isShareModal,
    priceData,
    isMobile,
    isActionsPopoverOpen,
    isSocialsPopoverOpen,
    isLiked,
    isDisliked,
    activeFlag,
    isInFavorites,
    isInWatchlist,
    viewsCount,
    likesCount,
    dislikesCount,
    filteredNftItems,
    paginatedNftItems,
    totalPages,
    ownersCount,
    socialLinks,
    setCollectionFilters,
    copySmartContract,
    handleActionsClick,
    closeActionsPopover,
    handleSocialsClick,
    closeSocialsPopover,
    handleLike,
    handleDislike,
    handleFlag,
    handleAddToFavorites,
    handleWatchlist,
    navigateToMakeOffer,
    openCartModal,
    closeCartModal,
    closeShareModal,
    closeMakeOfferModal,
    handleCheckoutSuccess,
    ITEMS_PER_PAGE,
  } = useCollection(collection);

  return (
    <PageWrapper>
      <BreadCrumbs className="collection-page" items={crumbs} />
      <CollectionHeader
        collection={collection}
        priceData={priceData}
        ownersCount={ownersCount}
        interval={interval}
        onIntervalChange={setInterval}
        onCopySmartContract={copySmartContract}
        actionsProps={{
          isMobile,
          isActionsPopoverOpen,
          isSocialsPopoverOpen,
          isInWatchlist,
          isInFavorites,
          isLiked,
          isDisliked,
          activeFlag,
          socialLinks,
          onActionsToggle: handleActionsClick,
          onActionsClose: closeActionsPopover,
          onSocialsToggle: handleSocialsClick,
          onSocialsClose: closeSocialsPopover,
          onWatchlist: handleWatchlist,
          onFavorites: handleAddToFavorites,
          onLike: handleLike,
          onDislike: handleDislike,
          onFlag: handleFlag,
        }}
      />

      <CollectionFilters
        tabs={collectionTabs}
        filterValue={filterValue}
        currency={currency}
        onFilterChange={setFilterValue}
        onCurrencyChange={setCurrency}
        onMakeOffer={navigateToMakeOffer}
        onFiltersSave={setCollectionFilters}
      />

      <CollectionNftGrid
        items={paginatedNftItems}
        currency={currency}
        onOpenCart={openCartModal}
      />

      {filteredNftItems.length > ITEMS_PER_PAGE ? (
        <Pagination
          page={page}
          total={filteredNftItems.length}
          limit={Math.min(page * ITEMS_PER_PAGE, filteredNftItems.length)}
          totalPage={totalPages}
          onChange={(value) => setPage(value)}
        />
      ) : null}

      <CommentBlock />

      {isShareModal && (
        <ShareModal
          onClose={closeShareModal}
          link="/nfts/minting/share/123"
        />
      )}

      {modal && <MakeOfferModal onClose={closeMakeOfferModal} />}

      {cartModal ? (
        <CartModal
          currency={currency}
          onClose={closeCartModal}
          onCheckoutSuccess={handleCheckoutSuccess}
        />
      ) : null}
    </PageWrapper>
  );
};

export default Collection;
