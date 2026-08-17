import React from "react";
import UserAvatar from "../../../../../global/common/UserAvatar";
import { clarifyAmount } from "../../../../../../helpers/clarifyAmount";
import PercentValue from "../../../../../global/common/PercentValue";
import imageLoader from "../../../../../../helpers/imageLoader";
import { Body, Header, Row, Wrapper } from "./styles";

const projects = [
  {
    logo: "/a1c10d6216d050870b65a457fef9ebd5.png",
    name: "QuantumAI",
    niche: "AI & DeFi",
    investedRound: "Strategic",
    investedAmount: 20000000,
    currentRoi: 5.2,
    status: "Active",
    exitDate: "-",
  },
  {
    logo: "/b4645038cd4a53fd723d2d5692201fe6.png",
    name: "MetaAi",
    niche: "AI",
    investedRound: "Series A",
    investedAmount: 15000000,
    currentRoi: 4.8,
    status: "Active",
    exitDate: "-",
  },
  {
    logo: "/c64d5df45b10d601e2da3657396bb307.png",
    name: "DeFix",
    niche: "DeFi & Liquidity",
    investedRound: "Seed",
    investedAmount: 10000000,
    currentRoi: 3.1,
    status: "Exit",
    exitDate: "Feb 08, 2025",
    exitRoi: 4.2,
  },
  {
    logo: "/a1c10d6216d050870b65a457fef9ebd5.png",
    name: "QuantumAI",
    niche: "AI & DeFi",
    investedRound: "Strategic",
    investedAmount: 20000000,
    currentRoi: 5.2,
    status: "Active",
    exitDate: "-",
  },
  {
    logo: "/b4645038cd4a53fd723d2d5692201fe6.png",
    name: "MetaAi",
    niche: "AI",
    investedRound: "Series A",
    investedAmount: 15000000,
    currentRoi: 4.8,
    status: "Active",
    exitDate: "-",
  },
  {
    logo: "/c64d5df45b10d601e2da3657396bb307.png",
    name: "DeFix",
    niche: "DeFi & Liquidity",
    investedRound: "Seed",
    investedAmount: 10000000,
    currentRoi: 3.1,
    status: "Exit",
    exitDate: "Feb 08, 2025",
    exitRoi: 4.2,
  },
  {
    logo: "/a1c10d6216d050870b65a457fef9ebd5.png",
    name: "QuantumAI",
    niche: "AI & DeFi",
    investedRound: "Strategic",
    investedAmount: 20000000,
    currentRoi: 5.2,
    status: "Active",
    exitDate: "-",
  },
  {
    logo: "/b4645038cd4a53fd723d2d5692201fe6.png",
    name: "MetaAi",
    niche: "AI",
    investedRound: "Series A",
    investedAmount: 15000000,
    currentRoi: 4.8,
    status: "Active",
    exitDate: "-",
  },
  {
    logo: "/c64d5df45b10d601e2da3657396bb307.png",
    name: "DeFix",
    niche: "DeFi & Liquidity",
    investedRound: "Seed",
    investedAmount: 10000000,
    currentRoi: 3.1,
    status: "Exit",
    exitDate: "Feb 08, 2025",
    exitRoi: 4.2,
  },
];

const InvestmentHistory = () => {
  return (
    <Wrapper variant="main">
      <Header>
        <div>Project Name</div>
        <div>Invested Round</div>
        <div>Amount Invested</div>
        <div>Current ROI</div>
        <div>Status</div>
        <div>Exit Date</div>
        <div>Exit ROI</div>
      </Header>
      <Body>
        {projects.map((item, i: number) => {
          return (
            <Row key={i}>
              <div className="project">
                <UserAvatar
                  avatar={imageLoader(item.logo)}
                  name={item.name}
                  variant="default"
                  size="small"
                  fallbackType="project"
                />
                <div className="project-info">
                  <div>{item.name}</div>
                  <span>{item.niche}</span>
                </div>
              </div>
              <div className="value">{item.investedRound}</div>
              <div className="bold">${clarifyAmount(item.investedAmount)}</div>
              <div className="roi">
                <PercentValue
                  value={item.currentRoi}
                  size="small"
                  isLabel={false}
                  isIcon={false}
                  rightLabel="x"
                />
              </div>
              <div className={`status ${item.status}`}>{item.status}</div>
              <div className="value">{item.exitDate}</div>
              <div className="roi">
                {item.exitRoi ? (
                  <PercentValue
                    value={item.exitRoi}
                    size="small"
                    isLabel={false}
                    isIcon={false}
                    rightLabel="x"
                  />
                ) : (
                  <>-</>
                )}
              </div>
            </Row>
          );
        })}
      </Body>
    </Wrapper>
  );
};

export default InvestmentHistory;
