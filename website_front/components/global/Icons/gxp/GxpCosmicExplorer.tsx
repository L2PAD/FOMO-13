import React, { FC } from "react";
import { IconInterface } from "../IconIfterface";

// Global XP Rank 2 — Cosmic Explorer: a rocket setting off.
const GxpCosmicExplorer: FC<IconInterface> = ({ className, width = 32, height = 32 }) => {
  return (
    <svg
      className={className}
      width={width}
      height={height}
      viewBox="0 0 40 40"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <rect width="40" height="40" rx="12" fill="#2082EA" />
      <path
        d="M20 8C24.4 12.4 25.6 18.4 25.6 23H14.4C14.4 18.4 15.6 12.4 20 8Z"
        fill="white"
      />
      <circle cx="20" cy="16.5" r="2.4" fill="#2082EA" />
      <path d="M14.4 21L10.5 27L15.6 24.6L14.4 21Z" fill="white" />
      <path d="M25.6 21L29.5 27L24.4 24.6L25.6 21Z" fill="white" />
      <path d="M17.8 24.5L20 32L22.2 24.5" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
};

export default GxpCosmicExplorer;
