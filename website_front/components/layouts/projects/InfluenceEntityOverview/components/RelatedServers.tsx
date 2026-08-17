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

const ServerList = styled.div`
  display: flex;
  flex-direction: column;
  gap: 0;
`;

const ServerRow = styled.div`
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

const ServerInfo = styled.div`
  display: flex;
  flex-direction: column;
  gap: 4px;
`;

const ServerName = styled.span`
  font-size: 14px;
  font-weight: var(--font-weight-semibold);
  color: #070b35;
`;

const ServerDescription = styled.span`
  font-size: 14px;
  color: #738094;
`;

const EngagementContainer = styled.div`
  display: flex;
  align-items: center;
  gap: 8px;
  min-width: fit-content;
`;

const EngagementLabel = styled.span`
  font-size: 14px;
  color: #728094;
`;

const EngagementValue = styled.span`
  font-size: 14px;
  font-weight: var(--font-weight-semibold);
  color: #070b35;
`;

interface RelatedServer {
  id: string;
  name: string;
  description: string;
  engagementLevel: number;
}

interface RelatedServersProps {
  servers: RelatedServer[];
  onServerClick?: (serverId: string) => void;
}

const RelatedServers: React.FC<RelatedServersProps> = ({
  servers,
  onServerClick,
}) => {
  return (
    <CardWrapper>
      <CardHeader>
        <CardTitle>Related Servers</CardTitle>
        <CardBadge>You might track next</CardBadge>
      </CardHeader>

      <ServerList>
        {servers.map((server) => (
          <ServerRow key={server.id} onClick={() => onServerClick?.(server.id)}>
            <ServerInfo>
              <ServerName>{server.name}</ServerName>
              <ServerDescription>{server.description}</ServerDescription>
            </ServerInfo>
            <EngagementContainer>
              <EngagementLabel>Engagement lvl:</EngagementLabel>
              <EngagementValue>{server.engagementLevel}</EngagementValue>
            </EngagementContainer>
          </ServerRow>
        ))}
      </ServerList>
    </CardWrapper>
  );
};

export default RelatedServers;
