import { clarifyAmount } from "../../../../../helpers/clarifyAmount";
import { PortfolioSelection } from "../types";

const HIDDEN_PORTFOLIO_LABELS = new Set(["smart contract platform"]);

type PortfolioSymbolSource = {
  amountTkn?: string | null;
  currency?: string | null;
  niche?: string | null;
  projectId?: { symbol?: string | null } | string | null;
  symbol?: string | null;
};

export const getQueryValue = (value: string | string[] | undefined): string => {
  if (Array.isArray(value)) return value[0] || "";

  return value || "";
};

export const formatDropdownBalance = (value?: number | string): string => {
  return `$${clarifyAmount(value || 0)}`;
};

export const formatDropdownChange = (value?: number | string): string => {
  const amount = Number(value || 0);
  const prefix = amount > 0 ? "+" : amount < 0 ? "-" : "";

  return `${prefix}${Math.abs(amount).toFixed(2)}%`;
};

export const getDropdownChangeClass = (value?: number | string): string => {
  const amount = Number(value || 0);

  if (amount > 0) return "green";
  if (amount < 0) return "red";

  return "neutral";
};

export const getPortfolioDescription = (
  portfolio?: PortfolioSelection | null
): string => {
  if (!portfolio || !("description" in portfolio)) return "";

  return portfolio.description || "";
};

export const isHiddenPortfolioLabel = (value?: string | null): boolean => {
  return HIDDEN_PORTFOLIO_LABELS.has(String(value || "").trim().toLowerCase());
};

export const sanitizePortfolioLabel = (
  value?: string | null,
  fallback = ""
): string => {
  const normalizedValue = String(value || "").trim();

  if (!normalizedValue || isHiddenPortfolioLabel(normalizedValue)) return fallback;

  return normalizedValue;
};

export const normalizePortfolioSymbol = (value?: string | null): string => {
  const normalizedValue = sanitizePortfolioLabel(value);

  return normalizedValue ? normalizedValue.toUpperCase() : "";
};

const endsWithHiddenPortfolioLabel = (value: string): boolean => {
  return Array.from(HIDDEN_PORTFOLIO_LABELS).some((label) =>
    value.toLowerCase().endsWith(` ${label}`)
  );
};

const getAmountTokenCandidate = (value?: string | null): string => {
  const normalizedValue = String(value || "").trim();

  if (!normalizedValue) return "";

  if (endsWithHiddenPortfolioLabel(normalizedValue)) return "";

  const match = normalizedValue.match(/\s+([A-Za-z0-9.$_-]{1,24})$/);

  return match?.[1] || "";
};

export const getPortfolioDisplaySymbol = (
  ...sources: Array<PortfolioSymbolSource | string | null | undefined>
): string => {
  const candidates: Array<string | null | undefined> = [];

  sources.forEach((source) => {
    if (!source) return;

    if (typeof source === "string") {
      candidates.push(source);
      return;
    }

    if (typeof source.projectId === "object" && source.projectId) {
      candidates.push(source.projectId.symbol);
    }

    candidates.push(
      source.symbol,
      source.currency,
      getAmountTokenCandidate(source.amountTkn),
      source.niche
    );
  });

  for (const candidate of candidates) {
    const symbol = normalizePortfolioSymbol(candidate);

    if (symbol) return symbol;
  }

  return "";
};

export const formatPortfolioTokenAmount = (
  value?: string | null,
  symbol?: string
): string => {
  const normalizedValue = String(value || "").trim();
  const displaySymbol = normalizePortfolioSymbol(symbol);

  if (!normalizedValue) return normalizedValue;

  const amount = normalizedValue.match(/^[-+]?\d[\d,]*(?:\.\d+)?/)?.[0];

  if (!displaySymbol) {
    return endsWithHiddenPortfolioLabel(normalizedValue) && amount
      ? amount
      : normalizedValue;
  }

  return amount ? `${amount} ${displaySymbol}` : normalizedValue;
};
