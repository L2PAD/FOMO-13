import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { useRouter } from "next/router";
import { useQuery, useQueryClient } from "react-query";
import { toast } from "react-toastify";
import {
  deletePortfolio,
  duplicatePortfolio,
  fetchPortfolioMovers,
  getPortfolioDetails,
  getPortfolioSummaries,
  toggleBattlePortfolio,
} from "../../../../http/portfolio";
import { IPortfolio, IPortfolioSummary } from "../../../../types/global_types";
import { PageWrapper } from "../../projects/CryptoMarket/styles";
import { PORTFOLIO_DETAIL_REFETCH_INTERVAL_MS } from "./constants";
import PortfolioContent from "./components/PortfolioContent";
import PortfolioModals from "./components/PortfolioModals";
import PortfolioPageIntro from "./components/PortfolioPageIntro";
import PortfolioSelectedHeader from "./components/PortfolioSelectedHeader";
import { getQueryValue } from "./helpers/portfolio";
import { PortfolioSelection } from "./types";
import CorePortfolioPageSkeleton from "./CorePortfolioPageSkeleton";

const Portfolio = () => {
  const [isActionsModal, setIsActionsModal] = useState(false);
  const [searchValue, setSearchValue] = useState("");
  const [isNewPortfolioModal, setIsNewPortfolioModal] =
    useState<boolean>(false);
  const [isEditPortfolioModal, setIsEditPortfolioModal] =
    useState<boolean>(false);
  const [isDeletePortfolioModal, setIsDeletePortfolioModal] =
    useState<boolean>(false);
  const [isSharePortfolioModal, setIsSharePortfolioModal] =
    useState<boolean>(false);
  const [isPortfolioBattleModal, setIsPortfolioBattleModal] =
    useState<boolean>(false);
  const [isPortfolioDropdownOpen, setIsPortfolioDropdownOpen] = useState(false);
  const [activePortfolioId, setActivePortfolioId] = useState("");
  const portfolioDropdownRef = useRef<HTMLDivElement>(null);
  const router = useRouter();
  const queryPortfolioId = getQueryValue(router.query.portfolioId);
  const queryPortfolio = getQueryValue(router.query.portfolio);
  const queryTab = getQueryValue(router.query.tab);
  const queryClient = useQueryClient();
  const requestedPortfolioId = router.isReady
    ? queryPortfolioId || queryPortfolio || queryTab
    : "";
  const selectPortfolio = useCallback(
    (portfolioId: string) => {
      setActivePortfolioId(portfolioId);

      if (!router.isReady) return;

      const nextQuery = { ...router.query };
      delete nextQuery.portfolio;
      delete nextQuery.tab;

      if (portfolioId) {
        nextQuery.portfolioId = portfolioId;
      } else {
        delete nextQuery.portfolioId;
      }

      void router.replace(
        { pathname: router.pathname, query: nextQuery },
        undefined,
        { shallow: true }
      );
    },
    [router]
  );
  const {
    data: portfolioItems = [],
    isLoading: isListLoading,
    isError: isListError,
    refetch: refetchPortfolioList,
  } = useQuery<IPortfolioSummary[]>(["portfolio-list"], getPortfolioSummaries, {
    refetchOnWindowFocus: false,
    staleTime: 1000 * 60,
  });
  const {
    data: selectedPortfolio,
    isLoading: isDetailLoading,
    isError: isDetailError,
    refetch: refetchPortfolioDetail,
  } = useQuery<IPortfolio | null>(
    ["portfolio-detail", activePortfolioId],
    () => getPortfolioDetails(activePortfolioId),
    {
      enabled: !!activePortfolioId,
      refetchOnWindowFocus: false,
      refetchInterval: activePortfolioId
        ? PORTFOLIO_DETAIL_REFETCH_INTERVAL_MS
        : false,
    }
  );
  useEffect(() => {
    if (isListLoading) return;

    if (!portfolioItems.length) {
      setActivePortfolioId("");
      return;
    }

    setActivePortfolioId((currentId) => {
      if (
        requestedPortfolioId &&
        portfolioItems.some((item) => item._id === requestedPortfolioId)
      ) {
        return requestedPortfolioId;
      }

      if (currentId && portfolioItems.some((item) => item._id === currentId)) {
        return currentId;
      }

      return portfolioItems[0]._id;
    });
  }, [isListLoading, portfolioItems, requestedPortfolioId]);

  const refetchActivePortfolio = useCallback(async () => {
    if (activePortfolioId) {
      await Promise.all([
        queryClient.invalidateQueries(["portfolio-chart", activePortfolioId]),
        queryClient.invalidateQueries(["core-portfolio-chart", activePortfolioId]),
        queryClient.invalidateQueries(["portfolio-assets", activePortfolioId]),
        queryClient.invalidateQueries(["portfolio-movers", activePortfolioId]),
        queryClient.invalidateQueries([
          "portfolio-transactions",
          activePortfolioId,
        ]),
      ]);
    }

    await Promise.all([refetchPortfolioDetail(), refetchPortfolioList()]);
  }, [
    activePortfolioId,
    queryClient,
    refetchPortfolioDetail,
    refetchPortfolioList,
  ]);

  const confirmDelete = async (): Promise<void> => {
    const portfolio = portfolioItems.find(
      (item) => item._id === activePortfolioId
    );

    if (!portfolio) return;

    const currentIndex = portfolioItems.findIndex(
      (item) => item._id === portfolio._id
    );
    const nextPortfolio = portfolioItems.filter(
      (item) => item._id !== portfolio._id
    )[Math.min(currentIndex, portfolioItems.length - 2)];
    const isSuccess = await deletePortfolio(portfolio._id);

    if (!isSuccess) {
      toast.error(
        <div>
          <h3>Delete Failed</h3>
          <p>We couldn't delete this portfolio. Please try again.</p>
        </div>
      );
      return;
    }

    setIsDeletePortfolioModal(false);
    toast.success(
      <div>
        <h3>Portfolio Deleted</h3>
        <p>Your portfolio has been permanently removed.</p>
      </div>
    );
    queryClient.removeQueries(["portfolio-detail", portfolio._id]);
    await refetchPortfolioList();
    selectPortfolio(nextPortfolio?._id || "");
  };

  const confirmBattle = async (
    portfolio: PortfolioSelection
  ): Promise<void> => {
    setIsPortfolioBattleModal(false);

    await toggleBattlePortfolio(portfolio._id, !portfolio.isBattle);

    if (portfolio.isBattle) {
      toast.success(
        <div>
          <h3>Removed from Battle</h3>
          <p>
            Your portfolio has been successfully removed from the Battle Board.
            You can rejoin anytime.
          </p>
        </div>
      );
    } else {
      toast.success(
        <div>
          <h3>Portfolio Added to Battle!</h3>
          <p>
            Your portfolio is now visible on the public Battle Board and will be
            included in the next ranking update.
          </p>
        </div>
      );
    }

    await refetchActivePortfolio();
  };

  const confirmDuplicate = async (
    portfolio: PortfolioSelection
  ): Promise<void> => {
    try {
      setIsActionsModal(false);

      const { isSuccess, portfolio: duplicated } = await duplicatePortfolio(
        portfolio._id
      );

      if (isSuccess && duplicated) {
        toast.success(
          <div>
            <h3>Portfolio Duplicated</h3>
            <p>
              A new copy of <b>{portfolio.name}</b> has been created. You can
              now rename or edit it as needed.
            </p>
          </div>
        );
      } else {
        toast.error(
          <div>
            <h3>Duplication Failed</h3>
            <p>We couldn't duplicate your portfolio. Please try again.</p>
          </div>
        );
      }

      await refetchPortfolioList();
      if (isSuccess && duplicated) {
        selectPortfolio(duplicated._id);
      }
    } catch (error) {
      toast.error(
        <div>
          <h3>Unexpected Error</h3>
          <p>Please try again later.</p>
        </div>
      );
    }
  };

  useEffect(() => {
    const handleClickOutside = (event: PointerEvent) => {
      if (!portfolioDropdownRef.current) return;

      if (!portfolioDropdownRef.current.contains(event.target as Node)) {
        setIsPortfolioDropdownOpen(false);
      }
    };

    document.addEventListener("pointerdown", handleClickOutside);

    return () => {
      document.removeEventListener("pointerdown", handleClickOutside);
    };
  }, []);

  const isEmpty = !portfolioItems.length;

  const selectedPortfolioSummary: IPortfolioSummary | undefined =
    useMemo(() => {
      if (!Array.isArray(portfolioItems)) return;

      return portfolioItems.find((item) => item._id === activePortfolioId);
    }, [activePortfolioId, portfolioItems]);

  const selectedPortfolioForHeader: PortfolioSelection | undefined =
    selectedPortfolio || selectedPortfolioSummary;
  const selectedPortfolioHasAssets = Boolean(
    selectedPortfolio?.isAssets ?? selectedPortfolioSummary?.isAssets
  );

  const { data: moversData, isLoading: isMoversLoading } = useQuery(
    [
      "portfolio-movers",
      activePortfolioId,
      selectedPortfolio?.totalBalance,
      selectedPortfolio?.profit,
    ],
    () => fetchPortfolioMovers(activePortfolioId),
    {
      enabled: !!activePortfolioId && selectedPortfolioHasAssets,
      refetchOnWindowFocus: false,
    }
  );

  const shouldShowPortfolioPageSkeleton =
    !isListError &&
    (isListLoading ||
      (Boolean(requestedPortfolioId) &&
        !activePortfolioId &&
        portfolioItems.length > 0) ||
      (!!activePortfolioId && isDetailLoading));

  if (shouldShowPortfolioPageSkeleton) {
    return <CorePortfolioPageSkeleton />;
  }

  return (
    <PageWrapper>
      <PortfolioPageIntro
        searchValue={searchValue}
        onSearchChange={setSearchValue}
        portfolioDropdownRef={portfolioDropdownRef}
        isPortfolioDropdownOpen={isPortfolioDropdownOpen}
        portfolioItems={portfolioItems}
        activePortfolioId={activePortfolioId}
        onTogglePortfolioDropdown={() =>
          setIsPortfolioDropdownOpen((isOpen) => !isOpen)
        }
        onSelectPortfolio={(portfolioId) => {
          selectPortfolio(portfolioId);
          setIsPortfolioDropdownOpen(false);
        }}
        onOpenCreatePortfolio={() => setIsNewPortfolioModal(true)}
      />
      {!isListLoading &&
        !isListError &&
        !isEmpty &&
        selectedPortfolioForHeader ? (
        <PortfolioSelectedHeader
          portfolio={selectedPortfolioForHeader}
          canShare={Boolean(selectedPortfolio)}
          isActionsModal={isActionsModal}
          onToggleActionsModal={() => setIsActionsModal((prev) => !prev)}
          onCloseActionsModal={() => setIsActionsModal(false)}
          onOpenBattle={() => setIsPortfolioBattleModal(true)}
          onOpenShare={() => setIsSharePortfolioModal(true)}
          onOpenEdit={() => setIsEditPortfolioModal(true)}
          onDuplicate={confirmDuplicate}
          onOpenDelete={() => setIsDeletePortfolioModal(true)}
        />
      ) : null}
      <PortfolioContent
        isListLoading={isListLoading}
        isListError={isListError}
        isDetailLoading={isDetailLoading}
        isDetailError={isDetailError}
        activePortfolioId={activePortfolioId}
        selectedPortfolio={selectedPortfolio}
        selectedPortfolioHasAssets={selectedPortfolioHasAssets}
        refetchPortfolioList={refetchPortfolioList}
        refetchPortfolioDetail={refetchPortfolioDetail}
        refetchActivePortfolio={refetchActivePortfolio}
        moversData={moversData}
        isMoversLoading={isMoversLoading}
      />
      <PortfolioModals
        isNewPortfolioModal={isNewPortfolioModal}
        onCloseNewPortfolio={() => setIsNewPortfolioModal(false)}
        refetchPortfolioList={refetchPortfolioList}
        onPortfolioCreated={(portfolio) => selectPortfolio(portfolio._id)}
        selectedPortfolio={selectedPortfolio}
        isEditPortfolioModal={isEditPortfolioModal}
        onCloseEditPortfolio={async () => {
          setIsEditPortfolioModal(false);
        }}
        refetchActivePortfolio={refetchActivePortfolio}
        isDeletePortfolioModal={isDeletePortfolioModal}
        onCloseDeletePortfolio={() => setIsDeletePortfolioModal(false)}
        onConfirmDelete={confirmDelete}
        selectedPortfolioSummary={selectedPortfolioSummary}
        isPortfolioBattleModal={isPortfolioBattleModal}
        onClosePortfolioBattle={() => setIsPortfolioBattleModal(false)}
        onConfirmBattle={confirmBattle}
        hasOtherBattlePortfolio={
          !!portfolioItems.find(
            (item) => item.isBattle && item._id !== activePortfolioId
          )
        }
        isSharePortfolioModal={isSharePortfolioModal}
        onCloseSharePortfolio={() => setIsSharePortfolioModal(false)}
      />
    </PageWrapper>
  );
};

export default Portfolio;
