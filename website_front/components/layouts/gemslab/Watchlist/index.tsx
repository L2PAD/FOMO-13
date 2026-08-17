import React, { useContext, useMemo, useState } from "react";
import { ProjectsProjectsCards } from "../../../../staticContent/projects/projects";
import FilterSortHeader from "../../../global/FilterSortHeader";
import ViewTable from "../../../global/Tables/ViewTable";
import Pagination from "../../../global/Pagintaion";
import {
  ProjectCardItem,
  ProjectsWrapper,
  PageWrapper,
  ProjectCardLink,
} from "./styles";
import Typography from "../../../global/common/Typography";
import { Subtitle } from "../../projects/FomoChat/styles";
import {
  SearchIconStyle,
  SearchInput,
  SearchWrapper,
} from "../../projects/Networks/styles";
import useSort, { ISortBy } from "../../../../hooks/useSort";

import { LocationContext, WatchlistContext } from "../../../global/Layout";
import { filterItems, FilterKeys, PathNames } from "../../projects/Watchlist";

import WatchlistFilter from "../../../global/watchlist/WatchlistFilter";
import { useRouter } from "next/router";

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
  const router = useRouter();

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
      <Typography variant="h1">Watchlist</Typography>
      <br />
      <Subtitle>
        Add here most interesting projects for you and watch their journey.
      </Subtitle>
      <SearchWrapper>
        <SearchInput
          type="text"
          placeholder="Search the project/fund/person"
          onChange={(value: string) => setSearchValue(value)}
          leftIcon={<SearchIconStyle />}
          value={searchValue}
        />
      </SearchWrapper>
      <br />
      <FilterSortHeader
        grid={grid}
        setGrid={setGrid}
        sort={{
          label: "Sort by",
          type: "name / date",
          options: [
            {
              label: "Name",
              items: ["A-Z", "Z-A"],
              value: name,
              setValue: (nameValue: any) => {
                setName(nameValue);
                setSortValue({
                  field: "name",
                  order: nameValue === "A-Z" ? "asc" : "desc",
                });
              },
            },
            {
              label: "Date",
              items: ["New", "Old"],
              value: date,
              setValue: (dateValue: any) => {
                setDate(dateValue);
                setSortValue({
                  field: "lastFunding",
                  order: dateValue === "New" ? "asc" : "desc",
                });
              },
            },
          ],
        }}
      />
      <WatchlistFilter
        onChange={(key: string) => setFilterKey(key)}
        selectedKey={filterKey}
        items={filterItems}
      />
      <ProjectsWrapper>
        {grid ? (
          watchListItems?.map((item: any, i: number) => {
            return (
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
          })
        ) : (
          <ViewTable
            type={
              filterKey === "projects" || filterKey === "nfts"
                ? "projects"
                : filterKey
            }
            cardsData={{
              //@ts-ignore
              cards: watchListItems?.map((item) => ({
                ...item,
                //@ts-ignore
                onClick: () =>
                  router.push(`${path}/${PathNames[filterKey]}/${item._id}`),
              })),
            }}
          />
        )}
        {watchListItems?.length > 20 ? (
          <Pagination
            page={page}
            total={watchListItems.length}
            limit={20}
            totalPage={watchListItems.length / 20}
            onChange={(value) => setPage(value)}
          />
        ) : (
          <></>
        )}
      </ProjectsWrapper>
    </PageWrapper>
  );
};

export default Watchlist;
