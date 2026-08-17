// main global dark: shared dark palette used by NavBarWrapper and matching dark UI surfaces.
export const mainGlobalDark = {
  background: "#0C1A2B",
  backgroundHover: "#132439",
  border: "#333337",
  textMuted: "#9797A0",
  text: "#D3D3D7",
  positive: "#00DD73",
  white: "#FFFFFF",
} as const;

export const mainGlobalDarkBorder = (width = "1px") =>
  `${width} solid ${mainGlobalDark.border}`;

export const mainGlobalDarkQuarterDividers = () => `
  linear-gradient(90deg, transparent calc(25% - 1px), ${mainGlobalDark.border} calc(25% - 1px), ${mainGlobalDark.border} 25%, transparent 25%),
  linear-gradient(90deg, transparent calc(50% - 1px), ${mainGlobalDark.border} calc(50% - 1px), ${mainGlobalDark.border} 50%, transparent 50%),
  linear-gradient(90deg, transparent calc(75% - 1px), ${mainGlobalDark.border} calc(75% - 1px), ${mainGlobalDark.border} 75%, transparent 75%)
`;
