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
  padding: 4px 12px;
  border-radius: 6px;
  border: 1px solid #b5bcc7;
`;

const AccountList = styled.div`
  display: flex;
  flex-direction: column;
  gap: 16px;
`;

const AccountRow = styled.div`
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
  width: 38px;
  height: 38px;
  border-radius: 50%;
  object-fit: cover;
`;

const AccountInfo = styled.div`
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 4px;
`;

const AccountName = styled.div`
  font-size: 14px;
  font-weight: var(--font-weight-semibold);
  color: #070b35;
`;

const AccountHandle = styled.div`
  font-size: 14px;
  color: #05a584;
`;

const AccountMeta = styled.div`
  display: flex;
  flex-direction: row;
  align-items: flex-end;
  gap: 4px;
`;

const AccountActivity = styled.div`
  display: flex;
  flex-direction: row;
  align-items: center;
  gap: 4px;
`;

const FollowersLabel = styled.div`
  font-size: 14px;
  color: #728094;
`;

const FollowersValue = styled.div`
  font-size: 14px;
  font-weight: var(--font-weight-semibold);
  color: #070b35;
`;
const Tag = styled.span`
  padding: 6px 12px;
  background: #e9f8f8;
  border-radius: 6px;
  font-size: 12px;
  color: #05a584;
  text-transform: capitalize;
`;

interface Account {
  id: string;
  name: string;
  handle?: string;
  avatar: string;
  followers?: string;
  activity?: "high" | "medium" | "low";
}

interface RelatedAccountsProps {
  accounts: Account[];
  onAccountClick?: (accountId: string) => void;
  network?:
    | "telegram"
    | "x"
    | "discord"
    | "instagram"
    | "linkedin"
    | "tiktok"
    | "threads";
}

const RelatedAccounts: React.FC<RelatedAccountsProps> = ({
  accounts,
  onAccountClick,
  network = "instagram",
}) => {
  const isTikTokNetwork = network === "tiktok";

  return (
    <CardWrapper>
      <CardHeader>
        <CardTitle>Related Accounts</CardTitle>
        <CardBadge>You might track next</CardBadge>
      </CardHeader>

      <AccountList>
        {accounts?.map((account) => (
          <AccountRow
            key={account.id}
            onClick={() => onAccountClick?.(account.id)}
          >
            <Avatar src={account.avatar} alt={account.name} />
            <AccountInfo>
              <AccountName>{account.name}</AccountName>
              {account.handle && (
                <AccountHandle>{account.handle}</AccountHandle>
              )}
            </AccountInfo>
            {isTikTokNetwork ? (
              <AccountActivity>
                <FollowersLabel>Activity:</FollowersLabel>
                <Tag>{account.activity}</Tag>
              </AccountActivity>
            ) : (
              <AccountMeta>
                <FollowersLabel>Followers:</FollowersLabel>
                <FollowersValue>{account.followers}</FollowersValue>
              </AccountMeta>
            )}
          </AccountRow>
        ))}
      </AccountList>
    </CardWrapper>
  );
};

export default RelatedAccounts;
