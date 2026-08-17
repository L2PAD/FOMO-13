/* eslint-disable */
import React, { useState, useContext, useMemo } from "react";
import Image from "next/image";
import { LocationContext, WatchlistContext } from "../../../global/Layout";
import WatchlistFilter from "../../../global/watchlist/WatchlistFilter";
import useSort from "../../../../hooks/useSort";
import Typography from "../../../global/common/Typography";
import { ISortBy } from "../../../../hooks/useSort";
import { SearchWrapper } from "../Networks/styles";
import { ProjectCardItem, ProjectCardLink } from "./styles";
import { CardWrapper } from "../Funds/styles";
import {
  MainInfo,
  MainInfoDescription,
  PageWrapper,
  TableHeaderLeftWrapper,
  TableHeaderRightWrapper,
  TableHeaderWrapper,
} from "../CryptoMarket/styles";
import { SearchInput } from "../P2PExchange/styles";
import { SearchIconStyle } from "../../../global/Navigation/styles";
import { CardLinkWrapper, TableGridBtn } from "../Persons/styles";
import UniversalFilter from "../../../global/UniversalFilter";
import { ProjectsWrapper } from "../Crypto/styles";
import {
  cryptoMarketFilter,
  fundsFilter,
} from "../../../../staticContent/projects/crypto_market";
import UniversalTable from "../../../global/common/UniversalTable";
import AllIcon from "../../../../assets/icons/all-sort.svg";
import SortCashIcon from "../../../../assets/icons/sort-cash.svg";
import SmileIcon from "../../../../assets/icons/smile-sort.svg";
import RegionIcon from "../../../../assets/icons/region.svg";
import {
  fundsGridColumns,
  fundsSortHeader,
  projectsIcoGridColumns,
  projectsIcoSortHeader,
} from "../../../../staticContent/tables";
import NftsList from "../../nfts/NftsList";
import EmptyWatchlist from "./EmptyWatchlist";
import { getBackerHref, getBackerRouteId } from "../../../../helpers/backerRoute";

export enum FilterKeys {
  projects = "projects",
  nfts = "nfts",
  funds = "funds",
  persons = "persons",
}

export const PathNames: any = {
  projects: "project",
  nfts: "nft",
  funds: "funds",
  persons: "persons",
};

export const filterItems: Array<{ key: string; value: string }> = [
  {
    key: "projects",
    value: "Projects",
  },
  {
    key: "funds",
    value: "Funds",
  },
  {
    key: "persons",
    value: "Persons",
  },
  {
    key: "nfts",
    value: "NFTs",
  },
];

const Watchlist = () => {
  const data = useContext(WatchlistContext);
  const { path } = useContext(LocationContext);
  const [grid, setGrid] = useState(true);
  const [page, setPage] = useState(1);
  const [searchValue, setSearchValue] = useState("");
  const [name, setName] = useState("");
  const [date, setDate] = useState("");
  const [sortValue, setSortValue] = useState<ISortBy>({
    field: "name",
    order: "asc",
  });
  const [filterKey, setFilterKey] = useState<string>(FilterKeys.projects);
  const sortProjects = useSort(sortValue.field, sortValue.order);
  const [isFavorite, setIsFavorite] = useState<boolean>(false);
  const [filterValue, setFilterValue] = useState<string>("");

  const handleTabHeaders = () => {
    if (!watchListItems.length && filterKey !== "nfts") {
      return <></>;
    }

    if (filterKey === "projects") {
      return (
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
          <TableGridBtn onClick={() => setGrid(false)} isActive={!grid}>
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
            filters={cryptoMarketFilter}
            onChange={(data: any) => console.log(data)}
          />
        </TableHeaderLeftWrapper>
      );
    }

    if (filterKey === "funds") {
      return (
        <TableHeaderLeftWrapper>
          <UniversalFilter
            filters={fundsFilter}
            onChange={(data: any) => console.log(data)}
          />
        </TableHeaderLeftWrapper>
      );
    }

    if (filterKey === "persons") {
      return <></>;
    }

    return (
      <TableHeaderLeftWrapper>
        <UniversalFilter
          filters={cryptoMarketFilter}
          onChange={(data: any) => console.log(data)}
        />
      </TableHeaderLeftWrapper>
    );
  };

  const getLinkByFilterKey = (): string => {
    const links = {
      projects: "/crypto/projects",
      funds: "/crypto/backers?tab=funds",
      persons: "/crypto/backers?tab=persons",
      nfts: "/nfts",
    };

    //@ts-ignore
    return links[filterKey];
  };

  const handleWatchlistBody = () => {
    if (!watchListItems.length && filterKey !== "nfts") {
      return (
        <EmptyWatchlist title={filterKey} linkPath={getLinkByFilterKey()} />
      );
    }

    if (filterKey === "projects") {
      return grid ? (
        <ProjectsWrapper>
          {watchListItems?.map((item: any, i: number) => {
            return (
              // @ts-ignore
              <ProjectCardLink
                href={`/${path}/${PathNames[filterKey]}/${item._id}`}
                key={i}
              >
                <ProjectCardItem
                  type={
                    filterKey === "projects" || filterKey === "nfts"
                      ? "default"
                      : filterKey
                  }
                  //@ts-ignore
                  cardData={item}
                  searchValue={searchValue}
                />
              </ProjectCardLink>
            );
          })}
        </ProjectsWrapper>
      ) : (
        <UniversalTable
          isFavorite={isFavorite}
          setIsFavorite={setIsFavorite}
          link=""
          type={"projects-ico"}
          favKey="FOMO-WATCHLIST-PROJECTS-ICO-FAV"
          gridColumns={projectsIcoGridColumns}
          sortHeaders={projectsIcoSortHeader}
          isLoading={false}
          sortValue={{ name: "", value: 1 }}
          page={page}
          items={watchListItems || []}
        />
      );
    }

    if (filterKey === "funds") {
      return (
        <UniversalTable
          type="funds"
          sortHeaders={fundsSortHeader}
          link="/crypto/funds"
          favKey={"FOMO-WATCHLIST-CRYPTO-MARKET-FAV"}
          gridColumns={fundsGridColumns}
          isFavorite={isFavorite}
          setIsFavorite={setIsFavorite}
          sortValue={{ name: "", value: 1 }}
          isLoading={false}
          page={page}
          items={watchListItems}
        />
      );
    }

    if (filterKey === "persons") {
      return (
        <>
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
              <TableGridBtn onClick={() => setGrid(false)} isActive={!grid}>
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
            </TableHeaderLeftWrapper>
          </TableHeaderWrapper>
          {grid ? (
            <ProjectsWrapper>
              {watchListItems?.length ? (
                watchListItems.map((item: any) => {
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
                        redFlags={item.redFlagsList?.length}
                      />
                    </CardLinkWrapper>
                  );
                })
              ) : (
                <></>
              )}
            </ProjectsWrapper>
          ) : (
            <UniversalTable
              isFavorite={isFavorite}
              setIsFavorite={setIsFavorite}
              link=""
              type={"projects-ico"}
              favKey="FOMO-WATCHLIST-PERSONS-ICO-FAV"
              gridColumns={projectsIcoGridColumns}
              sortHeaders={projectsIcoSortHeader}
              updateSortValue={(name: string, value: 1 | -1) =>
                console.log("test")
              }
              isLoading={false}
              sortValue={{ name: "", value: 1 }}
              page={page}
              items={watchListItems || []}
            />
          )}
        </>
      );
    }

    if (filterKey === "nfts") {
      return <NftsList />;
    }
  };

  const watchListItems: Array<any> = useMemo(() => {
    if (!data?.watchlist) return [];

    const currentWatchlistItems: Array<any> = data.watchlist[filterKey];

    if (!currentWatchlistItems?.length) return [];

    if (!searchValue) return currentWatchlistItems.sort(sortProjects);

    const filteredList: Array<any> = currentWatchlistItems.filter((item: any) =>
      item?.name?.toLowerCase().includes(searchValue.toLowerCase())
    );

    const sortedList: Array<any> = filteredList.sort(sortProjects);

    return sortedList;
  }, [searchValue, data, date, name, filterKey]);

  return (
    <PageWrapper>
      <MainInfo>
        <MainInfoDescription>
          <Typography className="main-title" variant="h1">
            Watchlist
          </Typography>
          <br />
          Track your favorite projects, funds, and people by adding them to your
          watchlist and follow their progress over time
          <br />
          <br />
          <SearchWrapper>
            <SearchInput
              type="text"
              placeholder="Search on page"
              onChange={(value: string) => setSearchValue(value)}
              leftIcon={<SearchIconStyle />}
              value={searchValue}
            />
          </SearchWrapper>
        </MainInfoDescription>
      </MainInfo>

      <br />
      <TableHeaderWrapper>
        <WatchlistFilter
          onChange={(key: string) => {
            setFilterKey(key);
            setIsFavorite(false);
          }}
          selectedKey={filterKey}
          items={filterItems}
        />
        {handleTabHeaders()}
      </TableHeaderWrapper>
      {handleWatchlistBody()}
    </PageWrapper>
  );
};

export default Watchlist;
