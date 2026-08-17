import React, { useState, useEffect } from "react";
import { MainInfoDescription } from "../Crypto/styles";
import { HeaderTitleWrapper, SearchContainer } from "../CryptoMarket/styles";
import ForceGraph from "./ForceGraph";
import FilterPopup from "./FilterPopup";
import SocialLinksFilter from "./SocialLinksFilter";
import EcosystemTable from "./EcosystemTable";
import InfluenceTable from "./InfluenceTable";
import OnChainTable from "./OnChainTable";
import TimeRangeSlider from "./TimeRangeSlider";
import {
  GraphWrapper,
  PageWrapper,
  TabSwitcher,
  TabButton,
  MainInfo,
  MainScreen,
  SearchSection,
} from "./styles";
import Typography from "../../../global/common/Typography";
import {
  PageDescription,
  SearchIconStyle,
  SearchWrapper,
} from "../Networks/styles";
import { SearchInput } from "../P2PExchange/styles";
import SearchResults from "./SearchResultsPortal";
import ExploreSuggestions from "./ExploreSuggestions";

const ConnectionGraph: React.FC = () => {
  const [tab, setTab] = useState<"ecosystem" | "influence" | "on-chain">(
    "ecosystem"
  );
  const [dimensions, setDimensions] = useState({ width: 0, height: 0 });
  const [searchValue, setSearchValue] = useState<string>("");
  const [isSearchOpen, setIsSearchOpen] = useState<boolean>(false);
  const [selectedEntity, setSelectedEntity] = useState<any>(null);
  const [filters, setFilters] = useState({
    persons: true,
    funds: true,
    projects: true,
  });
  const [onChainFilters, setOnChainFilters] = useState({
    centralizedExchanges: true,
    depositAddresses: false,
    individualsAndFunds: false,
    decentralizedExchanges: false,
    lending: true,
    misc: false,
    uncategorized: false,
    all: false,
  });
  const [flowDirection, setFlowDirection] = useState<
    "all" | "in" | "out" | "self"
  >("all");
  const [currentHopLevel, setCurrentHopLevel] = useState<number>(1);
  const [influenceFilter, setInfluenceFilter] = useState<string>("x");
  const [dateRange, setDateRange] = useState<{
    start: Date;
    end: Date;
  }>({
    start: new Date(2018, 0, 1),
    end: new Date(),
  });

  useEffect(() => {
    setSelectedEntity(null);
    setSearchValue("");
  }, [tab]);

  const handleDateRangeChange = (startDate: Date, endDate: Date) => {
    setDateRange({ start: startDate, end: endDate });
    // Here you can filter your data based on the date range
    console.log("Date range changed:", { start: startDate, end: endDate });
  };

  const graphContainerRef = React.useRef<HTMLDivElement>(null);
  const searchAnchorRef = React.useRef<HTMLDivElement | null>(null);

  // Mock relations data
  const getRelationsData = () => {
    if (!selectedEntity) return [];

    if (tab === "ecosystem") {
      return [
        {
          _id: "1",
          type: "projects",
          typeLabel: "Project",
          entity: {
            name: "Orbital Labs",
            logo: "/static/projects/avatar1.jpg",
          },
          relation: "Core Contributor",
          status: "Active",
        },
        {
          _id: "2",
          type: "funds",
          typeLabel: "Fund",
          entity: {
            name: "CinderPoint Ventures",
            logo: "/static/projects/avatar2.jpg",
          },
          relation: "Advisor",
          status: "Active",
        },
        {
          _id: "3",
          type: "persons",
          typeLabel: "Person",
          entity: {
            name: "Elara Kim",
            logo: "/static/projects/avatar3.jpg",
          },
          relation: "Co-founder/Collaborator",
          status: "Historical",
        },
        {
          _id: "4",
          type: "funds",
          typeLabel: "Fund",
          entity: {
            name: "MetaForge DAO",
            logo: "/static/projects/avatar4.jpg",
          },
          relation: "Member",
          status: "Active",
        },
        {
          _id: "5",
          type: "persons",
          typeLabel: "Person",
          entity: {
            name: "Delta Arc Fund",
            logo: "/static/projects/avatar5.jpg",
          },
          relation: "Portfolio Exposure",
          status: "Active",
        },
        {
          _id: "6",
          type: "funds",
          typeLabel: "Fund",
          entity: {
            name: 'Ivan "GhostNode" Sav...',
            logo: "/static/projects/avatar6.jpg",
          },
          relation: "Shared Holdings",
          status: "Historical",
        },
        {
          _id: "7",
          type: "projects",
          typeLabel: "Project",
          entity: {
            name: "EchoMint",
            logo: "/static/projects/avatat7.jpg",
          },
          relation: "Previous Employer",
          status: "Historical",
        },
        {
          _id: "8",
          type: "funds",
          typeLabel: "Fund",
          entity: {
            name: "ArcanaPay",
            logo: "/static/projects/avatar8.jpg",
          },
          relation: "Consultant",
          status: "Active",
        },
        {
          _id: "9",
          type: "funds",
          typeLabel: "Fund",
          entity: {
            name: "HelixNine Capital",
            logo: "/static/projects/icon.jpg",
          },
          relation: "Networking Partner",
          status: "Active",
        },
        {
          _id: "10",
          type: "persons",
          typeLabel: "Person",
          entity: {
            name: "Tara Voss",
            logo: "/static/projects/avatar1.jpg",
          },
          relation: "Public Collaborator",
          status: "Active",
        },
      ];
    }
    return [];
  };

  // Mock influence relations data
  // Helper function to generate mock followers data
  const generateMockFollowers = (count: number) => {
    const mockNames = [
      "Alice Johnson",
      "Bob Smith",
      "Charlie Davis",
      "Diana Wilson",
      "Eve Martinez",
      "Frank Brown",
      "Grace Lee",
      "Henry Taylor",
      "Ivy Anderson",
      "Jack White",
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

  const getInfluenceRelationsData = () => {
    if (!selectedEntity) return [];

    if (tab === "influence") {
      return [
        {
          _id: "1",
          account: "TradingView",
          accountLogo: "/static/projects/avatar1.jpg",
          // Twitter/X data
          followers: "872.1k",
          following: "3.8k",
          followersList: generateMockFollowers(872100),
          followingList: generateMockFollowers(3800),
          audienceIntersection: "38%",
          engagementRate: "4.2%",
          xScore: 923,
          xScoreChange: 12,
          // LinkedIn data
          entityType: "Company",
          companySize: "20-50",
          publicFollowers: "9.3k",
          mutualConnections: 12,
          // Threads data
          postsPerWeek: 12,
          avgLikes: "9.3k",
          avgReplies: 96,
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
          xScoreChange: 1,
          entityType: "Company",
          companySize: "-",
          publicFollowers: "1.2k",
          mutualConnections: 7,
          postsPerWeek: 7,
          avgLikes: "1.2k",
          avgReplies: 31,
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
          xScoreChange: 5,
          entityType: "Person",
          companySize: "-",
          publicFollowers: "23.5k",
          mutualConnections: 4,
          postsPerWeek: 4,
          avgLikes: "23.5k",
          avgReplies: 4,
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
          xScoreChange: -5,
          entityType: "Company",
          companySize: "100-200",
          publicFollowers: "12k",
          mutualConnections: 5,
          postsPerWeek: 5,
          avgLikes: "12k",
          avgReplies: 67,
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
          xScoreChange: 0,
          entityType: "Company",
          companySize: "100-200",
          publicFollowers: "1k",
          mutualConnections: 8,
          postsPerWeek: 8,
          avgLikes: "1k",
          avgReplies: 12,
        },
        {
          _id: "6",
          account: 'Ivan "GhostNode" Sav...',
          accountLogo: "/static/projects/avatar6.jpg",
          followers: "10k",
          following: "1k",
          followersList: generateMockFollowers(10000),
          followingList: generateMockFollowers(1000),
          audienceIntersection: "11%",
          engagementRate: "3.9%",
          xScore: 978,
          xScoreChange: 5,
          entityType: "Company",
          companySize: "200-500",
          publicFollowers: "3.3k",
          mutualConnections: 13,
          postsPerWeek: 13,
          avgLikes: "3.3k",
          avgReplies: 13,
        },
        {
          _id: "7",
          account: "EchoMint",
          accountLogo: "/static/projects/avatat7.jpg",
          followers: "987",
          following: "97",
          followersList: generateMockFollowers(987),
          followingList: generateMockFollowers(97),
          audienceIntersection: "25%",
          engagementRate: "6.0%",
          xScore: 589,
          xScoreChange: -5,
          entityType: "Company",
          companySize: "200-500",
          publicFollowers: "11k",
          mutualConnections: 6,
          postsPerWeek: 6,
          avgLikes: "11k",
          avgReplies: 67,
        },
        {
          _id: "8",
          account: "ArcanaPay",
          accountLogo: "/static/projects/avatar8.jpg",
          followers: "1.2k",
          following: "1.2k",
          followersList: generateMockFollowers(1200),
          followingList: generateMockFollowers(1200),
          audienceIntersection: "34%",
          engagementRate: "5.9%",
          xScore: 740,
          xScoreChange: 0,
          entityType: "Person",
          companySize: "-",
          publicFollowers: "42k",
          mutualConnections: 9,
          postsPerWeek: 9,
          avgLikes: "42k",
          avgReplies: 54,
        },
        {
          _id: "9",
          account: "HelixNine Capital",
          accountLogo: "/static/projects/icon.jpg",
          followers: "98k",
          following: "896",
          followersList: generateMockFollowers(98000),
          followingList: generateMockFollowers(896),
          audienceIntersection: "9%",
          engagementRate: "2.4%",
          xScore: 784,
          xScoreChange: 1,
          entityType: "Person",
          companySize: "-",
          publicFollowers: "25k",
          mutualConnections: 14,
          postsPerWeek: 14,
          avgLikes: "25k",
          avgReplies: 1,
        },
        {
          _id: "10",
          account: "Tara Voss",
          accountLogo: "/static/projects/avatar1.jpg",
          followers: "765.1k",
          following: "1.1k",
          followersList: generateMockFollowers(765100),
          followingList: generateMockFollowers(1100),
          audienceIntersection: "45%",
          engagementRate: "4.5%",
          xScore: 923,
          xScoreChange: 12,
          entityType: "Company",
          companySize: "20-50",
          publicFollowers: "9k",
          mutualConnections: 7,
          postsPerWeek: 7,
          avgLikes: "9k",
          avgReplies: "-",
        },
      ];
    }
    return [];
  };

  // Mock on-chain transfers data
  const getOnChainTransfersData = () => {
    if (!selectedEntity) return [];

    if (tab === "on-chain") {
      return [
        {
          _id: "1",
          time: "32 min on chain",
          from: "Binance: Hot Wallet",
          fromLogo: "/static/projects/avatar1.jpg",
          to: "bc1q8bcqxtc8ha0...",
          toLogo: "",
          value: "0.0159",
          token: "ETH",
          tokenLogo: "/static/crypto-icons/eth.svg",
          usd: "$1.65K",
          score: "45/100",
        },
        {
          _id: "2",
          time: "32 min on chain",
          from: "Binance Deposit...",
          fromLogo: "/static/projects/avatar2.jpg",
          to: "Bul: Bullish.com",
          toLogo: "/static/projects/avatar3.jpg",
          value: "97.975",
          token: "ETH",
          tokenLogo: "/static/crypto-icons/eth.svg",
          usd: "$10.21M",
          score: "63/100",
        },
        {
          _id: "3",
          time: "32 min on chain",
          from: "Binance: Hot W...",
          fromLogo: "/static/projects/avatar1.jpg",
          to: "bc1q8bcqxtc8ha0...",
          toLogo: "",
          value: "0.0159",
          token: "ETH",
          tokenLogo: "/static/crypto-icons/eth.svg",
          usd: "$1.65K",
          score: "42/100",
        },
        {
          _id: "4",
          time: "32 min on chain",
          from: "Binance Deposit...",
          fromLogo: "/static/projects/avatar2.jpg",
          to: "Bul: Bullish.com",
          toLogo: "/static/projects/avatar3.jpg",
          value: "97.975",
          token: "ETH",
          tokenLogo: "/static/crypto-icons/eth.svg",
          usd: "$10.21M",
          score: "78/100",
        },
        {
          _id: "5",
          time: "32 min on chain",
          from: "Binance: Hot W...",
          fromLogo: "/static/projects/avatar1.jpg",
          to: "bc1q8bcqxtc8ha0...",
          toLogo: "",
          value: "0.0159",
          token: "ETH",
          tokenLogo: "/static/crypto-icons/eth.svg",
          usd: "$1.65K",
          score: "34/100",
        },
        {
          _id: "6",
          time: "3 hours ago",
          from: "Binance Deposit...",
          fromLogo: "/projects/avatar2.jpg",
          to: "Bul: Bullish.com",
          toLogo: "/static/projects/avatar3.jpg",
          value: "97.975",
          token: "ETH",
          tokenLogo: "/static/crypto-icons/eth.svg",
          usd: "$10.21M",
          score: "99/100",
        },
        {
          _id: "7",
          time: "3 hours ago",
          from: "Binance: Hot W...",
          fromLogo: "/static/projects/avatar1.jpg",
          to: "bc1q8bcqxtc8ha0...",
          toLogo: "",
          value: "0.0159",
          token: "ETH",
          tokenLogo: "/static/crypto-icons/eth.svg",
          usd: "$1.65K",
          score: "23/100",
        },
        {
          _id: "8",
          time: "3 hours ago",
          from: "Binance Deposit...",
          fromLogo: "/static/projects/avatar2.jpg",
          to: "Bul: Bullish.com",
          toLogo: "/static/projects/avatar3.jpg",
          value: "97.975",
          token: "ETH",
          tokenLogo: "/static/crypto-icons/eth.svg",
          usd: "$10.21M",
          score: "97/100",
        },
        {
          _id: "9",
          time: "3 hours ago",
          from: "Binance: Hot W...",
          fromLogo: "/static/projects/avatar1.jpg",
          to: "bc1q8bcqxtc8ha0...",
          toLogo: "",
          value: "0.0159",
          token: "ETH",
          tokenLogo: "/static/crypto-icons/eth.svg",
          usd: "$1.65K",
          score: "43/100",
        },
        {
          _id: "10",
          time: "3 hours ago",
          from: "Binance Deposit...",
          fromLogo: "/static/projects/avatar2.jpg",
          to: "Bul: Bullish.com",
          toLogo: "/static/projects/avatar3.jpg",
          value: "97.975",
          token: "ETH",
          tokenLogo: "/static/crypto-icons/eth.svg",
          usd: "$10.21M",
          score: "38/100",
        },
      ];
    }
    return [];
  };

  // Mock data based on current tab
  const getSearchResults = () => {
    if (tab === "ecosystem") {
      return [
        { _id: "1", name: "Binance", logo: "/static/crypto-icons/binance.svg" },
        {
          _id: "2",
          name: "Coinbase",
          logo: "/static/crypto-icons/coinbase.svg",
        },
        { _id: "3", name: "Gate.io", logo: "/static/crypto-icons/gate.svg" },
      ];
    } else if (tab === "influence") {
      return [
        { _id: "5", name: "Bitcoin", logo: "/static/crypto-icons/btc.svg" },
        { _id: "6", name: "Ethereum", logo: "/static/crypto-icons/eth.svg" },
        { _id: "7", name: "BNB", logo: "/static/crypto-icons/bnb.svg" },
        { _id: "8", name: "Solana", logo: "/static/crypto-icons/sol.svg" },
      ];
    } else {
      return [
        { _id: "9", name: "Wallet 0x1234...", logo: "" },
        { _id: "10", name: "Wallet 0x5678...", logo: "" },
        { _id: "11", name: "Wallet 0x9abc...", logo: "" },
        { _id: "12", name: "Wallet 0xdef0...", logo: "" },
      ];
    }
  };

  const filteredResults = searchValue
    ? getSearchResults().filter((item) =>
        item.name.toLowerCase().includes(searchValue.toLowerCase())
      )
    : [];

  useEffect(() => {
    if (graphContainerRef.current) {
      setDimensions({
        width: graphContainerRef.current?.clientWidth,
        height: window.innerHeight - (window.innerWidth < 768 ? 200 : 0),
      });

      const handleResize = () => {
        setDimensions({
          width: window.innerWidth,
          height: window.innerHeight,
        });
      };

      window.addEventListener("resize", handleResize);

      return () => window.removeEventListener("resize", handleResize);
    }
  }, []);

  return (
    <PageWrapper>
      <MainScreen>
        <MainInfo>
          <MainInfoDescription>
            <HeaderTitleWrapper className="header">
              <Typography className="main-title" variant="h1">
                <span
                  style={{
                    textTransform: "capitalize",
                  }}
                >
                  {tab}
                </span>{" "}
                Graph
              </Typography>
              <TabSwitcher
                style={{
                  marginTop: 0,
                }}
              >
                <TabButton
                  active={tab === "ecosystem"}
                  onClick={() => setTab("ecosystem")}
                >
                  Ecosystem
                </TabButton>
                <TabButton
                  active={tab === "influence"}
                  onClick={() => setTab("influence")}
                >
                  Influence
                </TabButton>
                <TabButton
                  active={tab === "on-chain"}
                  onClick={() => setTab("on-chain")}
                >
                  On-Chain
                </TabButton>
              </TabSwitcher>
            </HeaderTitleWrapper>
            <PageDescription variant="span">
              Trade crypto assets directly with other users without relying on
              centralized exchanges. The Classic OTC Market on FOMO offers a
              secure space for peer-to-peer deals — whether you're buying or
              selling tokens, NFTs, or services. Create and browse offers,
              negotiate terms, and finalize transactions with full
            </PageDescription>
            <SearchSection className="connection-search-section">
              <SearchContainer className="connection-search-container">
                <SearchWrapper ref={searchAnchorRef}>
                  <SearchInput
                    className="small-input white-input"
                    onFocus={(value: boolean) => setIsSearchOpen(value)}
                    type="text"
                    placeholder={`Search for ${tab === "ecosystem" ? "exchanges" : tab === "influence" ? "tokens" : "wallets"}...`}
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
        <GraphWrapper ref={graphContainerRef}>
          {dimensions.width > 0 && (
            <ForceGraph
              width={dimensions.width}
              height={dimensions.height}
              selectedEntity={selectedEntity}
              selectedTab={tab}
              filters={filters}
              onChainFilters={onChainFilters}
              flowDirection={flowDirection}
              influenceFilter={influenceFilter}
              dateRange={dateRange}
              onHopLevelChange={setCurrentHopLevel}
            >
              {selectedEntity && (
                <>
                  <FilterPopup
                    tab={tab}
                    filters={filters}
                    onFilterChange={(filterName) => {
                      const key = filterName as keyof typeof filters;
                      setFilters((prev) => ({
                        ...prev,
                        [key]: !prev[key],
                      }));
                    }}
                    onChainFilters={onChainFilters}
                    onOnChainFilterChange={(filterName) => {
                      setOnChainFilters((prev) => ({
                        ...prev,
                        [filterName]: !prev[filterName],
                      }));
                    }}
                    flowDirection={flowDirection}
                    onFlowDirectionChange={setFlowDirection}
                  />
                  {tab === "influence" && (
                    <SocialLinksFilter
                      currentFilter={influenceFilter}
                      onFilterChange={(filterName) => {
                        setInfluenceFilter(filterName);
                      }}
                    />
                  )}
                  <div
                    style={{
                      position: "absolute",
                      bottom: "24px",
                      left: "24px",
                      right: "24px",
                      zIndex: 10,
                    }}
                  >
                    <TimeRangeSlider
                      minDate={new Date(2018, 0, 1)}
                      maxDate={new Date()}
                      onRangeChange={handleDateRangeChange}
                    />
                  </div>
                </>
              )}
            </ForceGraph>
          )}
        </GraphWrapper>
      </MainScreen>
      {selectedEntity && tab === "ecosystem" && (
        <EcosystemTable
          selectedEntity={selectedEntity}
          relationsData={getRelationsData().filter((item) => {
            if (filters.persons && item.type === "persons") return true;
            if (filters.funds && item.type === "funds") return true;
            if (filters.projects && item.type === "projects") return true;
            return false;
          })}
          filters={filters}
          dateRange={dateRange}
          hopLevel={currentHopLevel}
        />
      )}
      {selectedEntity && tab === "influence" && (
        <InfluenceTable
          selectedEntity={selectedEntity}
          influenceRelationsData={getInfluenceRelationsData()}
          influenceFilter={influenceFilter}
          dateRange={dateRange}
          hopLevel={currentHopLevel}
        />
      )}
      {selectedEntity && tab === "on-chain" && (
        <OnChainTable
          selectedEntity={selectedEntity}
          transfersData={getOnChainTransfersData()}
          hopLevel={currentHopLevel}
          onChainFilters={onChainFilters}
          flowDirection={flowDirection}
          dateRange={dateRange}
        />
      )}
    </PageWrapper>
  );
};

export default ConnectionGraph;
