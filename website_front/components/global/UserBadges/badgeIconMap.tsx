import React from "react";
import BadgeHex from "../BadgeHex";

/**
 * Renders a badge icon in the unified FOMO house style (blue hexagon + white glyph).
 * `icon` accepts a canonical glyph key ("star", "handshake", ...) or a legacy
 * seed key ("nova", "P2P Pro", ...) which is aliased internally.
 */
export const renderBadgeIcon = (icon: string | undefined, size = 40): React.ReactNode => (
  <BadgeHex icon={icon} earned size={size} />
);

/** Locked / hidden badge patch (grey hexagon with "?"). */
export const renderHiddenBadge = (size = 40): React.ReactNode => (
  <BadgeHex hidden size={size} />
);
