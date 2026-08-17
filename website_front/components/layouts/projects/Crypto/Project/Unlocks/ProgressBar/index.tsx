import React, { useState } from "react";
import { IProject } from "../../../../../../../types/global_types";
import {
  Bar,
  BarFill,
  BarWrapper,
  Bottom,
  Header,
  SegmentTooltip,
  Wrapper,
} from "./styles";
import PercentValue from "../../../../../../global/common/PercentValue";
import EmptySection from "../../../../../../global/EmptySection";
import { clarifyAmount } from "../../../../../../../helpers/clarifyAmount";
import { resolveProjectTokenDisplaySymbol } from "../../../../../../../helpers/projectTokenSymbol";

export interface IUnlockProgressData {
  allocations?: Array<any>;
  isSuccess?: boolean;
  total?: number;
  unlocks?: Array<any>;
  vesting?: Array<any>;
}

interface IProps {
  project: IProject;
  unlocks: IUnlockProgressData | undefined
  tokenSymbol?: string;
}

const toFiniteNumber = (value: any, fallback = 0): number => {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
};

const clampPercent = (value: any): number => {
  const parsed = toFiniteNumber(value, 0);
  return Math.min(Math.max(parsed, 0), 100);
};

const resolveBarPercents = (unlockData: any) => {
  const unlocked = clampPercent(unlockData?.totalTokensUnlockedPercent);
  const untracked = clampPercent(unlockData?.totalTokensUntrackedPercent);
  const locked = clampPercent(unlockData?.totalTokensLockedPercent);
  const total = unlocked + untracked + locked;

  if (total > 100) {
    return {
      unlocked: (unlocked / total) * 100,
      untracked: (untracked / total) * 100,
      locked: (locked / total) * 100,
    };
  }

  return {
    unlocked,
    untracked,
    locked: Math.max(locked, 100 - unlocked - untracked),
  };
};

const formatTokenValueLine = (
  label: string | undefined,
  amountValue: any,
  priceValue: any
): string => {
  const amount = toFiniteNumber(amountValue, 0);
  const price = toFiniteNumber(priceValue, 0);
  const tokenText = `${label || ""} ${clarifyAmount(amount)}`.trim();
  const usdValue = amount * price;

  if (amount <= 0 || usdValue <= 0) return tokenText;

  return `${tokenText} = $${clarifyAmount(usdValue)}`;
};

const formatPercentText = (value: any): string => {
  const percent = clampPercent(value);
  const formatted = Number.isInteger(percent)
    ? percent.toString()
    : percent.toFixed(2).replace(/\.?0+$/, "");

  return `${formatted}%`;
};

const formatDate = (value: any): string => {
  if (!value) return "--";
  const date = new Date(value);
  if (!Number.isFinite(date.getTime())) return "--";

  return date.toLocaleDateString("en-US", {
    month: "short",
    day: "2-digit",
    year: "numeric",
  });
};

const formatSegmentAmount = (amountValue: any, tokenSymbol: string): string => {
  const amount = toFiniteNumber(amountValue, 0);
  return amount > 0 ? `${clarifyAmount(amount)} ${tokenSymbol}` : "--";
};

const getTooltipPlacement = (left: number): "start" | "center" | "end" => {
  if (left < 16) return "start";
  if (left > 84) return "end";
  return "center";
};

const buildSegmentTitle = (
  label: string,
  amountValue: any,
  percentValue: any,
  tokenSymbol: string,
  status: string
): string => {
  const amount = toFiniteNumber(amountValue, 0);
  const tokenLine = amount > 0 ? `${clarifyAmount(amount)} ${tokenSymbol}` : "--";

  return `${label}\nAllocation: ${tokenLine}\nPercent: ${formatPercentText(percentValue)}\nStatus: ${status}`;
};

const ProgressBar: React.FC<IProps> = ({ project, unlocks, tokenSymbol }) => {
  const currentUnlockData: any = unlocks?.unlocks?.[0]
  const displaySymbol = tokenSymbol || resolveProjectTokenDisplaySymbol(project);
  const barPercents = resolveBarPercents(currentUnlockData);
  const [activeSegmentKey, setActiveSegmentKey] = useState<string | null>(null);

  if (!currentUnlockData || !project) return <><br /><EmptySection /><br /></>

  const nextUnlockDate = currentUnlockData.nextTokenUnlockDate;
  const lastUnlockDate = currentUnlockData.lastTokenUnlockDate;
  const segments = [
    {
      key: "unlocked",
      label: "Unlocked",
      amount: currentUnlockData.totalTokensUnlockedAmount,
      percent: currentUnlockData.totalTokensUnlockedPercent,
      width: barPercents.unlocked,
      variant: "unlocked" as const,
      status: lastUnlockDate
        ? `Last unlock ${formatDate(lastUnlockDate)}`
        : "Liquid supply",
    },
    {
      key: "untracked",
      label: "Untracked",
      amount: currentUnlockData.totalTokensUntrackedAmount,
      percent: currentUnlockData.totalTokensUntrackedPercent,
      width: barPercents.untracked,
      variant: "untracked" as const,
      status: "Not classified in vesting schedule",
    },
    {
      key: "locked",
      label: "Locked",
      amount: currentUnlockData.totalTokensLockedAmount,
      percent: currentUnlockData.totalTokensLockedPercent,
      width: barPercents.locked,
      variant: "locked" as const,
      status: nextUnlockDate
        ? `Next unlock ${formatDate(nextUnlockDate)}`
        : "Locked supply",
    },
  ].reduce<Array<any>>((items, segment) => {
    const start = items.reduce((sum, item) => sum + item.width, 0);

    return [
      ...items,
      {
        ...segment,
        start,
        left: Math.min(100, Math.max(0, start + segment.width / 2)),
      },
    ];
  }, []);
  const activeSegment = segments.find((segment) => segment.key === activeSegmentKey);

  return (
    <Wrapper>
      <Header>
        <div className="item">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="12"
            height="14"
            viewBox="0 0 12 14"
            fill="none"
          >
            <path
              d="M2.2502 4.2587C2.2502 2.23276 3.85591 0.601562 5.8502 0.601562C7.09248 0.601562 8.18398 1.23452 8.83051 2.20156M2.4002 4.86823C1.7402 4.86823 1.2002 5.4168 1.2002 6.08728V12.1825C1.2002 12.853 1.7402 13.4016 2.4002 13.4016H9.6002C10.2602 13.4016 10.8002 12.853 10.8002 12.1825V6.08728C10.8002 5.4168 10.2602 4.86823 9.6002 4.86823H2.4002Z"
              stroke="#738094"
              strokeLinecap="round"
            />
          </svg>
          <div className="name">Allocated</div>
          <PercentValue
            value={currentUnlockData.totalTokensUnlockedPercent || 0}
            isIcon={false}
            isLabel={false}
            size="small"
          />
        </div>
        <div className="item untracked">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="12"
            height="14"
            viewBox="0 0 12 14"
            fill="none"
          >
            <path
              d="M2.4002 4.86823V4.25871C2.4002 2.23276 4.00591 0.601562 6.0002 0.601562C7.99448 0.601562 9.6002 2.23276 9.6002 4.25871V4.86823M2.4002 4.86823C1.7402 4.86823 1.2002 5.4168 1.2002 6.08728V12.1825C1.2002 12.853 1.7402 13.4016 2.4002 13.4016H9.6002C10.2602 13.4016 10.8002 12.853 10.8002 12.1825V6.08728C10.8002 5.4168 10.2602 4.86823 9.6002 4.86823M2.4002 4.86823H9.6002"
              stroke="#738094"
              strokeLinecap="round"
            />
          </svg>
          <div>Untracked</div>
          <div>
            {clarifyAmount(toFiniteNumber(currentUnlockData.totalTokensUntrackedAmount, 0))}{" "}
            {formatPercentText(currentUnlockData.totalTokensUntrackedPercent)}
          </div>
        </div>
        <div className="item">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="12"
            height="14"
            viewBox="0 0 12 14"
            fill="none"
          >
            <path
              d="M2.4002 4.86823V4.25871C2.4002 2.23276 4.00591 0.601562 6.0002 0.601562C7.99448 0.601562 9.6002 2.23276 9.6002 4.25871V4.86823M2.4002 4.86823C1.7402 4.86823 1.2002 5.4168 1.2002 6.08728V12.1825C1.2002 12.853 1.7402 13.4016 2.4002 13.4016H9.6002C10.2602 13.4016 10.8002 12.853 10.8002 12.1825V6.08728C10.8002 5.4168 10.2602 4.86823 9.6002 4.86823M2.4002 4.86823H9.6002"
              stroke="#738094"
              strokeLinecap="round"
            />
          </svg>
          <div className="name">Locked</div>
          <PercentValue
            value={currentUnlockData.totalTokensLockedPercent || 0}
            isIcon={false}
            isLabel={false}
            lowValue={1000000}
            size="small"
            neutralWhenZero
          />
        </div>

      </Header>
      <BarWrapper onMouseLeave={() => setActiveSegmentKey(null)}>
        <Bar>
          {segments.map((segment) => (
            <BarFill
              key={segment.key}
              width={segment.width}
              variant={segment.variant}
              role="progressbar"
              tabIndex={0}
              aria-label={buildSegmentTitle(
                segment.label,
                segment.amount,
                segment.percent,
                displaySymbol,
                segment.status
              )}
              aria-valuemin={0}
              aria-valuemax={100}
              aria-valuenow={toFiniteNumber(segment.percent, 0)}
              onFocus={() => setActiveSegmentKey(segment.key)}
              onBlur={() => setActiveSegmentKey(null)}
              onMouseEnter={() => setActiveSegmentKey(segment.key)}
              onClick={(event) => {
                event.preventDefault();
                setActiveSegmentKey((value) =>
                  value === segment.key ? null : segment.key
                );
              }}
              onKeyDown={(event) => {
                if (event.key !== "Enter" && event.key !== " ") return;

                event.preventDefault();
                setActiveSegmentKey((value) =>
                  value === segment.key ? null : segment.key
                );
              }}
            />
          ))}
        </Bar>
        {activeSegment ? (
          <SegmentTooltip
            $left={activeSegment.left}
            $placement={getTooltipPlacement(activeSegment.left)}
            role="tooltip"
          >
            <strong>{activeSegment.label}</strong>
            <div>
              <span>Percent</span>
              <b>{formatPercentText(activeSegment.percent)}</b>
            </div>
            <div>
              <span>Amount</span>
              <b>{formatSegmentAmount(activeSegment.amount, displaySymbol)}</b>
            </div>
            <div>
              <span>Unlock info</span>
              <b>{activeSegment.status || "--"}</b>
            </div>
          </SegmentTooltip>
        ) : null}
      </BarWrapper>
      <Bottom>
        <div>
          {formatTokenValueLine(
            displaySymbol,
            currentUnlockData.totalTokensUnlockedAmount,
            project.price
          )}
        </div>
        <div>
          {formatTokenValueLine(
            displaySymbol,
            currentUnlockData.totalTokensLockedAmount,
            project.price
          )}
        </div>
      </Bottom>
    </Wrapper>
  );
};

export default ProgressBar;
