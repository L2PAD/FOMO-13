import React, { useContext, useEffect, useState } from "react";
import useComments from "../../../../hooks/useComments";
import { FlexWrapper, PageWrapper, Score, Table } from "./styles";
import Typography from "../../../global/common/Typography";
import CommentBlock from "../../../global/CommentBlock";
import fetchProjects from "../../../../http/projects/fetchProjects";
import ActivityLeaderboard from "../ActivityLeaderboard";
import {
  PageDescription,
  SearchIconStyle,
  SearchInput,
  SearchWrapper,
} from "../../projects/Networks/styles";
import { AuthContext } from "../../../global/Layout";
import sliceAddress from "../../../../helpers/sliceAddress";
import { useQuery } from "react-query";
import { getLeaderBoardData } from "../../../../smart/initialSmartMain";
import Loader from "../../../global/loader";

const Leaderboard = () => {
  const [userRankData, setUserRankData] = useState<any>({});
  const [smartLoading, setSmartLoading] = useState<boolean>(false);
  const [list, setList] = useState<Array<any>>([]);
  const { data } = useQuery("poolLeaderboard", () => fetchProjects("gemslab"));
  const { comments, confirmAddComment } = useComments(
    "comments/gemslab",
    "comments/gemslab"
  );
  const { userData } = useContext(AuthContext);
  const [searchValue, setSearchValue] = useState("");

  useEffect(() => {
    if (!data?.projects?.length) return;

    const currentProject = data?.projects.find((pr) => pr.isMainProject);

    if (!currentProject?.poolId) return;

    setSmartLoading(true);

    getLeaderBoardData(currentProject?.poolId).then(
      ({ boardList, userData }) => {
        setList(Array.isArray(boardList) ? boardList : []);
        setUserRankData(userData);
        setSmartLoading(false);
      }
    );
  }, [data?.projects]);

  if (smartLoading) return <Loader isVisible />;

  return (
    <PageWrapper>
      <Typography variant="h1">Leaderboard</Typography>
      <br />
      <PageDescription variant="p">
        Leaderboard is designed to make your investments activity fair and
        interesting. Gain access to investing by taking certain steps.
      </PageDescription>
      <SearchWrapper>
        <SearchInput
          value={searchValue}
          onChange={(value) => setSearchValue(value)}
          placeholder="Search the project/fund/person"
          type="text"
          leftIcon={<SearchIconStyle />}
        />
      </SearchWrapper>
      <br />
      <FlexWrapper>
        <div>
          <Typography variant="h2">My score</Typography>
          <Score>
            <div>
              <span>Rank:</span>
              <p>{userRankData?.rank}</p>
            </div>
            <div>
              <span>Address:</span>
              <p>{sliceAddress(userData.wallet)}</p>
            </div>
            <div>
              <span>Projects participated:</span>
              <p>0</p>
            </div>
            <div>
              <span>Total score:</span>
              <p>{userRankData?.totalScore}</p>
            </div>
            <div>
              <span>Status:</span>
              <div className={`${userRankData?.status}`} />
            </div>
          </Score>
        </div>
        <div>
          <Typography variant="h2">Leaderboard</Typography>
          <Table variant="default">
            <div className="header">
              <p>Rank</p>
              <p>Address</p>
              <p>Total score</p>
            </div>
            {list?.map((item, i) => (
              <div className="row" key={i}>
                <p className="rank">{item.rank}</p>
                <p className="address">{sliceAddress(item.address)}</p>
                <p className="score">{item.totalScore}</p>
              </div>
            ))}
          </Table>
          <br />
          {/* <Pagination
            page={page}
            total={20}
            limit={50}
            totalPage={20}
            onChange={(value) => setPage(value)}
          /> */}
        </div>
      </FlexWrapper>
      <ActivityLeaderboard wallet={userData.wallet} />
      <CommentBlock items={comments} addComment={confirmAddComment} />
    </PageWrapper>
  );
};

export default Leaderboard;
