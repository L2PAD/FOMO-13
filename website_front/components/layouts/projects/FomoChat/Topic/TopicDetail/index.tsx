import React, { FC, useMemo, useState } from "react";
import {
  ArrowLeft,
  ChevronDown,
  InfoIcon,
  MessageCircle,
  RefreshCw,
  ThumbsUp,
  Zap,
  Sparkles,
} from "lucide-react";
import { useQueryClient } from "react-query";
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
  TopContributors,
  ContributorInfo,
  ContributorName,
  ContributorStats,
  SentimentSegmentSeparator,
} from "./styles";
import ExpandedTopic from "../ExpandedTopic";
import {
  IComment,
  ITopicContributor,
  ITopicInsights,
} from "../../../../../../types/global_types";
import {
  ContributorItem,
  ContributorUsername,
  SectionTitle,
  SeeMoreButton,
  StatItem,
  StatText,
} from "../HighlightSection/styles";
import UserAvatar from "../../../../../global/common/UserAvatar";
import { Button } from "../../../../../global/common/Button";
import { useTopicDetailQuery, topicCommentsQueryKeys } from "../../../../../../hooks/useTopicComments";
import regenerateTopicSummary from "../../../../../../http/comments/regenerateTopicSummary";
import { isStaffRole } from "../../../../../../helpers/getUserRole";

interface IProps {
  topicId: string;
  initialItem?: IComment | null;
  onBack: () => void;
  confirmAddReply: (text: string, id: string) => Promise<void>;
  addReaction: (id: string, action: "like" | "dislike") => Promise<void>;
}

const emptyInsights: ITopicInsights = {
  overview: "",
  takeaways: [],
  pulse: [],
  sentiment: {
    score: 0,
    label: "Mixed",
    positive: 0,
    neutral: 0,
    negative: 0,
  },
  contributors: [],
  updatedAt: "",
};

const TopicDetail: FC<IProps> = ({
  topicId,
  initialItem,
  onBack,
  confirmAddReply,
  addReaction,
}) => {
  const queryClient = useQueryClient();
  const { data } = useTopicDetailQuery(topicId);
  const [isRegenerating, setIsRegenerating] = useState(false);
  const [showFullOverview, setShowFullOverview] = useState(false);
  const [showAllTakeaways, setShowAllTakeaways] = useState(false);
  const [showFullPulse, setShowFullPulse] = useState(false);
  const isStaff = useMemo(() => isStaffRole(), []);
  const aiParticipating = Boolean((data as any)?.aiParticipating);

  const currentTopic = data?.topic || initialItem || null;
  const insights = data?.insights || emptyInsights;

  const allTakeaways = useMemo(
    () =>
      insights.takeaways.map((text, index) => ({
        id: `takeaway-${index}`,
        text,
      })),
    [insights.takeaways]
  );

  const pulseDescriptions = useMemo(
    () =>
      insights.pulse.map((text, index) => ({
        id: `pulse-${index}`,
        text,
      })),
    [insights.pulse]
  );

  const handleRegenerate = async () => {
    if (!topicId || isRegenerating) return;

    try {
      setIsRegenerating(true);
      const result = await regenerateTopicSummary(topicId);

      if (result.isSuccess && result.insights) {
        queryClient.setQueryData(
          topicCommentsQueryKeys.detail(topicId),
          (previous: any) =>
            previous
              ? {
                  ...previous,
                  insights: result.insights,
                }
              : previous
        );
      }
    } finally {
      setIsRegenerating(false);
    }
  };

  if (!currentTopic) {
    return null;
  }

  const contributors: ITopicContributor[] = insights.contributors || [];
  const overviewText = insights.overview || currentTopic.text || "";

  return (
    <TopicDetailWrapper>
      <TopicHeader>
        <BackButton onClick={onBack}>
          <ArrowLeft size={20} />
        </BackButton>
        {aiParticipating && (
          <div
            data-testid="ai-participating-indicator"
            style={{
              marginLeft: "auto",
              display: "inline-flex",
              alignItems: "center",
              gap: 6,
              height: 32,
              padding: "0 14px",
              borderRadius: 8,
              border: "1px solid #cdeee6",
              background: "#f2fbf8",
              color: "#04a584",
              fontSize: 12.5,
              fontWeight: 700,
            }}
          >
            <Sparkles size={14} /> FOMO AI participates in this discussion
          </div>
        )}
      </TopicHeader>

      <TopicContent>
        <LeftColumn>
          <ExpandedTopic
            item={currentTopic}
            confirmAddReply={confirmAddReply}
            addReaction={addReaction}
            replyDraft={""}
          />
        </LeftColumn>

        <RightColumn>
          <div className="section">
            <SectionTitle>
              <h2>
                AI Summary{" "}
                <button
                  className="tooltip-button"
                  style={{ paddingLeft: "8px" }}
                >
                  <InfoIcon width={16} color="#738094" />
                  <span className="tooltip-text">
                    Auto-summarized key insights, trends, and sentiment from
                    each discussion.
                    <br />
                    It updates dynamically every 10вЂ“15 minutes (or sooner when
                    new arguments appear).
                    <br />
                    You can think of it as a real-time digest powered by
                    community activity and engagement signals.
                  </span>
                </button>
              </h2>
              {isStaff && (
                <button
                  onClick={handleRegenerate}
                  className={isRegenerating ? "rotating" : ""}
                  disabled={isRegenerating}
                  data-testid="ai-summary-refresh"
                  title="Regenerate AI summary (staff only)"
                >
                  <RefreshCw size={16} />
                </button>
              )}
            </SectionTitle>
          </div>
          <PostOverview>
            <h4>Post overview</h4>
            <p className={showFullOverview ? "expanded" : "collapsed"}>
              {showFullOverview
                ? overviewText
                : overviewText.length > 200
                  ? overviewText.slice(0, 200) + "..."
                  : overviewText}
            </p>
            {overviewText.length > 200 && (
              <SeeMoreButton
                onClick={() => setShowFullOverview(!showFullOverview)}
              >
                {showFullOverview ? "See Less" : "See More"}
                <ChevronDown
                  width={20}
                  style={{
                    transform: showFullOverview
                      ? "rotate(180deg)"
                      : "rotate(0deg)",
                    transition: "transform 0.2s ease",
                  }}
                />
              </SeeMoreButton>
            )}
          </PostOverview>

          <KeyTakeaways>
            <h4>Key takeaways</h4>
            {(showAllTakeaways ? allTakeaways : allTakeaways.slice(0, 4)).map(
              (takeaway) => (
                <TakeawayItem key={takeaway.id}>
                  <span>Key</span>
                  <p>{takeaway.text}</p>
                </TakeawayItem>
              )
            )}
            {allTakeaways.length > 4 && (
              <SeeMoreButton
                onClick={() => setShowAllTakeaways(!showAllTakeaways)}
              >
                {showAllTakeaways ? "See Less" : "See More"}
                <ChevronDown
                  width={20}
                  style={{
                    transform: showAllTakeaways
                      ? "rotate(180deg)"
                      : "rotate(0deg)",
                    transition: "transform 0.2s ease",
                  }}
                />
              </SeeMoreButton>
            )}
          </KeyTakeaways>
          <CommunityPulse>
            <h4>Community pulse</h4>
            <div className="pulse-header">
              <div className="sentiment-label">
                <span className="label">Sentiment</span>
                <button
                  className="tooltip-button"
                  style={{
                    paddingLeft: "8px",
                  }}
                >
                  <InfoIcon width={12} height={12} color="#738094" />
                  <span className="tooltip-text">
                    Auto-summarized key insights, trends, and sentiment from
                    each discussion.
                    <br />
                    It updates dynamically every 10вЂ“15 minutes (or sooner when
                    new arguments appear).
                    <br />
                    You can think of it as a real-time digest powered by
                    community activity and engagement signals.
                  </span>
                </button>
              </div>
              <span className="percentage">{insights.sentiment.score}%</span>
            </div>
            <SentimentBar>
              <SentimentSegment
                color="#FF5858"
                width={`${insights.sentiment.negative}%`}
              />
              <SentimentSegmentSeparator />
              <SentimentSegment
                color="#FFA500"
                width={`${insights.sentiment.neutral}%`}
              />
              <SentimentSegmentSeparator />
              <SentimentSegment
                color="#04A584"
                width={`${insights.sentiment.positive}%`}
              />
            </SentimentBar>
            {(showFullPulse
              ? pulseDescriptions
              : pulseDescriptions.slice(0, 2)
            ).map((desc) => (
              <p key={desc.id} className="pulse-description">
                {desc.text}
              </p>
            ))}
            {pulseDescriptions.length > 2 && (
              <SeeMoreButton onClick={() => setShowFullPulse(!showFullPulse)}>
                {showFullPulse ? "See Less" : "See More"}
                <ChevronDown
                  width={20}
                  style={{
                    transform: showFullPulse
                      ? "rotate(180deg)"
                      : "rotate(0deg)",
                    transition: "transform 0.2s ease",
                  }}
                />
              </SeeMoreButton>
            )}
          </CommunityPulse>

          <TopContributors>
            <h4>Top Contributors</h4>
            {contributors.slice(0, 3).map((contributor) => (
              <ContributorItem key={contributor.username}>
                <div className="info">
                  <UserAvatar
                    avatar={contributor.avatar}
                    size={"otc"}
                    rating={95}
                    variant="success"
                    name={contributor.name}
                  />
                  <ContributorInfo>
                    <div>
                      <ContributorName>{contributor.name}</ContributorName>
                    </div>
                    <ContributorUsername>
                      {contributor.username}
                    </ContributorUsername>
                  </ContributorInfo>
                  <div className="xp-badge">
                    <p>{contributor.badge}</p>
                    <p>{contributor.xp} XP</p>
                  </div>
                </div>
                <ContributorStats>
                  <StatItem>
                    <ThumbsUp size={12} color="#04A584" />
                    <StatText>{contributor.upvotes} upvotes</StatText>
                  </StatItem>
                  <StatItem>
                    <MessageCircle size={12} color="#04A584" />
                    <StatText>{contributor.comments} comments</StatText>
                  </StatItem>
                  <StatItem>
                    <Zap size={12} color="#04A584" />
                    <StatText>{contributor.engagement} Engagement</StatText>
                  </StatItem>
                </ContributorStats>
              </ContributorItem>
            ))}
            <p className="data-info">
              Data auto-generated based on the last 48 hours of thread activity.
            </p>
          </TopContributors>
        </RightColumn>
      </TopicContent>
    </TopicDetailWrapper>
  );
};

export default TopicDetail;
