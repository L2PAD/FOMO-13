import styled, { keyframes } from "styled-components";
import { TagVariant } from "./types";

const skeletonPulse = keyframes`
  0% {
    background-position: 100% 50%;
  }

  100% {
    background-position: 0 50%;
  }
`;

const skeletonGradient = `
  linear-gradient(
    90deg,
    #f0f2f5 0%,
    #f7f8fa 50%,
    #f0f2f5 100%
  )
`;

export const SkeletonLine = styled.div<{ width?: string; height?: string }>`
  width: ${({ width }) => width || "100%"};
  height: ${({ height }) => height || "14px"};
  border-radius: 6px;
  background: ${skeletonGradient};
  background-size: 200% 100%;
  animation: ${skeletonPulse} 1.2s ease-in-out infinite;
`;

export const SkeletonCircle = styled.div`
  width: 38px;
  height: 38px;
  border-radius: 99px;
  flex-shrink: 0;
  background: ${skeletonGradient};
  background-size: 200% 100%;
  animation: ${skeletonPulse} 1.2s ease-in-out infinite;
`;

export const SkeletonBadge = styled(SkeletonLine)`
  border-radius: 999px;
`;

export const CardWrapper = styled.div<{ $tasksGlow?: boolean }>`
  background: var(--color-white);
  border-radius: 12px;
  box-shadow: 2px 2px 8px 0 rgba(0, 5, 48, 0.08);
  padding: 20px;
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  gap: 20px;
  width: 100%;
  transition: box-shadow 0.2s, border-color 0.2s;
  position: relative;
  overflow: hidden;
  border: 1px solid
    ${({ $tasksGlow }) =>
      $tasksGlow ? "var(--color-primary)" : "transparent"};
  box-shadow: ${({ $tasksGlow }) =>
    $tasksGlow
      ? "0 0 0 1px rgba(4,165,132,0.28), 0 6px 18px rgba(4,165,132,0.14)"
      : "2px 2px 8px 0 rgba(0, 5, 48, 0.08)"};

  &:hover {
    box-shadow: ${({ $tasksGlow }) =>
      $tasksGlow
        ? "0 0 0 1px rgba(4,165,132,0.4), 0 8px 22px rgba(4,165,132,0.2)"
        : "2px 2px 16px 0 rgba(0, 5, 48, 0.12)"};
  }
`;

export const CardTop = styled.div`
  display: flex;
  flex-direction: column;
  gap: 20px;
  width: 100%;
`;

export const CardBottom = styled.div`
  display: flex;
  flex-direction: column;
  gap: 20px;
  width: 100%;
`;

/* ---- Header ---- */
export const CardHeader = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 10px;
`;

export const ProjectInfo = styled.div`
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
  font-size: 14px;
  font-weight: var(--font-weight-semibold);
  color: var(--color-text-muted);

  img {
    width: 100%;
    height: 100%;
    object-fit: cover;
  }
`;

export const ProjectNameBlock = styled.div`
  display: flex;
  flex-direction: column;
  flex: 1;
  min-width: 0;
`;

export const ProjectNameRow = styled.div`
  display: flex;
  align-items: center;
  gap: 4px;
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

export const ProjectType = styled.span`
  font-family: "Gilroy", sans-serif;
  font-size: 14px;
  font-weight: var(--font-weight-regular);
  line-height: 18px;
  color: var(--color-text-muted);
`;

export const HeaderActions = styled.div`
  display: flex;
  align-items: center;
  gap: 8px;
  flex-shrink: 0;
`;

export const StatusBadge = styled.div<{ status?: string }>`
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 4px 10px;
  border-radius: 6px;
  background: ${({ status }) => {
    if (status === "Active") return "#e9f8f8";
    if (status === "Ended") return "#fef1f2";
    return "#f0f2f5";
  }};
  font-family: "Gilroy", sans-serif;
  font-size: 14px;
  font-weight: var(--font-weight-regular);
  line-height: 18px;
  white-space: nowrap;
  color: ${({ status }) => {
    if (status === "Active") return "var(--color-primary)";
    if (status === "Ended") return "var(--color-danger)";
    return "var(--color-text-muted)";
  }};
`;

export const StarButton = styled.button<{ active?: boolean }>`
  background: none;
  border: none;
  padding: 0;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  width: 24px;
  height: 24px;
  color: ${({ active }) => (active ? "var(--color-warning)" : "var(--color-text-muted)")};
  transition: color 0.15s;
  flex-shrink: 0;

  &:hover {
    color: var(--color-warning);
  }
`;

/* ---- Meta row (Category / Difficulty / Reward) ---- */
export const MetaRow = styled.div`
  display: flex;
  gap: 10px;
  width: 100%;
`;

export const MetaItem = styled.div`
  flex: 1;
  min-width: 0;
  display: flex;
  flex-direction: column;
  gap: 2px;
`;

export const MetaLabel = styled.span`
  font-family: "Gilroy", sans-serif;
  font-size: 14px;
  font-weight: var(--font-weight-regular);
  line-height: 18px;
  color: var(--color-text-muted);
`;

export const MetaValue = styled.span<{ difficulty?: string; $truncate?: boolean }>`
  display: block;
  font-family: "Gilroy", sans-serif;
  font-size: 14px;
  font-weight: var(--font-weight-semibold);
  line-height: 18px;
  ${({ $truncate }) =>
    $truncate
      ? `
        white-space: nowrap;
        overflow: hidden;
        text-overflow: ellipsis;
      `
      : ""}
  color: ${({ difficulty }) => {
    if (!difficulty) return "var(--color-text-primary)";
    if (difficulty === "Easy") return "var(--color-primary)";
    if (difficulty === "Medium") return "#f5a623";
    if (difficulty === "Hard") return "var(--color-danger)";
    return "var(--color-text-primary)";
  }};
`;

/* ---- Divider ---- */
export const Divider = styled.div`
  width: 100%;
  height: 1px;
  background: #f0f2f5;
`;

/* ---- Tags ---- */
export const TagsRow = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  height: 26px;
  overflow: hidden;
`;

export const Tag = styled.div<{ variant?: TagVariant }>`
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 4px 8px;
  border-radius: 6px;
  font-family: "Gilroy", sans-serif;
  font-size: 14px;
  font-weight: var(--font-weight-regular);
  line-height: 18px;
  white-space: nowrap;

  ${({ variant }) => {
    switch (variant) {
      case "deadline":
        return `
          background: #fef1f2;
          border: 1px solid #fef1f2;
          color: var(--color-danger);
        `;
      case "green":
        return `
          background: #e9f8f8;
          color: var(--color-primary);
        `;
      case "type":
      default:
        return `
          background: #f0f2f5;
          color: var(--color-text-primary);
        `;
    }
  }}
`;

/* ---- Description ---- */
export const Description = styled.div`
  font-family: "Gilroy", sans-serif;
  font-size: 14px;
  font-weight: var(--font-weight-regular);
  line-height: 18px;
  color: #728094;
  margin: 0;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;

  p,
  h1,
  h2,
  h3,
  h4,
  h5,
  h6,
  ul,
  ol,
  li,
  blockquote,
  pre {
    display: inline;
    margin: 0;
    padding: 0;
    font: inherit;
  }

  li:not(:last-child)::after,
  p:not(:last-child)::after {
    content: " ";
  }

  img,
  table,
  hr {
    display: none;
  }

  a {
    color: inherit;
    text-decoration: underline;
  }
`;

/* ---- Stats row ---- */
export const StatsRow = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  width: 100%;
`;

export const StatsLeft = styled.div`
  display: flex;
  align-items: center;
  gap: 20px;
`;

export const StatItem = styled.div`
  display: flex;
  align-items: center;
  gap: 4px;
  color: #728094;
`;

export const StatText = styled.span`
  font-family: "Gilroy", sans-serif;
  font-size: 14px;
  font-weight: var(--font-weight-regular);
  line-height: 18px;
  color: #728094;
  white-space: nowrap;
`;

export const RaisedText = styled.span`
  font-family: "Gilroy", sans-serif;
  font-size: 14px;
  font-weight: var(--font-weight-regular);
  line-height: 18px;
  color: var(--color-primary);
  white-space: nowrap;
`;

/* ---- Progress ---- */
export const ProgressSection = styled.div`
  display: flex;
  flex-direction: column;
  gap: 8px;
  width: 100%;
`;

export const DateRow = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  width: 100%;
`;

export const DateGroup = styled.div`
  display: flex;
  align-items: center;
  gap: 4px;
`;

export const DateLabel = styled.span`
  font-family: "Gilroy", sans-serif;
  font-size: 14px;
  font-weight: var(--font-weight-regular);
  line-height: 18px;
  color: var(--color-text-muted);
  white-space: nowrap;
`;

export const DateValue = styled.span`
  font-family: "Gilroy", sans-serif;
  font-size: 14px;
  font-weight: var(--font-weight-semibold);
  line-height: 18px;
  color: var(--color-text-primary);
  white-space: nowrap;
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

/* ---- Footer ---- */
export const CardFooter = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  width: 100%;
`;

export const TaskTypeText = styled.span`
  font-family: "Gilroy", sans-serif;
  font-size: 14px;
  font-weight: var(--font-weight-regular);
  line-height: 18px;
  color: var(--color-text-muted);
  white-space: nowrap;
`;

export const FooterLeft = styled.div`
  display: flex;
  align-items: center;
  gap: 10px;
  min-width: 0;
`;

export const FomoTasksChip = styled.button`
  display: inline-flex;
  align-items: center;
  gap: 6px;
  height: 26px;
  padding: 0 10px;
  border-radius: 999px;
  border: 1px solid var(--color-primary-soft);
  background: var(--color-primary-soft);
  color: var(--color-primary);
  font-family: "Gilroy", sans-serif;
  font-size: 13px;
  font-weight: var(--font-weight-semibold);
  cursor: pointer;
  transition: background 0.15s, border-color 0.15s;
  white-space: nowrap;

  &:hover {
    border-color: var(--color-primary);
  }

  &:focus-visible {
    outline: 2px solid var(--color-primary);
    outline-offset: 2px;
  }
`;

export const DetailsButton = styled.button`
  display: flex;
  align-items: center;
  justify-content: center;
  width: 140px;
  height: 32px;
  padding: 6px 12px;
  border-radius: 6px;
  border: 1px solid var(--color-primary);
  background: transparent;
  font-family: "Gilroy", sans-serif;
  font-size: 14px;
  font-weight: var(--font-weight-semibold);
  line-height: 18px;
  color: var(--color-primary);
  cursor: pointer;
  transition:
    background 0.15s,
    color 0.15s;
  white-space: nowrap;

  &:hover {
    background: #e9f8f8;
  }
`;

/* ---- Locked card ---- */
export const BlurOverlay = styled.div`
  position: absolute;
  inset: 0;
  backdrop-filter: blur(10px);
  -webkit-backdrop-filter: blur(10px);
  background: rgba(255, 255, 255, 0.35);
  border-radius: 12px;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 10px;
  z-index: 2;
  cursor: default;
`;

export const LockedTitle = styled.p`
  font-family: "Gilroy", sans-serif;
  font-size: 16px;
  font-weight: var(--font-weight-semibold);
  line-height: 20px;
  color: var(--color-text-primary);
  text-align: center;
  margin: 0;
`;

export const LockedSubtitle = styled.p`
  font-family: "Gilroy", sans-serif;
  font-size: 14px;
  font-weight: var(--font-weight-regular);
  line-height: 18px;
  color: var(--color-text-muted);
  text-align: center;
  margin: 0;
`;

export const IconWrapper = styled.div`
  width: 40px;
  height: 40px;
  display: flex;
  align-items: center;
  justify-content: center;

  svg {
    width: 40px;
    height: 40px;
  }
`;
