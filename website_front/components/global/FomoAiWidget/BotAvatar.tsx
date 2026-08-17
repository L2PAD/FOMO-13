import React, { FC } from "react";

interface Props {
  size?: number;
  /** Head fill color (adapts to background: white on dark, green on light) */
  color?: string;
  className?: string;
}

// Premium FOMO AI bot — a friendly visor-faced assistant (not a sparkle).
// Head fill is themeable; the visor + glowing eyes give it a distinct identity.
const BotAvatar: FC<Props> = ({ size = 30, color = "#ffffff", className }) => {
  const visor = "#0B1B2B";
  const eye = "#2EE6B7";
  return (
    <svg
      className={className}
      width={size}
      height={size}
      viewBox="0 0 40 40"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden
    >
      {/* antenna */}
      <line x1="20" y1="3.5" x2="20" y2="8" stroke={color} strokeWidth="2.2" strokeLinecap="round" />
      <circle cx="20" cy="3.4" r="2.1" fill={eye} />
      {/* side ears */}
      <rect x="3.2" y="17" width="3.6" height="8.5" rx="1.8" fill={color} />
      <rect x="33.2" y="17" width="3.6" height="8.5" rx="1.8" fill={color} />
      {/* head */}
      <rect x="6" y="9" width="28" height="24" rx="10" fill={color} />
      {/* visor */}
      <rect x="9.5" y="13.5" width="21" height="12.5" rx="6.2" fill={visor} />
      {/* eyes */}
      <circle className="bot-eye" cx="16" cy="19.7" r="2.6" fill={eye} />
      <circle className="bot-eye" cx="24" cy="19.7" r="2.6" fill={eye} />
      {/* subtle smile plate */}
      <rect x="15" y="28.4" width="10" height="2.6" rx="1.3" fill={visor} opacity="0.5" />
    </svg>
  );
};

export default BotAvatar;
