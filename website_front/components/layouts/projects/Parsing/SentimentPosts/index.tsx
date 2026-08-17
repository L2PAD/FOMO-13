import React, { FC, useState } from "react";
import { Wrapper, Header, SearchKeywords, Items, ParsingItem } from "./styles";
import {
  SearchIconStyle,
  SearchInput,
  SearchWrapper,
} from "../../P2PExchange/styles";
import EntityInfo from "../../../../global/common/EntityInfo";
import {
  IKeywordTweet,
  IParcingTwitterAcc,
} from "../../../../../types/global_types";
import EmptyList from "../../../../global/EmptyList";
import moment from "moment";
import Pagination from "../../../../global/Pagintaion";
import { SelectedItems } from "../CustomTwitterAccs/styles";
import { CloseIcon } from "../../../../global/Icons";
import { useQuery } from "react-query";
import fetchTwitterKeywords, {
  IKeywordsReturnData,
} from "../../../../../http/parcing/fetchTwitterKeywords";
import { linkify } from "../CustomTwitterAccs";
import { useDebounce } from "../../../../../hooks/useDebounce";
import PlaceholderTable from "../../../../global/common/PlaceholderTable";
import { useTranslation } from "i18n";

const limit = 20;

interface IProps {
  type?: "public" | "private";
}

const SentimentsPostsParsing: FC<IProps> = ({ type = "public" }) => {
  const { translateText } = useTranslation();
  const [excludedKeywords, setExcludedKeywords] = useState<string[]>([]);
  const [searchValue, setSearchValue] = useState<string>("");
  const debouncedSearch = useDebounce(searchValue, 300);
  const [page, setPage] = useState<number>(1);
  const [isReset, setIsReset] = useState<boolean>(false);
  const { data, isLoading } = useQuery(
    ["posts-sentiments", type, debouncedSearch, page, excludedKeywords],
    () =>
      fetchTwitterKeywords(
        `/${type}/keywords/trending?searchValue=${debouncedSearch}&offset=${(page - 1) * limit}&limit=${limit * page}&isSentiments=true&excludedKeywords=${excludedKeywords.join(",")}`
      ),
    { refetchInterval: 60 * 1000, refetchOnWindowFocus: false }
  );
  const totalCount: number = data?.total || 0;

  return (
    <Wrapper>
      <Header>
        <div className="title">{translateText("Live Parsing")}</div>
        <div className="description">
          {translateText("Updated automatically every hour")}
        </div>
      </Header>
      {isLoading ? (
        <>
          <br />
          <PlaceholderTable />
          <br />
        </>
      ) : (
        <></>
      )}
      <SearchKeywords id="fake-anhor">
        <SearchWrapper>
          <SearchInput
            className="small-input"
            type="text"
            placeholder={translateText("Type a keyword/phrase")}
            onFocus={(value: boolean) => {}}
            onChange={(value: string) => setSearchValue(value)}
            leftIcon={<SearchIconStyle />}
            value={searchValue}
          />
        </SearchWrapper>
        <SelectedItems>
          {data?.keywords.map((item: string, i: number) => (
            <div key={`${item}${i}`}>
              <span>{item}</span>
              <button
                onClick={() => {
                  setExcludedKeywords((prev) => [...prev, item]);
                  setIsReset(true);
                }}
              >
                <CloseIcon fill="#738094" />
              </button>
            </div>
          ))}
          {isReset ? (
            <button
              className="reset-btn"
              onClick={() => {
                setIsReset(false);
                setExcludedKeywords([]);
              }}
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="13"
                height="12"
                viewBox="0 0 13 12"
                fill="none"
              >
                <path
                  d="M1.74776 7.66797C2.42642 9.79726 4.37008 11.3346 6.66194 11.3346C9.5182 11.3346 11.8337 8.94682 11.8337 6.0013C11.8337 3.05578 9.5182 0.667969 6.66194 0.667969C4.74768 0.667969 3.07632 1.7405 2.18211 3.33464M3.75285 4.0013H1.16699V1.33464"
                  stroke="#738094"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
              <span>{translateText("Reset")}</span>
            </button>
          ) : (
            <></>
          )}
        </SelectedItems>
      </SearchKeywords>
      <Items variant="main">
        {data?.tweets.length ? (
          data.tweets.map((data: IKeywordsReturnData, i) => {
            const tweet: IKeywordTweet | null = data.tweet || null;
            if (!tweet) return null;
            return (
              <ParsingItem key={i}>
                <EntityInfo
                  size="medium"
                  variant="default"
                  rating={0}
                  name={tweet.author.name}
                  username={tweet.author.screenName}
                  niche={`@${tweet.author.screenName}`}
                  img={tweet.author.avatar || ""}
                />
                <div className="tweet-wrapper">
                  <div className="tweet">{linkify(tweet.text)}</div>
                  <div className="tweet-date">
                    {moment(tweet.createdAt).fromNow()}
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
            );
          })
        ) : (
          <EmptyList />
        )}
      </Items>
      {totalCount > limit ? (
        <Pagination
          onePageLimit={20}
          page={page}
          total={totalCount}
          limit={totalCount < page * limit ? totalCount : page * limit}
          totalPage={Math.ceil(totalCount / limit)}
          onChange={(value: any) => {
            setPage(value);
            const anchor = document.getElementById("fake-anhor");
            if (anchor) {
              anchor.scrollIntoView({ behavior: "smooth", block: "start" });
            }
          }}
        />
      ) : (
        <></>
      )}
    </Wrapper>
  );
};

export default SentimentsPostsParsing;
