import React, { useState, useEffect } from "react";
import { MainInfoDescription } from "../Crypto/styles";
import { HeaderTitleWrapper, SearchContainer } from "../CryptoMarket/styles";
import TimeRangeSlider from "../Connection/TimeRangeSlider";
import {
  PageWrapper,
  MainInfo,
  MainScreen,
  SearchSection,
  TableSection,
  TableTitle,
  EntityName,
  FilterButton,
} from "./styles";
import Typography from "../../../global/common/Typography";
import {
  PageDescription,
  SearchIconStyle,
  SearchWrapper,
} from "../Networks/styles";
import { SearchInput } from "../P2PExchange/styles";
import SearchResults from "../Connection/SearchResultsPortal";
import ExploreSuggestions from "../Connection/ExploreSuggestions";
import SocialNetworkFilter from "./SocialNetworkFilter";
import InfluenceTable from "./InfluenceTable";
import { Filter } from "lucide-react";
import InfluenceFilter from "../../../global/Filter/influence_filter";
import AdModeFilter from "../../../global/Filter/ad_mode_filter";
import { Button } from "../../../global/common/Button";
import FollowersModal from "../Connection/FollowersModal";

const Influence: React.FC = () => {
  const [searchValue, setSearchValue] = useState<string>("");
  const [isSearchOpen, setIsSearchOpen] = useState<boolean>(false);
  const [selectedEntity, setSelectedEntity] = useState<any>(null);
  const [socialNetwork, setSocialNetwork] = useState<string>("x");
  const [dateRange, setDateRange] = useState<{
    start: Date;
    end: Date;
  }>({
    start: new Date(2018, 0, 1),
    end: new Date(),
  });
  const [filterData, setFilterData] = useState<any>(null);
  const [adModeFilterData, setAdModeFilterData] = useState<any>(null);
  const [isAdModeOpen, setIsAdModeOpen] = useState<boolean>(false);
  const [followersModal, setFollowersModal] = useState<{
    isOpen: boolean;
    type: "followers" | "following";
    data: any[];
    accountName: string;
  }>({ isOpen: false, type: "followers", data: [], accountName: "" });

  const searchAnchorRef = React.useRef<HTMLDivElement | null>(null);

  const handleDateRangeChange = (startDate: Date, endDate: Date) => {
    setDateRange({ start: startDate, end: endDate });
  };

  // Mock search results
  const getSearchResults = () => {
    return [
      { _id: "1", name: "Laurent Ghoul", logo: "/static/projects/avatar1.jpg" },
      {
        _id: "2",
        name: "CinderPoint Ventures",
        logo: "/static/projects/avatar2.jpg",
      },
      { _id: "3", name: "Elara Kim", logo: "/static/projects/avatar3.jpg" },
      { _id: "4", name: "MetaForge DAO", logo: "/static/projects/avatar4.jpg" },
      {
        _id: "5",
        name: "Delta Arc Fund",
        logo: "/static/projects/avatar5.jpg",
      },
    ];
  };

  const filteredResults = searchValue
    ? getSearchResults().filter((item) =>
        item.name.toLowerCase().includes(searchValue.toLowerCase())
      )
    : [];

  // Mock influence data generator
  const generateMockFollowers = (count: number) => {
    const mockNames = [
      "Alice Johnson",
      "Bob Smith",
      "Charlie Davis",
      "Diana Wilson",
      "Eve Martinez",
    ];
    return Array.from({ length: Math.min(count, 50) }, (_, i) => ({
      _id: `follower-${i + 1}`,
      avatar: `/static/projects/avatar${(i % 8) + 1}.jpg`,
      logo: `/static/projects/avatar${(i % 8) + 1}.jpg`,
      name: mockNames[i % mockNames.length],
      username: `@user${i + 1}`,
      followersCount: `${Math.floor(Math.random() * 100)}k`,
      date: "2 days ago",
    }));
  };

  const getInfluenceData = () => {
    return [
      {
        _id: "1",
        account: "TradingView",
        accountLogo: "/static/projects/avatar1.jpg",
        followers: "872.1k",
        following: "3.8k",
        followersList: generateMockFollowers(872100),
        followingList: generateMockFollowers(3800),
        audienceIntersection: "38%",
        engagementRate: "4.2%",
        xScore: 923,
        xScoreChange: "+3.8%",
        entityType: "Company",
        companySize: "20-50",
        publicFollowers: "9.3k",
        mutualConnections: 12,
        postsPerWeek: 16,
        avgLikes: "9.3k",
        avgReplies: 96,
        avgViews: "9.3k",
        postFreq: 12.0,
        totalPosts: "12k",
        members: "238,900",
        onlineNow: "14,230",
        growth7d: "+3.8%",
        growth30d: "+3.8%",
        activity: "High",
        engagementLevel: "High",
        impressions: "2.5M",
        reach: "1.8M",
        redFlags: 0,
        fomoScore: 656,
        fomoStar: 94,
      },
      {
        _id: "2",
        account: "CinderPoint Ventures",
        accountLogo: "/static/projects/avatar2.jpg",
        followers: "1m",
        following: "1.5k",
        followersList: generateMockFollowers(1000000),
        followingList: generateMockFollowers(1500),
        audienceIntersection: "22%",
        engagementRate: "3.5%",
        xScore: 784,
        xScoreChange: "-2.2%",
        entityType: "Person",
        companySize: "-",
        publicFollowers: "1.2k",
        mutualConnections: 1,
        postsPerWeek: 7,
        avgLikes: "1.2k",
        avgReplies: 31,
        avgViews: "1.2k",
        postFreq: 7.7,
        totalPosts: "890",
        members: "71,440",
        onlineNow: "3,920",
        growth7d: "-2.2%",
        growth30d: "-2.2%",
        activity: "Medium",
        engagementLevel: "Medium",
        impressions: "5.8M",
        reach: "3.2M",
        redFlags: 2,
        fomoScore: 98,
        fomoStar: 12,
      },
      {
        _id: "3",
        account: "Elara Kim",
        accountLogo: "/static/projects/avatar3.jpg",
        followers: "234.2k",
        following: "2.2k",
        followersList: generateMockFollowers(234200),
        followingList: generateMockFollowers(2200),
        audienceIntersection: "14%",
        engagementRate: "5.1%",
        xScore: 978,
        xScoreChange: "+1.4%",
        entityType: "Person",
        companySize: "-",
        publicFollowers: "23.5k",
        mutualConnections: 12,
        postsPerWeek: 4,
        avgLikes: "23.5k",
        avgReplies: 4,
        avgViews: "23.5k",
        postFreq: 4.1,
        totalPosts: "3.4k",
        members: "9.3k",
        onlineNow: "1,115",
        growth7d: "+1.4%",
        growth30d: "+1.4%",
        activity: "Low",
        engagementLevel: "Low",
        impressions: "1.2M",
        reach: "890k",
        redFlags: 1,
        fomoScore: 124,
        fomoStar: 56,
      },
      {
        _id: "4",
        account: "MetaForge DAO",
        accountLogo: "/static/projects/avatar4.jpg",
        followers: "115k",
        following: "1k",
        followersList: generateMockFollowers(115000),
        followingList: generateMockFollowers(1000),
        audienceIntersection: "41%",
        engagementRate: "6.3%",
        xScore: 589,
        xScoreChange: "+4.1%",
        entityType: "Company",
        companySize: "100-200",
        publicFollowers: "12k",
        mutualConnections: 32,
        postsPerWeek: 5,
        avgLikes: "12k",
        avgReplies: 67,
        avgViews: "12k",
        postFreq: 5.4,
        totalPosts: "567",
        members: "156,700",
        onlineNow: "9,870",
        growth7d: "+4.1%",
        growth30d: "+4.1%",
        activity: "Medium",
        engagementLevel: "Medium",
        impressions: "780k",
        reach: "520k",
        redFlags: 0,
        fomoScore: 146,
        fomoStar: 34,
      },
      {
        _id: "5",
        account: "Delta Arc Fund",
        accountLogo: "/static/projects/avatar5.jpg",
        followers: "18.6k",
        following: "1.6k",
        followersList: generateMockFollowers(18600),
        followingList: generateMockFollowers(1600),
        audienceIntersection: "29%",
        engagementRate: "2.8%",
        xScore: 740,
        xScoreChange: "+2.9%",
        entityType: "Company",
        companySize: "100-200",
        publicFollowers: "1k",
        mutualConnections: 15,
        postsPerWeek: 8,
        avgLikes: "1k",
        avgReplies: 12,
        avgViews: "1k",
        postFreq: 8.0,
        totalPosts: "234",
        members: "52,410",
        onlineNow: "2,781",
        growth7d: "+2.9%",
        growth30d: "+2.9%",
        activity: "High",
        engagementLevel: "High",
        impressions: "340k",
        reach: "210k",
        redFlags: 0,
        fomoScore: 976,
        fomoStar: 78,
      },
      {
        _id: "6",
        account: 'Ivan "GhostMode" Sov...',
        accountLogo: "/static/projects/avatar6.jpg",
        followers: "101k",
        following: "1k",
        followersList: generateMockFollowers(101000),
        followingList: generateMockFollowers(1000),
        audienceIntersection: "11%",
        engagementRate: "3.9%",
        xScore: 740,
        xScoreChange: "-1.1%",
        entityType: "Company",
        companySize: "200-500",
        publicFollowers: "3.3k",
        mutualConnections: 25,
        postsPerWeek: 13,
        avgLikes: "3.3k",
        avgReplies: 13,
        avgViews: "3.3k",
        postFreq: 13.2,
        totalPosts: "1.5k",
        members: "11k",
        onlineNow: "14,230",
        growth7d: "-1.1%",
        growth30d: "-1.1%",
        activity: "Low",
        engagementLevel: "Low",
        impressions: "890k",
        reach: "620k",
        redFlags: 4,
        fomoScore: 29,
        fomoStar: 78,
      },
      {
        _id: "7",
        account: "EchoMint",
        accountLogo: "/static/projects/avatar7.jpg",
        followers: "987k",
        following: "997",
        followersList: generateMockFollowers(987000),
        followingList: generateMockFollowers(997),
        audienceIntersection: "2.5%",
        engagementRate: "6.0%",
        xScore: 912,
        xScoreChange: "+2.5%",
        entityType: "Company",
        companySize: "200-500",
        publicFollowers: "11k",
        mutualConnections: 20,
        postsPerWeek: 6,
        avgLikes: "11k",
        avgReplies: 67,
        avgViews: "11k",
        postFreq: 6.1,
        totalPosts: "945",
        members: "25k",
        onlineNow: "3,920",
        growth7d: "+2.5%",
        growth30d: "+2.5%",
        activity: "Medium",
        engagementLevel: "Medium",
        impressions: "1.5M",
        reach: "980k",
        redFlags: 1,
        fomoScore: 66,
        fomoStar: 56,
      },
      {
        _id: "8",
        account: "ArcaniaPay",
        accountLogo: "/static/projects/avatar8.jpg",
        followers: "1.2k",
        following: "1.2k",
        followersList: generateMockFollowers(1200),
        followingList: generateMockFollowers(1200),
        audienceIntersection: "34%",
        engagementRate: "5.9%",
        xScore: 784,
        xScoreChange: "+3.4%",
        entityType: "Person",
        companySize: "-",
        publicFollowers: "42k",
        mutualConnections: 31,
        postsPerWeek: 9,
        avgLikes: "42k",
        avgReplies: 54,
        avgViews: "42k",
        postFreq: 9.4,
        totalPosts: "987",
        members: "3.3k",
        onlineNow: "1,115",
        growth7d: "+3.4%",
        growth30d: "+3.4%",
        activity: "Low",
        engagementLevel: "Low",
        impressions: "2.1M",
        reach: "1.4M",
        redFlags: 0,
        fomoScore: 54,
        fomoStar: 34,
      },
      {
        _id: "9",
        account: "HeliaNine Capital",
        accountLogo: "/static/projects/avatar1.jpg",
        followers: "986k",
        following: "1.89k",
        followersList: generateMockFollowers(986000),
        followingList: generateMockFollowers(1890),
        audienceIntersection: "9%",
        engagementRate: "2.4%",
        xScore: 784,
        xScoreChange: "+9%",
        entityType: "Company",
        companySize: "-",
        publicFollowers: "25k",
        mutualConnections: 30,
        postsPerWeek: 14,
        avgLikes: "25k",
        avgReplies: 1,
        avgViews: "25k",
        postFreq: 1.3,
        totalPosts: "234",
        members: "9k",
        onlineNow: "9,870",
        growth7d: "+9%",
        growth30d: "+9%",
        activity: "Medium",
        engagementLevel: "Medium",
        impressions: "760k",
        reach: "450k",
        redFlags: 6,
        fomoScore: 54,
        fomoStar: 34,
      },
      {
        _id: "10",
        account: "Tara Voss",
        accountLogo: "/static/projects/avatar2.jpg",
        followers: "996.3k",
        following: "1.1k",
        followersList: generateMockFollowers(996300),
        followingList: generateMockFollowers(1100),
        audienceIntersection: "4.5%",
        engagementRate: "4.5%",
        xScore: 923,
        xScoreChange: "+4.5%",
        entityType: "Person",
        companySize: "20-50",
        publicFollowers: "9k",
        mutualConnections: 12,
        postsPerWeek: 7,
        avgLikes: "9k",
        avgReplies: 0,
        avgViews: "9k",
        postFreq: 7.0,
        totalPosts: "1.8k",
        members: "1.3k",
        onlineNow: "2,781",
        growth7d: "+4.5%",
        growth30d: "+4.5%",
        activity: "High",
        engagementLevel: "High",
        impressions: "890k",
        reach: "580k",
        redFlags: 0,
        fomoScore: 273,
        fomoStar: 78,
      },
    ];
  };

  return (
    <PageWrapper>
      <MainScreen>
        <MainInfo>
          <MainInfoDescription>
            <HeaderTitleWrapper className="header">
              <Typography className="main-title" variant="h1">
                Influence
              </Typography>
            </HeaderTitleWrapper>
            <PageDescription variant="span">
              Explore how crypto influencers shape market narratives across
              social platforms. Analyze follower networks, mutual subscriptions
              and audience overlap to reveal who holds attention. Each node
              represents an influencer and every link shows a verified
              connection within the social ecosystem.
            </PageDescription>
            <SearchSection className="connection-search-section">
              <SearchContainer className="connection-search-container">
                <SearchWrapper ref={searchAnchorRef}>
                  <SearchInput
                    className="small-input white-input"
                    onFocus={(value: boolean) => setIsSearchOpen(value)}
                    type="text"
                    placeholder="Search for influencers, projects or funds..."
                    onChange={(value: string) => setSearchValue(value)}
                    leftIcon={<SearchIconStyle />}
                    value={searchValue}
                    style={{ width: "100%" }}
                  />
                </SearchWrapper>
                <SearchResults
                  isVisible={isSearchOpen && searchValue.length > 0}
                  results={filteredResults}
                  onSelect={(item: any) => {
                    setSelectedEntity(item);
                    setSearchValue(item.name);
                    setIsSearchOpen(false);
                  }}
                  anchorRef={searchAnchorRef}
                />
              </SearchContainer>
            </SearchSection>
          </MainInfoDescription>
          <ExploreSuggestions />
        </MainInfo>
      </MainScreen>

      <TableSection>
        <div className="flex-row">
          <TableTitle>
            <EntityName>Entities Overview</EntityName>
          </TableTitle>
          <SocialNetworkFilter
            currentFilter={socialNetwork}
            onFilterChange={setSocialNetwork}
          />
          <div className="buttons">
            <div className="ad-mode-wrapper">
              <Button
                variant="outlined"
                className="ad"
                onClick={() => setIsAdModeOpen(true)}
              >
                <svg
                  width="14"
                  height="14"
                  viewBox="0 0 14 14"
                  fill="none"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path
                    d="M6.50977 9.20312V6.79688C6.50977 6.56481 6.41758 6.34225 6.25348 6.17816C6.08939 6.01406 5.86683 5.92188 5.63477 5.92188C5.4027 5.92188 5.18014 6.01406 5.01605 6.17816C4.85195 6.34225 4.75977 6.56481 4.75977 6.79688V9.20312"
                    stroke="#05A584"
                    stroke-width="0.7"
                    stroke-linecap="round"
                    stroke-linejoin="round"
                  />
                  <path
                    d="M4.75977 7.89062H6.50977"
                    stroke="#05A584"
                    stroke-width="0.7"
                    stroke-linecap="round"
                    stroke-linejoin="round"
                  />
                  <path
                    d="M7.93164 5.92188H8.58789C8.81996 5.92188 9.04251 6.01406 9.20661 6.17816C9.3707 6.34225 9.46289 6.56481 9.46289 6.79688V8.32812C9.46289 8.44303 9.44026 8.55681 9.39629 8.66297C9.35231 8.76913 9.28786 8.86559 9.20661 8.94684C9.12536 9.02809 9.0289 9.09255 8.92274 9.13652C8.81658 9.18049 8.7028 9.20312 8.58789 9.20312H7.93164V5.92188Z"
                    stroke="#05A584"
                    stroke-width="0.7"
                    stroke-linecap="round"
                    stroke-linejoin="round"
                  />
                  <path
                    d="M8.87914 2.07812C9.05307 2.07816 9.21987 2.14724 9.34289 2.27019L11.2552 4.18294C11.3781 4.30596 11.4472 4.47276 11.4473 4.64669V10.9375C11.4473 11.0668 11.4219 11.1948 11.3725 11.3143C11.323 11.4337 11.2505 11.5423 11.1591 11.6337C11.0677 11.7251 10.9591 11.7976 10.8397 11.8471C10.7202 11.8965 10.5922 11.9219 10.4629 11.9219H3.90039C3.7711 11.9219 3.64307 11.8965 3.52362 11.8471C3.40416 11.7976 3.29562 11.7251 3.2042 11.6337C3.11279 11.5423 3.04028 11.4337 2.99083 11.3143C2.94138 11.1948 2.91596 11.0668 2.91602 10.9375V3.0625C2.91602 2.80143 3.01973 2.55105 3.20433 2.36644C3.38894 2.18184 3.63932 2.07813 3.90039 2.07812H8.87914Z"
                    stroke="#05A584"
                    stroke-width="0.7"
                    stroke-linecap="round"
                    stroke-linejoin="round"
                  />
                  <path
                    d="M8.82227 2.07812V4.04688C8.82227 4.22092 8.89141 4.38784 9.01448 4.51091C9.13755 4.63398 9.30447 4.70312 9.47852 4.70312H11.4473"
                    stroke="#05A584"
                    stroke-width="0.7"
                    stroke-linecap="round"
                    stroke-linejoin="round"
                  />
                </svg>
                Ad Mode
              </Button>
              <AdModeFilter
                isOpen={isAdModeOpen}
                onClose={() => setIsAdModeOpen(false)}
                onSave={(data) => {
                  setAdModeFilterData(data);
                  setIsAdModeOpen(false);
                }}
                filterDataInitial={adModeFilterData}
              />
            </div>
            <InfluenceFilter
              onSave={(data) => setFilterData(data)}
              filterDataInitial={filterData}
            />
          </div>
        </div>

        <InfluenceTable
          selectedEntity={{
            name: "All Entities",
            logo: "/static/projects/avatar1.jpg",
          }}
          influenceData={getInfluenceData()}
          socialNetwork={socialNetwork}
          dateRange={dateRange}
          onFollowersClick={(type, data, accountName) => {
            setFollowersModal({ isOpen: true, type, data, accountName });
          }}
        />
        <FollowersModal
          isOpen={followersModal.isOpen}
          onClose={() =>
            setFollowersModal({ ...followersModal, isOpen: false })
          }
          title={
            followersModal.type === "followers" ? "Followers" : "Following"
          }
          totalCount={followersModal.data.length.toString()}
          followers={followersModal.data}
        />
      </TableSection>
    </PageWrapper>
  );
};

export default Influence;
