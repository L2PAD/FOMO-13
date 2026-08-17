import React, { FC, useEffect, useMemo, useState } from "react";
import { Title } from "../Overview/styles";
import {
  PortfolioDistributionSkeletonWrapper,
  PortfolioListSkeleton,
  PortfolioLockedSkeletonWrapper,
  PortfolioPieSkeleton,
  Wrapper,
} from "./styles";
import PhotoIcon from "../../../../../global/Icons/PhotoIcon";
import CategoriesChart from "../../../../../global/common/CategoriesChart";
import InvestmentPortfolio from "../../../Persons/Person/InvestmentPortfolio";
import { useQuery } from "react-query";
import {
  IFund,
  IFundCategoryDistributionItem,
} from "../../../../../../types/global_types";
import CategoryDistribution from "../../../Persons/Person/CategoryDistribution";
import { clarifyAmount } from "../../../../../../helpers/clarifyAmount";
import { useTranslation } from "i18n";
import EmptySection from "../../../../../global/EmptySection";
import fetchFundPortfolio, {
  FundPortfolioAssetItem,
  FundPortfolioResponse,
} from "../../../../../../http/funds/fetchFundPortfolio";
import Placeholder from "../../../../../global/common/Placeholder";

export const dataAllocation = [
  { name: "DeFi", value: 35, allocated: "$1.148B (32.8%)" },
  { name: "Infrastructure", value: 25, allocated: "$948.5M (27.1%)" },
  { name: "AI & Machine Learning", value: 20, allocated: "$647.5M (18.5%)" },
  { name: "Gaming & Metaverse", value: 10, allocated: "$483M (13.8%)" },
  { name: "Others", value: 10, allocated: "$273M (7.8%)" },
];

const PORTFOLIO_ASSETS_LIMIT = 10;
const skeletonRows = [0, 1, 2, 3, 4];

const PortfolioDistributionSkeleton: FC = () => (
  <PortfolioDistributionSkeletonWrapper variant="main">
    <PortfolioPieSkeleton>
      <Placeholder
        width="260px"
        height="260px"
        borderRadius="130px"
        marginBottom="0"
      />
    </PortfolioPieSkeleton>
    <PortfolioListSkeleton>
      {skeletonRows.map((item) => (
        <Placeholder
          key={`portfolio-category-skeleton-${item}`}
          width="100%"
          height="42px"
          borderRadius="8px"
          marginBottom="0"
        />
      ))}
    </PortfolioListSkeleton>
  </PortfolioDistributionSkeletonWrapper>
);

const PortfolioLockedUnlockedSkeleton: FC = () => (
  <PortfolioLockedSkeletonWrapper variant="main">
    <Placeholder width="100%" height="28px" borderRadius="8px" marginBottom="0" />
    {skeletonRows.map((item) => (
      <Placeholder
        key={`portfolio-locked-skeleton-${item}`}
        width="100%"
        height="52px"
        borderRadius="8px"
        marginBottom="0"
      />
    ))}
  </PortfolioLockedSkeletonWrapper>
);

interface PortfolioProps {
  fund: IFund;
  fundDataToUpdate: IFund | null;
  isEditState: boolean;
  inputsHandler: (name: string, value: any) => void;
}

const Portfolio: FC<PortfolioProps> = ({
  fund,
  fundDataToUpdate,
  isEditState,
  inputsHandler,
}) => {
  const { translateText } = useTranslation();
  const { _id: fundObjectId } = fund;
  const fundIdentifier = fund.slug || fundObjectId || fund.id || "";
  const [page, setPage] = useState(1);
  const [portfolioAssets, setPortfolioAssets] = useState<Array<FundPortfolioAssetItem>>([]);
  const [portfolioSummary, setPortfolioSummary] = useState<FundPortfolioResponse | null>(null);
  const [totalAssets, setTotalAssets] = useState(0);
  const offset = (page - 1) * PORTFOLIO_ASSETS_LIMIT;

  useEffect(() => {
    setPage(1);
    setPortfolioAssets([]);
    setPortfolioSummary(null);
    setTotalAssets(0);
  }, [fundIdentifier]);

  const { isFetching, isLoading } = useQuery(
    ["fund-portfolio-tab", fundIdentifier, page],
    () =>
      fetchFundPortfolio(fundIdentifier, {
        offset,
        limit: PORTFOLIO_ASSETS_LIMIT,
        includeSummary: page === 1,
      }),
    {
      enabled: Boolean(fundIdentifier),
      keepPreviousData: true,
      refetchOnWindowFocus: false,
      onSuccess: (data) => {
        if (!data.isSuccess) {
          if (page === 1) {
            setPortfolioAssets([]);
            setPortfolioSummary(null);
            setTotalAssets(0);
          }
          return;
        }

        const nextItems = data.assets.items || [];
        setPortfolioAssets(nextItems);
        setTotalAssets(data.assets.total);

        if (data.summaryIncluded) {
          setPortfolioSummary(data);
        }
      },
    }
  );

  const categoryDistribution = useMemo(
    () => portfolioSummary?.categoryDistribution || [],
    [portfolioSummary]
  );
  const portfolioFund: IFund = useMemo(
    () => ({
      ...fund,
      investmentPorfolio: portfolioAssets as any,
      roundsByCategory: categoryDistribution,
      categoryDistribution,
      fundraisingRounds: portfolioSummary?.fundraisingRounds || [],
      lockedUnlockedDistribution: portfolioSummary?.lockedUnlockedDistribution || [],
      supportedProjectsCount:
        portfolioSummary?.supportedProjectsCount || fund.supportedProjectsCount,
      portfolioCoinsCount:
        portfolioSummary?.portfolioCoinsCount || fund.portfolioCoinsCount,
    }),
    [categoryDistribution, fund, portfolioAssets, portfolioSummary]
  );
  const categoryProjects = useMemo(
    () =>
      portfolioAssets
        .map((item) => item.asset || item.project || item)
        .filter(Boolean) as any,
    [portfolioAssets]
  );
  const totalAllocated: number =
    portfolioSummary?.totalInvested ||
    categoryDistribution.reduce((total: number, current: IFundCategoryDistributionItem) => {
      return total + Number(current.amount || 0);
    }, 0);
  const lockedUnlockedItems = portfolioSummary?.lockedUnlockedDistribution || [];
  const isInitialPortfolioLoading =
    (isLoading || isFetching) && !portfolioAssets.length;
  const isSummaryLoading = (isLoading || isFetching) && !portfolioSummary;

  return (
    <Wrapper>
      <Title>{translateText("Investment Portfolio Table")}</Title>
      <InvestmentPortfolio
        itemData={portfolioFund}
        itemDataToUpdate={fundDataToUpdate}
        isEditState={isEditState}
        variant="fundRounds"
        onChange={inputsHandler}
        portfolioItems={portfolioAssets}
        isLoading={isInitialPortfolioLoading}
        currentPage={page}
        pageSize={PORTFOLIO_ASSETS_LIMIT}
        total={totalAssets}
        onPageChange={setPage}
      />
      <Title style={{ marginBottom: "20px", marginTop: "40px" }}>
        <span>{translateText("Investment Category Distribution")}</span>
        <div
          style={{
            display: "flex",
            gap: "6px",
          }}
        >
          <span
            style={{
              fontSize: "16px",
              fontWeight: "var(--font-weight-regular)",
            }}
          >
            {translateText("Total Invested")}:
          </span>
          {isSummaryLoading ? (
            <Placeholder
              width="96px"
              height="18px"
              borderRadius="8px"
              marginBottom="0"
            />
          ) : (
            <div>{clarifyAmount(totalAllocated)}</div>
          )}
        </div>
      </Title>
      {isSummaryLoading ? (
        <PortfolioDistributionSkeleton />
      ) : (
        <CategoryDistribution
          itemData={portfolioFund}
          itemDataToUpdate={fundDataToUpdate}
          isEditState={isEditState}
          onChange={inputsHandler}
          projects={categoryProjects}
          historyVariant="fundRounds"
        />
      )}
      <Title style={{ marginTop: "20px" }}>
        <span>{translateText("Locked vs. Unlocked Token Distribution")}</span>
        <button>
          <PhotoIcon />
        </button>
      </Title>
      {isSummaryLoading ? (
        <PortfolioLockedUnlockedSkeleton />
      ) : lockedUnlockedItems.length ? (
        <CategoriesChart items={lockedUnlockedItems} allowFallback={false} />
      ) : (
        <>
          <br />
          <EmptySection />
          <br />
        </>
      )}
      {/* <BarMinHeightChart/> */}
    </Wrapper>
  );
};

export default Portfolio;
