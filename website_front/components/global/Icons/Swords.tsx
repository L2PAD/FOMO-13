import React from "react";

const SwordsIcon: React.FC<{
  size?: number;
  color?: string;
}> = ({ size = 32, color = "currentColor" }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 32 32"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
  >
    <path
      d="M13.8432 20.1437L7.61887 26.3729C7.35455 26.6366 6.99628 26.7845 6.62291 26.784C6.24954 26.7836 5.89163 26.6348 5.62794 26.3705C5.36424 26.1062 5.21635 25.748 5.2168 25.3745C5.21725 25.0011 5.366 24.6433 5.63033 24.3796L11.8595 18.1504"
      stroke={color}
      stroke-linecap="round"
      stroke-linejoin="round"
    />
    <path
      d="M8.33398 18.3613L13.6374 23.6647"
      stroke={color}
      stroke-linecap="round"
      stroke-linejoin="round"
    />
    <path
      d="M21.7285 8.28125L23.7171 10.2698"
      stroke={color}
      stroke-linecap="round"
      stroke-linejoin="round"
    />
    <path
      d="M23.6647 18.3613L18.3613 23.6647"
      stroke={color}
      stroke-linecap="round"
      stroke-linejoin="round"
    />
    <path
      d="M24.3804 26.3689C24.6441 26.6326 25.0018 26.7808 25.3747 26.7808C25.7475 26.7808 26.1052 26.6326 26.3689 26.3689C26.6327 26.1053 26.7807 25.7476 26.7807 25.3746C26.7807 25.0017 26.6327 24.6441 26.3689 24.3804L7.61913 5.63059C7.35544 5.36689 6.99779 5.21875 6.62486 5.21875C6.25193 5.21875 5.89428 5.36689 5.63059 5.63059C5.36689 5.89429 5.21875 6.25194 5.21875 6.62486C5.21875 6.99778 5.36689 7.35543 5.63059 7.61913L24.3804 26.3689Z"
      stroke={color}
      stroke-linecap="round"
      stroke-linejoin="round"
    />
    <path
      d="M10.2717 8.28125L8.2832 10.2698"
      stroke={color}
      stroke-linecap="round"
      stroke-linejoin="round"
    />
    <path
      d="M18.1562 11.8564L24.3854 5.63204C24.6529 5.38845 25.004 5.25736 25.3657 5.26603C25.7274 5.2747 26.0718 5.42247 26.3273 5.6786C26.5828 5.93472 26.7298 6.27949 26.7376 6.6412C26.7453 7.0029 26.6134 7.35368 26.3692 7.62058L20.14 13.8498"
      stroke={color}
      stroke-linecap="round"
      stroke-linejoin="round"
    />
  </svg>
);

export default SwordsIcon;
