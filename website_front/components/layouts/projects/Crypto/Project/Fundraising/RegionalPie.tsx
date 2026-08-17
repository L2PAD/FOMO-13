import React, { FC, useEffect, useState } from "react";
import { PieChart, Pie, Cell, Text, Tooltip } from "recharts";
import { PieWrapper } from "./styles";

export const COLORS = ["#008A4E", "#BC322E", "#860D73", "#02AFB0", "#193081"];

interface IProps {
  width?: number;
  height?: number;
  innerRadius?: number;
  outerRadius?: number;
  items: Array<any>;
}

const normalizeTooltipText = (value: any): string => {
  if (typeof value === "string") {
    const trimmed = value.trim();
    return trimmed && trimmed !== "[object Object]" ? trimmed : "";
  }

  if (typeof value === "number" && Number.isFinite(value)) {
    return String(value);
  }

  if (value && typeof value === "object") {
    return normalizeTooltipText(
      value.regionLabel ||
        value.name ||
        value.label ||
        value.displayName ||
        value.title ||
        value.country ||
        value.region ||
        value.properties?.name ||
        value.id ||
        value.code
    );
  }

  return "";
};

const CustomTooltip = ({ active, payload }: any) => {
  if (active && payload && payload.length) {
    const tooltipItem = payload[0];
    const itemPayload = tooltipItem.payload || {};
    const {
      name,
      country,
      region,
      regionLabel,
      perPersons,
      numPersons,
      sectors,
      activeProjects,
      totalInvestments,
      growth,
      percentage,
      value,
    } = itemPayload;
    const displayRegion =
      normalizeTooltipText(regionLabel) ||
      normalizeTooltipText(region) ||
      normalizeTooltipText(country) ||
      normalizeTooltipText(name) ||
      normalizeTooltipText(tooltipItem.name) ||
      "-";
    const percentageValue =
      typeof percentage === "number"
        ? percentage
        : typeof tooltipItem.percent === "number"
          ? Number((tooltipItem.percent * 100).toFixed(2))
          : null;
    const personsValue = numPersons ?? value ?? tooltipItem.value;

    return (
      <div
        style={{
          background: "rgba(255, 255, 255, 0.3)",
          backdropFilter: "blur(25px)",
          WebkitBackdropFilter: "blur(25px)",
          borderRadius: "8px",
          padding: "10px",
          boxShadow: "0 2px 8px rgba(0,0,0,0.15)",
          fontFamily: "Arial",
          fontSize: "12px",
          color: "#070B35",
        }}
      >
        <p style={{ margin: "5px 0" }}>
          <strong>Region:</strong> {displayRegion}
        </p>
        <p style={{ margin: "5px 0" }}>
          <strong>Percentage:</strong>{" "}
          {perPersons ||
            (percentageValue !== null ? `${percentageValue}%` : "-")}
        </p>
        {personsValue !== undefined ? (
          <p style={{ margin: "5px 0" }}>
            <strong>Number of Persons:</strong> {personsValue}
          </p>
        ) : null}
        {sectors ? (
          <p style={{ margin: "5px 0" }}>
            <strong>Top Industries:</strong> {sectors}
          </p>
        ) : null}
        {activeProjects ? (
          <p style={{ margin: "5px 0" }}>
            <strong>Active Projects:</strong> {activeProjects}
          </p>
        ) : null}
        {totalInvestments ? (
          <p style={{ margin: "5px 0" }}>
            <strong>Total Investments:</strong> {totalInvestments}
          </p>
        ) : null}
        {growth ? (
          <p style={{ margin: "5px 0" }}>
            <strong>Growth:</strong> {growth}
          </p>
        ) : null}
      </div>
    );
  }
  return null;
};

const RegionalPieGraphic: FC<IProps> = ({
  width = 280,
  height = 280,
  innerRadius = 60,
  outerRadius = 120,
  items,
}) => {
  const [activeIndex, setActiveIndex] = useState<number | null>(null);
  const [isMobile, setIsMobile] = useState(false);

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
      <PieChart className="custom-pie" width={width} height={height}>
        <Pie
          data={items}
          cx="50%"
          cy="50%"
          innerRadius={innerRadius}
          outerRadius={outerRadius}
          paddingAngle={1}
          dataKey="value"
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
            payload,
          }) => {
            if (isMobile) return null;
            const RADIAN = Math.PI / 180;
            const radius = innerRadius + (outerRadius - innerRadius) / 2;
            const x = cx + radius * Math.cos(-midAngle * RADIAN);
            const y = cy + radius * Math.sin(-midAngle * RADIAN);
            const percentage =
              typeof payload?.percentage === "number"
                ? payload.percentage
                : Number((percent * 100).toFixed(0));

            return (
              <Text
                x={x}
                y={y}
                fill="#fff"
                textAnchor="middle"
                dominantBaseline="central"
                fontSize={14}
              >
                {`${Math.round(percentage)}%`}
              </Text>
            );
          }}
        >
          {items.map((entry, index) => (
            <Cell
              key={`cell-${index}`}
              fill={COLORS[index % COLORS.length]}
              style={{ opacity: activeIndex === index ? 0.8 : 1 }}
              onMouseEnter={() => setActiveIndex(index)}
              onMouseLeave={() => setActiveIndex(null)}
            />
          ))}
        </Pie>
        <Tooltip content={<CustomTooltip />} cursor={{ fill: "transparent" }} />
      </PieChart>
    </PieWrapper>
  );
};

export default RegionalPieGraphic;
