import React from "react";
import {
  ChartLoadingLineLayer,
  ChartLoadingLineSvg,
  ChartLoadingWrapper,
} from "./styles";

const chartLoadingPath =
  "M0 214 C54 204 78 166 130 176 C188 188 204 118 258 128 C316 138 324 198 382 166 C438 136 446 86 510 102 C574 118 586 166 642 136 C676 118 700 96 720 106";

interface ChartLoadingSkeletonProps {
  className?: string;
  height?: string;
  marginTop?: string;
  variant?: "default" | "compact";
}

const ChartLoadingSkeleton: React.FC<ChartLoadingSkeletonProps> = ({
  className,
  height,
  marginTop,
  variant = "default",
}) => {
  const idPrefix = React.useId().replace(/:/g, "");
  const fillId = `${idPrefix}-chart-loader-fill`;
  const maskId = `${idPrefix}-chart-loader-mask`;
  const isCompact = variant === "compact";

  return (
    <ChartLoadingWrapper
      className={className}
      role="status"
      aria-label="Loading chart data"
      $height={height}
      $marginTop={marginTop}
      $compact={isCompact}
    >
      <ChartLoadingLineLayer $compact={isCompact}>
        <ChartLoadingLineSvg
          viewBox="0 0 720 280"
          preserveAspectRatio="none"
          aria-hidden="true"
        >
          <defs>
            <linearGradient id={fillId} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="rgba(12, 26, 43, 0.2)" />
              <stop offset="58%" stopColor="rgba(12, 26, 43, 0.08)" />
              <stop offset="100%" stopColor="rgba(12, 26, 43, 0)" />
            </linearGradient>
            <mask id={maskId} maskUnits="userSpaceOnUse">
              <rect
                className="chart-loader-mask"
                x="0"
                y="0"
                width="720"
                height="280"
                fill="white"
              />
            </mask>
          </defs>
          <g mask={`url(#${maskId})`}>
            <path
              className="chart-loader-area"
              d={`${chartLoadingPath} L720 280 L0 280 Z`}
              fill={`url(#${fillId})`}
            />
            <path className="chart-loader-line" d={chartLoadingPath} />
          </g>
        </ChartLoadingLineSvg>
      </ChartLoadingLineLayer>
    </ChartLoadingWrapper>
  );
};

export default ChartLoadingSkeleton;
