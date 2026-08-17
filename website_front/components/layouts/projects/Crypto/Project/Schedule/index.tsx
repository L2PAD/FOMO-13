import React, { FC } from "react";
import { Wrapper, Header, Body, Row, Footer } from "./styles";
import { IProject } from "../../../../../../types/global_types";
import NewNotificationIcon from "../../../../../global/Icons/NewNotificationIcon";
import { clarifyAmount } from "../../../../../../helpers/clarifyAmount";
import { UnlockTableRow } from "../../../../../../helpers/analyzeVestingSchedule";
import moment from "moment";
import { resolveProjectTokenDisplaySymbol } from "../../../../../../helpers/projectTokenSymbol";

interface IProps {
  project: IProject;
  unlocks: Array<UnlockTableRow>;
  tokenSymbol?: string;
}

const Schedule: FC<IProps> = ({ project, unlocks, tokenSymbol }) => {
  const displaySymbol = tokenSymbol || resolveProjectTokenDisplaySymbol(project);

  return (
    <Wrapper variant="main">
      <Header>
        <div className="sticky">Round</div>
        <div>TGE %</div>
        <div>Cliff</div>
        <div className="header-bar">
          <span>Allocated</span>
          <span>Pending</span>
        </div>
        <div className="unlock">Next Unlock</div>
        <div>Timeline</div>
      </Header>
      <Body>
        {unlocks.map((item: UnlockTableRow) => {
          return (
            <Row key={item.id}>
              <div className="round sticky">
                <NewNotificationIcon isActive={false} />
                <div className="round-info">
                  <div className="round-header">
                    <span className="round-name">{item.round}</span>
                    <span className="round-percent">
                      {item.allocatedPercent}%
                    </span>
                  </div>
                  <div className="round-bottom">
                    {displaySymbol} {clarifyAmount(item.allocatedTokens)}
                  </div>
                </div>
              </div>
              <div className="value">{item.tgePercent}%</div>
              <div className="value">{item.cliffPeriod || "-"}</div>
              <div className="bar-wrapper">
                <div className="bar-header">
                  <div>
                    {displaySymbol}{" "}
                    {clarifyAmount(item.progress?.unlockedTokensAmount)}
                  </div>
                  <div>
                    {displaySymbol}{" "}
                    {clarifyAmount(item.progress?.lockedTokensAmount)}
                  </div>
                </div>
                <div className="bar">
                  <div
                    style={{
                      width: `${item.progress?.unlockedTokensPercent || 0}%`,
                    }}
                    className="bar-fill"
                  />
                </div>
                <div className="bar-bottom" />
              </div>
              <div className="lock">
                {item.progress?.nextTokenUnlockDate ? (
                  <span>
                    {moment(item.progress.nextTokenUnlockDate).format("ll")}
                  </span>
                ) : (
                  <>-</>
                )}
                {/* {item.progress?. ? <span>{item.nextPercent}</span> : "-"} */}
              </div>
              <div className="value">{item.timeline}</div>
            </Row>
          );
        })}
      </Body>
      <Footer>
        <div className="value">Total Unlocked</div>
        <div className="value">
          {displaySymbol}{" "}
          {clarifyAmount(
            unlocks[0]?.unlockDetails?.totalTokensUnlockedAmount || 0
          )}
        </div>
        <div className="info">
          <div className="value">
            {displaySymbol} {clarifyAmount(project.circulatingSupply || 0)}
          </div>
          <div className="percent">
            {unlocks[0]?.unlockDetails?.totalTokensUnlockedPercent}% of Supply
          </div>
        </div>
      </Footer>
    </Wrapper>
  );
};

export default Schedule;
