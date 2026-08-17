import React from "react";
import TopEventsChart from "../../../../global/common/TopEventsChart";
import CorrelationChart from "../../../../global/common/CorrelationChart";
import {
  getUnlockPrimaryEvent,
  getUnlockStageLabel,
} from "../../../../../helpers/unlockingDisplay";
import { Charts, ChartsWrapper } from "../styles";

interface IUnlockingAnalyticsProps {
  translateText: (value: string) => string;
  unlocks?: Array<any>;
}

const UnlockingAnalytics = ({
  translateText,
  unlocks = [],
}: IUnlockingAnalyticsProps) => {
  const topUnlockEvents = [...unlocks]
    .map((item: any) => {
      const event = getUnlockPrimaryEvent(item);
      const valueUsd =
        item?.nextUnlockValueUsd ||
        event?.raw?.unlockValueUsd ||
        event?.raw?.unlock_value_usd ||
        event?.raw?.valueUsd ||
        event?.raw?.value_usd ||
        0;

      return {
        name: item?.detailed?.name || event?.name || item?.coinSlug || "-",
        logo: item?.detailed?.image || item?.logo || event?.logo,
        rating: 0,
        uv: Number(valueUsd || 0) / 1_000_000,
        unlockVolume: valueUsd,
        unlockDate: event?.dateValue || item?.nextTokenUnlockDate,
        category: getUnlockStageLabel(item),
      };
    })
    .filter((item) => Number.isFinite(item.unlockVolume) && item.unlockVolume > 0)
    .sort((left, right) => right.unlockVolume - left.unlockVolume)
    .slice(0, 5);
  const topUnlockMaxValue = Math.max(
    ...topUnlockEvents.map((item) => Number(item.uv || 0)),
    10
  );
  const topUnlockStep = Math.ceil(topUnlockMaxValue / 5) || 2;
  const topUnlockLabels = Array.from({ length: 6 }, (_, index) =>
    String(topUnlockStep * (5 - index))
  );

  return (
    <ChartsWrapper>
      <h2>{translateText("Analytics")}</h2>
      <Charts>
        <div className="unlocking-chart-cell">
          <TopEventsChart
            title={translateText("Top 5 Unlock Events")}
            labels={topUnlockLabels}
            items={topUnlockEvents}
          />
        </div>
        <div className="unlocking-chart-cell">
          <CorrelationChart />
        </div>
      </Charts>
    </ChartsWrapper>
  );
};

export default UnlockingAnalytics;
