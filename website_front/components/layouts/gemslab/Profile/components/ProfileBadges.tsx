import React from "react";
import { renderBadgeIcon } from "../../../../global/UserBadges/badgeIconMap";
import { BadgesRow } from "../styles";

export interface ProfileBadgeItem {
  key: string;
  name: string;
  icon?: string;
}

interface Props {
  badges: ProfileBadgeItem[];
}

const ProfileBadges = ({ badges }: Props) => {
  return (
    <BadgesRow className="badges-row" role="list">
      {badges.map((badge) => (
        <div className="profile-badge" key={badge.key} role="listitem">
          {renderBadgeIcon(badge.icon || badge.name, 28)}
          <span>{badge.name}</span>
        </div>
      ))}
    </BadgesRow>
  );
};

export default ProfileBadges;
