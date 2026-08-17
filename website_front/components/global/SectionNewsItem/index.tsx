/* eslint-disable */
import React, { FC } from "react";
import Image from "next/image";
import moment from "moment";
import image from "../../../public/static/nextjs.jpg";
import { INews } from "../../../types/global_types";
import imageLoader from "../../../helpers/imageLoader";
import LogoAdmin from "../../../assets/images/favicon-32x32.svg";
import { NewsImage, Title, Wrapper, TimeRead } from "./styles";

interface IProps {
  newsItem?: INews;
}

const SectionNewsItem: FC<IProps> = ({ newsItem }) => {
  return (
    <Wrapper variant="main">
      <NewsImage
        src={newsItem?.image ? imageLoader(newsItem.image) : image.src}
        alt={newsItem?.title}
      />
      <TimeRead>{newsItem?.readTime}</TimeRead>
      <Title variant="p">{newsItem?.title}</Title>
    </Wrapper>
  );
};

export default SectionNewsItem;
