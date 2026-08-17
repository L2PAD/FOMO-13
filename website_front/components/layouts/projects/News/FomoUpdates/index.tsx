import React, { useContext, useState } from "react";
import { INews } from "../../../../../types/global_types";
import { useQuery } from "react-query";
import getNews from "../../../../../http/news/getNews";
import { LocationContext } from "../../../../global/Layout";
import { GroupedNews, sortAndGroupNews } from "../Market";
import { UpdatesList, Wrapper } from "./styles";
import FomoUpdateItem from "../../../../global/FomoUpdateItem";
import moment from "moment";
import Placeholder from "../../../../global/common/Placeholder";

interface Props {
  searchValue?: string;
  sourcePath?: string;
  sortOrder?: "asc" | "desc";
}

const FomoUpdates = ({
  searchValue = "",
  sourcePath,
  sortOrder = "desc",
}: Props) => {
  const limit: number = 8;
  const [news, setNews] = useState<Array<INews>>([]);
  const [offset, setOffset] = useState<number>(0);
  const { path } = useContext(LocationContext);
  const [total, setTotal] = useState<number>(0);
  const newsPath = sourcePath || path;
  const { isLoading } = useQuery(
    ["fomo-updates", newsPath, offset],
    () =>
      getNews(
        `news/${newsPath}?limit=${limit}&offset=${offset}&section=fomo-update`
      ),
    {
      onSuccess: (data) => {
        setNews(data.news);
        setTotal(data.total);
      },
      refetchOnWindowFocus: false,
    }
  );
  const normalizedSearchValue = searchValue.trim().toLowerCase();
  const filteredNews = normalizedSearchValue
    ? news.filter((item: INews) =>
      [item.title, item.text, item.type]
        .filter(Boolean)
        .some((value) =>
          String(value).toLowerCase().includes(normalizedSearchValue)
        )
    )
    : news;
  const groupedNews = sortAndGroupNews(filteredNews, sortOrder);

  const renderSkeleton = () => (
    <UpdatesList className="skeleton-list" aria-busy="true">
      {Array.from({ length: 4 }).map((_, index) => (
        <div className="update-skeleton-card" key={`fomo-update-skeleton-${index}`}>
          <div className="skeleton-header">
            <div className="skeleton-title-row">
              <Placeholder
                width="min(260px, 70%)"
                height="18px"
                borderRadius="8px"
                marginBottom="0"
              />
              <Placeholder
                width="44px"
                height="18px"
                borderRadius="4px"
                marginBottom="0"
              />
            </div>
            <Placeholder
              width="54px"
              height="16px"
              borderRadius="8px"
              marginBottom="0"
            />
          </div>
          <div className="skeleton-body">
            <Placeholder
              width="72%"
              height="14px"
              borderRadius="8px"
              marginBottom="8px"
            />
            <Placeholder
              width="58%"
              height="14px"
              borderRadius="8px"
              marginBottom="0"
            />
          </div>
          <div className="skeleton-footer">
            <Placeholder
              width="82px"
              height="16px"
              borderRadius="8px"
              marginBottom="0"
            />
            <Placeholder
              width="56px"
              height="16px"
              borderRadius="8px"
              marginBottom="0"
            />
          </div>
        </div>
      ))}
    </UpdatesList>
  );

  if (isLoading) {
    return <Wrapper>{renderSkeleton()}</Wrapper>;
  }

  return (
    <Wrapper>
      {groupedNews.map((group: GroupedNews, i: number) => {
        return (
          <div key={i} className="group-item">
            {i > 0 ? (
              <p className="group-date">
                <svg width="15" height="16" viewBox="0 0 15 16" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M2.84127 5.42855H11.3333M2.84127 0.5V1.78586M11.3333 0.5V1.78571M13.8333 4.03571V13.25C13.8333 14.4926 12.8384 15.5 11.6111 15.5H2.72222C1.49492 15.5 0.5 14.4926 0.5 13.25V4.03571C0.5 2.79307 1.49492 1.78571 2.72222 1.78571H11.6111C12.8384 1.78571 13.8333 2.79307 13.8333 4.03571Z" stroke="#728094" stroke-linecap="round" stroke-linejoin="round" />
                </svg>
                {moment(group.date).format("MMMM DD, YYYY")}
              </p>
            ) : (
              <></>
            )}
            <UpdatesList>
              {group.items.map((item: INews) => {
                return <FomoUpdateItem key={item._id} item={item} />;
              })}
            </UpdatesList>
          </div>
        );
      })}
    </Wrapper>
  );
};

export default FomoUpdates;
