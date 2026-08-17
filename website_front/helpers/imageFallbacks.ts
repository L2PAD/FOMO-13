import imageLoader from "./imageLoader";

export type ImageFallbackType = "project" | "user";

export const USER_LOGO_FALLBACK = "/static/User%203.svg";

const EMPTY_IMAGE_VALUES = new Set(["", "undefined", "null"]);
const PROJECT_INITIALS_COLORS = [
  "#D94A2B",
  "#1F8A70",
  "#2F6FED",
  "#9B4DCA",
  "#C47F00",
  "#0E8F9E",
  "#C4375B",
  "#53627C",
  "#4B7F2C",
  "#B45F06",
];

const normalizeImageValue = (value: unknown): string => {
  if (typeof value === "string") return value.trim();
  if (value === undefined || value === null) return "";
  return String(value).trim();
};

const normalizeInitialsSource = (value: unknown): string =>
  normalizeImageValue(value)
    .replace(/@2x\.webp$/i, "")
    .replace(/\.[a-z0-9]+$/i, "")
    .replace(/[_-]+/g, " ")
    .replace(/[^a-zA-Z0-9\s]/g, " ")
    .replace(/\s+/g, " ")
    .trim();

const safeDecodeURIComponent = (value: string): string => {
  try {
    return decodeURIComponent(value);
  } catch {
    return value;
  }
};

const getProjectNameFromImageValue = (value: unknown): string => {
  const normalizedValue = normalizeImageValue(value);

  if (!normalizedValue) return "";

  try {
    const { pathname } = new URL(normalizedValue);
    const fileName = pathname.split("/").filter(Boolean).pop();
    return safeDecodeURIComponent(fileName || "");
  } catch {
    const fileName = normalizedValue.split("/").filter(Boolean).pop();
    return fileName ? safeDecodeURIComponent(fileName) : normalizedValue;
  }
};

const hashString = (value: string): number => {
  let hash = 0;

  for (let index = 0; index < value.length; index += 1) {
    hash = (hash * 31 + value.charCodeAt(index)) >>> 0;
  }

  return hash;
};

const escapeSvgText = (value: string): string =>
  value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");

export const isEmptyImageValue = (value: unknown): boolean => {
  const normalizedValue = normalizeImageValue(value).toLowerCase();
  return EMPTY_IMAGE_VALUES.has(normalizedValue);
};

export const isLegacyProjectFallback = (value: unknown): boolean => {
  const normalizedValue = safeDecodeURIComponent(
    normalizeImageValue(value)
  ).toLowerCase();
  return (
    normalizedValue.endsWith("/static/company 2.svg") ||
    normalizedValue.endsWith("/static/company 2.png")
  );
};

export const shouldUseProjectInitials = (value: unknown): boolean =>
  isEmptyImageValue(value) || isLegacyProjectFallback(value);

export const getProjectInitials = (projectName: unknown): string => {
  const normalizedName = normalizeInitialsSource(projectName);

  if (!normalizedName) return "?";

  const words = normalizedName.split(" ").filter(Boolean);
  const initials =
    words.length > 1
      ? words
          .slice(0, 2)
          .map((word) => word[0])
          .join("")
      : words[0].slice(0, 2);

  return initials.toUpperCase();
};

export const getProjectInitialsBackground = (seed: unknown): string => {
  const normalizedSeed = normalizeInitialsSource(seed) || "project";
  return PROJECT_INITIALS_COLORS[
    hashString(normalizedSeed) % PROJECT_INITIALS_COLORS.length
  ];
};

export const getProjectInitialsImage = (
  projectName: unknown,
  seed: unknown = projectName
): string => {
  const initials = escapeSvgText(getProjectInitials(projectName));
  const background = getProjectInitialsBackground(seed || projectName);
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="64" height="64" viewBox="0 0 64 64"><rect width="64" height="64" rx="16" fill="${background}"/><text x="50%" y="50%" dy=".35em" text-anchor="middle" font-family="Inter,Arial,sans-serif" font-size="${initials.length > 1 ? 24 : 28}" font-weight="800" fill="#fff">${initials}</text></svg>`;

  return `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(svg)}`;
};

export const PROJECT_IMAGE_FALLBACK = getProjectInitialsImage("");

const getProjectInitialsImageFallback = (
  value: unknown,
  projectName?: unknown
): string => {
  const fallbackName =
    normalizeImageValue(projectName) || getProjectNameFromImageValue(value);

  return getProjectInitialsImage(fallbackName, fallbackName || value);
};

export const getImageFallback = (type: ImageFallbackType): string =>
  type === "project" ? PROJECT_IMAGE_FALLBACK : USER_LOGO_FALLBACK;

export const getImageWithFallback = (
  value: unknown,
  fallbackType: ImageFallbackType
): string => {
  if (isEmptyImageValue(value)) {
    return getImageFallback(fallbackType);
  }

  return imageLoader(normalizeImageValue(value)) || getImageFallback(fallbackType);
};

export const getProjectImage = (value: unknown, projectName?: unknown): string => {
  if (shouldUseProjectInitials(value)) {
    return getProjectInitialsImageFallback(value, projectName);
  }

  return (
    imageLoader(normalizeImageValue(value)) ||
    getProjectInitialsImageFallback(value, projectName)
  );
};

export const getUserLogo = (value: unknown): string =>
  getImageWithFallback(value, "user");

export const setImageFallback = (
  event: { currentTarget: HTMLImageElement },
  fallbackType: ImageFallbackType
): void => {
  const fallbackSrc = getImageFallback(fallbackType);
  const image = event.currentTarget;

  if (image.src.endsWith(fallbackSrc)) return;

  image.onerror = null;
  image.src = fallbackSrc;
};

export const setProjectImageFallback = (
  event: { currentTarget: HTMLImageElement },
  projectName?: unknown
): void => {
  const image = event.currentTarget;
  const fallbackSrc = getProjectInitialsImage(
    projectName || image.alt || image.getAttribute("aria-label") || ""
  );

  if (image.src === fallbackSrc) return;

  image.onerror = null;
  image.src = fallbackSrc;
};

export const setUserLogoFallback = (
  event: { currentTarget: HTMLImageElement }
): void => setImageFallback(event, "user");
