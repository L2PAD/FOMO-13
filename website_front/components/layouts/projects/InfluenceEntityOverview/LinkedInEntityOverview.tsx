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
  ProfileHealth,
  NetworkRelations,
  RelatedAccounts,
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

interface LinkedInEntityOverviewProps {
  entityId?: string;
  network?: string;
}

const LinkedInEntityOverview: React.FC<LinkedInEntityOverviewProps> = ({
  entityId,
  network,
}) => {
  const [isCompareModalOpen, setIsCompareModalOpen] = useState(false);
  const router = useRouter();

  // Determine if this is a Company (odd entityId) or Person (even entityId)
  const isCompany = entityId ? parseInt(entityId, 10) % 2 !== 0 : false;

  // Mock entity data
  const entityData = {
    name: "Laurent Ghaul",
    type: isCompany
      ? ["Company", "FinTech & Web3"]
      : ["Person", "FinTech & Web3"],
    avatar: "/static/projects/avatar1.jpg",
    description:
      "Founder at FOMO.cx\nFinancial Executive, specialized in new business development and major market expansion, organized, and motivated with High custo...",
    companySize: isCompany ? "5-10 employees" : undefined,
    linkedinConnections: !isCompany ? "500+" : undefined,
    followers: isCompany ? 18617 : 18617,
    followersChange: isCompany ? "+20 last 30D" : "+210 last 30D",
    hiringActivity: isCompany ? "medium" : "high",
    verified: true,
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
      label: "Feed traffic",
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

  const relatedAccountsData = [
    {
      id: "1",
      name: "L2 Liquidity Maps",
      avatar: "/static/projects/avatar1.jpg",
      activity: "high" as const,
      handle: "Company",
    },
    {
      id: "2",
      name: "Anthony Gale",
      avatar: "/static/projects/avatar2.jpg",
      activity: "high" as const,
      handle: "Person",
    },
    {
      id: "3",
      name: "Rotations Radar",
      avatar: "/static/projects/avatar3.jpg",
      activity: "high" as const,
      handle: "Company",
    },
  ];

  const handleViewOnLinkedIn = () => {
    window.open("https://linkedin.com/company/fomohub", "_blank");
  };

  const handleCompare = () => {
    setIsCompareModalOpen(true);
  };

  const handleViewAllPosts = () => {
    router.push(`/utility/influence/linkedin/${entityId}/posts`);
  };

  const handleChannelClick = (channelId: string) => {
    router.push(`/utility/influence/linkedin/${channelId}`);
  };

  const handleViewAllRelated = () => {
    router.push(`/utility/influence/linkedin/${entityId}/related`);
  };

  return (
    <PageWrapper>
      <PageHeader>
        <PageTitle>Overview • LinkedIn Company/Profile</PageTitle>
      </PageHeader>

      <ContentGrid>
        <Column>
          <EntityHeader
            name={entityData.name}
            type={entityData.type}
            avatar={entityData.avatar}
            description={entityData.description}
            snapshotUpdated={entityData.createdAt}
            verified={entityData.verified}
            // LinkedIn-specific stats (Company variant)
            companySize={entityData.companySize}
            linkedinConnections={entityData.linkedinConnections}
            followers={entityData.followers.toLocaleString()}
            followersChange={entityData.followersChange}
            hiringActivity={entityData.hiringActivity}
            activity={entityData.hiringActivity as "high" | "medium" | "low"}
            viewButtonLabel="View on LinkedIn"
            viewOnFomoButton={isCompany}
            onView={handleViewOnLinkedIn}
            onCompare={handleCompare}
            // Network identifier
            network="linkedin"
          />
          <ActivityOverview
            postsPerDay="3-5"
            viewRateStability={85}
            viewRateLevel="high"
            forwardVolatility={60}
            forwardLevel="moderate"
            network="linkedin"
            originalPosts="6"
            avgReactions="120"
            avgComments="9"
            reshares="4"
            contentMix={[
              "55% deep-dive threads & research posts",
              "25% event/podcast announcements",
              "20% reshared content & shout-outs",
            ]}
            whenPostsPerformBest={[
              "Most active: Tue–Thu, 09:00–13:00 UTC",
              "Best engagement: overlap EU + US morning",
              "Engagement stability: high (no big drops)",
            ]}
          />
          {isCompany ? (
            <NetworkRelations
              trackingStatus="Listed in FOMO"
              category={["Token", "Defi", "Repos DEX"]}
              token="$FMO"
              teamMembers={{
                count: 4,
                label: "Team members with other FOMO projects",
              }}
              advisors={{ count: 2, label: "Advisors linked to tracked funds" }}
              ecosystemLinks={[
                { id: "1", label: "Backed by", value: "HighGold Capital" },
                { id: "2", label: "Launched via", value: "EchoPad" },
                { id: "3", label: "Integrated with", value: "LayerZero" },
              ]}
              footerNote="Calculated from LinkedIn data matched against FOMO-tracked teams and investor lists."
              forLinkedIn
            />
          ) : (
            <NetworkRelations />
          )}
        </Column>
        <Column>
          <AISummary network="linkedin" />
          <ProfileHealth
            profileCompleteness={{
              value: "Excellent",
              description: "Rich headline • detailed experience",
            }}
            growthPattern={{
              value: "Organic",
              description: "Steady follower curve",
            }}
            engagementQuality={{
              value: "High",
              description: 'Low pod/"great post" noise',
            }}
          />
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
          username: entityData.type,
          avatar: entityData.avatar,
          linkedinConnections: entityData.companySize,
          linkedinFollowers: entityData.followers.toString(),
          linkedinFollowersChange: entityData.followersChange,
          linkedinActivity: entityData.hiringActivity,
        }}
        baseActivity={activityData}
        baseAudience={{} as any}
        network="linkedin"
      />
    </PageWrapper>
  );
};

export default LinkedInEntityOverview;
