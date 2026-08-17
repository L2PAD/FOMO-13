import React, { FC } from "react";
import Header from "./Header";
import {
  CardsWrapper,
  CardWrapper,
  NumerationWrapper,
  ProjectTitle,
  ProjectTitleWrapper,
  ProjectWrapper,
  ResultsWrapper,
  TableWrapper,
} from "./styles";
import UserAvatar from "../../../common/UserAvatar";
import Typography from "../../../common/Typography";

export interface NFTsTableInterface {
  cards: {
    userAvatar: string;
    userName: string;
    variant: "default" | "warn";
    title: string;
    description: string;
    floorPrice: number;
    volume1: number;
    volume7: number;
    totalVolume: number;
    sellers: string;
    marketCap: number;
    floorPrice1: number;
    listed: string;
    royalty_fee: string;
    supplyListed: string;
    owners: string;
    supply: string;
    contractAddress: string;
    id: string;
    onClick?: () => void;
  }[];
  className?: string;
}

const NFTsTable: FC<NFTsTableInterface> = ({ cards, className }) => {
  return (
    <TableWrapper className={className}>
      <Header />
      <CardsWrapper>
        {cards.map((item, i) => {
          return (
            <CardWrapper key={i} variant={item.variant} onClick={item.onClick}>
              <NumerationWrapper>{i + 1}</NumerationWrapper>
              <ProjectWrapper>
                <UserAvatar
                  size="small"
                  variant="default"
                  avatar={item.userAvatar}
                  name={item.userName}
                />
                <ProjectTitleWrapper>
                  <ProjectTitle variant="p">{item.title}</ProjectTitle>
                </ProjectTitleWrapper>
              </ProjectWrapper>
              <ResultsWrapper>
                <Typography variant="p">
                  {item.floorPrice?.toFixed(2)} ETH
                </Typography>
              </ResultsWrapper>
              <ResultsWrapper>
                <Typography variant="p">{item.volume1?.toFixed(2)}</Typography>
              </ResultsWrapper>
              <ResultsWrapper>{item.volume7?.toFixed(2)}</ResultsWrapper>
              <ResultsWrapper>{item.totalVolume?.toFixed(2)}</ResultsWrapper>
              <ResultsWrapper>{item.sellers}</ResultsWrapper>
              <ResultsWrapper>{item.marketCap?.toFixed(2)}</ResultsWrapper>
              <ResultsWrapper>{item.floorPrice1?.toFixed(2)}</ResultsWrapper>
              <ResultsWrapper>{item.listed}</ResultsWrapper>
              <ResultsWrapper>{item.royalty_fee}</ResultsWrapper>
              <ResultsWrapper>{item.supplyListed}</ResultsWrapper>
              <ResultsWrapper>{item.owners}</ResultsWrapper>
              <ResultsWrapper>{item.supply}</ResultsWrapper>
            </CardWrapper>
          );
        })}
      </CardsWrapper>
    </TableWrapper>
  );
};

export default NFTsTable;
