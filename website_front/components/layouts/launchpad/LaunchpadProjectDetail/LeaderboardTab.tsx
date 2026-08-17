import React from "react";
import {
  Card,
  CardTitle,
  LbCardHeader,
  LbCardTitle,
  LbTable,
  LbTableScroller,
  LbRow,
  LbRankCell,
  LbWalletCell,
  LbFixedCell,
  LbZoneCell,
  LbHeaderText,
  LbHeaderTextLeft,
  LbRankText,
  LbAvatarWrap,
  LbAvatar,
  LbLevelBadge,
  LbMedalWrap,
  LbUsername,
  LbCellText,
  LbZonePill,
  LbPagination,
  LbPaginationLeft,
  LbChevronBtn,
  LbPages,
  LbPageBtn,
  LbPageInfo,
  LbFooterNote,
  LbFooterNoteText,
  FaqContent,
  FaqItemWrapper,
  FaqDivider,
  FaqQuestion,
  FaqQuestionText,
  FaqAnswer,
  FaqChevron,
  RiskNotice,
  RiskNoticeInner,
  RiskNoticeContent,
  RiskNoticeTitle,
  RiskNoticeText,
} from "./styles";
import { LaunchpadProjectDetailData } from "./types";
import {
  IconTrophy,
  IconMedalGold,
  IconMedalSilver,
  IconMedalBronze,
  IconChevronLeft,
  IconChevronRight,
  IconChevronUp,
  IconChevronDown,
  IconAlert,
} from "../../../global/Icons/Launchpad/icons";
import Pagination from "../../../global/Pagintaion";

interface LeaderboardTabProps {
  project: LaunchpadProjectDetailData;
  lbPage: number;
  onLbPageChange: (updater: (p: number) => number) => void;
  onLbPageSet: (page: number) => void;
  openFaqId: string | null;
  onFaqToggle: (id: string) => void;
}

const LEADERBOARD_PAGE_SIZE = 10;

const LeaderboardTab: React.FC<LeaderboardTabProps> = ({
  project,
  lbPage,
  onLbPageChange,
  onLbPageSet,
  openFaqId,
  onFaqToggle,
}) => (
  <>
    <Card>
      <LbCardHeader>
        <IconTrophy />
        <LbCardTitle>Allocation Leaderboard</LbCardTitle>
      </LbCardHeader>

      <LbTableScroller>
        <LbTable>
          <LbRow $isHeader>
            <LbRankCell><LbHeaderText>Rank</LbHeaderText></LbRankCell>
            <LbWalletCell><LbHeaderTextLeft>Wallet</LbHeaderTextLeft></LbWalletCell>
            <LbFixedCell><LbHeaderText>NFTs Staked</LbHeaderText></LbFixedCell>
            <LbFixedCell><LbHeaderText>Allocation</LbHeaderText></LbFixedCell>
            <LbZoneCell><LbHeaderText>Zone</LbHeaderText></LbZoneCell>
          </LbRow>

          {project.leaderboard
            .slice((Math.max(1, lbPage) - 1) * LEADERBOARD_PAGE_SIZE, Math.max(1, lbPage) * LEADERBOARD_PAGE_SIZE)
            .map((entry) => (
            <LbRow key={entry.rank} $isCurrentUser={entry.isCurrentUser}>
              <LbRankCell>
                <LbRankText $isCurrentUser={entry.isCurrentUser}>{entry.rank}</LbRankText>
              </LbRankCell>

              <LbWalletCell>
                <LbAvatarWrap>
                  {entry.avatar && <LbAvatar src={entry.avatar} alt={entry.name} />}
                  <LbLevelBadge>{entry.nftLevel}</LbLevelBadge>
                  {entry.rank === 1 && <LbMedalWrap><IconMedalGold /></LbMedalWrap>}
                  {entry.rank === 2 && <LbMedalWrap><IconMedalSilver /></LbMedalWrap>}
                  {entry.rank === 3 && <LbMedalWrap><IconMedalBronze /></LbMedalWrap>}
                </LbAvatarWrap>
                <LbUsername>{entry.name}</LbUsername>
              </LbWalletCell>

              <LbFixedCell>
                <LbCellText>{entry.nftsStaked}</LbCellText>
              </LbFixedCell>

              <LbFixedCell>
                <LbCellText>{entry.allocation}</LbCellText>
              </LbFixedCell>

              <LbZoneCell>
                <LbZonePill $zone={entry.zone} $isCurrentUser={entry.isCurrentUser}>
                  {entry.zone.charAt(0).toUpperCase() + entry.zone.slice(1)}
                </LbZonePill>
              </LbZoneCell>
            </LbRow>
            ))}
        </LbTable>
      </LbTableScroller>

      <Pagination
        page={lbPage}
        total={project.leaderboard.length}
        onChange={(p) => onLbPageSet(p)}
        totalPage={Math.max(1, Math.ceil(project.leaderboard.length / LEADERBOARD_PAGE_SIZE))}
        limit={LEADERBOARD_PAGE_SIZE}
      />

      <LbFooterNote>
        <LbFooterNoteText>
          <strong>{"NFT staking determines your allocation priority. "}</strong>
          {"The more FOMO NFTs you stake, the higher your position in the leaderboard and the better your allocation zone."}
        </LbFooterNoteText>
      </LbFooterNote>
    </Card>

    <Card>
      <CardTitle>Frequently Asked Questions</CardTitle>
      <FaqContent>
        {project.faq.map((item, index) => (
          <FaqItemWrapper key={item.id}>
            {index > 0 && <FaqDivider style={{ marginBottom: 20 }} />}
            <FaqQuestion onClick={() => onFaqToggle(item.id)} style={{ cursor: "pointer" }}>
              <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: 20 }}>
                <FaqQuestionText>{item.question}</FaqQuestionText>
                {openFaqId === item.id && item.answer && (
                  <FaqAnswer>{item.answer}</FaqAnswer>
                )}
              </div>
              <FaqChevron>
                {openFaqId === item.id ? <IconChevronUp /> : <IconChevronDown />}
              </FaqChevron>
            </FaqQuestion>
          </FaqItemWrapper>
        ))}
        <FaqDivider />
      </FaqContent>
    </Card>

    <RiskNotice>
      <RiskNoticeInner>
        <IconAlert />
        <RiskNoticeContent>
          <RiskNoticeTitle>Risk Notice</RiskNoticeTitle>
          <RiskNoticeText>
            Participating in token sales involves significant risk. The value of tokens can fluctuate, and you may
            lose some or all of your investment. Do your own research before participating. This is not financial
            advice.
          </RiskNoticeText>
        </RiskNoticeContent>
      </RiskNoticeInner>
    </RiskNotice>
  </>
);

export default LeaderboardTab;
