import React, { FC } from "react";

// Clean line-style SVG icons for the CRM sidebar navigation.
// All icons inherit `currentColor` so active/hover states are driven by CSS.
type IconProps = { size?: number };

const base = (size: number) => ({
  width: size,
  height: size,
  viewBox: "0 0 24 24",
  fill: "none",
  stroke: "currentColor",
  strokeWidth: 1.9,
  strokeLinecap: "round" as const,
  strokeLinejoin: "round" as const,
  xmlns: "http://www.w3.org/2000/svg",
});

const ContentIcon: FC<IconProps> = ({ size = 20 }) => (
  <svg {...base(size)}>
    <rect x="3" y="3" width="18" height="18" rx="2" />
    <path d="M3 9h18M9 21V9" />
  </svg>
);

const OperationsIcon: FC<IconProps> = ({ size = 20 }) => (
  <svg {...base(size)}>
    <path d="M9 3h6a1 1 0 0 1 1 1v1H8V4a1 1 0 0 1 1-1Z" />
    <rect x="4" y="5" width="16" height="16" rx="2" />
    <path d="m9 13 2 2 4-4" />
  </svg>
);

const StatisticsIcon: FC<IconProps> = ({ size = 20 }) => (
  <svg {...base(size)}>
    <path d="M3 3v18h18" />
    <rect x="7" y="11" width="3" height="6" />
    <rect x="12.5" y="7" width="3" height="10" />
    <rect x="18" y="13" width="3" height="4" />
  </svg>
);

const AiIcon: FC<IconProps> = ({ size = 20 }) => (
  <svg {...base(size)}>
    <path d="M12 3l1.6 4.4L18 9l-4.4 1.6L12 15l-1.6-4.4L6 9l4.4-1.6L12 3Z" />
    <path d="M18 15l.8 2.2L21 18l-2.2.8L18 21l-.8-2.2L15 18l2.2-.8L18 15Z" />
  </svg>
);

const DataSyncIcon: FC<IconProps> = ({ size = 20 }) => (
  <svg {...base(size)}>
    <path d="M21 12a9 9 0 0 1-15 6.7L3 16" />
    <path d="M3 12a9 9 0 0 1 15-6.7L21 8" />
    <path d="M21 3v5h-5M3 21v-5h5" />
  </svg>
);

const RatingIcon: FC<IconProps> = ({ size = 20 }) => (
  <svg {...base(size)}>
    <path d="M12 3.5l2.6 5.3 5.9.9-4.3 4.1 1 5.8-5.2-2.7-5.2 2.7 1-5.8L3.5 9.7l5.9-.9L12 3.5Z" />
  </svg>
);

const CryptoIcon: FC<IconProps> = ({ size = 20 }) => (
  <svg {...base(size)}>
    <circle cx="12" cy="12" r="9" />
    <path d="M9.5 8h4a2 2 0 0 1 0 4h-4h4.3a2 2 0 0 1 0 4H9.5M11 6.5v11" />
  </svg>
);

const NftsIcon: FC<IconProps> = ({ size = 20 }) => (
  <svg {...base(size)}>
    <rect x="3" y="3" width="18" height="18" rx="2" />
    <circle cx="9" cy="9" r="1.8" />
    <path d="m4 17 4.5-4.5a2 2 0 0 1 2.8 0L20 21" />
  </svg>
);

const UsersIcon: FC<IconProps> = ({ size = 20 }) => (
  <svg {...base(size)}>
    <path d="M16 20v-1.5a4 4 0 0 0-4-4H7a4 4 0 0 0-4 4V20" />
    <circle cx="9.5" cy="7.5" r="3.2" />
    <path d="M21 20v-1.5a4 4 0 0 0-3-3.85" />
    <path d="M16 4.15a4 4 0 0 1 0 7.7" />
  </svg>
);

const SystemIcon: FC<IconProps> = ({ size = 20 }) => (
  <svg {...base(size)}>
    <circle cx="12" cy="12" r="3" />
    <path d="M19.4 15a1.6 1.6 0 0 0 .3 1.8l.1.1a2 2 0 1 1-2.8 2.8l-.1-.1a1.6 1.6 0 0 0-2.7 1.1V21a2 2 0 0 1-4 0v-.1A1.6 1.6 0 0 0 7 19.4a1.6 1.6 0 0 0-1.8.3l-.1.1a2 2 0 1 1-2.8-2.8l.1-.1a1.6 1.6 0 0 0-1.1-2.7H1a2 2 0 0 1 0-4h.1A1.6 1.6 0 0 0 2.6 7a1.6 1.6 0 0 0-.3-1.8l-.1-.1a2 2 0 1 1 2.8-2.8l.1.1A1.6 1.6 0 0 0 7 2.6h.1A1.6 1.6 0 0 0 8 1.1V1a2 2 0 0 1 4 0v.1A1.6 1.6 0 0 0 15 2.6a1.6 1.6 0 0 0 1.8-.3l.1-.1a2 2 0 1 1 2.8 2.8l-.1.1a1.6 1.6 0 0 0 1.1 2.7h.2a2 2 0 0 1 0 4h-.1a1.6 1.6 0 0 0-1.4 1Z" />
  </svg>
);

const DefaultIcon: FC<IconProps> = ({ size = 20 }) => (
  <svg {...base(size)}>
    <circle cx="12" cy="12" r="9" />
  </svg>
);

// Keyed by the exact Russian/English nav titles used in navigation_data.ts
const NAV_ICON_MAP: Record<string, FC<IconProps>> = {
  "Контент": ContentIcon,
  "Операции": OperationsIcon,
  "Статистика": StatisticsIcon,
  "AI": AiIcon,
  "Data Sync": DataSyncIcon,
  "Рейтинг": RatingIcon,
  "Crypto": CryptoIcon,
  "NFTs": NftsIcon,
  "Пользователи": UsersIcon,
  "Система": SystemIcon,
};

export const getNavIcon = (title: string): FC<IconProps> => {
  return NAV_ICON_MAP[title] || DefaultIcon;
};

export default getNavIcon;
