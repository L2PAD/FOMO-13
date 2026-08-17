import React, { FC } from "react";
import RedFlag from "../../../RedFlag";
import { StarIcon } from "../../../Icons";
import UserAvatar from "../../../common/UserAvatar";
import StatusTag from "../../../StatusTag";
import UsersRow from "../../../UsersRow";
import Typography from "../../../common/Typography";
import { clarifyAmount } from "../../../../../helpers/clarifyAmount";
import { clarifyDate } from "../../../../../helpers/clarifyDate";
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
  TagWrapper,
  TotalRaisedWrapper,
  TypeWrapper,
} from "./styles";
import Header from "./Header";

export interface GemsLabTableInterface {
  cards: {
    userAvatar: string;
    userName: string;
    userRating: number;
    variant: "default" | "warn";
    status: "upcoming" | "ended" | "active";
    title: string;
    percentage: number;
    description: string;
    investors: { avatar: string; name: string }[];
    redFlagsCount?: number;
    totalAmount: number;
    lastFundingDate: string;
    type: string;
    onClick?: () => void;
    price: number;
    priceCurrency: number;
  }[];
  className?: string;
}

const GemsLabTable: FC<GemsLabTableInterface> = ({ cards, className }) => {
  return (
    <TableWrapper className={className}>
      <Header />
      <CardsWrapper>
        {cards.map((item, i) => {
          return (
            <CardWrapper key={i} variant={item.variant} onClick={item.onClick}>
              <ProjectWrapper>
                <UserAvatar
                  size="small"
                  variant="default"
                  avatar={item.userAvatar}
                  name={item.userName}
                />
                <div>
                  <ProjectTitleWrapper>
                    <ProjectTitle variant="p">{item.title}</ProjectTitle>
                    <span>{item.percentage}%</span>
                  </ProjectTitleWrapper>
                  <ProjectDescription variant="p">
                    {item.description}
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
                    {item.investors.length}{" "}
                    {item.investors.length > 1 ? "investors" : "investor"}
                  </span>
                </Typography>
              </InvestorsWrapper>
              <TotalRaisedWrapper>
                <Typography variant="p">
                  ${clarifyAmount(item.totalAmount)}
                </Typography>
              </TotalRaisedWrapper>
              <LastFundingWrapper>
                <Typography variant="p">
                  {clarifyDate(item.lastFundingDate)}
                </Typography>
              </LastFundingWrapper>
              <TypeWrapper>{item.type}</TypeWrapper>
              <TagWrapper>
                <Typography variant="p">{item.priceCurrency} ETH</Typography>
              </TagWrapper>
              <RedFlagsWrapper>
                {(item.redFlagsCount || 0) > 0 && (
                  <RedFlag count={item.redFlagsCount} />
                )}
              </RedFlagsWrapper>
              <RatingWrapper>
                <StarIcon fill="#FFC702" />
                <Typography variant="p">{item.userRating}/100</Typography>
              </RatingWrapper>
            </CardWrapper>
          );
        })}
      </CardsWrapper>
    </TableWrapper>
  );
};

export default GemsLabTable;
