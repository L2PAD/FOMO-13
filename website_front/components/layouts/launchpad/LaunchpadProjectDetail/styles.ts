import styled, { css } from "styled-components";
import { ZoneVariant } from "./types";

export const PageWrapper = styled.div`
  display: flex;
  flex-direction: column;
  gap: 40px;
  width: 100%;
  margin-top: 32px;
  padding: 0 36px 20px;
  font-family: "Gilroy", sans-serif;

  @media (max-width: 1204px) {
    padding: 0 16px 20px;
    margin-top: 14px;
  }

  @media (max-width: 575px) {
    padding: 0 12px 16px;
    margin-top: 10px;
  }
`;

export const TwoColLayout = styled.div`
  display: flex;
  gap: 20px;
  align-items: flex-start;
  width: 100%;

  @media (max-width: 900px) {
    flex-direction: column;
  }
`;

export const MainColumn = styled.div`
  display: flex;
  flex-direction: column;
  gap: 20px;
  flex: 1 1 0;
  min-width: 0;

  @media (max-width: 768px) {
    width: 100%;
  }
`;

export const Sidebar = styled.div`
  display: flex;
  flex-direction: column;
  gap: 20px;
  width: 400px;
  flex-shrink: 0;

  @media (max-width: 900px) {
    width: 100%;
  }
`;

export const Card = styled.div`
  background: var(--color-white);
  border: 1px solid #f0f2f5;
  border-radius: 12px;
  box-shadow: 2px 2px 8px 0px rgba(0, 5, 48, 0.08);
  padding: 20px;
  display: flex;
  flex-direction: column;
  gap: 20px;
  width: 100%;

  @media (max-width: 768px) {
    .pagination {
      grid-template-columns: 1fr;
    }
  }
`;

export const CardTitle = styled.p`
  font-family: "Gilroy", sans-serif;
  font-weight: var(--font-weight-semibold);
  font-size: 20px;
  line-height: 28px;
  color: var(--color-text-primary);
  width: 100%;
`;

export const HeaderCard = styled.div`
  background: var(--color-white);
  border-bottom: 1px solid #f0f2f5;
  border-radius: 12px;
  box-shadow: 2px 2px 8px 0px rgba(0, 5, 48, 0.08);
  padding: 20px;
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  width: 100%;
  min-height: 204px;
  flex-wrap: wrap;
`;

export const HeaderLeft = styled.div`
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  height: 100%;
  gap: 20px;
  flex: 1;
  min-width: 0;

  @media (max-width: 1024px) {
    flex: none;
    width: 100%;
  }
`;

export const HeaderTopRow = styled.div`
  display: flex;
  flex-direction: column;
  gap: 20px;
`;

export const ProjectIdentity = styled.div`
  display: flex;
  gap: 20px;
  align-items: center;
`;

export const ProjectLogo = styled.div`
  width: 74px;
  height: 74px;
  border-radius: 99px;
  box-shadow: 0px 2px 12px 0px rgba(0, 0, 0, 0.03);
  flex-shrink: 0;
  overflow: hidden;
  background: #f0f2f5;

  img {
    width: 100%;
    height: 100%;
    object-fit: cover;
    border-radius: 99px;
  }
`;

export const ProjectMeta = styled.div`
  display: flex;
  flex-direction: column;
  gap: 4px;
`;

export const TitleRow = styled.div`
  display: flex;
  gap: 10px;
  align-items: center;

  @media (max-width: 720px) {
    flex-wrap: wrap;
    justify-content: flex-end;
    flex-direction: row-reverse;
    gap: 2px;
  }
`;

export const ProjectName = styled.p`
  font-family: "Gilroy", sans-serif;
  font-weight: var(--font-weight-semibold);
  font-size: 32px;
  line-height: 40px;
  color: var(--color-text-primary);
  white-space: nowrap;

  @media (max-width: 720px) {
    font-size: 24px;
  }
`;

export const CategoryText = styled.p`
  font-family: "Gilroy", sans-serif;
  font-weight: var(--font-weight-regular);
  font-size: 24px;
  line-height: 30px;
  color: #728094;
  white-space: nowrap;

  @media (max-width: 720px) {
    font-size: 16px;
  }
`;

export const DescriptionText = styled.p`
  font-family: "Gilroy", sans-serif;
  font-weight: var(--font-weight-regular);
  font-size: 14px;
  line-height: 18px;
  color: var(--color-text-primary);
  width: 100%;

  span.see-more {
    font-weight: var(--font-weight-semibold);
    color: var(--color-info);
    cursor: pointer;
  }
`;

export const SocialLinksRow = styled.div`
  display: flex;
  gap: 20px;
  align-items: center;
  padding: 4px 0;
`;

export const SocialIcon = styled.a`
  display: flex;
  align-items: center;
  justify-content: center;
  width: 24px;
  height: 24px;
  flex-shrink: 0;
  cursor: pointer;
  color: #728094;
  text-decoration: none;

  svg {
    width: 24px;
    height: 24px;
  }
`;

export const HeaderRight = styled.div`
  display: flex;
  flex-direction: column;
  justify-content: center;
  height: 100%;
  flex-shrink: 0;
  width: 380px;

  @media (max-width: 768px) {
    width: 100%;
  }
`;

export const StatsRow = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  width: 100%;
  white-space: nowrap;

  @media (max-width: 720px) {
    margin-top: 20px;
  }
`;

export const StatItem = styled.div`
  display: flex;
  flex-direction: column;
  gap: 8px;
`;

export const StatValue = styled.p`
  font-family: "Gilroy", sans-serif;
  font-weight: var(--font-weight-semibold);
  font-size: 24px;
  line-height: normal;
  color: var(--color-text-primary);
`;

export const StatLabel = styled.p`
  font-family: "Gilroy", sans-serif;
  font-weight: var(--font-weight-regular);
  font-size: 14px;
  line-height: normal;
  color: var(--color-text-muted);
`;

interface StatusBadgeProps {
  variant?: "yellow" | "gray" | "green" | "blue" | "greenLight";
}

export const StatusBadge = styled.div<StatusBadgeProps>`
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 4px 10px;
  border-radius: 6px;
  font-family: "Gilroy", sans-serif;
  font-weight: var(--font-weight-regular);
  font-size: 14px;
  line-height: 18px;
  white-space: nowrap;
  flex-shrink: 0;

  ${({ variant = "gray" }) => {
    switch (variant) {
      case "yellow":
        return css`
          background: #fefcf3;
          color: #ffc704;
        `;
      case "green":
        return css`
          background: var(--color-primary);
          color: var(--color-white);
        `;
      case "greenLight":
        return css`
          background: #e9f8f8;
          color: var(--color-primary);
        `;
      case "blue":
        return css`
          background: #f7feff;
          color: var(--color-info);
        `;
      case "gray":
      default:
        return css`
          background: var(--color-surface-subtle);
          color: #728094;
        `;
    }
  }}
`;

export const TimelineStepsRow = styled.div`
  display: flex;
  gap: 0;
  align-items: stretch;
  width: 100%;

  @media (max-width: 720px) {
    flex-direction: column;
  }
`;

export const TimelineConnector = styled.div`
  flex: 0 0 16px;
  height: 2px;
  background: #e0e6ed;
  align-self: center;
  flex-shrink: 0;

  @media (max-width: 720px) {
    display: none;
  }
`;

export type TimelineVariant = "done" | "active" | "inactive";

interface TimelineStepProps {
  variant?: TimelineVariant;
}

export const TimelineStep = styled.div<TimelineStepProps>`
  display: flex;
  flex-direction: row;
  gap: 10px;
  align-items: center;
  flex: 1;
  min-width: 0;
  padding: 12px;
  border-radius: 12px;
  cursor: pointer;
`;

export const TimelineIconCircle = styled.div<TimelineStepProps>`
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 10px;
  border-radius: 100px;
  flex-shrink: 0;
  position: relative;

  ${({ variant = "inactive" }) =>
    variant === "done" || variant === "active"
      ? css`
          background: var(--color-primary);
        `
      : css`
          background: var(--color-surface-subtle);
          border: 1px solid #f0f2f5;
        `}
`;

export const TimelineDoneBadge = styled.div`
  position: absolute;
  top: -8px;
  right: -8px;
  width: 24px;
  height: 24px;
  display: flex;
  align-items: center;
  justify-content: center;
`;

export const TimelineInfo = styled.div<TimelineStepProps>`
  display: flex;
  flex-direction: column;
  gap: 4px;
  align-items: flex-start;
  text-align: left;
  padding: 8px;
  border-radius: 8px;
  flex: 1;
  min-width: 0;

  ${({ variant = "inactive" }) => {
    if (variant === "done")
      return css`
        background: #e9f8f8;
      `;
    if (variant === "active")
      return css`
        background: #f5fbfd;
      `;
    return css`
      background: var(--color-surface-subtle);
    `;
  }}
`;

export const TimelineStepTitle = styled.p<TimelineStepProps>`
  font-family: "Gilroy", sans-serif;
  font-weight: var(--font-weight-semibold);
  font-size: 14px;
  line-height: 20px;
  width: 100%;
  color: ${({ variant = "inactive" }) => {
    if (variant === "done") return "var(--color-primary)";
    if (variant === "active") return "var(--color-text-primary)";
    return "#728094";
  }};
`;

export const TimelineStepDesc = styled.div<TimelineStepProps>`
  font-family: "Gilroy", sans-serif;
  font-weight: var(--font-weight-regular);
  font-size: 12px;
  line-height: 16px;
  width: 100%;
  color: ${({ variant = "inactive" }) =>
    variant === "inactive" ? "var(--color-text-soft)" : "#728094"};

  p {
    margin: 0;
  }
`;

export const TabsRow = styled.div`
  display: flex;
  align-items: center;
  width: 100%;
  margin-bottom: 40px;

  @media (max-width: 720px) {
    margin-bottom: 0px;
  }
`;

interface TabProps {
  isActive?: boolean;
}

export const Tab = styled.div<TabProps>`
  display: flex;
  align-items: center;
  justify-content: center;
  flex: 1;
  padding-bottom: 10px;
  padding-left: 20px;
  padding-right: 20px;
  cursor: pointer;
  border-bottom: 2px solid
    ${({ isActive }) => (isActive ? "var(--color-primary)" : "var(--color-surface-subtle)")};

  p {
    font-family: "Gilroy", sans-serif;
    font-weight: var(--font-weight-semibold);
    font-size: 20px;
    line-height: 24px;
    color: ${({ isActive }) => (isActive ? "var(--color-text-primary)" : "#728094")};
    white-space: nowrap;
  }

  @media (max-width: 768px) {
    padding: 6px;

    p {
      font-size: 14px;
    }
  }
`;

export const AboutInfoBar = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 12px 20px;
  background: #f5fbfd;
  border: 1px solid #e9f8f8;
  border-radius: 12px;

  @media (max-width: 720px) {
    flex-direction: column;
  }
`;

export const AboutInfoItem = styled.div`
  display: flex;
  gap: 8px;
  align-items: center;

  svg {
    width: 24px;
    height: 24px;
    flex-shrink: 0;
    color: var(--color-primary);
  }
`;

export const AboutInfoLabel = styled.span`
  font-family: "Gilroy", sans-serif;
  font-weight: var(--font-weight-regular);
  font-size: 14px;
  line-height: 18px;
  color: var(--color-primary);
`;

export const AboutInfoValue = styled.span`
  font-family: "Gilroy", sans-serif;
  font-weight: var(--font-weight-semibold);
  font-size: 14px;
  line-height: 18px;
  color: var(--color-primary);
`;

export const ProblemSolutionRow = styled.div`
  display: flex;
  gap: 20px;
  align-items: stretch;
  width: 100%;

  @media (max-width: 720px) {
    flex-direction: column;
  }
`;

export const ProblemSolutionCard = styled.div`
  background: var(--color-white);
  border: 1px solid #f0f2f5;
  border-radius: 12px;
  box-shadow: 2px 2px 8px 0px rgba(0, 5, 48, 0.08);
  padding: 20px;
  display: flex;
  flex-direction: column;
  gap: 20px;
  flex: 1;
  min-width: 0;
`;

export const ProblemSolutionHeader = styled.div`
  display: flex;
  gap: 4px;
  align-items: center;
`;

export const ProblemSolutionTitle = styled.p`
  font-family: "Gilroy", sans-serif;
  font-weight: var(--font-weight-semibold);
  font-size: 20px;
  line-height: 28px;
  color: var(--color-text-primary);
  white-space: nowrap;
`;

export const ProblemSolutionText = styled.p`
  font-family: "Gilroy", sans-serif;
  font-weight: var(--font-weight-regular);
  font-size: 14px;
  line-height: 18px;
  color: var(--color-text-primary);
  text-align: justify;
`;

export const InvestorsGrid = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 20px;
  width: 100%;

  @media (max-width: 720px) {
    justify-content: center;
  }
`;

export const InvestorItem = styled.div`
  display: flex;
  flex-direction: column;
  gap: 12px;
  align-items: center;
  width: 112px;
`;

export const InvestorLogo = styled.div`
  width: 60px;
  height: 60px;
  border-radius: 99px;
  box-shadow: 0px 2px 12px 0px rgba(0, 0, 0, 0.03);
  overflow: hidden;
  background: #f0f2f5;
  flex-shrink: 0;

  img {
    width: 100%;
    height: 100%;
    object-fit: cover;
    border-radius: 99px;
  }
`;

export const InvestorName = styled.p`
  font-family: "Gilroy", sans-serif;
  font-weight: var(--font-weight-semibold);
  font-size: 16px;
  line-height: normal;
  color: var(--color-text-primary);
  text-align: center;
  width: 100%;
`;

export const TeamRow = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 20px;
  width: 100%;
`;

export const TeamCard = styled.div`
  background: var(--color-surface-subtle);
  border-radius: 8px;
  padding: 10px;
  display: flex;
  gap: 8px;
  align-items: center;
`;

export const TeamAvatar = styled.div`
  width: 40px;
  height: 40px;
  border-radius: 99px;
  box-shadow: 0px 2px 12px 0px rgba(0, 0, 0, 0.03);
  flex-shrink: 0;
  overflow: hidden;
  background: #f0f2f5;

  img {
    width: 100%;
    height: 100%;
    object-fit: cover;
    border-radius: 99px;
  }
`;

export const TeamInfo = styled.div`
  display: flex;
  flex-direction: column;
  gap: 4px;
`;

export const TeamName = styled.p`
  font-family: "Gilroy", sans-serif;
  font-weight: var(--font-weight-regular);
  font-size: 14px;
  line-height: 18px;
  color: var(--color-text-primary);
`;

export const TeamRole = styled.p`
  font-family: "Gilroy", sans-serif;
  font-weight: var(--font-weight-regular);
  font-size: 12px;
  line-height: 18px;
  color: var(--color-text-muted);
`;

export const FaqItemWrapper = styled.div`
  width: 100%;
`;

export const FaqQuestion = styled.div`
  display: flex;
  gap: 20px;
  align-items: flex-start;
  width: 100%;
`;

export const FaqQuestionText = styled.p`
  flex: 1;
  font-family: "Gilroy", sans-serif;
  font-weight: var(--font-weight-regular);
  font-size: 14px;
  line-height: 18px;
  color: var(--color-text-primary);
  text-align: justify;
`;

export const FaqAnswer = styled.p`
  flex: 1;
  font-family: "Gilroy", sans-serif;
  font-weight: var(--font-weight-regular);
  font-size: 14px;
  line-height: 18px;
  color: #728094;
  text-align: justify;
`;

export const FaqChevron = styled.div`
  width: 18px;
  height: 18px;
  flex-shrink: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
`;

export const FaqDivider = styled.div`
  width: 100%;
  height: 1px;
  background: #f0f2f5;
  margin: 0;
`;

export const FaqContent = styled.div`
  display: flex;
  flex-direction: column;
  gap: 20px;
  width: 100%;
`;

export const RiskNotice = styled.div`
  background: #fefcf3;
  border: 1px solid #ffc704;
  border-radius: 12px;
  padding: 12px;
  display: flex;
  flex-direction: column;
  justify-content: center;
  width: 100%;
`;

export const RiskNoticeInner = styled.div`
  display: flex;
  gap: 8px;
  align-items: flex-start;
`;

export const RiskNoticeContent = styled.div`
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 8px;
`;

export const RiskNoticeTitle = styled.p`
  font-family: "Gilroy", sans-serif;
  font-weight: var(--font-weight-semibold);
  font-size: 14px;
  line-height: 18px;
  color: #9e3900;
`;

export const RiskNoticeText = styled.p`
  font-family: "Gilroy", sans-serif;
  font-weight: var(--font-weight-regular);
  font-size: 14px;
  line-height: 18px;
  color: #9e3900;
`;

export const AllocationCard = styled.div`
  background: #f5fbfd;
  border: 1px solid var(--color-primary);
  border-radius: 12px;
  box-shadow: 2px 2px 8px 0px rgba(0, 5, 48, 0.08);
  padding: 20px;
  display: flex;
  flex-direction: column;
  gap: 20px;
  width: 100%;
`;

export const AllocationHeader = styled.div`
  display: flex;
  gap: 12px;
  align-items: center;
  border-radius: 12px;
  width: 100%;
`;

export const AllocationIconCircle = styled.div`
  background: #e9f8f8;
  padding: 10px;
  border-radius: 100px;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;

  svg {
    width: 32px;
    height: 32px;
  }
`;

export const AllocationTitleGroup = styled.div`
  flex: 1;
  min-width: 0;
  display: flex;
  flex-direction: column;
`;

export const AllocationTitle = styled.p`
  font-family: "Gilroy", sans-serif;
  font-weight: var(--font-weight-semibold);
  font-size: 20px;
  line-height: 28px;
  color: var(--color-primary);

  &.locked {
    color: #728094;
  }
`;

export const AllocationSubtitle = styled.p`
  font-family: "Gilroy", sans-serif;
  font-weight: var(--font-weight-regular);
  font-size: 14px;
  line-height: 18px;
  color: #728094;
`;

export const AllocationStatsRow = styled.div`
  display: flex;
  gap: 20px;
  align-items: center;
`;

export const AllocationStatBox = styled.div`
  background: #e9f8f8;
  border-radius: 8px;
  padding: 10px;
  display: flex;
  flex-direction: column;
  gap: 8px;
  flex: 1;
  min-width: 0;
`;

export const AllocationStatHeader = styled.div`
  display: flex;
  gap: 8px;
  align-items: flex-start;

  svg {
    width: 18px;
    height: 18px;
    flex-shrink: 0;
  }
`;

export const AllocationStatLabel = styled.p`
  font-family: "Gilroy", sans-serif;
  font-weight: var(--font-weight-regular);
  font-size: 14px;
  line-height: 18px;
  color: #728094;
  flex: 1;
  min-width: 0;
`;

export const AllocationStatValue = styled.p`
  font-family: "Gilroy", sans-serif;
  font-weight: var(--font-weight-semibold);
  font-size: 24px;
  line-height: 30px;
  color: var(--color-primary);
`;

export const ZoneBadgesRow = styled.div`
  display: flex;
  gap: 20px;
  align-items: flex-start;
`;

interface ZoneBadgeProps {
  variant: ZoneVariant;
}

export const ZoneBadge = styled.div<ZoneBadgeProps>`
  flex: 1;
  min-width: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 4px 10px;
  border-radius: 6px;
  font-family: "Gilroy", sans-serif;
  font-weight: var(--font-weight-regular);
  font-size: 14px;
  line-height: 18px;
  white-space: nowrap;

  ${({ variant }) => {
    switch (variant) {
      case "green":
        return css`
          background: var(--color-primary);
          color: var(--color-white);
        `;
      case "greenPassive":
        return css`
          background: #e9f8f8;
          color: var(--color-primary);
        `;
      case "yellow":
        return css`
          background: #fff3c2;
          color: #c24c00;
        `;
      case "yellowFilled":
        return css`
          background: #ffc704;
          color: var(--color-white);
        `;
      case "red":
        return css`
          background: #fef1f2;
          color: var(--color-danger);
        `;
      case "redFilled":
        return css`
          background: var(--color-danger);
          color: var(--color-white);
        `;
    }
  }}
`;

export const AllocationCongratsBox = styled.div`
  background: #e9f8f8;
  border-radius: 8px;
  padding: 10px;
  width: 100%;
`;

export const AllocationCongratsText = styled.p`
  font-family: "Gilroy", sans-serif;
  font-size: 14px;
  line-height: 18px;
  color: var(--color-primary);

  span.bold {
    font-weight: var(--font-weight-semibold);
  }
  span.regular {
    font-weight: var(--font-weight-regular);
  }
`;

export const NftStakedCard = styled.div`
  background: var(--color-white);
  border: 1px solid #e9f8f8;
  border-radius: 12px;
  box-shadow: 2px 2px 8px 0px rgba(0, 5, 48, 0.08);
  padding: 20px;
  display: flex;
  flex-direction: column;
  gap: 20px;
  width: 100%;
`;

export const CountdownBox = styled.div`
  background: var(--color-surface-subtle);
  border-radius: 8px;
  padding: 10px;
  display: flex;
  gap: 8px;
  align-items: center;

  svg {
    width: 18px;
    height: 18px;
    flex-shrink: 0;
    color: #728094;
  }
`;

export const CountdownLabel = styled.p`
  flex: 1;
  font-family: "Gilroy", sans-serif;
  font-weight: var(--font-weight-regular);
  font-size: 14px;
  line-height: 18px;
  color: #728094;
`;

export const CountdownValue = styled.p`
  flex: 1;
  font-family: "Gilroy", sans-serif;
  font-weight: var(--font-weight-semibold);
  font-size: 16px;
  line-height: 20px;
  color: var(--color-primary);
  text-align: right;
`;

export const LeaderboardHeader = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  width: 100%;
`;

export const LeaderboardTitle = styled.div`
  display: flex;
  gap: 8px;
  align-items: center;

  svg {
    width: 28px;
    height: 28px;
    overflow: hidden;
  }

  p {
    font-family: "Gilroy", sans-serif;
    font-weight: var(--font-weight-semibold);
    font-size: 20px;
    line-height: 28px;
    color: var(--color-text-primary);
    white-space: nowrap;
  }
`;

export const LeaderboardTopLabel = styled.p`
  font-family: "Gilroy", sans-serif;
  font-weight: var(--font-weight-regular);
  font-size: 14px;
  line-height: 18px;
  color: #728094;
  text-align: right;
  white-space: nowrap;
`;

export const LeaderboardList = styled.div`
  display: flex;
  flex-direction: column;
  gap: 10px;
  width: 100%;
`;

interface LeaderboardRowProps {
  isCurrentUser?: boolean;
}

export const LeaderboardRow = styled.div<LeaderboardRowProps>`
  display: flex;
  gap: 10px;
  align-items: center;
  padding: 10px;
  border-radius: 8px;
  width: 100%;

  ${({ isCurrentUser }) =>
    isCurrentUser
      ? css`
          background: #f5fbfd;
          border: 1px solid #e9f8f8;
        `
      : css`
          background: var(--color-surface-subtle);
        `}
`;

interface LeaderboardRankProps {
  isCurrentUser?: boolean;
}

export const LeaderboardRank = styled.p<LeaderboardRankProps>`
  font-family: "Gilroy", sans-serif;
  font-weight: var(--font-weight-regular);
  font-size: 14px;
  line-height: 18px;
  text-align: center;
  width: 14px;
  flex-shrink: 0;
  color: ${({ isCurrentUser }) => (isCurrentUser ? "var(--color-primary)" : "var(--color-text-primary)")};
`;

export const LeaderboardUserCell = styled.div`
  display: flex;
  flex: 1;
  gap: 8px;
  align-items: center;
  min-width: 0;
`;

export const LeaderboardAvatarWrapper = styled.div`
  position: relative;
  flex-shrink: 0;
  width: 38px;
  height: 38px;
`;

export const LeaderboardAvatar = styled.div`
  width: 38px;
  height: 38px;
  border-radius: 99px;
  border: 2px solid var(--color-primary);
  box-shadow: 0px 2px 12px 0px rgba(0, 0, 0, 0.03);
  overflow: hidden;
  background: #f0f2f5;

  img {
    width: 100%;
    height: 100%;
    object-fit: cover;
    border-radius: 99px;
  }
`;

export const NftLevelBadge = styled.div`
  position: absolute;
  top: -2px;
  left: 20px;
  width: 16px;
  height: 16px;
  background: var(--color-primary);
  border-radius: 99px;
  display: flex;
  align-items: center;
  justify-content: center;

  span {
    font-family: "Gilroy", sans-serif;
    font-weight: var(--font-weight-regular);
    font-size: 10px;
    line-height: normal;
    color: var(--color-white);
  }
`;

export const LeaderboardUsername = styled.p`
  flex: 1;
  font-family: "Gilroy", sans-serif;
  font-weight: var(--font-weight-semibold);
  font-size: 14px;
  line-height: 18px;
  color: #0d0f2a;
  min-width: 0;
`;

export const LeaderboardNftCount = styled.p`
  font-family: "Gilroy", sans-serif;
  font-weight: var(--font-weight-regular);
  font-size: 14px;
  line-height: 18px;
  color: var(--color-text-primary);
  text-align: right;
  white-space: nowrap;
  flex-shrink: 0;
`;

interface LeaderboardZoneBadgeProps {
  variant: "green" | "yellow";
}

export const LeaderboardZoneBadge = styled.div<LeaderboardZoneBadgeProps>`
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 4px 10px;
  border-radius: 6px;
  flex-shrink: 0;

  ${({ variant }) =>
    variant === "green"
      ? css`
          background: #e9f8f8;
          color: var(--color-primary);
        `
      : css`
          background: #fff3c2;
          color: #c24c00;
        `}

  p {
    font-family: "Gilroy", sans-serif;
    font-weight: var(--font-weight-regular);
    font-size: 14px;
    line-height: 18px;
    white-space: nowrap;
  }
`;

export const FlagsList = styled.div`
  display: flex;
  flex-direction: column;
  gap: 12px;
  width: 100%;
`;

export const FlagItem = styled.div`
  display: flex;
  gap: 8px;
  align-items: flex-start;
`;

export const FlagText = styled.p`
  flex: 1;
  font-family: "Gilroy", sans-serif;
  font-weight: var(--font-weight-regular);
  font-size: 14px;
  line-height: normal;
  color: var(--color-text-primary);
`;

interface FlagDotProps {
  variant: "green" | "yellow" | "red";
}

export const FlagDot = styled.div<FlagDotProps>`
  width: 16px;
  height: 16px;
  border-radius: 4px;
  flex-shrink: 0;
  margin-top: 2px;
  background: ${({ variant }) => {
    switch (variant) {
      case "green":
        return "var(--color-primary)";
      case "yellow":
        return "#ffc704";
      case "red":
        return "var(--color-danger)";
    }
  }};
`;

export const FlagsDivider = styled.div`
  width: 100%;
  height: 1px;
  background: #f0f2f5;
`;

export const ParticipationCard = styled.div`
  background: var(--color-surface-subtle);
  border: 1px solid #f0f2f5;
  border-radius: 12px;
  padding: 20px;
  display: flex;
  flex-direction: column;
  gap: 20px;
  width: 100%;
`;

export const ParticipationTitle = styled.p`
  font-family: "Gilroy", sans-serif;
  font-weight: var(--font-weight-semibold);
  font-size: 16px;
  line-height: 20px;
  color: var(--color-text-primary);
`;

export const ParticipationList = styled.ul`
  list-style: disc;
  padding-left: 21px;
  display: flex;
  flex-direction: column;
  gap: 8px;
  font-family: "Gilroy", sans-serif;
  font-weight: var(--font-weight-regular);
  font-size: 14px;
  line-height: normal;
  color: #728094;
  text-align: justify;
  margin: 0;
`;

export const SimilarSection = styled.div`
  display: flex;
  flex-direction: column;
  gap: 20px;
  width: 100%;
`;

export const SimilarTitle = styled.p`
  font-family: "Gilroy", sans-serif;
  font-weight: var(--font-weight-semibold);
  font-size: 24px;
  line-height: normal;
  color: var(--color-text-primary);
`;

export const SimilarGrid = styled.div`
  display: flex;
  gap: 20px;
  align-items: flex-start;
  width: 100%;

  @media (max-width: 720px) {
    flex-direction: column;
  }
`;

export const SimilarCard = styled.div`
  background: var(--color-white);
  border-radius: 12px;
  box-shadow: 2px 2px 8px 0px rgba(0, 5, 48, 0.08);
  padding: 20px;
  display: flex;
  flex-direction: column;
  gap: 20px;
  min-width: 0;
  height: 100%;

  @media (max-width: 720px) {
    width: 100%;
  }
`;

export const SimilarCardTop = styled.div`
  display: flex;
  flex-direction: column;
  gap: 20px;
  width: 100%;
`;

export const SimilarCardHeader = styled.div`
  display: flex;
  gap: 20px;
  align-items: flex-start;
  width: 100%;
`;

export const SimilarCardInfo = styled.div`
  display: flex;
  flex: 1;
  gap: 10px;
  align-items: center;
  min-width: 0;
`;

export const SimilarLogo = styled.div`
  width: 38px;
  height: 38px;
  border-radius: 99px;
  box-shadow: 0px 2px 12px 0px rgba(0, 0, 0, 0.03);
  flex-shrink: 0;
  overflow: hidden;
  background: #f0f2f5;

  img {
    width: 100%;
    height: 100%;
    object-fit: cover;
    border-radius: 99px;
  }
`;

export const SimilarCardMeta = styled.div`
  flex: 1;
  min-width: 0;
`;

export const SimilarCardName = styled.p`
  font-family: "Gilroy", sans-serif;
  font-weight: var(--font-weight-semibold);
  font-size: 16px;
  line-height: 20px;
  color: var(--color-text-primary);
  width: 100%;
`;

export const SimilarCardCategory = styled.p`
  font-family: "Gilroy", sans-serif;
  font-weight: var(--font-weight-regular);
  font-size: 14px;
  line-height: 18px;
  color: var(--color-text-muted);
  width: 100%;
`;

export const SimilarStatsRow = styled.div`
  display: flex;
  gap: 10px;
  align-items: flex-start;
  font-size: 14px;
  line-height: 18px;
  width: 100%;
`;

export const SimilarStatBox = styled.div`
  background: #f5fbfd;
  border-radius: 12px;
  padding: 10px;
  display: flex;
  flex-direction: column;
  gap: 2px;
  flex: 1;
  min-width: 0;
`;

export const SimilarStatLabel = styled.p`
  font-family: "Gilroy", sans-serif;
  font-weight: var(--font-weight-regular);
  font-size: 14px;
  line-height: 18px;
  color: var(--color-text-muted);
  width: 100%;
`;

export const SimilarStatValue = styled.p`
  font-family: "Gilroy", sans-serif;
  font-weight: var(--font-weight-semibold);
  font-size: 14px;
  line-height: 18px;
  color: var(--color-text-primary);
  width: 100%;
`;

export const SimilarCardBottom = styled.div`
  display: flex;
  flex-direction: column;
  gap: 12px;
  width: 100%;
`;

export const ProgressSection = styled.div`
  display: flex;
  flex-direction: column;
  gap: 8px;
  width: 100%;
`;

export const ProgressHeader = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  font-size: 14px;
  line-height: 18px;
  white-space: nowrap;
  width: 100%;
`;

export const ProgressLabel = styled.p`
  font-family: "Gilroy", sans-serif;
  font-weight: var(--font-weight-regular);
  color: var(--color-text-muted);
`;

export const ProgressPercent = styled.p`
  font-family: "Gilroy", sans-serif;
  font-weight: var(--font-weight-semibold);
  color: var(--color-text-primary);
`;

export const ProgressBarBg = styled.div`
  background: #f9f9f9;
  border-radius: 8px;
  height: 8px;
  width: 100%;
  position: relative;
  overflow: hidden;
`;

interface ProgressBarFillProps {
  percent: number;
}

export const ProgressBarFill = styled.div<ProgressBarFillProps>`
  position: absolute;
  top: 0;
  left: 0;
  height: 100%;
  width: ${({ percent }) => percent}%;
  border-radius: 8px;
  background: linear-gradient(90deg, var(--color-primary) 0%, #3dd9b4 100%);
`;

export const SimilarCardDivider = styled.div`
  width: 100%;
  height: 1px;
  background: #f0f2f5;
`;

export const SimilarCardFooter = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  width: 100%;
`;

export const TimeLeftLabel = styled.div`
  display: flex;
  gap: 4px;
  align-items: center;

  svg {
    width: 20px;
    height: 20px;
    flex-shrink: 0;
  }

  p {
    font-family: "Gilroy", sans-serif;
    font-weight: var(--font-weight-regular);
    font-size: 14px;
    line-height: 18px;
    color: #728094;
    text-align: right;
    white-space: nowrap;
  }
`;

export const EligibleLabel = styled.div`
  display: flex;
  gap: 4px;
  align-items: center;

  svg {
    width: 20px;
    height: 20px;
    flex-shrink: 0;
  }

  p {
    font-family: "Gilroy", sans-serif;
    font-weight: var(--font-weight-regular);
    font-size: 14px;
    line-height: 18px;
    color: var(--color-primary);
    text-align: right;
    white-space: nowrap;
  }
`;

export const SectionContentText = styled.p`
  font-family: "Gilroy", sans-serif;
  font-weight: var(--font-weight-regular);
  font-size: 14px;
  line-height: 18px;
  color: var(--color-text-primary);
  text-align: justify;
  width: 100%;
`;

export const PurchaseCard = styled.div`
  background: var(--color-white);
  border: 1px solid #e9f8f8;
  border-radius: 12px;
  box-shadow: 2px 2px 8px 0px rgba(0, 5, 48, 0.08);
  padding: 20px;
  display: flex;
  flex-direction: column;
  gap: 20px;
  width: 100%;
`;

export const PurchaseIconCircle = styled.div`
  background: #e9f8f8;
  padding: 10px;
  border-radius: 100px;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
`;

export const PurchaseTitle = styled.p`
  font-family: "Gilroy", sans-serif;
  font-weight: var(--font-weight-semibold);
  font-size: 20px;
  line-height: 28px;
  color: var(--color-primary);
`;

export const PurchaseTimeRow = styled.div`
  background: var(--color-surface-subtle);
  border-radius: 8px;
  padding: 10px;
  display: flex;
  gap: 8px;
  align-items: center;
  width: 100%;

  svg {
    width: 18px;
    height: 18px;
    flex-shrink: 0;
    color: #728094;
  }
`;

export const PurchaseTimeLabel = styled.p`
  flex: 1;
  font-family: "Gilroy", sans-serif;
  font-weight: var(--font-weight-regular);
  font-size: 14px;
  line-height: 18px;
  color: #728094;
`;

export const PurchaseTimeValue = styled.p`
  font-family: "Gilroy", sans-serif;
  font-weight: var(--font-weight-semibold);
  font-size: 16px;
  line-height: 20px;
  color: var(--color-primary);
  white-space: nowrap;
`;

export const InvestSection = styled.div`
  display: flex;
  flex-direction: column;
  gap: 20px;
  align-items: flex-end;
  width: 100%;
`;

export const InvestFormGroup = styled.div`
  display: flex;
  flex-direction: column;
  gap: 8px;
  width: 100%;
`;

export const InvestLabel = styled.p`
  font-family: "Gilroy", sans-serif;
  font-weight: var(--font-weight-semibold);
  font-size: 14px;
  line-height: 18px;
  color: #728094;
`;

export const InvestInputRow = styled.div`
  display: flex;
  gap: 10px;
  align-items: center;
  padding: 6px 12px;
  border: 1px solid var(--color-primary);
  border-radius: 8px;
  width: 100%;
`;

export const InvestCurrency = styled.p`
  flex: 1;
  font-family: "Gilroy", sans-serif;
  font-weight: var(--font-weight-regular);
  font-size: 14px;
  line-height: 18px;
  color: var(--color-text-primary);
`;

export const InvestAmountVal = styled.p`
  font-family: "Gilroy", sans-serif;
  font-weight: var(--font-weight-semibold);
  font-size: 14px;
  line-height: 18px;
  color: var(--color-text-primary);
  white-space: nowrap;
`;

export const InvestStepper = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  background: #f0f2f5;
  border-radius: 4px;
  flex-shrink: 0;
  overflow: hidden;
  cursor: pointer;
`;

export const StepperBtn = styled.button`
  background: none;
  border: none;
  outline: none;
  display: flex;
  align-items: center;
  justify-content: center;
  width: 18px;
  height: 14px;
  cursor: pointer;
  color: #728094;
  padding: 0;

  svg {
    width: 10px;
    height: 6px;
  }
`;

export const InvestMinMaxRow = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  font-family: "Gilroy", sans-serif;
  font-weight: var(--font-weight-regular);
  font-size: 14px;
  line-height: 18px;
  color: #728094;
  white-space: nowrap;
`;

export const QuickAmountsRow = styled.div`
  display: flex;
  gap: 10px;
  align-items: center;
  flex-shrink: 0;
`;

export const QuickAmountBtn = styled.button`
  background: #f5fbfd;
  border: none;
  outline: none;
  border-radius: 6px;
  padding: 8px;
  font-family: "Gilroy", sans-serif;
  font-weight: var(--font-weight-regular);
  font-size: 14px;
  line-height: normal;
  color: var(--color-text-primary);
  white-space: nowrap;
  cursor: pointer;

  &:hover {
    background: #e9f8f8;
  }
`;

export const ApproveBtn = styled.button`
  background: var(--color-primary);
  border: none;
  outline: none;
  border-radius: 8px;
  padding: 6px 12px;
  width: 100%;
  font-family: "Gilroy", sans-serif;
  font-weight: var(--font-weight-regular);
  font-size: 14px;
  line-height: 18px;
  color: var(--color-white);
  white-space: nowrap;
  cursor: pointer;

  &:hover {
    background: #047a65;
  }
`;

export const PurchaseWarningBox = styled.div`
  background: #fefcf3;
  border: 1px solid #ffc704;
  border-radius: 8px;
  padding: 10px;
  display: flex;
  gap: 8px;
  align-items: flex-start;
  width: 100%;

  svg {
    width: 18px;
    height: 18px;
    flex-shrink: 0;
    margin-top: 1px;
    color: #ffc704;
  }
`;

export const PurchaseWarningText = styled.p`
  flex: 1;
  font-family: "Gilroy", sans-serif;
  font-weight: var(--font-weight-regular);
  font-size: 14px;
  line-height: 18px;
  color: #c24c00;
`;

export const ClaimCard = styled.div`
  background: var(--color-white);
  border: 1px solid #edd4ff;
  border-radius: 12px;
  box-shadow: 2px 2px 8px 0px rgba(0, 5, 48, 0.08);
  padding: 20px;
  display: flex;
  flex-direction: column;
  gap: 20px;
  width: 100%;
`;

export const ClaimIconCircle = styled.div`
  background: #fbf5ff;
  padding: 10px;
  border-radius: 100px;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;

  svg {
    width: 32px;
    height: 32px;
  }
`;

export const ClaimTokensBox = styled.div`
  background: #fbf5ff;
  border: 1px solid #edd4ff;
  border-radius: 8px;
  padding: 10px;
  display: flex;
  flex-direction: column;
  gap: 8px;
  align-items: center;
  text-align: center;
  width: 100%;
`;

export const ClaimTokensLabel = styled.p`
  font-family: "Gilroy", sans-serif;
  font-weight: var(--font-weight-regular);
  font-size: 14px;
  line-height: 18px;
  color: #a02af3;
  width: 100%;
`;

export const ClaimTokensAmount = styled.div`
  display: flex;
  gap: 4px;
  align-items: baseline;
  justify-content: center;
  width: 100%;
`;

export const ClaimTokensNumber = styled.p`
  font-family: "Gilroy", sans-serif;
  font-weight: var(--font-weight-semibold);
  font-size: 24px;
  line-height: 30px;
  color: #7619ae;
  white-space: nowrap;
`;

export const ClaimTokensTicker = styled.p`
  font-family: "Gilroy", sans-serif;
  font-weight: var(--font-weight-semibold);
  font-size: 16px;
  line-height: 20px;
  color: #7619ae;
  white-space: nowrap;
`;

export const ClaimStatsRow = styled.div`
  display: flex;
  gap: 20px;
  align-items: center;
  width: 100%;
`;

export const ClaimStatBox = styled.div`
  background: var(--color-surface-subtle);
  border-radius: 8px;
  padding: 10px;
  display: flex;
  flex-direction: column;
  gap: 8px;
  align-items: center;
  text-align: center;
  flex: 1;
  min-width: 0;
`;

export const ClaimStatLabel = styled.p`
  font-family: "Gilroy", sans-serif;
  font-weight: var(--font-weight-regular);
  font-size: 14px;
  line-height: 18px;
  color: #728094;
  width: 100%;
`;

export const ClaimStatValue = styled.p`
  font-family: "Gilroy", sans-serif;
  font-weight: var(--font-weight-semibold);
  font-size: 24px;
  line-height: 30px;
  color: var(--color-text-primary);
  width: 100%;
`;

export const ClaimBtn = styled.button`
  display: flex;
  gap: 6px;
  align-items: center;
  justify-content: center;
  background: #7619ae;
  border: none;
  outline: none;
  border-radius: 8px;
  padding: 6px 12px;
  width: 100%;
  font-family: "Gilroy", sans-serif;
  font-weight: var(--font-weight-regular);
  font-size: 14px;
  line-height: 18px;
  color: var(--color-white);
  white-space: nowrap;
  cursor: pointer;

  svg {
    width: 16px;
    height: 16px;
    flex-shrink: 0;
  }

  &:hover {
    background: #5c1285;
  }
`;

export const FundingRow = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  font-size: 14px;
  line-height: 18px;
  white-space: nowrap;
  width: 100%;
`;

export const FundingLabel = styled.p`
  font-family: "Gilroy", sans-serif;
  font-weight: var(--font-weight-regular);
  color: var(--color-text-muted);
`;

export const FundingValue = styled.p`
  font-family: "Gilroy", sans-serif;
  font-weight: var(--font-weight-semibold);
  color: var(--color-text-primary);
`;

export const IdoStatGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 20px;

  @media (max-width: 720px) {
    gap: 12px;
    grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
  }
`;

export const IdoStatRow = styled.div`
  display: flex;
  gap: 20px;
  align-items: stretch;
  width: 100%;
  @media (max-width: 1024px) {
    gap: 12px;
  }
`;

export const IdoStatCard = styled.div`
  display: flex;
  gap: 8px;
  align-items: flex-start;
  flex: 1 0 0;
  min-width: 0;
  background: var(--color-white);
  border: 1px solid #f0f2f5;
  border-radius: 12px;
  box-shadow: 2px 2px 8px 0px rgba(0, 5, 48, 0.08);
  padding: 20px;

  @media (max-width: 1024px) {
    padding: 12px;
    flex-wrap: wrap;
  }
`;

export const IdoStatIconWrapper = styled.div`
  width: 24px;
  height: 24px;
  flex-shrink: 0;
  display: flex;
  align-items: center;
  justify-content: center;

  svg {
    width: 24px;
    height: 24px;
  }
`;

export const IdoStatInfo = styled.div`
  display: flex;
  flex-direction: column;
  gap: 8px;
  justify-content: center;
  flex: 1;
  min-width: 0;
`;

export const IdoStatLabel = styled.p`
  font-family: "Gilroy", sans-serif;
  font-weight: var(--font-weight-regular);
  font-size: 14px;
  line-height: 18px;
  color: #728094;
  white-space: nowrap;
`;

export const IdoStatValue = styled.p`
  font-family: "Gilroy", sans-serif;
  font-weight: var(--font-weight-semibold);
  font-size: 14px;
  line-height: 18px;
  color: var(--color-text-primary);
  white-space: nowrap;
`;

export const AllocationZonesRow = styled.div`
  display: flex;
  gap: 20px;
  align-items: flex-start;
  width: 100%;

  @media (max-width: 720px) {
    flex-direction: column;
  }
`;

const zoneStyles: Record<ZoneVariant, string> = {
  green: "background: #e9f8f8; border-color: var(--color-primary);",
  greenPassive: "background: #e9f8f8; border-color: var(--color-primary);",
  yellow: "background: #fefcf3; border-color: #ffc704;",
  yellowFilled: "background: #fefcf3; border-color: #ffc704;",
  red: "background: #fef1f2; border-color: var(--color-danger);",
  redFilled: "background: #fef1f2; border-color: var(--color-danger);",
};

export const ZoneInfoCard = styled.div<{ variant: ZoneVariant }>`
  flex: 1 0 0;
  min-width: 0;
  display: flex;
  flex-direction: column;
  gap: 8px;
  align-items: flex-start;
  padding: 10px;
  border: 1px solid;
  border-radius: 8px;
  ${({ variant }) => zoneStyles[variant]}
`;

export const ZoneDotHeader = styled.div`
  display: flex;
  gap: 4px;
  align-items: center;
  width: 100%;
`;

export const ZoneDot = styled.div<{ color: string }>`
  width: 10px;
  height: 10px;
  border-radius: 5px;
  background: ${({ color }) => color};
  flex-shrink: 0;
`;

export const ZoneName = styled.p`
  font-family: "Gilroy", sans-serif;
  font-weight: var(--font-weight-semibold);
  font-size: 16px;
  line-height: 20px;
  color: var(--color-text-primary);
  white-space: nowrap;
`;

export const ZoneDescText = styled.p`
  font-family: "Gilroy", sans-serif;
  font-weight: var(--font-weight-regular);
  font-size: 14px;
  line-height: 18px;
  color: #728094;
  width: 100%;
`;

export const LbCardHeader = styled.div`
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 16px;
  flex-shrink: 0;
`;

export const LbCardTitle = styled.h3`
  font-family: "Gilroy", sans-serif;
  font-weight: var(--font-weight-semibold);
  font-size: 20px;
  line-height: 24px;
  color: var(--color-text-primary);
  margin: 0;
`;

export const LbTableScroller = styled.div`
  width: 100%;
  overflow-x: auto;
  -webkit-overflow-scrolling: touch;
  margin-bottom: 16px;
`;

export const LbTable = styled.div`
  display: flex;
  flex-direction: column;
  min-width: 600px;
  width: 100%;
`;

export const LbRow = styled.div<{
  $isCurrentUser?: boolean;
  $isHeader?: boolean;
}>`
  display: flex;
  align-items: center;
  border-bottom: 1px solid #f0f2f5;
  background: ${({ $isCurrentUser }) =>
    $isCurrentUser ? "#e9f8f8" : "transparent"};
  height: ${({ $isHeader }) => ($isHeader ? "30px" : "60px")};
`;

export const LbRankCell = styled.div`
  width: 60px;
  flex-shrink: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 0 10px;
`;

export const LbWalletCell = styled.div`
  flex: 1;
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 0 10px;
  min-width: 0;
`;

export const LbFixedCell = styled.div`
  width: 180px;
  flex-shrink: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 0 10px;
`;

export const LbZoneCell = styled.div`
  width: 100px;
  flex-shrink: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 0 10px;
`;

export const LbHeaderText = styled.span`
  font-family: "Gilroy", sans-serif;
  font-weight: var(--font-weight-semibold);
  font-size: 14px;
  line-height: normal;
  color: var(--color-text-muted);
  text-align: center;
  width: 100%;
`;

export const LbHeaderTextLeft = styled.span`
  font-family: "Gilroy", sans-serif;
  font-weight: var(--font-weight-semibold);
  font-size: 14px;
  line-height: normal;
  color: var(--color-text-muted);
`;

export const LbCellText = styled.span`
  font-family: "Gilroy", sans-serif;
  font-weight: var(--font-weight-regular);
  font-size: 14px;
  line-height: normal;
  color: var(--color-text-primary);
  text-align: center;
  width: 100%;
`;

export const LbRankText = styled.span<{ $isCurrentUser?: boolean }>`
  font-family: "Gilroy", sans-serif;
  font-weight: var(--font-weight-semibold);
  font-size: 14px;
  line-height: normal;
  color: ${({ $isCurrentUser }) => ($isCurrentUser ? "var(--color-primary)" : "var(--color-text-primary)")};
`;

export const LbAvatarWrap = styled.div`
  position: relative;
  width: 38px;
  height: 38px;
  border-radius: 50%;
  border: 2px solid var(--color-primary);
  box-shadow: 0px 2px 12px rgba(0, 0, 0, 0.03);
  flex-shrink: 0;
  background: #d8f5ef;
  overflow: visible;
`;

export const LbAvatar = styled.img`
  width: 100%;
  height: 100%;
  border-radius: 50%;
  object-fit: cover;
`;

export const LbLevelBadge = styled.div`
  position: absolute;
  left: 20px;
  top: -2px;
  width: 16px;
  height: 16px;
  border-radius: 50%;
  background: var(--color-primary);
  display: flex;
  align-items: center;
  justify-content: center;
  font-family: "Gilroy", sans-serif;
  font-weight: var(--font-weight-regular);
  font-size: 10px;
  color: white;
  z-index: 1;
`;

export const LbMedalWrap = styled.div`
  position: absolute;
  left: -7px;
  top: 21px;
  width: 24px;
  height: 24px;
`;

export const LbUsername = styled.span`
  font-family: "Gilroy", sans-serif;
  font-weight: var(--font-weight-semibold);
  font-size: 14px;
  line-height: 18px;
  color: #0d0f2a;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
`;

export const LbZonePill = styled.div<{
  $zone: ZoneVariant;
  $isCurrentUser?: boolean;
}>`
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 4px 10px;
  border-radius: 6px;
  font-family: "Gilroy", sans-serif;
  font-weight: var(--font-weight-regular);
  font-size: 14px;
  line-height: 18px;
  white-space: nowrap;
  flex: 1;
  ${({ $zone, $isCurrentUser }) => {
    if ($zone === "green" && $isCurrentUser) {
      return `background: #e9f8f8; border: 1px solid var(--color-primary); color: var(--color-primary);`;
    }
    if ($zone === "green") {
      return `background: #e9f8f8; color: var(--color-primary);`;
    }
    if ($zone === "yellow") {
      return `background: #fff3c2; color: #c24c00;`;
    }
    return `background: #fef1f2; color: var(--color-danger);`;
  }}
`;

export const LbPagination = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-top: 4px;
`;

export const LbPaginationLeft = styled.div`
  display: flex;
  align-items: center;
  gap: 12px;
`;

export const LbPages = styled.div`
  display: flex;
  align-items: center;
  gap: 0;
`;

export const LbPageBtn = styled.button<{ $isActive?: boolean }>`
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 10px;
  min-width: 36px;
  border-radius: 4px;
  border: none;
  cursor: pointer;
  font-family: "Gilroy", sans-serif;
  font-weight: var(--font-weight-regular);
  font-size: 14px;
  line-height: 20px;
  background: ${({ $isActive }) => ($isActive ? "var(--color-primary)" : "transparent")};
  color: ${({ $isActive }) => ($isActive ? "white" : "var(--color-primary)")};
  &:hover {
    opacity: 0.8;
  }
`;

export const LbChevronBtn = styled.button`
  width: 24px;
  height: 24px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: transparent;
  border: none;
  cursor: pointer;
  color: var(--color-text-muted);
  padding: 0;
  &:hover {
    opacity: 0.7;
  }
`;

export const LbPageInfo = styled.span`
  font-family: "Gilroy", sans-serif;
  font-weight: var(--font-weight-regular);
  font-size: 12px;
  line-height: normal;
  color: var(--color-text-muted);
  text-align: center;
  white-space: nowrap;
`;

export const LbFooterNote = styled.div`
  background: var(--color-surface-subtle);
  border-radius: 12px;
  padding: 12px;
  margin-top: 16px;
  width: 100%;
  box-sizing: border-box;
`;

export const LbFooterNoteText = styled.p`
  font-family: "Gilroy", sans-serif;
  font-size: 14px;
  line-height: 18px;
  color: var(--color-text-primary);
  margin: 0;
  text-align: justify;
`;

export const ToastContainer = styled.div`
  position: fixed;
  top: 24px;
  right: 24px;
  width: 400px;
  z-index: 1100;
`;

export const ToastBox = styled.div`
  display: flex;
  align-items: center;
  gap: 8px;
  background: #e9f8f8;
  border: 1px solid var(--color-primary);
  border-radius: 8px;
  padding: 20px;
`;

export const ToastIconWrap = styled.div`
  width: 36px;
  height: 36px;
  flex-shrink: 0;
  display: flex;
  align-items: center;
  justify-content: center;
`;

export const ToastContent = styled.div`
  display: flex;
  flex-direction: column;
  gap: 8px;
  flex: 1;
  min-width: 0;
`;

export const ToastTitle = styled.p`
  font-family: "Gilroy", sans-serif;
  font-weight: var(--font-weight-semibold);
  font-size: 14px;
  line-height: 18px;
  color: var(--color-primary);
`;

export const ToastText = styled.p`
  font-family: "Gilroy", sans-serif;
  font-weight: var(--font-weight-regular);
  font-size: 14px;
  line-height: 18px;
  color: var(--color-primary);
`;

export const ModalOverlay = styled.div`
  position: fixed;
  inset: 0;
  background: rgba(0, 5, 48, 0.4);
  z-index: 1000;
  display: flex;
  align-items: center;
  justify-content: center;
`;

export const ModalCard = styled.div`
  background: var(--color-white);
  border: 1px solid #e9f8f8;
  border-radius: 12px;
  padding: 20px;
  width: 420px;
  max-width: 90vw;
  box-shadow: 2px 2px 8px 0px rgba(0, 5, 48, 0.08);
  display: flex;
  flex-direction: column;
  gap: 20px;
`;

export const ModalHeader = styled.div`
  display: flex;
  gap: 12px;
  align-items: center;
`;

export const ModalIconCircle = styled.div`
  background: #f5fbfd;
  border-radius: 100px;
  padding: 10px;
  flex-shrink: 0;
  display: flex;
  align-items: center;
  justify-content: center;
`;

export const ModalTitleGroup = styled.div`
  display: flex;
  flex-direction: column;
  flex: 1;
  min-width: 0;
`;

export const ModalTitle = styled.p`
  font-family: "Gilroy", sans-serif;
  font-weight: var(--font-weight-semibold);
  font-size: 20px;
  line-height: 28px;
  color: var(--color-text-primary);
`;

export const ModalSubtitle = styled.p`
  font-family: "Gilroy", sans-serif;
  font-weight: var(--font-weight-regular);
  font-size: 14px;
  line-height: 18px;
  color: #728094;
`;

export const ModalAmountBox = styled.div`
  background: #f5fbfd;
  border: 1px solid #e9f8f8;
  border-radius: 8px;
  padding: 10px;
  display: flex;
  flex-direction: column;
  gap: 8px;
  align-items: center;
  width: 100%;
  box-sizing: border-box;
`;

export const ModalAmountLabel = styled.p`
  font-family: "Gilroy", sans-serif;
  font-weight: var(--font-weight-regular);
  font-size: 14px;
  line-height: 18px;
  color: var(--color-primary);
  width: 100%;
  text-align: center;
`;

export const ModalAmountRow = styled.div`
  display: flex;
  gap: 4px;
  align-items: flex-end;
  justify-content: center;
`;

export const ModalAmountNumber = styled.span`
  font-family: "Gilroy", sans-serif;
  font-weight: var(--font-weight-semibold);
  font-size: 24px;
  line-height: 30px;
  color: var(--color-primary);
`;

export const ModalAmountTicker = styled.span`
  font-family: "Gilroy", sans-serif;
  font-weight: var(--font-weight-semibold);
  font-size: 16px;
  line-height: 20px;
  color: var(--color-primary);
`;

export const ModalViewBtn = styled.button`
  display: flex;
  gap: 6px;
  align-items: center;
  justify-content: center;
  border: 1px solid #f0f2f5;
  background: transparent;
  border-radius: 8px;
  padding: 6px 12px;
  width: 100%;
  font-family: "Gilroy", sans-serif;
  font-weight: var(--font-weight-regular);
  font-size: 14px;
  line-height: 18px;
  color: var(--color-text-primary);
  cursor: pointer;

  svg {
    width: 16px;
    height: 16px;
    flex-shrink: 0;
  }

  &:hover {
    background: #f8f9fa;
  }
`;

export const OverflowCard = styled.div`
  background: #fefcf3;
  border: 1px solid #ffc704;
  border-radius: 12px;
  box-shadow: 2px 2px 8px 0px rgba(0, 5, 48, 0.08);
  padding: 20px;
  display: flex;
  flex-direction: column;
  gap: 20px;
  width: 100%;
`;

export const OverflowIconCircle = styled.div`
  background: #fff3c2;
  border-radius: 100px;
  padding: 10px;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;

  svg {
    width: 32px;
    height: 32px;
  }
`;

export const OverflowTitle = styled.p`
  font-family: "Gilroy", sans-serif;
  font-weight: var(--font-weight-semibold);
  font-size: 20px;
  line-height: 28px;
  color: #c24c00;
  width: 100%;
`;

export const OverflowStatBox = styled.div`
  flex: 1 0 0;
  min-width: 0;
  background: #fff3c2;
  border-radius: 8px;
  padding: 10px;
  display: flex;
  flex-direction: column;
  gap: 8px;
  align-items: flex-start;
`;

export const OverflowStatValue = styled.p`
  font-family: "Gilroy", sans-serif;
  font-weight: var(--font-weight-semibold);
  font-size: 24px;
  line-height: 30px;
  color: #c24c00;
  width: 100%;
`;

export const OverflowInfoBox = styled.div`
  background: #fff3c2;
  border-radius: 8px;
  padding: 10px;
  width: 100%;
`;

export const OverflowInfoText = styled.p`
  font-family: "Gilroy", sans-serif;
  font-size: 14px;
  line-height: 18px;
  color: #c24c00;

  span.bold {
    font-weight: var(--font-weight-semibold);
  }
  span.regular {
    font-weight: var(--font-weight-regular);
  }
`;

export const NftStakedYellowCard = styled.div`
  background: var(--color-white);
  border: 1px solid #fff3c2;
  border-radius: 12px;
  box-shadow: 2px 2px 8px 0px rgba(0, 5, 48, 0.08);
  padding: 20px;
  display: flex;
  flex-direction: column;
  gap: 20px;
  width: 100%;
`;

export const NftStakedYellowIconCircle = styled.div`
  background: #fff3c2;
  border-radius: 100px;
  padding: 10px;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;

  svg {
    width: 32px;
    height: 32px;
  }
`;

export const NftStakedYellowTitle = styled.p`
  font-family: "Gilroy", sans-serif;
  font-weight: var(--font-weight-semibold);
  font-size: 20px;
  line-height: 28px;
  color: #c24c00;
  width: 100%;
`;

export const StakeMoreBtn = styled.button`
  display: flex;
  gap: 6px;
  align-items: center;
  justify-content: center;
  border: 1px solid #f0f2f5;
  background: transparent;
  border-radius: 8px;
  padding: 6px 12px;
  width: 100%;
  font-family: "Gilroy", sans-serif;
  font-weight: var(--font-weight-regular);
  font-size: 14px;
  line-height: 18px;
  color: var(--color-text-primary);
  cursor: pointer;

  svg {
    width: 16px;
    height: 16px;
    flex-shrink: 0;
  }

  &:hover {
    background: #f8f9fa;
  }
`;

export const WaitingListCard = styled.div`
  background: #fef1f2;
  border: 1px solid var(--color-danger);
  border-radius: 12px;
  box-shadow: 2px 2px 8px 0px rgba(0, 5, 48, 0.08);
  padding: 20px;
  display: flex;
  flex-direction: column;
  gap: 20px;
  width: 100%;
`;

export const WaitingListIconCircle = styled.div`
  background: #ffe1e0;
  border-radius: 100px;
  padding: 10px;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;

  svg {
    width: 32px;
    height: 32px;
  }
`;

export const WaitingListTitle = styled.p`
  font-family: "Gilroy", sans-serif;
  font-weight: var(--font-weight-semibold);
  font-size: 20px;
  line-height: 28px;
  color: var(--color-danger);
  width: 100%;
`;

export const WaitingListStatBox = styled.div`
  flex: 1 0 0;
  min-width: 0;
  background: #ffe1e0;
  border-radius: 8px;
  padding: 10px;
  display: flex;
  flex-direction: column;
  gap: 8px;
  align-items: flex-start;
`;

export const WaitingListStatValue = styled.p`
  font-family: "Gilroy", sans-serif;
  font-weight: var(--font-weight-semibold);
  font-size: 24px;
  line-height: 30px;
  color: var(--color-danger);
  width: 100%;
`;

export const WaitingListInfoBox = styled.div`
  background: #ffe1e0;
  border-radius: 8px;
  padding: 10px;
  width: 100%;
`;

export const WaitingListInfoText = styled.p`
  font-family: "Gilroy", sans-serif;
  font-size: 14px;
  line-height: 18px;
  color: var(--color-danger);

  span.bold {
    font-weight: var(--font-weight-semibold);
  }
  span.regular {
    font-weight: var(--font-weight-regular);
  }
`;

export const NftStakedRedCard = styled.div`
  background: var(--color-white);
  border: 1px solid #ffe1e0;
  border-radius: 12px;
  box-shadow: 2px 2px 8px 0px rgba(0, 5, 48, 0.08);
  padding: 20px;
  display: flex;
  flex-direction: column;
  gap: 20px;
  width: 100%;
`;

export const NftStakedRedIconCircle = styled.div`
  background: #fef1f2;
  border-radius: 100px;
  padding: 10px;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;

  svg {
    width: 32px;
    height: 32px;
  }
`;

export const NftStakedRedTitle = styled.p`
  font-family: "Gilroy", sans-serif;
  font-weight: var(--font-weight-semibold);
  font-size: 20px;
  line-height: 28px;
  color: var(--color-danger);
  width: 100%;
`;

export const AllocationLockedCard = styled.div`
  background: var(--color-white);
  border: 1px solid #f0f2f5;
  border-radius: 12px;
  box-shadow: 2px 2px 8px 0px rgba(0, 5, 48, 0.08);
  padding: 20px;
  display: flex;
  flex-direction: column;
  gap: 20px;
  width: 100%;

  @media (max-width: 600px) {
    padding: 14px;
    gap: 14px;
  }
`;

export const AllocationLockedIconCircle = styled.div`
  background: var(--color-surface-subtle);
  border-radius: 100px;
  padding: 10px;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;

  svg {
    width: 32px;
    height: 32px;
  }

  @media (max-width: 600px) {
    padding: 8px;

    svg {
      width: 24px;
      height: 24px;
    }
  }
`;

export const AllocationLockedInfoBox = styled.div`
  background: var(--color-surface-subtle);
  border-radius: 8px;
  padding: 10px;
  width: 100%;
  display: flex;
  flex-direction: column;
  gap: 8px;
`;

export const AllocationLockedInfoText = styled.p`
  font-family: "Gilroy", sans-serif;
  font-weight: var(--font-weight-regular);
  font-size: 14px;
  line-height: 18px;
  color: #728094;
  width: 100%;
`;

export const NftRequiredCard = styled.div`
  background: var(--color-white);
  border: 1px solid #fff3c2;
  border-radius: 12px;
  box-shadow: 2px 2px 8px 0px rgba(0, 5, 48, 0.08);
  padding: 20px;
  display: flex;
  flex-direction: column;
  gap: 20px;
  width: 100%;

  @media (max-width: 600px) {
    padding: 14px;
    gap: 14px;
  }
`;

export const NftRequiredIconCircle = styled.div`
  background: #fff3c2;
  border-radius: 100px;
  padding: 10px;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;

  svg {
    width: 32px;
    height: 32px;
  }

  @media (max-width: 600px) {
    padding: 8px;

    svg {
      width: 24px;
      height: 24px;
    }
  }
`;

export const NftRequiredTitle = styled.p`
  font-family: "Gilroy", sans-serif;
  font-weight: var(--font-weight-semibold);
  font-size: 20px;
  line-height: 28px;
  color: #c24c00;
  width: 100%;

  @media (max-width: 600px) {
    font-size: 16px;
    line-height: 22px;
  }
`;

export const SpaceportBtn = styled.button`
  display: flex;
  gap: 6px;
  align-items: center;
  justify-content: center;
  background: var(--color-primary);
  border: none;
  border-radius: 8px;
  padding: 6px 12px;
  width: 100%;
  font-family: "Gilroy", sans-serif;
  font-weight: var(--font-weight-regular);
  font-size: 14px;
  line-height: 18px;
  color: var(--color-white);
  cursor: pointer;
  white-space: nowrap;

  svg {
    width: 16px;
    height: 16px;
    flex-shrink: 0;
  }

  &:hover {
    background: #04936f;
  }

  @media (max-width: 600px) {
    padding: 8px 12px;
  }
`;
