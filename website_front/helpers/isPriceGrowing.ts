type ChartPoint = {
  timestamp: number;
  price: {
    USD: number;
    BTC: number;
    ETH: number;
    SOL: number;
  };
};

export function isPriceGrowing(
  chart7d?: ChartPoint[],
  currency: keyof ChartPoint["price"] = "USD"
): boolean {
  if (!chart7d || chart7d.length < 2) return false;

  const firstPrice = chart7d[0].price[currency];
  const lastPrice = chart7d[chart7d.length - 1].price[currency];

  return lastPrice > firstPrice;
}
