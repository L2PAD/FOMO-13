import React, { useMemo } from "react";
import {
  HighlightWrapper,
  SectionTitle,
  TopicsList,
  TopicItem,
  TopicName,
  TopicStats,
  ContributorItem,
  ContributorInfo,
  ContributorName,
  ContributorUsername,
  ContributorStats,
  StatItem,
  StatText,
  SeeMoreButton,
  TodayStatRow,
  TodayStatLabel,
  TodayStatValue,
} from "./styles";
import { ChevronDown, MessageCircle, ThumbsUp, Zap } from "lucide-react";
import InfoIcon from "../../../../../global/Icons/InfoIcon";
import UserAvatar from "../../../../../global/common/UserAvatar";
import CreateTopicModal from "../../../modals/CreateTopicModal";
import { IComment } from "../../../../../../types/global_types";
import Placeholder from "../../../../../global/common/Placeholder";
import Link from "next/link";
import { useQuery } from "react-query";
import { fetchTopContributors } from "../../../../../../http/comments/topContributors";

interface Props {
  addTopic?: (
    text: string,
    isTopic?: boolean,
    topicName?: string
  ) => Promise<void>;
  topics?: IComment[];
  totalTopics?: number;
  isLoading?: boolean;
}

type HighlightTopicItem = {
  id: string;
  name: string;
  posts: number;
  comments: number;
  hot: boolean;
};

type HighlightContributor = {
  id: string;
  name: string;
  username: string;
  avatar: string;
  badge: string;
  xp: number;
  upvotes: number;
  comments: number;
  engagement: string;
};

type TodayStat = {
  label: string;
  value: string;
  highlight?: boolean;
  additional?: string;
};

const BADGES = [
  "Astral Sage",
  "Cosmic Explorer",
  "Stellar Awakening",
  "Galactic Voyager",
  "Nebula Navigator",
];

const isSameDay = (left: Date, right: Date) =>
  left.getFullYear() === right.getFullYear() &&
  left.getMonth() === right.getMonth() &&
  left.getDate() === right.getDate();

const formatUsername = (value?: string, fallback: string = "user") => {
  const raw = String(value || fallback).trim().replace(/^@/, "");
  return `@${raw || fallback}`;
};

const buildTopics = (items: IComment[]): HighlightTopicItem[] => {
  const mapped = items
    .map((item, index) => ({
      id: item._id || `topic-${index}`,
      name: item.topicName || item.text || "Untitled topic",
      posts: 1,
      comments: Number(item.replyCount || 0),
      score:
        Number(item.replyCount || 0) * 3 +
        Number(item.likes?.length || 0) * 2 +
        Number((item as any).viewsCount || 0) * 0.01,
    }))
    .filter((item) => item.name.trim());

  // Hottest first; flag the top-3 most-discussed as "hot" (must have activity).
  const sorted = [...mapped].sort((a, b) => b.score - a.score);
  const hotIds = new Set(
    sorted.filter((t) => t.comments > 0 || t.score > 0).slice(0, 3).map((t) => t.id)
  );
  return sorted.map(({ score, ...t }) => ({ ...t, hot: hotIds.has(t.id) }));
};

const buildContributors = (items: IComment[]): HighlightContributor[] => {
  const contributorMap = new Map<
    string,
    {
      id: string;
      name: string;
      username: string;
      avatar: string;
      upvotes: number;
      comments: number;
      topics: number;
    }
  >();

  items.forEach((item, index) => {
    const author = item.author?.[0];
    const id = String(author?._id || item.authorId || `topic-author-${index}`);
    const current = contributorMap.get(id) || {
      id,
      name: author?.name || author?.username || "User",
      username: formatUsername(author?.username, author?.name || "user"),
      avatar:
        author?.avatar || author?.photo || author?.twitterData?.photo || "",
      upvotes: 0,
      comments: 0,
      topics: 0,
    };

    current.upvotes += item.likes?.length || 0;
    current.comments += Number(item.replyCount || 0);
    current.topics += 1;
    contributorMap.set(id, current);
  });

  return Array.from(contributorMap.values())
    .sort((left, right) => {
      const rightScore = right.upvotes * 2 + right.comments + right.topics;
      const leftScore = left.upvotes * 2 + left.comments + left.topics;
      return rightScore - leftScore;
    })
    .map((contributor, index) => {
      const engagementValue =
        (contributor.upvotes + contributor.comments + contributor.topics) /
        Math.max(1, contributor.topics);

      return {
        ...contributor,
        badge: BADGES[index] || BADGES[BADGES.length - 1],
        xp:
          contributor.upvotes * 8 +
          contributor.comments * 4 +
          contributor.topics * 12,
        engagement: `${Math.max(1, Math.round(engagementValue * 10) / 10)}x`,
      };
    });
};

const buildTodayStats = (
  items: IComment[],
  contributors: HighlightContributor[],
  totalTopics: number
): TodayStat[] => {
  const now = new Date();
  const newTopics = items.filter((item) => {
    const date = new Date(item.date);
    return !Number.isNaN(date.getTime()) && isSameDay(date, now);
  }).length;
  const totalReplies = items.reduce(
    (sum, item) => sum + Number(item.replyCount || 0),
    0
  );
  const totalUpvotes = items.reduce(
    (sum, item) => sum + (item.likes?.length || 0),
    0
  );
  const activeUsers = new Set(
    items
      .map((item) => item.author?.[0]?._id || item.authorId)
      .filter(Boolean)
      .map(String)
  ).size;
  const tagFrequency = items.reduce<Record<string, number>>((acc, item) => {
    const key = String(item.categoryKey || item.topicKey || "").trim();
    if (!key) return acc;

    acc[key] = (acc[key] || 0) + 1;
    return acc;
  }, {});
  const topTagEntry = Object.entries(tagFrequency).sort(
    (left, right) => right[1] - left[1]
  )[0];
  const topContributor = contributors[0];
  const secondContributor = contributors[1];

  return [
    { label: "New Topics", value: String(newTopics) },
    { label: "Total Topics", value: String(totalTopics || items.length) },
    { label: "Comments Posted", value: String(totalReplies) },
    { label: "Upvotes Given", value: String(totalUpvotes) },
    { label: "Active Users", value: String(activeUsers) },
    {
      label: "Most Active Tag",
      value: topTagEntry ? topTagEntry[0] : "N/A",
    },
    {
      label: "Top Contributor",
      value: topContributor?.username || "N/A",
      highlight: Boolean(topContributor),
      additional: topContributor ? `(+${topContributor.xp} XP)` : undefined,
    },
    {
      label: "Second Top Contributor",
      value: secondContributor?.username || "N/A",
    },
  ];
};

const renderSectionSkeleton = (rows: number) =>
  Array.from({ length: rows }).map((_, index) => (
    <div key={`highlight-skeleton-${index}`}>
      <Placeholder
        width="68%"
        height="20px"
        borderRadius="8px"
        marginBottom="10px"
      />
      <Placeholder
        width="42%"
        height="14px"
        borderRadius="8px"
        marginBottom="0"
      />
    </div>
  ));

const HighlightSection = ({
  addTopic: onAddTopic,
  topics = [],
  totalTopics = 0,
  isLoading = false,
}: Props) => {
  const [showAllTopics, setShowAllTopics] = React.useState(false);
  const [showAllContributors, setShowAllContributors] = React.useState(false);
  const [showAllStats, setShowAllStats] = React.useState(false);
  const [isCreateTopicModalOpen, setIsCreateTopicModalOpen] =
    React.useState(false);

  const topicItems = useMemo(() => buildTopics(topics), [topics]);
  const localContributors = useMemo(() => buildContributors(topics), [topics]);
  const [contribPeriod, setContribPeriod] = React.useState<"7d" | "30d" | "all">("30d");
  const { data: globalContributors } = useQuery(
    ["top-contributors", contribPeriod],
    () => fetchTopContributors(contribPeriod),
    { refetchOnWindowFocus: false, staleTime: 60_000 }
  );
  const contributors = useMemo(() => {
    if (globalContributors && globalContributors.length) {
      return globalContributors.map((c) => ({
        id: c.id,
        name: c.name,
        username: c.username?.startsWith("@") ? c.username : `@${c.username}`,
        avatar: c.avatar,
        badge: "",
        xp: Math.round(c.score),
        upvotes: Math.round(c.influence),
        comments: c.usefulComments,
        engagement: c.topics,
      }));
    }
    return localContributors;
  }, [globalContributors, localContributors]);
  const todayStats = useMemo(
    () => buildTodayStats(topics, contributors, totalTopics),
    [topics, contributors, totalTopics]
  );

  const addTopic = async (
    text: string,
    isTopic?: boolean,
    topicName?: string
  ) => {
    if (!onAddTopic) return;
    await onAddTopic(text, isTopic, topicName);
  };

  return (
    <HighlightWrapper>
      <div className="section">
        <SectionTitle>
          <h2>
            Topics{" "}
            <button
              className="tooltip-button"
              style={{
                paddingLeft: "8px",
              }}
            >
              <InfoIcon />
              <span className="tooltip-text">
                Browse through live topics from the current backend topic feed.
                <br />
                Only users with 800+ XP can create new topics.
              </span>
            </button>
          </h2>
        </SectionTitle>
        <TopicsList>
          {isLoading
            ? renderSectionSkeleton(4)
            : (showAllTopics ? topicItems : topicItems.slice(0, 10)).map(
              (topic) => (
                <TopicItem key={topic.id}>
                  <TopicName>
                    {topic.hot ? (
                      <span
                        data-testid={`topic-hot-${topic.id}`}
                        style={{
                          display: "inline-flex",
                          alignItems: "center",
                          gap: 3,
                          marginRight: 8,
                          padding: "2px 7px",
                          borderRadius: 999,
                          fontSize: 11,
                          fontWeight: 800,
                          color: "#e5484d",
                          background: "#fdecec",
                          verticalAlign: "middle",
                        }}
                      >
                        🔥 Hot
                      </span>
                    ) : null}
                    {topic.name}
                  </TopicName>
                  <TopicStats>
                    <p>{topic.posts} post</p>
                    <p>{topic.comments.toLocaleString()} comments</p>
                  </TopicStats>
                </TopicItem>
              )
            )}
          {!isLoading && topicItems.length > 10 ? (
            <SeeMoreButton onClick={() => setShowAllTopics(!showAllTopics)}>
              {showAllTopics ? "See Less" : "See More"}{" "}
              <ChevronDown
                width={20}
                style={{
                  transform: showAllTopics ? "rotate(180deg)" : "rotate(0deg)",
                  transition: "transform 0.2s ease",
                }}
              />
            </SeeMoreButton>
          ) : null}
        </TopicsList>
      </div>

      <div className="section">
        <SectionTitle>
          <h2>
            Top Contributors{" "}
            <button
              className="tooltip-button"
              style={{
                paddingLeft: "8px",
              }}
            >
              <InfoIcon />
              <span className="tooltip-text">
                Real contributors are calculated from the currently loaded topic
                threads from backend data.
              </span>
            </button>
          </h2>
          <div style={{ display: "inline-flex", gap: 4, marginLeft: "auto" }} data-testid="contrib-period-toggle">
            {(["7d", "30d", "all"] as const).map((p) => (
              <button
                key={p}
                onClick={() => setContribPeriod(p)}
                data-testid={`contrib-period-${p}`}
                style={{
                  border: "none",
                  cursor: "pointer",
                  padding: "3px 9px",
                  borderRadius: 999,
                  fontSize: 11.5,
                  fontWeight: 700,
                  color: contribPeriod === p ? "#fff" : "#728094",
                  background: contribPeriod === p ? "#04a584" : "#eef2f5",
                }}
              >
                {p === "all" ? "All" : p}
              </button>
            ))}
          </div>
        </SectionTitle>
        <TopicsList>
          {isLoading
            ? renderSectionSkeleton(3)
            : (showAllContributors
              ? contributors
              : contributors.slice(0, 5)
            ).map((contributor) => (
              <ContributorItem key={contributor.id} as={Link} href={`/crypto/fomies/${contributor.id}`} data-testid={`contributor-${contributor.id}`} style={{ textDecoration: "none", cursor: "pointer" }}>
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
          {!isLoading && contributors.length > 5 ? (
            <SeeMoreButton
              onClick={() => setShowAllContributors(!showAllContributors)}
            >
              {showAllContributors ? "See Less" : "See More"}{" "}
              <ChevronDown
                width={20}
                style={{
                  transform: showAllContributors
                    ? "rotate(180deg)"
                    : "rotate(0deg)",
                  transition: "transform 0.2s ease",
                }}
              />
            </SeeMoreButton>
          ) : null}
        </TopicsList>
      </div>

      <div className="section">
        <SectionTitle>
          <h2>
            Today in FOMO Chat{" "}
            <button
              className="tooltip-button"
              style={{
                paddingLeft: "8px",
              }}
            >
              <InfoIcon />
              <span className="tooltip-text">
                These stats are derived from the actual topic payload returned
                by backend for the current query.
              </span>
            </button>
          </h2>
        </SectionTitle>
        <TopicsList>
          {isLoading
            ? renderSectionSkeleton(5)
            : (showAllStats ? todayStats : todayStats.slice(0, 7)).map(
              (stat, index) => (
                <TodayStatRow key={`stat-${stat.label}-${index}`}>
                  <TodayStatLabel>{stat.label}</TodayStatLabel>
                  <div>
                    <TodayStatValue highlight={stat.highlight}>
                      {stat.value}
                    </TodayStatValue>
                    {stat.additional ? (
                      <TodayStatValue> {stat.additional}</TodayStatValue>
                    ) : null}
                  </div>
                </TodayStatRow>
              )
            )}
          {!isLoading && todayStats.length > 7 ? (
            <SeeMoreButton onClick={() => setShowAllStats(!showAllStats)}>
              {showAllStats ? "See Less" : "See More"}{" "}
              <ChevronDown
                width={20}
                style={{
                  transform: showAllStats ? "rotate(180deg)" : "rotate(0deg)",
                  transition: "transform 0.2s ease",
                }}
              />
            </SeeMoreButton>
          ) : null}
        </TopicsList>
      </div>

      {isCreateTopicModalOpen ? (
        <CreateTopicModal
          onClose={() => setIsCreateTopicModalOpen(false)}
          addTopic={addTopic}
        />
      ) : null}
    </HighlightWrapper>
  );
};

export default HighlightSection;
