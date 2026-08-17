import React from "react";
import moment from "moment";
import {
  CardsWrapper,
  CardWrapper,
  InvestorsWrapper,
  LastFundingWrapper,
  ProjectWrapper,
  StatusWrapper,
  TableWrapper,
  TotalRaisedWrapper,
} from "./styles";
import Header from "./Header";

const ProjectTable = () => {
  return (
    <TableWrapper>
      <Header />
      <CardsWrapper>
        {Array(10)
          .fill("")
          .map((item, i) => {
            return (
              <CardWrapper key={i} variant="default">
                <ProjectWrapper>BREED</ProjectWrapper>
                <StatusWrapper>$1.8M</StatusWrapper>
                <InvestorsWrapper>
                  {moment().format("DD MMM, YYYY HH:mm")}
                </InvestorsWrapper>
                <TotalRaisedWrapper>
                  {moment().format("DD MMM, YYYY HH:mm")}
                </TotalRaisedWrapper>
                <LastFundingWrapper>
                  <button>Claim</button>
                </LastFundingWrapper>
              </CardWrapper>
            );
          })}
      </CardsWrapper>
    </TableWrapper>
  );
};

export default ProjectTable;
