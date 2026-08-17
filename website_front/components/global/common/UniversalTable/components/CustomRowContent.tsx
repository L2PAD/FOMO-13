import React, { ReactNode } from "react";
import {
  clarifyAmount,
  formatPriceChangePercent,
  getCirculatingSupplyProgress,
  getProjectSymbol,
  imageLoader,
  PriceChangeCell,
  ProgressBar,
  ProjectData,
  simplifyAmount,
  type UniversalTableCaseProps,
  UpDownWrapper,
  UserAvatar,
} from "./shared";

const EMPTY_VALUE = "--";

const fallbackPathsByColumnKey: Record<string, string[]> = {
  usdPrice: ["customTabValues.usdPrice", "price", "usdQuote.price"],
  btcPrice: ["customTabValues.btcPrice", "priceBTC", "btcQuote.price"],
  ethPrice: ["customTabValues.ethPrice", "priceETH", "ethQuote.price"],
  priceChange1h: [
    "customTabValues.priceChange1h",
    "usdQuote.percent_change_1h",
  ],
  priceChange24h: [
    "customTabValues.priceChange24h",
    "usdQuote.percent_change_24h",
    "priceChange24h",
    "priceChange",
  ],
  priceChange7d: [
    "customTabValues.priceChange7d",
    "usdQuote.percent_change_7d",
  ],
  marketCap: ["customTabValues.marketCap", "marketCap"],
  fdv: ["customTabValues.fdv", "fullyDilutedMarketCap"],
  circulationSupply: ["customTabValues.circulationSupply", "circulatingSupply"],
  volume24h: ["customTabValues.volume24h", "volume24h"],
  chart7d: ["customTabValues.chart7d", "chart7d", "history"],
  athPrice: [
    "customTabValues.athPrice",
    "athUsd",
    "ohlcv.quote.USD.high",
    "yearHigh",
    "highPrice",
  ],
  totalFundsRaised: ["customTabValues.totalFundsRaised", "totalRaised"],
  category: ["customTabValues.category", "niche"],
  exchanges: ["customTabValues.exchanges", "exchange"],
  launchDate: ["customTabValues.launchDate", "dateAdded"],
};

const percentColumnKeys = new Set([
  "priceChange1h",
  "priceChange24h",
  "priceChange7d",
  "priceChange1m",
  "priceChange3m",
  "priceChange6m",
  "priceChange1y",
  "priceChangeYtd",
  "fromAth",
  "fromAtl",
  "usdRoi",
  "btcRoi",
  "ethRoi",
  "unlockProgress",
  "performance",
]);
const optionalMarketPriceChangeKeys = new Set([
  "priceChange1h",
  "priceChange24h",
  "priceChange7d",
]);

const moneyColumnKeys = new Set([
  "usdPrice",
  "marketCap",
  "fdv",
  "volume24h",
  "volume7d",
  "volume1m",
  "athPrice",
  "atlPrice",
  "nextUnlock",
  "totalFundsRaised",
]);

const compactNumberColumnKeys = new Set([
  "circulationSupply",
  "volume24h",
  "volume7d",
  "volume1m",
]);

const getNestedValue = (source: any, path: string): any => {
  return path.split(".").reduce((value, key) => value?.[key], source);
};

const isEmptyValue = (value: any): boolean => {
  if (value === undefined || value === null || value === "") return true;
  if (typeof value === "number") return !Number.isFinite(value);
  if (typeof value === "string" && value.trim().toLowerCase() === "nan") {
    return true;
  }

  return false;
};

const getColumnValue = (item: any, key: string): any => {
  const paths = fallbackPathsByColumnKey[key] || [
    `customTabValues.${key}`,
    key,
  ];

  for (const path of paths) {
    const value = getNestedValue(item, path);

    if (!isEmptyValue(value)) {
      return value;
    }
  }

  return undefined;
};

const formatTextValue = (value: any): ReactNode => {
  if (isEmptyValue(value)) return EMPTY_VALUE;

  if (Array.isArray(value)) {
    return value.length ? value.join(", ") : EMPTY_VALUE;
  }

  return String(value);
};

const formatNumberValue = (value: any, precision = 2): string => {
  if (isEmptyValue(value)) return EMPTY_VALUE;

  const numericValue = Number(value);

  if (!Number.isFinite(numericValue)) return EMPTY_VALUE;

  return simplifyAmount(numericValue, precision);
};

const renderColumnValue = (
  item: any,
  key: string,
  isLastColumn?: boolean
): ReactNode => {
  const value = getColumnValue(item, key);

  if (key === "chart7d") {
    const chartSrc =
      typeof value === "string" && value.trim() ? value : `/${item._id}.png`;

    if (!item._id && isEmptyValue(value)) {
      return <div>{EMPTY_VALUE}</div>;
    }

    return (
      <div className={`chart7d ${isLastColumn ? "" : "not-last-chart"}`}>
        <img
          src={imageLoader(chartSrc)}
          alt={item?.name || "7d chart"}
          loading="lazy"
        />
      </div>
    );
  }

  if (key === "circulationSupply") {
    if (isEmptyValue(value)) return <div>{EMPTY_VALUE}</div>;

    return (
      <div className="custom-circulation-supply">
        <p>
          {formatNumberValue(value, 0)}{" "}
          {getProjectSymbol(item)}
        </p>
        <ProgressBar progress={getCirculatingSupplyProgress(item)}>
          <div />
        </ProgressBar>
      </div>
    );
  }

  if (percentColumnKeys.has(key)) {
    if (isEmptyValue(value)) return <div>{EMPTY_VALUE}</div>;

    const numericValue = Number(value);

    if (!Number.isFinite(numericValue)) return <div>{EMPTY_VALUE}</div>;
    if (optionalMarketPriceChangeKeys.has(key) && numericValue === 0) {
      return <PriceChangeCell value={numericValue} />;
    }

    return (
      <UpDownWrapper
        className={`custom-percent-value ${
          numericValue > 0 ? "up" : "down"
        }`}
        type={numericValue > 0 ? "up" : "down"}
      >
        {formatPriceChangePercent(numericValue)}
      </UpDownWrapper>
    );
  }

  if (key === "btcPrice" || key === "ethPrice") {
    return <div className="project-price">{formatNumberValue(value, 8)}</div>;
  }

  if (moneyColumnKeys.has(key)) {
    if (isEmptyValue(value)) {
      return <div className="project-price">{EMPTY_VALUE}</div>;
    }

    return <div className="project-price">${clarifyAmount(value)}</div>;
  }

  if (compactNumberColumnKeys.has(key)) {
    return <div>{formatNumberValue(value, 0)}</div>;
  }

  return <div>{formatTextValue(value)}</div>;
};

const CustomRowContent = ({ item, customColumns = [] }: UniversalTableCaseProps) => {
  return (
    <>
      <ProjectData>
        <UserAvatar
          size="small"
          variant="default"
          avatar={imageLoader(String(item.logo || item.image || item.avatar || ""))}
          name={item.name || item.symbol || item.ticker || EMPTY_VALUE}
        />
        <div className="project-row-data">
          <p>
            {(item?.name?.length || 0) > 20
              ? `${item?.name?.slice(0, 15)}...`
              : item?.name || EMPTY_VALUE}
          </p>
          <span>{getProjectSymbol(item) || EMPTY_VALUE}</span>
        </div>
      </ProjectData>
      {customColumns.map((column) => (
        <React.Fragment key={column.key}>
          {renderColumnValue(
            item,
            column.key,
            column.key === customColumns[customColumns.length - 1]?.key
          )}
        </React.Fragment>
      ))}
    </>
  );
};

export default CustomRowContent;
