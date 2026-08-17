import React, { useState } from "react";
import { useRouter } from "next/router";
import styled from "styled-components";
import {
  EntityHeader,
  ActivityOverview,
  AudienceSnapshot,
  EngagementTimeline,
  AISummary,
  ProductOverview,
  RelatedAccounts,
  FollowersGrowthChart,
} from "./components";
import { Row } from "./styles";
import CommentBlock from "../../../global/CommentBlock";
import Tabs from "../../../global/Tabs";
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

interface TikTokEntityOverviewProps {
  entityId?: string;
  network?: string;
}

const TikTokEntityOverview: React.FC<TikTokEntityOverviewProps> = ({
  entityId,
  network,
}) => {
  const [activeChart, setActiveChart] = React.useState("Engagement Timeline");
  const [isCompareModalOpen, setIsCompareModalOpen] = useState(false);
  const router = useRouter();

  // Mock entity data
  const entityData = {
    name: "FOMO",
    username: "@fomo.cx",
    avatar: "/static/projects/avatar1.jpg",
    description: "Dive into the all-in-one cryptouniverse",
    followers: 184617,
    followersChange: "+210 last 30D",
    engagementRate: "8.4%",
    engagementSub: "High vs similar",
    avgViewsVideo: "42.7k",
    activity: "medium" as "medium" | "high" | "low",
    activitySub: "Views, comments & shares",
    tiktokScore: 94,
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
      label: "For You traffic",
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

  const relatedAccountsData = [
    {
      id: "1",
      name: "L2 Liquidity Maps",
      avatar: "/static/projects/avatar1.jpg",
      activity: "high" as const,
    },
    {
      id: "2",
      name: "Anthony Gale",
      avatar: "/static/projects/avatar2.jpg",
      activity: "high" as const,
    },
    {
      id: "3",
      name: "Rotations Radar",
      avatar: "/static/projects/avatar3.jpg",
      activity: "high" as const,
    },
  ];

  const handleViewOnTikTok = () => {
    window.open("https://tiktok.com/@fomohub", "_blank");
  };

  const handleCompare = () => {
    setIsCompareModalOpen(true);
  };

  const handleChannelClick = (channelId: string) => {
    router.push(`/utility/influence/tiktok/${channelId}`);
  };

  return (
    <PageWrapper>
      <PageHeader>
        <PageTitle>Overview • TikTok Account</PageTitle>
      </PageHeader>

      <ContentGrid>
        <Column>
          <EntityHeader
            name={entityData.name}
            username={entityData.username}
            avatar={entityData.avatar}
            description={entityData.description}
            snapshotUpdated={entityData.createdAt}
            // TikTok-specific stats
            followers={entityData.followers.toLocaleString()}
            followersChange={entityData.followersChange}
            engagementRate={entityData.engagementRate}
            engagementSub={entityData.engagementSub}
            avgViewsVideo={entityData.avgViewsVideo}
            activity={entityData.activity}
            activitySub={entityData.activitySub}
            tiktokScore={entityData.tiktokScore}
            viewButtonLabel="View on TikTok"
            onView={handleViewOnTikTok}
            onCompare={handleCompare}
            // Network identifier
            network="tiktok"
          />
          <Row>
            <ActivityOverview
              postsPerDay={activityData.postsPerDay}
              viewRateStability={activityData.viewRateStability}
              viewRateLevel={activityData.viewRateLevel}
              forwardVolatility={activityData.forwardVolatility}
              forwardLevel={activityData.forwardLevel}
              network="tiktok"
              videos="14"
              avgViewsVideo="42,700"
              avgLikes="4,480"
              avgComments="389"
              avgShares="121"
              mostActive="14:00–16:00 UTC"
            />{" "}
            <AudienceSnapshot
              directFollowers={audienceData.directFollowers}
              crossPostTraffic={audienceData.crossPostTraffic}
              searchHashtags={audienceData.searchHashtags}
              externalShares={audienceData.externalShares}
              network="tiktok"
            />
          </Row>
          <CardTitle>Engagement Timeline</CardTitle>
          <ChartSection>
            <TabsWrapper>
              <Tabs
                items={["Engagement Timeline", "Followers Growth Chart"]}
                activeItem={activeChart}
                onClick={setActiveChart}
                className="project-page"
              />
            </TabsWrapper>
            {activeChart === "Engagement Timeline" ? (
              <EngagementTimeline />
            ) : (
              <FollowersGrowthChart />
            )}
          </ChartSection>
        </Column>
        <Column>
          <AISummary network="tiktok" entityName={entityData.name} />
          <ProductOverview />
          <RelatedAccounts
            accounts={relatedAccountsData}
            onAccountClick={handleChannelClick}
            network="tiktok"
          />
        </Column>
      </ContentGrid>
      <CommentBlock />
      <CompareModal
        isOpen={isCompareModalOpen}
        onClose={() => setIsCompareModalOpen(false)}
        baseEntity={{
          name: entityData.name,
          username: entityData.username,
          avatar: entityData.avatar,
          followers: entityData.followers.toString(),
          followersChange: entityData.followersChange,
          engagementRate: entityData.engagementRate,
          avgViewsVideo: entityData.avgViewsVideo,
          activity: entityData.activity,
          tiktokScore: entityData.tiktokScore,
        }}
        baseActivity={{
          ...activityData,
          videos: "14",
          avgViewsVideo: "42,700",
          avgLikes: "4,480",
          avgComments: "389",
          avgShares: "121",
          mostActive: "14:00–16:00 UTC",
        }}
        baseAudience={{} as any}
        network="tiktok"
      />
    </PageWrapper>
  );
};

export default TikTokEntityOverview;
