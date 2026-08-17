import React, { FC } from "react";
import UsersRow from "../../../../../global/UsersRow";
import { Body, Header, Row, Wrapper } from "./styles";
import { simplifyAmount } from "../../../../../../helpers/simplifyAmount";
import EmptySection from "../../../../../global/EmptySection";
import moment from "moment";
import { Overflow } from "../../../../../global/common/BarDoubleChart/styles";

interface IProps {
  fundsRounds?: Array<any>;
}

const InvestmentsOverview: FC<IProps> = ({ fundsRounds }) => {
  const { totalRaised, allInvestors } = fundsRounds?.reduce(
    (prev, current) => {
      return {
        totalRaised: prev.totalRaised + current.fundsRaised,
        allInvestors: prev.allInvestors + (current.investors?.length || 0),
      };
    },
    { totalRaised: 0, allInvestors: 0 }
  );

  return (
    <Wrapper variant="main">
      <Overflow>
        <Header>
          <span className="sticky">Funding Stage</span>
          <span>Amount Raised</span>
          <span>Investors</span>
          <span>Last Funding Date</span>
        </Header>
        <Body>
          {fundsRounds?.length ? (
            fundsRounds.map((item, index: number) => {
              return (
                <Row key={index}>
                  <div className={`item ${index === 0 ? "sticky" : ""}`}>
                    {item.stage}
                  </div>
                  <div className="item">
                    ${simplifyAmount(item.fundsRaised || 0)}
                  </div>
                  <div className="item">
                    {item.investors?.length ? (
                      <UsersRow
                        users={item.investors.map((item: any) => {
                          return {
                            logo: item?.details?.logo || "",
                            name: item.name,
                          };
                        })}
                      />
                    ) : (
                      "-"
                    )}
                  </div>
                  <div className="item">{moment(item.date).format("ll")}</div>
                </Row>
              );
            })
          ) : (
            <>
              <br />
              <EmptySection />
              <br />
            </>
          )}
          {fundsRounds?.length ? (
            <Row>
              <div className="item bold">Total</div>
              <div className="item bold">${simplifyAmount(totalRaised)}</div>
              <div className="item bold">{allInvestors}</div>
              <div className="item" />
            </Row>
          ) : (
            <></>
          )}
        </Body>
      </Overflow>
    </Wrapper>
  );
};

export default InvestmentsOverview;
