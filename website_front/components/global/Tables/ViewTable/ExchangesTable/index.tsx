import React, { FC } from "react";
import UserAvatar from "../../../common/UserAvatar";
import Typography from "../../../common/Typography";
import { clarifyAmount } from "../../../../../helpers/clarifyAmount";
import {
  CardNumber,
  CardsWrapper,
  CardWrapper,
  ExchangeBody,
  ProjectTitle,
  ProjectTitleWrapper,
  ProjectWrapper,
  TableWrapper,
  TotalRaisedWrapper,
  TypeWrapper,
} from "./styles";
import Header from "./Header";
import { IFlattenedTicker } from "../../../../../types/global_types";

export interface ExchangeTableInterface {
  cards: IFlattenedTicker[];
  className?: string;
}

const ExchangeTable: FC<ExchangeTableInterface> = ({ cards, className }) => {
  return (
    <ExchangeBody>
      <TableWrapper className={className}>
        <Header />
        <CardsWrapper>
          {cards.map((item, i) => {
            return (
              <CardWrapper key={`${item.link}${i}`}>
                <CardNumber>{item.index || 0}</CardNumber>
                <Typography className="bold sticky" variant="div">
                  {item.quote ? `${item.base}/${item.quote}` : item.base}
                </Typography>
                <TotalRaisedWrapper>
                  <Typography variant="p">
                    ${clarifyAmount(item.priceUsd)}
                  </Typography>
                </TotalRaisedWrapper>
                <ProjectWrapper
                  onClick={() => item?.link && window.open(item.link)}
                  tabIndex={0}
                >
                  {item.exchangeImage ? (
                    <UserAvatar
                      size="otc"
                      variant="default"
                      avatar={item.exchangeImage}
                      name={item.exchangeName}
                    />
                  ) : null}
                  <div>
                    <ProjectTitleWrapper>
                      <ProjectTitle variant="p">
                        {item.exchangeName}
                      </ProjectTitle>
                    </ProjectTitleWrapper>
                  </div>
                </ProjectWrapper>
                <TotalRaisedWrapper>
                  <Typography variant="p">
                    ${clarifyAmount(item.volume24h)}
                  </Typography>
                </TotalRaisedWrapper>
                <TypeWrapper>
                  {typeof item.volume24Percent === "number"
                    ? `${item.volume24Percent.toFixed(1)}%`
                    : "-"}
                </TypeWrapper>
              </CardWrapper>
            );
          })}
        </CardsWrapper>
      </TableWrapper>
    </ExchangeBody>
  );
};

export default ExchangeTable;
