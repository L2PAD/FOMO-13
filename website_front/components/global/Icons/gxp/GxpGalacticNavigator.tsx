import React, { FC } from "react";
import { IconInterface } from "../IconIfterface";

// Global XP Rank 3 — Galactic Navigator: a ringed planet to chart the galaxy.
const GxpGalacticNavigator: FC<IconInterface> = ({ className, width = 32, height = 32 }) => {
  return (
    <svg
      className={className}
      width={width}
      height={height}
      viewBox="0 0 40 40"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <rect width="40" height="40" rx="12" fill="#7C5CFC" />
      <ellipse
        cx="20"
        cy="20"
        rx="13"
        ry="4.2"
        fill="none"
        stroke="white"
        strokeWidth="2"
        transform="rotate(-24 20 20)"
      />
      <circle cx="20" cy="19" r="6.4" fill="white" />
      <circle cx="17.6" cy="17.4" r="1.4" fill="#7C5CFC" />
      <circle cx="22" cy="20.6" r="1" fill="#7C5CFC" />
    </svg>
  );
};

export default GxpGalacticNavigator;
