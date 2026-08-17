import React from "react";
import styled from "styled-components";

const CardWrapper = styled.div<{ forCompare?: boolean }>`
  background: ${({ forCompare }) => (forCompare ? "#f5fbfd" : "#f5fbfd")};
  border-radius: ${({ forCompare }) => (forCompare ? "12px" : "20px")};
  padding: ${({ forCompare }) => (forCompare ? "20px" : "20px")};
  width: 100%;
  height: 100%;
  display: flex;
  flex-direction: column;

  @media (max-width: 768px) {
    padding: 12px;
  }
`;

const CardHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 8px;
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

const Subtitle = styled.p`
  font-size: 12px;
  margin: 0 0 20px 0;
  color: #728094;
`;

const CardBadge = styled.span`
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 12px;
  color: #728094;
  padding: 4px 8px;
  border-radius: 6px;
  border: 1px solid #b5bcc7;
`;

const MetricRow = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 12px;
`;

const MetricRowLabel = styled.span`
  font-size: 14px;
  color: #070b35;
`;

const MetricRowValue = styled.span`
  font-size: 14px;
  font-weight: var(--font-weight-semibold);
  color: #070b35;
`;

const AudienceRow = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 12px;
`;

const AudienceLabel = styled.span`
  font-size: 14px;
  color: #070b35;
  min-width: 140px;
`;

const AudienceValue = styled.span`
  font-size: 14px;
  font-weight: var(--font-weight-semibold);
  color: #070b35;
  min-width: 50px;
  text-align: right;
`;

const ProgressContainer = styled.div`
  display: flex;
  align-items: center;
  gap: 12px;
  width: 100%;
`;

const ProgressTrack = styled.div`
  width: 100%;
  height: 2px;
  background: linear-gradient(90deg, #00ffe3 0%, #00b4e2 50%, #0f66dd 100%);
  border-radius: 3px;
  position: relative;
`;

const ProgressDot = styled.div<{ position: number }>`
  position: absolute;
  top: 50%;
  left: ${({ position }) => position}%;
  transform: translate(-50%, -50%);
  width: 7px;
  height: 7px;
  background: #070b35;
  border-radius: 50%;
`;

const TagsSection = styled.div`
  margin-top: auto;
`;

const TagsContainer = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
`;

const Tag = styled.span`
  padding: 6px 12px;
  background: #e9f8f8;
  border-radius: 6px;
  font-size: 12px;
  color: #728094;
  font-weight: var(--font-weight-medium);
`;

const CompactTitle = styled.h4`
  font-size: 14px;
  font-weight: var(--font-weight-medium);
  color: #070b35;
  margin: 0 0 12px 0;
`;

const FooterNote = styled.p`
  font-size: 14px;
  line-height: 1.5;
  color: #738094;
  margin: 20px 0 0 0;
`;

interface AudienceMetric {
  label: string;
  value: string;
  change?: string;
  positive?: boolean;
  icon?: React.ReactNode;
  percentage?: number;
}

interface AudienceSnapshotProps {
  directFollowers?: AudienceMetric;
  crossPostTraffic?: AudienceMetric;
  searchHashtags?: AudienceMetric;
  externalShares?: AudienceMetric;
  concernsText?: string;
  trustIndicators?: string[];
  refundRate?: string;
  network?:
    | "telegram"
    | "x"
    | "discord"
    | "instagram"
    | "linkedin"
    | "tiktok"
    | "threads";
  interestTags?: string[];
  forCompare?: boolean;
}

const AudienceSnapshot: React.FC<AudienceSnapshotProps> = ({
  directFollowers,
  crossPostTraffic,
  searchHashtags,
  externalShares,
  concernsText = "concerns delayed updates during high-volatility periods and limited beginner-friendly material.",
  trustIndicators = [
    "High retention of paid members",
    "Stable positive vs negative sentiment",
    "Low spam & minimal bot-like reviews",
    "Content reshared by reputable analysts",
  ],
  refundRate = "~3% over 30 days",
  network = "telegram",
  interestTags = [
    "On-chain flows",
    "Token launches",
    "DEX liquidity",
    "Fund rotations",
  ],
  forCompare = false,
}) => {
  const isXNetwork = network === "x";
  const isDiscordNetwork = network === "discord";
  const isInstagramNetwork = network === "instagram";
  const isTikTokNetwork = network === "tiktok";
  const isThreadsNetwork = network === "threads";

  return (
    <CardWrapper forCompare={forCompare}>
      {!forCompare && (
        <>
          <CardHeader>
            <CardTitle>Audience Snapshot</CardTitle>
            <CardBadge>
              {isXNetwork
                ? "On-Chain & OSINT"
                : isDiscordNetwork
                  ? "Active Members"
                  : isInstagramNetwork || isTikTokNetwork || isThreadsNetwork
                    ? "Last 30 Days"
                    : "Last 30 Days"}
            </CardBadge>
          </CardHeader>
          <Subtitle>
            {isXNetwork
              ? "Who actually reacts to this account."
              : "Where engagement comes from."}
          </Subtitle>
        </>
      )}

      {isXNetwork ? (
        <>
          <AudienceRow>
            <AudienceLabel>Pro traders/funds</AudienceLabel>
            <ProgressContainer>
              <ProgressTrack>
                <ProgressDot position={directFollowers?.percentage || 50} />
              </ProgressTrack>
            </ProgressContainer>
            <AudienceValue>{directFollowers?.value}</AudienceValue>
          </AudienceRow>
          <AudienceRow>
            <AudienceLabel>Retail/degen</AudienceLabel>
            <ProgressContainer>
              <ProgressTrack>
                <ProgressDot position={crossPostTraffic?.percentage || 60} />
              </ProgressTrack>
            </ProgressContainer>
            <AudienceValue>{crossPostTraffic?.value}</AudienceValue>
          </AudienceRow>
          <AudienceRow>
            <AudienceLabel>Builders/devs</AudienceLabel>
            <ProgressContainer>
              <ProgressTrack>
                <ProgressDot position={searchHashtags?.percentage || 30} />
              </ProgressTrack>
            </ProgressContainer>
            <AudienceValue>{searchHashtags?.value}</AudienceValue>
          </AudienceRow>
          <TagsSection>
            <TagsContainer>
              {interestTags.map((tag, index) => (
                <Tag key={index}>{tag}</Tag>
              ))}
            </TagsContainer>
          </TagsSection>
        </>
      ) : isDiscordNetwork ? (
        <>
          <AudienceRow>
            <AudienceLabel>Core contributors</AudienceLabel>
            <ProgressContainer>
              <ProgressTrack>
                <ProgressDot position={38} />
              </ProgressTrack>
            </ProgressContainer>
            <AudienceValue>~38%</AudienceValue>
          </AudienceRow>
          <AudienceRow>
            <AudienceLabel>Traders</AudienceLabel>
            <ProgressContainer>
              <ProgressTrack>
                <ProgressDot position={34} />
              </ProgressTrack>
            </ProgressContainer>
            <AudienceValue>~34%</AudienceValue>
          </AudienceRow>
          <AudienceRow>
            <AudienceLabel>Observers/lurkers</AudienceLabel>
            <ProgressContainer>
              <ProgressTrack>
                <ProgressDot position={20} />
              </ProgressTrack>
            </ProgressContainer>
            <AudienceValue>~20%</AudienceValue>
          </AudienceRow>
          {!forCompare && (
            <>
              <CompactTitle
                style={{ marginTop: 20, marginBottom: 8, fontWeight: "var(--font-weight-semibold)" }}
              >
                Typical reaction pattern
              </CompactTitle>
              <Subtitle style={{ margin: 0, fontSize: 14, color: "#000" }}>
                Announcements are picked up quickly by core contributors and
                then echoed into trading/alpha channels within 5–10 minutes.
              </Subtitle>
            </>
          )}
        </>
      ) : isInstagramNetwork ? (
        <>
          <AudienceRow>
            <AudienceLabel>Highly engaged followers</AudienceLabel>
            <AudienceValue>22%</AudienceValue>
          </AudienceRow>
          <AudienceRow>
            <AudienceLabel>Occasional engagers</AudienceLabel>
            <AudienceValue>48%</AudienceValue>
          </AudienceRow>
          <AudienceRow>
            <AudienceLabel>Silent/low-activity followers</AudienceLabel>
            <AudienceValue>24%</AudienceValue>
          </AudienceRow>
          <AudienceRow>
            <AudienceLabel>Suspected low-quality/bots</AudienceLabel>
            <AudienceValue>6%</AudienceValue>
          </AudienceRow>
          {!forCompare && (
            <FooterNote>
              Estimated shares of followers who interacted with at least one
              post (likes or comments) in the last 30 days. Bot-risk segment is
              inferred from public profile patterns. Values are approximate.
            </FooterNote>
          )}
        </>
      ) : isTikTokNetwork ? (
        <>
          <AudienceRow>
            <AudienceLabel>Engaged viewers</AudienceLabel>
            <AudienceValue>32%</AudienceValue>
          </AudienceRow>
          <AudienceRow>
            <AudienceLabel>Returning viewers</AudienceLabel>
            <AudienceValue>18%</AudienceValue>
          </AudienceRow>
          <AudienceRow>
            <AudienceLabel>Fast responders</AudienceLabel>
            <AudienceValue>12%</AudienceValue>
          </AudienceRow>
          <AudienceRow>
            <AudienceLabel>Organic reach</AudienceLabel>
            <AudienceValue>72%</AudienceValue>
          </AudienceRow>
          {!forCompare && (
            <FooterNote>
              Estimated shares of viewers who interacted with at least one video
              (likes or comments) in the last 30 days. Bot-risk segment is
              inferred from public profile patterns. Values are approximate.
            </FooterNote>
          )}
        </>
      ) : isThreadsNetwork ? (
        <>
          <AudienceRow>
            <AudienceLabel>Highly engaged followers</AudienceLabel>
            <AudienceValue>22%</AudienceValue>
          </AudienceRow>
          <AudienceRow>
            <AudienceLabel>Occasional engagers</AudienceLabel>
            <AudienceValue>48%</AudienceValue>
          </AudienceRow>
          <AudienceRow>
            <AudienceLabel>Silent/low-activity followers</AudienceLabel>
            <AudienceValue>24%</AudienceValue>
          </AudienceRow>
          <AudienceRow>
            <AudienceLabel>Suspected low-quality/bots</AudienceLabel>
            <AudienceValue>6%</AudienceValue>
          </AudienceRow>
          {!forCompare && (
            <FooterNote>
              Estimated shares of followers who interacted with at least one
              post (likes or comments) in the last 30 days. Bot-risk segment is
              inferred from public profile patterns. Values are approximate.
            </FooterNote>
          )}
        </>
      ) : (
        <>
          <MetricRow>
            <MetricRowLabel>Direct channel followers</MetricRowLabel>
            <MetricRowValue>{directFollowers?.value}</MetricRowValue>
          </MetricRow>
          <MetricRow>
            <MetricRowLabel>
              Cross-post traffic (other groups/channels)
            </MetricRowLabel>
            <MetricRowValue>{crossPostTraffic?.value}</MetricRowValue>
          </MetricRow>
          <MetricRow>
            <MetricRowLabel>Search & hashtags</MetricRowLabel>
            <MetricRowValue>{searchHashtags?.value}</MetricRowValue>
          </MetricRow>
          <MetricRow>
            <MetricRowLabel>External shares</MetricRowLabel>
            <MetricRowValue>{externalShares?.value}</MetricRowValue>
          </MetricRow>
        </>
      )}
    </CardWrapper>
  );
};

export default AudienceSnapshot;
