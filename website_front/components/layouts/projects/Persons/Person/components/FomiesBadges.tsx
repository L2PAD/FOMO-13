import React, { FC, useEffect, useState } from "react";
import UserBadges from "../../../../../global/UserBadges";
import fetchUserBadges, { PublicUserBadge } from "../../../../../../http/user/fetchUserBadges";
import { BadgesRow } from "../../../../gemslab/Profile/styles";

interface Props {
  userId?: string;
  max?: number;
}

/**
 * Live platform badges for a Fomie (Universal Badge Engine).
 * Static PNG placeholders were removed (P6) — this now reflects the user's
 * actually-earned badges and renders nothing when there are none.
 */
const FomiesBadges: FC<Props> = ({ userId, max = 6 }) => {
  const [badges, setBadges] = useState<PublicUserBadge[]>([]);

  useEffect(() => {
    let active = true;
    if (!userId) { setBadges([]); return; }
    fetchUserBadges(String(userId)).then((list) => {
      if (active) setBadges(Array.isArray(list) ? list : []);
    });
    return () => { active = false; };
  }, [userId]);

  if (!badges.length) return null;

  return (
    <BadgesRow>
      <UserBadges badges={badges} max={max} size={34} />
    </BadgesRow>
  );
};

export default FomiesBadges;
