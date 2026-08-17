import React, { FC } from "react";
import { IconInterface } from "../IconIfterface";

// Global XP Rank 4 — Celestial Master: a mastered five-point star.
const GxpCelestialMaster: FC<IconInterface> = ({ className, width = 32, height = 32 }) => {
  return (
    <svg
      className={className}
      width={width}
      height={height}
      viewBox="0 0 40 40"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <rect width="40" height="40" rx="12" fill="#05A584" />
      <path
        d="M20 8L22.94 16.09L31.51 16.42L24.78 21.66L27.09 29.9L20 25.1L12.91 29.9L15.22 21.66L8.49 16.42L17.06 16.09L20 8Z"
        fill="white"
      />
      <circle cx="20" cy="19.5" r="2.2" fill="#05A584" />
    </svg>
  );
};

export default GxpCelestialMaster;
