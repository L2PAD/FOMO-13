import React, { FC } from "react";
import RedFlag from "../../../RedFlag";
import { LikeIcon, NotificationIcon, StarIcon } from "../../../Icons";
import UserAvatar from "../../../common/UserAvatar";
import StatusTag from "../../../StatusTag";
import UsersRow from "../../../UsersRow";
import Typography from "../../../common/Typography";
import { clarifyAmount } from "../../../../../helpers/clarifyAmount";
import {
  ActionButton,
  ActionsWrapper,
  CardContentWrapper,
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
} from "./styles";
import Header from "./Header";

export interface ProjectTableInterface {
  cards: {
    id: string;
    avatar: string;
    rating: number;
    variant: "default" | "warn";
    status: "upcoming" | "ended" | "active";
    title: string;
    description: string;
    investors: { avatar: string; name: string }[];
    followers: number;
    redFlagsCount?: number;
    smScore: number;
    onClick?: () => void;
    onLike?: () => void;
    onNotify?: () => void;
    rendererContent?: any;
  }[];
  show: number;
  className?: string;
}

const ProjectTable: FC<ProjectTableInterface> = ({
  cards,
  show,
  className,
}) => {
  return (
    <TableWrapper className={className}>
      <Header />
      <CardsWrapper>
        {cards.map((item, i) => {
          if (show === 0 || show > i) {
            return (
              <CardWrapper
                key={i}
                variant={item.variant}
                onClick={item.onClick}
              >
                <CardContentWrapper>
                  <ProjectWrapper href={`social/${item.id}`}>
                    <UserAvatar
                      size="small"
                      variant="default"
                      avatar={item.avatar}
                      name={item.title}
                    />
                    <div>
                      <ProjectTitleWrapper>
                        <ProjectTitle variant="p">{item.title}</ProjectTitle>
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
                      ${clarifyAmount(item.followers)}
                    </Typography>
                  </TotalRaisedWrapper>
                  <LastFundingWrapper>
                    <Typography variant="p">{item.smScore}</Typography>
                  </LastFundingWrapper>
                  <RedFlagsWrapper>
                    {(item.redFlagsCount || 0) > 0 && (
                      <RedFlag count={item.redFlagsCount} />
                    )}
                  </RedFlagsWrapper>
                  <RatingWrapper>
                    <StarIcon fill="#FFC702" />
                    <Typography variant="p">{item.rating}/100</Typography>
                  </RatingWrapper>
                  <ActionsWrapper>
                    <ActionButton>
                      <NotificationIcon fill="#738094" />
                    </ActionButton>
                    <ActionButton>
                      <LikeIcon fill="#738094" />
                    </ActionButton>
                  </ActionsWrapper>
                </CardContentWrapper>
              </CardWrapper>
            );
          }
          return null;
        })}
      </CardsWrapper>
    </TableWrapper>
  );
};

export default ProjectTable;
