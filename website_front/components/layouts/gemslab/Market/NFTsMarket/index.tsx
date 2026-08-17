import React, {
  createContext,
  useDeferredValue,
  useEffect,
  useRef,
  useState,
} from "react";
import { useQuery } from "react-query";
import CommentBlock from "../../../../global/CommentBlock";
import fetchCollections from "../../../../../http/collections/fetchCollections";
import fetchMarketNfts from "../../../../../http/collections/fetchMarketNfts";
import syncMarketNfts from "../../../../../http/collections/syncMarketNfts";
import ListForSale from "../../../projects/modals/ListForSale/ListForSale";
import { EmptyMarket, GridWrapper } from "../styles";
import Pagination from "../../../../global/Pagintaion";
import { CollectionItem } from "./collection-item";
import NftMarketHeader, { MarketSort } from "./MarketHeader";
import EmptyList from "../../../../global/EmptyList";
import CartModal from "../../../../global/modals/CartModal/index";
import Placeholder from "../../../../global/common/Placeholder";
import { PlaceholdersRow } from "../../../projects/Crypto/FomoSpotlight/styles";
import {
  getCollectionMarketFiltersKey,
  ICollectionMarketFilters,
  normalizeCollectionMarketFilters,
} from "../../../../../utils/collectionMarketFilters";
import Orders from "../Orders";

export const CurrencyContext = createContext<{ currency: "ETH" | "USDC" }>({
  currency: "ETH",
});

const MARKET_PAGE_LIMIT = 36;
const MARKET_SYNC_INTERVAL_MS = 5000;

interface IMarketData {
  nfts: Array<any>;
  total: number;
  page: number;
  limit: number;
}

const Market = () => {
  const [currency, setCurrency] = useState<"ETH" | "USDC">("ETH");
  const [filterValue, setFilterValue] = useState<MarketSort>("newest");
  const [searchValue, setSearchValue] = useState("");
  const deferredSearchValue = useDeferredValue(searchValue.trim());
  const [modal, setModal] = useState(false);
  const [cartModal, setCartModal] = useState(false);
  const [isSearch, setIsSearch] = useState(false);
  const [filters, setFilters] = useState<ICollectionMarketFilters | null>(null);
  const [page, setPage] = useState(1);
  const [liveMarketData, setLiveMarketData] = useState<IMarketData | null>(null);
  const isSyncInFlightRef = useRef(false);
  const normalizedFilters = normalizeCollectionMarketFilters(filters);
  const filtersQueryKey = getCollectionMarketFiltersKey(normalizedFilters);

  const { data: marketData, isLoading, refetch: refetchMarketNfts } = useQuery(
    [
      "market-nfts",
      page,
      filterValue,
      currency,
      deferredSearchValue,
      filtersQueryKey,
    ],
    () =>
      fetchMarketNfts({
        page,
        limit: MARKET_PAGE_LIMIT,
        sort: filterValue,
        currency,
        search: deferredSearchValue || undefined,
        filters: normalizedFilters,
      }),
    {
      keepPreviousData: true,
      refetchOnWindowFocus: false,
    }
  );

  const { data: collectionsData } = useQuery(
    "collections-list-for-sale",
    fetchCollections,
    { refetchOnWindowFocus: false }
  );

  useEffect(() => {
    if (!marketData) return;

    setLiveMarketData({
      nfts: marketData?.nfts || [],
      total: Number(marketData?.total || 0),
      page: Number(marketData?.page || 1),
      limit: Number(marketData?.limit || MARKET_PAGE_LIMIT),
    });
  }, [marketData]);

  const nfts = liveMarketData?.nfts || [];
  const total = Number(liveMarketData?.total || 0);
  const totalPage = Math.max(1, Math.ceil(total / MARKET_PAGE_LIMIT));

  useEffect(() => {
    setPage(1);
  }, [filterValue, currency, deferredSearchValue, filtersQueryKey]);

  useEffect(() => {
    if (page > totalPage) {
      setPage(totalPage);
    }
  }, [page, totalPage]);

  useEffect(() => {
    if (!liveMarketData || isLoading) return;

    let isCancelled = false;

    const runSync = async () => {
      if (isSyncInFlightRef.current) return;

      isSyncInFlightRef.current = true;

      try {
        const syncData = await syncMarketNfts({
          page,
          limit: MARKET_PAGE_LIMIT,
          sort: filterValue,
          currency,
          search: deferredSearchValue || undefined,
          filters: normalizedFilters,
          currentTotal: Number(liveMarketData?.total || 0),
          ids: (liveMarketData?.nfts || [])
            .map((item: any) => String(item?._id || ""))
            .filter(Boolean),
        });

        if (isCancelled || !syncData.isSuccess) return;

        if (syncData.mode === "full") {
          setLiveMarketData({
            nfts: syncData.nfts || [],
            total: Number(syncData.total || 0),
            page: Number(syncData.page || page),
            limit: Number(syncData.limit || MARKET_PAGE_LIMIT),
          });
          return;
        }

        const staleIds = new Set([
          ...(syncData.missingIds || []),
          ...(syncData.inactiveIds || []),
        ]);

        if (!staleIds.size) {
          if (Number(syncData.total) !== Number(liveMarketData?.total || 0)) {
            setLiveMarketData((current) => {
              if (!current) return current;

              return {
                ...current,
                total: Number(syncData.total),
              };
            });
          }

          return;
        }

        setLiveMarketData((current) => {
          if (!current) return current;

          const nextNfts = current.nfts.filter(
            (item: any) => !staleIds.has(String(item?._id || ""))
          );
          const removedCount = current.nfts.length - nextNfts.length;
          const nextTotal = Math.max(
            0,
            Number.isFinite(Number(syncData.total))
              ? Number(syncData.total)
              : current.total - removedCount
          );

          return {
            ...current,
            nfts: nextNfts,
            total: nextTotal,
          };
        });
      } finally {
        isSyncInFlightRef.current = false;
      }
    };

    const intervalId = window.setInterval(() => {
      void runSync();
    }, MARKET_SYNC_INTERVAL_MS);

    return () => {
      isCancelled = true;
      window.clearInterval(intervalId);
    };
  }, [
    currency,
    deferredSearchValue,
    filterValue,
    filtersQueryKey,
    isLoading,
    liveMarketData,
    page,
  ]);

  return (
    <CurrencyContext.Provider value={{ currency }}>
      <NftMarketHeader
        currency={currency}
        setCurrency={setCurrency}
        searchValue={searchValue}
        setSearchValue={setSearchValue}
        isSearch={isSearch}
        setIsSearch={setIsSearch}
        filterValue={filterValue}
        setFilterValue={setFilterValue}
        setFilters={setFilters}
        onOpenListForSale={() => setModal(true)}
        onOpenCart={() => setCartModal(true)}
      />
      {
        isLoading
          ?
          <PlaceholdersRow style={{ marginBottom: 120 }}>
            <Placeholder height="380px" />
            <Placeholder height="380px" />
            <Placeholder height="380px" />
            <Placeholder height="380px" />
          </PlaceholdersRow>
          :
          <GridWrapper>

            {!isLoading && nfts.length === 0 && (
              <EmptyMarket>
                <EmptyList imgWidth={200} gap={20} fontSize={18} />
              </EmptyMarket>
            )}
            {!isLoading &&
              nfts.map((item: any) => (
                <CollectionItem
                  key={item._id}
                  item={item}
                  currency={currency}
                  onOpenCart={() => setCartModal(true)}
                />
              ))}
          </GridWrapper>
      }


      {total > MARKET_PAGE_LIMIT ? (
        <Pagination
          page={page}
          total={total}
          limit={MARKET_PAGE_LIMIT}
          totalPage={totalPage}
          onChange={(value) => setPage(value)}
        />
      ) : null}
      <Orders />
      <CommentBlock />
      {modal && (
        <ListForSale
          collections={collectionsData?.collections || []}
          onClose={() => setModal(false)}
          onSuccess={() => refetchMarketNfts()}
        />
      )}
      {cartModal ? (
        <CartModal
          currency={currency}
          onClose={() => setCartModal(false)}
          onCheckoutSuccess={async () => {
            await refetchMarketNfts();
          }}
        />
      ) : null}
    </CurrencyContext.Provider>
  );
};

export default Market;
