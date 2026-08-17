import React from "react";
import { useRouter } from "next/router";
import styled from "styled-components";
import {
  EntityHeader,
  StatsGrid,
  ActivityOverview,
  AudienceSnapshot,
  EngagementTimeline,
  RecentPosts,
  AISummary,
  ProductOverview,
  ChannelSnapshot,
  HealthSafety,
  RelatedChannels,
} from "./components";
import { Row } from "./styles";
import CommentBlock from "../../../global/CommentBlock";
import CompareModal from "./CompareModal";

const PageWrapper = styled.div`
  padding: 32px;
  background: #ffffff;
  min-height: 100vh;

  @media (max-width: 600px) {
    padding: 16px;
  }
`;

const PageHeader = styled.div`
  margin-bottom: 40px;

  @media (max-width: 600px) {
    margin-bottom: 20px;
  }
`;

const PageTitle = styled.h1`
  font-size: 32px;
  font-weight: 550;
  color: #070b35;
  margin: 0 0 15px 0;

  @media (max-width: 900px) {
    font-size: 26px;
  }

  @media (max-width: 600px) {
    font-size: 20px;
    margin-bottom: 8px;
  }
`;

const PageSubtitle = styled.p`
  font-size: 16px;

  @media (max-width: 900px) {
    font-size: 14px;
  }
`;

const ContentGrid = styled.div`
  display: flex;
  flex-direction: row;
  gap: 20px;

  & > div:first-child {
    max-width: 70%;
  }
  & > div:last-child {
    max-width: 30%;
  }

  @media (max-width: 1024px) {
    flex-direction: column;
    gap: 12px;

    & > div {
      max-width: 100% !important;
    }
  }
`;

const Column = styled.div`
  display: flex;
  flex-direction: column;
  gap: 20px;
  width: 100%;

  @media (max-width: 600px) {
    gap: 12px;
  }
`;

const ChartSection = styled.div`
  display: flex;
  flex-direction: column;
  gap: 20px;
`;

const CardTitle = styled.h3`
  font-size: 24px;
  font-weight: var(--font-weight-semibold);
  color: #070b35;
  margin: 0;

  @media (max-width: 768px) {
    font-size: 20px;
  }
`;

const TabsWrapper = styled.div`
  .main {
    background: transparent;
    gap: 0;

    button {
      background: transparent;
      border: none;
      border-bottom: 2px solid transparent;
      border-radius: 0;
      padding: 8px 16px;
      font-size: 16px;
      font-weight: var(--font-weight-medium);
      color: #738094;
      cursor: pointer;
      transition: all 0.2s ease;

      &.active {
        color: #05a584;
        border-bottom-color: #05a584;
      }

      &:hover:not(.active) {
        color: #070b35;
      }
    }
  }

  @media (max-width: 600px) {
    overflow-x: auto;
  }
`;

interface TelegramEntityOverviewProps {
  entityId?: string;
  network?: string;
}

const TelegramEntityOverview: React.FC<TelegramEntityOverviewProps> = ({
  entityId,
  network,
}) => {
  const router = useRouter();
  const [isCompareOpen, setIsCompareOpen] = React.useState(false);

  // Mock entity data
  const entityData = {
    name: "FOMO Hub",
    type: "Channel",
    avatar: "/static/projects/avatar1.jpg",
    description:
      "FOMO’s research-driven Discord hub for on-chain analytics, narrative tracking and TGE insights. Structured channels for alerts, dashb...",
    subscriberCount: 18420,
    createdAt: "Snapshot updated 30 min ago",
  };

  const activityData = {
    postsPerDay: "3-5",
    viewRateStability: 85,
    viewRateLevel: "high" as const,
    forwardVolatility: 60,
    forwardLevel: "moderate" as const,
  };

  const audienceData = {
    directFollowers: {
      label: "Direct followers",
      value: "72%",
      change: "+5%",
      positive: true,
    },
    crossPostTraffic: {
      label: "Cross-post traffic",
      value: "18%",
      change: "-2%",
      positive: false,
    },
    searchHashtags: {
      label: "Search & hashtags",
      value: "6%",
      change: "+1%",
      positive: true,
    },
    externalShares: { label: "External shares", value: "4%", change: "Stable" },
  };

  const postsData = [
    {
      id: "1",
      text: "New DeFi platform just launched and it's already drawing massive attention. Users are speculating an upcoming airdrop based on early interactions. Clean interface, responsive UI, and non-custodial features — could become a serious contender in Web3 infrastructure...",
      date: "July 02, 2025  4:12 pm",
      views: "122,2k",
      comments: "164",
      likes: "362",
      images: ["/static/main/dev_portrait.png", "/static/main/core_bg.png"],
    },
    {
      id: "2",
      text: "New DeFi platform just launched and it's already drawing massive attention. Users are speculating an upcoming airdrop based on early interactions. Clean interface, responsive UI, and non-custodial features — could become a serious contender in Web3 infrastructure...",
      date: "July 02, 2025  4:12 pm",
      views: "122,2k",
      comments: "164",
      likes: "362",
      images: ["/static/main/where_next.png", "/static/main/evolution-bg.png"],
    },
    {
      id: "3",
      text: "Alpha alert 🚨 — A stealth airdrop campaign might be in motion. A newly released dApp is letting users interact with cross-chain swaps and gasless transactions. Many signs point toward future rewards for early onchain users. Stay sharp.",
      date: "July 02, 2025  4:12 pm",
      views: "122,2k",
      comments: "164",
      likes: "362",
    },
  ];

  const healthData = {
    spamLevel: "low" as const,
    raidRisk: "medium" as const,
    modCoverage: "high" as const,
  };

  const relatedChannelsData = [
    {
      id: "1",
      name: "L2 Liquidity Maps",
      type: "Channel",
      subscribers: "12.4K",
      activity: "medium" as const,
    },
    {
      id: "2",
      name: "Bridge Risk Monitor",
      type: "Channel",
      subscribers: "8.7K",
      activity: "high" as const,
    },
    {
      id: "3",
      name: "Rotations Radar",
      type: "Group",
      subscribers: "15.2K",
      activity: "high" as const,
    },
  ];

  const handleViewOnTelegram = () => {
    window.open("https://t.me/fomohub", "_blank");
  };

  const handleCompare = () => {
    setIsCompareOpen(true);
  };

  const handleViewAllPosts = () => {
    router.push(`/utility/influence/telegram/${entityId}/posts`);
  };

  const handleChannelClick = (channelId: string) => {
    router.push(`/utility/influence/telegram/${channelId}`);
  };

  const handleViewAllRelated = () => {
    router.push(`/utility/influence/telegram/${entityId}/related`);
  };

  return (
    <PageWrapper>
      <PageHeader>
        <PageTitle>Overview • Telegram Group/Channel</PageTitle>
        <PageSubtitle>
          High-level analytics for a single Telegram channel or group. Metrics
          are based on native Telegram stats and recent activity.
        </PageSubtitle>
      </PageHeader>

      <ContentGrid>
        <Column>
          <EntityHeader
            name={entityData.name}
            type={entityData.type}
            avatar={entityData.avatar}
            description={entityData.description}
            snapshotUpdated={entityData.createdAt}
            subscribers={entityData.subscriberCount.toLocaleString()}
            subscribersChange="+21 last 7D"
            viewsPost="9,300"
            viewRate="View rate 50%"
            messagesDay="3-5"
            messagesSub="Incl. posts & pinned threads"
            activity="high"
            activitySub="Views, replies & forwards"
            onView={handleViewOnTelegram}
            onCompare={handleCompare}
          />
          <Row>
            <ActivityOverview
              postsPerDay={activityData.postsPerDay}
              viewRateStability={activityData.viewRateStability}
              viewRateLevel={activityData.viewRateLevel}
              forwardVolatility={activityData.forwardVolatility}
              forwardLevel={activityData.forwardLevel}
            />{" "}
            <AudienceSnapshot
              directFollowers={audienceData.directFollowers}
              crossPostTraffic={audienceData.crossPostTraffic}
              searchHashtags={audienceData.searchHashtags}
              externalShares={audienceData.externalShares}
            />
          </Row>
          <CardTitle>Engagement Timeline</CardTitle>
          <EngagementTimeline />
          <RecentPosts posts={postsData} onViewAll={handleViewAllPosts} />
        </Column>
        <Column>
          <AISummary />
          <ProductOverview />
          <ChannelSnapshot />
          <HealthSafety
            spamLevel={healthData.spamLevel}
            raidRisk={healthData.raidRisk}
            modCoverage={healthData.modCoverage}
          />
          <RelatedChannels
            channels={relatedChannelsData}
            onChannelClick={handleChannelClick}
            onViewAll={handleViewAllRelated}
          />
        </Column>
      </ContentGrid>
      <CommentBlock />
      <CompareModal
        isOpen={isCompareOpen}
        onClose={() => setIsCompareOpen(false)}
        baseEntity={{
          name: entityData.name,
          username: "@" + entityData.name.toLowerCase().replace(/\s+/g, ""),
          avatar: entityData.avatar,
          type: entityData.type,
          subscribers: entityData.subscriberCount.toLocaleString(),
          subscribersChange: "+21 last 7D",
          viewsPost: "9,300",
          viewRate: "View rate 50%",
          messagesDay: "3-5",
          messagesSub: "Incl. posts & pinned threads",
          activity: "high" as const,
          activitySub: "Views, replies & forwards",
        }}
        baseActivity={{
          postsPerDay: activityData.postsPerDay,
          viewRateStability: activityData.viewRateStability,
          viewRateLevel: activityData.viewRateLevel,
          forwardVolatility: activityData.forwardVolatility,
          forwardLevel: activityData.forwardLevel,
        }}
        baseAudience={{
          directFollowers: audienceData.directFollowers,
          crossPostTraffic: audienceData.crossPostTraffic,
          searchHashtags: audienceData.searchHashtags,
          externalShares: audienceData.externalShares,
        }}
        network="telegram"
      />
    </PageWrapper>
  );
};

export default TelegramEntityOverview;
