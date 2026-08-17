import React, { useEffect, useMemo, useState } from "react";
import styled from "styled-components";

type UnlockCountdownProps = {
  targetDate?: Date | string | null;
  className?: string;
};

const CountdownGrid = styled.div`
  width: 100%;
  max-width: 128px;
  min-width: 112px;
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 3px;
`;

const CountdownCell = styled.div`
  min-width: 0;
  padding: 4px 2px;
  border: 1px solid #d8e2f0;
  border-radius: 6px;
  background: #ffffff;
  box-shadow: 0 1px 2px rgba(15, 23, 42, 0.04);
  text-align: center;
`;

const CountdownValue = styled.div`
  font-weight: var(--font-weight-semibold);
  font-size: 12px;
  line-height: 15px;
  color: #070b35;
`;

const CountdownLabel = styled.span`
  display: block;
  margin-top: 1px;
  font-weight: var(--font-weight-medium);
  font-size: 9px;
  line-height: 11px;
  color: #738094;
`;

const CountdownFallback = styled.div`
  font-weight: var(--font-weight-semibold);
  font-size: 12px;
  line-height: 15px;
  color: #070b35;
`;

const getTargetTimestamp = (
  targetDate?: Date | string | null
): number | null => {
  if (!targetDate) return null;

  const parsedDate = new Date(targetDate);
  const timestamp = parsedDate.getTime();

  return Number.isNaN(timestamp) ? null : timestamp;
};

const getRemainingMs = (targetTimestamp: number | null): number => {
  if (targetTimestamp === null) return 0;

  return Math.max(targetTimestamp - Date.now(), 0);
};

const formatSegmentValue = (value: number): string => {
  const normalizedValue = Math.max(0, value);

  return String(normalizedValue).padStart(2, "0");
};

const UnlockCountdown = ({ targetDate, className }: UnlockCountdownProps) => {
  const targetTimestamp = useMemo(
    () => getTargetTimestamp(targetDate),
    [targetDate]
  );
  const [remainingMs, setRemainingMs] = useState(0);

  useEffect(() => {
    if (targetTimestamp === null) {
      setRemainingMs(0);
      return;
    }

    const updateCountdown = () => {
      setRemainingMs(getRemainingMs(targetTimestamp));
    };

    updateCountdown();

    const intervalId = window.setInterval(updateCountdown, 1000);

    return () => {
      window.clearInterval(intervalId);
    };
  }, [targetTimestamp]);

  const segments = useMemo(() => {
    const totalSeconds = Math.floor(remainingMs / 1000);
    const days = Math.floor(totalSeconds / 86400);
    const hours = Math.floor((totalSeconds % 86400) / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);

    return [
      { label: "Days", value: days },
      { label: "Hrs", value: hours },
      { label: "Min", value: minutes },
    ];
  }, [remainingMs]);

  if (targetTimestamp === null) {
    return <CountdownFallback className={className}>-</CountdownFallback>;
  }

  return (
    <CountdownGrid className={className}>
      {segments.map((segment) => (
        <CountdownCell key={segment.label}>
          <CountdownValue>{formatSegmentValue(segment.value)}</CountdownValue>
          <CountdownLabel>{segment.label}</CountdownLabel>
        </CountdownCell>
      ))}
    </CountdownGrid>
  );
};

export default UnlockCountdown;
