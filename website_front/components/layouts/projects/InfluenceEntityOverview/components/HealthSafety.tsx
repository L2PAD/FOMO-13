import React from "react";
import styled from "styled-components";

const CardWrapper = styled.div<{ forCompare?: boolean }>`
  background: ${({ forCompare }) => (forCompare ? "#f5fbfd" : "#f5fbfd")};
  border-radius: ${({ forCompare }) => (forCompare ? "12px" : "20px")};
  padding: ${({ forCompare }) => (forCompare ? "20px" : "20px")};
  width: 100%;

  @media (max-width: 768px) {
    padding: 12px;
  }
`;

const CardHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
`;

const CardTitle = styled.h3`
  font-size: 24px;
  font-weight: var(--font-weight-semibold);
  color: #070b35;
  margin: 0;
  @media (max-width: 768px) {
    font-size: 18px;
  }
`;

const CardBadge = styled.span`
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 12px;
  color: #728094;
  padding: 4px 8px;
  border-radius: 6px;
  border: 1px solid #b5bcc7;
`;

const MetricRow = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 12px;
`;

const MetricLabel = styled.span`
  font-size: 14px;
  color: #070b35;
  min-width: max-content;
`;

const MetricValue = styled.span`
  font-size: 14px;
  font-weight: var(--font-weight-semibold);
  color: #070b35;
`;

const ProgressContainer = styled.div`
  display: flex;
  align-items: center;
  gap: 12px;
  width: 100%;
  margin-left: 20px;
`;

const ProgressTrack = styled.div`
  width: 100%;
  height: 2px;
  background: linear-gradient(90deg, #00ffe3 0%, #00b4e2 50%, #0f66dd 100%);
  border-radius: 3px;
  position: relative;
`;

const ProgressDot = styled.div<{ position: number }>`
  position: absolute;
  top: 50%;
  left: ${({ position }) => position}%;
  transform: translate(-50%, -50%);
  width: 7px;
  height: 7px;
  background: #070b35;
  border-radius: 50%;
`;

const FooterNote = styled.p`
  font-size: 14px;
  line-height: 1.2;
  color: #070b35;
  margin: 20px 0 0 0;
`;

interface HealthSafetyProps {
  spamLevel?: "low" | "medium" | "high" | "good";
  spamPosition?: number;
  raidRisk?: "low" | "medium" | "high" | "good";
  raidPosition?: number;
  modCoverage?: "low" | "medium" | "high" | "good";
  modPosition?: number;
  footerNote?: string;
  forCompare?: boolean;
}

const HealthSafety: React.FC<HealthSafetyProps> = ({
  spamLevel = "low",
  spamPosition = 15,
  raidRisk = "medium",
  raidPosition = 50,
  modCoverage = "good",
  modPosition = 85,
  footerNote = "Most flagged content is filtered by bots before reaching public channels. Short-term spikes in invites from newly created accounts are throttled automatically.",
  forCompare = false,
}) => {
  const getLevelLabel = (level: "low" | "medium" | "high" | "good"): string => {
    switch (level) {
      case "low":
        return "Low";
      case "medium":
        return "Medium";
      case "high":
        return "High";
      case "good":
        return "Good";
      default:
        return "Unknown";
    }
  };

  return (
    <CardWrapper forCompare={forCompare}>
      {!forCompare && (
        <CardHeader>
          <CardTitle>Health & Safety</CardTitle>
          <CardBadge>Live Snapshot</CardBadge>
        </CardHeader>
      )}

      <MetricRow>
        <MetricLabel>Spam Level</MetricLabel>
        <ProgressContainer>
          <ProgressTrack>
            <ProgressDot position={spamPosition} />
          </ProgressTrack>
          <MetricValue>{getLevelLabel(spamLevel)}</MetricValue>
        </ProgressContainer>
      </MetricRow>

      <MetricRow>
        <MetricLabel>Raid risk</MetricLabel>
        <ProgressContainer>
          <ProgressTrack>
            <ProgressDot position={raidPosition} />
          </ProgressTrack>
          <MetricValue>{getLevelLabel(raidRisk)}</MetricValue>
        </ProgressContainer>
      </MetricRow>

      <MetricRow>
        <MetricLabel>Mod coverage</MetricLabel>
        <ProgressContainer>
          <ProgressTrack>
            <ProgressDot position={modPosition} />
          </ProgressTrack>
          <MetricValue>{getLevelLabel(modCoverage)}</MetricValue>
        </ProgressContainer>
      </MetricRow>

      {!forCompare && <FooterNote>{footerNote}</FooterNote>}
    </CardWrapper>
  );
};

export default HealthSafety;
