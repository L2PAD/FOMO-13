import React, { FC, useEffect, useState } from "react";
import { PieChart, Pie, Cell, Text } from "recharts";
import { COLORS } from ".";
import { ActiveInfo, PieWrapper } from "./styles";
import EmptyList from "../../../../../global/EmptyList";
import EmptySection from "../../../../../global/EmptySection";
import { clarifyAmount } from "../../../../../../helpers/clarifyAmount";

interface IProps {
  width?: number;
  height?: number;
  innerRadius?: number;
  outerRadius?: number;
  items: Array<any>;
  onChange?: (value: any) => void;
  customColors?: Array<string>;
  dataKey?: string;
}

const parseFiniteNumber = (value: any): number | null => {
  const parsed = Number(
    typeof value === "string"
      ? value.replace(/[$,%\s]/g, "").replace(/,/g, "")
      : value
  );

  return Number.isFinite(parsed) ? parsed : null;
};

const formatPercentLabel = (value: any): string => {
  if (value === null || value === undefined || value === "") return "";

  const parsed = parseFiniteNumber(value);
  if (parsed === null) return "";

  const precision = Math.abs(parsed) > 0 && Math.abs(parsed) < 1 ? 2 : 1;

  return `${parsed
    .toFixed(precision)
    .replace(/\.0+$/, "")
    .replace(/(\.\d*[1-9])0+$/, "$1")}%`;
};

const getActivePercentLabel = (item: any): string => {
  if (!item) return "";

  const explicitLabel =
    item.percentageLabel || item.percentLabel || item.valueLabel;

  if (explicitLabel) {
    return typeof explicitLabel === "string" && explicitLabel.includes("%")
      ? explicitLabel
      : formatPercentLabel(explicitLabel);
  }

  return formatPercentLabel(
    item.tokensAllocatedPercent ?? item.percentage ?? item.percent ?? item.value
  );
};

const PieGraphic: FC<IProps> = ({
  width = 280,
  height = 280,
  innerRadius = 60,
  outerRadius = 120,
  items,
  onChange,
  customColors,
  dataKey = "value",
}) => {
  const [activeIndex, setActiveIndex] = useState<number | null>(null);
  const [isMobile, setIsMobile] = useState(false);
  const activeItem: any | undefined =
    items[typeof activeIndex === "number" ? activeIndex : -1];
  const CURRENT_COLORs = customColors || COLORS;
  const activePercentLabel = getActivePercentLabel(activeItem);

  const handleMouseEnter = (index: number) => {
    setActiveIndex(index);
  };

  const handleMouseLeave = () => {
    setActiveIndex(null);
  };

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
      {items?.length ? (
        <>
          <PieChart className="custom-pie" width={width} height={height}>
            <Pie
              data={items}
              cx="50%"
              cy="50%"
              innerRadius={innerRadius}
              outerRadius={outerRadius}
              paddingAngle={1}
              dataKey={dataKey}
              cornerRadius={8}
              isAnimationActive={false}
              label={({
                cx,
                cy,
                midAngle,
                innerRadius,
                outerRadius,
                percent,
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
                    fontSize={14}
                    onMouseEnter={() => setActiveIndex(index)}
                    onClick={() => onChange && onChange(items[index])}
                  >
                    {`${(percent * 100).toFixed(0)}%`}
                  </Text>
                );
              }}
            >
              {items.map((entry, index) => (
                <Cell
                  onClick={() => onChange && onChange(entry)}
                  style={{ opacity: activeIndex === index ? 0.8 : 1 }}
                  scale={activeIndex === index ? 1.1 : 1}
                  onMouseLeave={() => setActiveIndex(-1)}
                  onMouseEnter={() => setActiveIndex(index)}
                  key={`cell-${index}`}
                  fill={CURRENT_COLORs[index % CURRENT_COLORs.length]}
                />
              ))}
            </Pie>
          </PieChart>
          <ActiveInfo isVisible={!!activeItem}>
            <div className="title">{activeItem?.name || activeItem?.stage}</div>
            <div className="value">{activePercentLabel}</div>
            <div className="project-value">
              {activeItem?.name
                ? activeItem.allocatedLabel
                  ? activeItem.allocatedLabel
                  : activeItem.allocated
                  ? `$${clarifyAmount(activeItem.allocated)}` || "-"
                  : `${activeItem?.amount || 0} Rounds`
                : ""}
            </div>
          </ActiveInfo>
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

export default PieGraphic;
