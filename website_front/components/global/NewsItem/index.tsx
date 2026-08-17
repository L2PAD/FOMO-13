/* eslint-disable */
import React, { FC } from "react";
import Image from "next/image";
import moment from "moment";
import image from "../../../public/static/nextjs.jpg";
import { INews, IUser } from "../../../types/global_types";
import imageLoader from "../../../helpers/imageLoader";
import LogoAdmin from "../../../assets/images/favicon-32x32.svg";
import {
  Date,
  NewsImage,
  NewsPreviewImage,
  Title,
  Wrapper,
  DescriptionNews,
  Category,
  UserData,
  UserInfoWrapper,
} from "./styles";
import HighlightedText from "../HighlightedText";

interface IProps {
  newsItem?: INews;
  highlightSearchValue?: string;
}

const NewsItem: FC<IProps> = ({ newsItem, highlightSearchValue = "" }) => {
  const user: IUser | null = newsItem?.creator?.length
    ? newsItem.creator[0]
    : null;

  return (
    <Wrapper variant="main">
      <NewsImage>
        <NewsPreviewImage
          src={newsItem?.image ? imageLoader(newsItem.image) : image.src}
          alt={newsItem?.title || ""}
          loading="lazy"
        />
      </NewsImage>
      <Category>{newsItem?.type}</Category>
      <Title variant="p">
        <HighlightedText
          text={newsItem?.title || ""}
          searchValue={highlightSearchValue}
          highlightAll
          highlightVariant="news"
        />
      </Title>
      <UserData>
        {newsItem?.isAdminCreate ? (
          <Image src={LogoAdmin} alt="News creator" />
        ) : user?.photo ? (
          <img
            src={
              user?.photo ? imageLoader(user?.photo) : user?.twitterData?.avatar
            }
            alt="News creator"
          />
        ) : (
          <></>
        )}

        <UserInfoWrapper>
          <div>
            {newsItem?.isAdminCreate
              ? "FOMO"
              : user?.username || user?.twitterData?.username}
          </div>
          <span>
            {moment(newsItem?.date).format("MMMM Do YYYY, h:mm:ss a")}
          </span>
        </UserInfoWrapper>
      </UserData>
    </Wrapper>
  );
};

export default NewsItem;
