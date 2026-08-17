import React, { FC, useMemo } from "react";
import moment from "moment";
import { useRouter } from "next/router";
import { useQuery } from "react-query";
import { TrendingUp } from "lucide-react";
import {
  fetchPublicDigests,
  DIGEST_PERIOD_LABEL,
} from "../../../../../http/calendar/publicDigests";
import { DigestBadge } from "../Calendar/styles";
import {
  DigestsSection,
  DigestsHead,
  DigestsTitle,
  DigestsGrid,
  DCard,
  DCover,
  DBody,
  DMeta,
  DTitle,
  DSummary,
  DReadMore,
} from "./styles";

/**
 * Market Digests — editorial market-outlook reviews (weekly routine + quarterly /
 * half-year / annual specials). Authored & fully configured from the CRM
 * (Content → Calendar → Дайджесты). Rendered at the bottom of the Buzz News tab.
 * Clicking a card opens a full internal digest article page (not a modal).
 */
const MarketDigests: FC = () => {
  const router = useRouter();
  const section = useMemo(() => {
    const seg = (router?.asPath || "/crypto").split("?")[0].split("/").filter(Boolean)[0];
    return seg || "crypto";
  }, [router?.asPath]);

  const { data: digests = [] } = useQuery(
    ["buzz-market-digests"],
    () => fetchPublicDigests({ limit: 12 }),
    { staleTime: 60_000 }
  );

  if (!digests.length) return null;

  return (
    <DigestsSection data-testid="market-digests">
      <DigestsHead>
        <DigestsTitle>
          <TrendingUp size={18} color="#04a584" /> Market Digests
        </DigestsTitle>
        <span className="sub">FOMO market outlook — weekly, quarterly & annual reviews</span>
      </DigestsHead>
      <DigestsGrid>
        {digests.map((d) => (
          <DCard
            key={d.id}
            onClick={() => router.push(`/${section}/digest/${d.id}`)}
            data-testid="digest-card"
          >
            <DCover src={d.coverImage} />
            <DBody>
              <DMeta>
                <DigestBadge outlook={d.outlook}>{d.outlook || "NEUTRAL"}</DigestBadge>
                <span>{DIGEST_PERIOD_LABEL[d.period] || d.period}</span>
                {d.publishedAt ? <span>· {moment(d.publishedAt).format("MMM D")}</span> : null}
              </DMeta>
              <DTitle>{d.title}</DTitle>
              {d.summary ? <DSummary>{d.summary}</DSummary> : null}
              <DReadMore>Read digest →</DReadMore>
            </DBody>
          </DCard>
        ))}
      </DigestsGrid>
    </DigestsSection>
  );
};

export default MarketDigests;
