/* eslint-disable */
import React, { useMemo, useState, useEffect, useCallback } from "react";
import { useRouter } from "next/router";
import { useQuery } from "react-query";
import moment from "moment";
import {
  ArrowLeft,
  InfoIcon,
  ThumbsUp,
  ThumbsDown,
  Share2,
  Repeat2,
  TrendingUp,
} from "lucide-react";
import {
  fetchPublicDigest,
  fetchPublicDigests,
  toggleDigestReaction,
  isDigestViewerAuthed,
  IPublicDigest,
  DIGEST_PERIOD_LABEL,
} from "../../../../../http/calendar/publicDigests";
import { sanitizedHtml } from "../../../../../helpers/sanitizeHtml";
import { PageWrapper } from "../../CryptoMarket/styles";
import {
  TopicDetailWrapper,
  TopicHeader,
  BackButton,
  TopicContent,
  LeftColumn,
  RightColumn,
  PostOverview,
  KeyTakeaways,
  TakeawayItem,
  CommunityPulse,
  SentimentBar,
  SentimentSegment,
  SentimentSegmentSeparator,
} from "../../FomoChat/Topic/TopicDetail/styles";
import { SectionTitle } from "../../FomoChat/Topic/HighlightSection/styles";
import LogoAdmin from "../../../../../assets/images/favicon-32x32.svg";
import {
  ArticleTitle,
  AuthorRow,
  AuthorAvatar,
  AuthorMeta,
  AuthorName,
  AuthorHandle,
  ArticleDate,
  Lead,
  ArticleCover,
  ArticleBody,
  ReactionsBar,
  ReactionBtn,
  DigestsGrid,
  DCard,
  DCover,
  DBody,
  DMeta,
  DTitle,
  DSummary,
  DReadMore,
} from "../Digests/styles";
import { DigestBadge } from "../Calendar/styles";

// map editorial outlook -> a sentiment-like distribution for the sidebar bar
const OUTLOOK_SENTIMENT: Record<string, { score: number; neg: number; neu: number; pos: number; label: string }> = {
  BULLISH: { score: 82, neg: 8, neu: 18, pos: 74, label: "Bullish" },
  BEARISH: { score: 24, neg: 70, neu: 18, pos: 12, label: "Bearish" },
  NEUTRAL: { score: 52, neg: 22, neu: 52, pos: 26, label: "Neutral" },
  MIXED: { score: 50, neg: 34, neu: 30, pos: 36, label: "Mixed" },
};

/**
 * Full internal digest article page — mirrors the rich Buzz Feed TopicDetail
 * layout (two columns): a real editorial article on the left and an
 * AI-summary-style sidebar (overview / key takeaways / market outlook) on the right.
 */
const DigestItemPage = () => {
  const router = useRouter();
  const id = router.query.id as string;
  const [liked, setLiked] = useState(false);
  const [reposted, setReposted] = useState(false);
  const [likesCount, setLikesCount] = useState(0);
  const [repostsCount, setRepostsCount] = useState(0);
  const [reactionBusy, setReactionBusy] = useState(false);
  const [authHint, setAuthHint] = useState(false);

  const section = useMemo(() => {
    const seg = (router?.asPath || "/crypto").split("?")[0].split("/").filter(Boolean)[0];
    return seg || "crypto";
  }, [router?.asPath]);

  const { data: digest } = useQuery(["digest-item", id], () => fetchPublicDigest(id), {
    enabled: !!id,
  });
  const { data: others = [] } = useQuery(
    ["digest-recommendations"],
    () => fetchPublicDigests({ limit: 6 }),
    { staleTime: 60_000 }
  );

  const recommendations = (others || []).filter((d) => d.id !== id).slice(0, 3);

  useEffect(() => {
    if (!digest) return;
    setLikesCount(digest.likesCount || 0);
    setRepostsCount(digest.repostsCount || 0);
    setLiked(Boolean(digest.liked));
    setReposted(Boolean(digest.reposted));
  }, [digest]);

  const react = useCallback(
    async (kind: "like" | "repost") => {
      if (reactionBusy) return;
      if (!isDigestViewerAuthed()) {
        setAuthHint(true);
        return;
      }
      setReactionBusy(true);
      const res = await toggleDigestReaction(id, kind);
      setReactionBusy(false);
      if (!res) {
        setAuthHint(true);
        return;
      }
      setLikesCount(res.likesCount);
      setRepostsCount(res.repostsCount);
      setLiked(res.liked);
      setReposted(res.reposted);
    },
    [id, reactionBusy]
  );

  if (!digest) {
    return (
      <PageWrapper>
        <TopicDetailWrapper>
          <ArticleTitle>Loading digest…</ArticleTitle>
        </TopicDetailWrapper>
      </PageWrapper>
    );
  }

  const sentiment = OUTLOOK_SENTIMENT[digest.outlook || "NEUTRAL"] || OUTLOOK_SENTIMENT.NEUTRAL;
  const takeaways = digest.keyTakeaways || [];
  const periodLabel = DIGEST_PERIOD_LABEL[digest.period] || digest.period;

  return (
    <PageWrapper>
      <TopicDetailWrapper>
        <TopicHeader>
          <BackButton onClick={() => router.back()}>
            <ArrowLeft size={20} /> Back
          </BackButton>
        </TopicHeader>

        <TopicContent>
          {/* ── article ── */}
          <LeftColumn>
            <ArticleTitle>{digest.title}</ArticleTitle>
            <AuthorRow>
              <AuthorAvatar>
                <img src={(LogoAdmin as any).src || (LogoAdmin as any)} alt="FOMO" />
              </AuthorAvatar>
              <AuthorMeta>
                <AuthorName>
                  FOMO Research <DigestBadge outlook={digest.outlook}>{sentiment.label}</DigestBadge>
                </AuthorName>
                <AuthorHandle>@fomo · {periodLabel} market digest</AuthorHandle>
              </AuthorMeta>
              <ArticleDate>
                {moment(digest.publishedAt || digest.updatedAt).format("MMMM Do YYYY, h:mm a")}
              </ArticleDate>
            </AuthorRow>

            {digest.summary ? <Lead>{digest.summary}</Lead> : null}
            <ArticleCover src={digest.coverImage} />
            <ArticleBody dangerouslySetInnerHTML={sanitizedHtml(digest.bodyHtml || "")} />

            <ReactionsBar>
              <ReactionBtn
                className={liked ? "active" : ""}
                onClick={() => react("like")}
                disabled={reactionBusy}
                data-testid="digest-like-btn"
              >
                <ThumbsUp size={15} /> Like{likesCount > 0 ? ` · ${likesCount}` : ""}
              </ReactionBtn>
              <ReactionBtn
                className={reposted ? "active" : ""}
                onClick={() => react("repost")}
                disabled={reactionBusy}
                data-testid="digest-repost-btn"
              >
                <Repeat2 size={15} /> Repost{repostsCount > 0 ? ` · ${repostsCount}` : ""}
              </ReactionBtn>
              <ReactionBtn onClick={() => { try { navigator.share?.({ url: window.location.href, title: digest.title }); } catch {} }}>
                <Share2 size={15} /> Share
              </ReactionBtn>
            </ReactionsBar>
            {authHint ? (
              <div data-testid="digest-auth-hint" style={{ marginTop: 8, fontSize: 13, color: "#98a2b3" }}>
                Sign in to like and repost this digest.
              </div>
            ) : null}
          </LeftColumn>

          {/* ── sidebar ── */}
          <RightColumn>
            <div className="section">
              <SectionTitle>
                <h2>
                  Digest overview{" "}
                  <button className="tooltip-button" style={{ paddingLeft: "8px" }}>
                    <InfoIcon width={16} color="#738094" />
                    <span className="tooltip-text">
                      Editorial market outlook prepared by FOMO Research for the selected period.
                    </span>
                  </button>
                </h2>
              </SectionTitle>
            </div>

            <PostOverview>
              <h4>Overview</h4>
              <p className="expanded">{digest.summary || "—"}</p>
            </PostOverview>

            {takeaways.length ? (
              <KeyTakeaways>
                <h4>Key takeaways</h4>
                {takeaways.map((t, i) => (
                  <TakeawayItem key={i}>
                    <span>Key</span>
                    <p>{t}</p>
                  </TakeawayItem>
                ))}
              </KeyTakeaways>
            ) : null}

            <CommunityPulse>
              <h4>Market outlook</h4>
              <div className="pulse-header">
                <div className="sentiment-label">
                  <span className="label">Sentiment</span>
                </div>
                <span className="percentage">{sentiment.score}%</span>
              </div>
              <SentimentBar>
                <SentimentSegment color="#FF5858" width={`${sentiment.neg}%`} />
                <SentimentSegmentSeparator />
                <SentimentSegment color="#FFA500" width={`${sentiment.neu}%`} />
                <SentimentSegmentSeparator />
                <SentimentSegment color="#04A584" width={`${sentiment.pos}%`} />
              </SentimentBar>
              <p className="pulse-description">
                FOMO Research view for this {periodLabel.toLowerCase()} period: <strong>{sentiment.label}</strong>.
              </p>
            </CommunityPulse>
          </RightColumn>
        </TopicContent>

        {recommendations.length ? (
          <div style={{ marginTop: 40 }}>
            <SectionTitle>
              <h2>More Market Digests</h2>
            </SectionTitle>
            <div style={{ marginTop: 16 }}>
              <DigestsGrid>
                {recommendations.map((d: IPublicDigest) => (
                  <DCard
                    key={d.id}
                    onClick={() => router.push(`/${section}/digest/${d.id}`)}
                    data-testid="digest-reco-card"
                  >
                    <DCover src={d.coverImage} />
                    <DBody>
                      <DMeta>
                        <DigestBadge outlook={d.outlook}>{d.outlook || "NEUTRAL"}</DigestBadge>
                        <span>{DIGEST_PERIOD_LABEL[d.period] || d.period}</span>
                      </DMeta>
                      <DTitle>{d.title}</DTitle>
                      {d.summary ? <DSummary>{d.summary}</DSummary> : null}
                      <DReadMore>Read digest →</DReadMore>
                    </DBody>
                  </DCard>
                ))}
              </DigestsGrid>
            </div>
          </div>
        ) : null}
      </TopicDetailWrapper>
    </PageWrapper>
  );
};

export default DigestItemPage;
