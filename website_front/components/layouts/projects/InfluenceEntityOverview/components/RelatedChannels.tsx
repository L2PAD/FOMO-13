import React from "react";
import styled from "styled-components";

const CardWrapper = styled.div`
  width: 100%;
  background: #f5fbfd;
  border-radius: 16px;
  padding: 20px;

  @media (max-width: 768px) {
    padding: 12px;
  }
`;

const CardHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
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
  padding: 4px 12px;
  border-radius: 6px;
  border: 1px solid #b5bcc7;
`;

const ChannelList = styled.div`
  display: flex;
  flex-direction: column;
  gap: 0;
`;

const ChannelRow = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  cursor: pointer;
  transition: opacity 0.2s ease;
  margin-top: 20px;
  &:last-child {
    border-bottom: none;
  }

  &:hover {
    opacity: 0.8;
  }
`;

const ChannelName = styled.span`
  font-size: 14px;
  font-weight: var(--font-weight-semibold);
  color: #070b35;
`;

const ActivityContainer = styled.div`
  display: flex;
  align-items: center;
  gap: 8px;
`;

const ActivityLabel = styled.span`
  font-size: 14px;
  color: #728094;
`;

const ActivityBadge = styled.span<{ level: "high" | "medium" | "low" }>`
  font-size: 12px;
  font-weight: var(--font-weight-medium);
  padding: 4px 10px;
  border-radius: 6px;
  background: ${({ level }) => {
    switch (level) {
      case "high":
        return "#E8F5F1";
      case "medium":
        return "#FFF8E1";
      case "low":
        return "#FFEBEE";
      default:
        return "#F3F4F6";
    }
  }};
  color: ${({ level }) => {
    switch (level) {
      case "high":
        return "#05A584";
      case "medium":
        return "#F5A623";
      case "low":
        return "#FF5858";
      default:
        return "#738094";
    }
  }};
`;

interface RelatedChannel {
  id: string;
  name: string;
  type?: string;
  subscribers?: string;
  activity: "high" | "medium" | "low";
  avatar?: string;
}

interface RelatedChannelsProps {
  channels: RelatedChannel[];
  onChannelClick?: (channelId: string) => void;
  onViewAll?: () => void;
}

const RelatedChannels: React.FC<RelatedChannelsProps> = ({
  channels,
  onChannelClick,
}) => {
  const getActivityLabel = (level: "high" | "medium" | "low"): string => {
    switch (level) {
      case "high":
        return "High";
      case "medium":
        return "Medium";
      case "low":
        return "Low";
      default:
        return "Unknown";
    }
  };

  return (
    <CardWrapper>
      <CardHeader>
        <CardTitle>Related Channels</CardTitle>
        <CardBadge>You might track next</CardBadge>
      </CardHeader>

      <ChannelList>
        {channels.slice(0, 4).map((channel) => (
          <ChannelRow
            key={channel.id}
            onClick={() => onChannelClick?.(channel.id)}
          >
            <ChannelName>{channel.name}</ChannelName>
            <ActivityContainer>
              <ActivityLabel>Activity:</ActivityLabel>
              <ActivityBadge level={channel.activity}>
                {getActivityLabel(channel.activity)}
              </ActivityBadge>
            </ActivityContainer>
          </ChannelRow>
        ))}
      </ChannelList>
    </CardWrapper>
  );
};

export default RelatedChannels;
