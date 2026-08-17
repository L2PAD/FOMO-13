import React, { FC, useState } from "react";
import { Card, CardRow, DescriptionWrapper, Wrapper } from "./styles";
import EntityInfo from "../../../../../global/common/EntityInfo";
import InfoIcon from "../../../../../global/Icons/InfoIcon";
import DescriptionComponent from "../../../../../global/common/DescriptionComponent";
import Placeholder from "../../../../../global/common/Placeholder";

interface ComparedPortfolioItem {
  userId: string;
  avatar: string;
  name: string;
  username: string;
  portfolioName: string | null;
  currentBalance: number | null;
  allTimeRoi: number | null;
  change24h: number | null;
  topHeldToken: string | null;
  hasPublicPortfolio: boolean;
}

interface Props {
  items?: ComparedPortfolioItem[];
  isLoading?: boolean;
  isFiltered?: boolean;
}

const TOOLTIP_TEXT = {
  balance:
    "Current estimated value of the user's public portfolio based on tracked holdings.",
  roi: "All-time return of the public portfolio relative to its tracked cost basis.",
  change24h: "Portfolio value change over the last 24 hours.",
  topToken:
    "Largest tracked asset in the public portfolio by current allocation.",
};

const formatCurrency = (value: number | null | undefined): string => {
  if (value === null || value === undefined) {
    return "-";
  }

  return `$${Number(value).toLocaleString(undefined, {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
};

const formatPercent = (value: number | null | undefined): string => {
  if (value === null || value === undefined) {
    return "-";
  }

  const normalized = Number(value);
  const sign = normalized > 0 ? "+" : "";

  return `${sign}${normalized.toFixed(1)}%`;
};

const ComparedPortfolios: FC<Props> = ({
  items = [],
  isLoading = false,
  isFiltered = false,
}) => {
  const [descriptionModals, setDescriptionModals] = useState<Array<string>>([]);

  const showModal = (id: string): void => {
    setDescriptionModals((prev) => (prev.includes(id) ? prev : [...prev, id]));
  };

  const hideModal = (id: string): void => {
    setDescriptionModals((prev) => prev.filter((item) => item !== id));
  };

  return (
    <Wrapper>
      <h2>Compared Portfolios</h2>
      {isLoading ? (
        Array.from({ length: 3 }).map((_, index) => (
          <Card variant="main" key={`compared-portfolio-skeleton-${index}`}>
            <Placeholder
              width="100%"
              height="220px"
              borderRadius="16px"
              marginBottom="0"
            />
          </Card>
        ))
      ) : items.length === 0 ? (
        <Card variant="main">
          <div style={{ fontWeight: "var(--font-weight-semibold)", marginBottom: 8 }}>
            {isFiltered ? "No matching users" : "No portfolios to compare"}
          </div>
          <div style={{ color: "var(--main-gray)" }}>
            {isFiltered
              ? "Try another search query."
              : "Add compared users with public portfolios to populate this section."}
          </div>
        </Card>
      ) : (
        items.map((item, index: number) => (
          <Card variant="main" key={`${item.userId}-${index}`}>
            <EntityInfo
              img={item.avatar}
              name={item.name}
              username={item.username}
              niche={item.portfolioName || "No public portfolio"}
              variant="default"
              rating={0}
            />
            {!item.hasPublicPortfolio ? (
              <CardRow>
                <div className="key">Portfolio</div>
                <div style={{ fontWeight: "var(--font-weight-semibold)" }}>No public portfolio</div>
              </CardRow>
            ) : (
              <>
                <CardRow>
                  <div className="key">
                    Portfolio Balance
                    <button
                      type="button"
                      onMouseEnter={() => showModal(`${index}-balance`)}
                      onMouseLeave={() => hideModal(`${index}-balance`)}
                    >
                      <InfoIcon />
                    </button>
                    <DescriptionWrapper>
                      <DescriptionComponent
                        className="description-component"
                        isVisible={descriptionModals.includes(
                          `${index}-balance`
                        )}
                        date={new Date()}
                        text={TOOLTIP_TEXT.balance}
                        isDate={false}
                      />
                    </DescriptionWrapper>
                  </div>
                  <div style={{ fontWeight: "var(--font-weight-semibold)" }}>
                    {formatCurrency(item.currentBalance)}
                  </div>
                </CardRow>
                <CardRow>
                  <div className="key">
                    ROI
                    <button
                      type="button"
                      onMouseEnter={() => showModal(`${index}-roi`)}
                      onMouseLeave={() => hideModal(`${index}-roi`)}
                    >
                      <InfoIcon />
                    </button>
                    <DescriptionWrapper>
                      <DescriptionComponent
                        className="description-component"
                        isVisible={descriptionModals.includes(`${index}-roi`)}
                        date={new Date()}
                        text={TOOLTIP_TEXT.roi}
                        isDate={false}
                      />
                    </DescriptionWrapper>
                  </div>
                  <div className={Number(item.allTimeRoi) >= 0 ? "green" : "red"}>
                    {formatPercent(item.allTimeRoi)}
                  </div>
                </CardRow>
                <CardRow>
                  <div className="key">
                    24h Change
                    <button
                      type="button"
                      onMouseEnter={() => showModal(`${index}-change24h`)}
                      onMouseLeave={() => hideModal(`${index}-change24h`)}
                    >
                      <InfoIcon />
                    </button>
                    <DescriptionWrapper>
                      <DescriptionComponent
                        className="description-component"
                        isVisible={descriptionModals.includes(
                          `${index}-change24h`
                        )}
                        date={new Date()}
                        text={TOOLTIP_TEXT.change24h}
                        isDate={false}
                      />
                    </DescriptionWrapper>
                  </div>
                  <div className={Number(item.change24h) >= 0 ? "green" : "red"}>
                    {formatPercent(item.change24h)}
                  </div>
                </CardRow>
                <CardRow>
                  <div className="key">
                    Top Token
                    <button
                      type="button"
                      onMouseEnter={() => showModal(`${index}-topToken`)}
                      onMouseLeave={() => hideModal(`${index}-topToken`)}
                    >
                      <InfoIcon />
                    </button>
                    <DescriptionWrapper>
                      <DescriptionComponent
                        className="description-component"
                        isVisible={descriptionModals.includes(
                          `${index}-topToken`
                        )}
                        date={new Date()}
                        text={TOOLTIP_TEXT.topToken}
                        isDate={false}
                      />
                    </DescriptionWrapper>
                  </div>
                  <div style={{fontWeight: "var(--font-weight-semibold)"}}>{item.topHeldToken || "-"}</div>
                </CardRow>
              </>
            )}
          </Card>
        ))
      )}
    </Wrapper>
  );
};

export default ComparedPortfolios;
