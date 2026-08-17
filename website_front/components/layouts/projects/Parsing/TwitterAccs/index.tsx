import React, { FC } from "react";
import { Wrapper, AccountCard } from "./styles";
import {
  getUserLogo,
  setUserLogoFallback,
} from "../../../../../helpers/imageFallbacks";
import { StarIcon } from "../../../../global/Icons";
import { clarifyAmount } from "../../../../../helpers/clarifyAmount";
import { useQuery } from "react-query";
import fetchTwitterAccs from "../../../../../http/parcing/fetchTwitterAccs";
import EmptySection from "../../../../global/EmptySection";
import moment from "moment";
import { IParcingTwitterAcc } from "../../../../../types/global_types";
import PlaceholderTable from "../../../../global/common/PlaceholderTable";
import { useTranslation } from "i18n";

function truncateText(text: string, maxLength: number): string {
  if (!text) return "";
  return text.length > maxLength ? `${text.slice(0, maxLength)}...` : text;
}

interface IProps {
  isLoading?: boolean;
  accounts: Array<IParcingTwitterAcc>;
}

const TwitterAccs: FC<IProps> = ({ isLoading, accounts }) => {
  const { translateText } = useTranslation();

  return (
    <Wrapper>
      {accounts ? (
        accounts.map((item, i: number) => {
          const tweet: any | null = item?.tweets?.length
            ? item?.tweets[0]
            : null;

          return (
            <AccountCard key={i} variant="main">
              <div className="user-info">
                <img
                  src={getUserLogo(item.avatar)}
                  alt={item.name}
                  onError={setUserLogoFallback}
                />
                <div className="user-details">
                  <div className="user-name">
                    <span>{item.name}</span>
                    <button>
                      <StarIcon variant="outlined" />
                    </button>
                  </div>
                  <div className="user-description">
                    {truncateText(item.description, 39)}
                  </div>
                  <div className="followers-info">
                    <div className="followers-item">
                      <div className="value">{item.followingCount}</div>
                      <span>{translateText("Following")}</span>
                    </div>
                    <div className="followers-item">
                      <div className="value">
                        {clarifyAmount(item.followersCount)}
                      </div>
                      <span>{translateText("Followers")}</span>
                    </div>
                  </div>
                </div>
              </div>
              <div className="tweet">{tweet ? tweet?.text || "" : "-"}</div>
              <div className="tweet-date">
                <span>@{item.username}</span>
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="4"
                  height="4"
                  viewBox="0 0 4 4"
                  fill="none"
                >
                  <path
                    d="M2.114 3.5C1.722 3.5 1.386 3.36467 1.106 3.094C0.835333 2.814 0.7 2.478 0.7 2.086C0.7 1.70333 0.835333 1.37667 1.106 1.106C1.386 0.835333 1.722 0.7 2.114 0.7C2.49667 0.7 2.82333 0.835333 3.094 1.106C3.36467 1.37667 3.5 1.70333 3.5 2.086C3.5 2.478 3.36467 2.814 3.094 3.094C2.82333 3.36467 2.49667 3.5 2.114 3.5Z"
                    fill="#738094"
                  />
                </svg>
                <span>
                  {tweet?.createdAt
                    ? moment(tweet?.createdAt).format("MMM DD")
                    : "-"}
                </span>
              </div>
              <div className="nav-btn">
                <button>
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    width="18"
                    height="16"
                    viewBox="0 0 18 16"
                    fill="none"
                  >
                    <path
                      d="M10.3333 1L17 8M17 8L10.3333 15M17 8L1 8"
                      stroke="#04A584"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                </button>
              </div>
            </AccountCard>
          );
        })
      ) : (
        <>
          <br />
          <br />
          <EmptySection />
        </>
      )}
    </Wrapper>
  );
};

export default TwitterAccs;
