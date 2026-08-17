import React, { useState } from "react";
import { DescriptionWrapper, InfoWrapper, Item, Row, Wrapper } from "./styles";
import { RightColumnTitle } from "../../../Crypto/Project/crypto-styles";
import { TimeButton } from "../../../../../global/common/PriceChart/styles";
import InfoIcon from "../../../../../global/Icons/InfoIcon";
import UserAvatar from "../../../../../global/common/UserAvatar";
import imageLoader from "../../../../../../helpers/imageLoader";
import DescriptionComponent from "../../../../../global/common/DescriptionComponent";
import { useTranslation } from "i18n";
import { IFund } from "../../../../../../types/global_types";
import { clarifyAmount } from "../../../../../../helpers/clarifyAmount";

const balanceText = `
The current total valuation of the portfolio, including all assets. 
The <span class="bold">24-hour</span> profit change is displayed next to it.    
`;

const changeText = `
    Shows the absolute change in the total portfolio value over the last 
    <span class="bold">24 hours</span> in both monetary and percentage terms.
`;

const realizedText = `
    The fixed profit or loss from selling assets, representing the amount already secured after closing positions.
`;

const unrealizedText = `
    The current profit or loss from assets still held in the portfolio, which fluctuates with market changes.
`;

const totalAmountText = `
    The total amount of capital invested across all portfolio assets, excluding profits or losses.
`;

const gainerText = `
    The most profitable asset over the last <span class="bold">24 hours</span>, showing the highest positive growth.    
`;

const loserText = `
    The asset with the largest price drop over the last <span class="bold">24 hours</span>.
`;

const toFiniteNumber = (value: any): number => {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : 0;
};

const formatAmount = (value: any): string => {
  const parsed = toFiniteNumber(value);
  if (!parsed || parsed <= 0) return "-";

  return `$${clarifyAmount(parsed)}`;
};

const formatRoi = (value: any): string => {
  const parsed = toFiniteNumber(value);
  if (!parsed) return "-";
  if (Math.abs(parsed) <= 20) return `${parsed.toFixed(2).replace(/\.00$/, "")}x`;

  return `${parsed > 0 ? "+" : ""}${Math.round(parsed)}%`;
};

const FundDashboard = ({ fund }: { fund: IFund }) => {
  const { translateText } = useTranslation();
  const [dashboardTab, setDashboardTab] = useState<string>("24H");
  const [activeModals, setActiveModals] = useState<Array<string>>([""]);
  const currentBalance =
    fund.currentAum ||
    fund.investAmount ||
    fund.stats?.totalInvestedAmount ||
    fund.totalRaised;
  const topGainer = (fund.supportedProjects || [])
    .filter((item) => toFiniteNumber(item.roi) > 0)
    .sort((a, b) => toFiniteNumber(b.roi) - toFiniteNumber(a.roi))[0];
  const topLoser = (fund.supportedProjects || [])
    .filter((item) => toFiniteNumber(item.roi) < 0)
    .sort((a, b) => toFiniteNumber(a.roi) - toFiniteNumber(b.roi))[0];

  const addModal = (name: string): void => {
    if (activeModals.includes("name")) return;

    setActiveModals((prev: Array<string>) => {
      return [...prev, name];
    });
  };

  const hideModal = (name: string): void => {
    setActiveModals((prev: Array<string>) => {
      return prev.filter((item: string) => item !== name);
    });
  };

  return (
    <>
      <RightColumnTitle>
        <h2>{translateText("Dashboard")}</h2>
        <div className="buttons">
          <TimeButton
            onClick={() => setDashboardTab("24H")}
            active={dashboardTab === "24H"}
          >
            24H
          </TimeButton>
          <TimeButton
            onClick={() => setDashboardTab("7D")}
            active={dashboardTab === "7D"}
          >
            7D
          </TimeButton>
          <TimeButton
            onClick={() => setDashboardTab("30D")}
            active={dashboardTab === "30D"}
          >
            30D
          </TimeButton>
          <TimeButton
            onClick={() => setDashboardTab("YTD")}
            active={dashboardTab === "YTD"}
          >
            YTD
          </TimeButton>
        </div>
      </RightColumnTitle>
      <Wrapper variant="main">
        <Row>
          <InfoWrapper>
            {translateText("Current Balance")}
            <button
              onMouseEnter={() => addModal("balance")}
              onMouseLeave={() => hideModal("balance")}
            >
              <InfoIcon />
            </button>
            <DescriptionWrapper>
              <DescriptionComponent
                className="small-modal"
                date={new Date()}
                isDate={false}
                text={translateText("Current Balance description")}
                isVisible={activeModals.includes("balance")}
              />
            </DescriptionWrapper>
          </InfoWrapper>
          <div className="values">
            <div className="value">{formatAmount(currentBalance)}</div>
            <div className="value">{formatRoi(fund.roi || fund.averageRoi)}</div>
          </div>
        </Row>
        <Row>
          <InfoWrapper>
            {translateText("Change")}
            <button
              onMouseEnter={() => addModal("change")}
              onMouseLeave={() => hideModal("change")}
            >
              <InfoIcon />
            </button>
            <DescriptionWrapper>
              <DescriptionComponent
                className="small-modal"
                date={new Date()}
                isDate={false}
                text={translateText("Change description")}
                isVisible={activeModals.includes("change")}
              />
            </DescriptionWrapper>
          </InfoWrapper>
          <div className="value">-</div>
        </Row>
        <Row>
          <InfoWrapper>
            {translateText("Realized Profit")}
            <button
              onMouseEnter={() => addModal("realized")}
              onMouseLeave={() => hideModal("realized")}
            >
              <InfoIcon />
            </button>
            <DescriptionWrapper>
              <DescriptionComponent
                className="small-modal"
                date={new Date()}
                isDate={false}
                text={translateText("Realized Profit description")}
                isVisible={activeModals.includes("realized")}
              />
            </DescriptionWrapper>
          </InfoWrapper>
          <div className="value">-</div>
        </Row>
        <Row>
          <InfoWrapper>
            {translateText("Unrealized Profit")}
            <button
              onMouseEnter={() => addModal("unrealized")}
              onMouseLeave={() => hideModal("unrealized")}
            >
              <InfoIcon />
            </button>
            <DescriptionWrapper>
              <DescriptionComponent
                className="small-modal"
                date={new Date()}
                isDate={false}
                text={translateText("Unrealized Profit description")}
                isVisible={activeModals.includes("unrealized")}
              />
            </DescriptionWrapper>
          </InfoWrapper>
          <div className="value">-</div>
        </Row>
        <Row>
          <InfoWrapper>
            {translateText("Total Invested")}
            <button
              onMouseEnter={() => addModal("totalAmountText")}
              onMouseLeave={() => hideModal("totalAmountText")}
            >
              <InfoIcon />
            </button>
            <DescriptionWrapper>
              <DescriptionComponent
                className="small-modal"
                date={new Date()}
                isDate={false}
                text={translateText("Total Invested description")}
                isVisible={activeModals.includes("totalAmountText")}
              />
            </DescriptionWrapper>
          </InfoWrapper>
          <div className="value">{formatAmount(fund.stats?.totalInvestedAmount || fund.totalRaised)}</div>
        </Row>
        {topGainer ? (
        <Item>
          <InfoWrapper>
            {translateText("Top Gainer")}
            <button
              onMouseEnter={() => addModal("gainerText")}
              onMouseLeave={() => hideModal("gainerText")}
            >
              <InfoIcon />
            </button>
            <DescriptionWrapper>
              <DescriptionComponent
                className="small-modal"
                date={new Date()}
                isDate={false}
                text={translateText("Top Gainer description")}
                isVisible={activeModals.includes("gainerText")}
              />
            </DescriptionWrapper>
          </InfoWrapper>
          <div className="item-info">
            <div className="project">
              <UserAvatar
                variant="default"
                avatar={imageLoader(String(topGainer.logo || topGainer.image || ""))}
                name={topGainer.name}
                size="small"
                fallbackType="project"
              />
              <div className="project-info">
                <div>{topGainer.name}</div>
                <span>{topGainer.category || topGainer.stage || "-"}</span>
              </div>
            </div>
            <div className="values">
              <div className="value green">{formatRoi(topGainer.roi)}</div>
            </div>
          </div>
        </Item>
        ) : null}
        {topLoser ? (
        <Item>
          <InfoWrapper>
            {translateText("Top Loser")}
            <button
              onMouseEnter={() => addModal("loserText")}
              onMouseLeave={() => hideModal("loserText")}
            >
              <InfoIcon />
            </button>
            <DescriptionWrapper>
              <DescriptionComponent
                className="small-modal"
                date={new Date()}
                isDate={false}
                text={translateText("Top Loser description")}
                isVisible={activeModals.includes("loserText")}
              />
            </DescriptionWrapper>
          </InfoWrapper>
          <div className="item-info">
            <div className="project">
              <UserAvatar
                variant="default"
                avatar={imageLoader(String(topLoser.logo || topLoser.image || ""))}
                name={topLoser.name}
                size="small"
                fallbackType="project"
              />
              <div className="project-info">
                <div>{topLoser.name}</div>
                <span>{topLoser.category || topLoser.stage || "-"}</span>
              </div>
            </div>
            <div className="values">
              <div className="value red">{formatRoi(topLoser.roi)}</div>
            </div>
          </div>
        </Item>
        ) : null}
      </Wrapper>
    </>
  );
};

export default FundDashboard;
