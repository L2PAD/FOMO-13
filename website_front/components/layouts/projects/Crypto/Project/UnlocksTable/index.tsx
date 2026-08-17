import React, { FC } from "react";
import { Body, Header, Row, Wrapper } from "./styles";
import { UnlockTableRow } from "../../../../../../helpers/analyzeVestingSchedule";

interface IProps {
  vestingData: UnlockTableRow[];
}

const UnlocksTable: FC<IProps> = ({ vestingData }) => {
  const gridValue: string = `240px repeat(3, 170px)`;

  return (
    <Wrapper variant="main">
      <Header
        style={{
          display: "grid",
          gridTemplateColumns: gridValue,
        }}
      >
        <span className="sticky">Round</span>
        <span>Cliff Period</span>
        <span>Vesting Period</span>
        <span>Monthly Unlock %</span>
      </Header>

      {vestingData?.length ? (
        <Body>
          {vestingData.map((item: UnlockTableRow, index: number) => (
            <Row style={{ gridTemplateColumns: gridValue }} key={index}>
              <div className="item bold sticky">{item.round}</div>

              <div className="item bold">{item.cliffPeriod || "-"}</div>

              <div className="item bold">{item.vestingPeriod || "-"}</div>

              <div className="item bold">
                {item.monthlyUnlockPercent || "-"}
              </div>
            </Row>
          ))}
        </Body>
      ) : (
        <div style={{ padding: "20px", textAlign: "center" }}>
          No vesting data available
        </div>
      )}
    </Wrapper>
  );
};

export default UnlocksTable;
