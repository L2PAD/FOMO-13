import React, { FC } from "react";
import RedFlag from "../../../RedFlag";
import { StarIcon } from "../../../Icons";
import UserAvatar from "../../../common/UserAvatar";
import StatusTag from "../../../StatusTag";
import UsersRow from "../../../UsersRow";
import Typography from "../../../common/Typography";
import { clarifyAmount } from "../../../../../helpers/clarifyAmount";
import {
  CardsWrapper,
  CardWrapper,
  InvestorsWrapper,
  LastFundingWrapper,
  ProjectDescription,
  ProjectTitle,
  ProjectTitleWrapper,
  ProjectWrapper,
  RatingWrapper,
  RedFlagsWrapper,
  ResultsWrapper,
  StatusWrapper,
  TableWrapper,
  TotalRaisedWrapper,
  TypeWrapper,
} from "./styles";
import Header from "./Header";
import { INft } from "../../../../../types/global_types";
import imageLoader from "../../../../../helpers/imageLoader";

export interface WatchlistTableInterface {
  cards: Array<any>;
}

interface IWatchlistNft extends INft {
  onClick: () => void;
}

const WatchlistTable: FC<WatchlistTableInterface> = ({ cards }) => {
  return (
    <TableWrapper>
      <Header />
      <CardsWrapper>
        {cards.map((item: IWatchlistNft, i) => {
          return (
            <CardWrapper
              key={item._id}
              variant={item.redStatus ? "warn" : "default"}
              onClick={item.onClick}
            >
              <ProjectWrapper>
                <UserAvatar
                  size="small"
                  variant="default"
                  avatar={imageLoader(String(item.logo))}
                  name={item.name}
                  fallbackType="project"
                />
                <div>
                  <ProjectTitleWrapper>
                    <ProjectTitle variant="p">{item.name}</ProjectTitle>
                    <span>{item.fullness}</span>
                  </ProjectTitleWrapper>
                  <ProjectDescription variant="p">
                    {item.banner}
                  </ProjectDescription>
                </div>
              </ProjectWrapper>
              <StatusWrapper>
                <StatusTag variant={item.status} />
              </StatusWrapper>
              <InvestorsWrapper>
                <UsersRow users={[]} />
                <Typography variant="p">
                  Total:{" "}
                  <span>
                    {item?.investors?.length || 0}{" "}
                    {item?.investors?.length || 0 ? "investors" : "investor"}
                  </span>
                </Typography>
              </InvestorsWrapper>
              <TotalRaisedWrapper>
                <Typography variant="p">
                  {item.floorPrice
                    ? `$${clarifyAmount(Number(item.floorPrice))}`
                    : "$0"}
                </Typography>
              </TotalRaisedWrapper>
              <LastFundingWrapper>
                <Typography variant="p">{item.items || "-"}</Typography>
              </LastFundingWrapper>
              <TypeWrapper>{item.type || "-"}</TypeWrapper>
              <ResultsWrapper />
              <RedFlagsWrapper>
                {(item.redFlags?.length || 0) > 0 && (
                  <RedFlag count={item.redFlags?.length} />
                )}
              </RedFlagsWrapper>
              <RatingWrapper>
                <StarIcon fill="#FFC702" />
                <Typography variant="p">{item.rating}/100</Typography>
              </RatingWrapper>
            </CardWrapper>
          );
        })}
      </CardsWrapper>
    </TableWrapper>
  );
};

export default WatchlistTable;
