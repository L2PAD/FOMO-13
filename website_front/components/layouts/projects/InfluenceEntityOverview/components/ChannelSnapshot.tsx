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

const LiveBadge = styled.span`
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
`;

const MetricValue = styled.span`
  font-size: 14px;
  font-weight: var(--font-weight-semibold);
  color: #070b35;
`;

const FooterNote = styled.p`
  font-size: 14px;
  line-height: 1.2;
  color: #070b35;
  margin: 12px 0 0 0;
`;

interface ChannelSnapshotProps {
  onlineNow?: number;
  peak24h?: number;
  activeSenders?: number;
  retention?: number;
  footerNote?: string;
  forCompare?: boolean;
}

const ChannelSnapshot: React.FC<ChannelSnapshotProps> = ({
  onlineNow = 984,
  peak24h = 1742,
  activeSenders = 312,
  retention = 73,
  footerNote = "Online & active sender stats are estimated from Telegram's native analytics (views, forwards, reactions) and updated every few minutes.",
  forCompare = false,
}) => {
  return (
    <CardWrapper forCompare={forCompare}>
      {!forCompare && (
        <CardHeader>
          <CardTitle>Channel Snapshot</CardTitle>
          <LiveBadge>Live</LiveBadge>
        </CardHeader>
      )}

      <MetricRow>
        <MetricLabel>Online now</MetricLabel>
        <MetricValue>{onlineNow.toLocaleString()}</MetricValue>
      </MetricRow>
      <MetricRow>
        <MetricLabel>24h peak online</MetricLabel>
        <MetricValue>{peak24h.toLocaleString()}</MetricValue>
      </MetricRow>
      <MetricRow>
        <MetricLabel>Active senders (24h)</MetricLabel>
        <MetricValue>{activeSenders.toLocaleString()}</MetricValue>
      </MetricRow>
      <MetricRow>
        <MetricLabel>Retention (7d returning viewers)</MetricLabel>
        <MetricValue>{retention}%</MetricValue>
      </MetricRow>

      {!forCompare && <FooterNote>{footerNote}</FooterNote>}
    </CardWrapper>
  );
};

export default ChannelSnapshot;
