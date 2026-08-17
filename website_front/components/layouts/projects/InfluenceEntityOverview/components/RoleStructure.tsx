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

const RoleRow = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 12px;
`;

const RoleLabel = styled.span`
  font-size: 14px;
  color: #070b35;
`;

const RoleValue = styled.span`
  font-size: 14px;
  font-weight: var(--font-weight-semibold);
  color: #070b35;
`;

interface RoleStructureProps {
  admins?: number;
  moderators?: number;
  analysts?: number;
  verifiedTraders?: number;
  members?: number;
  forCompare?: boolean;
}

const RoleStructure: React.FC<RoleStructureProps> = ({
  admins = 4,
  moderators = 18,
  analysts = 42,
  verifiedTraders = 126,
  members = 18230,
  forCompare = false,
}) => {
  return (
    <CardWrapper forCompare={forCompare}>
      {!forCompare && (
        <CardHeader>
          <CardTitle>Role Structure</CardTitle>
          <LiveBadge>Live</LiveBadge>
        </CardHeader>
      )}

      <RoleRow>
        <RoleLabel>Admins</RoleLabel>
        <RoleValue>{admins.toLocaleString()}</RoleValue>
      </RoleRow>
      <RoleRow>
        <RoleLabel>Moderators</RoleLabel>
        <RoleValue>{moderators.toLocaleString()}</RoleValue>
      </RoleRow>
      <RoleRow>
        <RoleLabel>Analysts / researchers</RoleLabel>
        <RoleValue>{analysts.toLocaleString()}</RoleValue>
      </RoleRow>
      <RoleRow>
        <RoleLabel>Verified traders</RoleLabel>
        <RoleValue>{verifiedTraders.toLocaleString()}</RoleValue>
      </RoleRow>
      <RoleRow>
        <RoleLabel>Members</RoleLabel>
        <RoleValue>{members.toLocaleString()}</RoleValue>
      </RoleRow>
    </CardWrapper>
  );
};

export default RoleStructure;
