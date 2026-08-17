import styled from "styled-components";

export const RewardsWrapper = styled.div`
  width: 100%;
  margin-top: 40px;
  display: flex;
  flex-direction: column;
  gap: 40px;
`;

export const StatsRow = styled.div`
  display: flex;
  gap: 20px;
  width: 100%;

  @media (max-width: 600px) {
    flex-wrap: wrap;
  }
`;

export const StatCard = styled.div`
  flex: 1;
  min-width: 0;
  background: var(--color-white);
  border-radius: 12px;
  box-shadow: 2px 2px 8px 0 rgba(0, 5, 48, 0.08);
  padding: 20px;
  display: flex;
  align-items: center;
  justify-content: space-between;

  .text {
    display: flex;
    flex-direction: column;
    gap: 8px;

    .label {
      font-size: 14px;
      font-weight: var(--font-weight-regular);
      color: var(--color-text-primary);
      line-height: 18px;
    }

    .value {
      font-size: 24px;
      font-weight: var(--font-weight-semibold);
      color: var(--color-text-primary);
      line-height: 30px;
    }
  }

  .icon {
    color: var(--color-text-muted);
    flex-shrink: 0;
  }

  @media (max-width: 700px) {
    padding: 10px;

    svg {
      display: none;
    }
  }
`;

export const RewardsGrid = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 20px;
  width: 100%;
`;

export const RewardCard = styled.div<{ glow?: boolean }>`
  display: flex;
  flex-direction: column;
  align-items: center;
  border-radius: 12px;
  overflow: hidden;
  box-shadow: ${({ glow }) =>
    glow
      ? "2px 4px 30px 0 rgba(5, 165, 132, 0.4)"
      : "2px 2px 8px 0 rgba(0, 5, 48, 0.08)"};
  width: calc(25% - 15px);
  min-width: 220px;
  flex-shrink: 0;
  position: relative;
  min-height: 442px;

  @media (max-width: 1100px) {
    width: calc(33.333% - 14px);
  }

  @media (max-width: 750px) {
    width: calc(50% - 10px);
  }

  @media (max-width: 480px) {
    width: 100%;
  }
`;

export const CardImageArea = styled.div`
  width: 100%;
  height: 220px;
  position: relative;
  flex-shrink: 0;

  img {
    width: 100%;
    height: 100%;
    object-fit: cover;
  }
`;

export const LockedOverlay = styled.div`
  position: absolute;
  inset: 0;
  background: rgba(255, 255, 255, 0.4);
  backdrop-filter: blur(10px);
`;

export const CardBadgeRow = styled.div`
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  padding: 20px 20px 0;
  display: flex;
  justify-content: flex-end;
  pointer-events: none;
`;

export const StatusBadge = styled.div<{ variant: "ready" | "claimed" | "locked" }>`
  background: ${({ variant }) =>
    variant === "ready" ? "#E9F8F8" : "#F9F9F9"};
  border-radius: 6px;
  padding: 4px 10px;
  display: flex;
  align-items: center;
  gap: 6px;

  span {
    font-size: 14px;
    color: ${({ variant }) =>
    variant === "ready" ? "var(--color-primary)" : "#728094"};
    white-space: nowrap;
    line-height: 20px;
  }

  svg {
    color: ${({ variant }) =>
    variant === "ready" ? "var(--color-primary)" : "#728094"};
  }
`;

export const CardInfo = styled.div`
  background: #f5fbfd;
  width: 100%;
  padding: 20px;
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  gap: 16px;
  flex: 1;
`;

export const CardMeta = styled.div`
  display: flex;
  align-items: flex-end;
  gap: 8px;
  width: 100%;

  .text-group {
    flex: 1;
    min-width: 0;
    display: flex;
    flex-direction: column;
    gap: 8px;
  }

  .name {
    font-size: 14px;
    font-weight: var(--font-weight-semibold);
    color: var(--color-text-primary);
    line-height: 18px;
  }

  .requirement {
    font-size: 14px;
    font-weight: var(--font-weight-regular);
    color: #728094;
    line-height: 18px;
  }

  .progress {
    font-size: 14px;
    font-weight: var(--font-weight-semibold);
    line-height: 18px;
    white-space: nowrap;
    flex-shrink: 0;
  }

  .progress-complete {
    color: var(--color-primary);
  }

  .progress-incomplete {
    color: #728094;
  }
`;

export const ActionButton = styled.button<{
  variant: "claim" | "claimed" | "locked";
}>`
  width: 100%;
  background: ${({ variant }) =>
    variant === "claim" ? "var(--color-primary)" : "#F9F9F9"};
  border: none;
  border-radius: 6px;
  padding: 6px 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
  cursor: ${({ variant }) => (variant === "claim" ? "pointer" : "default")};
  transition: background 0.2s;


  &:hover {
    opacity: 0.8;
  }

  span {
    font-size: 14px;
    font-weight: var(--font-weight-medium);
    color: ${({ variant }) =>
    variant === "claim" ? "var(--color-white)" : "#728094"};
    white-space: nowrap;
    line-height: 20px;
  }

  svg {
    color: ${({ variant }) =>
    variant === "claim" ? "var(--color-primary)" : "#728094"};
  }
`;

export const EmptyRewards = styled.div`
  width: 100%;
  background: var(--color-white);
  border: 1px dashed #d7e0ec;
  border-radius: 12px;
  box-shadow: 2px 2px 8px 0 rgba(0, 5, 48, 0.05);
  padding: 40px 28px;
  display: flex;
  flex-direction: column;
  align-items: center;
  text-align: center;
  gap: 12px;

  .empty-icon {
    width: 64px;
    height: 64px;
    border-radius: 50%;
    background: #e9f8f8;
    display: flex;
    align-items: center;
    justify-content: center;
    color: var(--color-primary);
    margin-bottom: 4px;
  }

  .empty-title {
    font-size: 18px;
    font-weight: var(--font-weight-semibold);
    color: var(--color-text-primary);
    line-height: 24px;
  }

  .empty-text {
    max-width: 440px;
    font-size: 14px;
    font-weight: var(--font-weight-regular);
    color: #728094;
    line-height: 20px;
  }

  .empty-steps {
    display: flex;
    flex-wrap: wrap;
    justify-content: center;
    gap: 8px;
    margin-top: 8px;
  }

  .empty-chip {
    display: inline-flex;
    align-items: center;
    gap: 6px;
    padding: 6px 12px;
    border-radius: 999px;
    background: #f5fbfd;
    border: 1px solid #e3eef3;
    font-size: 13px;
    font-weight: var(--font-weight-medium);
    color: var(--color-text-primary);
  }

  .empty-chip svg {
    color: var(--color-primary);
    flex-shrink: 0;
  }
`;

export const HowToSection = styled.div`
  width: 100%;
  display: flex;
  flex-direction: column;
  gap: 20px;
`;

export const SectionTitle = styled.h2`
  font-size: 24px;
  font-weight: var(--font-weight-semibold);
  color: var(--color-text-primary);
  margin: 0;
  line-height: 30px;
`;

export const HowToCard = styled.div`
  background: var(--color-white);
  border-radius: 12px;
  box-shadow: 2px 2px 8px 0 rgba(0, 5, 48, 0.08);
  padding: 20px;
  display: flex;
  align-items: center;
  gap: 20px;
  width: 100%;
`;

export const StepNumber = styled.div`
  background: #e9f8f8;
  border-radius: 50px;
  width: 44px;
  height: 44px;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;

  span {
    font-size: 16px;
    font-weight: var(--font-weight-semibold);
    color: var(--color-primary);
    line-height: 20px;
  }
`;

export const StepText = styled.div`
  flex: 1;
  min-width: 0;
  display: flex;
  flex-direction: column;
  gap: 8px;

  .title {
    font-size: 14px;
    font-weight: var(--font-weight-semibold);
    color: var(--color-text-primary);
    line-height: 18px;
  }

  .description {
    font-size: 14px;
    font-weight: var(--font-weight-regular);
    color: #728094;
    line-height: 18px;
  }
`;
