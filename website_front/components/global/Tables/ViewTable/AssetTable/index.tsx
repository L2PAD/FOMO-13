import React, { FC } from "react";
import { clarifyAmount } from "../../../../../helpers/clarifyAmount";
import Header from "./Header";
import {
  AssetWrapper,
  BigAvatar,
  CardsWrapper,
  CardWrapper,
  ColValue,
  DateValue,
  LastWrapper,
  PrivateWrapper,
  ProjectTitle,
  ProjectTitleWrapper,
  PublicWrapper,
  RangeValue,
  RangeWrapper,
  SeedWrapper,
  SmallAvatar,
  StageWrapper,
  StrategicWrapper,
  SupplyWrapper,
  TableWrapper,
  Tag,
  UpcomingWrapper,
} from "./styles";

export interface AssetTableInterface {
  cards: {
    avatar: string;
    title: string;
    images: string[];
    tokenSupply: {
      percentage: number;
      plus: number;
    };
    publicVesting: {
      percentage: number;
      left: number;
    };
    seedVesting: {
      percentage: number;
      left: number;
    };
    privateVesting: {
      percentage: number;
      left: number;
    };
    strategicVesting: {
      percentage: number;
      left: number;
    };
    stage: string;
    upcoming: string;
    last: string;
    onClick?: () => void;
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
                      {item.images.map((item, i) => {
                        return (
                          <SmallAvatar
                            key={i}
                            size="xSmall"
                            variant="default"
                            avatar={item}
                            name="asset"
                          />
                        );
                      })}
                    </ProjectTitleWrapper>
                  </div>
                </AssetWrapper>
                <SupplyWrapper>
                  <ColValue variant="p">
                    {item.tokenSupply.percentage}%{" "}
                    <span>
                      (+{clarifyAmount(item.tokenSupply.plus)} tokens)
                    </span>
                  </ColValue>
                  <RangeWrapper>
                    <RangeValue percentage={item.tokenSupply.percentage} />
                  </RangeWrapper>
                </SupplyWrapper>
                <PublicWrapper>
                  <ColValue variant="p">
                    next {item.publicVesting.percentage}%{" "}
                    <span>({item.publicVesting.left}mon. left)</span>
                  </ColValue>
                  <RangeWrapper>
                    <RangeValue percentage={item.publicVesting.percentage} />
                  </RangeWrapper>
                </PublicWrapper>
                <SeedWrapper>
                  <ColValue variant="p">
                    next {item.seedVesting.percentage}%{" "}
                    <span>({item.seedVesting.left}mon. left)</span>
                  </ColValue>
                  <RangeWrapper>
                    <RangeValue percentage={item.seedVesting.percentage} />
                  </RangeWrapper>
                </SeedWrapper>
                <PrivateWrapper>
                  <ColValue variant="p">
                    next {item.privateVesting.percentage}%{" "}
                    <span>({item.privateVesting.left}mon. left)</span>
                  </ColValue>
                  <RangeWrapper>
                    <RangeValue percentage={item.privateVesting.percentage} />
                  </RangeWrapper>
                </PrivateWrapper>
                <StrategicWrapper>
                  <ColValue variant="p">
                    next {item.strategicVesting.percentage}%{" "}
                    <span>({item.strategicVesting.left}mon. left)</span>
                  </ColValue>
                  <RangeWrapper>
                    <RangeValue percentage={item.strategicVesting.percentage} />
                  </RangeWrapper>
                </StrategicWrapper>
                <StageWrapper>
                  <Tag variant="p">{item.stage}</Tag>
                </StageWrapper>
                <UpcomingWrapper>
                  <DateValue variant="p">{item.upcoming}</DateValue>
                </UpcomingWrapper>
                <LastWrapper>
                  <DateValue variant="p">{item.last}</DateValue>
                </LastWrapper>
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
