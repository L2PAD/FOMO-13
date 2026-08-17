import React, { FC } from "react";
import { IconInterface } from "../IconIfterface";

// Global XP Rank 1 — Stellar Awakening (entry): a single awakening spark.
const GxpStellarAwakening: FC<IconInterface> = ({ className, width = 32, height = 32 }) => {
  return (
    <svg
      className={className}
      width={width}
      height={height}
      viewBox="0 0 40 40"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <rect width="40" height="40" rx="12" fill="#6C7A93" />
      <path
        d="M20 9L22.1 17.9L31 20L22.1 22.1L20 31L17.9 22.1L9 20L17.9 17.9L20 9Z"
        fill="white"
      />
      <circle cx="28.5" cy="12" r="1.6" fill="white" opacity="0.85" />
      <circle cx="12" cy="27" r="1.2" fill="white" opacity="0.7" />
    </svg>
  );
};

export default GxpStellarAwakening;
