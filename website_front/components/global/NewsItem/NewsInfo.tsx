import React, { FC } from "react";
import { INews, IUser } from "../../../types/global_types";
import Image from "next/image";
import imageLoader from "../../../helpers/imageLoader";
import LogoAdmin from "../../../assets/images/favicon-32x32.svg";
import {
  Category,
  NewsInfoCategory,
  NewsInfoHeader,
  NewsInfoWrapper,
  Title,
  UserData,
  UserInfoWrapper,
} from "./styles";
import moment from "moment";

interface IProps {
  newsItem?: INews;
}
const NewsInfo: FC<IProps> = ({ newsItem }) => {
  const user: IUser | null = newsItem?.creator?.length
    ? newsItem.creator[0]
    : null;

  return (
    <NewsInfoWrapper>
      <NewsInfoHeader>
        <UserData>
          <Image src={LogoAdmin} alt="News creator" />

          <UserInfoWrapper className="user-info">
            <div>{newsItem?.isAdminCreate ? "FOMO" : newsItem?.author}</div>
            <span>
              {moment(newsItem?.date).format("MMMM Do YYYY, h:mm:ss a")}
            </span>
          </UserInfoWrapper>
        </UserData>
        <NewsInfoCategory className="category">
          {newsItem?.type}
        </NewsInfoCategory>
      </NewsInfoHeader>

      <div className="news-item-text">{newsItem?.title}</div>
    </NewsInfoWrapper>
  );
};

export default NewsInfo;
