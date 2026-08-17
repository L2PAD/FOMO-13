import React from "react";
import {
  PortfolioBody,
  PortfolioHeaderBlock,
  PrivatePortfolioBadge,
  PrivatePortfolioBadges,
  PrivatePortfolioCategories,
  PrivatePortfolioHeaderLayout,
  PrivatePortfolioHero,
  PrivatePortfolioIdentity,
  PrivatePortfolioLeadStat,
  PrivatePortfolioLogo,
  PrivatePortfolioMetaGrid,
  PrivatePortfolioMetaItem,
  PrivatePortfolioMetricCard,
  PrivatePortfolioMetricsGrid,
  PrivatePortfolioOwnerCard,
  PrivatePortfolioPerformanceRow,
  PrivatePortfolioStatsPanel,
} from "./styles";
import PortfolioChart from "./PortfolioChart";
import { IPortfolio } from "../../../../types/global_types";
import { PageWrapper } from "../../projects/CryptoMarket/styles";
import EmptyList from "../../../global/EmptyList";
import EntityInfo from "../../../global/common/EntityInfo";
import UserAvatar from "../../../global/common/UserAvatar";
import { CopyIcon } from "../../../global/Icons";
import imageLoader from "../../../../helpers/imageLoader";
import { getUserLogo } from "../../../../helpers/imageFallbacks";
import { clarifyAmount } from "../../../../helpers/clarifyAmount";
import { toast } from "react-toastify";
import {
  Body,
  Header,
  TableHeader,
  TableList,
  TableRow,
  Wrapper,
} from "./Breakdown/styles";
import { Overflow } from "../../../global/common/BarDoubleChart/styles";
import {
  getPortfolioDisplaySymbol,
  sanitizePortfolioLabel,
} from "./helpers/portfolio";

interface Props {
  portfolio: IPortfolio | null;
}

const formatCurrency = (value?: number | string) => {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(Number(value || 0));
};

const isKnownNumber = (value: unknown) => {
  const amount = Number(value);

  return value !== null && value !== undefined && Number.isFinite(amount);
};

const formatOptionalCurrency = (value: unknown) => {
  return isKnownNumber(value) ? formatCurrency(Number(value)) : "-";
};

const formatSignedCurrency = (value?: number | string) => {
  const amount = Number(value || 0);
  const prefix = amount > 0 ? "+" : amount < 0 ? "-" : "";

  return `${prefix}${formatCurrency(Math.abs(amount))}`;
};

const formatPercent = (value?: number | string) => {
  const amount = Number(value || 0);
  const prefix = amount > 0 ? "+" : amount < 0 ? "-" : "";

  return `${prefix}${Math.abs(amount).toFixed(2)}%`;
};

const formatDate = (value?: Date | string) => {
  if (!value) return "-";

  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  }).format(new Date(value));
};

const getValueClass = (value?: number | string) => {
  const amount = Number(value || 0);

  if (amount > 0) return "positive";
  if (amount < 0) return "negative";

  return "";
};

const PrivatePortfolio: React.FC<Props> = ({ portfolio }) => {
  const isEmpty = !portfolio;
  const assets = portfolio?.assets || [];

  const creatorName =
    portfolio?.creator?.name ||
    portfolio?.creator?.twitterData?.name ||
    portfolio?.creator?.username ||
    "Unknown creator";

  const creatorUsername =
    portfolio?.creator?.username ||
    portfolio?.creator?.twitterData?.username ||
    "unknown";

  const creatorTwitterUsername = portfolio?.creator?.twitterData?.username;
  const creatorAvatar = portfolio?.creator?.avatar
    ? imageLoader(String(portfolio.creator.avatar))
    : portfolio?.creator?.photo
      ? imageLoader(String(portfolio.creator.photo))
      : getUserLogo(portfolio?.creator?.twitterData?.photo);

  const trackedAssetsCount = Array.from(
    new Set(
      assets.map(
        (asset: any) => asset?.projectId?._id || asset?.currency || asset?._id
      )
    )
  ).length;

  const categoryEntriesMap = Object.entries(
    portfolio?.categoryDistribution || {}
  ).reduce((acc, [category, value]) => {
    const categoryName = sanitizePortfolioLabel(category, "Uncategorized");

    acc.set(categoryName, (acc.get(categoryName) || 0) + Number(value || 0));

    return acc;
  }, new Map<string, number>());

  const categoryEntries = Array.from(categoryEntriesMap.entries()).sort(
    ([, leftValue], [, rightValue]) => Number(rightValue) - Number(leftValue)
  );

  const latestSnapshotDate = portfolio?.history?.length
    ? portfolio.history[portfolio.history.length - 1]?.date
    : null;

  const accessLabel = !portfolio?.isShare
    ? "Private Only"
    : portfolio?.shareType === "private"
      ? "Private Link"
      : "Public Access";

  const accessTone = !portfolio?.isShare
    ? "muted"
    : portfolio?.shareType === "private"
      ? "warning"
      : "success";

  const portfolioInitials = (portfolio?.name || "PF")
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((word) => word[0])
    .join("");

  const performanceItems = [
    { label: "1H", value: Number(portfolio?.performance1h?.usd || 0) },
    { label: "24H", value: Number(portfolio?.performance24h?.usd || 0) },
    { label: "7D", value: Number(portfolio?.performance7d?.usd || 0) },
  ];

  const copyFomoId = async () => {
    if (!portfolio?.creator?.fomoId) return;

    try {
      await navigator.clipboard.writeText(String(portfolio.creator.fomoId));

      toast.success(
        <div>
          <h3>Copied!</h3>
          <p>You have succesfuly copied FOMO ID</p>
        </div>
      );
    } catch {
      toast.error("Failed to copy FOMO ID");
    }
  };

  return (
    <PageWrapper>
      {isEmpty && (
        <>
          <br />
          <EmptyList />
          <br />
        </>
      )}

      {!isEmpty && portfolio && (
        <>
          <PortfolioHeaderBlock>
            <PrivatePortfolioHeaderLayout>
              <PrivatePortfolioHero>
                <PrivatePortfolioIdentity>
                  <PrivatePortfolioLogo>
                    {portfolio.logo ? (
                      <img
                        src={imageLoader(portfolio.logo)}
                        alt={portfolio.name}
                      />
                    ) : (
                      <span>{portfolioInitials}</span>
                    )}
                  </PrivatePortfolioLogo>

                  <div className="content">
                    <PrivatePortfolioBadges>
                      <PrivatePortfolioBadge className={accessTone}>
                        {accessLabel}
                      </PrivatePortfolioBadge>
                      <PrivatePortfolioBadge className="muted">
                        #{portfolio.code}
                      </PrivatePortfolioBadge>
                      <PrivatePortfolioBadge className="muted">
                        {trackedAssetsCount} tracked assets
                      </PrivatePortfolioBadge>
                      <PrivatePortfolioBadge className="muted">
                        {portfolio.history?.length || 0} balance snapshots
                      </PrivatePortfolioBadge>
                    </PrivatePortfolioBadges>

                    <div className="title-group">
                      <h4>{portfolio.name}</h4>
                      <p>
                        {portfolio.description ||
                          "No description provided for this portfolio yet."}
                      </p>
                    </div>
                  </div>
                </PrivatePortfolioIdentity>

                <PrivatePortfolioOwnerCard>
                  <div className="owner-top">
                    <UserAvatar
                      size="medium"
                      variant="default"
                      avatar={creatorAvatar}
                      name={creatorName}
                    />

                    <div className="owner-copy">
                      <span className="eyebrow">Portfolio owner</span>
                      <h5>{creatorName}</h5>

                      <div className="owner-row">
                        <span className="owner-pill">@{creatorUsername}</span>
                        {portfolio?.creator?.fomoId ? (
                          <button
                            type="button"
                            className="owner-pill owner-pill-copy"
                            onClick={copyFomoId}
                          >
                            <CopyIcon fill="var(--main-gray)" />
                            <span>FOMO ID #{portfolio.creator.fomoId}</span>
                          </button>
                        ) : null}
                        {creatorTwitterUsername &&
                        creatorTwitterUsername !== creatorUsername ? (
                          <span className="owner-pill">
                            X @{creatorTwitterUsername}
                          </span>
                        ) : null}
                      </div>
                    </div>
                  </div>

                  <PrivatePortfolioMetaGrid>
                    <PrivatePortfolioMetaItem>
                      <span>Created</span>
                      <strong>{formatDate(portfolio.createdAt)}</strong>
                    </PrivatePortfolioMetaItem>
                    <PrivatePortfolioMetaItem>
                      <span>Last snapshot</span>
                      <strong>
                        {formatDate(latestSnapshotDate || undefined)}
                      </strong>
                    </PrivatePortfolioMetaItem>
                    <PrivatePortfolioMetaItem>
                      <span>Top category</span>
                      <strong>
                        {categoryEntries.length
                          ? `${categoryEntries[0][0]} ${Number(categoryEntries[0][1]).toFixed(2)}%`
                          : "No allocation yet"}
                      </strong>
                    </PrivatePortfolioMetaItem>
                    <PrivatePortfolioMetaItem>
                      <span>Balance range</span>
                      <strong>
                        {formatCurrency(portfolio.atl)} to{" "}
                        {formatCurrency(portfolio.ath)}
                      </strong>
                    </PrivatePortfolioMetaItem>
                  </PrivatePortfolioMetaGrid>

                  {categoryEntries.length ? (
                    <PrivatePortfolioCategories>
                      {categoryEntries.slice(0, 3).map(([category, value]) => (
                        <span className="category-chip" key={category}>
                          {category} {Number(value).toFixed(2)}%
                        </span>
                      ))}
                    </PrivatePortfolioCategories>
                  ) : null}
                </PrivatePortfolioOwnerCard>
              </PrivatePortfolioHero>

              <PrivatePortfolioStatsPanel>
                <PrivatePortfolioLeadStat>
                  <span className="label">Current balance</span>
                  <div className="value">
                    {formatCurrency(portfolio.totalBalance)}
                  </div>
                  <div className={`delta ${getValueClass(portfolio.profit)}`}>
                    {formatSignedCurrency(portfolio.profit)} (
                    {formatPercent(portfolio.profitPercent)})
                  </div>

                  <PrivatePortfolioPerformanceRow>
                    {performanceItems.map((item) => (
                      <div className="performance-item" key={item.label}>
                        <span className="performance-label">{item.label}</span>
                        <span
                          className={`performance-value ${getValueClass(item.value)}`}
                        >
                          {formatPercent(item.value)}
                        </span>
                      </div>
                    ))}
                  </PrivatePortfolioPerformanceRow>
                </PrivatePortfolioLeadStat>

                <PrivatePortfolioMetricsGrid>
                  <PrivatePortfolioMetricCard>
                    <span className="label">Total invested</span>
                    <span className="value">
                      {formatCurrency(portfolio.totalInvested)}
                    </span>
                    <span className="subtle">
                      Capital allocated into the portfolio
                    </span>
                  </PrivatePortfolioMetricCard>

                  <PrivatePortfolioMetricCard>
                    <span className="label">Realized P&amp;L</span>
                    <span
                      className={`value ${getValueClass(portfolio.realizedProfit)}`}
                    >
                      {formatSignedCurrency(portfolio.realizedProfit)}
                    </span>
                    <span className="subtle">
                      Closed profit from completed sells
                    </span>
                  </PrivatePortfolioMetricCard>

                  <PrivatePortfolioMetricCard>
                    <span className="label">Unrealized P&amp;L</span>
                    <span
                      className={`value ${getValueClass(portfolio.unrealizedProfit)}`}
                    >
                      {formatSignedCurrency(portfolio.unrealizedProfit)}
                    </span>
                    <span className="subtle">
                      Open profit on current holdings
                    </span>
                  </PrivatePortfolioMetricCard>

                  <PrivatePortfolioMetricCard>
                    <span className="label">All-time high</span>
                    <span className="value">
                      {formatCurrency(portfolio.ath)}
                    </span>
                    <span className="subtle">
                      Reached on {formatDate(portfolio.athDate)}
                    </span>
                  </PrivatePortfolioMetricCard>

                  <PrivatePortfolioMetricCard>
                    <span className="label">All-time low</span>
                    <span className="value">
                      {formatCurrency(portfolio.atl)}
                    </span>
                    <span className="subtle">
                      Recorded on {formatDate(portfolio.atlDate)}
                    </span>
                  </PrivatePortfolioMetricCard>

                  <PrivatePortfolioMetricCard>
                    <span className="label">Sharing status</span>
                    <span className="value">{accessLabel}</span>
                    <span className="subtle">
                      {portfolio.isShare
                        ? `Link is active for ${portfolio.shareType || "private"} access`
                        : "This portfolio is visible only to its owner"}
                    </span>
                  </PrivatePortfolioMetricCard>
                </PrivatePortfolioMetricsGrid>
              </PrivatePortfolioStatsPanel>
            </PrivatePortfolioHeaderLayout>
          </PortfolioHeaderBlock>
          <PortfolioBody>
            <PortfolioChart
              portfolio={portfolio}
              readOnlyHistory={portfolio.history || []}
            />
          </PortfolioBody>
          <Wrapper>
            <Header>
              <h2>Portfolio Assets</h2>
            </Header>
            <Body variant="main">
              <Overflow>
                <TableHeader>
                  <div>Token</div>
                  <div>Amount Held</div>
                  <div>Invested</div>
                  <div>Avg. Buy Price</div>
                  <div>Current Profit</div>
                </TableHeader>
                <TableList>
                  {assets.length ? (
                    assets.map((asset: any) => {
                      const project = asset.projectId || {};
                      const displaySymbol = getPortfolioDisplaySymbol(
                        project,
                        asset
                      );
                      const amount = Number(asset.amount || 0);
                      const hasCurrentPrice =
                        asset.hasCurrentPrice !== false &&
                        isKnownNumber(asset.currentValue);
                      const currentValue = hasCurrentPrice
                        ? Number(asset.currentValue)
                        : null;
                      const totalPrice = isKnownNumber(asset.invested)
                        ? Number(asset.invested)
                        : isKnownNumber(asset.totalPrice)
                          ? Number(asset.totalPrice)
                          : null;
                      const avgBuyPrice = isKnownNumber(asset.avgBuyPrice)
                        ? Number(asset.avgBuyPrice)
                        : isKnownNumber(asset.price)
                          ? Number(asset.price)
                          : null;
                      const profit =
                        hasCurrentPrice && isKnownNumber(asset.profit)
                          ? Number(asset.profit)
                          : null;
                      const profitPercent =
                        hasCurrentPrice && isKnownNumber(asset.profitPercent)
                          ? Number(asset.profitPercent)
                          : null;

                      return (
                        <TableRow key={asset._id || project._id}>
                          <div className="item">
                            <EntityInfo
                              img={imageLoader(project.logo)}
                              name={project.name || "Unknown asset"}
                              niche={displaySymbol}
                              variant="default"
                            />
                          </div>
                          <div className="table-column item">
                            <div className="value bold">
                              {formatOptionalCurrency(currentValue)}
                            </div>
                            <span>
                              {clarifyAmount(amount)}
                              {displaySymbol ? ` ${displaySymbol}` : ""}
                            </span>
                          </div>
                          <div className="item">
                            <div className="value">
                              {formatOptionalCurrency(totalPrice)}
                            </div>
                          </div>
                          <div className="item">
                            <div className="value">
                              {formatOptionalCurrency(avgBuyPrice)}
                            </div>
                          </div>
                          <div className="table-column item">
                            <div
                              className={
                                profit === null
                                  ? "value"
                                  : profit < 0
                                    ? "value red"
                                    : "value green"
                              }
                            >
                              {profit === null
                                ? "-"
                                : formatSignedCurrency(profit)}
                            </div>
                            <div
                              className={
                                profitPercent === null
                                  ? "small-value"
                                  : profitPercent < 0
                                    ? "small-value red"
                                    : "small-value green"
                              }
                            >
                              {profitPercent === null
                                ? "-"
                                : formatPercent(profitPercent)}
                            </div>
                          </div>
                        </TableRow>
                      );
                    })
                  ) : (
                    <EmptyList />
                  )}
                </TableList>
              </Overflow>
            </Body>
          </Wrapper>
        </>
      )}
    </PageWrapper>
  );
};

export default PrivatePortfolio;
