import React from "react";
import {
  Card,
  LeaderboardHeader,
  LeaderboardTitle,
  LeaderboardTopLabel,
  LeaderboardList,
  LeaderboardRow,
  LeaderboardRank,
  LeaderboardUserCell,
  LeaderboardAvatarWrapper,
  LeaderboardAvatar,
  NftLevelBadge,
  LeaderboardUsername,
  LeaderboardNftCount,
  LeaderboardZoneBadge,
} from "./styles";
import { LeaderboardEntry } from "./types";
import { IconTrophy } from "../../../global/Icons/Launchpad/icons";

interface SidebarLeaderboardProps {
  leaderboard: LeaderboardEntry[];
}

const SidebarLeaderboard: React.FC<SidebarLeaderboardProps> = ({ leaderboard }) => (
  <Card>
    <LeaderboardHeader>
      <LeaderboardTitle>
        <IconTrophy />
        <p>Leaderboard</p>
      </LeaderboardTitle>
      <LeaderboardTopLabel>Top 10</LeaderboardTopLabel>
    </LeaderboardHeader>
    <LeaderboardList>
      {leaderboard.map((entry) => (
        <LeaderboardRow key={entry.rank} isCurrentUser={entry.isCurrentUser}>
          <LeaderboardRank isCurrentUser={entry.isCurrentUser}>{entry.rank}</LeaderboardRank>
          <LeaderboardUserCell>
            <LeaderboardAvatarWrapper>
              <LeaderboardAvatar>
                {entry.avatar ? <img src={entry.avatar} alt={entry.name} /> : null}
              </LeaderboardAvatar>
              <NftLevelBadge>
                <span>{entry.nftLevel}</span>
              </NftLevelBadge>
            </LeaderboardAvatarWrapper>
            <LeaderboardUsername>{entry.name}</LeaderboardUsername>
          </LeaderboardUserCell>
          <LeaderboardNftCount>{entry.nftCount} NFT</LeaderboardNftCount>
          <LeaderboardZoneBadge variant={entry.zone === "green" ? "green" : "yellow"}>
            <p>{entry.zone === "green" ? "Green" : entry.zone === "yellow" ? "Yellow" : "Red"}</p>
          </LeaderboardZoneBadge>
        </LeaderboardRow>
      ))}
    </LeaderboardList>
  </Card>
);

export default SidebarLeaderboard;
