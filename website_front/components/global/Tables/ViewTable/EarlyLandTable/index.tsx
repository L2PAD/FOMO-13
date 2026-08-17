import React, { FC } from "react";
import { IProject } from "../../../../../types/global_types";
import RedFlag from "../../../RedFlag";
import { CircleCheckIcon, StarIcon } from "../../../Icons";
import UserAvatar from "../../../common/UserAvatar";
import StatusTag from "../../../StatusTag";
import Typography from "../../../common/Typography";
import Header from "./Header";
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
  StatusWrapper,
  TableWrapper,
  TotalRaisedWrapper,
  TypeWrapper,
} from "./styles";
import imageLoader from "../../../../../helpers/imageLoader";

interface IProps {
  cards: Array<IProject>;
  className: string;
}

const EarlyLandTable: FC<IProps> = ({ cards, className }) => {
  return (
    <TableWrapper className={className}>
      <Header />
      <CardsWrapper>
        {cards.map((item: IProject, i: number) => {
          return (
            <CardWrapper
              key={item._id}
              variant={item.redStatus ? "warn" : "default"}
              onClick={() => console.log(item._id)}
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
                    <span>0%</span>
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
                <Typography variant="p">
                  <span>{item.fullness}</span>
                </Typography>
              </InvestorsWrapper>
              <TotalRaisedWrapper>
                <Typography variant="p">{item.activityType || "-"}</Typography>
              </TotalRaisedWrapper>
              <LastFundingWrapper>
                <Typography variant="p">
                  {item.reward ? item.reward : "Unknown"}
                </Typography>
              </LastFundingWrapper>
              <TypeWrapper>{item.type || "-"}</TypeWrapper>
              <RedFlagsWrapper>
                {(item.redFlagsList?.length || 0) > 0 && (
                  <RedFlag count={item.redFlagsList?.length} />
                )}
              </RedFlagsWrapper>
              <RatingWrapper>
                <StarIcon fill="#FFC702" />
                <Typography variant="p">{item.rating || 0}/100</Typography>
                <CircleCheckIcon fill="rgba(4, 165, 132, 0.5)" />
              </RatingWrapper>
            </CardWrapper>
          );
        })}
      </CardsWrapper>
    </TableWrapper>
  );
};

export default EarlyLandTable;
