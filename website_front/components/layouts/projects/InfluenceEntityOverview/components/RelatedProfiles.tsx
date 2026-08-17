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
  margin-bottom: 8px;
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

const Subtitle = styled.p`
  font-size: 14px;
  color: #738094;
  margin: 0 0 20px 0;
`;

const ConnectionList = styled.div`
  display: flex;
  flex-direction: column;
  gap: 16px;
`;

const ConnectionRow = styled.div`
  display: flex;
  align-items: center;
  gap: 12px;
  cursor: pointer;
  transition: opacity 0.2s ease;

  &:hover {
    opacity: 0.7;
  }
`;

const Avatar = styled.img`
  width: 48px;
  height: 48px;
  border-radius: 50%;
  object-fit: cover;
`;

const ConnectionInfo = styled.div`
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 4px;
`;

const ConnectionName = styled.div`
  font-size: 14px;
  font-weight: var(--font-weight-semibold);
  color: #070b35;
`;

const ConnectionHandle = styled.div`
  font-size: 14px;
  color: #05a584;
`;

const ConnectionMeta = styled.div`
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  gap: 4px;
`;

const ConnectionType = styled.div`
  padding: 6px 12px;
  background: #e9f8f8;
  border-radius: 6px;
  font-size: 12px;
  color: #728094;
  font-weight: var(--font-weight-medium);
`;

const ConnectionValue = styled.div`
  font-size: 14px;
  color: #728094;
  margin-top: 4px;
`;

interface Connection {
  id: string;
  name: string;
  handle: string;
  avatar: string;
  type: string;
  value: string;
}

interface RelatedProfilesProps {
  connections: Connection[];
  onConnectionClick?: (connectionId: string) => void;
}

const RelatedProfiles: React.FC<RelatedProfilesProps> = ({
  connections,
  onConnectionClick,
}) => {
  return (
    <CardWrapper>
      <CardHeader>
        <CardTitle>Influential Connections</CardTitle>
      </CardHeader>
      <Subtitle>Who amplifies this account and who it listens to.</Subtitle>

      <ConnectionList>
        {connections?.map((connection) => (
          <ConnectionRow
            key={connection.id}
            onClick={() => onConnectionClick?.(connection.id)}
          >
            <Avatar src={connection.avatar} alt={connection.name} />
            <ConnectionInfo>
              <ConnectionName>{connection.name}</ConnectionName>
              <ConnectionHandle>{connection.handle}</ConnectionHandle>
            </ConnectionInfo>
            <ConnectionMeta>
              <ConnectionType>{connection.type}</ConnectionType>
              <ConnectionValue>{connection.value}</ConnectionValue>
            </ConnectionMeta>
          </ConnectionRow>
        ))}
      </ConnectionList>
    </CardWrapper>
  );
};

export default RelatedProfiles;
