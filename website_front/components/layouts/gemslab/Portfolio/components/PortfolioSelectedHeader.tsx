import React, { FC } from "react";
import {
  CopyPlus,
  Edit3,
  Eye,
  Minus,
  MoreHorizontal,
  ShieldCheck,
  Swords,
  Trash2,
  TrendingDown,
  TrendingUp,
} from "lucide-react";
import ActionsModal from "../../../../global/ActionsModal";
import imageLoader from "../../../../../helpers/imageLoader";
import {
  IPortfolio,
  IPortfolioSummary,
} from "../../../../../types/global_types";
import {
  CoreHeroActionsMenu,
  CoreHeroButton,
  CorePortfolioBadge,
  CorePortfolioHero,
  CorePortfolioHeroActions,
  CorePortfolioHeroMain,
  CorePortfolioHeroMetrics,
  CorePortfolioHeroStats,
  CorePortfolioIdentity,
  CorePortfolioIdentityCopy,
  CorePortfolioLeadMetric,
  CorePortfolioLogo,
} from "../coreStyles";
import { getPortfolioDescription } from "../helpers/portfolio";
import { PortfolioSelection } from "../types";

interface PortfolioSelectedHeaderProps {
  portfolio: PortfolioSelection;
  canShare: boolean;
  isActionsModal: boolean;
  onToggleActionsModal: () => void;
  onCloseActionsModal: () => void;
  onOpenBattle: () => void;
  onOpenShare: () => void;
  onOpenEdit: () => void;
  onDuplicate: (portfolio: PortfolioSelection) => void;
  onOpenDelete: () => void;
}

type HeroPortfolio = IPortfolioSummary & Partial<IPortfolio>;

const formatUsd = (value?: number | string | null): string => {
  const numericValue = Number(value || 0);
  const safeValue = Number.isFinite(numericValue) ? numericValue : 0;
  const useCompactNotation = Math.abs(safeValue) >= 1_000_000;

  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    notation: useCompactNotation ? "compact" : "standard",
    minimumFractionDigits: useCompactNotation ? 0 : 2,
    maximumFractionDigits: 2,
  }).format(safeValue);
};

const formatSignedUsd = (value?: number | string | null): string => {
  const numericValue = Number(value || 0);
  const formatted = formatUsd(Math.abs(numericValue));

  if (numericValue === 0) return formatted;
  return `${numericValue > 0 ? "+" : "-"}${formatted}`;
};

const formatPercent = (value?: number | string | null): string => {
  const numericValue = Number(value || 0);
  const normalizedValue = Number.isFinite(numericValue) ? numericValue : 0;

  return `${normalizedValue > 0 ? "+" : ""}${normalizedValue.toFixed(2)}%`;
};

const getInitials = (name: string): string =>
  name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0])
    .join("")
    .toUpperCase() || "PF";

const PortfolioSelectedHeader: FC<PortfolioSelectedHeaderProps> = ({
  portfolio,
  canShare,
  isActionsModal,
  onToggleActionsModal,
  onCloseActionsModal,
  onOpenBattle,
  onOpenShare,
  onOpenEdit,
  onDuplicate,
  onOpenDelete,
}) => {
  const data = portfolio as HeroPortfolio;
  const profit = Number(data.profit || 0);
  const profitPercent = Number(data.profitPercent || 0);
  const invested = Number(data.totalInvested || 0);
  const unrealized = Number(data.unrealizedProfit || 0);
  const realized = Number(data.realizedProfit || 0);
  const changeClass =
    profitPercent > 0 ? "positive" : profitPercent < 0 ? "negative" : "";
  const description = getPortfolioDescription(portfolio).trim();
  const code = data.code
    ? `#${String(data.code).replace(/^#/, "")}`
    : "Personal workspace";
  const logo = data.logo ? imageLoader(data.logo) : "";

  return (
    <CorePortfolioHero aria-label={`${portfolio.name} portfolio overview`}>
      <CorePortfolioHeroMain>
        <CorePortfolioIdentity>
          <CorePortfolioLogo>
            <span className="logo-initials" aria-hidden="true">
              {getInitials(portfolio.name)}
            </span>
            {logo ? (
              <img
                src={logo}
                alt=""
                decoding="async"
                onError={(event) => {
                  event.currentTarget.style.display = "none";
                }}
              />
            ) : null}
          </CorePortfolioLogo>
          <CorePortfolioIdentityCopy>
            <div className="portfolio-kicker">
              <CorePortfolioBadge $tone="positive">
                <ShieldCheck size={13} aria-hidden="true" />
                My portfolio
              </CorePortfolioBadge>
              <CorePortfolioBadge>{code}</CorePortfolioBadge>
              {data.isBattle ? (
                <CorePortfolioBadge $tone="positive">
                  Battle active
                </CorePortfolioBadge>
              ) : null}
            </div>
            <h2>{portfolio.name}</h2>
            <p>
              {description ||
                "Track allocation, performance and every portfolio transaction in one place."}
            </p>
          </CorePortfolioIdentityCopy>
        </CorePortfolioIdentity>

        <CorePortfolioHeroActions>
          <CoreHeroButton $primary type="button" onClick={onOpenBattle}>
            <Swords aria-hidden="true" />
            {data.isBattle ? "Battle settings" : "Join battle"}
          </CoreHeroButton>
          <CoreHeroButton
            type="button"
            onClick={onOpenShare}
            disabled={!canShare}
          >
            <Eye aria-hidden="true" />
            Share
          </CoreHeroButton>
          <CoreHeroActionsMenu>
            <CoreHeroButton
              $iconOnly
              type="button"
              onClick={onToggleActionsModal}
              aria-label="Portfolio actions"
              aria-expanded={isActionsModal}
            >
              <MoreHorizontal aria-hidden="true" />
            </CoreHeroButton>
            <ActionsModal
              isVisible={isActionsModal}
              onClose={onCloseActionsModal}
              actions={[
                {
                  icon: <Edit3 size={16} />,
                  label: "Edit Portfolio",
                  onClick: () => {
                    onOpenEdit();
                    onCloseActionsModal();
                  },
                },
                {
                  icon: <CopyPlus size={16} />,
                  label: "Duplicate Portfolio",
                  onClick: () => onDuplicate(portfolio),
                },
                {
                  icon: <Trash2 size={16} />,
                  label: "Delete Portfolio",
                  onClick: () => {
                    onOpenDelete();
                    onCloseActionsModal();
                  },
                },
              ]}
            />
          </CoreHeroActionsMenu>
        </CorePortfolioHeroActions>
      </CorePortfolioHeroMain>

      <CorePortfolioHeroStats>
        <CorePortfolioLeadMetric>
          <span className="metric-label">Current balance</span>
          <strong className="metric-value">
            {formatUsd(data.totalBalance)}
          </strong>
          <span className={`metric-change ${changeClass}`}>
            {profitPercent > 0 ? (
              <TrendingUp size={15} aria-hidden="true" />
            ) : profitPercent < 0 ? (
              <TrendingDown size={15} aria-hidden="true" />
            ) : (
              <Minus size={15} aria-hidden="true" />
            )}
            {formatSignedUsd(profit)} ({formatPercent(profitPercent)})
          </span>
        </CorePortfolioLeadMetric>
        <CorePortfolioHeroMetrics>
          <div className="hero-metric">
            <span>Total invested</span>
            <strong>{formatUsd(invested)}</strong>
          </div>
          <div className="hero-metric">
            <span>Unrealized P&amp;L</span>
            <strong>{formatSignedUsd(unrealized)}</strong>
          </div>
          <div className="hero-metric">
            <span>Realized P&amp;L</span>
            <strong>{formatSignedUsd(realized)}</strong>
          </div>
          <div className="hero-metric">
            <span>Assets</span>
            <strong>
              {data.assets?.length || data.calculatedAssets?.length || 0}
            </strong>
          </div>
        </CorePortfolioHeroMetrics>
      </CorePortfolioHeroStats>
    </CorePortfolioHero>
  );
};

export default PortfolioSelectedHeader;
