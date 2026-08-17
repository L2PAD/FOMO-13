/* eslint-disable */
import React, { useState, useContext, useEffect, useMemo } from "react";
import { useQuery } from "react-query";
import Link from "next/link";
import { LocationContext } from "../../../../global/Layout";
import useComments from "../../../../../hooks/useComments";
import NewsItem from "../../../../global/NewsItem";
import CommentBlock from "../../../../global/CommentBlock";
import Pagination from "../../../../global/Pagintaion";
import { Sort } from "../../../../global/common/Sort";
import Placeholder from "../../../../global/common/Placeholder";
import {
  MainNewsCategory,
  MainNewsInfo,
  MainNewsTitle,
  MainNewsWrapper,
  NewsWrapper,
  OldNewsWrapper,
  PageDate,
  PageDescriptionWrapper,
  PlaceholderWrapper,
  SearchContainer,
  ShowMoreButton,
  UserData,
  UserInfoWrapper,
} from "./styles";
import { INews, IUser } from "../../../../../types/global_types";
import {
  SearchIconStyle,
  SearchInput,
  SearchWrapper,
} from "../../P2PExchange/styles";
import Image from "next/image";
import imageLoader from "../../../../../helpers/imageLoader";
import LogoAdmin from "../../../../../assets/images/favicon-32x32.svg";
import moment from "moment";
import getNews from "../../../../../http/news/getNews";
import PlaceholderGrid from "../../../../global/common/PlaceholderGrid";
import OldNewsItem from "../../../../global/OldNewsItem";
import { useDebounce } from "../../../../../hooks/useDebounce";
import EmptyList from "../../../../global/EmptyList";
import { MOCK_NEWS } from "../../../../../staticContent/mockNews";

export type GroupedNews = {
  date: string;
  items: INews[];
};

export function sortAndGroupNews(
  news: INews[],
  sortOrder: "asc" | "desc" = "desc"
): GroupedNews[] {
  const sorted = [...news].sort(
    (a, b) =>
      sortOrder === "asc"
        ? new Date(a.date).getTime() - new Date(b.date).getTime()
        : new Date(b.date).getTime() - new Date(a.date).getTime()
  );

  const groupedMap: Record<string, INews[]> = sorted.reduce(
    (acc: Record<string, INews[]>, item: INews) => {
      const day = moment(item.date).format("YYYY-MM-DD");
      if (!acc[day]) {
        acc[day] = [];
      }
      acc[day].push(item);
      return acc;
    },
    {}
  );

  return Object.entries(groupedMap).map(([date, items]) => ({
    date,
    items,
  }));
}

interface MarketProps {
  searchValue?: string;
  filterData?: Record<string, any> | null;
}

const parseFilterDate = (value?: string): string | undefined => {
  if (!value) return undefined;

  const [day, month, year] = String(value).split("/");
  if (!day || !month || !year) return undefined;

  const parsedDate = new Date(Number(year), Number(month) - 1, Number(day));
  if (Number.isNaN(parsedDate.getTime())) return undefined;

  return [
    parsedDate.getFullYear(),
    `${parsedDate.getMonth() + 1}`.padStart(2, "0"),
    `${parsedDate.getDate()}`.padStart(2, "0"),
  ].join("-");
};

const resolveCategoryFilter = (
  filterData?: Record<string, any> | null
): string[] => {
  const categoryOptions = filterData?.category;

  if (!Array.isArray(categoryOptions)) {
    return [];
  }

  return categoryOptions
    .filter((item: any) => item?.isActive && item?.key)
    .map((item: any) => String(item.key).trim().toLowerCase())
    .filter(Boolean);
};

const buildMarketNewsQuery = ({
  limit,
  offset,
  search,
  categories,
  fromDate,
  toDate,
}: {
  limit: number;
  offset: number;
  search?: string;
  categories?: string[];
  fromDate?: string;
  toDate?: string;
}) => {
  const query = new URLSearchParams({
    limit: String(limit),
    offset: String(offset),
    section: "default",
  });

  if (search) {
    query.set("search", search);
  }

  if (categories?.length) {
    query.set("category", categories.join(","));
  }

  if (fromDate) {
    query.set("fromDate", fromDate);
  }

  if (toDate) {
    query.set("toDate", toDate);
  }

  return `news/crypto?${query.toString()}`;
};

const Market = ({ searchValue = "", filterData = null }: MarketProps) => {
  const limit: number = 24;
  const { path } = useContext(LocationContext);
  const [news, setNews] = useState<Array<INews>>([]);
  const [total, setTotal] = useState<number>(0);
  const [offset, setOffset] = useState<number>(0);
  const debouncedSearchValue = useDebounce(searchValue.trim(), 400);
  const categoryFilter = useMemo(
    () => resolveCategoryFilter(filterData),
    [filterData]
  );
  const categoryFilterKey = categoryFilter.join(",");
  const fromDate = useMemo(
    () => parseFilterDate(filterData?.fromDate),
    [filterData?.fromDate]
  );
  const toDate = useMemo(
    () => parseFilterDate(filterData?.toDate),
    [filterData?.toDate]
  );
  const newsQueryPath = useMemo(
    () =>
      buildMarketNewsQuery({
        limit,
        offset,
        search: debouncedSearchValue || undefined,
        categories: categoryFilter,
        fromDate,
        toDate,
      }),
    [limit, offset, debouncedSearchValue, categoryFilter, fromDate, toDate]
  );

  useEffect(() => {
    setOffset(0);
  }, [debouncedSearchValue, categoryFilterKey, fromDate, toDate]);

  const { isLoading } = useQuery(
    ["news-market", offset, debouncedSearchValue, categoryFilterKey, fromDate, toDate],
    () => getNews(newsQueryPath),
    {
      onSuccess: (data) => {
        setNews(data.news);
        setTotal(data.total);
      },
      refetchOnWindowFocus: false,
      keepPreviousData: true,
    }
  );
  const hasCardImages = news.some(
    (n: INews) => !!n.image && !n.image.includes("cryptopotato")
  );
  const usingMock = !isLoading && (news.length === 0 || !hasCardImages);
  const effectiveNews = usingMock ? MOCK_NEWS : news;
  const groupedNews = sortAndGroupNews(effectiveNews);
  const firstNewsGroup = groupedNews[0];
  const remainingNewsGroups = groupedNews.slice(1);
  const topNews: Array<INews> = (firstNewsGroup?.items || []).filter((item: INews) => {
    return (!!item.image && !item?.image?.includes('cryptopotato'))
  });
  const topNewsIds = new Set(topNews.map((item: INews) => item._id));
  const firstNewsGroupListItems = (firstNewsGroup?.items || []).filter(
    (item: INews) => !topNewsIds.has(item._id)
  );
  const isEmptyResult = false;

  return (
    <>
      <PageDescriptionWrapper>
        <PageDate>
          {isLoading ? (
            <Placeholder width="120px" height="20px" />
          ) : firstNewsGroup?.date ? (
            moment(firstNewsGroup.date).format("ll")
          ) : null}
        </PageDate>
      </PageDescriptionWrapper>
      {isEmptyResult ? (
        <EmptyList />
      ) : (
        <>
          <NewsWrapper>
            {isLoading
              ? Array.from({ length: 3 }).map((_, i: number) => (
                <Placeholder
                  key={i}
                  width="100%"
                  height="340px"
                  borderRadius="8px"
                />
              ))
              : topNews.map((item: INews, i: number) => {
                return (
                  <Link
                    className="small-news"
                    href={usingMock ? "#" : `/${path}/news/${item._id}`}
                    key={item._id}
                  >
                    <NewsItem
                      newsItem={item}
                      highlightSearchValue={searchValue}
                    />
                  </Link>
                );
              })}
          </NewsWrapper>
          <br/>
          {!isLoading ? (
            <>
              {firstNewsGroupListItems.length ? (
                <OldNewsWrapper>
                  {firstNewsGroupListItems.map((item: INews) => {
                    return (
                      <OldNewsItem
                        key={item._id}
                        item={item}
                        highlightSearchValue={searchValue}
                      />
                    );
                  })}
                </OldNewsWrapper>
              ) : null}
              {remainingNewsGroups.map((item: GroupedNews, i: number) => {
                return (
                  <div key={i}>
                    <PageDate>{moment(item.date).format("ll")}</PageDate>
                    <OldNewsWrapper>
                      {item.items.map((item: INews) => {
                        return (
                          <OldNewsItem
                            key={item._id}
                            item={item}
                            highlightSearchValue={searchValue}
                          />
                        );
                      })}
                    </OldNewsWrapper>
                  </div>
                );
              })}
              <br />
              <br />
            </>
          ) : (
            <></>
          )}
        </>
      )}
      {/* {
        news.length === total
          ?
          <></>
          :
          <ShowMoreButton>
            <button
              onClick={() => setOffset((value: number) => value + 10)}
            >
              Load More
            </button>
          </ShowMoreButton>
      } */}
    </>
  );
};

export default Market;
