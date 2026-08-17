/* eslint-disable */
import React, { FC } from "react";
import RedFlag from "../../../RedFlag";
import { StarIcon } from "../../../Icons";
import UserAvatar from "../../../common/UserAvatar";
import UsersRow from "../../../UsersRow";
import Typography from "../../../common/Typography";
import {
  ATHRoiWrapper,
  CardsWrapper,
  CardWrapper,
  CurrentRoiWrapper,
  FundsWrapper,
  ProjectDescription,
  ProjectTitle,
  ProjectTitleWrapper,
  ProjectWrapper,
  RatingWrapper,
  RedFlagsWrapper,
  TableWrapper,
} from "./styles";
import Header from "./Header";
import imageLoader from "../../../../../helpers/imageLoader";

export interface FundTableInterface {
  cards: {
    logo: string;
    name: string;
    rating: any;
    redFlags: number;
    banner: string;
    onClick?: () => void;
  }[];
  className?: string;
}

const FundTable: FC<FundTableInterface> = ({ cards, className }) => {
  return (
    <TableWrapper className={className}>
      <Header />
      <CardsWrapper>
        {cards.map((item, i) => {
          return (
            <CardWrapper key={i} variant={"default"} onClick={item.onClick}>
              <FundsWrapper>
                <UserAvatar
                  size="small"
                  variant="default"
                  avatar={imageLoader(item.logo)}
                  name={item.name}
                  fallbackType="project"
                />
                <div>
                  <ProjectTitleWrapper>
                    <ProjectTitle variant="p">{item.name}</ProjectTitle>
                    <span>{0}%</span>
                  </ProjectTitleWrapper>
                  <ProjectDescription variant="p">
                    {item.banner}
                  </ProjectDescription>
                </div>
              </FundsWrapper>
              <ProjectWrapper>
                <UsersRow users={[]} />
                <Typography variant="p">
                  Total:{" "}
                  <span>
                    {[].length} {[].length > 1 ? "investors" : "investor"}
                  </span>
                </Typography>
              </ProjectWrapper>
              <ATHRoiWrapper more={0 > 0} variant="p">
                {0 > 0 && "+"}
                {0}%
              </ATHRoiWrapper>
              <CurrentRoiWrapper more={0 > 0} variant="p">
                {0 > 0 && "+"}
                {0}% {Math.ceil(0 / 100)}x
              </CurrentRoiWrapper>
              <RedFlagsWrapper>
                {(item.redFlags || 0) > 0 && <RedFlag count={item.redFlags} />}
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

export default FundTable;
