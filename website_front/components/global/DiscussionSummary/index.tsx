/* eslint-disable */
import React, { FC, useContext, useState } from "react";
import { useQuery } from "react-query";
import { toast } from "react-toastify";
import styled from "styled-components";
import { AuthContext } from "../Layout";
import getDiscussionSummary from "../../../http/comments/getDiscussionSummary";
import regenerateDiscussionSummary from "../../../http/comments/regenerateDiscussionSummary";

const Wrapper = styled.div`
  margin: 32px 0 8px;
  padding: 22px 24px;
  border-radius: 16px;
  border: 1px solid rgba(4, 165, 132, 0.2);
  background: linear-gradient(
    135deg,
    rgba(4, 165, 132, 0.05) 0%,
    rgba(4, 165, 132, 0.015) 100%
  );

  @media (max-width: 767px) {
    padding: 16px 18px;
  }
`;

const Header = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  flex-wrap: wrap;
`;

const Heading = styled.div`
  font-size: 18px;
  font-weight: var(--font-weight-semibold);
  color: var(--color-text-primary);
  display: flex;
  align-items: center;
  gap: 10px;
`;

const StatusPill = styled.span<{ tone: string }>`
  font-size: 11px;
  font-weight: var(--font-weight-semibold);
  text-transform: uppercase;
  letter-spacing: 0.4px;
  padding: 3px 9px;
  border-radius: 999px;
  color: ${({ tone }) =>
    tone === "READY" ? "#04A584" : tone === "STALE" ? "#D97706" : "#64748B"};
  background: ${({ tone }) =>
    tone === "READY"
      ? "rgba(4,165,132,0.1)"
      : tone === "STALE"
      ? "rgba(217,119,6,0.1)"
      : "rgba(100,116,139,0.1)"};
`;

const RegenButton = styled.button`
  border: 1px solid var(--color-primary, #04a584);
  background: transparent;
  color: var(--color-primary, #04a584);
  font-size: 13px;
  font-weight: var(--font-weight-semibold);
  padding: 8px 14px;
  border-radius: 10px;
  cursor: pointer;
  transition: background 0.18s ease, opacity 0.18s ease;

  &:hover {
    background: rgba(4, 165, 132, 0.08);
  }
  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
`;

const Overview = styled.p`
  margin: 14px 0 0;
  font-size: 15.5px;
  line-height: 24px;
  color: var(--color-text-primary);
`;

const Takeaways = styled.ul`
  margin: 14px 0 0;
  padding: 0;
  list-style: none;
  display: flex;
  flex-direction: column;
  gap: 8px;

  li {
    position: relative;
    padding-left: 24px;
    font-size: 14.5px;
    line-height: 22px;
    color: var(--color-text-primary);
  }
  li::before {
    content: "";
    position: absolute;
    left: 4px;
    top: 8px;
    width: 7px;
    height: 7px;
    border-radius: 2px;
    background: var(--color-primary, #04a584);
  }
`;

const Pulse = styled.div`
  margin-top: 14px;
  font-size: 14px;
  line-height: 21px;
  color: var(--color-text-secondary, #53627c);
  font-style: italic;
`;

const Foot = styled.div`
  margin-top: 14px;
  font-size: 12px;
  color: rgba(7, 11, 53, 0.45);
`;

const Empty = styled.div`
  margin-top: 12px;
  font-size: 14px;
  color: var(--color-text-secondary, #53627c);
`;

interface IProps {
  page: string;
}

const DiscussionSummary: FC<IProps> = ({ page }) => {
  const { userData } = useContext(AuthContext);
  const isFullAuth = !!userData?.isFullAuth;
  const [busy, setBusy] = useState(false);

  const { data, refetch } = useQuery(
    ["discussion-summary", page],
    () => getDiscussionSummary(page),
    { refetchOnWindowFocus: false, enabled: !!page }
  );

  const status = data?.status || "NONE";
  const summary = data?.summary || null;

  const onRegenerate = async () => {
    if (!isFullAuth) {
      toast.error(
        <div>
          <h3>Error!</h3>
          <p>You need to be fully logged in to regenerate the AI summary</p>
        </div>
      );
      return;
    }
    setBusy(true);
    const { isSuccess, error } = await regenerateDiscussionSummary(page);
    setBusy(false);
    if (isSuccess) {
      await refetch();
      toast.success(
        <div>
          <h3>Done</h3>
          <p>AI summary regenerated</p>
        </div>
      );
    } else {
      toast.error(
        <div>
          <h3>Error!</h3>
          <p>{error || "AI summary temporarily unavailable"}</p>
        </div>
      );
    }
  };

  return (
    <Wrapper data-testid="discussion-ai-summary">
      <Header>
        <Heading>
          FOMO AI — Discussion Summary
          {status === "READY" ? (
            <StatusPill tone="READY" data-testid="discussion-summary-status">
              Ready
            </StatusPill>
          ) : status === "STALE" ? (
            <StatusPill tone="STALE" data-testid="discussion-summary-status">
              Stale
            </StatusPill>
          ) : (
            <StatusPill tone="NONE" data-testid="discussion-summary-status">
              Not generated
            </StatusPill>
          )}
        </Heading>
        <RegenButton
          onClick={onRegenerate}
          disabled={busy}
          data-testid="discussion-summary-regenerate"
        >
          {busy
            ? "Generating…"
            : status === "NONE"
            ? "Generate summary"
            : "Regenerate"}
        </RegenButton>
      </Header>

      {summary && summary.overview ? (
        <>
          <Overview data-testid="discussion-summary-overview">
            {summary.overview}
          </Overview>
          {summary.keyTakeaways && summary.keyTakeaways.length > 0 ? (
            <Takeaways data-testid="discussion-summary-takeaways">
              {summary.keyTakeaways.map((t, i) => (
                <li key={i}>{t}</li>
              ))}
            </Takeaways>
          ) : null}
          {summary.communityPulse ? (
            <Pulse data-testid="discussion-summary-pulse">
              {summary.communityPulse}
            </Pulse>
          ) : null}
          <Foot>
            {status === "STALE"
              ? "New comments were added — regenerate to refresh."
              : "Generated by FOMO AI"}
            {summary.model ? ` · ${summary.model}` : ""}
          </Foot>
        </>
      ) : (
        <Empty>
          No AI summary yet. Generate one to condense the discussion into key
          takeaways.
        </Empty>
      )}
    </Wrapper>
  );
};

export default DiscussionSummary;
