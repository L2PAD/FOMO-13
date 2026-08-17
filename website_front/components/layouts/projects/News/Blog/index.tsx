/* eslint-disable */
import React, { useState, useContext } from "react";
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
  PageDescription,
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
import InstantAlerts from "../Alerts";
import FomoAcademy from "../FomoAcademy";

type GroupedNews = {
  date: string;
  items: INews[];
};

export function sortAndGroupNews(news: INews[]): GroupedNews[] {
  const sorted = [...news].sort(
    (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
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

const BlogSection = () => {
  const limit: number = 6;
  const { path } = useContext(LocationContext);
  const [news, setNews] = useState<Array<INews>>([]);
  const [offset, setOffset] = useState<number>(0);
  const [total, setTotal] = useState<number>(0);
  const { isLoading } = useQuery(
    ["news-blog", offset],
    () =>
      getNews(
        `news/crypto?limit=${limit}&offset=${offset}&section=default&creator=user`
      ),
    {
      onSuccess: (data) => {
        setNews(data.news);
        setTotal(data.total);
      },
      refetchOnWindowFocus: false,
    }
  );
  const groupedNews = sortAndGroupNews(news);
  const topNews: Array<INews> = groupedNews[0]?.items || [];

  return (
    <>
      {isLoading ? (
        <PlaceholderWrapper>
          <PlaceholderGrid />
        </PlaceholderWrapper>
      ) : (
        <>
          <PageDescriptionWrapper>
            <PageDate>
              {moment(groupedNews.shift()?.date).format("ll")}
            </PageDate>
          </PageDescriptionWrapper>
          <NewsWrapper>
            {topNews.map((item: INews, i: number) => {
              return (
                <Link
                  className="small-news"
                  href={`/${path}/news/${item._id}`}
                  key={item._id}
                >
                  <NewsItem newsItem={item} />
                </Link>
              );
            })}
          </NewsWrapper>
          {groupedNews.map((item: GroupedNews, i: number) => {
            return (
              <div key={i}>
                <PageDate>{moment(item.date).format("ll")}</PageDate>
                <OldNewsWrapper>
                  {item.items.map((item: INews, i: number) => {
                    return <OldNewsItem key={item._id} item={item} />;
                  })}
                </OldNewsWrapper>
              </div>
            );
          })}
          <br />
          <br />
          <FomoAcademy />
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

export default BlogSection;
