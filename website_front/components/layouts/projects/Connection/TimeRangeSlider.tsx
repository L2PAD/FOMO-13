import React, { useState, useEffect, useRef } from "react";
import styled from "styled-components";

interface TimeRangeSliderProps {
  minDate: Date;
  maxDate: Date;
  onRangeChange: (startDate: Date, endDate: Date) => void;
}

const TimeRangeSlider: React.FC<TimeRangeSliderProps> = ({
  minDate,
  maxDate,
  onRangeChange,
}) => {
  const [minValue, setMinValue] = useState(0);
  const [maxValue, setMaxValue] = useState(100);
  const [screenWidth, setScreenWidth] = useState(
    typeof window !== "undefined" ? window.innerWidth : 1200
  );
  const minValRef = useRef<HTMLInputElement>(null);
  const maxValRef = useRef<HTMLInputElement>(null);
  const rangeRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  // Generate mock chart data
  const generateChartData = () => {
    const points = 100;
    const data: number[] = [];
    let value = 50;

    for (let i = 0; i < points; i++) {
      value += (Math.random() - 0.5) * 10;
      value = Math.max(20, Math.min(80, value));
      data.push(value);
    }
    return data;
  };

  const chartData = useRef(generateChartData()).current;

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const dpr = window.devicePixelRatio || 1;
    const rect = canvas.getBoundingClientRect();

    canvas.width = rect.width * dpr;
    canvas.height = rect.height * dpr;
    ctx.scale(dpr, dpr);

    // Clear canvas
    ctx.clearRect(0, 0, rect.width, rect.height);

    // Draw chart line
    ctx.beginPath();
    ctx.strokeStyle = "rgba(1, 113, 217, 0.3)";
    ctx.lineWidth = 1.5;

    chartData.forEach((value, index) => {
      const x = (index / (chartData.length - 1)) * rect.width;
      const y = rect.height - (value / 100) * rect.height;

      if (index === 0) {
        ctx.moveTo(x, y);
      } else {
        ctx.lineTo(x, y);
      }
    });

    ctx.stroke();

    // Draw filled area under curve
    ctx.lineTo(rect.width, rect.height);
    ctx.lineTo(0, rect.height);
    ctx.closePath();
    ctx.fillStyle = "rgba(1, 113, 217, 0.05)";
    ctx.fill();

    // Highlight selected range
    const startX = (minValue / 100) * rect.width;
    const endX = (maxValue / 100) * rect.width;

    ctx.beginPath();
    ctx.strokeStyle = "rgba(1, 113, 217, 0.8)";
    ctx.lineWidth = 2;

    let started = false;
    chartData.forEach((value, index) => {
      const x = (index / (chartData.length - 1)) * rect.width;
      const y = rect.height - (value / 100) * rect.height;

      if (x >= startX && x <= endX) {
        if (!started) {
          ctx.moveTo(x, y);
          started = true;
        } else {
          ctx.lineTo(x, y);
        }
      }
    });

    ctx.stroke();

    // Fill selected area
    if (started) {
      ctx.lineTo(endX, rect.height);
      ctx.lineTo(startX, rect.height);
      ctx.closePath();
      ctx.fillStyle = "rgba(1, 113, 217, 0.15)";
      ctx.fill();
    }
  }, [minValue, maxValue, chartData]);

  const getDateFromPercent = (percent: number): Date => {
    const totalMs = maxDate.getTime() - minDate.getTime();
    const offsetMs = (totalMs * percent) / 100;
    return new Date(minDate.getTime() + offsetMs);
  };

  const formatDateRange = (): string[] => {
    const startYear = minDate.getFullYear();
    const endYear = maxDate.getFullYear();
    const totalYears = endYear - startYear + 1;
    const labels: string[] = [];

    // Mobile: show only years, fewer of them (every 2nd year)
    if (screenWidth < 480) {
      const step = Math.max(2, Math.ceil(totalYears / 3));
      for (let y = startYear; y <= endYear; y += step) {
        labels.push(`${y}`);
      }
    }
    // Tablet: show years without months (every year)
    else if (screenWidth < 768) {
      const step = Math.max(1, Math.ceil(totalYears / 5));
      for (let y = startYear; y <= endYear; y += step) {
        labels.push(`${y}`);
      }
    }
    // Desktop: show quarters between years
    else {
      for (let y = startYear; y <= endYear; y++) {
        labels.push(`${y}`);
        // Add quarters only if not the last year or if we need more granularity
        if (y < endYear || totalYears <= 3) {
          labels.push("Q1");
          labels.push("Q2");
          labels.push("Q3");
          labels.push("Q4");
        }
      }
    }

    return labels;
  };

  useEffect(() => {
    const startDate = getDateFromPercent(minValue);
    const endDate = getDateFromPercent(maxValue);
    onRangeChange(startDate, endDate);
  }, [minValue, maxValue]);

  useEffect(() => {
    const handleResize = () => {
      setScreenWidth(window.innerWidth);
    };

    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  const handleMinChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = Math.min(Number(e.target.value), maxValue - 1);
    setMinValue(value);
  };

  const handleMaxChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = Math.max(Number(e.target.value), minValue + 1);
    setMaxValue(value);
  };

  return (
    <Container>
      <ChartAndSliderWrapper>
        <ChartContainer>
          <ChartCanvas ref={canvasRef} />
        </ChartContainer>
        <SliderWrapper>
          <SliderTrack />
          <SliderRange
            ref={rangeRef}
            style={{
              left: `${minValue}%`,
              width: `${maxValue - minValue}%`,
            }}
          />
          <ThumbInput
            type="range"
            min={0}
            max={100}
            value={minValue}
            onChange={handleMinChange}
            ref={minValRef}
            style={{ zIndex: minValue > 100 - maxValue ? 5 : 3 }}
          />
          <ThumbInput
            type="range"
            min={0}
            max={100}
            value={maxValue}
            onChange={handleMaxChange}
            ref={maxValRef}
          />
        </SliderWrapper>
        <DateLabels>
          {formatDateRange().map((label, index) => (
            <DateLabel key={index}>{label}</DateLabel>
          ))}
        </DateLabels>
      </ChartAndSliderWrapper>
    </Container>
  );
};

export default TimeRangeSlider;

const Container = styled.div`
  width: 100%;
  display: flex;
  flex-direction: column;
  gap: 12px;
  position: relative;
`;

const ChartAndSliderWrapper = styled.div`
  position: relative;
  width: 100%;
  height: 40px;
`;

const ChartContainer = styled.div`
  width: 100%;
  height: 100%;
  position: absolute;
  top: 0;
  left: 0;
  pointer-events: none;
`;

const ChartCanvas = styled.canvas`
  width: 100%;
  height: 100%;
  display: block;
`;

const SliderWrapper = styled.div`
  position: absolute;
  bottom: 0;
  left: 0;
  width: 100%;
  height: 40px;
`;

const SliderTrack = styled.div`
  position: absolute;
  width: 100%;
  height: 40px;
  background: transparent;
  border-radius: 3px;
`;

const SliderRange = styled.div`
  position: absolute;
  height: 40px;
  background: linear-gradient(
    90deg,
    rgba(1, 113, 217, 0.15) 0%,
    rgba(1, 113, 217, 0.15) 100%
  );
  border-radius: 3px;
  z-index: 2;
  border-left: 4px solid rgba(1, 113, 217, 0.6);
  border-right: 4px solid rgba(1, 113, 217, 0.6);
`;

const ThumbInput = styled.input`
  position: absolute;
  width: 100%;
  height: 40px;
  background: none;
  pointer-events: none;
  -webkit-appearance: none;
  appearance: none;
  z-index: 3;

  &::-webkit-slider-thumb {
    -webkit-appearance: none;
    appearance: none;
    width: 3px;
    height: 40px;
    background: #0171d9;
    border: none;
    border-radius: 2px;
    cursor: pointer;
    pointer-events: all;
    transition: all 0.2s ease;

    &:hover {
      width: 4px;
      background: #3498fc;
    }

    &:active {
      width: 5px;
    }
  }

  &::-moz-range-thumb {
    width: 3px;
    height: 40px;
    background: #0171d9;
    border: none;
    border-radius: 2px;
    cursor: pointer;
    pointer-events: all;
    transition: all 0.2s ease;

    &:hover {
      width: 4px;
      background: #3498fc;
    }

    &:active {
      width: 5px;
    }
  }
`;

const DateLabels = styled.div`
  position: absolute;
  top: 0;
  left: 4px;
  width: calc(100% - 8px);
  height: 100%;
  pointer-events: none;
  z-index: 4;
  display: flex;
  flex-direction: row;
  justify-content: space-between;
  gap: 4px;

  @media (max-width: 768px) {
    gap: 2px;
  }
`;

const DateLabel = styled.div`
  font-size: 10px;
  font-weight: var(--font-weight-medium);
  color: rgba(248, 250, 252, 0.7);
  letter-spacing: 0.2px;
  white-space: nowrap;

  @media (max-width: 768px) {
    font-size: 9px;
  }

  @media (max-width: 480px) {
    font-size: 8px;
  }
`;
