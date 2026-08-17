import React, { FC, useState } from "react";
import { Avatar } from "../common/UserAvatar/styles";
import { NewsWrapper, ParsingItem } from "./styles";
import { ArrowRightIcon } from "../Icons";
import { IGlobalLiveNews, IKeywordTweet } from "../../../types/global_types";
import moment from "moment";
import { useQuery } from "react-query";
import getLiveNews from "../../../http/news/getLiveNews";
import { linkify } from "../../layouts/projects/Parsing/CustomTwitterAccs";
import { ItemImagesWrapper } from "../../layouts/projects/Parsing/CustomTwitterAccs/styles";
import ImageModal from "../ImageModal";
import Placeholder from "../common/Placeholder";
import { PlaceholdersRow } from "../../layouts/projects/Crypto/FomoSpotlight/styles";
import OtcLike from "../Icons/OtcLike";
import RepostIcon from "../Icons/RepostIcon";
import ViewIcon from "../Icons/ViewIcon";
import Pagination from "../Pagintaion";
import { getUserLogo, setUserLogoFallback } from "../../../helpers/imageFallbacks";

interface IProps {
  page?: string | 'funds' | 'crypto' | 'funding-feed' | 'persons'
  liveNews?: Array<IKeywordTweet>;
}

const limit = 20

const NewsBlock: FC<IProps> = ({ page, liveNews }) => {
  const [pageNumber, setPageNumber] = useState<number>(1)
  const { data, isLoading } = useQuery("live-news", () => {
    return getLiveNews(`twitter/livenews/${page || 'crypto'}`);
  }, { refetchOnWindowFocus: false });
  const news: IKeywordTweet[] = data?.news || liveNews || []
  const [modalImage, setModalImage] = useState<string | null>(null);
  const total: number = data?.total || 0

  const openImageModal = (src: string) => {
    setModalImage(src);
  };

  return (
    <NewsWrapper>
      <div className="cards">
        {
          news?.length ?
            news.map((tweet: IKeywordTweet, i) =>
              tweet?.id
                ?
                (
                  <ParsingItem key={`${tweet.id}${i}`}>
                    <img
                      className="avatar"
                      src={getUserLogo(tweet.author.avatar)}
                      alt={tweet.author.screenName}
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
                                alt={tweet.author.name}
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
                        {moment(tweet.createdAt).format("MMM DD, HH:MM")}
                      </div>
                    </div>
                    <button
                      onClick={() =>
                        window.open(
                          `https://x.com/${tweet.author.screenName}/status/${tweet.id}`
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

                )
                :
                <div key={i}></div>
            )
            :
            <PlaceholdersRow>
              <Placeholder width="32%" height="250px" />
              <Placeholder width="32%" height="250px" />
              <Placeholder width="32%" height="250px" />
            </PlaceholdersRow>
        }
      </div>
      {Number(total) > limit ? (
        <Pagination
          onePageLimit={20}
          page={pageNumber}
          total={total}
          limit={total < pageNumber * limit ? total : pageNumber * limit}
          totalPage={Math.ceil(total / limit)}
          onChange={(value: any) => {
            setPageNumber(value);
            const anchor = document.getElementById("fake-anhor");
            if (anchor) {
              anchor.scrollIntoView({ behavior: "smooth", block: "start" });
            }
          }}
        />
      ) : (
        <></>
      )}
      {modalImage ? (
        <ImageModal src={modalImage} onClose={() => setModalImage(null)} />
      ) : (
        <></>
      )}
    </NewsWrapper>
  );
};

export default NewsBlock;
