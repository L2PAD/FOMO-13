/* eslint-disable */
import React, { FC } from "react";
import RedFlag from "../../../RedFlag";
import { StarIcon } from "../../../Icons";
import UserAvatar from "../../../common/UserAvatar";
import StatusTag from "../../../StatusTag";
import UsersRow from "../../../UsersRow";
import Typography from "../../../common/Typography";
import { clarifyAmount } from "../../../../../helpers/clarifyAmount";
import { clarifyDate } from "../../../../../helpers/clarifyDate";
import { IProject } from "../../../../../types/global_types";
import imageLoader from "../../../../../helpers/imageLoader";
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
  ResultItem,
  ResultsWrapper,
  StatusWrapper,
  TableWrapper,
  TagCircle,
  TagWrapper,
  TotalRaisedWrapper,
  TypeWrapper,
} from "./styles";
import Header from "./Header";

export interface ProjectTableInterface {
  cards: Array<IProject>;
  className?: string;
}

const ProjectTable: FC<ProjectTableInterface> = ({ cards, className }) => {
  return (
    <TableWrapper className={className}>
      <Header />
      <CardsWrapper>
        {cards?.map((item: IProject, i) => {
          return (
            <CardWrapper key={i} variant={"default"} onClick={() => {}}>
              <ProjectWrapper>
                <UserAvatar
                  size="small"
                  variant="default"
                  avatar={
                    item.metadataLogo || imageLoader(String(item.logo) || "")
                  }
                  name={item.name}
                  fallbackType="project"
                />
                <div>
                  <ProjectTitleWrapper>
                    <ProjectTitle variant="p">{item.name}</ProjectTitle>
                    <span>{item.fullness || "0%"}</span>
                  </ProjectTitleWrapper>
                  <ProjectDescription variant="p">
                    {item.bio}
                  </ProjectDescription>
                </div>
              </ProjectWrapper>
              <StatusWrapper>
                <StatusTag variant={item.status} />
              </StatusWrapper>
              <InvestorsWrapper>
                <UsersRow users={item.investors || []} />
                <Typography variant="p">
                  Total:{" "}
                  <span>
                    {item.investors.length}{" "}
                    {item.investors.length > 1 ? "investors" : "investor"}
                  </span>
                </Typography>
              </InvestorsWrapper>
              <TotalRaisedWrapper>
                <Typography variant="p">
                  ${clarifyAmount(Number(item.totalRaised))}
                </Typography>
              </TotalRaisedWrapper>
              <LastFundingWrapper>
                <Typography variant="p">
                  {clarifyDate(String(item.lastFunding))}
                </Typography>
              </LastFundingWrapper>
              <TypeWrapper>{item.niche}</TypeWrapper>
              {item.status === "ended" ? (
                <ResultsWrapper>
                  <ResultItem variant="p" amount={0}>
                    USD <br /> <span>{0}x</span>
                  </ResultItem>
                  <ResultItem variant="p" amount={0}>
                    BTC <br /> <span>{0}x</span>
                  </ResultItem>
                  <ResultItem variant="p" amount={0}>
                    ETH <br /> <span>{0}x</span>
                  </ResultItem>
                </ResultsWrapper>
              ) : (
                <TagWrapper>
                  <TagCircle />
                  <Typography variant="p">{item.banner}</Typography>
                </TagWrapper>
              )}
              <RedFlagsWrapper>
                {(Number(item.redFlags) || 0) > 0 && (
                  <RedFlag count={Number(item.redFlags)} />
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

export default ProjectTable;
