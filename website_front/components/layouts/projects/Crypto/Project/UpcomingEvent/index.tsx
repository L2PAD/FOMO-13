import React, { FC } from "react";
import {
  Body,
  Breakdowns,
  Counter,
  CounterItem,
  Header,
  Wrapper,
} from "./styles";
import { IProject } from "../../../../../../types/global_types";
import { clarifyAmount } from "../../../../../../helpers/clarifyAmount";
import { UnlockTableRow } from "../../../../../../helpers/analyzeVestingSchedule";
import EmptySection from "../../../../../global/EmptySection";
import moment from "moment";
import useTimer from "../../../../../../hooks/useTimerWithTime";
import { resolveProjectTokenDisplaySymbol } from "../../../../../../helpers/projectTokenSymbol";

const COLORS = [
  { bg: "#B9F4E5", border: "#04A584" },
  { bg: "#FDE2E1", border: "#E8504E" },
  { bg: "#FFF4CC", border: "#F2B600" },
  { bg: "#E0E9FD", border: "#3B6DD9" },
  { bg: "#F1E0FD", border: "#A046E8" },
  { bg: "#E1FDF5", border: "#1AB89F" },
  { bg: "#FFE6D5", border: "#FF7A00" },
  { bg: "#E2F0CB", border: "#6DA544" },
  { bg: "#D9F0FF", border: "#0096C7" },
  { bg: "#FFD6E0", border: "#E9407A" },
];

interface IProps {
  project: IProject;
  unlocks?: UnlockTableRow[];
  nextUnlockingEvent?: any;
  tokenSymbol?: string;
}

interface RoundSnapshot {
  name: string;
  unlockedTokens: number;
  unlockedPercent: number;
}

interface ChartItem {
  unlockedPercentInPeriod: number;
  cumulativeUnlockedPercent: number;
  roundSnapshots: RoundSnapshot[];
  date: string; // ISO string
}

interface UnlockDetails {
  allocations: any[];
  chart: ChartItem[];
}

function findUnlockByDate(unlockDetails: UnlockDetails, targetDate: Date | string): ChartItem | null {
  if (!unlockDetails?.chart?.length) return null;

  const target = typeof targetDate === "string" ? new Date(targetDate) : targetDate;

  const exact = unlockDetails.chart.find(c => new Date(c.date).getTime() === target.getTime());
  if (exact) return exact;

  const sorted = [...unlockDetails.chart].sort(
    (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()
  );

  const before = sorted.filter(c => new Date(c.date).getTime() <= target.getTime());
  if (before.length) return before[before.length - 1];

  return sorted[0] || null;
}

const formatPercent = (value: any): string => {
  const percent = Number(value || 0);
  if (!Number.isFinite(percent) || percent === 0) return "--";

  return percent.toFixed(2).replace(/\.?0+$/, "");
};

const formatTokenAmount = (tokenSymbol: string, value: any): string => {
  const amount = Number(value || 0);
  if (!Number.isFinite(amount) || amount === 0) return "--";

  return `${tokenSymbol} ${clarifyAmount(amount)}`.trim();
};

const formatUsdAmount = (value: any): string => {
  const amount = Number(value || 0);
  if (!Number.isFinite(amount) || amount === 0) return "--";

  return `$${clarifyAmount(amount)}`;
};

const UpcomingEvent: FC<IProps> = ({
  project,
  unlocks,
  nextUnlockingEvent,
  tokenSymbol,
}) => {
  const displaySymbol = tokenSymbol || resolveProjectTokenDisplaySymbol(project);
  const unlock: any | null = unlocks?.[0]?.unlockDetails && unlocks[0]?.unlockDetails || null;
  const fallbackEventDate = unlock?.nextTokenUnlockDate || "";
  const parsedFallbackDate = fallbackEventDate ? new Date(fallbackEventDate) : null;
  const fallbackEventTime = parsedFallbackDate?.getTime();
  const hasFallbackUpcomingEvent =
    Number.isFinite(fallbackEventTime) && Number(fallbackEventTime) >= Date.now();
  const nextUnlock: ChartItem | null = unlock
    ? findUnlockByDate(unlock, fallbackEventDate)
    : null;
  const eventDate = nextUnlockingEvent?.unlockDate || (hasFallbackUpcomingEvent ? fallbackEventDate : "");
  const time = useTimer(
    eventDate || new Date().toISOString(),
    eventDate
      ? `${new Date(eventDate).getHours()}:${new Date(eventDate).getMinutes()}`
      : "0:0"
  );

  if (!nextUnlockingEvent && !hasFallbackUpcomingEvent) return (
    <div>
      <br />
      <EmptySection />
      <br />
    </div>
  )

  if (nextUnlockingEvent) {
    const roundNames = Array.isArray(nextUnlockingEvent.roundNames)
      ? nextUnlockingEvent.roundNames
      : [];
    const amount = Number(nextUnlockingEvent.amount || 0);
    const percentOfSupply = Number(
      nextUnlockingEvent.percentOfSupply ?? nextUnlockingEvent.percent ?? 0
    );
    const valueUsd = Number(nextUnlockingEvent.valueUsd || 0);

    return (
      <Wrapper variant="main">
        <Header>
          <div>
            A total of{" "}
            <span>
              {formatTokenAmount(displaySymbol, amount)} ({formatPercent(percentOfSupply)}% of Total Supply)
            </span>{" "}
            is set to be unlocked soon.
          </div>
          <div>
            Releasing approximately{" "}
            <span>{formatUsdAmount(valueUsd)}.</span>
          </div>
        </Header>
        <Body>
          <div className="item">
            <div>Scheduled Unlock Date:</div>
            <span>{eventDate ? moment(eventDate).format("DD.MM.YYYY") : "--"}</span>
          </div>
          <div className="item">
            <div>Total Unlocking Amount:</div>
            <span>{formatTokenAmount(displaySymbol, amount)} ({formatPercent(percentOfSupply)}% of Total Supply)</span>
          </div>
          <div className="item">
            <div>Rounds Count:</div>
            <span>{nextUnlockingEvent.roundsCount || roundNames.length || "--"}</span>
          </div>
        </Body>
        {roundNames.length ? (
          <Breakdowns>
            <div className="title">Unlock Breakdown:</div>
            {roundNames.map((name: string, i: number) => {
              const color = COLORS[i % COLORS.length];

              return (
                <div key={`${name}-${i}`} className="breakdown-item">
                  <div className="breakdown-name">
                    <div
                      className="breakdown-color"
                      style={{ background: color.border }}
                    />
                    {name}
                  </div>
                </div>
              );
            })}
          </Breakdowns>
        ) : (
          null
        )}
        <Counter>
          <CounterItem>
            <div>{Math.max(time.days, 0)}</div>
            <span>Days</span>
          </CounterItem>

          <CounterItem>
            <div>{Math.max(time.hours, 0)}</div>
            <span>Hours</span>
          </CounterItem>

          <CounterItem>
            <div>{Math.max(time.minutes, 0)}</div>
            <span>Minutes</span>
          </CounterItem>

          <CounterItem>
            <div>{Math.max(time.seconds, 0)}</div>
            <span>Seconds</span>
          </CounterItem>
        </Counter>
      </Wrapper>
    );
  }

  return (
    <Wrapper variant="main">
      <Header>
        <div>
          A total of{" "}
          <span>
            {displaySymbol} {clarifyAmount(unlock.totalTokensUnlockedAmount) || 0} ({formatPercent(nextUnlock?.unlockedPercentInPeriod)}% of Total Supply)
          </span>{" "}
          is set to be unlocked soon.
        </div>
        <div>
          Releasing approximately{" "}
          <span>
            ${clarifyAmount(project.marketCap || 0)} (0.0% of Market Cap).
          </span>
        </div>
      </Header>
      <Body>
        <div className="item">
          <div>Scheduled Unlock Date:</div>
          <span>{moment(unlock.nextTokenUnlockDate).format('DD.MM.YYYY')}</span>
        </div>
        <div className="item">
          <div>Total Unlocking Amount:</div>
          <span>{clarifyAmount(unlock.totalTokensUnlockedAmount)} ({unlock.totalTokensUnlockedPercent}% of Total Supply)</span>
        </div>
        {/* <div className="item">
          <div>Estimated Market Impact:</div>
          <span>
            ~${clarifyAmount(project.marketCap || 0)} (0.0% of Market Cap)
          </span>
        </div> */}
      </Body>
      <Breakdowns>
        <div className="title">Unlock Breakdown:</div>
        {(nextUnlock?.roundSnapshots || []).map((item, i: number) => {
          return (
            <div key={i} className="breakdown-item">
              <div className="breakdown-name">
                <div
                  className="breakdown-color"
                  style={{ background: COLORS[i % COLORS.length].border }}
                />
                {item.name}
              </div>
              <div
                className="breakdown-description"
              />
              {clarifyAmount(item.unlockedTokens)} {displaySymbol} ({formatPercent(item.unlockedPercent)})%
            </div>
          );
        })}
      </Breakdowns>
      <Counter>
        <CounterItem>
          <div>{time.days}</div>
          <span>Days</span>
        </CounterItem>

        <CounterItem>
          <div>{time.hours}</div>
          <span>Hours</span>
        </CounterItem>

        <CounterItem>
          <div>{time.minutes}</div>
          <span>Minutes</span>
        </CounterItem>

        <CounterItem>
          <div>{time.seconds}</div>
          <span>Seconds</span>
        </CounterItem>
      </Counter>
    </Wrapper>
  );
};

export default UpcomingEvent;
