import React, { FC } from "react";
import { Activity, CircleDollarSign, Trophy } from "lucide-react";
import InfoIcon from "../../../../global/Icons/InfoIcon";
import { IPortfolio } from "../../../../../types/global_types";
import {
  CoreMetricCard,
  CoreMetricsRail,
  CorePerformanceGrid,
} from "../coreStyles";

interface CorePortfolioMetricsProps {
  portfolio: IPortfolio;
}

interface MetricLabelProps {
  label: string;
  tooltip: string;
}

const METRIC_TOOLTIPS = {
  totalProfit:
    "Shows the absolute change in the total portfolio value over the last 24 hours in both monetary and percentage terms.",
  realized:
    "The fixed profit or loss from selling assets, representing the amount already secured after closing positions.",
  unrealized:
    "The current profit or loss from assets still held in the portfolio, which fluctuates with market changes.",
  totalInvested:
    "The total amount of capital invested across all portfolio assets, excluding profits or losses.",
} as const;

const MetricLabel: FC<MetricLabelProps> = ({ label, tooltip }) => (
  <span className="metric-label-with-info">
    {label}
    <button
      className="metric-info-button"
      type="button"
      aria-label={`About ${label}`}
    >
      <InfoIcon />
      <span className="metric-tooltip" role="tooltip">
        {tooltip}
      </span>
    </button>
  </span>
);

const toNumber = (value: unknown): number => {
  const numericValue = Number(value || 0);
  return Number.isFinite(numericValue) ? numericValue : 0;
};

const formatUsd = (value: unknown, signed = false): string => {
  const numericValue = toNumber(value);
  const formatted = new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    notation: Math.abs(numericValue) >= 1_000_000 ? "compact" : "standard",
    minimumFractionDigits: Math.abs(numericValue) >= 1_000_000 ? 0 : 2,
    maximumFractionDigits: 2,
  }).format(Math.abs(numericValue));

  if (!signed || numericValue === 0) return formatted;
  return `${numericValue > 0 ? "+" : "-"}${formatted}`;
};

const formatPercent = (value: unknown): string => {
  const numericValue = toNumber(value);
  return `${numericValue > 0 ? "+" : ""}${numericValue.toFixed(2)}%`;
};

const getTone = (value: unknown): "positive" | "negative" | "" => {
  const numericValue = toNumber(value);
  if (numericValue > 0) return "positive";
  if (numericValue < 0) return "negative";
  return "";
};

const hasNumericValue = (value: unknown): boolean => {
  if (value === null || value === undefined) return false;
  if (typeof value === "string" && value.trim() === "") return false;

  return Number.isFinite(Number(value));
};

const formatDate = (value?: string | Date): string => {
  if (!value) return "--";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "--";

  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  }).format(date);
};

const CorePortfolioMetrics: FC<CorePortfolioMetricsProps> = ({ portfolio }) => {
  const performance = [
    ["1h", portfolio.performance1h?.usd],
    ["24h", portfolio.performance24h?.usd],
    ["7d", portfolio.performance7d?.usd],
    ["30d", portfolio.performance30d?.usd],
    ["90d", portfolio.performance90d?.usd],
    ["1y", portfolio.performance1y?.usd],
  ] as const;

  return (
    <CoreMetricsRail aria-label="Portfolio statistics">
      <CoreMetricCard>
        <div className="metric-card-title">
          <span className="metric-card-icon">
            <CircleDollarSign aria-hidden="true" />
          </span>
          Profitability
        </div>
        <div className="metric-row">
          <MetricLabel
            label="Total invested"
            tooltip={METRIC_TOOLTIPS.totalInvested}
          />
          <strong>{formatUsd(portfolio.totalInvested)}</strong>
        </div>
        <div className="metric-row">
          <MetricLabel
            label="Total P&L"
            tooltip={METRIC_TOOLTIPS.totalProfit}
          />
          <strong className={getTone(portfolio.profit)}>
            {formatUsd(portfolio.profit, true)}
          </strong>
        </div>
        <div className="metric-row">
          <MetricLabel
            label="Unrealized"
            tooltip={METRIC_TOOLTIPS.unrealized}
          />
          <strong className={getTone(portfolio.unrealizedProfit)}>
            {formatUsd(portfolio.unrealizedProfit, true)}
          </strong>
        </div>
        <div className="metric-row">
          <MetricLabel label="Realized" tooltip={METRIC_TOOLTIPS.realized} />
          <strong className={getTone(portfolio.realizedProfit)}>
            {formatUsd(portfolio.realizedProfit, true)}
          </strong>
        </div>
      </CoreMetricCard>

      <CoreMetricCard>
        <div className="metric-card-title">
          <span className="metric-card-icon">
            <Trophy aria-hidden="true" />
          </span>
          Balance range
        </div>
        <div className="metric-row">
          <span>{`All Time High - ${formatDate(portfolio.athDate)}`}</span>
          <strong>{formatUsd(portfolio.ath)}</strong>
        </div>
        <div className="metric-row">
          <span>{`All Time Low - ${formatDate(portfolio.atlDate)}`}</span>
          <strong>{formatUsd(portfolio.atl)}</strong>
        </div>
      </CoreMetricCard>

      <CoreMetricCard>
        <div className="metric-card-title">
          <span className="metric-card-icon">
            <Activity aria-hidden="true" />
          </span>
          Performance
        </div>
        <CorePerformanceGrid>
          {performance.map(([label, value]) => (
            <div className="performance-cell" key={label}>
              <strong className={getTone(value)}>
                {hasNumericValue(value) ? formatPercent(value) : "--"}
              </strong>
              <span>{label}</span>
            </div>
          ))}
        </CorePerformanceGrid>
      </CoreMetricCard>
    </CoreMetricsRail>
  );
};

export default CorePortfolioMetrics;
