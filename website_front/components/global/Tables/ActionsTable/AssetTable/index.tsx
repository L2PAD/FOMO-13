/* eslint-disable */
import React, { FC } from "react";
import { useSelector } from "react-redux";
import UsersRow from "../../../UsersRow";
import {
  CalendarIcon,
  EditIcon,
  LikeIcon,
  NotificationIcon,
} from "../../../Icons";
import { clarifyAmount } from "../../../../../helpers/clarifyAmount";
import { authState } from "../../../../../store/slices/authSlice";
import {
  ActionsWrapper,
  AssetWrapper,
  BigAvatar,
  CardsWrapper,
  CardWrapper,
  ColValue,
  DateValue,
  EditButton,
  LastWrapper,
  NumerationWrapper,
  ProjectTitle,
  ProjectTitleWrapper,
  PublicWrapper,
  RangeValue,
  RangeWrapper,
  SeedWrapper,
  StageWrapper,
  SupplyWrapper,
  TableWrapper,
  Tag,
  UpcomingWrapper,
} from "./styles";
import Header from "./Header";

export interface AssetTableInterface {
  cards: {
    avatar: string;
    title: string;
    images: { avatar: string; name: string }[];
    tokenSupply: {
      percentage: number;
      plus: number;
    };
    publicVesting: {
      percentage: number;
      left: number;
    };
    stage: string;
    upcoming: string;
    last: string;
    price: {
      percentage: number;
      amount: number;
    };
    onClick?: () => void;
    onCalendar?: () => void;
    onNotify?: () => void;
    onLike?: () => void;
  }[];
  show: number;
  className?: string;
}

const AssetTable: FC<AssetTableInterface> = ({ cards, className, show }) => {
  return (
    <TableWrapper className={className}>
      <Header />
      <CardsWrapper>
        {cards.map((item, i) => {
          if (show === 0 || show > i) {
            return (
              <CardWrapper key={i} variant="default" onClick={item.onClick}>
                <NumerationWrapper>{i + 1}</NumerationWrapper>
                <AssetWrapper>
                  <BigAvatar
                    size="small"
                    variant="default"
                    avatar={item.avatar}
                    name={item.title}
                  />
                  <div>
                    <ProjectTitleWrapper>
                      <ProjectTitle variant="p">{item.title}</ProjectTitle>
                      <UsersRow users={[]} />
                      {false && (
                        <EditButton>
                          <EditIcon fill="#00C099" />
                        </EditButton>
                      )}
                    </ProjectTitleWrapper>
                  </div>
                </AssetWrapper>
                <SupplyWrapper amount={item.price.percentage}>
                  ${item.price.amount} <span>{item.price.percentage}%</span>
                </SupplyWrapper>
                <PublicWrapper>
                  <ColValue variant="p">
                    {item.tokenSupply.percentage}%{" "}
                    <span>
                      (+{clarifyAmount(item.tokenSupply.plus)} tokens)
                    </span>
                  </ColValue>
                  <RangeWrapper>
                    <RangeValue percentage={item.tokenSupply.percentage} />
                  </RangeWrapper>
                </PublicWrapper>
                <SeedWrapper>
                  <ColValue variant="p">
                    next {item.publicVesting.percentage}%{" "}
                    <span>({item.publicVesting.left}mon. left)</span>
                  </ColValue>
                  <RangeWrapper>
                    <RangeValue percentage={item.publicVesting.percentage} />
                  </RangeWrapper>
                </SeedWrapper>
                <StageWrapper>
                  <Tag variant="p">{item.stage}</Tag>
                </StageWrapper>
                <UpcomingWrapper>
                  <DateValue variant="p">{item.upcoming}</DateValue>
                </UpcomingWrapper>
                <LastWrapper>
                  <DateValue variant="p">{item.last}</DateValue>
                </LastWrapper>
                <ActionsWrapper>
                  <button>
                    <CalendarIcon />
                  </button>
                  <button>
                    <NotificationIcon />
                  </button>
                  <button>
                    <LikeIcon />
                  </button>
                </ActionsWrapper>
              </CardWrapper>
            );
          }
          return null;
        })}
      </CardsWrapper>
    </TableWrapper>
  );
};

export default AssetTable;
