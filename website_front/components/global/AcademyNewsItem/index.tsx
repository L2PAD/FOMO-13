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
  Title,
  Wrapper,
  DescriptionNews,
  Category,
  UserData,
  UserInfoWrapper,
} from "./styles";

interface IProps {
  newsItem?: INews;
}

const AcademyNewsItem: FC<IProps> = ({ newsItem }) => {
  const user: IUser | null = newsItem?.creator?.length
    ? newsItem.creator[0]
    : null;

  return (
    <Wrapper variant="main">
      <NewsImage>
        <Image
          fill
          src={newsItem?.image ? imageLoader(newsItem.image) : image.src}
          alt={newsItem?.title || ""}
          priority={false}
        />
      </NewsImage>
      <Category>{newsItem?.type}</Category>
      <UserInfoWrapper>
        <span>{`${newsItem?.readTime} mins read` || "3 mins read"}</span>
      </UserInfoWrapper>
      <Title variant="p">{newsItem?.title}</Title>
    </Wrapper>
  );
};

export default AcademyNewsItem;
