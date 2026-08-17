import React from "react";
import styled from "styled-components";
import { renderBadgeIcon } from "./badgeIconMap";
import type { PublicUserBadge } from "../../../http/user/fetchUserBadges";

const Row = styled.div`
  display: inline-flex;
  align-items: center;
  gap: 8px;
  flex-wrap: wrap;
`;

const BadgeItem = styled.div<{ size: number }>`
  position: relative;
  width: ${({ size }) => size}px;
  height: ${({ size }) => size}px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  transition: transform 150ms ease;
  color: var(--main-blue, #2f6bff);

  &:hover {
    transform: translateY(-2px);
  }

  img {
    object-fit: contain;
  }

  &::after {
    content: attr(data-tip);
    position: absolute;
    bottom: calc(100% + 6px);
    left: 50%;
    transform: translateX(-50%);
    background: rgba(17, 24, 39, 0.92);
    color: #fff;
    font-size: 11px;
    font-weight: 600;
    padding: 4px 8px;
    border-radius: 6px;
    white-space: nowrap;
    opacity: 0;
    pointer-events: none;
    transition: opacity 150ms ease;
    z-index: 20;
  }

  &:hover::after {
    opacity: 1;
  }
`;

const MoreChip = styled.button<{ size: number }>`
  min-width: ${({ size }) => size}px;
  height: ${({ size }) => size}px;
  padding: 0 10px;
  border-radius: 999px;
  border: 1px solid var(--stroke, #e4eaf1);
  background: #f4f7fb;
  color: #41506a;
  font-size: 13px;
  font-weight: 700;
  cursor: pointer;
  display: inline-flex;
  align-items: center;
  justify-content: center;

  &:hover {
    background: #eaf0f8;
  }
`;

interface Props {
  badges: PublicUserBadge[];
  max?: number;
  size?: number;
  compact?: boolean;
  onShowAll?: () => void;
  className?: string;
}

/**
 * Unified user badge rack (platform-wide achievements).
 * Shows up to `max` featured badges + a "+N" affordance for the rest.
 * Replaces the historic scattered PNG/spaceport badge rows.
 */
export const UserBadges: React.FC<Props> = ({
  badges,
  max = 5,
  size = 40,
  compact = false,
  onShowAll,
  className,
}) => {
  if (!Array.isArray(badges) || badges.length === 0) return null;

  // Featured first, then the rest.
  const ordered = [...badges].sort((a, b) => Number(!!b.featured) - Number(!!a.featured));
  const limit = compact ? Math.min(3, max) : max;
  const visible = ordered.slice(0, limit);
  const rest = ordered.length - visible.length;

  return (
    <Row className={className} role="list" data-testid="user-badges">
      {visible.map((badge) => (
        <BadgeItem
          key={badge.code}
          size={size}
          role="listitem"
          data-tip={badge.name}
          data-testid={`user-badge-${badge.code}`}
        >
          {renderBadgeIcon(badge.icon, size)}
        </BadgeItem>
      ))}
      {rest > 0 && (
        <MoreChip type="button" size={size} onClick={onShowAll} data-testid="user-badges-more">
          +{rest}
        </MoreChip>
      )}
    </Row>
  );
};

export default UserBadges;
