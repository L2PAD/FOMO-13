/* eslint-disable */
import React, { useState, useMemo, useEffect } from "react";
import useComments from "../../../../hooks/useComments";
import { useRouter } from "next/router";
import { useQuery } from "react-query";
import FilterSortHeader from "../../../global/FilterSortHeader";
import ViewTable from "../../../global/Tables/ViewTable";
import Pagination from "../../../global/Pagintaion";
import fetchPersons from "../../../../http/persons/fetchPersons";
import Typography from "../../../global/common/Typography";
import { Investor, IPerson, IProject } from "../../../../types/global_types";
import { Subtitle } from "../FomoChat/styles";
import TrendingIcon from "../../../../assets/icons/trend-sort.svg";
import NewIcon from "../../../../assets/icons/new-sort.svg";
import AllIcon from "../../../../assets/icons/all-sort.svg";
import SortCashIcon from "../../../../assets/icons/sort-cash.svg";
import SmartIcon from "../../../../assets/icons/smart-sort.svg";
import SmileIcon from "../../../../assets/icons/smile-sort.svg";
import RegionIcon from "../../../../assets/icons/region.svg";
import useSort from "../../../../hooks/useSort";
import PlaceholderGrid from "../../../global/common/PlaceholderGrid";
import UniversalBarChart from "../../../global/common/BarChart";
import CommentBlock from "../../../global/CommentBlock";
import {
  MainInfo,
  MainInfoDescription,
  PageWrapper,
  SearchContainer,
  TableHeaderLeftWrapper,
  TableHeaderRightWrapper,
  TableHeaderWrapper,
} from "../CryptoMarket/styles";
import { SearchInput } from "../P2PExchange/styles";
import Image from "next/image";
import { ProjectsWrapper } from "../Crypto/styles";
import UniversalTable from "../../../global/common/UniversalTable";
import {
  personsGridColumns,
  personsSortHeader,
  projectsIcoGridColumns,
  projectsIcoSortHeader,
} from "../../../../staticContent/tables";
import { PieWrapper } from "../Crypto/Project/Fundraising/styles";
import RegionalPieGraphic from "../Crypto/Project/Fundraising/RegionalPie";
import BannerList from "../../../global/BannerList";
import FomoSpotlight from "./FomoSpotlight";
import UniversalFilter from "../../../global/UniversalFilter";
import { personsFilter } from "../../../../staticContent/projects/crypto_market";
import { SearchIconStyle, SearchWrapper } from "../Networks/styles";
import {
  CardLinkWrapper,
  CardsWrapper,
  CardWrapper,
  ChartsWrapper,
  PieContentWrapper,
  TableGridBtn,
} from "./styles";
import fetchPersonsByQuery from "../../../../http/persons/fetchPersonsByQuery";
import { getBackerHref, getBackerRouteId } from "../../../../helpers/backerRoute";

const dataAllocation = [
  { name: "UKR", value: 10 },
  { name: "USA", value: 40 },
  { name: "CAN", value: 5 },
  { name: "BRA", value: 15 },
  { name: "POL", value: 10 },
  { name: "DEU", value: 20 },
];

const limit: number = 12;
const tableLimit: number = 100;

export const buildQueryString = (
  currentLimit: number,
  page: number,
  sortValue: { name: string; value: any } | undefined,
  searchValue: string
): string => {
  const params: any = {
    limit: currentLimit,
    offset: (page - 1) * currentLimit,
  };

  if (searchValue) {
    params.searchValue = searchValue;
  }

  if (sortValue?.name) {
    params.sortKey = sortValue.name;
    params.sortNumberValue = sortValue.value;
  }

  const queryString = new URLSearchParams(params).toString();
  return `?${queryString}`;
};

export const buildFilterSummary = (filters: any | undefined): string => {
  if (!filters) return "";

  const queryParts: string[] = [];

  for (const key in filters) {
    const value = filters[key];

    if (!Array.isArray(value)) continue;

    if (typeof value[0] === "number") {
      const range = value as number[];
      if (range.length === 2 && range[1] !== 0) {
        queryParts.push(
          `${key.replace("_checkboxes", "")}=${range[0]}-${range[1]}`
        );
      }
      continue;
    }

    if (typeof value[0] === "object") {
      const activeItems = value
        .filter((item: any) => item.isActive)
        .map((item: any) => item.key);

      if (activeItems.length) {
        queryParts.push(`${key}=${activeItems.join(",")}`);
      }
    }
  }

  return queryParts.length ? `&${queryParts.join("&")}` : "";
};

const Persons = () => {
  const [isFavourite, setIsFavourite] = useState(false);
  const [filterValue, setFilterValue] = useState("");
  const [filterData, setFilterData] = useState<any | null>(null);
  const { comments, confirmAddComment, refetch } = useComments(
    "comments/crypto",
    "comments/crypto"
  );
  const [queryString, setQueryString] = useState<string>("");
  const { data, isLoading } = useQuery(["persons", queryString], () =>
    fetchPersonsByQuery(queryString)
  );
  const [grid, setGrid] = useState(true);
  const [page, setPage] = useState(1);
  const router = useRouter();
  const [searchValue, setSearchValue] = useState("");
  const [sortValue, setSortValue] = useState<{ name: string; value: 1 | -1 }>();
  const currentLimit: number = grid ? limit : tableLimit;
  const [isDescriptionExpanded, setIsDescriptionExpanded] =
    useState<boolean>(false);
  const updateSortValue = (name: string, value: 1 | -1): void => {
    setSortValue((prev: any) => {
      if (prev?.name === name) return { name, value };

      return { name, value: -1 };
    });
  };

  useEffect(() => {
    const timer = setTimeout(() => {
      setQueryString(
        `${buildQueryString(
          grid ? limit : tableLimit,
          page,
          sortValue,
          searchValue
        )}${buildFilterSummary(filterData)}`
      );
    }, 600);

    return () => clearTimeout(timer);
  }, [filterData, page, grid]);

  return (
    <PageWrapper>
      <MainInfo>
        <MainInfoDescription>
          <Typography className="main-title" variant="h1">
            Persons
          </Typography>
          <br />
          <div className="description-container">
            <p className={isDescriptionExpanded ? "expanded" : "collapsed"}>
              Discover key individuals in the crypto space, including their
              projects, connections, and performance. Explore professional
              networks, project involvement, and more. Be aware of who you are
              dealing with
            </p>
            <button
              className="toggle-description-btn"
              onClick={() => setIsDescriptionExpanded(!isDescriptionExpanded)}
            >
              {" "}
              {isDescriptionExpanded ? "See Less" : "See more"}
            </button>
          </div>
          <br />
          <SearchContainer>
            <SearchWrapper>
              <SearchInput
                value={searchValue}
                onChange={(value) => setSearchValue(value)}
                placeholder="Search person"
                type="text"
                leftIcon={<SearchIconStyle />}
              />
            </SearchWrapper>
          </SearchContainer>
        </MainInfoDescription>
        <FomoSpotlight />
      </MainInfo>
      <h2 style={{ margin: "40px 0px 20px", fontWeight: "var(--font-weight-semibold)" }}>Analytics</h2>
      <ChartsWrapper>
        <UniversalBarChart
          title="Industry Specializations"
          labels={["50%", "40%", "30%", "20%", "10%", "0%"]}
        />

        <PieContentWrapper variant={"main"}>
          <h3>Regional Distribution</h3>
          <PieWrapper>
            <RegionalPieGraphic
              innerRadius={80}
              outerRadius={150}
              width={300}
              height={300}
              items={dataAllocation}
            />
          </PieWrapper>
        </PieContentWrapper>
      </ChartsWrapper>
      <br />
      <br />
      <TableHeaderWrapper id="scroll-header">
        <TableHeaderRightWrapper>
          <button
            className={filterValue === "all" ? "selectedSort" : ""}
            onClick={() => setFilterValue("all")}
          >
            <Image src={AllIcon} alt="all" />
            All
          </button>
          <button
            className={filterValue === "fav" ? "selectedSort" : ""}
            onClick={() => setFilterValue("fav")}
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="18"
              height="18"
              viewBox="0 0 18 18"
              fill="none"
            >
              <path
                d="M8.57924 1.26159C8.75138 0.912803 9.24874 0.912803 9.42088 1.26159L11.6492 5.77669C11.7176 5.9152 11.8497 6.0112 12.0026 6.03341L16.9853 6.75744C17.3702 6.81337 17.5239 7.28639 17.2453 7.55788L13.6398 11.0724C13.5292 11.1802 13.4787 11.3355 13.5049 11.4878L14.356 16.4504C14.4218 16.8337 14.0194 17.126 13.6751 16.9451L9.21843 14.602C9.08172 14.5302 8.9184 14.5302 8.78169 14.602L4.32501 16.9451C3.98074 17.126 3.57837 16.8337 3.64412 16.4504L4.49526 11.4878C4.52137 11.3355 4.4709 11.1802 4.3603 11.0724L0.754778 7.55788C0.476254 7.28639 0.629947 6.81337 1.01486 6.75744L5.99757 6.03341C6.15042 6.0112 6.28255 5.9152 6.35091 5.77669L8.57924 1.26159Z"
                stroke="#738094"
                stroke-linejoin="round"
              />
            </svg>
          </button>
          <button
            className={filterValue === "AI" ? "selectedSort" : ""}
            onClick={() => setFilterValue("AI")}
          >
            AI
          </button>
          <button
            className={filterValue === "DeFi" ? "selectedSort" : ""}
            onClick={() => setFilterValue("DeFi")}
          >
            DeFi
          </button>
          <button
            className={filterValue === "NFT" ? "selectedSort" : ""}
            onClick={() => setFilterValue("NFT")}
          >
            NFT
          </button>
          <button
            className={filterValue === "Blockchain" ? "selectedSort" : ""}
            onClick={() => setFilterValue("Blockchain")}
          >
            Blockchain
          </button>
          <button
            className={filterValue === "Gaming" ? "selectedSort" : ""}
            onClick={() => setFilterValue("Gaming")}
          >
            Gaming
          </button>
          <button
            className={filterValue === "P2E" ? "selectedSort" : ""}
            onClick={() => setFilterValue("P2E")}
          >
            P2E
          </button>
          <button
            className={filterValue === "Metaverse" ? "selectedSort" : ""}
            onClick={() => setFilterValue("Metaverse")}
          >
            Metaverse
          </button>
          <button
            className={filterValue === "roi" ? "selectedSort" : ""}
            onClick={() => setFilterValue("roi")}
          >
            <Image src={SortCashIcon} alt="roi" />
            ROI
          </button>
          <button
            className={filterValue === "activity" ? "selectedSort" : ""}
            onClick={() => setFilterValue("activity")}
          >
            <Image src={SmileIcon} alt="region" />
            Activity
          </button>
          <button
            className={filterValue === "region" ? "selectedSort" : ""}
            onClick={() => setFilterValue("region")}
          >
            <Image src={RegionIcon} alt="roi" />
            Region
          </button>
        </TableHeaderRightWrapper>
        <TableHeaderLeftWrapper>
          <TableGridBtn onClick={() => setGrid(true)} isActive={grid}>
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="20"
              height="20"
              viewBox="0 0 20 20"
              fill="none"
            >
              <path
                d="M15.8333 2.5C16.7538 2.5 17.5 3.23597 17.5 4.14383L17.5 6.94994C17.5 7.8578 16.7538 8.59377 15.8333 8.59377H13.3333C12.4129 8.59377 11.6667 7.8578 11.6667 6.94994L11.6667 4.14383C11.6667 3.23597 12.4129 2.5 13.3333 2.5L15.8333 2.5Z"
                stroke="#04A584"
                stroke-linecap="round"
                stroke-linejoin="round"
              />
              <path
                d="M4.16667 2.5C3.24619 2.5 2.5 3.23597 2.5 4.14383L2.50001 6.94994C2.50001 7.8578 3.2462 8.59377 4.16667 8.59377H6.66667C7.58715 8.59377 8.33334 7.8578 8.33334 6.94994L8.33333 4.14383C8.33333 3.23597 7.58714 2.5 6.66667 2.5L4.16667 2.5Z"
                stroke="#04A584"
                stroke-linecap="round"
                stroke-linejoin="round"
              />
              <path
                d="M15.8333 11.4063C16.7538 11.4063 17.5 12.1422 17.5 13.0501V15.8562C17.5 16.764 16.7538 17.5 15.8333 17.5H13.3333C12.4129 17.5 11.6667 16.764 11.6667 15.8562L11.6667 13.0501C11.6667 12.1422 12.4129 11.4063 13.3333 11.4063H15.8333Z"
                stroke="#04A584"
                stroke-linecap="round"
                stroke-linejoin="round"
              />
              <path
                d="M4.16667 11.4063C3.2462 11.4063 2.50001 12.1422 2.50001 13.0501L2.50001 15.8562C2.50001 16.764 3.2462 17.5 4.16668 17.5H6.66667C7.58715 17.5 8.33334 16.764 8.33334 15.8562L8.33334 13.0501C8.33334 12.1422 7.58715 11.4063 6.66667 11.4063H4.16667Z"
                stroke="#04A584"
                stroke-linecap="round"
                stroke-linejoin="round"
              />
            </svg>
          </TableGridBtn>
          <TableGridBtn
            onClick={() => {
              setGrid(false);
              setPage(1);
            }}
            isActive={!grid}
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="20"
              height="20"
              viewBox="0 0 20 20"
              fill="none"
            >
              <path
                d="M2.88491 12.517H17.5M2.88491 7.50849H17.5M15.6504 17.5H4.11851C3.22463 17.5 2.5 16.764 2.5 15.8562L2.5 4.14384C2.5 3.23597 3.22463 2.5 4.11851 2.5L15.6504 2.5C16.5443 2.5 17.2689 3.23597 17.2689 4.14384V15.8562C17.2689 16.764 16.5443 17.5 15.6504 17.5Z"
                stroke="#738094"
              />
            </svg>
          </TableGridBtn>
          <UniversalFilter
            filters={personsFilter}
            onReset={() => {
              setFilterData(null);
            }}
            onChange={(filterData: any) => setFilterData(filterData)}
          />
        </TableHeaderLeftWrapper>
      </TableHeaderWrapper>
      {grid ? (
        isLoading ? (
          <PlaceholderGrid />
        ) : (
          <ProjectsWrapper>
            {data?.persons?.length ? (
              data?.persons.map((item: any) => {
                return (
                  <CardLinkWrapper
                    href={getBackerHref(item, "person")}
                    key={getBackerRouteId(item) || item._id}
                  >
                    {/*//@ts-ignore*/}
                    <CardWrapper
                      redFlagsList={item.redFlagsList}
                      banner={item.banner}
                      logo={String(item.logo)}
                      name={item.name}
                      rating={item.rating}
                      fullness={item.fullness}
                      niche={item.niche}
                      socialmedia={item.socialmedia}
                      regionData={item.regionData}
                      athRoi={item.athRoi}
                      totalInvested={item.totalInvested}
                    />
                  </CardLinkWrapper>
                );
              })
            ) : (
              <></>
            )}
          </ProjectsWrapper>
        )
      ) : (
        <>
          {Number(data?.total) > currentLimit && !isFavourite ? (
            <Pagination
              page={page}
              onePageLimit={currentLimit}
              total={Number(data?.total)}
              limit={
                Number(data?.total) < page * currentLimit
                  ? data?.total
                  : page * currentLimit
              }
              totalPage={Math.ceil(Number(data?.total) / currentLimit)}
              onChange={(value) => {
                setPage(value);
              }}
            />
          ) : (
            <></>
          )}
          <UniversalTable
            isFavorite={isFavourite}
            setIsFavorite={setIsFavourite}
            link=""
            type={"persons"}
            favKey="FOMO-PERSONS-ICO-FAV"
            gridColumns={personsGridColumns}
            sortHeaders={personsSortHeader}
            updateSortValue={(name: string, value: 1 | -1) =>
              console.log("test")
            }
            isLoading={isLoading}
            sortValue={{ name: "", value: 1 }}
            page={page}
            items={data?.persons || []}
          />
        </>
      )}
      {Number(data?.total) > currentLimit && !isFavourite ? (
        <Pagination
          page={page}
          onePageLimit={currentLimit}
          total={Number(data?.total)}
          limit={
            Number(data?.total) < page * currentLimit
              ? data?.total
              : page * currentLimit
          }
          totalPage={Math.ceil(Number(data?.total) / currentLimit)}
          onChange={(value) => {
            setPage(value);
          }}
        />
      ) : (
        <></>
      )}
      <CommentBlock
        refetch={refetch}
        items={comments}
        addComment={confirmAddComment}
      />
    </PageWrapper>
  );
};

export default Persons;
