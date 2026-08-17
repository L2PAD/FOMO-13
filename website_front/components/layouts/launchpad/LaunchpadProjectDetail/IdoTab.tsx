import React from "react";
import {
  Card,
  CardTitle,
  FundingRow,
  FundingLabel,
  FundingValue,
  ProgressBarBg,
  ProgressBarFill,
  IdoStatGrid,
  IdoStatRow,
  IdoStatCard,
  IdoStatIconWrapper,
  IdoStatInfo,
  IdoStatLabel,
  IdoStatValue,
  AllocationZonesRow,
  ZoneInfoCard,
  ZoneDotHeader,
  ZoneDot,
  ZoneName,
  ZoneDescText,
} from "./styles";
import { LaunchpadProjectDetailData } from "./types";
import {
  IconDollarCoin,
  IconTarget24,
  IconShield24,
  IconCoinNumber,
  IconBullish,
  IconClock24,
} from "../../../global/Icons/Launchpad/icons";
import { FaqCard, RiskNoticeCard } from "./FaqSection";

interface IdoTabProps {
  project: LaunchpadProjectDetailData;
  openFaqId: string | null;
  onFaqToggle: (id: string) => void;
}

const IdoTab: React.FC<IdoTabProps> = ({ project, openFaqId, onFaqToggle }) => (
  <>
    <Card>
      <CardTitle>Funding Progress</CardTitle>
      <div style={{ display: "flex", flexDirection: "column", gap: 12, width: "100%" }}>
        <FundingRow>
          <FundingLabel>Raised</FundingLabel>
          <FundingValue>{project.ido.raised} / {project.ido.hardCap}</FundingValue>
        </FundingRow>
        <ProgressBarBg>
          <ProgressBarFill percent={project.ido.progress} />
        </ProgressBarBg>
        <FundingRow>
          <FundingLabel>{project.ido.progress}% Complete</FundingLabel>
          {project.display.showParticipants && (
            <FundingLabel>{project.ido.participants.toLocaleString()} participants</FundingLabel>
          )}
        </FundingRow>
      </div>
    </Card>

    <IdoStatGrid>
      <IdoStatCard>
        <IdoStatIconWrapper><IconDollarCoin /></IdoStatIconWrapper>
        <IdoStatInfo>
          <IdoStatLabel>Token Price</IdoStatLabel>
          <IdoStatValue>{project.ido.tokenPrice}</IdoStatValue>
        </IdoStatInfo>
      </IdoStatCard>
      <IdoStatCard>
        <IdoStatIconWrapper><IconTarget24 /></IdoStatIconWrapper>
        <IdoStatInfo>
          <IdoStatLabel>Hard Cap</IdoStatLabel>
          <IdoStatValue>{project.ido.hardCap}</IdoStatValue>
        </IdoStatInfo>
      </IdoStatCard>
      <IdoStatCard>
        <IdoStatIconWrapper><IconShield24 /></IdoStatIconWrapper>
        <IdoStatInfo>
          <IdoStatLabel>Allocation Size</IdoStatLabel>
          <IdoStatValue>{project.ido.allocationSize}</IdoStatValue>
        </IdoStatInfo>
      </IdoStatCard>
      <IdoStatCard>
        <IdoStatIconWrapper><IconCoinNumber /></IdoStatIconWrapper>
        <IdoStatInfo>
          <IdoStatLabel>Min Investment</IdoStatLabel>
          <IdoStatValue>{project.ido.minInvestment}</IdoStatValue>
        </IdoStatInfo>
      </IdoStatCard>
      <IdoStatCard>
        <IdoStatIconWrapper><IconBullish /></IdoStatIconWrapper>
        <IdoStatInfo>
          <IdoStatLabel>Current Allocation</IdoStatLabel>
          <IdoStatValue>{project.ido.maxInvestment}</IdoStatValue>
        </IdoStatInfo>
      </IdoStatCard>
      {project.display.showCountdown && (
        <IdoStatCard>
          <IdoStatIconWrapper><IconClock24 /></IdoStatIconWrapper>
          <IdoStatInfo>
            <IdoStatLabel>Time Remaining</IdoStatLabel>
            <IdoStatValue>{project.ido.timeRemaining}</IdoStatValue>
          </IdoStatInfo>
        </IdoStatCard>
      )}
    </IdoStatGrid>

    <Card>
      <CardTitle>Allocation Zones</CardTitle>
      <AllocationZonesRow>
        <ZoneInfoCard variant="green">
          <ZoneDotHeader>
            <ZoneDot color="#05a584" />
            <ZoneName>Green Zone</ZoneName>
          </ZoneDotHeader>
          <ZoneDescText>{project.ido.zoneDescriptions.green}</ZoneDescText>
        </ZoneInfoCard>
        <ZoneInfoCard variant="yellow">
          <ZoneDotHeader>
            <ZoneDot color="#ffc704" />
            <ZoneName>Yellow Zone</ZoneName>
          </ZoneDotHeader>
          <ZoneDescText>{project.ido.zoneDescriptions.yellow}</ZoneDescText>
        </ZoneInfoCard>
        <ZoneInfoCard variant="red">
          <ZoneDotHeader>
            <ZoneDot color="#ff5857" />
            <ZoneName>Red Zone</ZoneName>
          </ZoneDotHeader>
          <ZoneDescText>{project.ido.zoneDescriptions.red}</ZoneDescText>
        </ZoneInfoCard>
      </AllocationZonesRow>
    </Card>

    <FaqCard items={project.faq} openId={openFaqId} onToggle={onFaqToggle} />
    <RiskNoticeCard />
  </>
);

export default IdoTab;
