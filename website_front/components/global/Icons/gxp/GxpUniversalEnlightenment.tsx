import React, { FC } from "react";
import { IconInterface } from "../IconIfterface";

// Global XP Rank 6 — Universal Enlightenment (top): a radiant sun of full mastery.
const GxpUniversalEnlightenment: FC<IconInterface> = ({ className, width = 32, height = 32 }) => {
  return (
    <svg
      className={className}
      width={width}
      height={height}
      viewBox="0 0 40 40"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <rect width="40" height="40" rx="12" fill="#E0B72E" />
      <circle cx="20" cy="20" r="5.2" fill="white" />
      <g stroke="white" strokeWidth="2" strokeLinecap="round">
        <line x1="20" y1="6" x2="20" y2="10" />
        <line x1="20" y1="30" x2="20" y2="34" />
        <line x1="6" y1="20" x2="10" y2="20" />
        <line x1="30" y1="20" x2="34" y2="20" />
        <line x1="10.3" y1="10.3" x2="13.1" y2="13.1" />
        <line x1="26.9" y1="26.9" x2="29.7" y2="29.7" />
        <line x1="29.7" y1="10.3" x2="26.9" y2="13.1" />
        <line x1="13.1" y1="26.9" x2="10.3" y2="29.7" />
      </g>
    </svg>
  );
};

export default GxpUniversalEnlightenment;
