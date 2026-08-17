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

const ProfileList = styled.div`
  display: flex;
  flex-direction: column;
  gap: 16px;
`;

const ProfileRow = styled.div`
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

const ProfileInfo = styled.div`
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 4px;
`;

const ProfileName = styled.div`
  font-size: 16px;
  font-weight: var(--font-weight-semibold);
  color: #070b35;
`;

const ProfileHandle = styled.div`
  font-size: 14px;
  color: #05a584;
`;

const ProfileScore = styled.div`
  font-size: 14px;
  color: #738094;
  white-space: nowrap;

  span {
    color: #000;
  }
`;

interface Profile {
  id: string;
  name: string;
  handle: string;
  avatar: string;
  score: number;
}

interface InfluentialConnectionsProps {
  profiles: Profile[];
  onProfileClick?: (profileId: string) => void;
}

const InfluentialConnections: React.FC<InfluentialConnectionsProps> = ({
  profiles,
  onProfileClick,
}) => {
  return (
    <CardWrapper>
      <CardHeader>
        <CardTitle>Related Profiles</CardTitle>
      </CardHeader>
      <Subtitle>Similar accounts you might want to track next.</Subtitle>

      <ProfileList>
        {profiles?.map((profile) => (
          <ProfileRow
            key={profile.id}
            onClick={() => onProfileClick?.(profile.id)}
          >
            <Avatar src={profile.avatar} alt={profile.name} />
            <ProfileInfo>
              <ProfileName>{profile.name}</ProfileName>
              <ProfileHandle>{profile.handle}</ProfileHandle>
            </ProfileInfo>
            <ProfileScore>
              X Score: <span>{profile.score}</span>
            </ProfileScore>
          </ProfileRow>
        ))}
      </ProfileList>
    </CardWrapper>
  );
};

export default InfluentialConnections;
