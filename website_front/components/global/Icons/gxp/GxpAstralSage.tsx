import React, { FC } from "react";
import { IconInterface } from "../IconIfterface";

// Global XP Rank 5 — Astral Sage: a spiral galaxy of accumulated wisdom.
const GxpAstralSage: FC<IconInterface> = ({ className, width = 32, height = 32 }) => {
  return (
    <svg
      className={className}
      width={width}
      height={height}
      viewBox="0 0 40 40"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <rect width="40" height="40" rx="12" fill="#E8873A" />
      <circle cx="20" cy="20" r="2.6" fill="white" />
      <path
        d="M20 20C24.5 13.5 31 16 29.6 22.2C28.4 27.4 21.2 28 17 24"
        fill="none"
        stroke="white"
        strokeWidth="2"
        strokeLinecap="round"
      />
      <path
        d="M20 20C15.5 26.5 9 24 10.4 17.8C11.6 12.6 18.8 12 23 16"
        fill="none"
        stroke="white"
        strokeWidth="2"
        strokeLinecap="round"
      />
    </svg>
  );
};

export default GxpAstralSage;
