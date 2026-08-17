import styled from "styled-components";

export const HighlightWrapper = styled.div`
  display: flex;
  flex-direction: column;
  gap: 24px;
  width: 100%;

  &.summary {
    width: 400px;
  }

  /* Ensure info tooltips wrap inside the panel instead of overflowing. */
  .tooltip-text {
    width: 260px;
    max-width: min(260px, 80vw);
    white-space: normal;
    word-break: break-word;
    line-height: 18px;
  }
`;

export const SectionTitle = styled.div`
  margin: 0 0 16px 0;
  display: flex;
  align-items: center;
  justify-content: space-between;

  h2 {
    font-size: 24px;
    font-weight: var(--font-weight-semibold);
    color: #1a1d26;
    display: flex;
    align-items: center;
  }

  .add-button {
    width: 40px;
    height: 28px;
    border-radius: 6px;
    background: transparent;
    font-size: 18px;
    display: flex;
    align-items: center;
    justify-content: center;
    cursor: pointer;
    transition: all 0.2s ease;

    &:hover {
      background: #f5fbfd;
      border-color: var(--color-primary);
      color: var(--color-primary);
    }
  }
`;

export const TopicsList = styled.div`
  display: flex;
  flex-direction: column;
  gap: 6px;
  padding: 8px;
  background: #f7fafb;
  border: 1px solid #e9f2f4;
  border-radius: 12px;
`;

export const TopicItem = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 12px;
  min-width: 0;
  cursor: pointer;
  padding: 12px 14px;
  border-radius: 10px;
  background: #ffffff;
  border: 1px solid #eef2f5;
  transition: border-color 0.15s ease, box-shadow 0.15s ease, transform 0.15s ease;

  &:hover {
    border-color: var(--color-primary);
    box-shadow: 0 2px 10px rgba(4, 165, 132, 0.08);
    transform: translateY(-1px);

    span {
      color: var(--color-primary);
    }
    p {
      color: var(--color-text-primary);
    }
  }
`;

export const TopicName = styled.span`
  font-size: 15px;
  font-weight: var(--font-weight-semibold);
  color: #1a1d26;
  flex: 1 1 auto;
  min-width: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  transition: color 0.15s ease;
`;

export const TopicStats = styled.span`
  font-size: 12px;
  color: #98a2b3;
  text-align: right;
  line-height: 1.5;
  flex-shrink: 0;
`;

export const ContributorsList = styled.div`
  display: flex;
  flex-direction: column;
  gap: 16px;
`;

export const ContributorItem = styled.div`
  display: flex;
  flex-direction: column;
  gap: 12px;
  align-items: flex-start;
  position: relative;
  padding: 12px;
  border-radius: 8px;
  transition: all 0.2s ease;
  border: 2px solid #e9f8f8;

  &:hover {
    background: #f5fbfd;
  }

  .xp-badge {
    position: absolute;
    top: 12px;
    right: 12px;
    font-size: 14px;
    color: #728094;
    font-weight: var(--font-weight-regular);
    display: flex;
    flex-direction: column;
    gap: 4px;

    p {
      text-align: right;
    }
  }

  .info {
    display: flex;
    flex-direction: row;
    gap: 8px;
  }
`;

export const ContributorAvatar = styled.div`
  width: 40px;
  height: 40px;
  border-radius: 50%;
  overflow: hidden;
  flex-shrink: 0;
  border: 2px solid var(--color-primary);

  img {
    width: 100%;
    height: 100%;
    object-fit: cover;
  }
`;

export const ContributorInfo = styled.div`
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 4px;
`;

export const ContributorName = styled.span`
  font-size: 14px;
  font-weight: var(--font-weight-semibold);
  color: #1a1d26;
  margin-right: 8px;
`;

export const ContributorBadge = styled.span`
  font-size: 12px;
  color: #728094;
  font-weight: var(--font-weight-regular);
`;

export const ContributorUsername = styled.span`
  font-size: 13px;
  color: var(--color-primary);
  font-weight: var(--font-weight-regular);
`;

export const ContributorStats = styled.div`
  display: flex;
  flex-direction: row;
  justify-content: space-between;
  width: 100%;
  margin-top: 4px;
`;

export const StatItem = styled.div`
  display: flex;
  align-items: center;
  gap: 6px;
  background: #e9f8f8;
  padding: 4px 8px;
`;

export const StatIcon = styled.span`
  display: flex;
  align-items: center;
`;

export const StatText = styled.span`
  font-size: 10px;
  color: var(--color-primary);
  font-weight: var(--font-weight-regular);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
`;

export const SeeMoreButton = styled.button`
  width: 100%;
  background: transparent;
  border: none;
  color: #728094;
  font-size: 14px;
  cursor: pointer;
  transition: all 0.2s ease;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;

  &:hover {
    color: var(--color-primary);
    background: #f5fbfd;
    border-radius: 6px;
  }
`;

export const TodayStats = styled.div`
  display: flex;
  flex-direction: column;
  gap: 12px;
`;

export const TodayStatRow = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;

  &:last-child {
    border-bottom: none;
  }
`;

export const TodayStatLabel = styled.span`
  font-size: 14px;
  font-weight: var(--font-weight-semibold);
`;

export const TodayStatValue = styled.span<{ highlight?: boolean }>`
  font-size: 14px;
  color: ${(props) => (props.highlight ? "var(--color-primary)" : "#1a1d26")};
  font-weight: var(--font-weight-medium);
`;
