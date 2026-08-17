import moment from "moment";
import humans from "../../../../../assets/images/nft/humans.png";
import { LOADER_API } from "../../../../../config/api";

const getImageValue = (value?: unknown): string => {
  if (!value) return "";

  if (typeof value === "string") {
    return value;
  }

  if (
    typeof value === "object" &&
    value !== null &&
    "src" in value &&
    typeof (value as { src?: unknown }).src === "string"
  ) {
    return String((value as { src: string }).src);
  }

  return "";
};

export const resolveMediaUrl = (value?: unknown): string => {
  const imageValue = getImageValue(value);

  if (!imageValue) return humans.src;
  if (imageValue.startsWith("http")) return imageValue;
  if (imageValue.startsWith("/uploads")) return `${LOADER_API}${imageValue}`;
  if (imageValue.startsWith("/")) return `${LOADER_API}/uploads${imageValue}`;

  return `${LOADER_API}/uploads/${imageValue}`;
};

export const resolveUserAvatar = (user?: {
  avatar?: string;
  photo?: string;
  twitterData?: { photo?: string };
} | null): string =>
  resolveMediaUrl(user?.avatar || user?.photo || user?.twitterData?.photo);

export const formatRelativeTime = (
  value?: string | Date | null,
  fallback: string = "just now"
): string => {
  if (!value) return fallback;

  const date = moment(value);
  if (!date.isValid()) return fallback;

  return date.fromNow();
};

export const formatDateTime = (
  value?: string | Date | null,
  fallback: string = "-"
): string => {
  if (!value) return fallback;

  const date = moment(value);
  if (!date.isValid()) return fallback;

  return date.format("DD MMM YYYY, HH:mm");
};

export const formatChartDate = (
  value?: string | Date | null,
  fallback: string = "-"
): string => {
  if (!value) return fallback;

  const date = moment(value);
  if (!date.isValid()) return fallback;

  return date.format("DD MMM");
};

export const formatViews = (value?: number): string => {
  const views = Number(value || 0);
  if (!Number.isFinite(views) || views <= 0) return "0";

  if (views >= 1000) {
    return `${(views / 1000).toFixed(1).replace(/\.0$/, "")}k`;
  }

  return String(views);
};

export const formatTokenId = (value?: string | number | null): string => {
  const tokenId = String(value ?? "").trim();
  if (!tokenId) return "#-";

  return tokenId.startsWith("#") ? tokenId : `#${tokenId}`;
};

export const isExpiredDate = (value?: string | Date | null): boolean => {
  if (!value) {
    return false;
  }

  const timestamp = new Date(value).getTime();

  if (!Number.isFinite(timestamp)) {
    return false;
  }

  return timestamp <= Date.now();
};

const padTimerValue = (value: number): string =>
  String(Math.max(0, value)).padStart(2, "0");

export const getCountdownParts = (
  targetDate?: string | Date | null
): { days: string; hours: string; minutes: string; seconds: string } => {
  if (!targetDate) {
    return {
      days: "00",
      hours: "00",
      minutes: "00",
      seconds: "00",
    };
  }

  const endDate = new Date(targetDate).getTime();

  if (!Number.isFinite(endDate)) {
    return {
      days: "00",
      hours: "00",
      minutes: "00",
      seconds: "00",
    };
  }

  const distance = Math.max(0, endDate - Date.now());
  const days = Math.floor(distance / (1000 * 60 * 60 * 24));
  const hours = Math.floor(
    (distance % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60)
  );
  const minutes = Math.floor((distance % (1000 * 60 * 60)) / (1000 * 60));
  const seconds = Math.floor((distance % (1000 * 60)) / 1000);

  return {
    days: padTimerValue(days),
    hours: padTimerValue(hours),
    minutes: padTimerValue(minutes),
    seconds: padTimerValue(seconds),
  };
};
