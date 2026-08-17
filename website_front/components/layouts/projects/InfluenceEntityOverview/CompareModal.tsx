import React, { useState, useEffect, useRef } from "react";
import styled from "styled-components";
import { X } from "lucide-react";
import MainModal from "../../../global/common/MainModal";
import {
  EntityHeader,
  AISummary,
  ActivityOverview,
  ProductOverview,
  AudienceSnapshot,
  HealthSafety,
  RoleStructure,
  ChannelSnapshot,
  NetworkRelations,
  ProfileHealth,
} from "./components";
import SearchResultsPortal from "../../projects/Connection/SearchResultsPortal";
import {
  CompareModalWrapper,
  CompareContent,
  CompareColumn,
  SearchBox,
  SelectedEntity,
  EntityPlaceholder,
  ColumnTitle,
  RemoveButton,
  AudienceIntersection,
  IntersectionRow,
  IntersectionBar,
  IntersectionLabel,
  IntersectionCalculation,
} from "./CompareModal.styles";
import { SearchInput } from "../P2PExchange/styles";
import { SearchIconStyle } from "../Networks/styles";

interface CompareModalProps {
  isOpen: boolean;
  onClose: () => void;
  baseEntity: any;
  baseActivity: any;
  baseAudience: any;
  network:
    | "x"
    | "telegram"
    | "discord"
    | "instagram"
    | "linkedin"
    | "tiktok"
    | "threads";
}

const mockSearchResults = [
  {
    _id: "1",
    name: "John Sharma",
    username: "@jsharmmm",
    logo: "/static/projects/avatar2.jpg",
    followers: "184.2K",
    followersChange: "+2.1% 30D",
    engagementRate: "3.8%",
    engagementLabel: "Above average",
    xScore: 856,
    // Discord specific
    members: "18,420",
    membersChange: "+3.8% 30D",
    activeMembers: "1,220",
    engagementLevel: "high" as const,
    // Telegram specific
    subscribers: "184.2K",
    subscribersChange: "+2.1%",
    viewsPost: "15.2K",
    messagesDay: "42",
    activity: "high" as const,
    // Instagram specific
    instagramFollowers: "18,420",
    instagramFollowersChange: "+210 last 30D",
    instagramFollowing: "312",
    instagramPosts: "860",
    instagramEngagementRate: "4.2%",
    instagramScore: 94,
    // LinkedIn specific
    linkedinConnections: "500+",
    linkedinFollowers: "1,617",
    linkedinFollowersChange: "+210 last 30D",
    linkedinActivity: "high" as const,
    // TikTok specific
    avgViewsVideo: "42.7k",
    tiktokScore: 94,
    // Threads specific
    threadsScore: 94,
    isPrivate: false,
    type: "Public Server",
  },
  {
    _id: "2",
    name: "Vitalik Buterin",
    username: "@VitalikButerin",
    logo: "/static/projects/avatar3.jpg",
    followers: "5.3M",
    followersChange: "+1.2% 30D",
    engagementRate: "5.4%",
    engagementLabel: "Well above average",
    xScore: 987,
    // Discord specific
    members: "5,300",
    membersChange: "+1.2% 30D",
    activeMembers: "890",
    engagementLevel: "high" as const,
    // Telegram specific
    subscribers: "5.3M",
    subscribersChange: "+1.2%",
    viewsPost: "420K",
    messagesDay: "156",
    activity: "high" as const,
    // Instagram specific
    instagramFollowers: "5,300",
    instagramFollowersChange: "+120 last 30D",
    instagramFollowing: "892",
    instagramPosts: "1,240",
    instagramEngagementRate: "5.4%",
    instagramScore: 97,
    // LinkedIn specific
    linkedinConnections: "500+",
    linkedinFollowers: "1,617",
    linkedinFollowersChange: "+210 last 30D",
    linkedinActivity: "high" as const,
    // TikTok specific
    avgViewsVideo: "42.7k",
    tiktokScore: 97,
    // Threads specific
    threadsScore: 97,
    isPrivate: false,
    type: "Public Server",
  },
  {
    _id: "3",
    name: "Coinbase",
    username: "@coinbase",
    logo: "/static/projects/avatar4.jpg",
    followers: "6.8M",
    followersChange: "+0.8% 30D",
    engagementRate: "2.1%",
    engagementLabel: "Average",
    xScore: 921,
    // Discord specific
    members: "6,800",
    membersChange: "+0.8% 30D",
    activeMembers: "1,140",
    engagementLevel: "medium" as const,
    // Telegram specific
    subscribers: "6.8M",
    subscribersChange: "+0.8%",
    viewsPost: "520K",
    messagesDay: "89",
    activity: "medium" as const,
    // Instagram specific
    instagramFollowers: "6,800",
    instagramFollowersChange: "+80 last 30D",
    instagramFollowing: "1,450",
    instagramPosts: "2,100",
    instagramEngagementRate: "2.1%",
    instagramScore: 85,
    // LinkedIn specific
    linkedinConnections: "500+",
    linkedinFollowers: "1,617",
    linkedinFollowersChange: "+210 last 30D",
    linkedinActivity: "high" as const,
    // TikTok specific
    avgViewsVideo: "42.7k",
    tiktokScore: 85,
    // Threads specific
    threadsScore: 85,
    isPrivate: false,
    type: "Public Server",
  },
];

const CompareModal: React.FC<CompareModalProps> = ({
  isOpen,
  onClose,
  baseEntity,
  baseActivity,
  baseAudience,
  network,
}) => {
  const [compareEntity, setCompareEntity] = useState<any>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [isResultsVisible, setIsResultsVisible] = useState(false);
  const searchRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (searchQuery) {
      if (network === "discord") {
        mockSearchResults.push({
          _id: "4",
          name: "Server 3",
          username: "Private server",
          logo: "/static/projects/avatar1.jpg",
          followers: "0",
          followersChange: "0",
          engagementRate: "0%",
          engagementLabel: "N/A",
          xScore: 0,
          // Discord specific - private server
          members: "N/A",
          membersChange: "N/A",
          activeMembers: "N/A",
          engagementLevel: "medium" as const,
          // Telegram specific
          subscribers: "N/A",
          subscribersChange: "N/A",
          viewsPost: "N/A",
          messagesDay: "N/A",
          activity: "medium" as const,
          // Instagram specific
          instagramFollowers: "N/A",
          instagramFollowersChange: "N/A",
          instagramFollowing: "N/A",
          instagramPosts: "N/A",
          instagramEngagementRate: "N/A",
          instagramScore: 0,
          // LinkedIn specific
          linkedinConnections: "N/A",
          linkedinFollowers: "N/A",
          linkedinFollowersChange: "N/A",
          linkedinActivity: "high" as const,
          // TikTok specific
          avgViewsVideo: "N/A",
          tiktokScore: 0,
          // Threads specific
          threadsScore: 0,
          isPrivate: true,
          type: "Private Server",
        });
      }

      const filteredResults = mockSearchResults.filter(
        (entity) =>
          entity.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
          entity.username.toLowerCase().includes(searchQuery.toLowerCase())
      );
      setSearchResults(filteredResults);
      setIsResultsVisible(true);
    } else {
      setSearchResults([]);
      setIsResultsVisible(false);
    }
  }, [searchQuery]);

  const handleSelectEntity = (entity: any) => {
    setCompareEntity(entity);
    setSearchQuery("");
    setIsResultsVisible(false);
  };

  const handleRemoveCompare = () => {
    setCompareEntity(null);
  };

  const handleCloseModal = () => {
    setCompareEntity(null);
    setSearchQuery("");
    onClose();
  };

  const handleClickOutside = (event: MouseEvent) => {
    if (
      searchRef.current &&
      !searchRef.current.contains(event.target as Node)
    ) {
      setIsResultsVisible(false);
    }
  };

  useEffect(() => {
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  return (
    <MainModal
      isVisible={isOpen}
      onClose={handleCloseModal}
      variant="big"
      title="Comparison"
      className="compare-modal"
    >
      <CompareModalWrapper>
        <CompareContent>
          <CompareColumn>
            <EntityHeader {...baseEntity} network={network} forCompare />
            <div className="">
              <ColumnTitle className="section-title">AI Summary</ColumnTitle>
              <AISummary
                forCompare
                network={network}
                entityName={baseEntity.name}
              />
            </div>
            <div className="">
              <ColumnTitle className="section-title">
                Activity Overview
              </ColumnTitle>
              <ActivityOverview
                {...baseActivity}
                posts={
                  network === "instagram"
                    ? "18"
                    : network === "threads"
                      ? "45"
                      : undefined
                }
                avgLikes={
                  network === "instagram"
                    ? "1,250"
                    : network === "tiktok"
                      ? "4,200"
                      : network === "threads"
                        ? "1,480"
                        : undefined
                }
                avgComments={
                  network === "instagram"
                    ? "72"
                    : network === "linkedin"
                      ? "9"
                      : network === "tiktok"
                        ? "365"
                        : network === "threads"
                          ? "86"
                          : undefined
                }
                avgReposts={network === "instagram" ? "24" : undefined}
                avgShares={
                  network === "instagram"
                    ? "145"
                    : network === "tiktok"
                      ? "115"
                      : undefined
                }
                avgViewsVideo={
                  network === "tiktok"
                    ? "38,500"
                    : network === "threads"
                      ? "67,480"
                      : undefined
                }
                originalPosts={network === "linkedin" ? "6" : undefined}
                avgReactions={network === "linkedin" ? "120" : undefined}
                reshares={network === "linkedin" ? "4" : undefined}
                videos={network === "tiktok" ? "12" : undefined}
                mostActive={
                  network === "tiktok"
                    ? "14:00–16:00 UTC"
                    : network === "threads"
                      ? "18:00–21:00 UTC"
                      : undefined
                }
                forCompare
                network={network}
              />
            </div>
            {network === "discord" && baseAudience && (
              <>
                <div className="">
                  <ColumnTitle className="section-title">
                    Audience Snapshot
                  </ColumnTitle>
                  <AudienceSnapshot
                    {...baseAudience}
                    forCompare
                    network="discord"
                  />
                </div>
                <div className="">
                  <ColumnTitle className="section-title">
                    Health & Safety
                  </ColumnTitle>
                  <HealthSafety forCompare />
                </div>
                <div className="">
                  <ColumnTitle className="section-title">
                    Role Structure
                  </ColumnTitle>
                  <RoleStructure forCompare />
                </div>
              </>
            )}
            {network === "telegram" && baseAudience && (
              <>
                <div className="">
                  <ColumnTitle className="section-title">
                    Audience Snapshot
                  </ColumnTitle>
                  <AudienceSnapshot
                    {...baseAudience}
                    forCompare
                    network="telegram"
                  />
                </div>
                <div className="">
                  <ColumnTitle className="section-title">
                    Channel Snapshot
                  </ColumnTitle>
                  <ChannelSnapshot forCompare />
                </div>
                <div className="">
                  <ColumnTitle className="section-title">
                    Health & Safety
                  </ColumnTitle>
                  <HealthSafety forCompare />
                </div>
                <div className="">
                  <ColumnTitle className="section-title">
                    Product Overview
                  </ColumnTitle>
                  <ProductOverview forCompare />
                </div>
              </>
            )}
            {network === "x" && (
              <div className="">
                <ColumnTitle className="section-title">
                  Product Overview
                </ColumnTitle>
                <ProductOverview forCompare />
              </div>
            )}
            {network === "instagram" && baseAudience && (
              <>
                <div className="">
                  <ColumnTitle className="section-title">
                    Audience Snapshot
                  </ColumnTitle>
                  <AudienceSnapshot
                    {...baseAudience}
                    forCompare
                    network="instagram"
                  />
                </div>
                <div className="">
                  <ColumnTitle className="section-title">
                    Product Overview
                  </ColumnTitle>
                  <ProductOverview forCompare />
                </div>
              </>
            )}
            {network === "linkedin" && (
              <>
                <div className="">
                  <ColumnTitle className="section-title">
                    Network Relations
                  </ColumnTitle>
                  <NetworkRelations forCompare />
                </div>
                <div className="">
                  <ColumnTitle className="section-title">
                    Profile Health
                  </ColumnTitle>
                  <ProfileHealth
                    forCompare
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
                </div>
              </>
            )}
            {network === "tiktok" && (
              <div className="">
                <ColumnTitle className="section-title">
                  Product Overview
                </ColumnTitle>
                <ProductOverview forCompare />
              </div>
            )}
            {network === "threads" && (
              <>
                <div className="">
                  <ColumnTitle className="section-title">
                    Audience Snapshot
                  </ColumnTitle>
                  <AudienceSnapshot forCompare network="threads" />
                </div>
                <div className="">
                  <ColumnTitle className="section-title">
                    Product Overview
                  </ColumnTitle>
                  <ProductOverview forCompare />
                </div>
              </>
            )}
          </CompareColumn>
          <CompareColumn>
            {compareEntity ? (
              <>
                <SelectedEntity>
                  <RemoveButton onClick={handleRemoveCompare}>
                    <svg
                      width="24"
                      height="24"
                      viewBox="0 0 24 24"
                      fill="none"
                      xmlns="http://www.w3.org/2000/svg"
                    >
                      <path
                        d="M4 6.17647H20M9 3H15M15.5 21H8.5C7.39543 21 6.5 20.0519 6.5 18.8824L6.0434 7.27937C6.01973 6.67783 6.47392 6.17647 7.04253 6.17647H16.9575C17.5261 6.17647 17.9803 6.67783 17.9566 7.27937L17.5 18.8824C17.5 20.0519 16.6046 21 15.5 21Z"
                        stroke="#738094"
                        strokeLinecap="round"
                      />
                    </svg>
                  </RemoveButton>
                  <EntityHeader
                    name={compareEntity.name}
                    username={compareEntity.username || "@username"}
                    avatar={compareEntity.logo}
                    followers={
                      network === "x" ? compareEntity.followers : undefined
                    }
                    followersChange={
                      network === "x"
                        ? compareEntity.followersChange
                        : undefined
                    }
                    engagementRate={
                      network === "x" ? compareEntity.engagementRate : undefined
                    }
                    engagementLabel={
                      network === "x"
                        ? compareEntity.engagementLabel
                        : undefined
                    }
                    xScore={network === "x" ? compareEntity.xScore : undefined}
                    members={
                      network === "discord" ? compareEntity.members : undefined
                    }
                    membersChange={
                      network === "discord"
                        ? compareEntity.membersChange
                        : undefined
                    }
                    activeMembers={
                      network === "discord"
                        ? compareEntity.activeMembers
                        : undefined
                    }
                    engagementLevel={
                      network === "discord"
                        ? compareEntity.engagementLevel
                        : undefined
                    }
                    subscribers={
                      network === "telegram"
                        ? compareEntity.subscribers
                        : undefined
                    }
                    subscribersChange={
                      network === "telegram"
                        ? compareEntity.subscribersChange
                        : undefined
                    }
                    viewsPost={
                      network === "telegram"
                        ? compareEntity.viewsPost
                        : undefined
                    }
                    messagesDay={
                      network === "telegram"
                        ? compareEntity.messagesDay
                        : undefined
                    }
                    activity={
                      network === "telegram"
                        ? compareEntity.activity
                        : undefined
                    }
                    instagramFollowers={
                      network === "instagram"
                        ? compareEntity.instagramFollowers
                        : undefined
                    }
                    instagramFollowersChange={
                      network === "instagram"
                        ? compareEntity.instagramFollowersChange
                        : undefined
                    }
                    instagramFollowing={
                      network === "instagram"
                        ? compareEntity.instagramFollowing
                        : undefined
                    }
                    instagramPosts={
                      network === "instagram"
                        ? compareEntity.instagramPosts
                        : undefined
                    }
                    instagramEngagementRate={
                      network === "instagram"
                        ? compareEntity.instagramEngagementRate
                        : undefined
                    }
                    instagramScore={
                      network === "instagram"
                        ? compareEntity.instagramScore
                        : undefined
                    }
                    linkedinConnections={
                      network === "linkedin"
                        ? compareEntity.linkedinConnections
                        : undefined
                    }
                    linkedinFollowers={
                      network === "linkedin"
                        ? compareEntity.linkedinFollowers
                        : undefined
                    }
                    linkedinFollowersChange={
                      network === "linkedin"
                        ? compareEntity.linkedinFollowersChange
                        : undefined
                    }
                    linkedinActivity={
                      network === "linkedin"
                        ? compareEntity.linkedinActivity
                        : undefined
                    }
                    avgViewsVideo={
                      network === "tiktok"
                        ? compareEntity.avgViewsVideo
                        : undefined
                    }
                    tiktokScore={
                      network === "tiktok"
                        ? compareEntity.tiktokScore
                        : undefined
                    }
                    forCompare
                    network={network}
                    {...compareEntity}
                    isPrivate={compareEntity.isPrivate}
                  />
                </SelectedEntity>
                {compareEntity.isPrivate ? (
                  <PrivateServerNotice>
                    <PrivateServerTitle>
                      This Discord server is private
                    </PrivateServerTitle>
                    <PrivateServerMessage>
                      Access to message history, member activity and engagement
                      data is restricted so analytics cannot be displayed.
                    </PrivateServerMessage>
                  </PrivateServerNotice>
                ) : (
                  <>
                    <div className="">
                      <ColumnTitle className="section-title">
                        AI Summary
                      </ColumnTitle>
                      <AISummary
                        forCompare
                        network={network}
                        entityName={compareEntity.name}
                      />
                    </div>
                    <div className="">
                      <ColumnTitle className="section-title">
                        Activity Overview
                      </ColumnTitle>
                      <ActivityOverview
                        postsPerDay={
                          network === "instagram" || network === "threads"
                            ? undefined
                            : "23"
                        }
                        viewRateStability={
                          network === "instagram" || network === "threads"
                            ? 0
                            : 0
                        }
                        viewRateLevel={
                          network === "instagram" || network === "threads"
                            ? "low"
                            : "low"
                        }
                        forwardVolatility={
                          network === "instagram" || network === "threads"
                            ? 0
                            : 0
                        }
                        forwardLevel={
                          network === "instagram" || network === "threads"
                            ? "low"
                            : "low"
                        }
                        posts={
                          network === "instagram"
                            ? "23"
                            : network === "threads"
                              ? "45"
                              : undefined
                        }
                        avgLikes={
                          network === "instagram"
                            ? "1,480"
                            : network === "tiktok"
                              ? "4,480"
                              : network === "threads"
                                ? "1,480"
                                : undefined
                        }
                        avgComments={
                          network === "instagram"
                            ? "86"
                            : network === "linkedin"
                              ? "12"
                              : network === "tiktok"
                                ? "389"
                                : network === "threads"
                                  ? "86"
                                  : undefined
                        }
                        avgReposts={network === "instagram" ? "31" : undefined}
                        avgShares={
                          network === "instagram"
                            ? "174"
                            : network === "tiktok"
                              ? "121"
                              : undefined
                        }
                        avgViewsVideo={
                          network === "tiktok"
                            ? "42,700"
                            : network === "threads"
                              ? "67,480"
                              : undefined
                        }
                        originalPosts={network === "linkedin" ? "8" : undefined}
                        avgReactions={
                          network === "linkedin" ? "156" : undefined
                        }
                        reshares={network === "linkedin" ? "6" : undefined}
                        videos={network === "tiktok" ? "14" : undefined}
                        mostActive={
                          network === "tiktok"
                            ? "14:00–16:00 UTC"
                            : network === "threads"
                              ? "18:00–21:00 UTC"
                              : undefined
                        }
                        forCompare
                        network={network}
                      />
                    </div>
                  </>
                )}
                {network === "discord" && !compareEntity.isPrivate && (
                  <>
                    <div className="">
                      <ColumnTitle className="section-title">
                        Audience Snapshot
                      </ColumnTitle>
                      <AudienceSnapshot
                        directFollowers={{
                          label: "Core contributors",
                          value: "~38%",
                          percentage: 38,
                        }}
                        crossPostTraffic={{
                          label: "Traders",
                          value: "~34%",
                          percentage: 34,
                        }}
                        searchHashtags={{
                          label: "Observers/lurkers",
                          value: "~20%",
                          percentage: 20,
                        }}
                        forCompare
                        network="discord"
                      />
                    </div>
                    <div className="">
                      <ColumnTitle className="section-title">
                        Health & Safety
                      </ColumnTitle>
                      <HealthSafety forCompare />
                    </div>
                    <div className="">
                      <ColumnTitle className="section-title">
                        Role Structure
                      </ColumnTitle>
                      <RoleStructure forCompare />
                    </div>
                  </>
                )}
                {network === "telegram" && !compareEntity.isPrivate && (
                  <>
                    <div className="">
                      <ColumnTitle className="section-title">
                        Audience Snapshot
                      </ColumnTitle>
                      <AudienceSnapshot
                        directFollowers={{
                          label: "Direct followers",
                          value: "72%",
                          percentage: 72,
                        }}
                        crossPostTraffic={{
                          label: "Cross-post traffic",
                          value: "18%",
                          percentage: 18,
                        }}
                        searchHashtags={{
                          label: "Search & hashtags",
                          value: "6%",
                          percentage: 6,
                        }}
                        externalShares={{
                          label: "External shares",
                          value: "4%",
                          percentage: 4,
                        }}
                        forCompare
                        network="telegram"
                      />
                    </div>
                    <div className="">
                      <ColumnTitle className="section-title">
                        Channel Snapshot
                      </ColumnTitle>
                      <ChannelSnapshot forCompare />
                    </div>
                    <div className="">
                      <ColumnTitle className="section-title">
                        Health & Safety
                      </ColumnTitle>
                      <HealthSafety forCompare />
                    </div>
                    <div className="">
                      <ColumnTitle className="section-title">
                        Product Overview
                      </ColumnTitle>
                      <ProductOverview forCompare empty />
                    </div>
                  </>
                )}
                {network === "x" && !compareEntity.isPrivate && (
                  <div className="">
                    <ColumnTitle className="section-title">
                      Product Overview
                    </ColumnTitle>
                    <ProductOverview forCompare />
                  </div>
                )}
                {network === "instagram" && !compareEntity.isPrivate && (
                  <>
                    <div className="">
                      <ColumnTitle className="section-title">
                        Audience Snapshot
                      </ColumnTitle>
                      <AudienceSnapshot
                        directFollowers={{
                          label: "Direct followers",
                          value: "72%",
                          percentage: 72,
                        }}
                        crossPostTraffic={{
                          label: "Explore traffic",
                          value: "18%",
                          percentage: 18,
                        }}
                        searchHashtags={{
                          label: "Search & hashtags",
                          value: "6%",
                          percentage: 6,
                        }}
                        externalShares={{
                          label: "External shares",
                          value: "4%",
                          percentage: 4,
                        }}
                        forCompare
                        network="instagram"
                      />
                    </div>
                    <div className="">
                      <ColumnTitle className="section-title">
                        Product Overview
                      </ColumnTitle>
                      <ProductOverview forCompare />
                    </div>
                  </>
                )}
                {network === "linkedin" && !compareEntity.isPrivate && (
                  <>
                    <div className="">
                      <ColumnTitle className="section-title">
                        Network Relations
                      </ColumnTitle>
                      <NetworkRelations forCompare />
                    </div>
                    <div className="">
                      <ColumnTitle className="section-title">
                        Profile Health
                      </ColumnTitle>
                      <ProfileHealth
                        forCompare
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
                    </div>
                  </>
                )}
                {network === "tiktok" && !compareEntity.isPrivate && (
                  <div className="">
                    <ColumnTitle className="section-title">
                      Product Overview
                    </ColumnTitle>
                    <ProductOverview forCompare />
                  </div>
                )}
                {network === "threads" && !compareEntity.isPrivate && (
                  <>
                    <div className="">
                      <ColumnTitle className="section-title">
                        Audience Snapshot
                      </ColumnTitle>
                      <AudienceSnapshot forCompare network="threads" />
                    </div>
                    <div className="">
                      <ColumnTitle className="section-title">
                        Product Overview
                      </ColumnTitle>
                      <ProductOverview forCompare />
                    </div>
                  </>
                )}
              </>
            ) : (
              <EntityPlaceholder>
                <SearchBox ref={searchRef}>
                  <SearchInput
                    type="text"
                    placeholder="Select account"
                    value={searchQuery}
                    onChange={(value) => setSearchQuery(value)}
                    onFocus={() =>
                      searchResults.length > 0 && setIsResultsVisible(true)
                    }
                    leftIcon={<SearchIconStyle />}
                    style={{ width: "100%" }}
                  />
                  <SearchResultsPortal
                    isVisible={isResultsVisible}
                    results={searchResults}
                    onSelect={handleSelectEntity}
                    anchorRef={searchRef}
                    positionAboveOnMobile={true}
                  />
                </SearchBox>
              </EntityPlaceholder>
            )}
          </CompareColumn>
        </CompareContent>
        {compareEntity &&
          network !== "telegram" &&
          network !== "instagram" &&
          network !== "linkedin" &&
          network !== "tiktok" &&
          network !== "threads" && (
            <AudienceIntersection>
              <div className="header">
                <ColumnTitle>Audience intersection</ColumnTitle>
                <div className="estimated-badge">Estimated • Last 30 days</div>
              </div>
              <p className="description">
                {network === "discord"
                  ? "Approximate overlap between the active members of both servers (estimated from message activity, react overlap, shared usernames and cross-server presence)"
                  : "Approximate overlap between the active audiences of both accounts, based on users who liked, reposted or replied to their posts in the last 30 days"}
              </p>
              <IntersectionRow>
                <IntersectionLabel>
                  <div>
                    <span
                      className="name"
                      style={{
                        color: "#000",
                      }}
                    >
                      {baseEntity.name}
                    </span>{" "}
                    •{" "}
                    {network === "discord"
                      ? "18% of active members also participate in"
                      : "32% of active audience also engages with"}{" "}
                    <span className="name">
                      {compareEntity ? compareEntity.name : "..."}
                    </span>
                    {network === "discord" && " server"}
                  </div>
                  <div className="percentage-large">
                    {network === "discord" ? "18%" : "32%"}
                  </div>
                </IntersectionLabel>
                <IntersectionBar
                  percentage={network === "discord" ? 18 : 32}
                  color="#05a584"
                />
                <IntersectionCalculation>
                  Overlap vs {baseEntity.name} (
                  {network === "discord"
                    ? "shared active users ÷ " +
                      baseEntity.name +
                      "'s active members"
                    : "shared engaged users ÷ " +
                      baseEntity.name +
                      "'s active audience"}
                  )
                </IntersectionCalculation>
              </IntersectionRow>
              <IntersectionRow>
                <IntersectionLabel>
                  <div>
                    <span
                      className="name"
                      style={{
                        color: "#000",
                      }}
                    >
                      {compareEntity ? compareEntity.name : "..."}
                    </span>{" "}
                    •{" "}
                    {network === "discord"
                      ? "24% of active members also participate in"
                      : "24% of active audience also engages with"}{" "}
                    <span className="name">{baseEntity.name}</span>
                    {network === "discord" && " server"}
                  </div>
                  <div className="percentage-large">24%</div>
                </IntersectionLabel>
                <IntersectionBar percentage={24} color="#3B82F6" />
                <IntersectionCalculation>
                  Overlap vs {compareEntity ? compareEntity.name : "..."} (
                  {network === "discord"
                    ? "shared active users ÷ " +
                      (compareEntity ? compareEntity.name : "...") +
                      " active members"
                    : "shared engaged users ÷ " +
                      (compareEntity ? compareEntity.name : "...") +
                      " active audience"}
                  )
                </IntersectionCalculation>
              </IntersectionRow>
              <div className="dashed-line"></div>
              <IntersectionLabel
                style={{
                  display: "inline",
                }}
              >
                <span className="name">How this is calculated:</span>{" "}
                {network === "discord" ? (
                  <>
                    Shared active users are people who participated in both
                    servers at least once in the last 30 days (messages,
                    reactions, joins to voice channels). Overlap for an account
                    = shared active users ÷ all users who were active on that
                    server in the same period.
                    <br />
                    <br />
                    Exact member-level identity matching is limited on Discord,
                    so values are approximate and based on cross-server activity
                    heuristics.
                  </>
                ) : (
                  <>
                    Shared engaged users are people who interacted with both
                    accounts at least once (likes, reposts or replies) in the
                    last 30 days. Overlap for an account = shared engaged users
                    ÷ all users who engaged with that account in the same
                    period.
                  </>
                )}
              </IntersectionLabel>
            </AudienceIntersection>
          )}
        {compareEntity && network === "instagram" && (
          <div
            style={{
              marginTop: 20,
            }}
          >
            <ColumnTitle>Summary Conclusion</ColumnTitle>

            <SummaryConclusion>
              <ConclusionText>
                <strong>{baseEntity.name}</strong> performs stronger across
                growth, reach and engagement quality.{" "}
                <strong>{compareEntity.name}</strong> maintains a steady
                follower base but does not generate as strong discovery or
                interaction depth.
              </ConclusionText>
              <ConclusionText>
                If focusing on expansion – <strong>{baseEntity.name}</strong> is
                outperforming. If focusing on consistency and volume –{" "}
                <strong>{compareEntity.name}</strong> posts more but with lower
                impact.
              </ConclusionText>
            </SummaryConclusion>
          </div>
        )}{" "}
        {compareEntity && network === "linkedin" && (
          <div
            style={{
              marginTop: 20,
            }}
          >
            <ColumnTitle>Summary Conclusion</ColumnTitle>
            <SummaryConclusion>
              <ConclusionText>
                <strong>{baseEntity.name}</strong> shows a stronger presence
                within the Web3 and FOMO ecosystem, with deeper overlap across
                crypto projects, research teams and L1/L2 ecosystems, indicating
                a high degree of specialization.
              </ConclusionText>
              <ConclusionText>
                <strong>{compareEntity.name}</strong>, on the other hand,
                demonstrates a broader, business-oriented professional profile.
                Their background includes advisory roles, operational
                leadership, and cross-industry experience, resulting in a wider
                but less crypto-focused network.
              </ConclusionText>
              <ConclusionText>
                Overall, both profiles demonstrate strong professional
                credibility, but their strengths differ:
                <br />
                <strong>{baseEntity.name}</strong>: deeper industry
                specialization and stronger relevance to the crypto ecosystem
                <br />
                <strong>{compareEntity.name}</strong>: broader network reach and
                diversified corporate experience
              </ConclusionText>
            </SummaryConclusion>
          </div>
        )}{" "}
        {compareEntity && network === "tiktok" && (
          <div
            style={{
              marginTop: 20,
            }}
          >
            <ColumnTitle>Summary Conclusion</ColumnTitle>
            <SummaryConclusion>
              <ConclusionText>
                <strong>{baseEntity.name}</strong> demonstrates consistent
                posting behavior with strong engagement metrics and a TikTok
                score of {baseEntity.tiktokScore || "94"}, averaging{" "}
                {baseEntity.avgViewsVideo || "38,500"} views per video.
              </ConclusionText>
              <ConclusionText>
                <strong>{compareEntity.name}</strong>, by comparison, shows
                slightly higher activity with an average of{" "}
                {compareEntity.avgViewsVideo || "42,700"} views per video. Their
                TikTok score of {compareEntity.tiktokScore || "97"} reflects
                strong content quality and audience engagement patterns.
              </ConclusionText>
              <ConclusionText>
                Both accounts demonstrate strong TikTok presence, but{" "}
                <strong>{compareEntity.name}</strong> shows marginally better
                performance in terms of average views and overall score, while{" "}
                <strong>{baseEntity.name}</strong> maintains solid consistency
                and engagement across their content.
              </ConclusionText>
            </SummaryConclusion>
          </div>
        )}{" "}
        {compareEntity && network === "threads" && (
          <div
            style={{
              marginTop: 20,
            }}
          >
            <ColumnTitle>Summary Conclusion</ColumnTitle>
            <SummaryConclusion>
              <ConclusionText>
                <strong>{baseEntity.name}</strong> shows a stronger presence
                within the Web3 and FOMO ecosystem, with deeper overlap across
                crypto projects, funds, and infrastructure teams. Their
                experience is concentrated around research, analytics, and L1/L2
                ecosystems, indicating a high degree of specialization.
              </ConclusionText>
              <ConclusionText>
                <strong>{compareEntity.name}</strong>, on the other hand,
                demonstrates a broader, business-oriented professional profile.
                Their background includes advisory roles, operational
                leadership, and cross-industry experience, resulting in a wider
                but less crypto-focused network.
              </ConclusionText>
              <ConclusionText>
                Overall, both profiles demonstrate strong professional
                credibility, but their strengths differ: <br />{" "}
                <strong>{baseEntity.name}</strong>: deeper industry
                specialization and stronger relevance to the crypto ecosystem
                <br /> <strong>{compareEntity.name}</strong>: broader network
                reach and diversified corporate experience
              </ConclusionText>
            </SummaryConclusion>
          </div>
        )}{" "}
      </CompareModalWrapper>
    </MainModal>
  );
};

export default CompareModal;

const PrivateServerNotice = styled.div``;

const PrivateServerTitle = styled.h3`
  font-size: 16px;
  font-weight: var(--font-weight-semibold);
  color: #070b35;
  margin: 0 0 8px 0;
`;

const PrivateServerMessage = styled.div`
  padding: 20px;
  background: #fefcf3;
  border: 2px solid #ffc704;
  border-radius: 12px;
  font-size: 16px;
  line-height: 1;
  color: #070b35;
`;

const SummaryConclusion = styled.div`
  margin-top: 8px;
  padding: 24px;
  background: #f5fbfd;
  border-radius: 20px;
`;

const ConclusionText = styled.p`
  font-size: 14px;
  line-height: 1.5;
  color: #070b35;
  margin: 20px 0 0 0;

  &:first-of-type {
    margin-top: 0;
  }

  strong {
    font-weight: var(--font-weight-semibold);
    color: #070b35;
  }
`;
