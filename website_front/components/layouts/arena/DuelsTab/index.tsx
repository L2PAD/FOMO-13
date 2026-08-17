import React, { useState } from "react";
import {
  DuelsContainer,
  DuelsListWrapper,
  DuelsSummaryCard,
  SummaryHeader,
  ActiveDuelsCard,
  ActiveDuelsNumber,
  ActiveDuelsLabel,
  ActiveDuelsStatus,
  StatsRow,
  StatItem,
  SummarySection,
  SectionTitle,
  RivalsList,
  RivalItem,
  RivalStats,
  RivalStat,
  WinRateSection,
  WinRateLabel,
  WinRateBar,
  WinRateFill,
  DuelsNote,
  HostName,
  DuelsHistorySection,
  HistoryHeader,
  HistoryTabs,
  HistoryTab,
  HistoryList,
  HistoryItem,
  HistoryStatusBadge,
  HistoryContent,
  HistoryTitle,
  HistoryDetails,
  HistorySide,
  HistoryOpponent,
  HistoryResult,
  HistoryStatus,
} from "./styles";
import UserAvatar from "../../../global/common/UserAvatar";
import mock1 from "../../../../assets/images/nft/shark.png";
import Pagination from "../../../global/Pagintaion";
import { DuelCard } from "./DuelCard";
import UserHoverCard from "../UserHoverCard";
import { HostInfo } from "./DuelCard.styles";
import SwordsIcon from "../../../global/Icons/Swords";
import League from "../../../global/Icons/League";
import LeaguesTabIcon from "../../../global/Icons/LeaguesTabIcon";
import { QuickTipsSection } from "../arena-tab/styles";
import { DuelDetailsModal } from "./DuelDetailsModal";

interface Duel {
  id: number;
  side: "yes" | "no";
  isHighStakes: boolean;
  title: string;
  hostName: string;
  hostAvatar: string;
  stakePerSide: number;
  totalPot: number;
  timeLeft: string;
  status: "ends-soon" | "slot-free" | "no-slots";
  availableActions: ("join-yes" | "join-no" | "yes" | "no")[];
}

const duelsList: Duel[] = [
  {
    id: 1,
    side: "yes",
    isHighStakes: true,
    title: "BTC reaches $120K in Q2 2026",
    hostName: "Sarah Thompson",
    hostAvatar: mock1.src,
    stakePerSide: 1000,
    totalPot: 2000,
    timeLeft: "2h 15m",
    status: "ends-soon",
    availableActions: ["join-no"],
  },
  {
    id: 2,
    side: "no",
    isHighStakes: false,
    title: "ETH flips BTC by market cap",
    hostName: "Benjamin Knight",
    hostAvatar: mock1.src,
    stakePerSide: 50,
    totalPot: 100,
    timeLeft: "5h 30m",
    status: "slot-free",
    availableActions: ["join-yes"],
  },
  {
    id: 3,
    side: "yes",
    isHighStakes: true,
    title: "BTC reaches $120K in Q2 2026",
    hostName: "Jackson Adams",
    hostAvatar: mock1.src,
    stakePerSide: 1000,
    totalPot: 2000,
    timeLeft: "2h 15m",
    status: "no-slots",
    availableActions: ["yes", "no"],
  },
  {
    id: 4,
    side: "yes",
    isHighStakes: false,
    title: "Ethereum above 3,000 at the end of Jan 2026",
    hostName: "Lucas Williams",
    hostAvatar: mock1.src,
    stakePerSide: 1000,
    totalPot: 2000,
    timeLeft: "22d 4h",
    status: "slot-free",
    availableActions: ["join-no"],
  },
  {
    id: 5,
    side: "no",
    isHighStakes: true,
    title: "BTC reaches $120K in Q2 2026",
    hostName: "Sarah Thompson",
    hostAvatar: mock1.src,
    stakePerSide: 1000,
    totalPot: 2000,
    timeLeft: "2h 15m",
    status: "slot-free",
    availableActions: ["join-yes"],
  },
  {
    id: 6,
    side: "yes",
    isHighStakes: false,
    title: "BTC reaches $120K in Q2 2026",
    hostName: "Sarah Thompson",
    hostAvatar: mock1.src,
    stakePerSide: 1000,
    totalPot: 2000,
    timeLeft: "2h 15m",
    status: "ends-soon",
    availableActions: ["join-no"],
  },
];

const topRivals = [
  { name: "Lucas Williams", avatar: mock1.src, streakWins: 5, losses: 3 },
  { name: "Benjamin Knight", avatar: mock1.src, streakWins: 4, losses: 2 },
  { name: "Jackson Adams", avatar: mock1.src, streakWins: 3, losses: 4 },
];

interface DuelHistory {
  id: number;
  status: "won" | "lost" | "active" | "pending" | "declined" | "cancelled";
  title: string;
  yourSide: "yes" | "no";
  opponentName: string;
  opponentAvatar: string;
  stake: number;
  result?: number;
  statusText?: string;
  duelId?: string;
  createdDate?: string;
  startedDate?: string;
  settledDate?: string;
  resolutionText?: string;
  isYouHost?: boolean;
  opponentSide?: "yes" | "no";
}

const duelsHistory: DuelHistory[] = [
  {
    id: 1,
    status: "won",
    title: "BTC reaches $120K in Q2 2026",
    yourSide: "yes",
    opponentName: "Jackson Adams",
    opponentAvatar: mock1.src,
    stake: 100,
    result: 100,
    duelId: "1",
    createdDate: "March 1, 2026",
    startedDate: "January 1, 2026",
    settledDate: "March 15, 2026",
    resolutionText: "BTC reached $125K on March 15, 2026",
    isYouHost: true,
    opponentSide: "no",
  },
  {
    id: 2,
    status: "lost",
    title: "ETH flips BTC by market cap",
    yourSide: "no",
    opponentName: "Benjamin Knight",
    opponentAvatar: mock1.src,
    stake: 50,
    result: -50,
  },
  {
    id: 3,
    status: "active",
    title: "Fed raises rates in March",
    yourSide: "no",
    opponentName: "Lucas Williams",
    opponentAvatar: mock1.src,
    stake: 1000,
    statusText: "In progress",
  },
  {
    id: 4,
    status: "pending",
    title: "SOL surpasses $500",
    yourSide: "yes",
    opponentName: "Sarah Thompson",
    opponentAvatar: mock1.src,
    stake: 500,
  },
  {
    id: 5,
    status: "declined",
    title: "DOGE hits $1 by end of year",
    yourSide: "yes",
    opponentName: "Jackson Adams",
    opponentAvatar: mock1.src,
    stake: 200,
  },
  {
    id: 6,
    status: "cancelled",
    title: "S&P 500 correction >10%",
    yourSide: "yes",
    opponentName: "Benjamin Knight",
    opponentAvatar: mock1.src,
    stake: 150,
  },
];

export const DuelsTab: React.FC = () => {
  const [historyTab, setHistoryTab] = useState<"all" | "active" | "settled">(
    "all"
  );
  const [selectedDuel, setSelectedDuel] = useState<DuelHistory | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const handleDuelClick = (duel: DuelHistory) => {
    setSelectedDuel(duel);
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setSelectedDuel(null);
  };

  return (
    <DuelsContainer>
      <div className="container">
        <DuelsListWrapper>
          {duelsList.map((duel) => (
            <DuelCard
              key={duel.id}
              side={duel.side}
              isHighStakes={duel.isHighStakes}
              title={duel.title}
              hostName={duel.hostName}
              hostAvatar={duel.hostAvatar}
              stakePerSide={duel.stakePerSide}
              totalPot={duel.totalPot}
              timeLeft={duel.timeLeft}
              status={duel.status}
              availableActions={duel.availableActions}
            />
          ))}

          <Pagination
            page={1}
            totalPage={10}
            onChange={() => {}}
            limit={10}
            total={100}
          />
        </DuelsListWrapper>

        <DuelsHistorySection>
          <HistoryHeader>
            <h2>Duels History</h2>
            <HistoryTabs>
              <HistoryTab
                $active={historyTab === "all"}
                onClick={() => setHistoryTab("all")}
              >
                All
              </HistoryTab>
              <HistoryTab
                $active={historyTab === "active"}
                onClick={() => setHistoryTab("active")}
              >
                Active
              </HistoryTab>
              <HistoryTab
                $active={historyTab === "settled"}
                onClick={() => setHistoryTab("settled")}
              >
                Settled
              </HistoryTab>
            </HistoryTabs>
          </HistoryHeader>

          <HistoryList>
            {duelsHistory.map((item) => (
              <HistoryItem key={item.id} onClick={() => handleDuelClick(item)}>
                <HistoryStatusBadge $status={item.status}>
                  {item.status.charAt(0).toUpperCase() + item.status.slice(1)}
                </HistoryStatusBadge>

                <HistoryContent>
                  <HistoryTitle>{item.title}</HistoryTitle>
                  <HistoryDetails>
                    <span>
                      You:{" "}
                      <HistorySide $side={item.yourSide}>
                        {item.yourSide.charAt(0).toUpperCase() +
                          item.yourSide.slice(1)}
                      </HistorySide>
                    </span>
                    <span className="divider" />
                    <UserHoverCard
                      userName={item.opponentName}
                      userAvatar={item.opponentAvatar}
                    >
                      <HistoryOpponent>
                        <UserAvatar
                          avatar={item.opponentAvatar}
                          size="xxSmall"
                          variant="default"
                        />
                        <span>{item.opponentName}</span>
                      </HistoryOpponent>
                    </UserHoverCard>
                    <span className="divider" />
                    <span>{item.stake} USDT each</span>
                  </HistoryDetails>
                </HistoryContent>

                {item.result !== undefined ? (
                  <HistoryResult $isPositive={item.result > 0}>
                    {item.result > 0 ? "+" : ""}
                    {item.result} USDT
                  </HistoryResult>
                ) : item.status === "active" ? (
                  <HistoryStatus>
                    {item.statusText || "In progress"}
                  </HistoryStatus>
                ) : null}
              </HistoryItem>
            ))}
          </HistoryList>

          <Pagination
            page={1}
            totalPage={10}
            onChange={() => {}}
            limit={6}
            total={6}
          />
        </DuelsHistorySection>
      </div>
      <div
        style={{
          position: "sticky",
          top: "20px",
          height: "fit-content",
        }}
      >
        <DuelsSummaryCard>
          <SummaryHeader>
            <SwordsIcon />
            <h3>Duels Summary</h3>
          </SummaryHeader>

          <ActiveDuelsCard>
            <ActiveDuelsNumber>12</ActiveDuelsNumber>
            <ActiveDuelsLabel>Active Duels</ActiveDuelsLabel>
            <ActiveDuelsStatus>In Progress</ActiveDuelsStatus>
          </ActiveDuelsCard>

          <StatsRow>
            <StatItem>
              <div className="value">34</div>
              <div className="label">Total Wins</div>
            </StatItem>
            <StatItem className="red">
              <div className="value">18</div>
              <div className="label">Total Losses</div>
            </StatItem>
            <StatItem>
              <div className="value">8 wins</div>
              <div className="label">Best Streak</div>
            </StatItem>
          </StatsRow>

          <SummarySection>
            <SectionTitle>
              <LeaguesTabIcon size={24} color="#05A584" />
              Top Rivals
            </SectionTitle>
            <RivalsList>
              {topRivals.map((rival, index) => (
                <RivalItem key={index}>
                  <UserHoverCard
                    userName={rival.name}
                    userAvatar={rival.avatar}
                  >
                    <div
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: "12px",
                      }}
                    >
                      <UserAvatar
                        avatar={rival.avatar}
                        size="otc"
                        variant="default"
                      />
                      <HostInfo>
                        <HostName>{rival.name}</HostName>
                      </HostInfo>
                    </div>
                  </UserHoverCard>
                  <RivalStats>
                    <RivalStat $variant="success">
                      {rival.streakWins}W
                    </RivalStat>
                    <RivalStat $variant="danger">{rival.losses}L</RivalStat>
                  </RivalStats>
                </RivalItem>
              ))}
            </RivalsList>
          </SummarySection>

          <WinRateSection>
            <WinRateLabel>
              <span className="label">Win Rate</span>
              <span className="value">65%</span>
            </WinRateLabel>
            <WinRateBar>
              <WinRateFill $percentage={65} />
            </WinRateBar>
          </WinRateSection>

          <DuelsNote>
            Only equal-stake, same-market duels count towards your record.
          </DuelsNote>
        </DuelsSummaryCard>{" "}
        <QuickTipsSection>
          <h4>Quick Tips</h4>
          <ul>
            <li>Higher stakes in duels mean bigger rewards</li>
            <li>Follow top analysts to learn winning strategies</li>
            <li>Consistent accuracy beats high ROI on single bets</li>
            <li>Challenge rivals to climb the leaderboard faster</li>
          </ul>
        </QuickTipsSection>
      </div>

      {selectedDuel && (
        <DuelDetailsModal
          isOpen={isModalOpen}
          onClose={closeModal}
          duel={{
            id: selectedDuel.id,
            status: selectedDuel.status,
            title: selectedDuel.title,
            duelId: selectedDuel.duelId || String(selectedDuel.id),
            createdDate: selectedDuel.createdDate || "January 1, 2026",
            yourSide: selectedDuel.yourSide,
            yourStake: selectedDuel.stake,
            yourResult: selectedDuel.result,
            opponentName: selectedDuel.opponentName,
            opponentAvatar: selectedDuel.opponentAvatar,
            opponentSide:
              selectedDuel.opponentSide ||
              (selectedDuel.yourSide === "yes" ? "no" : "yes"),
            opponentStake: selectedDuel.stake,
            opponentResult:
              selectedDuel.result !== undefined
                ? -selectedDuel.result
                : undefined,
            totalPot: selectedDuel.stake * 2,
            startedDate: selectedDuel.startedDate || "January 1, 2026",
            settledDate: selectedDuel.settledDate,
            resolutionText: selectedDuel.resolutionText,
            isYouHost: selectedDuel.isYouHost || false,
          }}
        />
      )}
    </DuelsContainer>
  );
};
