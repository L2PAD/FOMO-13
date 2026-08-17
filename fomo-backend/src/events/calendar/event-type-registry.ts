// EPIC CAL-1 · P4 — Event Type Registry (config-driven, extensible without deploy-time model change)
export interface CalendarEventType {
  name: string;
  key: string;
  category: string;
  icon: string;
  colorKey: string;
  defaultVisibility: "PUBLIC" | "AUTHENTICATED" | "PRIVATE";
  active: boolean;
  allowAutoPublish: boolean;
}

export const CALENDAR_EVENT_TYPES: CalendarEventType[] = [
  { name: "Активность", key: "ACTIVITY", category: "EarlyLand", icon: "activity", colorKey: "green", defaultVisibility: "PUBLIC", active: true, allowAutoPublish: false },
  { name: "Дедлайн", key: "DEADLINE", category: "EarlyLand", icon: "clock", colorKey: "red", defaultVisibility: "PUBLIC", active: true, allowAutoPublish: false },
  { name: "Обновление проекта", key: "PROJECT_UPDATE", category: "Projects", icon: "megaphone", colorKey: "blue", defaultVisibility: "PUBLIC", active: true, allowAutoPublish: false },
  { name: "Разблокировка токенов", key: "TOKEN_UNLOCK", category: "Unlocks", icon: "unlock", colorKey: "orange", defaultVisibility: "PUBLIC", active: true, allowAutoPublish: true },
  { name: "TGE", key: "TGE", category: "Projects", icon: "rocket", colorKey: "purple", defaultVisibility: "PUBLIC", active: true, allowAutoPublish: false },
  { name: "Листинг", key: "LISTING", category: "Projects", icon: "list", colorKey: "blue", defaultVisibility: "PUBLIC", active: true, allowAutoPublish: false },
  { name: "Mainnet", key: "MAINNET", category: "Projects", icon: "server", colorKey: "green", defaultVisibility: "PUBLIC", active: true, allowAutoPublish: false },
  { name: "Testnet", key: "TESTNET", category: "Projects", icon: "flask", colorKey: "teal", defaultVisibility: "PUBLIC", active: true, allowAutoPublish: false },
  { name: "AMA / Space", key: "AMA", category: "Community", icon: "mic", colorKey: "pink", defaultVisibility: "PUBLIC", active: true, allowAutoPublish: false },
  { name: "Голосование", key: "GOVERNANCE", category: "Governance", icon: "vote", colorKey: "indigo", defaultVisibility: "PUBLIC", active: true, allowAutoPublish: false },
  { name: "Launchpad", key: "LAUNCHPAD", category: "Launchpad", icon: "rocket", colorKey: "green", defaultVisibility: "PUBLIC", active: true, allowAutoPublish: false },
  { name: "NFT Mint", key: "NFT_MINT", category: "NFT", icon: "image", colorKey: "purple", defaultVisibility: "PUBLIC", active: true, allowAutoPublish: false },
  { name: "NFT Reveal", key: "NFT_REVEAL", category: "NFT", icon: "sparkles", colorKey: "purple", defaultVisibility: "PUBLIC", active: true, allowAutoPublish: false },
  { name: "Обновление FOMO", key: "FOMO_UPDATE", category: "FOMO", icon: "star", colorKey: "green", defaultVisibility: "PUBLIC", active: true, allowAutoPublish: false },
  { name: "Новость", key: "NEWS", category: "News", icon: "newspaper", colorKey: "blue", defaultVisibility: "PUBLIC", active: true, allowAutoPublish: false },
  { name: "Техработы", key: "MAINTENANCE", category: "FOMO", icon: "wrench", colorKey: "gray", defaultVisibility: "PUBLIC", active: true, allowAutoPublish: false },
  { name: "Другое", key: "CUSTOM", category: "Other", icon: "calendar", colorKey: "gray", defaultVisibility: "PUBLIC", active: true, allowAutoPublish: false },
];

export const findEventType = (key?: string): CalendarEventType | undefined =>
  CALENDAR_EVENT_TYPES.find((t) => t.key === (key || "").toUpperCase());
