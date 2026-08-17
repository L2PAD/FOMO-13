import styled, { css } from "styled-components";

const richTextContent = css`
  overflow-wrap: anywhere;

  > :first-child {
    margin-top: 0;
  }

  > :last-child {
    margin-bottom: 0;
  }

  p {
    margin: 0 0 10px;
  }

  h1,
  h2,
  h3,
  h4,
  h5,
  h6 {
    margin: 14px 0 8px;
    color: inherit;
    font-family: "Gilroy", sans-serif;
    font-weight: var(--font-weight-semibold);
    line-height: 1.3;
  }

  h1 { font-size: 20px; }
  h2 { font-size: 18px; }
  h3 { font-size: 16px; }
  h4,
  h5,
  h6 { font-size: 14px; }

  ul,
  ol {
    margin: 0 0 10px;
    padding-left: 22px;
  }

  ul li { list-style: disc; }
  ol li { list-style: decimal; }
  li { margin: 0 0 5px; }

  a {
    color: var(--color-info);
    font-weight: var(--font-weight-semibold);
    text-decoration: underline;
    text-underline-offset: 2px;
  }

  blockquote {
    margin: 10px 0;
    padding: 8px 12px;
    border-left: 3px solid var(--color-primary);
    background: #f5fbfd;
  }

  pre {
    max-width: 100%;
    overflow-x: auto;
    margin: 10px 0;
    padding: 10px 12px;
    border-radius: 6px;
    background: #101828;
    color: #f2f4f7;
    white-space: pre-wrap;
  }

  code {
    border-radius: 4px;
    padding: 1px 4px;
    background: #f0f2f5;
    font-family: Consolas, Monaco, monospace;
  }

  pre code {
    padding: 0;
    background: transparent;
    color: inherit;
  }

  img {
    display: block;
    max-width: 100%;
    height: auto;
    margin: 10px auto;
    border-radius: 8px;
  }

  table {
    display: block;
    width: 100%;
    max-width: 100%;
    overflow-x: auto;
    margin: 10px 0;
    border-collapse: collapse;
  }

  th,
  td {
    min-width: 100px;
    padding: 7px 9px;
    border: 1px solid #e4e7ec;
    text-align: left;
    vertical-align: top;
  }

  th {
    background: #f8fafb;
    font-weight: var(--font-weight-semibold);
  }

  hr {
    margin: 14px 0;
    border: 0;
    border-top: 1px solid #e4e7ec;
  }
`;

export const PageLayout = styled.div`
  display: flex;
  gap: 20px;
  align-items: flex-start;
  width: 100%;
`;

export const LeftColumn = styled.div`
  flex: 1 0 0;
  min-width: 0;
  display: flex;
  flex-direction: column;
  gap: 20px;
`;

export const RightColumn = styled.div`
  flex-shrink: 0;
  width: 360px;
  display: flex;
  flex-direction: column;
  gap: 20px;
  position: sticky;
  top: 20px;
  align-self: flex-start;
  height: fit-content;

  @media (max-width: 1100px) {
    width: 100%;
  }

  @media (max-width: 1000px) {
    position: static;
    width: 100%;
  }
`;

export const Card = styled.div`
  background: var(--color-white);
  border: 1px solid #f0f2f5;
  border-radius: 12px;
  box-shadow: 2px 2px 8px 0 rgba(0, 5, 48, 0.08);
  padding: 20px;
  display: flex;
  flex-direction: column;
  gap: 20px;
  position: relative;
  overflow: hidden;
  width: 100%;
`;

export const HeroTop = styled.div`
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  width: 100%;

  @media (max-width: 600px) {
    flex-direction: column-reverse;
    gap: 12px;
  }
`;

export const HeroLeft = styled.div`
  display: flex;
  gap: 20px;
  align-items: center;
`;

export const ProjectLogo = styled.div`
  width: 72px;
  height: 72px;
  flex-shrink: 0;
  border-radius: 50%;
  box-shadow: 0 2px 12px 0 rgba(0, 0, 0, 0.03);
  overflow: hidden;
  background: #f0f2f5;
  display: flex;
  align-items: center;
  justify-content: center;
  font-family: "Gilroy", sans-serif;
  font-size: 22px;
  font-weight: var(--font-weight-semibold);
  color: var(--color-text-muted);

  img {
    width: 100%;
    height: 100%;
    object-fit: cover;
  }
`;

export const ProjectInfo = styled.div`
  display: flex;
  flex-direction: column;
  gap: 4px;
`;

export const ProjectName = styled.h1`
  font-family: "Gilroy", sans-serif;
  font-size: 32px;
  font-weight: var(--font-weight-semibold);
  color: var(--color-text-primary);
  margin: 0;
  line-height: normal;
`;

export const TypeRow = styled.div`
  display: flex;
  gap: 8px;
  align-items: center;
`;

export const ProjectType = styled.span`
  font-family: "Gilroy", sans-serif;
  font-size: 24px;
  font-weight: var(--font-weight-regular);
  color: #728094;
`;

export const StatusBadge = styled.span<{ status?: string }>`
  font-family: "Gilroy", sans-serif;
  font-size: 14px;
  font-weight: var(--font-weight-regular);
  line-height: 18px;
  padding: 4px 10px;
  border-radius: 6px;
  ${({ status }) => {
    const s = (status ?? "").toLowerCase();
    if (s === "active")
      return css`
        background: #e9f8f8;
        color: var(--color-primary);
      `;
    if (s === "ended")
      return css`
        background: #fef1f2;
        color: var(--color-danger);
      `;
    return css`
      background: #f0f2f5;
      color: #728094;
    `;
  }}
`;

export const HeroActions = styled.div`
  display: flex;
  gap: 12px;
  align-items: center;
  padding: 4px 0;

  @media (max-width: 600px) {
    flex-wrap: wrap;
  }
`;

export const ActionButton = styled.button<{ $active?: boolean; $activeColor?: string; $readOnly?: boolean }>`
  position: relative;
  background: none;
  border: 1px solid transparent;
  border-radius: 6px;
  padding: 0;
  cursor: ${({ $readOnly }) => ($readOnly ? "default" : "pointer")};
  width: 30px;
  height: 30px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: ${({ $active, $activeColor }) => ($active ? $activeColor || "var(--color-primary)" : "#728094")};
  transition:
    background 0.15s,
    border-color 0.15s,
    color 0.15s,
    opacity 0.15s;

  &:hover {
    color: ${({ $activeColor }) => $activeColor || "var(--color-primary)"};
    background: none;
    border-color: transparent;
  }

  ${({ $readOnly, $active, $activeColor }) =>
    $readOnly &&
    css`
      &:hover {
        color: ${$active ? $activeColor || "var(--color-primary)" : "#728094"};
        background: none;
        border-color: transparent;
      }
    `}

  &:disabled {
    cursor: wait;
    opacity: 0.55;
  }

  svg {
    width: 22px;
    height: 22px;
  }
`;

export const FlagCountBadge = styled.span<{ $color: string }>`
  position: absolute;
  top: -6px;
  right: -6px;
  min-width: 16px;
  height: 16px;
  padding: 0 4px;
  border-radius: 999px;
  background: ${({ $color }) => $color};
  color: var(--color-white);
  border: 2px solid var(--color-white);
  font-family: "Gilroy", sans-serif;
  font-size: 10px;
  font-weight: var(--font-weight-semibold);
  line-height: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  pointer-events: none;
`;

export const StatsBanner = styled.div`
  background: #f5fbfd;
  border-radius: 12px;
  padding: 12px 20px;
  display: flex;
  gap: 20px;
  align-items: center;
  width: 100%;

  @media (max-width: 600px) {
    flex-wrap: wrap;
  }
`;

export const StatItem = styled.div`
  flex: 1 0 0;
  min-width: 0;
  display: flex;
  flex-direction: column;
  gap: 4px;
  min-width: 100px;
`;

export const StatLabel = styled.p`
  font-family: "Gilroy", sans-serif;
  font-size: 14px;
  font-weight: var(--font-weight-regular);
  line-height: 18px;
  color: var(--color-text-muted);
  margin: 0;
`;

export const StatValue = styled.p<{ difficulty?: string; $truncate?: boolean }>`
  display: block;
  font-family: "Gilroy", sans-serif;
  font-size: 14px;
  font-weight: var(--font-weight-semibold);
  line-height: 18px;
  margin: 0;
  max-width: 100%;
  ${({ $truncate }) =>
    $truncate &&
    css`
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    `}
  ${({ difficulty }) => {
    if (!difficulty)
      return css`
        color: var(--color-text-primary);
      `;
    const d = difficulty.toLowerCase();
    if (d === "easy")
      return css`
        color: var(--color-primary);
      `;
    if (d === "medium")
      return css`
        color: var(--color-warning);
      `;
    if (d === "hard")
      return css`
        color: var(--color-danger);
      `;
    return css`
      color: var(--color-text-primary);
    `;
  }}
`;

export const HoverTooltipValue = styled.span<{ $align?: "left" | "right"; $placement?: "top" | "bottom" }>`
  position: relative;
  display: block;
  min-width: 0;
  max-width: 100%;

  > span {
    display: block;
    max-width: 100%;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }

  &[data-tooltip]:hover::after {
    content: attr(data-tooltip);
    position: absolute;
    ${({ $placement }) =>
    $placement === "top"
      ? "bottom: calc(100% + 6px);"
      : "top: calc(100% + 6px);"}
    ${({ $align }) => ($align === "right" ? "right: 0;" : "left: 0;")}
    z-index: 20;
    width: max-content;
    max-width: 280px;
    padding: 8px 10px;
    border-radius: 6px;
    background: var(--color-text-primary);
    color: var(--color-white);
    box-shadow: 0 6px 18px rgba(7, 11, 53, 0.18);
    font-family: "Gilroy", sans-serif;
    font-size: 12px;
    font-weight: var(--font-weight-medium);
    line-height: 16px;
    text-align: left;
    white-space: normal;
    pointer-events: none;
  }
`;

export const TaskTypeBadge = styled.span`
  font-family: "Gilroy", sans-serif;
  font-size: 14px;
  font-weight: var(--font-weight-semibold);
  line-height: 18px;
  color: #c24c00;
  margin: 0;
`;

export const ProgressSection = styled.div`
  display: flex;
  flex-direction: column;
  gap: 12px;
  width: 100%;
`;

export const DateRow = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  font-size: 14px;
  line-height: 18px;
`;

export const DateGroup = styled.div`
  display: flex;
  gap: 4px;
  align-items: center;
`;

export const DateLabel = styled.span`
  font-family: "Gilroy", sans-serif;
  font-weight: var(--font-weight-regular);
  color: var(--color-text-muted);
`;

export const DateValue = styled.span`
  font-family: "Gilroy", sans-serif;
  font-weight: var(--font-weight-semibold);
  color: var(--color-text-primary);
`;

export const ProgressBarWrapper = styled.div`
  width: 100%;
  height: 8px;
  background: #f9f9f9;
  border-radius: 8px;
  overflow: hidden;
`;

export const ProgressBarFill = styled.div<{ percent: number }>`
  height: 100%;
  width: ${({ percent }) => Math.min(100, Math.max(0, percent))}%;
  background: linear-gradient(90deg, var(--color-primary), #05c49e);
  border-radius: 8px;
  transition: width 0.4s ease;
`;

export const SocialRow = styled.div`
  display: flex;
  gap: 20px;
  align-items: center;
  padding: 4px 0;
`;

export const SocialButton = styled.a`
  width: 24px;
  height: 24px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #728094;
  cursor: pointer;
  text-decoration: none;
  transition:
    color 0.15s,
    opacity 0.15s;
  flex-shrink: 0;

  &:hover {
    color: var(--color-primary);
    opacity: 0.85;
  }

  svg {
    width: 24px;
    height: 24px;
  }
`;

export const SocialLinkButton = styled.a`
  width: 24px;
  height: 24px;
  border-radius: 20px;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  text-decoration: none;
  color: #728094;
  flex-shrink: 0;
  transition:
    border-color 0.15s,
    color 0.15s;

  &:hover {
    border-color: var(--color-primary);
    color: var(--color-primary);
  }
`;

export const SectionTitle = styled.h2`
  font-family: "Gilroy", sans-serif;
  font-size: 20px;
  font-weight: var(--font-weight-semibold);
  line-height: 28px;
  color: var(--color-text-primary);
  margin: 0;
  width: 100%;
`;

export const SectionTitleRow = styled.div`
  display: flex;
  gap: 4px;
  align-items: center;
  width: 100%;
`;

export const AboutTextBlock = styled.div`
  font-family: "Gilroy", sans-serif;
  font-size: 14px;
  font-weight: var(--font-weight-regular);
  line-height: 18px;
  color: var(--color-text-primary);
  text-align: justify;
  display: flex;
  flex-direction: column;
  gap: 12px;
  width: 100%;
  ${richTextContent}

  p {
    margin: 0;
  }

  ul,
  ol {
    margin: 0;
    padding-left: 20px;
  }

  li {
    margin-bottom: 4px;
    list-style-type: disc;
  }

  ol li {
    list-style-type: decimal;
  }

  h2,
  h3,
  h4 {
    font-family: "Gilroy", sans-serif;
    font-size: 14px;
    font-weight: var(--font-weight-semibold);
    line-height: 18px;
    color: var(--color-text-primary);
    margin: 0;
  }

  em {
    font-style: italic;
  }

  strong {
    font-weight: var(--font-weight-semibold);
  }

  a {
    color: var(--color-info);
    font-weight: var(--font-weight-semibold);
    text-decoration: none;
    &:hover {
      text-decoration: underline;
    }
  }

  blockquote {
    margin: 0;
    padding-left: 12px;
    border-left: 2px solid #d7e2e8;
  }
`;

export const RaisedBanner = styled.div`
  background: #f5fbfd;
  border: 1px solid #e9f8f8;
  border-radius: 12px;
  padding: 12px 20px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  width: 100%;
`;

export const RaisedLeft = styled.div`
  display: flex;
  gap: 12px;
  align-items: center;
`;

export const RaisedTextGroup = styled.div`
  display: flex;
  gap: 4px;
  align-items: center;
  font-size: 14px;
  line-height: 18px;
  color: var(--color-primary);
  white-space: nowrap;
`;

export const RaisedLabel = styled.span`
  font-family: "Gilroy", sans-serif;
  font-weight: var(--font-weight-regular);
`;

export const RaisedValue = styled.span`
  font-family: "Gilroy", sans-serif;
  font-weight: var(--font-weight-semibold);
`;

export const FundingTypeGroup = styled.div`
  display: flex;
  gap: 4px;
  align-items: center;
  font-size: 14px;
  line-height: 18px;
  color: var(--color-primary);
  white-space: nowrap;
`;

export const ReviewText = styled.div`
  font-family: "Gilroy", sans-serif;
  font-size: 14px;
  font-weight: var(--font-weight-regular);
  line-height: 18px;
  color: var(--color-text-primary);
  text-align: justify;
  margin: 0;
  width: 100%;
  ${richTextContent}
`;

export const ScoresRow = styled.div`
  display: flex;
  gap: 20px;
  align-items: center;
  width: 100%;
`;

export const ScoreCard = styled.div`
  flex: 1 0 0;
  min-width: 0;
  background: #f5fbfd;
  border: 1px solid #e9f8f8;
  border-radius: 12px;
  padding: 12px 20px;
  display: flex;
  flex-direction: column;
  gap: 4px;
`;

export const ScoreLabel = styled.p`
  font-family: "Gilroy", sans-serif;
  font-size: 14px;
  font-weight: var(--font-weight-regular);
  line-height: 18px;
  color: var(--color-primary);
  margin: 0;
  white-space: nowrap;
`;

export const ScoreValue = styled.p`
  font-family: "Gilroy", sans-serif;
  font-size: 14px;
  font-weight: var(--font-weight-semibold);
  line-height: 18px;
  color: var(--color-primary);
  margin: 0;
  white-space: nowrap;
`;

export const TaskTitle = styled.h2`
  font-family: "Gilroy", sans-serif;
  font-size: 20px;
  font-weight: var(--font-weight-semibold);
  line-height: 28px;
  color: var(--color-text-primary);
  margin: 0;
  width: 100%;
`;

export const TaskDescription = styled.div`
  font-family: "Gilroy", sans-serif;
  font-size: 14px;
  font-weight: var(--font-weight-regular);
  line-height: 18px;
  color: var(--color-text-primary);
  text-align: justify;
  margin: 0;
  width: 100%;
  ${richTextContent}

  p {
    margin: 0 0 8px;
  }

  p:last-child {
    margin-bottom: 0;
  }

  ul,
  ol {
    margin: 0 0 8px;
    padding-left: 20px;
  }

  li {
    margin-bottom: 4px;
  }

  h2,
  h3,
  h4 {
    font-family: "Gilroy", sans-serif;
    font-size: 14px;
    font-weight: var(--font-weight-semibold);
    line-height: 18px;
    color: var(--color-text-primary);
    margin: 0 0 8px;
  }

  strong {
    font-weight: var(--font-weight-semibold);
  }

  em {
    font-style: italic;
  }

  a {
    color: var(--color-info);
    font-weight: var(--font-weight-semibold);
    text-decoration: none;
    &:hover {
      text-decoration: underline;
    }
  }
`;

export const TaskDivider = styled.hr`
  width: 100%;
  height: 1px;
  border: 0;
  background: #f0f2f5;
  margin: 0;
`;

export const TaskProgressRow = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 12px;
  width: 100%;
`;

export const TaskProgressLabel = styled.span`
  font-family: "Gilroy", sans-serif;
  font-size: 14px;
  font-weight: var(--font-weight-regular);
  line-height: 18px;
  color: #728094;
`;

export const TaskProgressValue = styled.span`
  font-family: "Gilroy", sans-serif;
  font-size: 14px;
  font-weight: var(--font-weight-semibold);
  line-height: 18px;
  color: var(--color-primary);
`;

export const TaskProgressSteps = styled.span`
  font-family: "Gilroy", sans-serif;
  font-size: 14px;
  font-weight: var(--font-weight-regular);
  line-height: 18px;
  color: #728094;
  white-space: nowrap;
`;

export const TaskProgressBarWrap = styled.div`
  width: 100%;
  height: 8px;
  background: #f0f2f5;
  border-radius: 999px;
  overflow: hidden;
`;

export const TaskProgressBarFill = styled.div<{ $percent: number }>`
  width: ${({ $percent }) => Math.max(0, Math.min(100, $percent))}%;
  height: 100%;
  background: var(--color-primary);
  border-radius: inherit;
  transition: width 0.18s ease;
`;

export const TaskMetaRow = styled.div`
  display: flex;
  gap: 12px;
  flex-wrap: wrap;
  align-items: center;
  width: 100%;
`;

export const TaskMetaItem = styled.div`
  display: inline-flex;
  gap: 6px;
  align-items: center;
  min-width: 0;
`;

export const TaskMetaText = styled.span`
  font-family: "Gilroy", sans-serif;
  font-size: 14px;
  font-weight: var(--font-weight-regular);
  line-height: 18px;
  color: #728094;
`;

export const StepsHeading = styled.div`
  display: flex;
  gap: 8px;
  align-items: center;
  font-family: "Gilroy", sans-serif;
  font-size: 20px;
  font-weight: var(--font-weight-semibold);
  line-height: 28px;
  color: var(--color-text-primary);
  width: 100%;
`;

export const StepCard = styled.div<{ $completed?: boolean; $locked?: boolean }>`
  display: flex;
  gap: 16px;
  align-items: flex-start;
  width: 100%;
  padding: 16px;
  border: 1px solid ${({ $completed, $locked }) => ($locked ? "#f0f2f5" : $completed ? "#dff3ef" : "#f0f2f5")};
  background: ${({ $completed, $locked }) => ($locked ? "var(--color-surface-subtle)" : $completed ? "#f5fbfd" : "var(--color-white)")};
  border-radius: 8px;

  @media (max-width: 720px) {
    flex-direction: column;
  }
`;

export const StepLeftCol = styled.div`
  display: flex;
  flex-direction: column;
  gap: 12px;
  align-items: center;
  flex-shrink: 0;

  @media (max-width: 720px) {
    flex-direction: row;
  }
`;

export const StepNumberBadge = styled.div<{ $completed?: boolean; $locked?: boolean }>`
  width: 40px;
  height: 40px;
  border-radius: 50%;
  background: ${({ $completed, $locked }) => ($locked ? "#f0f2f5" : $completed ? "var(--color-primary)" : "#f0f2f5")};
  display: flex;
  align-items: center;
  justify-content: center;
`;

export const StepNumberText = styled.span<{ $completed?: boolean }>`
  font-family: "Gilroy", sans-serif;
  font-size: 14px;
  font-weight: var(--font-weight-semibold);
  line-height: 18px;
  color: ${({ $completed }) => ($completed ? "var(--color-white)" : "#728094")};
`;

export const StepCheckButton = styled.button`
  border: 0;
  background: transparent;
  padding: 0;
  margin: 0;
  display: flex;
  cursor: pointer;

  &:disabled {
    cursor: default;
    opacity: 0.65;
  }
`;

export const StepContent = styled.div`
  flex: 1 1 auto;
  min-width: 0;
  display: flex;
  flex-direction: column;
  gap: 12px;
`;

export const StepCardTitle = styled.h3<{ $completed?: boolean; $locked?: boolean }>`
  font-family: "Gilroy", sans-serif;
  font-size: 20px;
  font-weight: var(--font-weight-semibold);
  line-height: 28px;
  color: ${({ $completed, $locked }) => ($locked ? "#728094" : $completed ? "var(--color-text-primary)" : "#728094")};
  margin: 0;
  width: 100%;
`;

export const StepCardText = styled.div<{ $completed?: boolean; $locked?: boolean }>`
  font-family: "Gilroy", sans-serif;
  font-size: 14px;
  font-weight: var(--font-weight-regular);
  line-height: 18px;
  color: ${({ $completed, $locked }) => ($locked ? "var(--color-text-soft)" : $completed ? "var(--color-text-primary)" : "#728094")};
  text-align: justify;
  margin: 0;
  width: 100%;
  ${richTextContent}

  p {
    margin: 0 0 8px;
  }

  p:last-child {
    margin-bottom: 0;
  }

  ul,
  ol {
    margin: 0 0 8px;
    padding-left: 20px;
  }

  li {
    margin-bottom: 4px;
  }

  h2,
  h3,
  h4 {
    font-family: "Gilroy", sans-serif;
    font-size: 14px;
    font-weight: var(--font-weight-semibold);
    line-height: 18px;
    color: inherit;
    margin: 0 0 8px;
  }

  strong {
    font-weight: var(--font-weight-semibold);
  }

  em {
    font-style: italic;
  }

  a {
    color: var(--color-info);
    font-weight: var(--font-weight-semibold);
    text-decoration: none;
    &:hover {
      text-decoration: underline;
    }
  }
`;

export const StepCardImage = styled.div`
  border-radius: 6px;
  overflow: hidden;
  width: 246px;
  max-width: 100%;
  flex-shrink: 0;
  background: #f0f2f5;

  img {
    width: 100%;
    height: auto;
    object-fit: contain;
    display: block;
  }
`;

export const StepTimeCol = styled.div<{ $locked?: boolean }>`
  display: inline-flex;
  gap: 6px;
  align-items: center;
  flex-shrink: 0;
  color: ${({ $locked }) => ($locked ? "var(--color-text-soft)" : "#728094")};

  @media (max-width: 720px) {
    align-self: flex-start;
  }
`;

export const StepTimeText = styled.span<{ $locked?: boolean }>`
  font-family: "Gilroy", sans-serif;
  font-size: 14px;
  font-weight: var(--font-weight-regular);
  line-height: 18px;
  color: ${({ $locked }) => ($locked ? "var(--color-text-soft)" : "#728094")};
  white-space: nowrap;
`;

export const StepCtaGreen = styled.a`
  display: inline-flex;
  gap: 6px;
  align-items: center;
  justify-content: center;
  height: 32px;
  padding: 6px 12px;
  background: var(--color-primary);
  border-radius: 6px;
  font-family: "Gilroy", sans-serif;
  font-size: 14px;
  font-weight: var(--font-weight-semibold);
  line-height: 18px;
  color: var(--color-white);
  text-decoration: none;
  cursor: pointer;
  white-space: nowrap;
  flex-shrink: 0;
  transition: opacity 0.15s;
  width: fit-content;

  &:hover {
    opacity: 0.88;
  }
`;

export const StepBlock = styled.div`
  display: flex;
  flex-direction: column;
  gap: 12px;
  width: 100%;
`;

export const StepHeader = styled.div`
  display: flex;
  align-items: flex-start;
  gap: 10px;
  width: 100%;
`;

export const StepCheckbox = styled.input`
  width: 16px;
  height: 16px;
  margin: 6px 0 0;
  flex-shrink: 0;
  accent-color: var(--color-primary);
  cursor: pointer;
`;

export const StepTitle = styled.h3`
  font-family: "Gilroy", sans-serif;
  font-size: 20px;
  font-weight: var(--font-weight-semibold);
  line-height: 28px;
  color: var(--color-text-primary);
  margin: 0;
  width: 100%;
`;

export const StepText = styled.div`
  font-family: "Gilroy", sans-serif;
  font-size: 14px;
  font-weight: var(--font-weight-regular);
  line-height: 18px;
  color: var(--color-text-primary);
  text-align: justify;
  margin: 0;
  width: 100%;

  p {
    margin: 0 0 8px;
  }

  p:last-child {
    margin-bottom: 0;
  }

  ul,
  ol {
    margin: 0 0 8px;
    padding-left: 20px;
  }

  li {
    margin-bottom: 4px;
  }

  h2,
  h3,
  h4 {
    font-family: "Gilroy", sans-serif;
    font-size: 14px;
    font-weight: var(--font-weight-semibold);
    line-height: 18px;
    color: var(--color-text-primary);
    margin: 0 0 8px;
  }

  strong {
    font-weight: var(--font-weight-semibold);
  }

  em {
    font-style: italic;
  }

  a {
    color: var(--color-info);
    font-weight: var(--font-weight-semibold);
    text-decoration: none;
    &:hover {
      text-decoration: underline;
    }
  }
`;

export const StepCtaGray = styled.div`
  display: inline-flex;
  gap: 6px;
  align-items: center;
  justify-content: center;
  min-height: 32px;
  padding: 6px 12px;
  background: #f0f2f5;
  border-radius: 6px;
  font-family: "Gilroy", sans-serif;
  font-size: 14px;
  font-weight: var(--font-weight-semibold);
  line-height: 18px;
  color: #728094;
  white-space: nowrap;
`;

export const StepImage = styled.div`
  border-radius: 6px;
  overflow: hidden;
  width: 246px;
  height: 246px;
  flex-shrink: 0;
  background: #f0f2f5;

  img {
    width: 100%;
    height: 100%;
    object-fit: cover;
    display: block;
  }
`;

export const SuccessMessage = styled.div`
  font-family: "Gilroy", sans-serif;
  font-size: 16px;
  font-weight: var(--font-weight-semibold);
  line-height: 20px;
  color: var(--color-text-primary);
  text-align: center;
  width: 100%;
`;

export const DailyTaskBanner = styled.div`
  background: #f5fbfd;
  border: 1px solid #e9f8f8;
  border-radius: 12px;
  padding: 12px 20px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  width: 100%;
  flex-shrink: 0;

  @media (max-width: 600px) {
    flex-direction: column;
    gap: 12px;
    align-items: flex-start;
  }
`;

export const DailyTaskLeft = styled.div`
  display: flex;
  flex-direction: column;
  gap: 4px;
`;

export const DailyTaskLabel = styled.p`
  font-family: "Gilroy", sans-serif;
  font-size: 16px;
  font-weight: var(--font-weight-semibold);
  line-height: 20px;
  color: var(--color-primary);
  margin: 0;
  white-space: nowrap;
`;

export const DailyTaskSubtitle = styled.p`
  font-family: "Gilroy", sans-serif;
  font-size: 14px;
  font-weight: var(--font-weight-regular);
  line-height: 18px;
  color: #728094;
  margin: 0;
  white-space: nowrap;
`;

export const DailyTaskTimer = styled.div`
  display: flex;
  align-items: center;
  gap: 8px;
`;

export const DailyTimerUnit = styled.div`
  display: flex;
  align-items: center;
  gap: 2px;
`;

export const DailyTimerBox = styled.div`
  width: 32px;
  height: 32px;
  background: #e9f8f8;
  border-radius: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-family: "Gilroy", sans-serif;
  font-size: 16px;
  font-weight: var(--font-weight-semibold);
  line-height: 20px;
  color: var(--color-primary);
  flex-shrink: 0;
`;

export const DailyTimerSep = styled.span`
  font-family: "Gilroy", sans-serif;
  font-size: 14px;
  font-weight: var(--font-weight-regular);
  line-height: 18px;
  color: #728094;
  white-space: nowrap;
`;

export const BlurOverlay = styled.div`
  position: absolute;
  inset: 0;
  backdrop-filter: blur(10px);
  -webkit-backdrop-filter: blur(10px);
  background: rgba(255, 255, 255, 0.2);
  border-radius: 12px;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 20px;
  z-index: 2;
  cursor: default;
`;

export const LockedTitle = styled.p`
  font-family: "Gilroy", sans-serif;
  font-size: 20px;
  font-weight: var(--font-weight-regular);
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
  color: #728094;
  text-align: center;
  margin: 0;
`;

export const MetricRow = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  font-size: 14px;
  line-height: 18px;
  width: 100%;
  white-space: nowrap;

  @media (max-width: 600px) {
    flex-direction: column;
    align-items: flex-start;
    gap: 4px;

    span {
      width: 100%;
      text-align: left;
    }
  }
`;

export const MetricLabel = styled.span`
  font-family: "Gilroy", sans-serif;
  font-weight: var(--font-weight-regular);
  color: #728094;
`;

export const MetricValue = styled.span<{
  color?: "green" | "yellow" | "red" | "dark";
  $truncate?: boolean;
}>`
  display: block;
  font-family: "Gilroy", sans-serif;
  font-weight: var(--font-weight-regular);
  ${({ color }) => {
    if (color === "green")
      return css`
        color: var(--color-primary);
      `;
    if (color === "yellow")
      return css`
        color: var(--color-warning);
      `;
    if (color === "red")
      return css`
        color: var(--color-danger);
      `;
    return css`
      color: var(--color-text-primary);
    `;
  }}

  text-align: right;
  white-space: normal;
  ${({ $truncate }) =>
    $truncate &&
    css`
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    `}
  max-width: 54%;
`;

export const FlagList = styled.div`
  display: flex;
  flex-direction: column;
  gap: 12px;
  width: 100%;
`;

export const FlagItemRow = styled.div`
  display: flex;
  gap: 8px;
  align-items: flex-start;
  width: 100%;
`;

export const FlagText = styled.p`
  flex: 1 0 0;
  min-width: 0;
  font-family: "Gilroy", sans-serif;
  font-size: 14px;
  font-weight: var(--font-weight-regular);
  line-height: normal;
  color: var(--color-text-primary);
  margin: 0;
`;

export const FlagDivider = styled.div`
  width: 100%;
  height: 1px;
  background: #f0f2f5;
`;

export const SimilarSection = styled.div`
  display: flex;
  flex-direction: column;
  gap: 20px;
  width: 100%;
  margin-top: 40px;
`;

export const SimilarSectionTitle = styled.h2`
  font-family: "Gilroy", sans-serif;
  font-size: 24px;
  font-weight: var(--font-weight-semibold);
  line-height: normal;
  color: var(--color-text-primary);
  margin: 0;
`;

export const SimilarGrid = styled.div`
  display: flex;
  gap: 20px;
  align-items: stretch;
  width: 100%;

  /* Make each FeedCard fill equal width */
  > * {
    flex: 1 0 0;
    min-width: 0;
  }

  @media (max-width: 900px) {
    flex-direction: column;

    > * {
      flex: none;
    }
  }
`;

/* ── Weekly task – Phase Progress ── */

export const WeekPhasesRow = styled.div`
  display: flex;
  gap: 20px;
  align-items: stretch;
  width: 100%;

  @media (max-width: 700px) {
    flex-wrap: wrap;
  }
`;

export const WeekPhaseCard = styled.div<{ $active: boolean }>`
  flex: 1 0 0;
  min-width: 0;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 4px;
  padding: 12px 20px;
  border-radius: 12px;
  background: ${({ $active }) => ($active ? "#f5fbfd" : "var(--color-surface-subtle)")};
  border: 1px solid ${({ $active }) => ($active ? "#e9f8f8" : "#f0f2f5")};
`;

export const WeekPhaseTitle = styled.p<{ $active: boolean }>`
  font-family: "Gilroy", sans-serif;
  font-size: 16px;
  font-weight: var(--font-weight-semibold);
  line-height: 20px;
  color: ${({ $active }) => ($active ? "var(--color-primary)" : "#728094")};
  margin: 0;
  text-align: center;
  white-space: nowrap;
`;

export const WeekPhaseSubtitle = styled.p`
  font-family: "Gilroy", sans-serif;
  font-size: 14px;
  font-weight: var(--font-weight-regular);
  line-height: 18px;
  color: #728094;
  margin: 0;
  text-align: center;
  white-space: nowrap;
`;

export const WeekPhaseStatusText = styled.p`
  font-family: "Gilroy", sans-serif;
  font-size: 14px;
  font-weight: var(--font-weight-regular);
  line-height: 18px;
  color: var(--color-primary);
  margin: 0;
  text-align: center;
  white-space: nowrap;
`;

export const WeekPhaseLockRow = styled.div`
  display: flex;
  align-items: center;
  gap: 4px;
  justify-content: center;
  white-space: nowrap;
`;

export const StepLockedText = styled.p`
  font-family: "Gilroy", sans-serif;
  font-size: 14px;
  font-weight: var(--font-weight-regular);
  line-height: 18px;
  color: #728094;
  margin: 0;
  width: 100%;
`;

export const RepeatableBanner = styled.div`
  background: #fefcf3;
  border: 1px solid #ffc704;
  border-radius: 12px;
  padding: 12px 20px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  width: 100%;
`;

export const RepeatableBannerLeft = styled.div`
  display: flex;
  flex-direction: column;
  gap: 4px;
`;

export const RepeatableBannerTitle = styled.p`
  font-family: "Gilroy", sans-serif;
  font-size: 16px;
  font-weight: var(--font-weight-semibold);
  line-height: 20px;
  color: #c24c00;
  margin: 0;
  white-space: nowrap;
`;

export const RepeatableBannerSubtitle = styled.p`
  font-family: "Gilroy", sans-serif;
  font-size: 14px;
  font-weight: var(--font-weight-regular);
  line-height: 18px;
  color: #728094;
  margin: 0;
`;

export const RepeatableBannerRight = styled.div`
  display: flex;
  align-items: center;
  gap: 20px;
  flex-shrink: 0;
`;

export const RepeatableCyclesGroup = styled.div`
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  gap: 4px;
`;

export const RepeatableCyclesCount = styled.p`
  font-family: "Gilroy", sans-serif;
  font-size: 16px;
  font-weight: var(--font-weight-semibold);
  line-height: 20px;
  color: #c24c00;
  margin: 0;
  white-space: nowrap;
`;

export const RepeatableCyclesLabel = styled.p`
  font-family: "Gilroy", sans-serif;
  font-size: 14px;
  font-weight: var(--font-weight-regular);
  line-height: 18px;
  color: #728094;
  margin: 0;
  white-space: nowrap;
`;

export const NewCycleBtn = styled.button`
  background: #fff3c2;
  border: none;
  border-radius: 6px;
  padding: 4px 8px;
  display: flex;
  align-items: center;
  gap: 6px;
  cursor: pointer;
  font-family: "Gilroy", sans-serif;
  font-size: 12px;
  font-weight: var(--font-weight-regular);
  line-height: 14px;
  color: #c24c00;
  white-space: nowrap;
`;

export const ExpiredBanner = styled.div`
  background: #fef1f2;
  border: 1px solid #ffe1e0;
  border-radius: 12px;
  padding: 12px 20px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  width: 100%;
`;

export const ExpiredBannerLeft = styled.div`
  display: flex;
  flex-direction: column;
  gap: 4px;
`;

export const ExpiredBannerTitle = styled.p`
  font-family: "Gilroy", sans-serif;
  font-size: 16px;
  font-weight: var(--font-weight-semibold);
  line-height: 20px;
  color: var(--color-danger);
  margin: 0;
`;

export const ExpiredBannerSubtitle = styled.p`
  font-family: "Gilroy", sans-serif;
  font-size: 14px;
  font-weight: var(--font-weight-regular);
  line-height: 18px;
  color: #728094;
  margin: 0;
`;

export const ExpiredBannerStatus = styled.p`
  font-family: "Gilroy", sans-serif;
  font-size: 16px;
  font-weight: var(--font-weight-regular);
  line-height: 20px;
  color: var(--color-danger);
  margin: 0;
  white-space: nowrap;
`;

export const TaskMetaDeadline = styled.div`
  display: flex;
  align-items: center;
  gap: 4px;
  font-family: "Gilroy", sans-serif;
  font-size: 14px;
  font-weight: var(--font-weight-regular);
  line-height: 18px;
  color: var(--color-danger);
  white-space: nowrap;
`;
