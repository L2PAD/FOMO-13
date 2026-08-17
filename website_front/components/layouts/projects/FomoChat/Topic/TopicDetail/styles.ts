import styled from "styled-components";

export const TopicDetailWrapper = styled.div`
  width: 100%;
  padding: 20px 0;

  .tooltip-text {
    width: 320px;
    white-space: normal;
  }
`;

export const TopicHeader = styled.div`
  display: flex;
  align-items: center;
  margin-bottom: 24px;
`;

export const BackButton = styled.button`
  background: #f5fbfd;
  border: none;
  color: var(--color-primary);
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 16px;
  padding: 8px;
  transition: all 0.2s ease;

  &:hover {
    color: #1a1d26;
  }
`;

export const TopicContent = styled.div`
  display: flex;
  gap: 24px;

  @media (max-width: 1024px) {
    flex-direction: column;
  }
`;

export const LeftColumn = styled.div`
  flex: 1;
  min-width: 0;
`;

export const RightColumn = styled.div`
  width: 400px;
  display: flex;
  flex-direction: column;
  gap: 20px;

  @media (max-width: 1024px) {
    width: 100%;
  }
`;

export const AISection = styled.div``;

export const AISummaryHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16px;

  h3 {
    font-size: 18px;
    font-weight: var(--font-weight-semibold);
    color: #1a1d26;
    margin: 0;
  }

  button {
    background: transparent;
    border: none;
    cursor: pointer;
    color: #728094;
    padding: 4px;
    display: flex;
    align-items: center;
    justify-content: center;
    transition: all 0.2s ease;

    &:hover {
      color: var(--color-primary);
    }

    &.rotating {
      animation: rotate 1s linear infinite;
    }
  }

  @keyframes rotate {
    from {
      transform: rotate(0deg);
    }
    to {
      transform: rotate(360deg);
    }
  }
`;

export const AISummaryContent = styled.div`
  display: flex;
  flex-direction: column;
  gap: 20px;
`;

export const PostOverview = styled.div`
  padding: 20px;
  background: #f5fbfd;
  border-radius: 12px;

  h4 {
    font-size: 16px;
    font-weight: var(--font-weight-semibold);
    color: #1a1d26;
    margin: 0 0 8px 0;
  }

  p {
    font-size: 14px;
    font-weight: var(--font-weight-regular);
    line-height: 1.6;
    color: var(--color-text-primary);
    margin: 0;

    &.collapsed {
      display: -webkit-box;
      -webkit-line-clamp: 3;
      -webkit-box-orient: vertical;
      overflow: hidden;
    }

    &.expanded {
      display: block;
    }
  }

  .see-more-btn {
    background: none;
    border: none;
    color: var(--color-primary);
    font-size: 14px;
    font-weight: var(--font-weight-semibold);
    cursor: pointer;
    padding: 8px 0 0 0;
    margin-top: 8px;
    transition: all 0.2s ease;

    &:hover {
      color: #038c6e;
    }
  }
`;

export const KeyTakeaways = styled.div`
  padding: 20px;
  background: #f5fbfd;
  border-radius: 12px;

  h4 {
    font-size: 16px;
    font-weight: var(--font-weight-semibold);
    color: #1a1d26;
    margin: 0 0 12px 0;
  }

  .see-more-btn {
    background: none;
    border: none;
    color: var(--color-primary);
    font-size: 14px;
    font-weight: var(--font-weight-semibold);
    cursor: pointer;
    padding: 8px 0 0 0;
    margin-top: 8px;
    transition: all 0.2s ease;
    width: 100%;
    text-align: left;

    &:hover {
      color: #038c6e;
    }
  }
`;

export const TakeawayItem = styled.div`
  display: flex;
  gap: 8px;
  margin-bottom: 12px;

  &:last-child {
    margin-bottom: 0;
  }

  span {
    color: var(--color-primary);
    font-weight: var(--font-weight-semibold);
    flex-shrink: 0;
    margin-top: 2px;
  }

  p {
    font-size: 14px;
    font-weight: var(--font-weight-regular);
    line-height: 1.6;
    color: var(--color-text-primary);
    margin: 0;
  }
`;

export const CommunityPulse = styled.div`
  padding: 20px;
  background: #f5fbfd;
  border-radius: 12px;

  h4 {
    font-size: 16px;
    font-weight: var(--font-weight-semibold);
    color: #1a1d26;
    margin: 0 0 16px 0;
  }

  .pulse-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 8px;

    .label {
      font-size: 14px;
      font-weight: var(--font-weight-regular);
      color: var(--color-text-primary);
      opacity: 1;
    }

    .percentage {
      font-size: 14px;
      font-weight: var(--font-weight-semibold);
      color: #1a1d26;
    }
  }

  .pulse-description {
    font-size: 14px;
    font-weight: var(--font-weight-regular);
    line-height: 1.6;
    color: var(--color-text-primary);
    margin: 12px 0 0 0;

    strong {
      font-weight: var(--font-weight-semibold);
      color: #1a1d26;
    }

    &:first-of-type {
      margin-top: 16px;
    }
  }

  .see-more-btn {
    background: none;
    border: none;
    color: var(--color-primary);
    font-size: 14px;
    font-weight: var(--font-weight-semibold);
    cursor: pointer;
    padding: 8px 0 0 0;
    margin-top: 8px;
    transition: all 0.2s ease;
    width: 100%;
    text-align: left;

    &:hover {
      color: #038c6e;
    }
  }
`;

export const SentimentBar = styled.div`
  display: flex;
  height: 8px;
  border-radius: 4px;
  overflow: hidden;
  background: #f0f2f5;
`;

export const SentimentSegment = styled.div<{ color: string; width: string }>`
  background: ${(props) => props.color};
  width: ${(props) => props.width};
  transition: width 0.3s ease;
`;

export const SentimentSegmentSeparator = styled.div`
  width: 4px;
  height: 16px;
  border-radius: 200px;
  background: var(--color-white);
  border: 1px solid #ecedf0;
  transform: translateY(-4px);
`;

export const TopContributors = styled.div`
  padding: 20px;
  background: #f5fbfd;
  border-radius: 12px;
  display: flex;
  flex-direction: column;
  gap: 20px;

  h4 {
    font-size: 16px;
    font-weight: var(--font-weight-semibold);
    color: #1a1d26;
    margin: 0 0 8px 0;
  }

  .data-info {
    font-size: 14px;
    font-weight: var(--font-weight-regular);
    color: #728094;
    padding: 12px;
    background: #fffbea;
    border: 1px dashed #ffd700;
    border-radius: 8px;
  }
`;

export const ContributorCard = styled.div`
  display: flex;
  gap: 12px;
  padding: 12px 0;
  border-bottom: 1px solid #f0f2f5;

  &:last-child {
    border-bottom: none;
  }
`;

export const ContributorAvatar = styled.img`
  width: 48px;
  height: 48px;
  border-radius: 50%;
  object-fit: cover;
  flex-shrink: 0;
`;

export const ContributorInfo = styled.div`
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 8px;

  .contributor-header {
    display: flex;
    justify-content: space-between;
    align-items: flex-start;

    .artist-badge {
      font-size: 11px;
      font-weight: var(--font-weight-medium);
      color: #728094;
      background: #f5fbfd;
      padding: 4px 8px;
      border-radius: 4px;
      white-space: nowrap;
    }
  }
`;

export const ContributorName = styled.div`
  font-size: 14px;
  font-weight: var(--font-weight-semibold);
  color: #1a1d26;
`;

export const ContributorHandle = styled.div`
  font-size: 12px;
  font-weight: var(--font-weight-regular);
  color: var(--color-primary);
`;

export const ContributorStats = styled.div`
  display: flex;
  gap: 6px;
  flex-wrap: wrap;
`;

export const StatBadge = styled.span`
  font-size: 11px;
  font-weight: var(--font-weight-medium);
  color: #728094;
  background: #f5fbfd;
  padding: 4px 8px;
  border-radius: 4px;
  white-space: nowrap;
`;

export const EngagementBadge = styled(StatBadge)`
  color: var(--color-primary);
  background: #e0f7f4;
`;
