import React, { useState } from "react";
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

interface InstagramEntityOverviewProps {
  entityId?: string;
  network?: string;
}

const InstagramEntityOverview: React.FC<InstagramEntityOverviewProps> = ({
  entityId,
  network,
}) => {
  const [activeChart, setActiveChart] = useState("Engagement Timeline");
  const [isCompareModalOpen, setIsCompareModalOpen] = useState(false);
  const router = useRouter();

  // Mock entity data
  const entityData = {
    name: "FOMO Hub",
    username: "@fomo_hub",
    avatar: "/static/projects/avatar1.jpg",
    description:
      "Daily visuals, market breakdowns and narrative tracking for on-chain traders. Short-form research, liquidity heatmaps and pre-TGE se ...",
    followers: "18,420",
    followersChange: "+210 last 30D",
    following: 312,
    posts: 860,
    postsSub: "Feed posts, Reels",
    engagementRate: "4.2%",
    engagementSub: "Above niche benchmark",
    instagramScore: 94,
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
      label: "Explore traffic",
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
      reposts: "127",
      sends: "5",
      images: ["/static/main/dev_portrait.png", "/static/main/core_bg.png"],
    },
    {
      id: "2",
      text: "New DeFi platform just launched and it's already drawing massive attention. Users are speculating an upcoming airdrop based on early interactions. Clean interface, responsive UI, and non-custodial features — could become a serious contender in Web3 infrastructure...",
      date: "July 02, 2025  4:12 pm",
      views: "122,2k",
      comments: "164",
      likes: "362",
      reposts: "127",
      sends: "5",
      images: ["/static/main/where_next.png", "/static/main/evolution-bg.png"],
    },
    {
      id: "3",
      text: "Alpha alert 🚨 — A stealth airdrop campaign might be in motion. A newly released dApp is letting users interact with cross-chain swaps and gasless transactions. Many signs point toward future rewards for early onchain users. Stay sharp.",
      date: "July 02, 2025  4:12 pm",
      views: "122,2k",
      comments: "164",
      likes: "362",
      reposts: "127",
      sends: "4",
    },
  ];

  const relatedAccountsData = [
    {
      id: "1",
      name: "L2 Liquidity Maps",
      handle: "@l2_liquidity",
      avatar: "/static/projects/avatar1.jpg",
      followers: "84,498",
    },
    {
      id: "2",
      name: "Bridge Risk Monitor",
      handle: "@bridgerisk",
      avatar: "/static/projects/avatar2.jpg",
      followers: "7,904",
    },
    {
      id: "3",
      name: "Rotations Radar",
      handle: "@rotation_radar",
      avatar: "/static/projects/avatar3.jpg",
      followers: "19,261",
    },
  ];

  const handleViewOnInstagram = () => {
    window.open("https://instagram.com/fomohub", "_blank");
  };

  const handleCompare = () => {
    setIsCompareModalOpen(true);
  };

  const handleViewAllPosts = () => {
    router.push(`/utility/influence/instagram/${entityId}/posts`);
  };

  const handleChannelClick = (channelId: string) => {
    router.push(`/utility/influence/instagram/${channelId}`);
  };

  return (
    <PageWrapper>
      <PageHeader>
        <PageTitle>Overview • Instagram Account</PageTitle>
      </PageHeader>

      <ContentGrid>
        <Column>
          <EntityHeader
            name={entityData.name}
            username={entityData.username}
            avatar={entityData.avatar}
            description={entityData.description}
            snapshotUpdated={entityData.createdAt}
            // Instagram-specific stats
            followers={entityData.followers.toLocaleString()}
            followersChange={entityData.followersChange}
            following={entityData.following.toString()}
            posts={entityData.posts.toString()}
            postsSub={entityData.postsSub}
            engagementRate={entityData.engagementRate}
            engagementSub={entityData.engagementSub}
            instagramScore={entityData.instagramScore}
            // Buttons
            viewButtonLabel="View on Instagram"
            onView={handleViewOnInstagram}
            onCompare={handleCompare}
            // Network identifier
            network="instagram"
          />
          <Row>
            <ActivityOverview
              postsPerDay={activityData.postsPerDay}
              viewRateStability={activityData.viewRateStability}
              viewRateLevel={activityData.viewRateLevel}
              forwardVolatility={activityData.forwardVolatility}
              forwardLevel={activityData.forwardLevel}
              network="instagram"
              posts="23"
              avgLikes="1,480"
              avgComments="86"
              avgReposts="31"
              avgShares="174"
            />{" "}
            <AudienceSnapshot
              directFollowers={audienceData.directFollowers}
              crossPostTraffic={audienceData.crossPostTraffic}
              searchHashtags={audienceData.searchHashtags}
              externalShares={audienceData.externalShares}
              network="instagram"
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
          <RecentPosts
            posts={postsData}
            onViewAll={handleViewAllPosts}
            network="instagram"
          />
        </Column>
        <Column>
          <AISummary network="instagram" entityName={entityData.name} />
          <ProductOverview />
          <RelatedAccounts
            accounts={relatedAccountsData}
            onAccountClick={handleChannelClick}
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
          instagramFollowers: entityData.followers.toString(),
          instagramFollowersChange: entityData.followersChange,
          instagramFollowing: entityData.following.toString(),
          instagramPosts: entityData.posts.toString(),
          instagramEngagementRate: entityData.engagementRate,
          instagramScore: entityData.instagramScore,
        }}
        baseActivity={activityData}
        baseAudience={audienceData}
        network="instagram"
      />
    </PageWrapper>
  );
};

export default InstagramEntityOverview;
