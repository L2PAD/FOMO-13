import moment from "moment";
import React, { useState, useRef, useCallback, useEffect, useMemo, useId } from "react";
import styled from "styled-components";
import { MetricType } from "../ChartBody";
import { mainGlobalDark } from "../../../../../styles/mainGlobalDark";

export type RangeSelectorVariant = "default" | "dark";

const RangeSelectorContainer = styled.div<{ $variant?: RangeSelectorVariant }>`
  position: relative;
  height: 68px;
  min-height: 68px;
  flex: 0 0 68px;
  background: ${({ $variant }) =>
    $variant === "dark"
      ? `
    repeating-linear-gradient(
      to right,
      rgba(12, 26, 43, 0.07) 0,
      rgba(12, 26, 43, 0.07) 1px,
      transparent 1px,
      transparent 56px
    )
  `
      : `
    linear-gradient(180deg, rgba(255, 255, 255, 0.96) 0%, rgba(248, 250, 252, 0.96) 100%),
    repeating-linear-gradient(
      to right,
      rgba(115, 128, 148, 0.08) 0,
      rgba(115, 128, 148, 0.08) 1px,
      transparent 1px,
      transparent 56px
    )
  `};
  border: 1px solid
    ${({ $variant }) =>
      $variant === "dark" ? "rgba(12, 26, 43, 0.12)" : "#f0f2f5"};
  border-radius: 8px;
  box-shadow: ${({ $variant }) =>
    $variant === "dark"
      ? "none"
      : "rgba(0, 5, 48, 0.06) 1px 2px 8px 0, inset 0 1px 0 rgba(255, 255, 255, 0.92)"};
  margin-top: 0;
  cursor: ew-resize;
  user-select: none;
  touch-action: none;
  transition:
    border-color 0.2s ease,
    box-shadow 0.2s ease;

  &:hover {
    border-color: ${({ $variant }) =>
      $variant === "dark" ? "rgba(12, 26, 43, 0.2)" : "rgba(115, 128, 148, 0.2)"};
    box-shadow: ${({ $variant }) =>
      $variant === "dark"
        ? "rgba(0, 5, 48, 0.08) 1px 3px 10px 0"
        : "rgba(0, 5, 48, 0.08) 1px 3px 10px 0, inset 0 1px 0 rgba(255, 255, 255, 0.96)"};
  }
`;

const Timeline = styled.div`
  position: absolute;
  inset: 0;
`;

const GraphContainer = styled.div`
  position: absolute;
  top: 13px;
  left: 12px;
  right: 12px;
  height: 50px;
  opacity: 0.9;
  pointer-events: none;
`;

const GraphLine = styled.svg`
  width: 100%;
  height: 100%;
  overflow: visible;
`;

const SelectedRange = styled.div<{
  $left: number;
  $width: number;
  $accent: string;
  $active: boolean;
  $variant?: RangeSelectorVariant;
}>`
  position: absolute;
  top: 8px;
  bottom: 8px;
  left: ${({ $left }) => $left}%;
  width: ${({ $width }) => $width}%;
  min-width: 1px;
  background: ${({ $accent }) =>
    `linear-gradient(180deg, ${$accent}22 0%, ${$accent}12 100%)`};
  border: 1px solid ${({ $accent }) => `${$accent}30`};
  border-radius: 7px;
  box-shadow: ${({ $variant }) =>
    $variant === "dark"
      ? "inset 0 1px 0 rgba(255, 255, 255, 0.08), 0 0 0 1px rgba(0, 221, 115, 0.04)"
      : "inset 0 1px 0 rgba(255, 255, 255, 0.68)"};
  cursor: ${({ $active }) => ($active ? "grabbing" : "grab")};
  z-index: 3;
  transition:
    background 0.2s ease,
    border-color 0.2s ease,
    box-shadow 0.2s ease;

  &:hover {
    border-color: ${({ $accent }) => `${$accent}55`};
    box-shadow: ${({ $variant }) =>
      $variant === "dark"
        ? "inset 0 1px 0 rgba(255, 255, 255, 0.1), 0 10px 22px rgba(0, 0, 0, 0.2)"
        : "inset 0 1px 0 rgba(255, 255, 255, 0.74), rgba(0, 5, 48, 0.08) 1px 2px 8px 0"};
  }
`;

const Handle = styled.div<{
  $position: number;
  $accent: string;
  $active: boolean;
  $priority?: boolean;
  $variant?: RangeSelectorVariant;
}>`
  position: absolute;
  top: 50%;
  transform: translate(-50%, -50%);
  left: ${({ $position }) => $position}%;
  width: 18px;
  height: 54px;
  background: ${({ $variant }) =>
    $variant === "dark" ? "#ffffff" : "#ffffff"};
  border: 1px solid
    ${({ $accent, $active, $variant }) =>
      $active
        ? `${$accent}90`
        : $variant === "dark"
          ? "rgba(12, 26, 43, 0.16)"
          : "#dbe2ea"};
  border-radius: 7px;
  cursor: ew-resize;
  box-shadow:
    ${({ $variant }) =>
      $variant === "dark"
        ? "rgba(0, 5, 48, 0.16) 1px 3px 10px 0, inset 0 1px 0 rgba(255, 255, 255, 0.9)"
        : "rgba(0, 5, 48, 0.16) 1px 3px 10px 0, inset 0 1px 0 rgba(255, 255, 255, 0.9)"};
  touch-action: none;
  z-index: ${({ $active, $priority }) => ($active ? 13 : $priority ? 12 : 10)};
  outline: none;
  transition:
    border-color 0.2s ease,
    box-shadow 0.2s ease,
    transform 0.2s ease;

  &::before,
  &::after {
    content: "";
    position: absolute;
    top: 13px;
    bottom: 13px;
    width: 1px;
    border-radius: 1px;
    background: ${({ $variant }) =>
      $variant === "dark" ? "#a9b4c4" : "#a9b4c4"};
  }

  &::before {
    left: 6px;
  }

  &::after {
    right: 6px;
  }

  &:hover,
  &:focus-visible {
    border-color: ${({ $accent }) => `${$accent}78`};
    box-shadow:
      ${({ $variant }) =>
        $variant === "dark"
          ? "rgba(0, 5, 48, 0.2) 1px 4px 12px 0"
          : "rgba(0, 5, 48, 0.2) 1px 4px 12px 0"},
      0 0 0 3px ${({ $accent }) => `${$accent}14`};
  }

  &:active,
  &[data-active="true"] {
    cursor: grabbing;
    transform: translate(-50%, -50%) scale(1.02);
  }

  @media (max-width: 768px) {
    width: 20px;
    height: 58px;
  }
`;

const RangeTooltip = styled.div<{
  $position: number;
  $visible: boolean;
  $align: "start" | "center" | "end";
  $variant?: RangeSelectorVariant;
}>`
  position: absolute;
  top: -8px;
  left: ${({ $position }) => $position}%;
  z-index: 20;
  padding: 7px 9px;
  border-radius: 8px;
  border: 1px solid
    ${({ $variant }) =>
      $variant === "dark" ? "rgba(255, 255, 255, 0.08)" : "transparent"};
  background: ${({ $variant }) =>
    $variant === "dark" ? mainGlobalDark.background : "#070b35"};
  box-shadow: 0 14px 28px rgba(0, 0, 0, 0.22);
  color: ${mainGlobalDark.white};
  font-size: 12px;
  font-weight: var(--font-weight-semibold);
  line-height: 14px;
  white-space: nowrap;
  pointer-events: none;
  opacity: ${({ $visible }) => ($visible ? 1 : 0)};
  transform: ${({ $align }) => {
    if ($align === "start") return "translate(0, calc(-100% - 6px))";
    if ($align === "end") return "translate(-100%, calc(-100% - 6px))";
    return "translate(-50%, calc(-100% - 6px))";
  }};
  transition:
    opacity 0.16s ease,
    transform 0.16s ease;

  &::after {
    content: "";
    position: absolute;
    bottom: -4px;
    left: ${({ $align }) => {
      if ($align === "start") return "12px";
      if ($align === "end") return "calc(100% - 12px)";
      return "50%";
    }};
    width: 8px;
    height: 8px;
    background: ${({ $variant }) =>
      $variant === "dark" ? mainGlobalDark.background : "#070b35"};
    transform: translateX(-50%) rotate(45deg);
  }
`;

interface DataPoint {
  name: string;
  date: number;
  [x: string]: string | number | null;
}

type DragTarget = "start" | "end" | "range";
type TooltipAlign = "start" | "center" | "end";

const MIN_VISUAL_RANGE_WIDTH_PX = 26;
const MIN_DRAG_RANGE_WIDTH_PX = 1;

const clampPercent = (value: number): number =>
  Math.max(0, Math.min(100, value));

interface RangeSelectorProps {
  initialRange: [Date, Date];
  availableRange: [Date, Date];
  data: DataPoint[];
  name: string;
  metric: MetricType;
  onChange: (range: [Date, Date]) => void;
  variant?: RangeSelectorVariant;
  lineColor?: string;
  commitOnRelease?: boolean;
}

const RangeSelector: React.FC<RangeSelectorProps> = ({
  initialRange,
  availableRange,
  data,
  name,
  metric,
  onChange,
  variant = "default",
  lineColor,
  commitOnRelease = false,
}) => {
  const [startPos, setStartPos] = useState(0);
  const [endPos, setEndPos] = useState(100);
  const [activeHandle, setActiveHandle] = useState<DragTarget | null>(null);
  const [hoveredHandle, setHoveredHandle] = useState<DragTarget | null>(null);
  const [containerWidth, setContainerWidth] = useState(0);
  const containerRef = useRef<HTMLDivElement>(null);
  const onChangeRef = useRef(onChange);
  const pendingRangeRef = useRef<[Date, Date] | null>(null);
  const changeFrameRef = useRef<number | null>(null);
  const svgInstanceId = useId().replace(/:/g, "");
  const rangeDragRef = useRef<{
    clientX: number;
    startPos: number;
    endPos: number;
  } | null>(null);
  const handleDragRef = useRef<{
    handle: "start" | "end";
    clientX: number;
    startPos: number;
    endPos: number;
  } | null>(null);
  const selectedRangeLine: string =
    lineColor || (metric === "price" ? "#04A584" : "#007BFF");
  const availableStartMs = availableRange[0].getTime();
  const availableEndMs = availableRange[1].getTime();
  const availableDurationMs = Math.max(0, availableEndMs - availableStartMs);

  useEffect(() => {
    onChangeRef.current = onChange;
  }, [onChange]);

  const updateContainerWidth = useCallback(() => {
    const width = containerRef.current?.getBoundingClientRect().width || 0;
    setContainerWidth((current) =>
      Math.abs(current - width) < 0.5 ? current : width
    );
  }, []);

  useEffect(() => {
    updateContainerWidth();

    const element = containerRef.current;
    if (!element) return undefined;

    if (typeof ResizeObserver !== "undefined") {
      const observer = new ResizeObserver(updateContainerWidth);
      observer.observe(element);

      return () => observer.disconnect();
    }

    window.addEventListener("resize", updateContainerWidth);

    return () => window.removeEventListener("resize", updateContainerWidth);
  }, [updateContainerWidth]);

  const flushPendingRangeChange = useCallback(() => {
    if (changeFrameRef.current !== null) {
      window.cancelAnimationFrame(changeFrameRef.current);
      changeFrameRef.current = null;
    }

    if (pendingRangeRef.current) {
      const nextRange = pendingRangeRef.current;
      pendingRangeRef.current = null;
      onChangeRef.current(nextRange);
    }
  }, []);

  const emitRangeChange = useCallback(
    (range: [Date, Date]) => {
      pendingRangeRef.current = range;

      if (commitOnRelease) return;
      if (changeFrameRef.current !== null) return;

      changeFrameRef.current = window.requestAnimationFrame(() => {
        changeFrameRef.current = null;

        if (!pendingRangeRef.current) return;

        const nextRange = pendingRangeRef.current;
        pendingRangeRef.current = null;
        onChangeRef.current(nextRange);
      });
    },
    [commitOnRelease]
  );

  useEffect(
    () => () => {
      if (changeFrameRef.current !== null) {
        window.cancelAnimationFrame(changeFrameRef.current);
      }
    },
    []
  );

  const percentToDate = useCallback(
    (percent: number): Date => {
      if (availableDurationMs <= 0) return new Date(availableStartMs);

      const timeOffset = (percent / 100) * availableDurationMs;
      return new Date(availableStartMs + timeOffset);
    },
    [availableDurationMs, availableStartMs]
  );

  const dateToPercent = useCallback(
    (date: Date): number => {
      if (availableDurationMs <= 0) return 0;

      const currentTime = date.getTime() - availableStartMs;
      return Math.max(0, Math.min(100, (currentTime / availableDurationMs) * 100));
    },
    [availableDurationMs, availableStartMs]
  );

  useEffect(() => {
    const nextStartPos = dateToPercent(initialRange[0]);
    const nextEndPos = dateToPercent(initialRange[1]);

    setStartPos((current) =>
      Math.abs(current - nextStartPos) < 0.01 ? current : nextStartPos
    );
    setEndPos((current) =>
      Math.abs(current - nextEndPos) < 0.01 ? current : nextEndPos
    );
  }, [dateToPercent, initialRange]);

  const handleMouseDown = useCallback(
    (e: React.MouseEvent, handle: "start" | "end") => {
      e.preventDefault();
      e.stopPropagation();
      rangeDragRef.current = null;
      handleDragRef.current = {
        handle,
        clientX: e.clientX,
        startPos,
        endPos,
      };
      setActiveHandle(handle);
    },
    [endPos, startPos]
  );

  const handleTouchStart = useCallback(
    (e: React.TouchEvent, handle: "start" | "end") => {
      if (!e.touches[0]) return;
      e.preventDefault();
      e.stopPropagation();
      rangeDragRef.current = null;
      handleDragRef.current = {
        handle,
        clientX: e.touches[0].clientX,
        startPos,
        endPos,
      };
      setActiveHandle(handle);
    },
    [endPos, startPos]
  );

  const handleRangeMouseDown = useCallback(
    (e: React.MouseEvent) => {
      e.preventDefault();
      e.stopPropagation();
      handleDragRef.current = null;
      rangeDragRef.current = {
        clientX: e.clientX,
        startPos,
        endPos,
      };
      setActiveHandle("range");
    },
    [startPos, endPos]
  );

  const handleRangeTouchStart = useCallback(
    (e: React.TouchEvent) => {
      if (!e.touches[0]) return;
      e.preventDefault();
      e.stopPropagation();
      handleDragRef.current = null;
      rangeDragRef.current = {
        clientX: e.touches[0].clientX,
        startPos,
        endPos,
      };
      setActiveHandle("range");
    },
    [startPos, endPos]
  );

  const handlePointerMove = useCallback(
    (clientX: number) => {
      if (!activeHandle || !containerRef.current) return;

      const rect = containerRef.current.getBoundingClientRect();
      if (rect.width <= 0) return;

      const position = clampPercent(((clientX - rect.left) / rect.width) * 100);
      const minRangeWidthPercent =
        rect.width > 0
          ? Math.max((MIN_DRAG_RANGE_WIDTH_PX / rect.width) * 100, 0.01)
          : 0.01;

      if (activeHandle === "range" && rangeDragRef.current) {
        const dragState = rangeDragRef.current;
        const delta = ((clientX - dragState.clientX) / rect.width) * 100;
        const rangeWidth = dragState.endPos - dragState.startPos;
        const nextStartPos = Math.max(
          0,
          Math.min(100 - rangeWidth, dragState.startPos + delta)
        );
        const nextEndPos = nextStartPos + rangeWidth;

        setStartPos(nextStartPos);
        setEndPos(nextEndPos);
        emitRangeChange([percentToDate(nextStartPos), percentToDate(nextEndPos)]);
        return;
      }

      if (activeHandle === "start") {
        const dragState = handleDragRef.current;
        const nextPosition =
          dragState?.handle === "start"
            ? dragState.startPos +
              ((clientX - dragState.clientX) / rect.width) * 100
            : position;
        const fixedEndPos =
          dragState?.handle === "start" ? dragState.endPos : endPos;
        const newStartPos = Math.max(
          0,
          Math.min(nextPosition, fixedEndPos - minRangeWidthPercent)
        );

        setStartPos(newStartPos);
        emitRangeChange([percentToDate(newStartPos), percentToDate(fixedEndPos)]);
      } else {
        const dragState = handleDragRef.current;
        const nextPosition =
          dragState?.handle === "end"
            ? dragState.endPos +
              ((clientX - dragState.clientX) / rect.width) * 100
            : position;
        const fixedStartPos =
          dragState?.handle === "end" ? dragState.startPos : startPos;
        const newEndPos = Math.min(
          100,
          Math.max(nextPosition, fixedStartPos + minRangeWidthPercent)
        );

        setEndPos(newEndPos);
        emitRangeChange([percentToDate(fixedStartPos), percentToDate(newEndPos)]);
      }
    },
    [activeHandle, emitRangeChange, startPos, endPos, percentToDate]
  );

  const handleMouseMove = useCallback(
    (e: MouseEvent) => {
      handlePointerMove(e.clientX);
    },
    [handlePointerMove]
  );

  const handleTouchMove = useCallback(
    (e: TouchEvent) => {
      if (e.touches && e.touches[0]) {
        handlePointerMove(e.touches[0].clientX);
      }
    },
    [handlePointerMove]
  );

  const handlePointerUp = useCallback(() => {
    flushPendingRangeChange();
    setActiveHandle(null);
    rangeDragRef.current = null;
    handleDragRef.current = null;
  }, [flushPendingRangeChange]);

  const handleMouseUp = useCallback(() => {
    handlePointerUp();
  }, [handlePointerUp]);

  const handleTouchEnd = useCallback(() => {
    handlePointerUp();
  }, [handlePointerUp]);

  useEffect(() => {
    if (activeHandle) {
      document.addEventListener("mousemove", handleMouseMove);
      document.addEventListener("mouseup", handleMouseUp);
      document.addEventListener("touchmove", handleTouchMove);
      document.addEventListener("touchend", handleTouchEnd);
      return () => {
        document.removeEventListener("mousemove", handleMouseMove);
        document.removeEventListener("mouseup", handleMouseUp);
        document.removeEventListener("touchmove", handleTouchMove);
        document.removeEventListener("touchend", handleTouchEnd);
      };
    }
  }, [
    activeHandle,
    handleMouseMove,
    handleMouseUp,
    handleTouchMove,
    handleTouchEnd,
  ]);

  const graph = useMemo(() => {
    if (!data.length || availableDurationMs <= 0) return null;

    const filteredData = data.filter(
      (point) => point.date >= availableStartMs && point.date <= availableEndMs
    );
    if (!filteredData.length) return null;

    const values = filteredData
      .map((point) => Number(point[name]))
      .filter((value) => Number.isFinite(value));
    if (!values.length) return null;

    const minValue = Math.min(...values);
    const maxValue = Math.max(...values);
    const valueRange = maxValue - minValue || 1;

    const points = filteredData
      .map((point) => {
        const numericValue = Number(point[name]);
        const x = ((point.date - availableStartMs) / availableDurationMs) * 100;
        const y = Number.isFinite(numericValue)
          ? 100 - ((numericValue - minValue) / valueRange) * 100
          : 50;

        return `${x},${y}`;
      })
      .join(" ");
    const areaPoints = `0,100 ${points} 100,100`;
    const mutedGradientId = `range-selector-muted-gradient-${svgInstanceId}-${metric}`;
    const selectedGradientId = `range-selector-selected-gradient-${svgInstanceId}-${metric}`;
    const selectedClipId = `range-selector-selected-clip-${svgInstanceId}-${metric}`;
    const selectedWidth = Math.max(0, endPos - startPos);

    return (
      <GraphLine viewBox="0 0 100 100" preserveAspectRatio="none">
        <defs>
          <linearGradient id={mutedGradientId} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={selectedRangeLine} stopOpacity={0.08} />
            <stop offset="100%" stopColor={selectedRangeLine} stopOpacity={0.01} />
          </linearGradient>
          <linearGradient id={selectedGradientId} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={selectedRangeLine} stopOpacity={0.24} />
            <stop offset="100%" stopColor={selectedRangeLine} stopOpacity={0.03} />
          </linearGradient>
          <clipPath id={selectedClipId}>
            <rect x={startPos} y="0" width={selectedWidth} height="100" />
          </clipPath>
        </defs>
        <polygon points={areaPoints} fill={`url(#${mutedGradientId})`} />
        <polyline
          points={points}
          fill="none"
          stroke={selectedRangeLine}
          strokeWidth="1.8"
          opacity={0.28}
          vectorEffect="non-scaling-stroke"
        />
        <g clipPath={`url(#${selectedClipId})`}>
          <polygon points={areaPoints} fill={`url(#${selectedGradientId})`} />
          <polyline
            points={points}
            fill="none"
            stroke={selectedRangeLine}
            strokeWidth="2.45"
            vectorEffect="non-scaling-stroke"
          />
        </g>
      </GraphLine>
    );
  }, [
    availableDurationMs,
    availableEndMs,
    availableStartMs,
    data,
    endPos,
    metric,
    name,
    selectedRangeLine,
    startPos,
    svgInstanceId,
  ]);

  const formatDate = (date: Date): string => {
    return moment(date).format("DD MMM, HH:mm");
  };

  const getTooltipAlign = (position: number): TooltipAlign => {
    if (position < 12) return "start";
    if (position > 88) return "end";
    return "center";
  };

  const startDate = percentToDate(startPos);
  const endDate = percentToDate(endPos);
  const minVisualRangeWidthPercent =
    containerWidth > 0
      ? Math.min(100, (MIN_VISUAL_RANGE_WIDTH_PX / containerWidth) * 100)
      : 0;
  const { visualStartPos, visualEndPos } = useMemo(() => {
    const actualStart = clampPercent(Math.min(startPos, endPos));
    const actualEnd = clampPercent(Math.max(startPos, endPos));
    const actualWidth = actualEnd - actualStart;

    if (
      minVisualRangeWidthPercent <= 0 ||
      actualWidth >= minVisualRangeWidthPercent
    ) {
      return {
        visualStartPos: actualStart,
        visualEndPos: actualEnd,
      };
    }

    const center = actualStart + actualWidth / 2;
    let nextStart = center - minVisualRangeWidthPercent / 2;
    let nextEnd = center + minVisualRangeWidthPercent / 2;

    if (nextStart < 0) {
      nextEnd = Math.min(100, nextEnd - nextStart);
      nextStart = 0;
    }

    if (nextEnd > 100) {
      nextStart = Math.max(0, nextStart - (nextEnd - 100));
      nextEnd = 100;
    }

    return {
      visualStartPos: nextStart,
      visualEndPos: nextEnd,
    };
  }, [endPos, minVisualRangeWidthPercent, startPos]);
  const visualRangeCenter =
    visualStartPos + (visualEndPos - visualStartPos) / 2;
  const visualRangeWidth = Math.max(0, visualEndPos - visualStartPos);

  return (
    <div>
      <RangeSelectorContainer ref={containerRef} $variant={variant}>
        <Timeline>
          <GraphContainer>{graph}</GraphContainer>
          <RangeTooltip
            $position={visualStartPos}
            $visible={activeHandle === "start" || hoveredHandle === "start"}
            $align={getTooltipAlign(visualStartPos)}
            $variant={variant}
          >
            {formatDate(startDate)}
          </RangeTooltip>
          <RangeTooltip
            $position={visualRangeCenter}
            $visible={activeHandle === "range" || hoveredHandle === "range"}
            $align={getTooltipAlign(visualRangeCenter)}
            $variant={variant}
          >
            {formatDate(startDate)} - {formatDate(endDate)}
          </RangeTooltip>
          <RangeTooltip
            $position={visualEndPos}
            $visible={activeHandle === "end" || hoveredHandle === "end"}
            $align={getTooltipAlign(visualEndPos)}
            $variant={variant}
          >
            {formatDate(endDate)}
          </RangeTooltip>
          <SelectedRange
            $left={visualStartPos}
            $width={visualRangeWidth}
            $accent={selectedRangeLine}
            $active={activeHandle === "range"}
            $variant={variant}
            onMouseDown={handleRangeMouseDown}
            onTouchStart={handleRangeTouchStart}
            onMouseEnter={() => setHoveredHandle("range")}
            onMouseLeave={() => setHoveredHandle(null)}
          />
          <Handle
            $position={visualStartPos}
            $accent={selectedRangeLine}
            $active={activeHandle === "start"}
            $priority={hoveredHandle === "start"}
            $variant={variant}
            data-active={activeHandle === "start"}
            role="slider"
            tabIndex={0}
            aria-label="Start date"
            aria-valuetext={formatDate(startDate)}
            onMouseDown={(e) => handleMouseDown(e, "start")}
            onTouchStart={(e) => handleTouchStart(e, "start")}
            onMouseEnter={() => setHoveredHandle("start")}
            onMouseLeave={() => setHoveredHandle(null)}
            onFocus={() => setHoveredHandle("start")}
            onBlur={() => setHoveredHandle(null)}
          />
          <Handle
            $position={visualEndPos}
            $accent={selectedRangeLine}
            $active={activeHandle === "end"}
            $priority={hoveredHandle === "end"}
            $variant={variant}
            data-active={activeHandle === "end"}
            role="slider"
            tabIndex={0}
            aria-label="End date"
            aria-valuetext={formatDate(endDate)}
            onMouseDown={(e) => handleMouseDown(e, "end")}
            onTouchStart={(e) => handleTouchStart(e, "end")}
            onMouseEnter={() => setHoveredHandle("end")}
            onMouseLeave={() => setHoveredHandle(null)}
            onFocus={() => setHoveredHandle("end")}
            onBlur={() => setHoveredHandle(null)}
          />
        </Timeline>
      </RangeSelectorContainer>
    </div>
  );
};

export default RangeSelector;
