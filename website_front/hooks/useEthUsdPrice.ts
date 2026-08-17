import { useContext, useEffect, useState } from "react";
import { LayoutContext } from "../components/global/Layout";

const ETH_USD_STORAGE_KEY = "fomo_eth_usd_price";

const normalizeEthUsdPrice = (value?: unknown): number => {
  const numericValue = Number(value || 0);

  if (!Number.isFinite(numericValue) || numericValue <= 0) {
    return 0;
  }

  return numericValue;
};

const getCachedEthUsdPrice = (): number => {
  if (typeof window === "undefined") {
    return 0;
  }

  return normalizeEthUsdPrice(localStorage.getItem(ETH_USD_STORAGE_KEY));
};

export const resolveEthUsdPrice = (...values: unknown[]): number => {
  for (const value of values) {
    const normalizedValue = normalizeEthUsdPrice(value);

    if (normalizedValue > 0) {
      return normalizedValue;
    }
  }

  return 0;
};

export const toUsdPrice = (
  priceRaw: unknown,
  currency: "ETH" | "USDC",
  ethUsdPriceRaw: unknown,
  fallbackUsdPriceRaw?: unknown
): number => {
  const price = Number(priceRaw || 0);

  if (!Number.isFinite(price) || price <= 0) {
    return 0;
  }

  if (currency === "USDC") {
    return price;
  }

  const fallbackUsdPrice = normalizeEthUsdPrice(fallbackUsdPriceRaw);

  if (fallbackUsdPrice > 0) {
    return Number(fallbackUsdPrice.toFixed(2));
  }

  const ethUsdPrice = resolveEthUsdPrice(ethUsdPriceRaw);

  if (ethUsdPrice <= 0) {
    return 0;
  }

  return Number((price * ethUsdPrice).toFixed(2));
};

export const toEthPrice = (
  priceRaw: unknown,
  currency: "ETH" | "USDC",
  ethUsdPriceRaw: unknown,
  fallbackEthPriceRaw?: unknown
): number => {
  const price = Number(priceRaw || 0);

  if (!Number.isFinite(price) || price <= 0) {
    return 0;
  }

  if (currency === "ETH") {
    return price;
  }

  const fallbackEthPrice = Number(fallbackEthPriceRaw || 0);

  if (Number.isFinite(fallbackEthPrice) && fallbackEthPrice > 0) {
    return fallbackEthPrice;
  }

  const ethUsdPrice = resolveEthUsdPrice(ethUsdPriceRaw);

  if (ethUsdPrice <= 0) {
    return 0;
  }

  return Number((price / ethUsdPrice).toFixed(6));
};

export const useEthUsdPrice = (fallbackPriceRaw?: unknown): number => {
  const { layout } = useContext(LayoutContext);
  const liveEthUsdPrice = resolveEthUsdPrice(layout?.header?.data?.ethereumPrice);
  const fallbackEthUsdPrice = resolveEthUsdPrice(fallbackPriceRaw);
  const [cachedEthUsdPrice, setCachedEthUsdPrice] = useState<number>(() =>
    resolveEthUsdPrice(fallbackEthUsdPrice, getCachedEthUsdPrice())
  );

  useEffect(() => {
    const nextEthUsdPrice = resolveEthUsdPrice(
      liveEthUsdPrice,
      fallbackEthUsdPrice
    );

    if (nextEthUsdPrice <= 0) {
      return;
    }

    setCachedEthUsdPrice(nextEthUsdPrice);

    if (typeof window !== "undefined") {
      localStorage.setItem(ETH_USD_STORAGE_KEY, String(nextEthUsdPrice));
    }
  }, [fallbackEthUsdPrice, liveEthUsdPrice]);

  return resolveEthUsdPrice(
    liveEthUsdPrice,
    fallbackEthUsdPrice,
    cachedEthUsdPrice
  );
};
