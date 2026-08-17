"use client";

import React, { useEffect, useRef } from "react";

interface TradingViewChartProps {
  symbol?: string;
  width?: React.CSSProperties["width"];
  height?: React.CSSProperties["height"];
}

const TradingViewChart: React.FC<TradingViewChartProps> = ({
  symbol = "BINANCE:BTCUSDT",
  width = "100%",
  height = 500,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!containerRef.current) return;

    const script = document.createElement("script");
    script.src = "https://s3.tradingview.com/tv.js";
    script.async = true;
    script.onload = () => {
      // @ts-ignore
      new window.TradingView.widget({
        autosize: true,
        symbol,
        interval: "60",
        timezone: "Etc/UTC",
        theme: "light",
        style: "1",
        locale: "en",
        toolbar_bg: "#f1f3f6",
        enable_publishing: false,
        allow_symbol_change: true,
        container_id: containerRef?.current?.id || "",
      });
    };

    containerRef.current.appendChild(script);
  }, [symbol]);

  return (
    <div id="tradingview_widget" ref={containerRef} style={{ width, height }} />
  );
};

export default TradingViewChart;
