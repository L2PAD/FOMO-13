import React from "react";
import styled from "styled-components";
import {
  CompareRow,
  CompareLabel,
  CompareValue,
  CompareBadge,
  CompareValueList,
} from "./CompareStyles";

const CardWrapper = styled.div<{ forCompare?: boolean }>`
  background: ${({ forCompare }) => (forCompare ? "transparent" : "#f5fbfd")};
  border-radius: 20px;
  padding: ${({ forCompare }) => (forCompare ? "0" : "24px")};

  @media (max-width: 768px) {
    padding: 12px;
  }
`;

const CardHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
`;

const CardTitle = styled.h3`
  font-size: 24px;
  font-weight: var(--font-weight-semibold);
  color: #070b35;
  margin: 0;
  @media (max-width: 768px) {
    font-size: 18px;
  }
`;

const AIBadge = styled.span`
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 12px;
  color: #728094;
  padding: 4px 8px;
  border-radius: 6px;
  border: 1px solid #b5bcc7;
`;

const SeeMoreLink = styled.span`
  color: #05a584;
  cursor: pointer;
  font-weight: var(--font-weight-medium);
`;

const SummaryText = styled.p<{ forCompare?: boolean }>`
  font-size: 14px;
  line-height: 1.2;
  color: #070b35;
  margin-bottom: 24px;

  strong {
    font-weight: var(--font-weight-semibold);
    color: #05a584;
  }

  ${({ forCompare }) =>
    forCompare &&
    `
    display: none;
  `}
`;

const BadgeWrapper = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  flex-direction: row;
`;

const Badge = styled.span`
  padding: 4px 8px;
  font-size: 12px;
  color: #728094;
  background: #e9f8f8;
  border-radius: 6px;

  .value {
    margin-left: 4px;
    color: #05a584;
  }
`;

const CompareViewWrapper = styled.div`
  display: flex;
  flex-direction: column;
  gap: 12px;
  background: #f5fbfd;
  padding: 20px;
  border-radius: 12px;
`;

interface AISummaryProps {
  network?:
    | "telegram"
    | "x"
    | "discord"
    | "instagram"
    | "linkedin"
    | "tiktok"
    | "threads";
  entityName?: string;
  forCompare?: boolean;
}

const AISummary: React.FC<AISummaryProps> = ({
  network = "telegram",
  entityName = "FOMO Hub",
  forCompare = false,
}) => {
  const getContent = () => {
    switch (network) {
      case "x":
        return {
          summary: (
            <>
              <strong>{entityName}</strong> sits in the upper tier of
              research-first accounts on X. Engagement is stable and non-hype
              driven, with strong participation from builders, funds, and
              advanced retail.
              <br />
              <br />
              Posts cluster around on-chain flows, token launch mechanics, and
              liquidity stress tests rather than pure mechanics, and liquidity
              stress tests rather than price calls. Recent growth is organic,
              without... <SeeMoreLink>See More</SeeMoreLink>
            </>
          ),
          badges: [
            { label: "Risk level", value: "Low" },
            { label: "Signal/noise", value: "8.9/10" },
            { label: "Narrative exposure", value: "Infrastructure, L2, DeFi" },
          ],
        };
      case "discord":
        return {
          summary: (
            <>
              <strong>{entityName}</strong> sits in the upper tier of
              research-driven Discord servers. Activity is steady, with frequent
              discussion of on-chain flows, token launches and risk management.
              <br />
              <br />
              Most traffic is driven by a mix of power users and analysts; low
              spam and few low-quality bursts suggest real community interest
              rather than bot acti... <SeeMoreLink>See More</SeeMoreLink>
            </>
          ),
          badges: [
            { label: "Risk level", value: "Low" },
            { label: "Signal/noise", value: "8.6/10" },
            { label: "Narrative exposure", value: "L2, DeFi" },
          ],
        };
      case "instagram":
        return {
          summary: (
            <>
              <strong>{entityName}</strong> sits in the upper tier of
              research-driven Telegram channels. Activity is consistent, with
              high view-rate on posts and steady attention around market
              updates, liquidity flows and L2 ecosystem movements.
              <br />
              <br />
              Most engagement is driven by a mix of active readers and
              professional traders; low spam and stable forward-ratio suggest
              real organic interest rather than automated boosting. Posting
              frequency is ... <SeeMoreLink>See More</SeeMoreLink>
            </>
          ),
          badges: [
            { label: "Trust level", value: "High" },
            { label: "Content focus", value: "Fun, General, L2" },
            { label: "Best performing", value: "Reels" },
          ],
        };
      case "threads":
        return {
          summary: (
            <>
              <strong>{entityName}</strong> sits in the upper tier of
              research-driven Telegram channels. Activity is consistent, with
              high view-rate on posts and steady attention around market
              updates, liquidity flows and L2 ecosystem movements.
              <br />
              <br />
              Most engagement is driven by a mix of active readers and
              professional traders; low spam and stable forward-ratio suggest
              real organic interest rather than automated boosting. Posting
              frequency is ... <SeeMoreLink>See More</SeeMoreLink>
            </>
          ),
          badges: [
            { label: "Trust level", value: "High" },
            { label: "Content focus", value: "Fun, General, L2" },
            { label: "Narrative", value: "Markets, L2, DeFi" },
          ],
        };
      case "tiktok":
        return {
          summary: (
            <>
              <strong>Laurent Ghaul</strong> positions himself in the upper tier
              of research-driven Web3 profiles on LinkedIn. Content focuses on
              on-chain analytics, liquidity flows and fund behaviour across
              L1/L2 ecosystems, with a strong tilt towards educational posts
              rather than promotion.
              <br />
              <br />
              Activity is consistent: most posts are long-form breakdowns with
              charts or threads that are cross-posted from X. Engagement quality
              is high ... <SeeMoreLink>See More</SeeMoreLink>
            </>
          ),
          badges: [
            { label: "Risk level", value: "Low" },
            { label: "Signal noise", value: "8.7/10" },
            { label: "Narrative", value: "Markets, L2, DeFi" },
          ],
        };
      case "linkedin":
        return {
          summary: (
            <>
              <strong>Laurent Ghaul</strong> positions himself in the upper tier
              of research-driven Web3 profiles on LinkedIn. Content focuses on
              on-chain analytics, liquidity flows and fund behaviour across
              L1/L2 ecosystems, with a strong tilt towards educational posts
              rather than promotion.
              <br />
              <br />
              Activity is consistent: most posts are long-form breakdowns with
              charts or threads that are cross-posted from X. Engagement quality
              is high ... <SeeMoreLink>See More</SeeMoreLink>
            </>
          ),
          badges: [
            { label: "Trust level", value: "Low" },
            { label: "Signal noise", value: "8.7/10" },
            {
              label: "Focus area",
              value: "Markets, DeFi, L2",
            },
          ],
        };
      default: // telegram
        return {
          summary: (
            <>
              <strong>{entityName}</strong> sits in the upper tier of
              research-driven Telegram channels. Activity is consistent, with
              high view-rate on posts and steady attention around market
              updates, liquidity flows and L2 ecosystem movements.
              <br />
              <br />
              Most engagement is driven by a mix of active readers and
              professional traders; low spam and stable forward-ratio suggest
              real organic interest rather than automated boosting. Posting
              frequency is ... <SeeMoreLink>See More</SeeMoreLink>
            </>
          ),
          badges: [
            { label: "Spam level", value: "Low" },
            { label: "Signal/noise", value: "8.6/10" },
            {
              label: "Content exposure",
              value: "Trading, On-chain, General topics",
            },
          ],
        };
    }
  };

  const { summary, badges } = getContent();

  if (forCompare) {
    return (
      <CompareViewWrapper>
        {badges.map((badge, index) => {
          const isMultiValue = badge.value.includes(",");
          const isBadge =
            badge.label === "Risk level" ||
            badge.label === "Spam level" ||
            badge.label === "Trust level";
          const values = isMultiValue
            ? badge.value.split(",").map((v) => v.trim())
            : [badge.value];

          return (
            <CompareRow key={index}>
              <CompareLabel>{badge.label}</CompareLabel>
              {isBadge ? (
                <CompareBadge>{badge.value}</CompareBadge>
              ) : isMultiValue ? (
                <CompareValueList>
                  {values.map((val, i) => (
                    <CompareValue key={i}>{val}</CompareValue>
                  ))}
                </CompareValueList>
              ) : (
                <CompareValue>{badge.value}</CompareValue>
              )}
            </CompareRow>
          );
        })}
      </CompareViewWrapper>
    );
  }

  return (
    <CardWrapper forCompare={forCompare}>
      <CardHeader>
        <CardTitle>AI Summary</CardTitle>
        <AIBadge>Auto-generated</AIBadge>
      </CardHeader>
      <SummaryText forCompare={forCompare}>{summary}</SummaryText>
      <BadgeWrapper>
        {badges.map((badge, index) => (
          <Badge key={index}>
            {badge.label}
            <span className="value">{badge.value}</span>
          </Badge>
        ))}
      </BadgeWrapper>
    </CardWrapper>
  );
};

export default AISummary;
