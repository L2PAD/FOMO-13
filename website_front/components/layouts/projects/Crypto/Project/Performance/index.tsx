import React, { FC } from "react";
import { Body, Header, Row, TableContainer, Wrapper } from "./styles";
import { IProject } from "../../../../../../types/global_types";
import PercentValue from "../../../../../global/common/PercentValue";
import { resolveProjectTokenDisplaySymbol } from "../../../../../../helpers/projectTokenSymbol";

interface IProps {
  project: IProject;
}

type PerformancePeriod = "1H" | "1D" | "1W" | "1M" | "3M" | "1Y";
type PerformanceQuote = "USD" | "BTC" | "ETH" | "SOL";

const PERIODS: Array<{ key: PerformancePeriod; label: string }> = [
  { key: "1H", label: "1h" },
  { key: "1D", label: "24h" },
  { key: "1W", label: "7d" },
  { key: "1M", label: "30d" },
  { key: "3M", label: "90d" },
  { key: "1Y", label: "1y" },
];

const QUOTES: PerformanceQuote[] = ["USD", "BTC", "ETH", "SOL"];

const Performance: FC<IProps> = ({ project }) => {
  const ticker = resolveProjectTokenDisplaySymbol(project);
  const getChange = (period: PerformancePeriod, quote: PerformanceQuote) =>
    project.allTimePriceChange?.[period]?.[quote];
  const renderChange = (period: PerformancePeriod, quote: PerformanceQuote) => {
    const value = Number(getChange(period, quote));

    if (ticker === quote || !Number.isFinite(value) || value === 0) {
      return <span>--</span>;
    }

    return <PercentValue value={value} size="small" isIcon={false} />;
  };

  return (
    <Wrapper variant="main">
      <TableContainer>
        <Header>
          <div>Trading Pair</div>
          {PERIODS.map((period) => (
            <div key={period.key}>{period.label}</div>
          ))}
        </Header>
        <Body>
          {QUOTES.map((quote) => (
            <Row key={quote}>
              <div className="bold sticky">{ticker}/{quote}</div>
              {PERIODS.map((period) => (
                <div className="percent" key={`${quote}-${period.key}`}>
                  {renderChange(period.key, quote)}
                </div>
              ))}
            </Row>
          ))}
        </Body>
      </TableContainer>
    </Wrapper>
  );
};

export default Performance;
