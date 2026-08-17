import React, { FC } from "react";
import styled from "styled-components";

const BlockedWrapper = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 60px 20px;
  text-align: center;
  gap: 20px;
  flex: 1;
  overflow-y: auto;
`;

const BlockTitle = styled.h3`
  font-size: 24px;
  font-weight: var(--font-weight-semibold);
  color: #1a1d26;
  margin: 0;
`;

const BlockDescription = styled.p`
  font-size: 16px;
  font-weight: var(--font-weight-medium);
  color: #728094;
  margin: 0;
  max-width: 400px;
`;

const UnblockButton = styled.button`
  margin-top: 10px;
  padding: 12px 24px;
  background: #2082ea;
  color: white;
  border: none;
  border-radius: 12px;
  font-size: 16px;
  font-weight: var(--font-weight-semibold);
  cursor: pointer;
  transition: all 0.2s ease;

  &:hover {
    background: #1a6bc4;
  }
`;

interface BlockedMessageProps {
  blockedByMe?: boolean;
  onUnblock?: () => void;
}

const BlockedMessage: FC<BlockedMessageProps> = ({
  blockedByMe = false,
  onUnblock,
}) => {
  return (
    <BlockedWrapper>
      <BlockTitle>{blockedByMe ? "You blocked this user" : "You are blocked"}</BlockTitle>
      <BlockDescription>
        {blockedByMe
          ? "You have blocked this user from sending you messages. Unblock them to continue the conversation."
          : "This user has blocked you. You cannot send messages to them."}
      </BlockDescription>

      {blockedByMe && onUnblock && (
        <UnblockButton onClick={onUnblock}>Unblock User</UnblockButton>
      )}
    </BlockedWrapper>
  );
};

export default BlockedMessage;
