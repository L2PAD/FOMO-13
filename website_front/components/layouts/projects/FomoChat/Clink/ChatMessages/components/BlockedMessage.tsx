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

const BlockIcon = styled.div`
  width: 80px;
  height: 80px;
  border-radius: 50%;
  background: #fff0f0;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-bottom: 10px;

  svg {
    width: 40px;
    height: 40px;
    color: #ff5857;
  }
`;

const BlockTitle = styled.h3`
  font-family: Gilroy;
  font-size: 24px;
  font-weight: var(--font-weight-semibold);
  color: #1a1d26;
  margin: 0;
`;

const BlockDescription = styled.p`
  font-family: Gilroy;
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
  font-family: Gilroy;
  font-size: 16px;
  font-weight: var(--font-weight-semibold);
  cursor: pointer;
  transition: all 0.2s ease;

  &:hover {
    background: #1a6bc4;
    transform: translateY(-1px);
  }

  &:active {
    transform: translateY(0);
  }
`;

interface BlockedMessageProps {
    blockedByMe?: boolean;
    onUnblock?: () => void;
}

const BlockedMessage: FC<BlockedMessageProps> = ({ blockedByMe = false, onUnblock }) => {
    return (
        <BlockedWrapper>
            <BlockIcon>
                <svg
                    viewBox="0 0 20 20"
                    fill="none"
                    xmlns="http://www.w3.org/2000/svg"
                >
                    <path
                        d="M4.34323 15.6569L15.6569 4.34316M18 10C18 14.4183 14.4183 18 10 18C5.58172 18 2 14.4183 2 10C2 5.58172 5.58172 2 10 2C14.4183 2 18 5.58172 18 10Z"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                    />
                </svg>
            </BlockIcon>

            <BlockTitle>
                {blockedByMe ? "You blocked this user" : "You are blocked"}
            </BlockTitle>

            <BlockDescription>
                {blockedByMe
                    ? "You have blocked this user from sending you messages. Unblock them to continue the conversation."
                    : "This user has blocked you. You cannot send messages to them."}
            </BlockDescription>

            {blockedByMe && onUnblock && (
                <UnblockButton onClick={onUnblock}>
                    Unblock User
                </UnblockButton>
            )}
        </BlockedWrapper>
    );
};

export default BlockedMessage;
