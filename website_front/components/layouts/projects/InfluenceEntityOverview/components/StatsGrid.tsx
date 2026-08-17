import React from "react";
import styled from "styled-components";

const StatsContainer = styled.div`
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 16px;
`;

const StatCard = styled.div`
  background: #f5fbfd;
  border-radius: 16px;
  padding: 20px;
  display: flex;
  flex-direction: column;
  gap: 8px;
`;

const StatHeader = styled.div`
  display: flex;
  align-items: center;
  gap: 8px;
`;

const StatIcon = styled.div`
  width: 32px;
  height: 32px;
  display: flex;
  align-items: center;
  justify-content: center;
`;

const StatLabel = styled.span`
  font-size: 14px;
  color: #738094;
`;

const StatValue = styled.span`
  font-size: 28px;
  font-weight: var(--font-weight-semibold);
  color: #070b35;
`;

const StatChange = styled.span<{ positive?: boolean }>`
  font-size: 13px;
  color: ${({ positive }) => (positive ? "#05a584" : "#ff5858")};
  display: flex;
  align-items: center;
  gap: 4px;
`;

const UsersIcon = () => (
  <svg
    width="24"
    height="24"
    viewBox="0 0 24 24"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
  >
    <path
      d="M17 21V19C17 17.9391 16.5786 16.9217 15.8284 16.1716C15.0783 15.4214 14.0609 15 13 15H5C3.93913 15 2.92172 15.4214 2.17157 16.1716C1.42143 16.9217 1 17.9391 1 19V21"
      stroke="#05a584"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <path
      d="M9 11C11.2091 11 13 9.20914 13 7C13 4.79086 11.2091 3 9 3C6.79086 3 5 4.79086 5 7C5 9.20914 6.79086 11 9 11Z"
      stroke="#05a584"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <path
      d="M23 21V19C22.9993 18.1137 22.7044 17.2528 22.1614 16.5523C21.6184 15.8519 20.8581 15.3516 20 15.13"
      stroke="#05a584"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <path
      d="M16 3.13C16.8604 3.35031 17.623 3.85071 18.1676 4.55232C18.7122 5.25392 19.0078 6.11683 19.0078 7.005C19.0078 7.89318 18.7122 8.75608 18.1676 9.45769C17.623 10.1593 16.8604 10.6597 16 10.88"
      stroke="#05a584"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
);

const EyeIcon = () => (
  <svg
    width="24"
    height="24"
    viewBox="0 0 24 24"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
  >
    <path
      d="M1 12C1 12 5 4 12 4C19 4 23 12 23 12C23 12 19 20 12 20C5 20 1 12 1 12Z"
      stroke="#05a584"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <path
      d="M12 15C13.6569 15 15 13.6569 15 12C15 10.3431 13.6569 9 12 9C10.3431 9 9 10.3431 9 12C9 13.6569 10.3431 15 12 15Z"
      stroke="#05a584"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
);

const MessageIcon = () => (
  <svg
    width="24"
    height="24"
    viewBox="0 0 24 24"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
  >
    <path
      d="M21 15C21 15.5304 20.7893 16.0391 20.4142 16.4142C20.0391 16.7893 19.5304 17 19 17H7L3 21V5C3 4.46957 3.21071 3.96086 3.58579 3.58579C3.96086 3.21071 4.46957 3 5 3H19C19.5304 3 20.0391 3.21071 20.4142 3.58579C20.7893 3.96086 21 4.46957 21 5V15Z"
      stroke="#05a584"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
);

const ActivityIcon = () => (
  <svg
    width="24"
    height="24"
    viewBox="0 0 24 24"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
  >
    <polyline
      points="22 12 18 12 15 21 9 3 6 12 2 12"
      stroke="#05a584"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
);

interface StatItem {
  label: string;
  value: string;
  change?: string;
  positive?: boolean;
  icon: React.ReactNode;
}

interface StatsGridProps {
  subscribers: {
    value: string;
    change?: string;
    positive?: boolean;
  };
  viewsPerPost: {
    value: string;
    change?: string;
    positive?: boolean;
  };
  messagesPerDay: {
    value: string;
    change?: string;
    positive?: boolean;
  };
  activity: {
    value: string;
    change?: string;
    positive?: boolean;
  };
}

const StatsGrid: React.FC<StatsGridProps> = ({
  subscribers,
  viewsPerPost,
  messagesPerDay,
  activity,
}) => {
  const stats: StatItem[] = [
    {
      label: "Subscribers",
      icon: <UsersIcon />,
      ...subscribers,
    },
    {
      label: "Views/Post",
      icon: <EyeIcon />,
      ...viewsPerPost,
    },
    {
      label: "Messages/Day",
      icon: <MessageIcon />,
      ...messagesPerDay,
    },
    {
      label: "Activity",
      icon: <ActivityIcon />,
      ...activity,
    },
  ];

  return (
    <StatsContainer>
      {stats.map((stat, index) => (
        <StatCard key={index}>
          <StatHeader>
            <StatIcon>{stat.icon}</StatIcon>
            <StatLabel>{stat.label}</StatLabel>
          </StatHeader>
          <StatValue>{stat.value}</StatValue>
          {stat.change && (
            <StatChange positive={stat.positive}>{stat.change}</StatChange>
          )}
        </StatCard>
      ))}
    </StatsContainer>
  );
};

export default StatsGrid;
