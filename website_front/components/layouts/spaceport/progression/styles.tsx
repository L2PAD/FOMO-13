import styled from "styled-components";

export const ProgressionWrapper = styled.div`
  width: 100%;
  margin-top: 40px;
  display: flex;
  flex-direction: column;
  gap: 40px;
`;

export const ShadowCard = styled.div`
  background: var(--color-white);
  border-radius: 12px;
  box-shadow: 2px 2px 8px 0 rgba(0, 5, 48, 0.08);
  padding: 20px;
`;

export const SectionPanel = styled.div<{ border?: string; bg?: string }>`
  background: ${({ bg }) => bg || "#f9f9f9"};
  border: 1px solid ${({ border }) => border || "#f0f2f5"};
  border-radius: 12px;
  padding: 20px;
  display: flex;
  flex-direction: column;
  gap: 20px;
  width: 100%;
`;

export const SectionTitle = styled.h2`
  font-size: 24px;
  font-weight: var(--font-weight-semibold);
  color: var(--color-text-primary);
  margin: 0;
  line-height: 30px;
  white-space: nowrap;
`;

export const StarMapCard = styled.div`
  background: #f5fbfd;
  border: 1px solid var(--color-primary);
  border-radius: 12px;
  padding: 20px;
  display: flex;
  flex-direction: column;
  gap: 20px;
  width: 100%;

  .header {
    display: flex;
    flex-direction: column;
    gap: 8px;

    .title {
      font-size: 24px;
      font-weight: var(--font-weight-semibold);
      color: var(--color-text-primary);
      line-height: 30px;
    }

    .subtitle {
      font-size: 14px;
      font-weight: var(--font-weight-regular);
      color: #728094;
      line-height: 18px;
      text-align: left;
    padding: 0;
    }
  }
`;

export const XPCard = styled.div`
  background: var(--color-white);
  border-radius: 12px;
  box-shadow: 2px 2px 8px 0 rgba(0, 5, 48, 0.08);
  padding: 20px;
  display: flex;
  flex-direction: column;
  gap: 20px;
  width: 100%;

  .top-row {
    display: flex;
    align-items: center;
    justify-content: space-between;
  }

  .level-group {
    display: flex;
    flex-direction: column;
    gap: 8px;
  }

  .level-label {
    font-size: 14px;
    font-weight: var(--font-weight-regular);
    color: #728094;
    line-height: 18px;
  }

  .level-value-row {
    display: flex;
    align-items: center;
    gap: 8px;
  }

  .level-number {
    font-size: 24px;
    font-weight: var(--font-weight-semibold);
    color: var(--color-text-primary);
    line-height: 30px;
  }

  .xp-group {
    display: flex;
    flex-direction: column;
    gap: 8px;
    align-items: flex-end;
  }

  .xp-label {
    font-size: 14px;
    font-weight: var(--font-weight-regular);
    color: #728094;
    line-height: 18px;
  }

  .xp-value {
    font-size: 24px;
    font-weight: var(--font-weight-semibold);
    color: var(--color-text-primary);
    line-height: 30px;
  }

  .xp-hint {
    font-size: 14px;
    font-weight: var(--font-weight-regular);
    color: #728094;
    line-height: 18px;
  }
`;

export const ProgressBarWrap = styled.div`
  width: 100%;
  position: relative;
  height: 8px;
`;

export const ProgressBarBg = styled.div`
  width: 100%;
  height: 8px;
  background: #f9f9f9;
  border-radius: 8px;
  overflow: hidden;
`;

export const ProgressBarFill = styled.div<{ percent: number; color?: string }>`
  height: 100%;
  width: ${({ percent }) => percent}%;
  background: ${({ color }) => color || "var(--color-primary)"};
  border-radius: 8px;
  transition: width 0.4s ease;
`;

export const LevelBadge = styled.div`
  background: #E9F8F8;
  border-radius: 6px;
  padding: 4px 10px;
  display: flex;
  align-items: center;
  gap: 6px;

  span {
    font-size: 14px;
    font-weight: var(--font-weight-medium);
    color: var(--color-primary);
    white-space: nowrap;
    line-height: 20px;
  }
`;

export const LevelsRow = styled.div`
  display: flex;
  gap: 20px;
  width: 100%;

  @media (max-width: 700px) {
    flex-direction: column;
  }
`;

export const LevelCard = styled.div<{ active?: boolean }>`
  flex: 1;
  min-width: 0;
  background: ${({ active }) => (active ? "var(--color-white)" : "#f9f9f9")};
  border: 1px solid ${({ active }) => (active ? "var(--color-primary)" : "#f0f2f5")};
  border-radius: 12px;
  padding: 20px;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 12px;
  box-shadow: ${({ active }) =>
    active ? "0 0 30px 0 rgba(5,165,132,0.4)" : "none"};

  .level-num {
    font-size: 24px;
    font-weight: var(--font-weight-semibold);
    color: ${({ active }) => (active ? "var(--color-text-primary)" : "#728094")};
    line-height: 30px;
    text-align: center;
    width: 100%;
  }

  .level-name {
    font-size: 14px;
    font-weight: ${({ active }) => (active ? "600" : "400")};
    color: ${({ active }) => (active ? "var(--color-primary)" : "#728094")};
    line-height: 18px;
    text-align: center;
    width: 100%;
  }

  .level-req {
    font-size: 14px;
    font-weight: var(--font-weight-regular);
    color: #728094;
    line-height: 18px;
    text-align: center;
    width: 100%;
  }

  .icon-wrap {
    width: 40px;
    height: 40px;
    display: flex;
    align-items: center;
    justify-content: center;
    color: #728094;
  }

  .active-icon {
    color: var(--color-primary);
  }
`;

export const UnlockRow = styled.div`
  background: var(--color-white);
  border-radius: 12px;
  box-shadow: 2px 2px 8px 0 rgba(0, 5, 48, 0.08);
  padding: 20px;
  display: flex;
  align-items: center;
  gap: 20px;

  .text {
    font-size: 14px;
    font-weight: var(--font-weight-semibold);
    color: var(--color-text-primary);
    line-height: 18px;
  }
`;

export const BadgeGrid = styled.div`
  display: grid;
  gap: 20px;
  grid-template-columns: repeat(auto-fill, minmax(295px, 1fr));
  width: 100%;
`;

export const BadgeCard = styled.div<{ earned?: boolean }>`
  flex: 1;
  min-width: 140px;
  background: ${({ earned }) => (earned ? "var(--color-white)" : "#f9f9f9")};
  border: 1px solid ${({ earned }) => (earned ? "var(--color-primary)" : "#f0f2f5")};
  border-radius: 12px;
  padding: 20px;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 12px;

  .badge-icon {
    width: 40px;
    height: 40px;
    display: flex;
    align-items: center;
    justify-content: center;
    color: ${({ earned }) => (earned ? "var(--color-primary)" : "#728094")};
  }

  .badge-name {
    font-size: 24px;
    font-weight: var(--font-weight-semibold);
    color: ${({ earned }) => (earned ? "var(--color-text-primary)" : "#728094")};
    text-align: center;
    line-height: 30px;
    width: 100%;
  }

  .badge-req {
    font-size: 14px;
    font-weight: var(--font-weight-regular);
    color: #728094;
    text-align: center;
    line-height: 18px;
    width: 100%;
  }
`;

export const BadgeProgress = styled.div`
  width: 100%;
  display: flex;
  flex-direction: column;
  gap: 8px;

  .time-left {
    font-size: 12px;
    font-weight: var(--font-weight-regular);
    color: #728094;
    text-align: center;
    line-height: 14px;
    width: 100%;
  }
`;

export const StatusBadge = styled.div<{ variant?: "earned" | "locked" | "blue" }>`
  width: 100%;
  background: #E9F8F8;
  border-radius: 6px;
  padding: 4px 10px;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 6px;

  span {
    font-size: 14px;
    font-weight: var(--font-weight-medium);
    color: var(--color-primary);
    white-space: nowrap;
    line-height: 20px;
  }

  &.locked {
    background: #f9f9f9;
    border: 1px solid #F0F2F5;
    
    span {
      color: #728094;
    }
  }
`;

export const RequirementGrid = styled.div`
  display: grid;
  gap: 20px;
  width: 100%;
  grid-template-columns: 1fr 1fr;

  @media (max-width: 700px) {
    grid-template-columns: 1fr;
  }
`;

export const RequirementCard = styled.div`
  flex: 1;
  min-width: 0;
  background: var(--color-white);
  border-radius: 12px;
  box-shadow: 2px 2px 8px 0 rgba(0, 5, 48, 0.08);
  padding: 20px;
  display: flex;
  flex-direction: column;
  gap: 8px;

  .req-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
  }

  .req-label {
    font-size: 14px;
    font-weight: var(--font-weight-semibold);
    color: var(--color-text-primary);
    white-space: nowrap;
    line-height: 18px;
  }

  .req-hint {
    font-size: 14px;
    font-weight: var(--font-weight-regular);
    color: #728094;
    line-height: 18px;
    width: 100%;
  }

  .req-hint-green {
    font-size: 14px;
    font-weight: var(--font-weight-regular);
    color: var(--color-primary);
    line-height: 18px;
    width: 100%;
  }
`;

export const HiddenHintRow = styled.div`
  background: #fefcf3;
  border-radius: 12px;
  box-shadow: 2px 2px 8px 0 rgba(0, 5, 48, 0.08);
  padding: 20px;
  display: flex;
  align-items: center;
  gap: 8px;

  @media (max-width: 600px) {
    flex-wrap: wrap;
  }

  .hint-bold {
    font-size: 14px;
    font-weight: var(--font-weight-semibold);
    color: #ffc704;
    line-height: 18px;
    white-space: nowrap;
  }

  .hint-text {
    font-size: 14px;
    font-weight: var(--font-weight-regular);
    color: #ffc704;
    line-height: 18px;
  }
`;

export const SingularityPanel = styled.div`
  background: #fefcf3;
  border: 1px solid #ffc704;
  border-radius: 12px;
  padding: 20px;
  display: flex;
  flex-direction: column;
  gap: 20px;
  width: 100%;

  .header {
    display: flex;
    flex-direction: column;
    gap: 8px;

    .title {
      font-size: 24px;
      font-weight: var(--font-weight-semibold);
      color: var(--color-text-primary);
      line-height: 30px;
    }

    .subtitle {
      font-size: 14px;
      font-weight: var(--font-weight-regular);
      color: #728094;
      line-height: 18px;
      padding: 0;
      text-align: left;
    }
  }
`;

export const SingularityStatsRow = styled.div`
  display: flex;
  gap: 20px;
  width: 100%;

  @media (max-width: 600px) {
    flex-direction: column;
  }
`;

export const SingularityStat = styled.div`
  flex: 1;
  min-width: 0;
  background: var(--color-white);
  border-radius: 12px;
  padding: 20px;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 12px;

  .stat-icon {
    width: 40px;
    height: 40px;
    display: flex;
    align-items: center;
    justify-content: center;
    color: #ffc704;
  }

  .stat-label {
    font-size: 14px;
    font-weight: var(--font-weight-semibold);
    color: var(--color-text-primary);
    text-align: center;
    line-height: 18px;
    width: 100%;
  }

  .stat-value {
    font-size: 24px;
    font-weight: var(--font-weight-semibold);
    color: #ffc704;
    text-align: center;
    line-height: 30px;
    width: 100%;
  }
`;

export const EarnXPRow = styled.div`
  display: flex;
  gap: 20px;
  width: 100%;

  @media (max-width: 600px) {
    flex-direction: column;
  }
`;

export const EarnXPCard = styled.div`
  flex: 1;
  min-width: 0;
  background: var(--color-white);
  border-radius: 12px;
  box-shadow: 2px 2px 8px 0 rgba(0, 5, 48, 0.08);
  padding: 20px;
  display: flex;
  align-items: center;
  gap: 20px;

  .icon {
    color: var(--color-text-muted);
    flex-shrink: 0;
  }

  .text-group {
    display: flex;
    flex-direction: column;
    gap: 8px;

    .earn-title {
      font-size: 14px;
      font-weight: var(--font-weight-semibold);
      color: var(--color-text-primary);
      line-height: 18px;
      white-space: nowrap;
    }

    .earn-value {
      font-size: 14px;
      font-weight: var(--font-weight-regular);
      color: #728094;
      line-height: 18px;
      white-space: nowrap;
    }
  }
`;
