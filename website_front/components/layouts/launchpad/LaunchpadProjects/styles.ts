import styled from "styled-components";
import { FeaturedBadgeVariant } from "./types";
import LaunchpadPlacementBanner from "../../../global/LaunchpadPlacementBanner";

/* ---- Page wrapper ---- */
export const Wrapper = styled.div`
  display: flex;
  flex-direction: column;
  gap: 30px;
  width: 100%;
  margin-top: 40px;
`;

/* ---- Section ---- */
export const Section = styled.div`
  display: flex;
  flex-direction: column;
  gap: 20px;
  width: 100%;
`;

export const SectionTitle = styled.div`
  display: flex;
  align-items: center;
  gap: 8px;
  font-family: "Gilroy", sans-serif;
  font-size: 24px;
  font-weight: var(--font-weight-semibold);
  line-height: 30px;
  color: var(--color-text-primary);
`;

export const FeaturedCard = styled.div`
  background: #f5fbfd;
  border: 1px solid #e9f8f8;
  border-radius: 12px;
  box-shadow: 2px 2px 8px 0 rgba(0, 5, 48, 0.08);
  padding: 20px;
  display: flex;
  gap: 20px;
  align-items: stretch;
  width: 100%;
  min-height: 200px;
  flex-wrap: nowrap;
  flex-direction: row;
  cursor: pointer;

  @media (max-width: 720px) {
    flex-direction: column;
    gap: 12px;
  }
`;

export const FeaturedLeft = styled.div`
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  gap: 20px;
  width: 100%;
`;

export const FeaturedTop = styled.div`
  display: flex;
  gap: 12px;
  align-items: flex-start;

  @media (max-width: 720px) {
    flex-direction: column;
    align-items: stretch;
  }
`;

export const FeaturedLogo = styled.div`
  width: 72px;
  height: 72px;
  border-radius: 99px;
  overflow: hidden;
  flex-shrink: 0;
  background: #f0f2f5;
  display: flex;
  align-items: center;
  justify-content: center;
  font-family: "Gilroy", sans-serif;
  font-size: 24px;
  font-weight: var(--font-weight-semibold);
  color: var(--color-text-muted);
  box-shadow: 0px 2px 12px 0px rgba(0, 0, 0, 0.03);

  img {
    width: 100%;
    height: 100%;
    object-fit: cover;
  }
`;

export const FeaturedInfo = styled.div`
  display: flex;
  flex-direction: column;
  gap: 12px;
  flex: 1;
  min-width: 0;
`;

export const FeaturedNameRow = styled.div`
  display: flex;
  align-items: center;
  gap: 20px;
  flex-wrap: wrap;

  @media (max-width: 720px) {
    gap: 6px;
  }
`;

export const FeaturedName = styled.h2`
  font-family: "Gilroy", sans-serif;
  font-size: 24px;
  font-weight: var(--font-weight-semibold);
  line-height: 30px;
  color: var(--color-text-primary);
  white-space: nowrap;
  margin: 0;
`;

export const FeaturedBadgesRow = styled.div`
  display: flex;
  align-items: center;
  gap: 8px;
  flex-wrap: wrap;
`;

export const FeaturedBadge = styled.span<{ variant?: FeaturedBadgeVariant }>`
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 4px 10px;
  border-radius: 6px;
  font-family: "Gilroy", sans-serif;
  font-size: 14px;
  font-weight: var(--font-weight-regular);
  line-height: 18px;
  white-space: nowrap;
  ${({ variant }) => {
    switch (variant) {
      case "featured":
        return `background: var(--color-primary); color: var(--color-white);`;
      case "live":
        return `background: #e9f8f8; color: var(--color-primary);`;
      case "outline":
        return `background: var(--color-surface-subtle); border: 1px solid var(--color-text-soft); color: #728094;`;
      case "blue":
      default:
        return `background: #f7feff; color: var(--color-info);`;
    }
  }}
`;

export const FeaturedMeta = styled.div`
  display: flex;
  flex-direction: column;
  gap: 4px;
`;

export const FeaturedCategory = styled.span`
  font-family: "Gilroy", sans-serif;
  font-size: 14px;
  font-weight: var(--font-weight-regular);
  line-height: 18px;
  color: var(--color-text-muted);
`;

export const FeaturedDescription = styled.p`
  font-family: "Gilroy", sans-serif;
  font-size: 14px;
  font-weight: var(--font-weight-regular);
  line-height: 18px;
  color: var(--color-text-primary);
  margin: 0;
`;

export const FeaturedStatsRow = styled.div`
  display: flex;
  align-items: center;
  gap: 20px;
  padding-left: 84px;

  @media (max-width: 720px) {
    padding-left: 0;
    align-items: flex-start;
    flex-wrap: wrap;
  }
`;

export const FeaturedStat = styled.div`
  display: flex;
  align-items: center;
  gap: 4px;
  font-family: "Gilroy", sans-serif;
  font-size: 14px;
  font-weight: var(--font-weight-regular);
  line-height: 18px;
  color: #728094;
  white-space: nowrap;
`;

export const FeaturedRight = styled.div`
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  align-items: flex-end;
  width: 100%;
  max-width: 360px;
  gap: 16px;

  @media (max-width: 720px) {
    max-width: none;
  }
`;

export const EligibleRow = styled.div`
  display: flex;
  align-items: center;
  gap: 4px;
  font-family: "Gilroy", sans-serif;
  font-size: 14px;
  font-weight: var(--font-weight-regular);
  line-height: 18px;
  color: var(--color-primary);
  white-space: nowrap;
`;

export const ProgressSection = styled.div`
  display: flex;
  flex-direction: column;
  gap: 8px;
  width: 100%;
`;

export const ProgressRow = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  font-family: "Gilroy", sans-serif;
  font-size: 14px;
  line-height: 18px;
  white-space: nowrap;
`;

export const ProgressLabel = styled.span`
  color: var(--color-text-muted);
  font-weight: var(--font-weight-regular);
`;

export const ProgressValue = styled.span`
  color: var(--color-text-primary);
  font-weight: var(--font-weight-semibold);
`;

export const ProgressBarWrapper = styled.div`
  width: 100%;
  height: 8px;
  background: #f9f9f9;
  border-radius: 8px;
  overflow: hidden;
`;

export const ProgressBarFill = styled.div<{ percent: number }>`
  width: ${({ percent }) => Math.min(100, Math.max(0, percent))}%;
  height: 100%;
  background: linear-gradient(90deg, var(--color-primary) 0%, #05c49d 100%);
  border-radius: 8px;
`;

/* ---- Projects grid ---- */
export const ProjectsGrid = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 20px;
  flex-direction: row;

  & > div {
    flex: 0 0 calc((100% - 40px) / 3);
    max-width: calc((100% - 40px) / 3);
    min-width: 280px;
  }

  @media (max-width: 1024px) {
    & > div {
      flex-basis: calc((100% - 20px) / 2);
      max-width: calc((100% - 20px) / 2);
    }
  }

  @media (max-width: 720px) {
    & > div {
      flex-basis: 100%;
      max-width: 100%;
      min-width: 0;
    }
    gap: 12px;
  }
`;

/* ---- Project card ---- */
export const ProjectCard = styled.div`
  background: var(--color-white);
  border-radius: 12px;
  box-shadow: 2px 2px 8px 0 rgba(0, 5, 48, 0.08);
  padding: 20px;
  display: flex;
  flex-direction: column;
  gap: 20px;
  transition: box-shadow 0.2s;
  cursor: pointer;

  &:hover {
    box-shadow: 2px 2px 16px 0 rgba(0, 5, 48, 0.12);
  }
`;

export const ProjectBanner = styled(LaunchpadPlacementBanner)`
  display: block;
  width: calc(100% + 40px);
  height: 108px;
  margin: -20px -20px 0;
  overflow: hidden;
  border-radius: 12px 12px 0 0;
  background: #edf0f5;

  img {
    display: block;
    width: 100%;
    height: 100%;
    object-fit: cover;
  }
`;

export const CardHeader = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 10px;

  @media (max-width: 600px) {
    flex-direction: column;
    align-items: flex-start;
  }
`;

export const CardLeft = styled.div`
  display: flex;
  align-items: center;
  gap: 10px;
  flex: 1;
  min-width: 0;
`;

export const ProjectLogo = styled.div`
  width: 38px;
  height: 38px;
  border-radius: 99px;
  overflow: hidden;
  flex-shrink: 0;
  background: #f0f2f5;
  box-shadow: 0px 2px 12px 0px rgba(0, 0, 0, 0.03);
  display: flex;
  align-items: center;
  justify-content: center;
  font-family: "Gilroy", sans-serif;
  font-size: 14px;
  font-weight: var(--font-weight-semibold);
  color: var(--color-text-muted);

  img {
    width: 100%;
    height: 100%;
    object-fit: cover;
  }
`;

export const ProjectMeta = styled.div`
  display: flex;
  flex-direction: column;
  flex: 1;
  min-width: 0;
`;

export const ProjectName = styled.span`
  font-family: "Gilroy", sans-serif;
  font-size: 16px;
  font-weight: var(--font-weight-semibold);
  line-height: 20px;
  color: var(--color-text-primary);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
`;

export const ProjectCategory = styled.span`
  font-family: "Gilroy", sans-serif;
  font-size: 14px;
  font-weight: var(--font-weight-regular);
  line-height: 18px;
  color: var(--color-text-muted);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
`;

export const StatusBadge = styled.div<{ status?: string }>`
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 4px 10px;
  border-radius: 6px;
  font-family: "Gilroy", sans-serif;
  font-size: 14px;
  font-weight: var(--font-weight-regular);
  line-height: 18px;
  white-space: nowrap;
  flex-shrink: 0;
  background: ${({ status }) => {
    if (status === "Staking Live") return "#f7feff";
    if (status === "Claim Available") return "#e9f8f8";
    if (status === "Upcoming") return "#fff8ef";
    if (status === "Completed") return "#f0f2f5";
    if (status === "Ended") return "#fef1f2";
    return "#f0f2f5";
  }};
  color: ${({ status }) => {
    if (status === "Staking Live") return "var(--color-info)";
    if (status === "Claim Available") return "var(--color-primary)";
    if (status === "Upcoming") return "#ff9d00";
    if (status === "Completed") return "var(--color-text-muted)";
    if (status === "Ended") return "var(--color-danger)";
    return "var(--color-text-muted)";
  }};
`;

export const StatBoxes = styled.div`
  display: flex;
  gap: 10px;
  width: 100%;
`;

export const StatBox = styled.div`
  flex: 1;
  background: #f5fbfd;
  border-radius: 12px;
  padding: 10px;
  display: flex;
  flex-direction: column;
  gap: 2px;
`;

export const StatLabel = styled.span`
  font-family: "Gilroy", sans-serif;
  font-size: 14px;
  font-weight: var(--font-weight-regular);
  line-height: 18px;
  color: var(--color-text-muted);
`;

export const StatValue = styled.span`
  font-family: "Gilroy", sans-serif;
  font-size: 14px;
  font-weight: var(--font-weight-semibold);
  line-height: 18px;
  color: var(--color-text-primary);
`;

export const Divider = styled.div`
  width: 100%;
  height: 1px;
  background: #f0f2f5;
`;

export const CardFooter = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  width: 100%;
`;

export const FooterStat = styled.div`
  display: flex;
  align-items: center;
  gap: 4px;
  font-family: "Gilroy", sans-serif;
  font-size: 14px;
  font-weight: var(--font-weight-regular);
  line-height: 18px;
  color: #728094;
  white-space: nowrap;
`;

export const EligibleLabel = styled.div`
  display: flex;
  align-items: center;
  gap: 4px;
  font-family: "Gilroy", sans-serif;
  font-size: 14px;
  font-weight: var(--font-weight-regular);
  line-height: 18px;
  color: var(--color-primary);
  white-space: nowrap;
`;

/* ---- Pagination area ---- */
export const PaginationRow = styled.div`
  display: flex;
  justify-content: center;
  width: 100%;
`;

export const FeaturedBanner = styled(LaunchpadPlacementBanner)`
  display: block;
  width: 100%;
  min-height: 108px;
  max-height: 138px;
  overflow: hidden;
  border-radius: 10px;
  background: #edf0f5;

  img {
    display: block;
    width: 100%;
    height: 100%;
    min-height: 108px;
    max-height: 138px;
    object-fit: cover;
  }
`;

export const ProjectsState = styled.div`
  width: 100%;
  min-height: 140px;
  padding: 28px;
  border: 1px solid #edf0f5;
  border-radius: 12px;
  background: var(--color-white);
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 12px;
  text-align: center;
`;

export const StateMessage = styled.p`
  margin: 0;
  color: var(--color-text-muted);
  font-family: "Gilroy", sans-serif;
  font-size: 14px;
  line-height: 20px;
`;

export const RetryButton = styled.button`
  padding: 8px 14px;
  border: 0;
  border-radius: 8px;
  background: var(--color-primary);
  color: var(--color-white);
  cursor: pointer;
  font-family: "Gilroy", sans-serif;
  font-size: 14px;
`;

/* ---- How it works ---- */
export const HowItWorksSection = styled.div`
  display: flex;
  gap: 40px;
  width: 100%;
  padding: 20px;
  background: #f5fbfd;
  border-radius: 12px;

  @media (max-width: 720px) {
    flex-direction: column;
    gap: 20px;
  }
`;

export const StepItem = styled.div`
  flex: 1;
  display: flex;
  flex-direction: row;
  gap: 10px;

  & > div {
    display: flex;
    flex-direction: column;
    gap: 8px;
  }
`;

export const StepNumber = styled.span`
  font-family: "Gilroy", sans-serif;
  font-size: 64px;
  font-weight: var(--font-weight-semibold);
  line-height: 62px;
  color: #75f9e4;
`;

export const StepTitle = styled.span`
  font-family: "Gilroy", sans-serif;
  font-size: 16px;
  font-weight: var(--font-weight-semibold);
  line-height: 20px;
  color: var(--color-text-primary);
`;

export const StepDesc = styled.p`
  font-family: "Gilroy", sans-serif;
  font-size: 14px;
  font-weight: var(--font-weight-regular);
  line-height: 18px;
  color: var(--color-text-muted);
  margin: 0;
`;
