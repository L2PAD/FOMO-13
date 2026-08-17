import React, { FC, useEffect, useMemo, useState } from "react";
import { useQuery } from "react-query";
import { useTranslation } from "i18n";
import InvestmentPortfolio from "../InvestmentPortfolio";
import PhotoIcon from "../../../../../global/Icons/PhotoIcon";
import { Title } from "../../../Funds/Fund/Overview/styles";
import PieGraphic from "../../../Crypto/Project/Fundraising/pie";
import CategoriesChart from "../../../../../global/common/CategoriesChart";
import { PieValuesPercentage } from "../../../Crypto/Project/Fundraising/styles";
import {
  PieWrapper,
  Table,
  TableHeader,
  TokenDistribution,
} from "../../../Crypto/Project/Unlocks/styles";
import CategoryDistribution from "../CategoryDistribution";
import { IPerson } from "../../../../../../types/global_types";
import {
  PortfolioDistributionSkeletonWrapper,
  PortfolioListSkeleton,
  PortfolioLockedSkeletonWrapper,
  PortfolioPieSkeleton,
  Wrapper,
} from "../../../Funds/Fund/Portfolio/styles";
import Placeholder from "../../../../../global/common/Placeholder";
import EmptySection from "../../../../../global/EmptySection";
import fetchPersonPortfolio from "../../../../../../http/persons/fetchPersonPortfolio";
import type {
  PersonPortfolioAssetItem,
  PersonPortfolioResponse,
} from "../../../../../../http/persons/fetchPersonPortfolio";

const PORTFOLIO_ASSETS_LIMIT = 10;
const PORTFOLIO_EXPOSURE_MAIN_LIMIT = 7;
const skeletonRows = [0, 1, 2, 3, 4];
const HOLDING_COLORS = [
  "#E662BD",
  "#5DBAF7",
  "#F3B23E",
  "#E37137",
  "#E14659",
];

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
          key={`person-portfolio-category-skeleton-${item}`}
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
        key={`person-portfolio-locked-skeleton-${item}`}
        width="100%"
        height="52px"
        borderRadius="8px"
        marginBottom="0"
      />
    ))}
  </PortfolioLockedSkeletonWrapper>
);

interface PortfolioProps {
  person: IPerson;
  personDataToUpdate: IPerson | null;
  isEditState: boolean;
  onChange: (name: string, value: any) => void;
}

const formatShare = (value: number): string => {
  if (!Number.isFinite(value)) return "0%";

  return `${value
    .toFixed(value > 0 && value < 1 ? 2 : 1)
    .replace(/\.0+$/, "")
    .replace(/(\.\d*[1-9])0+$/, "$1")}%`;
};

const sumExposureRows = (items: Array<any>): { amount: number; value: number } =>
  items.reduce(
    (sum, item) => ({
      amount: sum.amount + Number(item.amount || 0),
      value: sum.value + Number(item.value || 0),
    }),
    { amount: 0, value: 0 }
  );

const getPersonIdentifier = (person: IPerson): string => {
  return String(
    person.slug ||
      (person as any).routeId ||
      (person as any).backerId ||
      person.id ||
      Reflect.get(person, "_id") ||
      person.name ||
      ""
  );
};

const Portfolio: FC<PortfolioProps> = ({
  person,
  personDataToUpdate,
  isEditState,
  onChange,
}) => {
  const { translateText } = useTranslation();
  const personIdentifier = getPersonIdentifier(person);
  const [page, setPage] = useState(1);
  const [portfolioAssets, setPortfolioAssets] = useState<PersonPortfolioAssetItem[]>([]);
  const [portfolioSummary, setPortfolioSummary] =
    useState<PersonPortfolioResponse | null>(null);
  const [totalAssets, setTotalAssets] = useState(0);
  const offset = (page - 1) * PORTFOLIO_ASSETS_LIMIT;

  useEffect(() => {
    setPage(1);
    setPortfolioAssets([]);
    setPortfolioSummary(null);
    setTotalAssets(0);
  }, [personIdentifier]);

  const { isFetching, isLoading } = useQuery(
    ["person-portfolio-tab", personIdentifier, page],
    () =>
      fetchPersonPortfolio(personIdentifier, {
        offset,
        limit: PORTFOLIO_ASSETS_LIMIT,
        includeSummary: page === 1,
      }),
    {
      enabled: Boolean(personIdentifier),
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
  const portfolioPerson: IPerson = useMemo(
    () => ({
      ...person,
      investmentPorfolio: portfolioAssets as any,
      roundsByCategory: categoryDistribution,
      categoryDistribution,
      fundraisingRounds: portfolioSummary?.fundraisingRounds || [],
      lockedUnlockedDistribution: portfolioSummary?.lockedUnlockedDistribution || [],
      supportedProjectsCount:
        portfolioSummary?.supportedProjectsCount || person.supportedProjectsCount,
      portfolioCoinsCount:
        portfolioSummary?.portfolioCoinsCount || person.portfolioCoinsCount,
    }),
    [categoryDistribution, person, portfolioAssets, portfolioSummary]
  );
  const categoryProjects = useMemo(
    () =>
      portfolioAssets
        .map((item) => item.asset || item.project || item)
        .filter(Boolean) as any,
    [portfolioAssets]
  );
  const exposureRows = useMemo(() => {
    const total = categoryDistribution.reduce(
      (sum: number, item: any) =>
        sum + Number(item.projectsCount || item.count || 0),
      0
    );

    const rows = categoryDistribution
      .map((item: any) => {
        const knownAssets = Number(item.projectsCount || item.count || 0);
        const share = total > 0 ? (knownAssets / total) * 100 : Number(item.value || 0);

        return {
          ...item,
          name: item.name || item.category || "Other",
          amount: knownAssets,
          value: share,
          allocatedLabel: `${knownAssets} ${translateText("Known Assets").toLowerCase()}`,
          percentageLabel: formatShare(share),
        };
      })
      .filter((item) => item.amount > 0 || item.value > 0)
      .sort((a, b) => b.amount - a.amount || b.value - a.value);

    if (rows.length <= PORTFOLIO_EXPOSURE_MAIN_LIMIT) return rows;

    const mainRows = rows.slice(0, PORTFOLIO_EXPOSURE_MAIN_LIMIT);
    const otherRows = rows.slice(PORTFOLIO_EXPOSURE_MAIN_LIMIT);
    const other = sumExposureRows(otherRows);

    return [
      ...mainRows,
      {
        name: translateText("Other"),
        amount: other.amount,
        value: other.value,
        allocatedLabel: `${other.amount} ${translateText("Known Assets").toLowerCase()}`,
        percentageLabel: formatShare(other.value),
      },
    ];
  }, [categoryDistribution, translateText]);
  const lockedUnlockedItems = portfolioSummary?.lockedUnlockedDistribution || [];
  const isInitialPortfolioLoading =
    (isLoading || isFetching) && !portfolioAssets.length;
  const isSummaryLoading = (isLoading || isFetching) && !portfolioSummary;

  return (
    <Wrapper>
      <Title>{translateText("Investment Portfolio Table")}</Title>
      <InvestmentPortfolio
        itemData={portfolioPerson}
        itemDataToUpdate={personDataToUpdate}
        isEditState={isEditState}
        variant="fundRounds"
        onChange={onChange}
        portfolioItems={portfolioAssets}
        isLoading={isInitialPortfolioLoading}
        currentPage={page}
        pageSize={PORTFOLIO_ASSETS_LIMIT}
        total={totalAssets}
        onPageChange={setPage}
      />
      <Title style={{ marginBottom: "20px", marginTop: "40px" }}>
        <span>{translateText("Investment Category Distribution")}</span>
      </Title>
      {isSummaryLoading ? (
        <PortfolioDistributionSkeleton />
      ) : (
        <CategoryDistribution
          itemData={portfolioPerson}
          itemDataToUpdate={personDataToUpdate}
          isEditState={isEditState}
          onChange={onChange}
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
      <Title style={{ marginBottom: "20px", marginTop: "40px" }}>
        <span>{translateText("Known Portfolio Exposure")}</span>
        <button>
          <PhotoIcon />
        </button>
      </Title>
      {isSummaryLoading ? (
        <PortfolioDistributionSkeleton />
      ) : exposureRows.length ? (
        <TokenDistribution variant="main">
          <PieWrapper>
            <PieGraphic
              innerRadius={80}
              outerRadius={130}
              width={260}
              height={260}
              items={exposureRows}
              customColors={HOLDING_COLORS}
            />
          </PieWrapper>
          <Table>
            <TableHeader>
              <div>{translateText("Category")}</div>
              <div>{translateText("Known Assets")}</div>
              <div>{translateText("Portfolio Share")}</div>
            </TableHeader>
            {exposureRows.map((item: any, index: number) => (
              <PieValuesPercentage
                className="token-distribution"
                key={item.name || index}
                color={HOLDING_COLORS[index % HOLDING_COLORS.length]}
                variant="p"
              >
                <div className="name">
                  <i />
                  {item.name}
                </div>
                <div>{item.amount}</div>
                <div>{formatShare(item.value)}</div>
              </PieValuesPercentage>
            ))}
          </Table>
        </TokenDistribution>
      ) : (
        <>
          <br />
          <EmptySection />
          <br />
        </>
      )}
    </Wrapper>
  );
};

export default Portfolio;
