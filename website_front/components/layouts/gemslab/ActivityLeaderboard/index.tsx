import React, { FC, useContext, useState } from "react";
import { useQuery } from "react-query";
import Typography from "../../../global/common/Typography";
import CommentBlock from "../../../global/CommentBlock";
import Pagination from "../../../global/Pagintaion";
import fetchLeaderboard from "../../../../http/leaderboard/fetchLeaderboard";
import {
  PageDescription,
  SearchIconStyle,
  SearchInput,
  SearchWrapper,
} from "../../projects/Networks/styles";
import { IActivityLeaderboard } from "../../../../types/global_types";
import sliceAddress from "../../../../helpers/sliceAddress";
import {
  FlexWrapper,
  PageWrapper,
  Score,
  Table,
  TitleWrapper,
  LeaderboardDetails,
  LeaderboardDetailsTitle,
  LeaderboardDetailsDescription,
} from "./styles";

const data = [
  {
    rank: 1,
    address: "0xc038...d4a82",
    score: 480.05,
  },
  {
    rank: 2,
    address: "0xc038...d4a82",
    score: 480.05,
  },
  {
    rank: 3,
    address: "0xc038...d4a82",
    score: 480.05,
  },
  {
    rank: 4,
    address: "0xc038...d4a82",
    score: 480.05,
  },
  {
    rank: 5,
    address: "0xc038...d4a82",
    score: 480.05,
  },
  {
    rank: 6,
    address: "0xc038...d4a82",
    score: 480.05,
  },
  {
    rank: 7,
    address: "0xc038...d4a82",
    score: 480.05,
  },
  {
    rank: 8,
    address: "0xc038...d4a82",
    score: 480.05,
  },
  {
    rank: 9,
    address: "0xc038...d4a82",
    score: 480.05,
  },
  {
    rank: 10,
    address: "0xc038...d4a82",
    score: 480.05,
  },
];

interface IProps {
  wallet: string;
}

const ActivityLeaderboard: FC<IProps> = ({ wallet }) => {
  const { data } = useQuery("leaderboard", () => fetchLeaderboard(wallet));
  const [searchValue, setSearchValue] = useState("");
  const [page, setPage] = useState(1);

  return (
    <PageWrapper>
      <TitleWrapper>
        <Typography variant="h1">Activity leaderboard</Typography>
      </TitleWrapper>
      <br />
      <PageDescription variant="p">
        Stake & Invite friends to rank up
      </PageDescription>
      <LeaderboardDetails>
        <LeaderboardDetailsTitle>
          View my place in the table
        </LeaderboardDetailsTitle>
        <LeaderboardDetailsDescription>
          Congratulations! You are <span>{data?.userRank || 0}th</span> in the
          Leaderboard!
        </LeaderboardDetailsDescription>
      </LeaderboardDetails>
      <Table variant="default">
        <div className="header">
          <p>Rank</p>
          <p>Address</p>
          <p>Partners</p>
          <p>Staking NFT</p>
          <p>Creater</p>
          <p>Tasks</p>
          <p>Investments quanity</p>
          <p>Points</p>
          <p>Total score</p>
        </div>
        {data?.leaderboard.map((item: IActivityLeaderboard, i: number) => (
          <div className="row" key={i}>
            <p>{i + 1}</p>
            <p>{sliceAddress(item.address)}</p>
            <p>{item.partners || "0"}</p>
            <p>{item.stakingNft || "0"}</p>
            <p>{item.creater || "0"}</p>
            <p>{item.tasks || "0"}</p>
            <p>{item.investmentsQuanity || "0"}</p>
            <p>{item.points}</p>
            <p>{item.totalScore || "0"}</p>
          </div>
        ))}
      </Table>
      <br />
    </PageWrapper>
  );
};

export default ActivityLeaderboard;
