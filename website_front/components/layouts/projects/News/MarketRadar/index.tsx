import React, { FC, useState } from "react";
import { Wrapper, Items, ParsingItem } from "./styles";
import { ItemImagesWrapper } from "../../Parsing/CustomTwitterAccs/styles";
import EmptyList from "../../../../global/EmptyList";
import moment from "moment";
import { useQuery } from "react-query";
import fetchTwitterKeywords, {
  IKeywordsReturnData,
} from "../../../../../http/parcing/fetchTwitterKeywords";
import { linkify } from "../../Parsing/CustomTwitterAccs";
import ImageModal from "../../../../global/ImageModal";
import OtcLike from "../../../../global/Icons/OtcLike";
import RepostIcon from "../../../../global/Icons/RepostIcon";
import { EyeIcon } from "../../../../global/Navigation/styles";
import Image from "next/image";
import ViewIcon from "../../../../global/Icons/ViewIcon";
import { groupTweetsByDate } from "../Alerts";
import {
  getUserLogo,
  setUserLogoFallback,
} from "../../../../../helpers/imageFallbacks";

const limit = 20;

interface IProps {}

export type GroupedTweets = {
  date: string;
  tweets: any[];
};

const MarketRadar: FC<IProps> = () => {
  const [page, setPage] = useState<number>(3);
  const { data, isLoading } = useQuery(
    ["live-keywords"],
    () =>
      fetchTwitterKeywords(
        `/public/keywords/trending?offset=${page - 1}&limit=${limit}`
      ),
    { refetchInterval: 60 * 1000, refetchOnWindowFocus: false }
  );
  const totalCount: number = data?.total || 0;
  const [modalImage, setModalImage] = useState<string | null>(null);
  const tweets: IKeywordsReturnData[] = data?.tweets || [];
  const groupedTweets: GroupedTweets[] = groupTweetsByDate(tweets);

  const openImageModal = (src: string) => {
    setModalImage(src);
  };

  return (
    <Wrapper>
      {groupedTweets.length ? (
        groupedTweets.map((group) => (
          <div key={group.date}>
            <p className="group-date">
              {moment(group.date).format("MMMM DD, YYYY")}
            </p>
            <Items variant="main">
              {group.tweets.map(({ tweet }, i) => (
                <ParsingItem key={i}>
                  <img
                    className="avatar"
                    src={getUserLogo(tweet.author.avatar)}
                    alt={tweet.author.username}
                    onError={setUserLogoFallback}
                  />
                  <div className="tweet-wrapper">
                    <div className="tweet">
                      {linkify(tweet.text)}
                      {tweet?.photos?.length ? (
                        <ItemImagesWrapper>
                          {tweet.photos.map((photo: string, idx: number) => (
                            <img
                              key={idx}
                              src={photo}
                              alt={tweet.name}
                              onClick={() => openImageModal(photo)}
                              style={{ cursor: "pointer" }}
                            />
                          ))}
                        </ItemImagesWrapper>
                      ) : null}
                      <div className="tweet-actions">
                        <button className="tweet-like">
                          <OtcLike variant="gray" status="default" />
                          <span>0</span>
                        </button>
                        <button className="tweet-like">
                          <RepostIcon />
                          <span>0</span>
                        </button>
                        <button className="tweet-like">
                          <ViewIcon />
                          <span>{tweet.views || 0}</span>
                        </button>
                      </div>
                    </div>
                    <div className="tweet-date">
                      {moment(tweet.createdAt).format("LT")}
                    </div>
                  </div>
                  <button
                    onClick={() =>
                      window.open(
                        `https://x.com/${tweet.username}/status/${tweet.id}`
                      )
                    }
                    className="open-btn"
                  >
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      width="18"
                      height="16"
                      viewBox="0 0 18 16"
                      fill="none"
                    >
                      <path
                        d="M10.3333 1L17 8M17 8L10.3333 15M17 8L1 8"
                        stroke="#738094"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                    </svg>
                  </button>
                </ParsingItem>
              ))}
            </Items>
          </div>
        ))
      ) : (
        <EmptyList />
      )}

      {modalImage && (
        <ImageModal src={modalImage} onClose={() => setModalImage(null)} />
      )}
    </Wrapper>
  );
};

export default MarketRadar;
