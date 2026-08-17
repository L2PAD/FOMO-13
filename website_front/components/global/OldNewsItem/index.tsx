import React, { FC } from "react";
import { ParsingItem } from "./styles";
import EntityInfo from "../common/EntityInfo";
import { INews, IUser } from "../../../types/global_types";
import { linkify } from "../../layouts/projects/Parsing/CustomTwitterAccs";
import moment from "moment";
import HighlightedText from "../HighlightedText";
import {
  getUserLogo,
  setUserLogoFallback,
} from "../../../helpers/imageFallbacks";

interface IProps {
  item: INews;
  highlightSearchValue?: string;
}

const OldNewsItem: FC<IProps> = ({ item, highlightSearchValue = "" }) => {
  const author: IUser | null = item?.creator?.length ? item.creator[0] : null;

  return (
    <ParsingItem variant="main">
      {/* <EntityInfo
                size="medium"
                variant='default'
                rating={0}
                name={item.author || author?.name || author?.twitterData?.username || '-'}
                username={author?.name || '-'}
                img={author?.avatar || author?.twitterData?.photo || ''}
            /> */}
      <div className="tweet-title-wrapper">
        <div className="tweet-title">
          <HighlightedText
            text={item?.title || ""}
            searchValue={highlightSearchValue}
            highlightAll
            highlightVariant="news"
          />
        </div>
        <div className="title-right-wrapper">
          <div className="title-category">{item.type}</div>
          <button onClick={() => {}} className="open-btn">
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
        </div>
      </div>
      <div className="tweet-wrapper">
        <div className="tweet">{item.text}</div>
      </div>
      <div className="tweet-creator">
        {author?.photo || author?.twitterData?.photo ? (
          <img
            src={getUserLogo(author?.photo || author?.twitterData?.photo)}
            alt={item.author || author?.name || author?.twitterData.username}
            onError={setUserLogoFallback}
          />
        ) : (
          <></>
        )}
        <span>
          {item.author || author?.name || author?.twitterData.username}
        </span>
        <p>{moment(item.date).format("hh:mm a")}</p>
      </div>
    </ParsingItem>
  );
};

export default OldNewsItem;
