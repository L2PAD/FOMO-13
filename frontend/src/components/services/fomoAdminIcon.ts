export const FOMO_ADMIN_ICON_FALLBACK_URL = "https://assets.fomo.cx/fomo/system/fomo-icon.png";

const normalizeIconUrl = (value?: string): string => {
  const normalized = String(value || "").trim();

  return normalized || FOMO_ADMIN_ICON_FALLBACK_URL;
};

export const FOMO_ADMIN_ICON_URL = normalizeIconUrl(
  process.env.NEXT_PUBLIC_FOMO_ADMIN_ICON_URL ||
    process.env.REACT_APP_FOMO_ADMIN_ICON_URL,
);

export const getFomoAdminIconUrl = (): string => FOMO_ADMIN_ICON_URL;
