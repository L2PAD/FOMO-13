import React, { useContext, useState } from "react";
import { useQuery } from "react-query";
import { INews } from "../../../../../types/global_types";
import { LocationContext } from "../../../../global/Layout";
import getNews from "../../../../../http/news/getNews";
import { PlaceholderWrapper } from "../Market/styles";
import Placeholder from "../../../../global/common/Placeholder";
import PlaceholderGrid from "../../../../global/common/PlaceholderGrid";
import { NewsItems } from "./styles";
import AcademyNewsItem from "../../../../global/AcademyNewsItem";
import { PageDescription, PageDescriptionWrapper } from "../Blog/styles";

const FomoAcademy = () => {
  const limit: number = 8;
  const [news, setNews] = useState<Array<INews>>([]);
  const [offset, setOffset] = useState<number>(0);
  const { path } = useContext(LocationContext);
  const [total, setTotal] = useState<number>(0);
  const { isLoading } = useQuery(
    ["news", offset],
    () =>
      getNews(
        `news/${path}?limit=${limit}&offset=${offset}&section=fomo-academy`
      ),
    {
      onSuccess: (data) => {
        setNews(data.news);
        setTotal(data.total);
      },
      refetchOnWindowFocus: false,
    }
  );

  return (
    <div>
      {isLoading ? (
        <PlaceholderWrapper>
          <PlaceholderGrid />
        </PlaceholderWrapper>
      ) : (
        <>
          <PageDescriptionWrapper>
            <PageDescription variant="h2">FOMO Academy</PageDescription>
          </PageDescriptionWrapper>
          <NewsItems>
            {news.map((item: INews) => {
              return <AcademyNewsItem key={item._id} newsItem={item} />;
            })}
          </NewsItems>
        </>
      )}
    </div>
  );
};

export default FomoAcademy;
