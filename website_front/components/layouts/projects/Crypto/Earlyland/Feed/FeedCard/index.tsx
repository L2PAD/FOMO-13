import React, { FC } from "react";
import { StarIcon } from "../../../../../../global/Icons";
import FireIcon from "../../../../../../global/Icons/FireIcon";
import HighlightedText from "../../../../../../global/HighlightedText";
import { EarlylandCardData } from "./types";
import {
  CardWrapper,
  CardTop,
  CardBottom,
  CardHeader,
  ProjectInfo,
  ProjectLogo,
  ProjectNameBlock,
  ProjectNameRow,
  ProjectName,
  ProjectType,
  HeaderActions,
  StatusBadge,
  StarButton,
  MetaRow,
  MetaItem,
  MetaLabel,
  MetaValue,
  Divider,
  TagsRow,
  Tag,
  Description,
  StatsRow,
  StatsLeft,
  StatItem,
  StatText,
  RaisedText,
  ProgressSection,
  DateRow,
  DateGroup,
  DateLabel,
  DateValue,
  ProgressBarWrapper,
  ProgressBarFill,
  CardFooter,
  FooterLeft,
  FomoTasksChip,
  TaskTypeText,
  DetailsButton,
  BlurOverlay,
  LockedTitle,
  LockedSubtitle,
  SkeletonBadge,
  SkeletonCircle,
  SkeletonLine,
} from "./styles";
import { useTranslation } from "i18n";
import { activityRichTextProps } from "../../../../../../../helpers/activityRichText";

const ClockIcon: FC<{ size?: number }> = ({ size = 20 }) => (
  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 20 20" fill="none">
    <path d="M10 5V10L13 12" stroke="#728094" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" />
    <circle cx="10" cy="10" r="7.5" stroke="#728094" stroke-width="1.5" />
  </svg>
);

const ChecklistIcon: FC = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 20 20" fill="none">
    <path d="M3 5.5L4.2 6.7L6.5 4.3M3 12.5L4.2 13.7L6.5 11.3M10 5.5H17M10 12.5H17" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" />
  </svg>
);

const CommentIcon: FC = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="15" height="15" viewBox="0 0 20 20" fill="none">
    <path d="M17 9.5C17 13.09 13.866 16 10 16C8.94 16 7.94 15.78 7.05 15.39L3 16.5L4.2 12.9C3.45 11.92 3 10.76 3 9.5C3 5.91 6.134 3 10 3C13.866 3 17 5.91 17 9.5Z" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" />
  </svg>
);

const CoinIcon: FC<{ size?: number }> = ({ size = 20 }) => (
  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 20 20" fill="none">
    <path d="M6.54781 6.36364C7.19369 3.85421 9.47165 2 12.1827 2C15.396 2 18.0009 4.60489 18.0009 7.81818C18.0009 10.38 16.3451 12.5551 14.0454 13.3318M6.54781 14.2714H7.81769M7.81769 14.2714H8.99951M7.81769 14.2714V9.63502C7.81769 9.63502 6.93118 10.2445 6.36315 10.635M13.6359 12.1818C13.6359 15.3951 11.031 18 7.81769 18C4.6044 18 1.99951 15.3951 1.99951 12.1818C1.99951 8.96852 4.6044 6.36364 7.81769 6.36364C11.031 6.36364 13.6359 8.96852 13.6359 12.1818Z" stroke="#728094" stroke-linecap="round" stroke-linejoin="round" />
  </svg>
);

const LockCardIcon: FC = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="40" height="40" viewBox="0 0 40 40" fill="none">
    <path d="M11 14.6667V13.1429C11 8.078 15.0143 4 20 4C24.9857 4 29 8.078 29 13.1429V14.6667M11 14.6667C9.35 14.6667 8 16.0381 8 17.7143V32.9524C8 34.6286 9.35 36 11 36H29C30.65 36 32 34.6286 32 32.9524V17.7143C32 16.0381 30.65 14.6667 29 14.6667M11 14.6667H29" stroke="#B5BCC7" stroke-width="2" stroke-linecap="round" />
  </svg>
);

interface Props extends EarlylandCardData {
  onToggleFavourite?: (id: string, interactionId?: string) => void;
  onDetails?: (id: string) => void;
  searchValue?: string;
}

export const FeedCardSkeleton: FC = () => (
  <CardWrapper aria-hidden="true">
    <CardTop>
      <CardHeader>
        <ProjectInfo>
          <SkeletonCircle />
          <ProjectNameBlock>
            <SkeletonLine width="120px" height="18px" />
            <SkeletonLine width="70px" height="14px" />
          </ProjectNameBlock>
        </ProjectInfo>
        <HeaderActions>
          <SkeletonBadge width="74px" height="26px" />
          <SkeletonCircle />
        </HeaderActions>
      </CardHeader>

      <MetaRow>
        <MetaItem>
          <SkeletonLine width="64px" height="14px" />
          <SkeletonLine width="80%" height="16px" />
        </MetaItem>
        <MetaItem>
          <SkeletonLine width="70px" height="14px" />
          <SkeletonLine width="60%" height="16px" />
        </MetaItem>
        <MetaItem>
          <SkeletonLine width="54px" height="14px" />
          <SkeletonLine width="70%" height="16px" />
        </MetaItem>
      </MetaRow>

      <Divider />

      <TagsRow>
        <SkeletonBadge width="76px" height="26px" />
        <SkeletonBadge width="96px" height="26px" />
        <SkeletonBadge width="68px" height="26px" />
      </TagsRow>

      <div>
        <SkeletonLine height="14px" />
        <SkeletonLine width="82%" height="14px" style={{ marginTop: 8 }} />
      </div>
    </CardTop>

    <CardBottom>
      <StatsRow>
        <StatsLeft>
          <SkeletonLine width="74px" height="18px" />
          <SkeletonLine width="64px" height="18px" />
        </StatsLeft>
        <SkeletonLine width="90px" height="18px" />
      </StatsRow>

      <ProgressSection>
        <DateRow>
          <SkeletonLine width="108px" height="16px" />
          <SkeletonLine width="94px" height="16px" />
        </DateRow>
        <SkeletonLine height="8px" />
      </ProgressSection>

      <CardFooter>
        <SkeletonLine width="86px" height="16px" />
        <SkeletonLine width="140px" height="32px" />
      </CardFooter>
    </CardBottom>
  </CardWrapper>
);

const FeedCard: FC<Props> = ({
  id,
  interactionId,
  projectLogo,
  projectName,
  type,
  isHot,
  status,
  isFavourite,
  category,
  difficulty,
  reward,
  tags,
  description,
  descriptionHtml,
  timeEstimate,
  cost,
  raised,
  startDate,
  endDate,
  progress = 0,
  taskType,
  isLocked,
  hasFomoTasks,
  fomoTasksCount = 0,
  commentsCount = 0,
  isPrime,
  onToggleFavourite,
  onDetails,
  searchValue = "",
}) => {
  const { translateText } = useTranslation();
  const translateOptional = (value?: string) => (value ? translateText(value) : "");
  const translateOrDash = (value?: string) => (value ? translateText(value) : "--");

  const showTasks = Boolean(hasFomoTasks && fomoTasksCount > 0);

  return (
    <CardWrapper $tasksGlow={Boolean(isPrime && showTasks)}>
      <CardTop>
        <CardHeader>
          <ProjectInfo>
            <ProjectLogo>
              {projectLogo ? (
                <img src={projectLogo} alt={projectName} />
              ) : (
                (projectName ?? "").slice(0, 2).toUpperCase()
              )}
            </ProjectLogo>
            <ProjectNameBlock>
              <ProjectNameRow>
                <ProjectName>
                  <HighlightedText
                    text={projectName || ""}
                    searchValue={searchValue}
                    highlightAll
                  />
                </ProjectName>
                {isHot && <FireIcon />}
              </ProjectNameRow>
              <ProjectType>{translateOptional(type)}</ProjectType>
            </ProjectNameBlock>
          </ProjectInfo>
          <HeaderActions>
            <StatusBadge status={status}>{translateOptional(status)}</StatusBadge>
            <StarButton
              active={isFavourite}
              onClick={(e) => {
                e.stopPropagation();
                onToggleFavourite?.(id, interactionId);
              }}
              title={
                isFavourite
                  ? translateText("Remove from favourites")
                  : translateText("Add to favourites")
              }
            >
              {isFavourite ? <StarIcon fill="#FFC702" /> : <StarIcon variant="outlined" />}
            </StarButton>
          </HeaderActions>
        </CardHeader>

        <MetaRow>
          <MetaItem>
            <MetaLabel>{translateText("Category")}</MetaLabel>
            <MetaValue>{translateOptional(category)}</MetaValue>
          </MetaItem>
          <MetaItem>
            <MetaLabel>{translateText("Difficulty")}</MetaLabel>
            <MetaValue difficulty={difficulty}>{translateOptional(difficulty)}</MetaValue>
          </MetaItem>
          <MetaItem>
            <MetaLabel>{translateText("Reward")}</MetaLabel>
            <MetaValue $truncate>{translateOptional(reward)}</MetaValue>
          </MetaItem>
        </MetaRow>

        <Divider />

        <TagsRow>
          {tags?.map((tag) => (
            <Tag key={tag.label} variant={tag.variant}>
              {translateText(tag.label)}
            </Tag>
          ))}
        </TagsRow>

        {(descriptionHtml || description) && (
          <Description dangerouslySetInnerHTML={activityRichTextProps(descriptionHtml, description)} />
        )}
      </CardTop>

      <CardBottom>
        <StatsRow>
          <StatsLeft>
            <StatItem>
              <ClockIcon size={20} />
              <StatText>{timeEstimate || "--"}</StatText>
            </StatItem>
            <StatItem>
              <CoinIcon size={20} />
              <StatText>{translateOrDash(cost)}</StatText>
            </StatItem>
          </StatsLeft>
          {raised && <RaisedText>{translateText("Raised")}: {raised}</RaisedText>}
        </StatsRow>

        {(startDate || endDate) && (
          <ProgressSection>
            <DateRow>
              {startDate && (
                <DateGroup>
                  <DateLabel>{translateText("Started")}:</DateLabel>
                  <DateValue>{startDate}</DateValue>
                </DateGroup>
              )}
              {endDate && (
                <DateGroup>
                  <DateLabel>{translateText("Ends")}:</DateLabel>
                  <DateValue>{endDate}</DateValue>
                </DateGroup>
              )}
            </DateRow>
            <ProgressBarWrapper>
              <ProgressBarFill percent={progress} />
            </ProgressBarWrapper>
          </ProgressSection>
        )}

        <CardFooter>
          <FooterLeft>
            <TaskTypeText>{translateOptional(taskType)}</TaskTypeText>
            {showTasks && (
              <FomoTasksChip
                data-testid="card-fomo-tasks"
                title="FOMO Tasks available — complete platform tasks and earn XP."
                onClick={(e) => {
                  e.stopPropagation();
                  onDetails?.(id);
                }}
              >
                <ChecklistIcon />
                <span>{fomoTasksCount} Tasks</span>
              </FomoTasksChip>
            )}
            <FomoTasksChip
              data-testid="card-comments"
              title="Open discussion for this activity."
              onClick={(e) => {
                e.stopPropagation();
                onDetails?.(id);
              }}
              style={{ background: "transparent", color: "#728094", border: "1px solid var(--color-border, #E5E9F0)" }}
            >
              <CommentIcon />
              <span>{commentsCount}</span>
            </FomoTasksChip>
          </FooterLeft>
          <DetailsButton
            onClick={(e) => {
              e.stopPropagation();
              onDetails?.(id);
            }}
          >
            {translateText("Details")}
          </DetailsButton>
        </CardFooter>
      </CardBottom>

      {isLocked && (
        <BlurOverlay>
          <LockCardIcon />
          <LockedTitle>{translateText("Prime access required")}</LockedTitle>
          <LockedSubtitle>
            {translateText("Unlock with a FOMO AI membership")}
          </LockedSubtitle>
        </BlurOverlay>
      )}
    </CardWrapper>
  );
};

export default FeedCard;
