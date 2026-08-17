/* eslint-disable */
import React, { useContext } from "react";
import { useRouter } from "next/router";
import { useQuery } from "react-query";
import moment from "moment";
import Link from "next/link";
import BreadCrumbs from "../../../../global/BreadCrumbs";
import image from "../../../../../public/static/main/where_next.png";
import NewsItem from "../../../../global/NewsItem";
import imageLoader from "../../../../../helpers/imageLoader";
import useFetch from "../../../../../hooks/useFetch";
import { INews, IUser } from "../../../../../types/global_types";
import { PageWrapper } from "../../CryptoMarket/styles";
import LogoAdmin from "../../../../../assets/images/favicon-32x32.svg";
import addReaction from "../../../../../http/news/addReaction";
import {
  Categories,
  ContentText,
  ContentWrapper,
  Date,
  Details,
  ImageStyles,
  LikesButtons,
  LikesWrapper,
  NewsImage,
  Recommended,
  RecommendedItemsWrapper,
  RecommendedTitle,
  Title,
} from "./styles";
import { UserData } from "../Market/styles";
import Image from "next/image";
import { Category, UserInfoWrapper } from "../../../../global/NewsItem/styles";
import CommentBlock from "../../../../global/CommentBlock";
import useComments from "../../../../../hooks/useComments";
import MainLike from "../../../../global/Icons/MainLike";
import MainDislike from "../../../../global/Icons/MainDislike";
import SocialLinks from "../../../../global/common/SocialLinks";
import fetchNewsItem from "../../../../../http/news/fetchNewsItem";
import { AuthContext } from "../../../../global/Layout";
import { sanitizedHtml } from "../../../../../helpers/sanitizeHtml";

const NewsItemPage = () => {
  const router = useRouter();
  const { userData } = useContext(AuthContext);
  const { comments, confirmAddComment } = useComments(
    "comments/crypto",
    "comments/crypto"
  );
  const { data, refetch } = useQuery(["news-item", router.query.id], () =>
    fetchNewsItem(`news/item/${router.query.id}`)
  );
  const user: IUser | null = data?.newsItem?.creator?.length
    ? data.newsItem.creator[0]
    : null;

  const confirmAddReaction = async (
    actionType: "like" | "dislike"
  ): Promise<void> => {
    await addReaction(actionType, data?.newsItem?._id || "");

    await refetch();
  };

  return (
    <>
      <PageWrapper className="news-page-wrapper">
        <ContentWrapper>
          <Title variant="h1">{data?.newsItem?.title}</Title>
          <UserData>
            {data?.newsItem?.isAdminCreate ? (
              <Image src={LogoAdmin} alt="News creator" />
            ) : (
              <img
                src={
                  user?.avatar
                    ? imageLoader(user?.avatar)
                    : user?.twitterData?.avatar
                }
                alt="News creator"
              />
            )}
            <Categories>
              <Category>{data?.newsItem?.type}</Category>
            </Categories>
            <UserInfoWrapper>
              <div>
                {data?.newsItem?.isAdminCreate
                  ? "FOMO"
                  : user?.username || user?.twitterData?.username}
              </div>
              <span>
                {moment(data?.newsItem?.date).format("MMMM Do YYYY, h:mm:ss a")}
              </span>
            </UserInfoWrapper>
          </UserData>
          <NewsImage
            src={
              data?.newsItem?.image
                ? imageLoader(data?.newsItem.image)
                : image.src
            }
            alt={data?.newsItem?.title}
          />
          <ContentText
            dangerouslySetInnerHTML={sanitizedHtml(data?.newsItem?.text || "")}
          ></ContentText>
          <LikesWrapper>
            <p>Enjoyed the article? Show your support by giving it a like!</p>
            <LikesButtons>
              <MainLike
                likesCount={data?.newsItem?.likes?.length || 0}
                isActive={data?.newsItem?.likes?.includes(userData?._id)}
                onClick={() => confirmAddReaction("like")}
              />
              <MainDislike
                likesCount={data?.newsItem?.dislikes?.length || 0}
                isActive={data?.newsItem?.dislikes?.includes(userData?._id)}
                onClick={() => confirmAddReaction("dislike")}
              />
            </LikesButtons>
          </LikesWrapper>
          <Details>
            <span>Share</span>
            <SocialLinks
              className="blog-social"
              links={[
                {
                  href: "/",
                  key: "fs",
                },
                {
                  href: "/",
                  key: "inst",
                },
                {
                  href: "/",
                  key: "x",
                },
                {
                  href: "/",
                  key: "tg",
                },
              ]}
            />
          </Details>
        </ContentWrapper>
        {data?.newsItem?.recommendationNewsItems?.length ? (
          <Recommended>
            <RecommendedTitle variant="p">You Might Also Like</RecommendedTitle>
            <RecommendedItemsWrapper>
              {data.newsItem.recommendationNewsItems.map(
                (item: INews, i: number) => {
                  return (
                    <Link href={`/crypto/news/${item._id}`} key={i}>
                      <NewsItem newsItem={item} />
                    </Link>
                  );
                }
              )}
            </RecommendedItemsWrapper>
          </Recommended>
        ) : null}
      </PageWrapper>
      <PageWrapper>
        <CommentBlock items={comments} addComment={confirmAddComment} />
      </PageWrapper>
    </>
  );
};

export default NewsItemPage;
