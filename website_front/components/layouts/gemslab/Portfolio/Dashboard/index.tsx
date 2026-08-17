import React, { FC, useState } from "react";
import { RightColumnTitle } from "../../../projects/Crypto/Project/crypto-styles";
import { TimeButton } from "../../../../global/common/PriceChart/styles";
import InfoIcon from "../../../../global/Icons/InfoIcon";
import UserAvatar from "../../../../global/common/UserAvatar";
import imageLoader from "../../../../../helpers/imageLoader";
import DescriptionComponent from "../../../../global/common/DescriptionComponent";
import {
  DashboardCardValue,
  DashboardPercentValue,
  DashboardWrapper,
  DescriptionWrapper,
  InfoWrapper,
  Item,
  PerformancePlaceholder,
  Row,
  Wrapper,
} from "./styles";
import {
  CardKey,
  CardRow,
  ChartWrapper,
  PercentKey,
  PercentUpdateItem,
  PercentUpdates,
  PerformanceHeader,
  StatisticsCard,
  StatisticsWrapper,
} from "../../../projects/Crypto/Project/ProjectPriceStatistics/styles";
import moment from "moment";
import { simplifyAmount } from "../../../../../helpers/simplifyAmount";
import CustomSelect from "../../../../global/common/CustomSelect";
import { IPortfolio } from "../../../../../types/global_types";

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

interface IProps {
  portfolio?: IPortfolio
  isEmpty?: boolean;
}

const PortfolioDashboard: FC<IProps> = ({ isEmpty, portfolio }) => {
  const [dashboardTab, setDashboardTab] = useState<string>("24H");
  const [selectedCurrency, setSelectedCurrency] = useState<string>('usd')
  const [activeModals, setActiveModals] = useState<Array<string>>([""]);
  const shouldMuteValues = Boolean(isEmpty);

  const addModal = (name: string): void => {
    if (activeModals.includes(name)) return;

    setActiveModals((prev: Array<string>) => {
      return [...prev, name];
    });
  };

  const hideModal = (name: string): void => {
    setActiveModals((prev: Array<string>) => {
      return prev.filter((item: string) => item !== name);
    });
  };

  const formatCurrency = (value: number | string | null | undefined): string => {
    const normalizedValue =
      typeof value === "number"
        ? value
        : typeof value === "string"
          ? Number(String(value).replace(/[^0-9.-]/g, ""))
          : 0;

    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }).format(Number.isFinite(normalizedValue) ? normalizedValue : 0);
  };

  const formatPercent = (value: number): string => {
    return `${value >= 0 ? '+' : ''}${value.toFixed(2)}%`;
  };

  const getValueClass = (value: number): string => {
    return value >= 0 ? "green" : "red";
  };

  const getPerformanceValue = (label: string): number => {
    if (isEmpty || !portfolio) return 0;

    const performance = portfolio[`performance${label}` as keyof IPortfolio] as any;
    const value = Number(performance?.[selectedCurrency]);

    return Number.isFinite(value) ? value : 0;
  };

  const renderPerformanceValue = (performanceValue: number): React.ReactNode => {
    if (performanceValue === 0) {
      return (
        <PerformancePlaceholder $isMuted={shouldMuteValues}>
          --
        </PerformancePlaceholder>
      );
    }

    return (
      <DashboardPercentValue
        $isMuted={shouldMuteValues}
        $value={performanceValue}
        isIcon={false}
        value={performanceValue}
      />
    );
  };

  return (
    <DashboardWrapper>
      <Wrapper variant="main">
        <Row $isMuted={shouldMuteValues}>
          <InfoWrapper>
            Current Balance
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
                text={balanceText}
                isVisible={activeModals.includes("balance")}
              />
            </DescriptionWrapper>
          </InfoWrapper>
          <div className="values">
            <div className="value">
              {isEmpty ? "$0.00" : formatCurrency(portfolio?.totalBalance || 0)}
            </div>

          </div>
        </Row>

        <Row $isMuted={shouldMuteValues}>
          <InfoWrapper>
            Total Profit
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
                text={changeText}
                isVisible={activeModals.includes("change")}
              />
            </DescriptionWrapper>
          </InfoWrapper>
          <div className={`value ${getValueClass(portfolio?.profitPercent || 0)}`}>
            {isEmpty ? "$0.00 (0%)" :
              `${portfolio?.profitPercent && portfolio.profitPercent >= 0 ? '+' : ''}${formatCurrency(portfolio?.profit || 0)} (${formatPercent(portfolio?.profitPercent || 0)})`}
          </div>
        </Row>

        <Row $isMuted={shouldMuteValues}>
          <InfoWrapper>
            Realized Profit
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
                text={realizedText}
                isVisible={activeModals.includes("realized")}
              />
            </DescriptionWrapper>
          </InfoWrapper>
          <div className="value">
            {isEmpty ? "$0.00" : formatCurrency(portfolio?.realizedProfit || 0)}
          </div>
        </Row>

        <Row $isMuted={shouldMuteValues}>
          <InfoWrapper>
            Unrealized Profit
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
                text={unrealizedText}
                isVisible={activeModals.includes("unrealized")}
              />
            </DescriptionWrapper>
          </InfoWrapper>
          <div className={`value ${getValueClass(portfolio?.unrealizedProfit || 0)}`}>
            {isEmpty ? "$0.00" :
              `${portfolio?.unrealizedProfit && portfolio.unrealizedProfit >= 0 ? '+' : ''}${formatCurrency(portfolio?.unrealizedProfit || 0)}`}
          </div>
        </Row>

        <Row $isMuted={shouldMuteValues}>
          <InfoWrapper>
            Total Invested
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
                text={totalAmountText}
                isVisible={activeModals.includes("totalAmountText")}
              />
            </DescriptionWrapper>
          </InfoWrapper>
          <div className="value">
            {isEmpty ? "$0.00" : formatCurrency(portfolio?.totalInvested || 0)}
          </div>
        </Row>
      </Wrapper>

      <StatisticsCard variant="main">
        <CardRow>
          <CardKey>ATH Balance - {isEmpty ? '' : new Date(portfolio?.athDate || '').toLocaleDateString()}</CardKey>
          <DashboardCardValue $isMuted={shouldMuteValues}>
            <div>${simplifyAmount(isEmpty ? 0 : portfolio?.ath || 0)}</div>
          </DashboardCardValue>
        </CardRow>
        <CardRow>
          <CardKey>ATL Balance - {isEmpty ? '' : new Date(portfolio?.atlDate || '').toLocaleDateString()}</CardKey>
          <DashboardCardValue $isMuted={shouldMuteValues}>
            <div>${simplifyAmount(isEmpty ? 0 : portfolio?.atl || 0)}</div>
          </DashboardCardValue>
        </CardRow>
      </StatisticsCard>

      <StatisticsCard variant="main">
        <PerformanceHeader>
          <CardKey>Performance</CardKey>
          {/* {
            !isEmpty
              ?
              <CustomSelect
                placeholder="USD"
                className="small-select"
                onChange={(value: string) => setSelectedCurrency(value)}
                options={[
                  { label: "USD", value: "usd" },
                  { label: "ETH", value: "eth" },
                  { label: "BTC", value: "btc" },
                ]}
              />
              :
              <></>
          } */}
        </PerformanceHeader>

        {

          <PercentUpdates>
            {["1h", "24h", "7d", "30d", "90d", "1y"].map((label) => {
              const performanceValue = getPerformanceValue(label);

              return (
                <PercentUpdateItem key={label}>
                  {renderPerformanceValue(performanceValue)}
                  <PercentKey>{label}</PercentKey>
                </PercentUpdateItem>
              )
            })}
          </PercentUpdates>
        }

      </StatisticsCard>
    </DashboardWrapper>
  );
};

export default PortfolioDashboard;
