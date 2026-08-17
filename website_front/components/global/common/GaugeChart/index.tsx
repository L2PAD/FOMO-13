import React, { useEffect, useId, useState } from "react";

interface SemiCircleChartProps {
  value: number; // Значение от 0 до 100
}

const SemiCircleChart: React.FC<SemiCircleChartProps> = ({ value }) => {
  const normalizedValue = Math.min(Math.max(value, 0), 100); // Ограничение от 0 до 100
  const [isMobile, setIsMobile] = useState(false);
  const gradientId = useId().replace(/:/g, "");

  useEffect(() => {
    if (typeof window === "undefined") return;

    const updateIsMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };

    updateIsMobile();
    window.addEventListener("resize", updateIsMobile);

    return () => {
      window.removeEventListener("resize", updateIsMobile);
    };
  }, []);

  const width = isMobile ? 140 : 180; // Ширина SVG
  const strokeWidth = 15; // Толщина дуги
  const radius = (width - strokeWidth * 2) / 2; // Радиус дуги
  const center = radius + strokeWidth; // Центр круга
  const circumference = Math.PI * radius; // Длина окружности
  const arcLength = (normalizedValue / 100) * circumference; // Длина дуги

  const getTextAndColor = (value: number) => {
    if (value < 20) return { text: "Extreme Fear", color: "#070B35" };
    if (value < 40) return { text: "Fear", color: "#070B35" };
    if (value < 60) return { text: "Neutral", color: "#070B35" };
    if (value < 80) return { text: "Greed", color: "#070B35" };
    return { text: "Extreme Greed", color: "#070B35" };
  };

  const { text, color } = getTextAndColor(normalizedValue);

  return (
    <svg
      width={width}
      height={center + strokeWidth + 10}
      viewBox={`0 0 ${width} ${center + strokeWidth}`}
      style={{ overflow: "visible" }}
    >
      <defs>
        <linearGradient id={gradientId} x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%" stopColor="red" />
          <stop offset="50%" stopColor="yellow" />
          <stop offset="100%" stopColor="green" />
        </linearGradient>
      </defs>

      <path
        d={`M ${strokeWidth},${center}
           A ${radius},${radius} 0 1 1 ${width - strokeWidth},${center}`}
        fill="none"
        stroke="#E0E0E0"
        strokeWidth={strokeWidth}
      />

      <path
        d={`M ${strokeWidth},${center}
           A ${radius},${radius} 0 1 1 ${width - strokeWidth},${center}`}
        fill="none"
        stroke={`url(#${gradientId})`}
        strokeWidth={strokeWidth}
        strokeDasharray={`${arcLength} ${circumference}`}
        strokeLinecap="round"
      />

      <circle
        cx={width - strokeWidth}
        cy={center}
        r={strokeWidth / 2}
        fill={normalizedValue === 100 ? `url(#${gradientId})` : "#E0E0E0"}
      />

      <circle
        cx={
          center +
          radius * Math.cos((normalizedValue / 100) * Math.PI - Math.PI)
        }
        cy={
          center +
          radius * Math.sin((normalizedValue / 100) * Math.PI - Math.PI)
        }
        r="10"
        fill={color}
      />

      <text
        x="50%"
        y="70%"
        textAnchor="middle"
        fill={color}
        fontSize="28px"
        fontWeight="bold"
      >
        {normalizedValue}
      </text>
      <text
        x="50%"
        y="105%"
        textAnchor="middle"
        fill="#070B35"
        fontSize="14px"
        fontWeight="600"
      >
        {text}
      </text>
    </svg>
  );
};

export default SemiCircleChart;
