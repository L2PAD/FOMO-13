import React, { FC, useState } from "react";
import { IProjectWithRefetch } from "../../../../../../contexts/projectDataContext";
import { IFlattenedTicker } from "../../../../../../types/global_types";
import {
  CardWrapper,
  CardsWrapper,
  ExchangeBody,
  ExchangesHeader,
  TableWrapper,
} from "../../../../../global/Tables/ViewTable/ExchangesTable/styles";
import ExchangeTableHeader from "../../../../../global/Tables/ViewTable/ExchangesTable/Header";
import { TableHeaderRightWrapper } from "../../../CryptoMarket/styles";
import { SkeletonCell, SkeletonExchangeCell, Wrapper } from "./styles";
import ExchangeTable from "../../../../../global/Tables/ViewTable/ExchangesTable";
import EmptySection from "../../../../../global/EmptySection";
import getProjectExchangeOverview, {
  ProjectExchangeOverviewReason,
  ProjectExchangeOverviewType,
} from "../../../../../../http/projects/getProjectExchangeOverview";
import { useQuery } from "react-query";
import { useTranslation } from "i18n";
import Pagination from "../../../../../global/Pagintaion";
import { resolveProjectTokenDisplaySymbol } from "../../../../../../helpers/projectTokenSymbol";
import { Activity, CircleDollarSign, Landmark, Layers } from "lucide-react";
import TableTitleInfo from "../TableTitleInfo";

interface IProps {
  project?: IProjectWithRefetch;
}

const filterTabs: Array<{ label: string; value: ProjectExchangeOverviewType }> = [
  { label: "All", value: "all" },
  { label: "Spot", value: "spot" },
  { label: "DEX", value: "dex" },
  { label: "Derivative", value: "derivative" },
];
const PROJECT_ID_FIELD = "_id";

const getEmptyMessage = (reason?: ProjectExchangeOverviewReason): string => {
  if (reason === "missing_coingecko_id") {
    return "Exchange data is not available for this project.";
  }

  if (reason === "not_found") {
    return "Project exchange data was not found.";
  }

  if (reason === "not_synced") {
    return "No exchange markets available.";
  }

  return "Exchange data is not available for this project yet.";
};

const renderFilterIcon = (value: ProjectExchangeOverviewType) => {
  const iconProps = { size: 18, strokeWidth: 1.8 };

  if (value === "all") return <Layers {...iconProps} />;

  if (value === "spot") {
    return <CircleDollarSign {...iconProps} />;
  }

  if (value === "dex") {
    return <Landmark {...iconProps} />;
  }

  return <Activity {...iconProps} />;
};

const ExchangeOverviewSkeleton = () => {
  const rows = Array.from({ length: 10 });

  return (
    <ExchangeBody>
      <TableWrapper>
        <ExchangeTableHeader />
        <CardsWrapper>
          {rows.map((_, index) => (
            <CardWrapper key={index} aria-hidden="true">
              <SkeletonCell width="18px" />
              <SkeletonCell className="sticky" width="76px" />
              <SkeletonCell width="58px" />
              <SkeletonExchangeCell>
                <SkeletonCell round width="28px" />
                <SkeletonCell width={index % 3 === 0 ? "150px" : "112px"} />
              </SkeletonExchangeCell>
              <SkeletonCell width={index % 2 === 0 ? "72px" : "58px"} />
              <SkeletonCell width="42px" />
            </CardWrapper>
          ))}
        </CardsWrapper>
      </TableWrapper>
    </ExchangeBody>
  );
};

const Exchanges: FC<IProps> = ({ project }) => {
  const { translateText } = useTranslation();
  const [filterValue, setFilterValue] = useState<ProjectExchangeOverviewType>("all");
  const [page, setPage] = useState<number>(1);
  const limit = 10;
  const projectAny = project as any;
  const projectId = String(
    projectAny?.canonicalProjectId ||
      projectAny?.marketAssetId ||
      projectAny?.coingeckoId ||
      projectAny?.[PROJECT_ID_FIELD] ||
      "",
  );
  const { data, isLoading } = useQuery(
    ["project-exchange-overview", projectId, filterValue, page],
    () => getProjectExchangeOverview(projectId, filterValue, page, limit),
    {
      enabled: Boolean(projectId),
      refetchOnWindowFocus: false,
    },
  );
  const items: IFlattenedTicker[] = (data?.items || []).map((item) => {
    const [base, quote = ""] = item.pair.split("/");

    return {
      index: item.rank,
      base,
      quote,
      priceUsd: item.priceUsd,
      volume24h: item.volume24hUsd,
      volume24Percent: item.volumePercent,
      link: item.tradeUrl || "",
      verified: item.trustScore === "green",
      marginAvailable: false,
      marginLeverage: null,
      type: item.exchangeType,
      tradingViewBase: null,
      tradingViewQuote: null,
      exchangeId: item.rank,
      exchangeName: item.exchangeName,
      exchangeSlug: item.exchangeName.toLowerCase().replace(/\s+/g, "-"),
      exchangeImage: item.exchangeLogo || "",
      exchangeRankReported: null,
      exchangeRankVerified: null,
    };
  });
  const titleSymbol = data?.symbol || resolveProjectTokenDisplaySymbol(project);
  const total = Number(data?.total || 0);
  const totalPage = Math.ceil(total / limit);
  const pageLimit = Math.min(page * limit, total);

  return (
    <Wrapper>
      <ExchangesHeader>
        <TableTitleInfo
          tooltip={translateText(
            "Markets grouped by exchange type with price, volume, and trading links."
          )}
        >
          <h2>{translateText("Exchange Overview for")} {titleSymbol}</h2>
        </TableTitleInfo>
        <TableHeaderRightWrapper>
          {filterTabs.map((tab) => (
            <button
              key={tab.value}
              className={filterValue === tab.value ? "selectedSort" : ""}
              onClick={() => {
                setFilterValue(tab.value);
                setPage(1);
              }}
              type="button"
            >
              {renderFilterIcon(tab.value)}
              {translateText(tab.label)}
            </button>
          ))}
        </TableHeaderRightWrapper>
      </ExchangesHeader>

      {isLoading ? (
        <ExchangeOverviewSkeleton />
      ) : items.length ? (
        <>
          <ExchangeTable cards={items} />
          {total > limit ? (
            <Pagination
              page={page}
              total={total}
              limit={pageLimit}
              onePageLimit={limit}
              totalPage={totalPage}
              onChange={setPage}
            />
          ) : (
            null
          )}
        </>
      ) : (
        <EmptySection
          className="small-empty-section"
          title={translateText("This section is empty")}
          description={translateText(getEmptyMessage(data?.reason))}
        />
      )}
    </Wrapper>
  );
};

export default Exchanges;
