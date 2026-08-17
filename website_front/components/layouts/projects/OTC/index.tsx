import React, { useContext } from "react";
import useComments from "../../../../hooks/useComments";
import { AuthContext } from "../../../global/Layout";
import CommentBlock from "../../../global/CommentBlock";
import AuthModal from "../../../global/modals/AuthModal";
import { useOtcState } from "../../../../hooks/useOtc";
import { PageContent, PageWrapper, TabsContentWrapper } from "./styles";
import { MarketFiltersProps } from "./types";
import { paymentMethodOptions } from "./constants";
import DealsTabsContent from "./components/DealsTabsContent";
import MobileMarketHeader from "./components/MobileMarketHeader";
import DesktopMarketHeader from "./components/DesktopMarketHeader";
import { useTranslation } from "i18n";

export { paymentMethodOptions };

const Bazaar = () => {
  const { t } = useTranslation();
  const { comments, confirmAddComment, refetch } = useComments(
    "comments/utility",
    "comments/utility"
  );
  const { userData } = useContext(AuthContext);
  const {
    filterValue,
    activeTab,
    limit,
    pageVariant,
    modal,
    filters,
    searchValue,
    availableFilterTabs,
    p2pFilterTabs,
    sortBy,
    sortByP2P,
    setSortBy,
    setSortByP2P,
    setFilterValue,
    setLimit,
    handleUpdatePageVariant,
    setModal,
    setSearchValue,
    setFilters,
    updateActiveTab,
  } = useOtcState();
  const sortKey: "deals" | "members" =
    activeTab === "Top members" ? "members" : "deals";
  const [selectedPaymentMethod, setSelectedPaymentMethod] = React.useState<
    string[]
  >([]);
  const [selectedCurrency, setSelectedCurrency] = React.useState("UAH");
  const [transactionAmount, setTransactionAmount] = React.useState("");
  const [isDescriptionsVisible, setIsDescriptionsVisible] =
    React.useState<boolean>(false);
  const [isBuyVisible, setIsBuyVisible] = React.useState<boolean>(false);
  const [isSellVisible, setIsSellVisible] = React.useState<boolean>(false);
  const [isSearch, setIsSearch] = React.useState<boolean>(false);
  const [isMobileAdOpen, setIsMobileAdOpen] = React.useState<boolean>(false);
  const [isDesktopAdOpen, setIsDesktopAdOpen] = React.useState<boolean>(true);
  const [isMobileDescriptionExpanded, setIsMobileDescriptionExpanded] =
    React.useState<boolean>(false);
  const mobileSearchInputRef = React.useRef<HTMLInputElement>(null);

  React.useEffect(() => {
    if (isMobileAdOpen) {
      mobileSearchInputRef.current?.blur();
    }
  }, [isMobileAdOpen]);

  const handleExpandMobileSearch = () => {
    if (isMobileAdOpen) {
      setIsMobileAdOpen(false);
    }

    requestAnimationFrame(() => mobileSearchInputRef.current?.focus());
  };

  const handleMobileSearchBlur = () => {
    if (!searchValue.trim().length) {
      setIsSearch(false);
    }
  };

  const mobileDescription =
    pageVariant === "p2p"
      ? t("bazaar.p2pDescription")
      : t("bazaar.otcDescription");

  const marketFiltersProps: MarketFiltersProps = {
    isSearch,
    setIsSearch,
    searchValue,
    setSearchValue,
    pageVariant,
    activeTab,
    filterValue,
    setFilterValue,
    availableFilterTabs,
    p2pFilterTabs,
    sortBy,
    setSortBy,
    sortByP2P,
    setSortByP2P,
    sortKey,
    filters,
    setFilters,
    setModal,
    selectedPaymentMethod,
    setSelectedPaymentMethod,
    selectedCurrency,
    setSelectedCurrency,
    transactionAmount,
    setTransactionAmount,
  };

  return (
    <>
      {!userData?.isFullAuth ? (
        <AuthModal onClose={() => history.back()} />
      ) : (
        <PageWrapper>
          <PageContent>
            <MobileMarketHeader
              pageVariant={pageVariant}
              activeTab={activeTab}
              updateActiveTab={updateActiveTab}
              handleUpdatePageVariant={handleUpdatePageVariant}
              searchValue={searchValue}
              setSearchValue={setSearchValue}
              isSearch={isSearch}
              setIsSearch={setIsSearch}
              isMobileAdOpen={isMobileAdOpen}
              setIsMobileAdOpen={setIsMobileAdOpen}
              isMobileDescriptionExpanded={isMobileDescriptionExpanded}
              setIsMobileDescriptionExpanded={setIsMobileDescriptionExpanded}
              mobileDescription={mobileDescription}
              mobileSearchInputRef={mobileSearchInputRef}
              handleExpandMobileSearch={handleExpandMobileSearch}
              handleMobileSearchBlur={handleMobileSearchBlur}
              marketFiltersProps={marketFiltersProps}
            />
            <DesktopMarketHeader
              pageVariant={pageVariant}
              activeTab={activeTab}
              updateActiveTab={updateActiveTab}
              handleUpdatePageVariant={handleUpdatePageVariant}
              isSearch={isSearch}
              setIsSearch={setIsSearch}
              isDesktopAdOpen={isDesktopAdOpen}
              isDescriptionsVisible={isDescriptionsVisible}
              setIsDescriptionsVisible={setIsDescriptionsVisible}
              isBuyVisible={isBuyVisible}
              setIsBuyVisible={setIsBuyVisible}
              isSellVisible={isSellVisible}
              setIsSellVisible={setIsSellVisible}
              setIsDesktopAdOpen={setIsDesktopAdOpen}
              marketFiltersProps={marketFiltersProps}
            />
            <TabsContentWrapper>
              <DealsTabsContent
                activeTab={activeTab}
                transactionAmount={transactionAmount}
                p2pFilterTabs={p2pFilterTabs}
                filterValue={filterValue}
                selectedCurrency={selectedCurrency}
                selectedPaymentMethod={selectedPaymentMethod}
                sortByP2P={sortByP2P}
                searchValue={searchValue}
                pageVariant={pageVariant}
                sortByDeals={sortBy.deals}
                filters={filters}
                modal={modal}
                setModal={setModal}
                limit={limit}
                setLimit={setLimit}
              />
            </TabsContentWrapper>
          </PageContent>

          <CommentBlock
            items={comments}
            addComment={confirmAddComment}
            refetch={refetch}
          />
        </PageWrapper>
      )}
    </>
  );
};

export default Bazaar;
