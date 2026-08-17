import { getFomoAdminIconUrl } from "../../../../../config/fomoAdminIcon";

export const SUPPORT_DISPLAY_NAME = "FOMO Support";
export const SUPPORT_DISPLAY_HANDLE = "fomo_support";

export const isSupportUser = (user?: any): boolean => {
  const roleSources = [
    user?.role,
    user?.roles,
    user?.user?.role,
    user?.user?.roles,
  ];

  const roles = roleSources.flatMap((value) => {
    if (Array.isArray(value)) return value;
    if (typeof value === "string") {
      return value.split(",").map((item: string) => item.trim()).filter(Boolean);
    }
    return [];
  });

  return roles.includes("admin") || roles.includes("moderator");
};

export const getSupportAwareName = (user?: any, fallback = "User"): string => {
  if (isSupportUser(user)) return SUPPORT_DISPLAY_NAME;
  return user?.username || user?.twitterData?.username || fallback;
};

export const getSupportAwareAvatar = (user?: any, fallback?: string): string | undefined => {
  if (isSupportUser(user)) return getFomoAdminIconUrl();
  return fallback;
};

export const getSupportAwareHandle = (user?: any): string => {
  if (isSupportUser(user)) return `@${SUPPORT_DISPLAY_HANDLE}`;

  const username = user?.twitterData?.username || user?.username;
  return username ? `@${String(username).toLowerCase()}` : "@user";
};

export const getSupportParticipantFromChat = (chat?: any): any | null => {
  const participants = Array.isArray(chat?.participantsData) ? chat.participantsData : [];
  return participants.find((participant: any) => isSupportUser(participant)) || null;
};

export const isAppealSupportChat = (chat?: any): boolean => {
  const participants = Array.isArray(chat?.participantsData) ? chat.participantsData : [];
  return participants.length > 2 && !!getSupportParticipantFromChat(chat);
};

export const getDisplayChatUser = (chat?: any): any => {
  if (isAppealSupportChat(chat)) {
    return getSupportParticipantFromChat(chat) || chat?.user;
  }

  return chat?.user;
};
