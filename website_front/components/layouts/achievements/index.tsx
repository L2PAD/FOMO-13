import React, { useContext, useEffect, useMemo, useState } from "react";
import styled from "styled-components";
import { Trophy } from "lucide-react";
import BadgeHex from "../../global/BadgeHex";
import { AuthContext } from "../../global/Layout";
import fetchAllBadges, { PublicBadge } from "../../../http/badges/fetchAllBadges";
import fetchUserBadges, { PublicUserBadge } from "../../../http/user/fetchUserBadges";

const Wrap = styled.div`
  max-width: 1180px;
  margin: 0 auto;
  padding: 24px 16px 64px;
`;

const Hero = styled.div`
  display: flex;
  align-items: center;
  gap: 16px;
  padding: 22px 24px;
  border-radius: 16px;
  background: linear-gradient(135deg, #eaf1ff 0%, #f6f9ff 60%);
  border: 1px solid #e4ecf7;
  margin-bottom: 22px;

  .icon {
    color: var(--main-blue, #2f6bff);
    flex-shrink: 0;
  }
  h1 {
    font-size: 24px;
    font-weight: 800;
    color: #101828;
    margin: 0 0 4px;
  }
  p {
    font-size: 14px;
    color: #5b6b82;
    margin: 0;
  }
`;

const Stats = styled.div`
  display: flex;
  gap: 10px;
  margin-left: auto;
  flex-wrap: wrap;
  .stat {
    background: #fff;
    border: 1px solid #e4ecf7;
    border-radius: 12px;
    padding: 10px 16px;
    text-align: center;
    min-width: 92px;
  }
  .value { font-size: 20px; font-weight: 800; color: #2f6bff; }
  .label { font-size: 11.5px; font-weight: 700; color: #7a879a; text-transform: uppercase; letter-spacing: 0.3px; }
`;

const CategoryTitle = styled.h2`
  font-size: 15px;
  font-weight: 800;
  color: #1d2939;
  margin: 26px 0 12px;
  display: flex;
  align-items: center;
  gap: 8px;
  &::after { content: ""; flex: 1; height: 1px; background: #eef2f7; }
`;

const Grid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(240px, 1fr));
  gap: 14px;
`;

const RARITY: Record<string, { label: string; bg: string; color: string }> = {
  common: { label: "Common", bg: "#EEF2F7", color: "#64748B" },
  uncommon: { label: "Uncommon", bg: "#DCFCE7", color: "#0E9F73" },
  rare: { label: "Rare", bg: "#E0F2FE", color: "#0369A1" },
  epic: { label: "Epic", bg: "#EDE9FE", color: "#6D28D9" },
  legendary: { label: "Legendary", bg: "#FEF3C7", color: "#B45309" },
};

const Card = styled.div<{ $earned: boolean }>`
  border: 1px solid ${({ $earned }) => ($earned ? "#cfe0ff" : "#eef2f7")};
  background: ${({ $earned }) => ($earned ? "#fbfdff" : "#fff")};
  border-radius: 14px;
  padding: 16px;
  display: flex;
  gap: 14px;
  align-items: flex-start;
  transition: transform 150ms ease, box-shadow 150ms ease;
  &:hover { transform: translateY(-2px); box-shadow: 0 10px 24px rgba(16, 24, 40, 0.08); }

  .body { min-width: 0; flex: 1; }
  .top { display: flex; align-items: center; gap: 8px; margin-bottom: 4px; flex-wrap: wrap; }
  .name { font-size: 14.5px; font-weight: 800; color: #101828; }
  .desc { font-size: 12.5px; color: #5b6b82; line-height: 1.4; }
  .meta { margin-top: 8px; display: flex; align-items: center; gap: 8px; flex-wrap: wrap; }
`;

const Chip = styled.span<{ $bg: string; $color: string }>`
  display: inline-flex;
  align-items: center;
  padding: 2px 9px;
  border-radius: 999px;
  font-size: 10.5px;
  font-weight: 800;
  text-transform: uppercase;
  letter-spacing: 0.3px;
  background: ${({ $bg }) => $bg};
  color: ${({ $color }) => $color};
`;

const StatusText = styled.span<{ $earned: boolean }>`
  font-size: 12px;
  font-weight: 700;
  color: ${({ $earned }) => ($earned ? "#0E9F73" : "#8592A6")};
`;

const CATEGORY_LABEL: Record<string, string> = {
  STAKING: "Staking", SPACEPORT: "SpacePort", TRADE: "Trading", ACTIVITY: "Activity",
  REFERRAL: "Referral", NFT: "NFT", CONTENT: "Content", PORTFOLIO: "Portfolio",
  EARLYLAND: "EarlyLand", CONTRIBUTION: "Contribution", LAUNCHPAD: "Launchpad", SPECIAL: "Special",
};

const CATEGORY_ORDER = ["SPECIAL", "SPACEPORT", "STAKING", "TRADE", "ACTIVITY", "NFT", "LAUNCHPAD", "REFERRAL", "EARLYLAND", "CONTENT", "PORTFOLIO", "CONTRIBUTION"];

const AchievementsShowcase: React.FC = () => {
  const auth = useContext(AuthContext) as any;
  const userId = auth?.userData?._id ? String(auth.userData._id) : "";
  const [catalog, setCatalog] = useState<PublicBadge[]>([]);
  const [earned, setEarned] = useState<Record<string, PublicUserBadge>>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;
    fetchAllBadges().then((list) => {
      if (active) { setCatalog(list); setLoading(false); }
    });
    return () => { active = false; };
  }, []);

  useEffect(() => {
    let active = true;
    if (!userId) { setEarned({}); return; }
    fetchUserBadges(userId).then((list) => {
      if (!active) return;
      const map: Record<string, PublicUserBadge> = {};
      for (const b of list) map[b.code] = b;
      setEarned(map);
    });
    return () => { active = false; };
  }, [userId]);

  const isAuthed = !!userId;
  const grouped = useMemo(() => {
    const g: Record<string, PublicBadge[]> = {};
    for (const b of catalog) {
      (g[b.category] = g[b.category] || []).push(b);
    }
    return g;
  }, [catalog]);

  const totalEarned = Object.keys(earned).length;

  const renderCard = (b: PublicBadge) => {
    const isEarned = !!earned[b.code];
    const isSecret = !!b.hiddenProgress && !isEarned;
    const rar = RARITY[b.rarity || "common"] || RARITY.common;
    // Public (not authed) => show non-secret badges as available (blue) to display the art.
    const showBlue = isEarned || (!isAuthed && !isSecret);
    return (
      <Card key={b.code} $earned={isEarned} data-testid={`achievement-card-${b.code}`}>
        <BadgeHex icon={b.icon} size={64} earned={showBlue} hidden={isSecret} />
        <div className="body">
          <div className="top">
            <span className="name">{isSecret ? "Secret badge" : b.name}</span>
            <Chip $bg={rar.bg} $color={rar.color}>{rar.label}</Chip>
          </div>
          <div className="desc">{isSecret ? "Unlock this hidden achievement to reveal it." : b.description || ""}</div>
          <div className="meta">
            <Chip $bg="#EDE9FE" $color="#6D28D9">{CATEGORY_LABEL[b.category] || b.category}</Chip>
            {isAuthed ? (
              <StatusText $earned={isEarned}>
                {isEarned
                  ? earned[b.code]?.earnedAt
                    ? `Earned ${new Date(earned[b.code].earnedAt as string).toLocaleDateString()}`
                    : "Earned"
                  : isSecret ? "Hidden" : "Locked"}
              </StatusText>
            ) : (
              <StatusText $earned={false}>{b.awardMode === "manual" ? "Awarded by team" : "Available"}</StatusText>
            )}
          </div>
        </div>
      </Card>
    );
  };

  const orderedCats = CATEGORY_ORDER.filter((c) => grouped[c]?.length).concat(
    Object.keys(grouped).filter((c) => !CATEGORY_ORDER.includes(c))
  );

  return (
    <Wrap data-testid="achievements-showcase">
      <Hero>
        <Trophy size={44} className="icon" strokeWidth={1.4} />
        <div>
          <h1>Achievements</h1>
          <p>Platform-wide badges you can earn across staking, trading, activity and more.</p>
        </div>
        <Stats>
          <div className="stat"><div className="value">{catalog.length}</div><div className="label">Total</div></div>
          {isAuthed && <div className="stat"><div className="value">{totalEarned}</div><div className="label">Earned</div></div>}
        </Stats>
      </Hero>

      {loading ? (
        <p style={{ color: "#8592A6", fontSize: 14 }}>Loading achievements…</p>
      ) : catalog.length === 0 ? (
        <p style={{ color: "#8592A6", fontSize: 14 }}>No achievements available yet.</p>
      ) : (
        orderedCats.map((cat) => (
          <div key={cat}>
            <CategoryTitle>{CATEGORY_LABEL[cat] || cat}</CategoryTitle>
            <Grid>{grouped[cat].map(renderCard)}</Grid>
          </div>
        ))
      )}
    </Wrap>
  );
};

export default AchievementsShowcase;
