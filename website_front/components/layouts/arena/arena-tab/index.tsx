import React from "react";
import {
  PredictionsGrid,
  LiveBetsSection,
  LiveBetsHeader,
  LiveBetsList,
  LiveBetCard,
  LiveBetLeft,
  LiveBetInfo,
  LiveBetTitle,
  LiveBetSubtitle,
  LiveBetUserRow,
  LiveBetText,
  LiveBetOdds,
  LiveBetRight,
  InfoBlock,
  LeaderboardSection,
  LeaderboardTabs,
  LeaderboardSearch,
  LeaderboardList,
  LeaderboardRow,
  LeaderboardRank,
  LeaderboardUser,
  LeaderboardName,
  LeaderboardProfit,
} from "./styles";
import PredictionCard from "../prediction-card/PredictionCard";
import mock1 from "../../../../assets/images/nft/alverse.png";
import mock2 from "../../../../assets/images/nft/shark.png";
import mock3 from "../../../../assets/images/nft/starter.png";
import mock4 from "../../../../assets/images/nft/shark2.png";
import Pagination from "../../../global/Pagintaion";
import { ArrowRight, Search, ArrowUpDown } from "lucide-react";
import CustomDropdown from "../../../UI/CustomDropdown";
import UserAvatar from "../../../global/common/UserAvatar";
import UserHoverCard from "../UserHoverCard";
import CommentBlock from "../../../global/CommentBlock";
import { TimeButton } from "../../../global/common/PriceChart/styles";
import { useRouter } from "next/navigation";

export const liveBets = [
  {
    id: 1,
    project: "Ethereum above __ at the end of 2025?",
    user: "Sarah Thompson",
    amount: 100,
    betLabel: "Yes",
    odds: "1.7x",
    time: "now",
    accent: "green",
    icon: mock1.src,
  },
  {
    id: 2,
    project: "SharkRace Club",
    subtitle: "TGE – March 8, 2026",
    user: "Sarah Thompson",
    amount: 100,
    betLabel: "72%",
    odds: "1.4x",
    time: "1m ago",
    accent: "green",
    icon: mock2.src,
  },
  {
    id: 3,
    project: "Ethereum above __ at the end of 2025?",
    user: "Sarah Thompson",
    amount: 100,
    betLabel: "No",
    odds: "2.7x",
    time: "2m ago",
    accent: "red",
    icon: mock3.src,
  },
  {
    id: 4,
    project: "SharkRace Club",
    subtitle: "TGE – March 8, 2026",
    user: "Sarah Thompson",
    amount: 100,
    betLabel: "72%",
    odds: "1.5x",
    time: "1h ago",
    accent: "green",
    icon: mock4.src,
  },
  {
    id: 5,
    project: "Ethereum above __ at the end of 2025?",
    user: "Sarah Thompson",
    amount: 100,
    betLabel: "Yes",
    odds: "2.1x",
    time: "1d ago",
    accent: "green",
    icon: mock1.src,
  },
  {
    id: 6,
    project: "SharkRace Club",
    subtitle: "TGE – March 8, 2026",
    user: "Sarah Thompson",
    amount: 100,
    betLabel: "72%",
    odds: "5.7x",
    time: "2d ago",
    accent: "red",
    icon: mock2.src,
  },
  {
    id: 7,
    project: "Ethereum above __ at the end of 2025?",
    user: "Sarah Thompson",
    amount: 100,
    betLabel: "No",
    odds: "2.7x",
    time: "1w ago",
    accent: "red",
    icon: mock3.src,
  },
  {
    id: 8,
    project: "SharkRace Club",
    subtitle: "TGE – March 8, 2026",
    user: "Sarah Thompson",
    amount: 100,
    betLabel: "72%",
    odds: "2.7x",
    time: "2mth ago",
    accent: "green",
    icon: mock4.src,
  },
];

export const leaderboard = [
  { id: 1, name: "Dark Shark", score: 94, profit: 1560492, volume: 2340000, avatar: mock2.src },
  { id: 2, name: "Dark Shark", score: 94, profit: 1460492, volume: 2120000, avatar: mock2.src },
  { id: 3, name: "Dark Shark", score: 94, profit: 1360492, volume: 1980000, avatar: mock2.src },
  { id: 4, name: "Dark Shark", score: 94, profit: 1260492, volume: 1820000, avatar: mock2.src },
  { id: 5, name: "Dark Shark", score: 94, profit: 1160492, volume: 1650000, avatar: mock2.src },
  { id: 6, name: "Dark Shark", score: 94, profit: 1060492, volume: 1420000, avatar: mock2.src },
  { id: 7, name: "Dark Shark", score: 94, profit: 960492, volume: 1280000, avatar: mock2.src },
  { id: 8, name: "Dark Shark", score: 94, profit: 860492, volume: 1150000, avatar: mock2.src },
];

const mockPredictions = [
  {
    id: 1,
    type: "percentage" as const,
    title: "SharkRace Club",
    subtitle: "NFT & Collectibles",
    logo: mock2.src,
    status: "Active" as const,
    risk: "Medium" as const,
    tgeDate: "Mar 8, 2026",
    marketCap: "$5.2M",
    hype: "High" as const,
    author: {
      name: "Jessica Monroe",
      avatar: mock1.src,
    },
    percentages: {
      positive: 72,
      negative: 28,
    },
    sentiment: {
      sentiment: "Bullish" as const,
      description: "Strong upward momentum with growing attention.",
      momentumIndicator: "+0.62",
      attentionIndex: "78/100",
      consensusStrength: "Moderate" as const,
      volatilityPressure: "Medium" as const,
      narrativeDirection: "Expanding",
      fullDescription:
        "Current market signals indicate a positive medium-term momentum for Ethereum. Activity around ETH remains elevated, supported by institutional interest, ongoing Layer-2 development, and an overall improvement in the market narrative.",
    },
  },
  {
    id: 2,
    type: "yes-no" as const,
    title: "Ethereum above __ at the end of 2025?",
    logo: mock3.src,
    status: "Live" as const,
    risk: "Low" as const,
    author: {
      name: "FOMO",
      avatar: mock1.src,
    },
    yesNoOptions: [
      { threshold: "2,500", percentage: "100%" },
      { threshold: "3,000", percentage: "100%" },
    ],
    sentiment: {
      sentiment: "Bullish" as const,
      description: "Strong upward momentum with growing attention.",
      momentumIndicator: "+0.62",
      attentionIndex: "78/100",
      consensusStrength: "Moderate" as const,
      volatilityPressure: "Medium" as const,
      narrativeDirection: "Expanding",
      fullDescription:
        "Current market signals indicate a positive medium-term momentum for Ethereum. Activity around ETH remains elevated, supported by institutional interest, ongoing Layer-2 development, and an overall improvement in the market narrative.",
    },
  },
  {
    id: 3,
    type: "conditional" as const,
    title: "SharkRace Club",
    subtitle: "NFT & Collectibles",
    logo: mock4.src,
    status: "Active" as const,
    risk: "Medium" as const,
    tgeDate: "Mar 8, 2026",
    marketCap: "$5.2M",
    hype: "High" as const,
    author: {
      name: "Jessica Monroe",
      avatar: mock1.src,
    },
    conditional: {
      condition: "TGE FDV > $200M",
      result: "Price 7 days after TGE > $0.50",
    },
    sentiment: {
      sentiment: "Bullish" as const,
      description: "Strong upward momentum with growing attention.",
      momentumIndicator: "+0.62",
      attentionIndex: "78/100",
      consensusStrength: "Moderate" as const,
      volatilityPressure: "Medium" as const,
      narrativeDirection: "Expanding",
      fullDescription:
        "Current market signals indicate a positive medium-term momentum for Ethereum. Activity around ETH remains elevated, supported by institutional interest, ongoing Layer-2 development, and an overall improvement in the market narrative.",
    },
  },
  {
    id: 4,
    type: "chance" as const,
    title: "Will Lighter perform an airdrop by December 31?",
    logo: mock2.src,
    status: "Active" as const,
    risk: "High" as const,
    author: {
      name: "FOMO",
      avatar: mock1.src,
    },
    chance: {
      percentage: 84,
      label: "Chance",
    },
  },
];

export const filterOptions = [
  { value: "100", label: "$100+" },
  { value: "500", label: "$500+" },
  { value: "1000", label: "$1000+" },
  { value: "5000", label: "$5000+" },
];

export const ArenaTab: React.FC = () => {
  const router = useRouter();
  const [betFilter, setBetFilter] = React.useState<string>("100");
  const [leaderboardTab, setLeaderboardTab] = React.useState<string>("7D");
  const [leaderboardSort, setLeaderboardSort] = React.useState<"profit" | "volume">("profit");

  return (
    <>
      <PredictionsGrid>
        {[
          ...mockPredictions,
          ...mockPredictions,
          ...mockPredictions,
          ...mockPredictions,
        ].map((prediction) => (
          <PredictionCard key={prediction.id} {...prediction} />
        ))}
      </PredictionsGrid>
      <Pagination
        page={1}
        totalPage={10}
        onChange={() => { }}
        limit={5}
        total={50}
        style={{ marginTop: 20 }}
      />
      <InfoBlock>
        <LiveBetsSection>
          <LiveBetsHeader>
            <h2>
              <span></span> Live Bets
            </h2>
            <CustomDropdown
              options={filterOptions}
              value={betFilter}
              onChange={(value) => setBetFilter(value as string)}
              placeholder="100+"
              isShowSuccess={false}
              searchable={false}
              className="bet-filter-dropdown"
            />
          </LiveBetsHeader>

          <LiveBetsList>
            {liveBets.map((bet) => (
              <LiveBetCard key={bet.id}>
                <LiveBetLeft>
                  <UserAvatar
                    avatar={bet.icon}
                    size="medium"
                    variant="default"
                    className="image"
                  />
                  <LiveBetInfo>
                    <div className="title">
                      <LiveBetTitle>{bet.project}</LiveBetTitle>
                      {bet.subtitle && (
                        <LiveBetSubtitle>{bet.subtitle}</LiveBetSubtitle>
                      )}
                    </div>
                    <LiveBetUserRow>
                      <UserHoverCard userName={bet.user} userAvatar={bet.icon}>
                        <div className="user">
                          <UserAvatar
                            avatar={bet.icon}
                            size="xxSmall"
                            variant="default"
                          />
                          <p>{bet.user}</p>
                        </div>
                      </UserHoverCard>
                      <LiveBetText>
                        placed ${bet.amount} at{" "}
                        <LiveBetOdds accent={bet.accent as "green" | "red"}>
                          {bet.betLabel}
                        </LiveBetOdds>{" "}
                        (prediction odds {bet.odds})
                      </LiveBetText>
                    </LiveBetUserRow>
                  </LiveBetInfo>
                </LiveBetLeft>

                <LiveBetRight>
                  <span className="time">{bet.time}</span>

                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      router.push("/utility/arena/1");
                    }}
                  >
                    <ArrowRight size={18} color="#738094" />
                  </button>
                </LiveBetRight>
              </LiveBetCard>
            ))}
          </LiveBetsList>

          <Pagination
            page={1}
            totalPage={10}
            onChange={() => { }}
            limit={5}
            total={50}
          />
        </LiveBetsSection>

        <LeaderboardSection>
          <LiveBetsHeader>
            <h2>Leaderboard</h2>
            <LeaderboardTabs>
              <TimeButton
                active={leaderboardTab === "24H"}
                onClick={() => setLeaderboardTab("24H")}
              >
                24H
              </TimeButton>
              <TimeButton
                active={leaderboardTab === "7D"}
                onClick={() => setLeaderboardTab("7D")}
              >
                7D
              </TimeButton>
              <TimeButton
                active={leaderboardTab === "30D"}
                onClick={() => setLeaderboardTab("30D")}
              >
                30D
              </TimeButton>
              <TimeButton
                active={leaderboardTab === "All"}
                onClick={() => setLeaderboardTab("All")}
              >
                All
              </TimeButton>
            </LeaderboardTabs>
          </LiveBetsHeader>

          <div className="row">
            <LeaderboardSearch>
              <Search color="#738094" />
              <input placeholder="Search by name" />
            </LeaderboardSearch>
            <button
              onClick={() => setLeaderboardSort(prev => prev === "profit" ? "volume" : "profit")}
              style={{
                cursor: "pointer",
                userSelect: "none",
                display: "flex",
                alignItems: "center",
                gap: "6px",
                transition: "color 0.2s ease",
                background: "none",
                border: "none",
                color: "#728094",
                fontWeight: "var(--font-weight-semibold)",
                fontSize: "14px",
                padding: 0
              }}
              onMouseEnter={(e) => e.currentTarget.style.color = "#0F172A"}
              onMouseLeave={(e) => e.currentTarget.style.color = "#728094"}
            >
              {leaderboardSort === "profit" ? "Profit/Loss" : "Volume"}
              <ArrowUpDown size={14} />
            </button>
          </div>

          <LeaderboardList>
            {leaderboard.map((item) => (
              <LeaderboardRow key={item.id}>
                <LeaderboardRank>{item.id}</LeaderboardRank>
                <UserHoverCard userName={item.name} userAvatar={item.avatar}>
                  <LeaderboardUser>
                    <UserAvatar
                      avatar={item.avatar}
                      size="otc"
                      variant="success"
                      rating={94}
                    />
                    <LeaderboardName>{item.name}</LeaderboardName>
                  </LeaderboardUser>
                </UserHoverCard>
                <LeaderboardProfit>
                  {leaderboardSort === "profit"
                    ? `+$${item.profit.toLocaleString()}`
                    : `$${item.volume.toLocaleString()}`
                  }
                </LeaderboardProfit>
              </LeaderboardRow>
            ))}
          </LeaderboardList>

          <Pagination
            page={1}
            totalPage={84}
            onChange={() => { }}
            limit={10}
            total={840}
            style={{ marginTop: 20 }}
          />
        </LeaderboardSection>
      </InfoBlock>
      <CommentBlock />
    </>
  );
};
