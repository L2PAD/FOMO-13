import React from "react";
import { useRouter } from "next/router";
import styled from "styled-components";
import {
  EntityHeader,
  ActivityOverview,
  AudienceSnapshot,
  EngagementTimeline,
  RecentHighlights,
  AISummary,
  HealthSafety,
  RelatedServers,
  RoleStructure,
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

interface DiscordEntityOverviewProps {
  entityId?: string;
  network?: string;
}

const DiscordEntityOverview: React.FC<DiscordEntityOverviewProps> = ({
  entityId,
  network,
}) => {
  const router = useRouter();
  const [isCompareOpen, setIsCompareOpen] = React.useState(false);

  // Mock entity data
  const entityData = {
    name: "FOMO Hub",
    type: "Public Server",
    avatar: "/static/projects/avatar1.jpg",
    description:
      "FOMO's research-driven Discord hub for on-chain analytics, narrative tracking and TGE insights. Structured channels for alerts, dashboards...",
    members: 18420,
    membersChange: "+3.8% 30D",
    activeMembers: 1220,
    activeMembersLabel: "~17% of active weekly",
    messagesDay: 842,
    messagesSub: "Above median for similar size",
    engagementLevel: "high" as const,
    engagementLevelLabel: "Above median for similar size",
    createdAt: "Snapshot updated 30 min ago",
  };

  const activityData = {
    postsPerDay: "842",
    viewRateStability: 85,
    viewRateLevel: "high" as const,
    forwardVolatility: 60,
    forwardLevel: "moderate" as const,
    mostActiveTime: "10:00–13:00 & 18:00–21:00 UTC",
    bestEngagement: "weekdays, US & EU overlap",
  };

  const audienceData = {
    directFollowers: {
      label: "Direct members",
      value: "72%",
      change: "+5%",
      positive: true,
    },
    crossPostTraffic: {
      label: "Cross-server traffic",
      value: "18%",
      change: "-2%",
      positive: false,
    },
    searchHashtags: {
      label: "Invite links",
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

  const highlightsData = [
    {
      id: "1",
      text: "New DeFi platform just launched and it's already drawing massive attention. Users are speculating an upcoming airdrop based on early interactions. Clean interface, responsive UI, and non-custodial features — could become a serious contender in Web3 infrastructure...",
      date: "July 02, 2025  4:12 pm",
    },
    {
      id: "2",
      text: "New <strong>DeFi stress-test dashboard</strong> launched in the server. Members are actively back-testing liquidity crunch scenarios and sharing transaction walkthroughs.<br/><br/>Collab AMAs with <strong>Flows Radar</strong> and <strong>Infra Builders</strong> brought a 12% bump in member growth and a noticeable spike in voice-channel usage.",
      date: "July 02, 2025  4:12 pm",
    },
    {
      id: "3",
      text: "New DeFi platform just launched and it's already drawing massive attention. Users are speculating an upcoming airdrop based on early interactions. Clean interface, responsive UI, and non-custodial features — could become a serious contender in Web3 infrastructure...",
      date: "July 02, 2025  4:12 pm",
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
      type: "Server",
      subscribers: "12.4K",
      activity: "medium" as const,
    },
    {
      id: "2",
      name: "Bridge Risk Monitor",
      type: "Server",
      subscribers: "8.7K",
      activity: "high" as const,
    },
    {
      id: "3",
      name: "Rotations Radar",
      type: "Server",
      subscribers: "15.2K",
      activity: "high" as const,
    },
  ];

  const relatedServersData = [
    {
      id: "1",
      name: "L2 Liquidity Maps",
      description: "On-chain liquidity observers",
      engagementLevel: 84,
    },
    {
      id: "2",
      name: "Bridge Risk Monitor",
      description: "Bridge / exploit coverage",
      engagementLevel: 79,
    },
    {
      id: "3",
      name: "Rotations Radar",
      description: "Flows & rotations community",
      engagementLevel: 92,
    },
  ];

  const handleViewOnDiscord = () => {
    window.open("https://discord.gg/fomohub", "_blank");
  };

  const handleCompare = () => {
    setIsCompareOpen(true);
  };

  const handleViewAllPosts = () => {
    router.push(`/utility/influence/discord/${entityId}/posts`);
  };

  const handleChannelClick = (channelId: string) => {
    router.push(`/utility/influence/discord/${channelId}`);
  };

  const handleViewAllRelated = () => {
    router.push(`/utility/influence/discord/${entityId}/related`);
  };

  return (
    <PageWrapper>
      <PageHeader>
        <PageTitle>Overview • Discord Server</PageTitle>
        <PageSubtitle>
          High-level analytics for a single Discord server. Metrics are based on
          native Discord stats and recent activity.
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
            // Discord-specific stats
            members={entityData.members.toLocaleString()}
            membersChange={entityData.membersChange}
            activeMembers={entityData.activeMembers.toLocaleString()}
            activeMembersLabel={entityData.activeMembersLabel}
            messagesDay={entityData.messagesDay.toString()}
            messagesSub={entityData.messagesSub}
            engagementLevel={entityData.engagementLevel}
            engagementLevelLabel={entityData.engagementLevelLabel}
            // Buttons
            viewButtonLabel="View on Discord"
            onView={handleViewOnDiscord}
            onCompare={handleCompare}
            // Network identifier
            network="discord"
          />
          <Row>
            <ActivityOverview
              postsPerDay={activityData.postsPerDay}
              viewRateStability={activityData.viewRateStability}
              viewRateLevel={activityData.viewRateLevel}
              forwardVolatility={activityData.forwardVolatility}
              forwardLevel={activityData.forwardLevel}
              mostActiveTime={activityData.mostActiveTime}
              bestEngagement={activityData.bestEngagement}
              network="discord"
            />{" "}
            <AudienceSnapshot
              directFollowers={audienceData.directFollowers}
              crossPostTraffic={audienceData.crossPostTraffic}
              searchHashtags={audienceData.searchHashtags}
              externalShares={audienceData.externalShares}
              network="discord"
            />
          </Row>
          <EngagementTimeline title={"Engagement Timeline"} />
          <RecentHighlights highlights={highlightsData} />
        </Column>
        <Column>
          <AISummary network="discord" entityName={entityData.name} />
          <HealthSafety
            spamLevel={healthData.spamLevel}
            raidRisk={healthData.raidRisk}
            modCoverage={healthData.modCoverage}
          />
          <RoleStructure />
          <RelatedServers
            servers={relatedServersData}
            onServerClick={handleChannelClick}
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
          members: entityData.members.toLocaleString(),
          membersChange: entityData.membersChange,
          activeMembers: entityData.activeMembers.toLocaleString(),
          engagementLevel: entityData.engagementLevel,
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
        network="discord"
      />
    </PageWrapper>
  );
};

export default DiscordEntityOverview;
