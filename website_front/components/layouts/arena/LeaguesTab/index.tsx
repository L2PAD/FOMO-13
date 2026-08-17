import React, { useState } from "react";
import {
  SnapshotHeader,
  RankBadge,
  SnapshotStats,
  SnapshotStat,
  QuickTipsSection,
  LeaderboardSearch,
  LeaderboardUser,
  LeaderboardName,
  HowItWorks,
  Note,
} from "../arena-tab/styles";
import {
  LeaguesContainer,
  LeaguesTableWrapper,
  LeaguesTable,
  LeaguesTableHead,
  LeaguesTableBody,
  LeaguesRank,
  LeaguesUserCell,
  LeaguesMetric,
  LeaguesAccuracyBar,
  LeaguesActionsCell,
  LeaguesActionButton,
  LeaguesSnapshotCard,
  LeaguesSnapshotCardSection,
} from "./styles";
import Pagination from "../../../global/Pagintaion";
import { HelpCircle, Info, Search } from "lucide-react";
import mock1 from "../../../../assets/images/nft/shark.png";
import UserHoverCard from "../UserHoverCard";
import UserAvatar from "../../../global/common/UserAvatar";
import Trophy from "../../../global/Icons/Trophy";
import Arrow from "../../../global/Icons/Arrow";
import League from "../../../global/Icons/League";
import Accuracy from "../../../global/Icons/Accuracy";
import { LeagueScoringModal } from "./LeagueScoringModal";
import { CreateDuelModal } from "./CreateDuelModal";
import { UserProfileModal } from "./UserProfileModal";

interface LeagueUser {
  id: number;
  name: string;
  avatar: string;
  roi: number;
  accuracy: number;
  leaguePoints: number;
}

const leagueUsers: LeagueUser[] = [
  {
    id: 1,
    name: "Dark Shark",
    avatar: mock1.src,
    roi: 147.5,
    accuracy: 89,
    leaguePoints: 9450,
  },
  {
    id: 2,
    name: "Dark Shark",
    avatar: mock1.src,
    roi: 132.8,
    accuracy: 87,
    leaguePoints: 9120,
  },
  {
    id: 3,
    name: "Dark Shark",
    avatar: mock1.src,
    roi: 115.2,
    accuracy: 86,
    leaguePoints: 8340,
  },
  {
    id: 4,
    name: "Dark Shark",
    avatar: mock1.src,
    roi: 128.4,
    accuracy: 85,
    leaguePoints: 8890,
  },
  {
    id: 5,
    name: "Dark Shark",
    avatar: mock1.src,
    roi: 119.7,
    accuracy: 84,
    leaguePoints: 8560,
  },
  {
    id: 6,
    name: "Dark Shark",
    avatar: mock1.src,
    roi: 102.3,
    accuracy: 83,
    leaguePoints: 7890,
  },
  {
    id: 7,
    name: "Dark Shark",
    avatar: mock1.src,
    roi: 108.9,
    accuracy: 82,
    leaguePoints: 8120,
  },
  {
    id: 8,
    name: "Dark Shark",
    avatar: mock1.src,
    roi: 98.7,
    accuracy: 81,
    leaguePoints: 8190,
  },
  {
    id: 9,
    name: "Dark Shark",
    avatar: mock1.src,
    roi: 94.3,
    accuracy: 80,
    leaguePoints: 7560,
  },
  {
    id: 10,
    name: "Dark Shark",
    avatar: mock1.src,
    roi: 92.1,
    accuracy: 79,
    leaguePoints: 8330,
  },
];

export const LeaguesTab: React.FC = () => {
  const [searchTerm, setSearchTerm] = useState("");
  const [isScoringModalOpen, setIsScoringModalOpen] = useState(false);
  const [isDuelModalOpen, setIsDuelModalOpen] = useState(false);
  const [selectedOpponent, setSelectedOpponent] = useState("");
  const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<LeagueUser | null>(null);

  const filteredUsers = leagueUsers.filter((user) =>
    user.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleChallengeClick = (userName: string) => {
    setSelectedOpponent(userName);
    setIsDuelModalOpen(true);
  };

  const handleViewProfile = (user: LeagueUser) => {
    setSelectedUser(user);
    setIsProfileModalOpen(true);
  };

  return (
    <LeaguesContainer>
      <LeaguesTableWrapper>
        <div
          style={{
            overflowX: "auto",
          }}
        >
          <LeaguesTable>
            <LeaguesTableHead>
              <tr>
                <th style={{ width: "40px" }}></th>
                <th style={{ width: "200px" }}>
                  <LeaderboardSearch
                    style={{
                      padding: 0,
                      position: "relative",
                      width: "calc(100% + 60px)",
                      marginLeft: "-40px",
                    }}
                  >
                    <Search color="#738094" />
                    <input placeholder="Search by name" />
                  </LeaderboardSearch>
                </th>
                <th>ROI %</th>
                <th>Accuracy</th>
                <th>League Points</th>
                <th style={{ width: "181px", textAlign: "right" }}>Actions</th>
              </tr>
            </LeaguesTableHead>
            <LeaguesTableBody>
              {filteredUsers.map((user, index) => (
                <tr key={user.id}>
                  <LeaguesRank>
                    <span>{index + 1}</span>
                  </LeaguesRank>
                  <LeaguesUserCell>
                    <div>
                      <UserHoverCard
                        userName={user.name}
                        userAvatar={user.avatar}
                      >
                        <LeaderboardUser>
                          <UserAvatar
                            avatar={user.avatar}
                            size="otc"
                            variant="success"
                            rating={94}
                          />
                          <LeaderboardName>{user.name}</LeaderboardName>
                        </LeaderboardUser>
                      </UserHoverCard>
                    </div>
                  </LeaguesUserCell>
                  <LeaguesMetric positive={user.roi > 100}>
                    +{user.roi.toFixed(1)}%
                  </LeaguesMetric>
                  <LeaguesMetric>
                    <LeaguesAccuracyBar>
                      <div className="bar">
                        <div
                          className="fill"
                          style={{ width: `${user.accuracy}%` }}
                        />
                      </div>
                      <div className="percent">{user.accuracy}%</div>
                    </LeaguesAccuracyBar>
                  </LeaguesMetric>
                  <LeaguesMetric>
                    {user.leaguePoints.toLocaleString()}
                  </LeaguesMetric>
                  <LeaguesActionsCell>
                    <LeaguesActionButton
                      onClick={() => handleViewProfile(user)}
                    >
                      View Profile
                    </LeaguesActionButton>
                    <LeaguesActionButton
                      className="challenge"
                      onClick={() => handleChallengeClick(user.name)}
                    >
                      Challenge
                    </LeaguesActionButton>
                  </LeaguesActionsCell>
                </tr>
              ))}
            </LeaguesTableBody>
          </LeaguesTable>
        </div>

        <Pagination
          page={1}
          totalPage={84}
          onChange={() => {}}
          limit={10}
          total={840}
        />
      </LeaguesTableWrapper>

      <LeaguesSnapshotCardSection>
        <LeaguesSnapshotCard>
          <SnapshotHeader>
            <h3>
              <Trophy />
              Season Snapshot
            </h3>
            <HowItWorks onClick={() => setIsScoringModalOpen(true)}>
              <Info size={16} color="#738094" />
              <span>How it works</span>
            </HowItWorks>
          </SnapshotHeader>

          <RankBadge>
            <div className="rank">#42 / 983</div>
            <div className="label">Current Rank</div>
            <div className="tier">Top 5%</div>
          </RankBadge>

          <SnapshotStats>
            <SnapshotStat>
              <div className="label">
                <Arrow />
                <span>Season ROI</span>
                <button className="tooltip-button" style={{}}>
                  <Info size={16} color="#738094" />
                  <span
                    className="tooltip-text right"
                    style={{
                      width: 200,
                      whiteSpace: "wrap",
                    }}
                  >
                    Your total return on investment this season
                  </span>
                </button>
              </div>
              <div className="value">+68.5%</div>
            </SnapshotStat>
            <SnapshotStat>
              <div className="label">
                <Accuracy /> Accuracy
              </div>
              <div className="value">76%</div>
            </SnapshotStat>
            <SnapshotStat>
              <div className="label">
                <League /> League Points
              </div>
              <div className="value">5,240</div>
            </SnapshotStat>
          </SnapshotStats>

          <Note>
            Keep predicting to climb the ranks! Top 10 analysts win NFT trophies
            at season end.
          </Note>
        </LeaguesSnapshotCard>
        <QuickTipsSection>
          <h4>Quick Tips</h4>
          <ul>
            <li>Higher stakes in duels mean bigger rewards</li>
            <li>Follow top analysts to learn winning strategies</li>
            <li>Consistent accuracy beats high ROI on single bets</li>
            <li>Challenge rivals to climb the leaderboard faster</li>
          </ul>
        </QuickTipsSection>
      </LeaguesSnapshotCardSection>

      <LeagueScoringModal
        isOpen={isScoringModalOpen}
        onClose={() => setIsScoringModalOpen(false)}
      />
      <CreateDuelModal
        isOpen={isDuelModalOpen}
        onClose={() => setIsDuelModalOpen(false)}
        opponentName={selectedOpponent}
      />
      {selectedUser && (
        <UserProfileModal
          isOpen={isProfileModalOpen}
          onClose={() => setIsProfileModalOpen(false)}
          user={{
            name: selectedUser.name,
            avatar: selectedUser.avatar,
            rank: leagueUsers.findIndex((u) => u.id === selectedUser.id) + 1,
            topPercent: "Top 1%",
            points: selectedUser.leaguePoints,
            totalPredictions: 147,
            currentStreak: 12,
            winRate: selectedUser.accuracy,
            roi: selectedUser.roi,
            roiDescription: `Consistent growth over ${147} predictions`,
            topPredictions: [
              { text: "BTC hits $100K by March", roi: "+245%" },
              { text: "Fed rate cut in Q1", roi: "+189%" },
              { text: "ETH surpasses $5K", roi: "+156%" },
              { text: "S&P 500 reaches ATH", roi: "+134%" },
            ],
          }}
        />
      )}
    </LeaguesContainer>
  );
};
