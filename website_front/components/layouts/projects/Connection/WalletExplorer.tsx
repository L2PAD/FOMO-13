import React from "react";
import styled from "styled-components";

const ExplorerWrapper = styled.div`
  border-radius: 12px;
  min-width: 400px;

  @media (max-width: 1024px) {
    min-width: 250px;
  }

  @media (max-width: 768px) {
    min-width: 100%;
  }
`;

const Title = styled.h2`
  font-size: 24px;
  font-weight: var(--font-weight-semibold);
  color: #070b35;
  margin: 0 0 24px 0;

  @media (max-width: 768px) {
    font-size: 20px;
    margin-bottom: 20px;
  }
`;

const InfoGrid = styled.div`
  display: flex;
  flex-direction: column;
  gap: 20px;
  background: #f5fbfd;
  border-radius: 8px;
  padding: 20px;

  @media (max-width: 768px) {
    gap: 16px;
    padding: 16px;
  }
`;

const InfoItem = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 12px;
`;

const InfoLabel = styled.div`
  font-size: 14px;
  font-weight: var(--font-weight-regular);

  @media (max-width: 768px) {
    font-size: 13px;
  }
`;

const InfoValue = styled.div`
  font-size: 14px;
  color: #070b35;
  font-weight: var(--font-weight-semibold);
  display: flex;
  align-items: center;
  gap: 6px;
  text-align: right;

  @media (max-width: 768px) {
    font-size: 13px;
  }
`;

const CopyIcon = styled.button`
  background: none;
  border: none;
  cursor: pointer;
  padding: 4px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #738094;
  transition: color 0.2s ease;

  &:hover {
    color: #04a584;
  }

  svg {
    width: 16px;
    height: 16px;
  }
`;

const TokenIcon = styled.img`
  width: 20px;
  height: 20px;
  border-radius: 50%;
  object-fit: cover;
`;

interface WalletExplorerProps {
  address: string;
  balance: string;
  token: string;
  tokenLogo?: string;
  pctOfSupply: string;
  value: string;
}

const WalletExplorer: React.FC<WalletExplorerProps> = ({
  address,
  balance,
  token,
  tokenLogo,
  pctOfSupply,
  value,
}) => {
  const handleCopyAddress = () => {
    navigator.clipboard.writeText(address);
  };

  return (
    <ExplorerWrapper>
      <Title>Explorer</Title>

      <InfoGrid>
        <InfoItem>
          <InfoLabel>Address</InfoLabel>
          <InfoValue>
            {address.slice(0, 6)}...{address.slice(-4)}
            <CopyIcon onClick={handleCopyAddress} title="Copy address">
              <svg
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <rect x="9" y="9" width="13" height="13" rx="2" ry="2" />
                <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
              </svg>
            </CopyIcon>
          </InfoValue>
        </InfoItem>

        <InfoItem>
          <InfoLabel>Balance</InfoLabel>
          <InfoValue>
            {balance}
            {tokenLogo && (
              <TokenIcon
                src={tokenLogo}
                alt={token}
                onError={(e) => {
                  e.currentTarget.style.display = "none";
                }}
              />
            )}
            {token}
          </InfoValue>
        </InfoItem>

        <InfoItem>
          <InfoLabel>Pct of Supply</InfoLabel>
          <InfoValue>{pctOfSupply}</InfoValue>
        </InfoItem>

        <InfoItem>
          <InfoLabel>Value</InfoLabel>
          <InfoValue>{value}</InfoValue>
        </InfoItem>
      </InfoGrid>
    </ExplorerWrapper>
  );
};

export default WalletExplorer;
