import styled from "styled-components";

export const Row = styled.div`
  display: flex;
  align-items: center;
  gap: 20px;
  flex-direction: row;

  @media (max-width: 768px) {
    flex-direction: column;
    align-items: flex-start;
  }
`;

export const PageWrapper = styled.div`
  display: flex;
  flex-direction: column;
  gap: 20px;
  padding: 24px;
  max-width: 1400px;
  margin: 0 auto;
  width: 100%;
`;

export const PageHeader = styled.div`
  display: flex;
  flex-direction: column;
  gap: 8px;
`;

export const PageTitle = styled.h1`
  font-size: 24px;
  font-weight: 550;
  color: var(--color-text-primary);
  margin: 0;
`;

export const PageSubtitle = styled.p`
  font-size: 14px;
  color: var(--color-text-muted);
  margin: 0;
`;

export const ContentGrid = styled.div`
  display: grid;
  grid-template-columns: 1fr 1fr 1fr;
  gap: 20px;

  @media (max-width: 1200px) {
    grid-template-columns: 1fr 1fr;
  }

  @media (max-width: 768px) {
    grid-template-columns: 1fr;
  }
`;

export const LeftColumn = styled.div`
  display: flex;
  flex-direction: column;
  gap: 20px;
`;

export const MiddleColumn = styled.div`
  display: flex;
  flex-direction: column;
  gap: 20px;
`;

export const RightColumn = styled.div`
  display: flex;
  flex-direction: column;
  gap: 20px;
`;

export const Card = styled.div`
  background: var(--color-white);
  border-radius: 16px;
  padding: 20px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.05);
`;

export const CardHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16px;
`;

export const CardTitle = styled.h3`
  font-size: 16px;
  font-weight: var(--font-weight-semibold);
  color: var(--color-text-primary);
  margin: 0;
`;

export const CardBadge = styled.span`
  font-size: 12px;
  color: var(--color-text-muted);
  background: var(--color-surface-muted);
  padding: 4px 8px;
  border-radius: 8px;
`;

// Entity Header Card
export const EntityHeaderCard = styled(Card)`
  display: flex;
  flex-direction: column;
  gap: 16px;
`;

export const EntityTopRow = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
`;

export const EntityInfo = styled.div`
  display: flex;
  gap: 16px;
  align-items: flex-start;
`;

export const EntityAvatar = styled.img`
  width: 64px;
  height: 64px;
  border-radius: 50%;
  object-fit: cover;
`;

export const EntityDetails = styled.div`
  display: flex;
  flex-direction: column;
  gap: 4px;
`;

export const EntityName = styled.h2`
  font-size: 20px;
  font-weight: var(--font-weight-semibold);
  color: var(--color-text-primary);
  margin: 0;
`;

export const EntityType = styled.span`
  font-size: 12px;
  color: var(--color-primary);
  background: rgba(5, 165, 132, 0.1);
  padding: 4px 12px;
  border-radius: 12px;
  width: max-content;
`;

export const EntityDescription = styled.p`
  font-size: 14px;
  color: var(--color-text-muted);
  margin: 8px 0;
  line-height: 1.5;
`;

export const SeeMoreLink = styled.span`
  color: #2563eb;
  cursor: pointer;
  font-size: 14px;
`;

export const SnapshotInfo = styled.div`
  font-size: 12px;
  color: var(--color-text-muted);
  text-align: right;
`;

export const ActionButtons = styled.div`
  display: flex;
  gap: 8px;
`;

export const ActionButton = styled.button<{
  variant?: "primary" | "secondary";
}>`
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 8px 16px;
  border-radius: 8px;
  font-size: 14px;
  font-weight: var(--font-weight-medium);
  cursor: pointer;
  transition: all 0.2s;

  ${({ variant }) =>
    variant === "primary"
      ? `
    background: var(--color-text-primary);
    color: var(--color-white);
    border: none;
    &:hover {
      background: #1a1f4d;
    }
  `
      : `
    background: var(--color-white);
    color: var(--color-text-primary);
    border: 1px solid #e5e7eb;
    &:hover {
      background: var(--color-surface-muted);
    }
  `}
`;

// Stats Grid
export const StatsGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 16px;
  padding-top: 16px;
  border-top: 1px solid #e5e7eb;
`;

export const StatItem = styled.div`
  display: flex;
  flex-direction: column;
  gap: 4px;
`;

export const StatLabel = styled.span`
  font-size: 12px;
  color: var(--color-text-muted);
`;

export const StatValue = styled.span`
  font-size: 18px;
  font-weight: var(--font-weight-semibold);
  color: var(--color-text-primary);
`;

export const StatSubValue = styled.span`
  font-size: 12px;
  color: var(--color-primary);
`;

export const ActivityBadge = styled.span<{ level: "high" | "medium" | "low" }>`
  font-size: 12px;
  font-weight: var(--font-weight-medium);
  padding: 4px 12px;
  border-radius: 12px;
  width: max-content;
  ${({ level }) => {
    switch (level) {
      case "high":
        return `
          background: rgba(5, 165, 132, 0.1);
          color: var(--color-primary);
        `;
      case "medium":
        return `
          background: rgba(255, 193, 7, 0.1);
          color: #ffc107;
        `;
      case "low":
        return `
          background: rgba(255, 88, 88, 0.1);
          color: var(--color-danger);
        `;
    }
  }}
`;

// Activity Overview
export const ActivityOverviewCard = styled(Card)``;

export const ActivityRow = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 8px 0;
`;

export const ActivityLabel = styled.span`
  font-size: 14px;
  color: var(--color-text-primary);
`;

export const ActivityValue = styled.span`
  font-size: 14px;
  font-weight: var(--font-weight-medium);
  color: var(--color-text-primary);
`;

export const ProgressBar = styled.div<{ value: number; color?: string }>`
  width: 100px;
  height: 6px;
  background: #e5e7eb;
  border-radius: 3px;
  position: relative;
  overflow: hidden;

  &::after {
    content: "";
    position: absolute;
    left: 0;
    top: 0;
    height: 100%;
    width: ${({ value }) => value}%;
    background: ${({ color }) => color || "var(--color-primary)"};
    border-radius: 3px;
  }
`;

// Audience Snapshot
export const AudienceSnapshotCard = styled(Card)``;

export const AudienceRow = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 8px 0;
`;

export const AudienceLabel = styled.span`
  font-size: 14px;
  color: var(--color-text-primary);
`;

export const AudienceValue = styled.span`
  font-size: 14px;
  font-weight: var(--font-weight-medium);
  color: var(--color-text-primary);
`;

// Engagement Timeline
export const EngagementTimelineCard = styled(Card)`
  grid-column: span 1;
`;

export const TimelineHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16px;
`;

export const TimelineLegend = styled.div`
  display: flex;
  gap: 16px;
`;

export const LegendItem = styled.div`
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 12px;
  color: var(--color-text-muted);
`;

export const LegendDot = styled.span<{ color: string }>`
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: ${({ color }) => color};
`;

export const TimelinePeriods = styled.div`
  display: flex;
  gap: 8px;
`;

export const PeriodButton = styled.button<{ active?: boolean }>`
  padding: 4px 12px;
  border-radius: 6px;
  font-size: 12px;
  border: none;
  cursor: pointer;
  background: ${({ active }) => (active ? "var(--color-text-primary)" : "var(--color-surface-muted)")};
  color: ${({ active }) => (active ? "var(--color-white)" : "var(--color-text-muted)")};
`;

export const ChartContainer = styled.div`
  height: 200px;
  display: flex;
  align-items: flex-end;
  justify-content: space-between;
  gap: 8px;
  padding-top: 16px;
`;

export const ChartTooltip = styled.div`
  position: absolute;
  background: var(--color-text-primary);
  color: var(--color-white);
  padding: 8px 12px;
  border-radius: 8px;
  font-size: 12px;
  white-space: nowrap;
`;

// AI Summary
export const AISummaryCard = styled(Card)``;

export const AISummaryText = styled.p`
  font-size: 14px;
  color: var(--color-text-muted);
  line-height: 1.6;
  margin: 0;
`;

// Product Overview
export const ProductOverviewCard = styled(Card)``;

export const RatingRow = styled.div`
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 12px;
`;

export const RatingStars = styled.div`
  display: flex;
  gap: 2px;
`;

export const RatingValue = styled.span`
  font-size: 14px;
  font-weight: var(--font-weight-medium);
  color: var(--color-text-primary);
`;

export const ProductTags = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  margin-bottom: 16px;
`;

export const ProductTag = styled.span<{ variant?: "primary" | "secondary" }>`
  font-size: 12px;
  padding: 4px 12px;
  border-radius: 12px;
  ${({ variant }) =>
    variant === "primary"
      ? `
    background: rgba(37, 99, 235, 0.1);
    color: #2563eb;
  `
      : `
    background: rgba(5, 165, 132, 0.1);
    color: var(--color-primary);
  `}
`;

export const FeedbackSection = styled.div`
  margin-top: 16px;
`;

export const FeedbackTitle = styled.h4`
  font-size: 14px;
  font-weight: var(--font-weight-medium);
  color: var(--color-text-primary);
  margin: 0 0 8px 0;
`;

export const FeedbackText = styled.p`
  font-size: 14px;
  color: var(--color-text-muted);
  line-height: 1.5;
  margin: 0;
`;

export const TrustIndicators = styled.div`
  margin-top: 16px;
`;

export const TrustList = styled.ul`
  margin: 8px 0;
  padding-left: 20px;
`;

export const TrustItem = styled.li`
  font-size: 14px;
  color: var(--color-text-muted);
  line-height: 1.6;
`;

export const RefundRate = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-top: 16px;
  padding-top: 16px;
  border-top: 1px solid #e5e7eb;
`;

// Channel Snapshot
export const ChannelSnapshotCard = styled(Card)``;

export const SnapshotRow = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 8px 0;
`;

export const SnapshotLabel = styled.span`
  font-size: 14px;
  color: var(--color-text-primary);
`;

export const SnapshotValue = styled.span`
  font-size: 14px;
  font-weight: var(--font-weight-medium);
  color: var(--color-text-primary);
`;

export const SnapshotNote = styled.p`
  font-size: 12px;
  color: var(--color-text-muted);
  margin: 12px 0 0 0;
  line-height: 1.5;
`;

// Health & Safety
export const HealthSafetyCard = styled(Card)``;

export const HealthRow = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 8px 0;
`;

export const HealthLabel = styled.span`
  font-size: 14px;
  color: var(--color-text-primary);
`;

export const HealthBadge = styled.span<{ variant: "good" | "medium" | "low" }>`
  font-size: 12px;
  font-weight: var(--font-weight-medium);
  padding: 4px 12px;
  border-radius: 12px;
  ${({ variant }) => {
    switch (variant) {
      case "good":
        return `
          background: rgba(5, 165, 132, 0.1);
          color: var(--color-primary);
        `;
      case "medium":
        return `
          background: rgba(255, 193, 7, 0.1);
          color: #ffc107;
        `;
      case "low":
        return `
          background: rgba(255, 88, 88, 0.1);
          color: var(--color-danger);
        `;
    }
  }}
`;

export const HealthNote = styled.p`
  font-size: 12px;
  color: var(--color-text-muted);
  margin: 12px 0 0 0;
  line-height: 1.5;
`;

// Related Channels
export const RelatedChannelsCard = styled(Card)``;

export const RelatedChannelRow = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 12px 0;
  border-bottom: 1px solid #e5e7eb;

  &:last-child {
    border-bottom: none;
  }
`;

export const RelatedChannelName = styled.span`
  font-size: 14px;
  color: var(--color-text-primary);
`;

export const RelatedChannelActivity = styled.div`
  display: flex;
  align-items: center;
  gap: 8px;
`;

// Recent Posts
export const RecentPostsCard = styled(Card)`
  grid-column: span 1;
`;

export const PostsHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16px;
`;

export const PreviewOnlyBadge = styled.span`
  font-size: 12px;
  color: var(--color-text-muted);
  background: var(--color-surface-muted);
  padding: 4px 12px;
  border-radius: 8px;
  border: 1px solid #e5e7eb;
`;

export const PostItem = styled.div`
  padding: 16px 0;
  border-bottom: 1px solid #e5e7eb;

  &:last-child {
    border-bottom: none;
  }
`;

export const PostContent = styled.p`
  font-size: 14px;
  color: var(--color-text-primary);
  line-height: 1.6;
  margin: 0 0 12px 0;
`;

export const PostImages = styled.div`
  display: flex;
  gap: 8px;
  margin-bottom: 12px;
`;

export const PostImage = styled.img`
  width: 80px;
  height: 80px;
  border-radius: 8px;
  object-fit: cover;
`;

export const PostStats = styled.div`
  display: flex;
  gap: 16px;
  align-items: center;
`;

export const PostStat = styled.div`
  display: flex;
  align-items: center;
  gap: 4px;
  font-size: 12px;
  color: var(--color-text-muted);
`;

export const PostDate = styled.span`
  font-size: 12px;
  color: var(--color-text-muted);
  margin-left: auto;
`;

// Full Width Section
export const FullWidthSection = styled.div`
  grid-column: 1 / -1;
`;
