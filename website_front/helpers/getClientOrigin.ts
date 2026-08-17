const ABSOLUTE_URL_PATTERN = /^(?:[a-z]+:)?\/\//i;

export const getClientOrigin = (): string => {
  return typeof window !== "undefined" ? window.location.origin : "";
};

export const toClientAbsoluteUrl = (value?: string | null): string => {
  if (!value) return "";
  if (
    ABSOLUTE_URL_PATTERN.test(value) ||
    value.startsWith("data:") ||
    value.startsWith("blob:")
  ) {
    return value;
  }

  const origin = getClientOrigin();
  return origin ? `${origin}${value}` : value;
};
