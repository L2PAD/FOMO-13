import React, { FC, useEffect, useState } from "react";
import { PieChart, Pie, Cell, Text } from "recharts";
import { COLORS } from ".";
import { ActiveInfo, PieWrapper } from "./styles";
import EmptySection from "../../../../../global/EmptySection";
import Placeholder from "../../../../../global/common/Placeholder";
import { clarifyAmount } from "../../../../../../helpers/clarifyAmount";
import { formatAllocationPercent } from "../../../../../../helpers/dropstabTokenAllocation";

interface IProps {
  width?: number;
  height?: number;
  innerRadius?: number;
  outerRadius?: number;
  items: Array<any>;
  onChange?: (value: any) => void;
  customColors?: Array<string>;
  symbol?: string;
  labelFontSize?: number;
}

const PieAllocationsGraphic: FC<IProps> = ({
  width = 280,
  height = 280,
  innerRadius = 60,
  outerRadius = 120,
  items,
  onChange,
  customColors,
  symbol,
  labelFontSize = 14,
}) => {
  const [activeIndex, setActiveIndex] = useState<number | null>(null);
  const [isMobile, setIsMobile] = useState(false);
  const currentColors = customColors || COLORS;
  const normalizedItems = (items || []).map((item) => {
    const rawPercent = Number(
      item?.tokensAllocatedPercent ?? item?.value ?? item?.percent ?? 0
    );
    const tokensAllocatedPercent =
      Number.isFinite(rawPercent) && rawPercent > 100 && rawPercent <= 10000
        ? rawPercent / 100
        : rawPercent;

    return {
      ...item,
      tokensAllocatedPercent: Number.isFinite(tokensAllocatedPercent)
        ? Math.max(0, tokensAllocatedPercent)
        : 0,
      pieValue: Number.isFinite(tokensAllocatedPercent) && tokensAllocatedPercent > 0
        ? Math.max(0, tokensAllocatedPercent)
        : Number(item?.tokensAllocatedAmount ?? item?.allocated ?? 0) || 0,
    };
  });
  const activeNormalizedItem: any | undefined =
    normalizedItems[typeof activeIndex === "number" ? activeIndex : -1];

  useEffect(() => {
    const checkIsMobile = () => {
      setIsMobile(window.innerWidth <= 768);
    };
    checkIsMobile();
    window.addEventListener("resize", checkIsMobile);
    return () => window.removeEventListener("resize", checkIsMobile);
  }, []);

  return (
    <PieWrapper>
      {normalizedItems?.length ? (
        <>
          <PieChart className="custom-pie" width={width} height={height}>
            <Pie
              data={normalizedItems}
              cx="50%"
              cy="50%"
              innerRadius={innerRadius}
              outerRadius={outerRadius}
              paddingAngle={1}
              dataKey="pieValue"
              cornerRadius={8}
              isAnimationActive={false}
              label={({
                cx,
                cy,
                midAngle,
                innerRadius,
                outerRadius,
                index,
              }) => {
                if (isMobile) return null;
                const RADIAN = Math.PI / 180;
                const radius = innerRadius + (outerRadius - innerRadius) / 2;
                const x = cx + radius * Math.cos(-midAngle * RADIAN);
                const y = cy + radius * Math.sin(-midAngle * RADIAN);

                return (
                  <Text
                    x={x}
                    y={y}
                    fill="#fff"
                    textAnchor="middle"
                    dominantBaseline="central"
                    fontSize={labelFontSize}
                    onMouseEnter={() => setActiveIndex(index)}
                    onClick={() => onChange && onChange(normalizedItems[index])}
                  >
                    {`${formatAllocationPercent(normalizedItems[index]?.tokensAllocatedPercent)}%`}
                  </Text>
                );
              }}
            >
              {normalizedItems.map((entry, index) => (
                <Cell
                  onClick={() => onChange && onChange(entry)}
                  style={{ opacity: activeIndex === index ? 0.8 : 1 }}
                  scale={activeIndex === index ? 1.1 : 1}
                  onMouseLeave={() => setActiveIndex(-1)}
                  onMouseEnter={() => setActiveIndex(index)}
                  key={`cell-${index}`}
                  fill={currentColors[index % currentColors.length]}
                />
              ))}
            </Pie>
          </PieChart>
          {activeNormalizedItem ? (
            <ActiveInfo isVisible={!!activeNormalizedItem}>
              <div className="title">
                {activeNormalizedItem?.name || activeNormalizedItem?.stage}
              </div>
              <div className="value">
                {`${formatAllocationPercent(activeNormalizedItem?.tokensAllocatedPercent)}%`}
              </div>
              <div className="project-value">
                {`${clarifyAmount(activeNormalizedItem?.tokensAllocatedAmount)} ${symbol}`}
              </div>
            </ActiveInfo>
          ) : null}
        </>
      ) : (
        <div>
          <br />
          <EmptySection />
          <br />
        </div>
      )}
    </PieWrapper>
  );
};

export const TokenAllocationPieSkeleton: FC<{
  width?: number;
  height?: number;
}> = ({ width = 280, height = 280 }) => {
  const size = Math.max(120, Math.min(width, height) - 28);

  return (
    <PieWrapper
      style={{
        width,
        height,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      <Placeholder
        width={`${size}px`}
        height={`${size}px`}
        borderRadius="999px"
        marginBottom="0"
      />
    </PieWrapper>
  );
};

export const TokenAllocationListSkeleton: FC<{ rows?: number }> = ({
  rows = 6,
}) => {
  return (
    <>
      {Array.from({ length: rows }).map((_, index) => (
        <Placeholder
          key={`token-allocation-skeleton-${index}`}
          width="100%"
          height="28px"
          borderRadius="8px"
          marginBottom={index === rows - 1 ? "0" : "12px"}
        />
      ))}
    </>
  );
};

export default PieAllocationsGraphic;
