import React, { useState } from "react";
import { useRouter } from "next/router";
import styled from "styled-components";
import {
  EntityHeader,
  ActivityOverview,
  AudienceSnapshot,
  EngagementTimeline,
  FollowersGrowthChart,
  RecentPosts,
  AISummary,
  ProductOverview,
  RelatedProfiles,
  InfluentialConnections,
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

interface XEntityOverviewProps {
  entityId?: string;
  network?: string;
}

const XEntityOverview: React.FC<XEntityOverviewProps> = ({
  entityId,
  network,
}) => {
  const router = useRouter();
  const [activeChart, setActiveChart] = useState("Engagement Timeline");
  const [isCompareModalOpen, setCompareModalOpen] = useState(false);

  // Mock entity data
  const entityData = {
    name: "Laurent Ghaul",
    username: "@noname13",
    type: "Account",
    avatar: "/static/projects/avatar1.jpg",
    description:
      "On-chain & market structure analyst. Breaking down liquidity flows, token launches, and smart money rotations across L1/L2 ecosystems...",
    followers: 184200,
    followersChange: "+3.8% 30D",
    following: 612,
    followingLabel: "General interests",
    engagementRate: "4.2%",
    engagementLabel: "Above median for similar size",
    xScore: 923,
    xScoreChange: 12,
    xScoreDescription:
      "Consistent posting, healthy growth, strong engagement...",
    verified: true,
    createdAt: "Snapshot updated 30 min ago",
  };

  const activityData = {
    postsPerDay: "3.1",
    viewRateStability: 80,
    viewRateLevel: "high" as const,
    forwardVolatility: 50,
    forwardLevel: "moderate" as const,
    mostActiveTime: "10:00–13:00 & 18:00–21:00 UTC",
    bestEngagement: "weekdays, US & EU overlap",
  };

  const audienceData = {
    directFollowers: {
      label: "Pro traders/funds",
      value: "~32%",
      percentage: 50,
    },
    crossPostTraffic: {
      label: "Retail/degen",
      value: "~41%",
      percentage: 60,
    },
    searchHashtags: {
      label: "Builders/devs",
      value: "~19%",
      percentage: 30,
    },
    externalShares: {
      label: "External shares",
      value: "4%",
      change: "Stable",
    },
  };

  const interestTags = [
    "On-chain flows",
    "Token launches",
    "DEX liquidity",
    "Fund rotations",
  ];

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
      type: "Account",
      subscribers: "12.4K",
      activity: "medium" as const,
    },
    {
      id: "2",
      name: "Bridge Risk Monitor",
      type: "Account",
      subscribers: "8.7K",
      activity: "high" as const,
    },
    {
      id: "3",
      name: "Rotations Radar",
      type: "Account",
      subscribers: "15.2K",
      activity: "high" as const,
    },
  ];

  const relatedProfilesData = [
    {
      id: "1",
      name: "L2 Liquidity Maps",
      handle: "@l2_liquidity",
      avatar: "/static/projects/avatar1.jpg",
      score: 844,
    },
    {
      id: "2",
      name: "Bridge Risk Monitor",
      handle: "@bridgerisk",
      avatar: "/static/projects/avatar2.jpg",
      score: 790,
    },
    {
      id: "3",
      name: "Rotations Radar",
      handle: "@rotation_radar",
      avatar: "/static/projects/avatar3.jpg",
      score: 921,
    },
  ];

  const influentialConnectionsData = [
    {
      id: "1",
      name: "Fabric Ventures",
      handle: "@fabric_vc",
      avatar: "/static/projects/avatar4.jpg",
      type: "Interacts",
      value: "184.3k Followers",
    },
    {
      id: "2",
      name: "Social Capital",
      handle: "@sclcptl",
      avatar: "/static/projects/avatar5.jpg",
      type: "Frequent mentions",
      value: "94k Followers",
    },
    {
      id: "3",
      name: "USV",
      handle: "@usv_group",
      avatar: "/static/projects/avatar6.jpg",
      type: "Shared audience",
      value: "~27% Overlap",
    },
  ];

  const handleViewOnX = () => {
    window.open("https://x.com/fomohub", "_blank");
  };

  const handleCompare = () => {
    setCompareModalOpen(true);
  };

  const handleViewAllPosts = () => {
    router.push(`/utility/influence/x/${entityId}/posts`);
  };

  const handleChannelClick = (channelId: string) => {
    router.push(`/utility/influence/x/${channelId}`);
  };

  const handleViewAllRelated = () => {
    router.push(`/utility/influence/x/${entityId}/related`);
  };

  const handleProfileClick = (profileId: string) => {
    router.push(`/utility/influence/x/${profileId}`);
  };

  const handleConnectionClick = (connectionId: string) => {
    router.push(`/utility/influence/x/${connectionId}`);
  };

  return (
    <PageWrapper>
      <PageHeader>
        <PageTitle>Overview • X Account</PageTitle>
        <PageSubtitle>
          High-level analytics for a single X account. Metrics are based on
          native X stats and recent activity.
        </PageSubtitle>
      </PageHeader>

      <ContentGrid>
        <Column>
          <EntityHeader
            name={entityData.name}
            username={entityData.username}
            type={entityData.type}
            avatar={entityData.avatar}
            description={entityData.description}
            verified={entityData.verified}
            snapshotUpdated={entityData.createdAt}
            // X-specific stats
            followers={entityData.followers.toLocaleString()}
            followersChange={entityData.followersChange}
            following={entityData.following.toString()}
            followingLabel={entityData.followingLabel}
            engagementRate={entityData.engagementRate}
            engagementLabel={entityData.engagementLabel}
            xScore={entityData.xScore}
            xScoreChange={entityData.xScoreChange}
            xScoreDescription={entityData.xScoreDescription}
            // Buttons
            viewButtonLabel="View on X"
            viewOnFomoButton={true}
            onView={handleViewOnX}
            onCompare={handleCompare}
            // Network identifier
            network="x"
          />
          <Row>
            <ActivityOverview
              postsPerDay={activityData.postsPerDay}
              viewRateStability={activityData.viewRateStability}
              viewRateLevel={activityData.viewRateLevel}
              forwardVolatility={activityData.forwardVolatility}
              forwardLevel={activityData.forwardLevel}
              network="x"
              mostActiveTime={activityData.mostActiveTime}
              bestEngagement={activityData.bestEngagement}
            />
            <AudienceSnapshot
              directFollowers={audienceData.directFollowers}
              crossPostTraffic={audienceData.crossPostTraffic}
              searchHashtags={audienceData.searchHashtags}
              externalShares={audienceData.externalShares}
              network="x"
              interestTags={interestTags}
            />
          </Row>
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
          <RecentPosts
            posts={postsData}
            onViewAll={handleViewAllPosts}
            network="x"
          />
        </Column>
        <Column>
          <AISummary network="x" entityName={entityData.name} />
          <ProductOverview />
          <RelatedProfiles
            connections={influentialConnectionsData}
            onConnectionClick={handleProfileClick}
          />{" "}
          <InfluentialConnections
            profiles={relatedProfilesData}
            onProfileClick={handleConnectionClick}
          />
        </Column>
      </ContentGrid>
      <CommentBlock />
      <CompareModal
        isOpen={isCompareModalOpen}
        onClose={() => setCompareModalOpen(false)}
        baseEntity={entityData}
        baseActivity={activityData}
        baseAudience={audienceData}
        network="x"
      />
    </PageWrapper>
  );
};

export default XEntityOverview;
