import styled from "styled-components";

export const SpaceportPageHeaderWrapper = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  width: 100%;
  padding: 12px;
  border-radius: 8px;
  box-shadow: var(--main-section-shadow);

  @media (max-width: 768px) {
    flex-direction: column;
    align-items: flex-start;
    gap: 12px;
  }
`;

export const HeaderWrapper = styled.div`
  display: flex;
  flex-direction: row;
  min-width: 0;

  h1 {
    font-size: 32px;
    font-weight: var(--font-weight-semibold);
    line-height: 1.2;
  }

  @media (max-width: 768px) {
    width: 100%;

    h1 {
      font-size: 28px;
    }
  }
`;

export const PageContentWrapper = styled.div`
  .label {
    opacity: 1;
  }
`;

export const TitleWrapper = styled.div`
  display: flex;
  flex-direction: row;
  align-items: center;
  gap: 8px;
  min-width: 0;

  h1 {
    margin: 0;
  }

  .tooltip-button {
    flex-shrink: 0;
  }

  .ad {
    & > a {
      min-width: max-content;
    }
  }

  @media (max-width: 768px) {
    width: 100%;
    align-items: flex-start;

    .tooltip-button {
      display: none;
    }
  }
`;

export const FilterWrapper = styled.div`
  display: flex;
  flex-direction: row;
  align-items: center;
  gap: 12px;

  @media (max-width: 600px) {
    width: 100%;
  }

  .right {
    display: flex;
    flex-direction: row;
    align-items: center;
    gap: 12px;

    @media (max-width: 600px) {
      flex-wrap: wrap;
    }
  }

  .analytics-button,
  .marketplace-button {
    display: flex;
    align-items: center;
    gap: 8px;
    color: var(--main-green);
    font-size: 12px;
    font-weight: var(--font-weight-medium);
    padding: 8px 16px;
    border-radius: 8px;
    transition: background-color 0.2s;

    &:hover {
      background-color: rgba(43, 255, 170, 0.1);
    }

    svg {
      stroke: var(--main-green);
    }
  }

  .create-prediction {
    font-size: 12px;
    font-weight: var(--font-weight-medium);
    padding: 8px 16px;
    border-radius: 8px;
    white-space: nowrap;
  }

  input {
    font-size: 12px;

    &::placeholder {
      font-size: 12px;
    }
  }
`;

export const TabsBar = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-top: 40px;
  width: 100%;
  flex-wrap: wrap;
  gap: 12px;
`;

export const TabsLeft = styled.div`
  display: flex;
  gap: 4px;
  padding: 4px;
  background: #f9f9f9;
  border-radius: 8px;

  &.earlyland {
    min-width: 256px;

    button {
      width: 100%;
      justify-content: center;
    }

    &.right {
      min-width: 400px;
    }

    @media (max-width: 1120px) {
      min-width: 100%;

      &.right {
        min-width: 100%;
      }
    }
  }

  @media (max-width: 600px) {
    width: 100%;
    justify-content: space-between;
    flex-wrap: wrap;
    min-width: 0;
  }
`;

export const TabButton = styled.button<{ active?: boolean }>`
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px 12px;
  border-radius: 10px;
  background: ${({ active }) => (active ? "var(--color-white)" : "var(--color-surface-subtle)")};
  color: ${({ active }) => (active ? "var(--main-green)" : "var(--color-text-muted)")};
  font-weight: var(--font-weight-medium);
  transition: all 0.2s ease;

  &:hover {
    background: #f1f4f8;
  }

  &.tab-stroke {
    svg,
    path {
      stroke: ${({ active }) => (active ? "var(--main-green)" : "var(--color-text-muted)")};
    }
  }

  &.tab-fill {
    svg,
    path {
      fill: ${({ active }) => (active ? "var(--main-green)" : "var(--color-text-muted)")};
    }
  }

  @media (max-width: 600px) {
    justify-content: center;
    width: 100%;
  }
`;

export const RightBar = styled.div`
  display: flex;
  align-items: center;
  gap: 12px;

  .create-prediction {
    font-size: 12px;
    font-weight: var(--font-weight-medium);
    padding: 8px 16px;
    border-radius: 8px;
    white-space: nowrap;
  }
`;

export const SeasonWrapper = styled.div`
  display: flex;
  align-items: center;
  gap: 8px;

  .label {
    font-size: 14px;
    color: #0f172a;
    white-space: nowrap;
    opacity: 1;
    margin-right: 4px;
  }
`;

export const BellWrapper = styled.button`
  position: relative;
  padding: 6px;
  border-radius: 10px;
  background: var(--color-white);
  border: 1px solid #eef1f5;
  width: 30px;
  height: 30px;

  .badge {
    position: absolute;
    top: -6px;
    right: -6px;
    background: var(--color-danger);
    color: white;
    font-size: 11px;
    line-height: 16px;
    min-width: 20px;
    height: 20px;
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
  }
`;

export const StatusPill = styled.div`
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px 12px;
  background: #e8f9f1;
  border-radius: 10px;
  color: var(--main-green);

  .dot {
    width: 8px;
    height: 8px;
    border-radius: 50%;
    background: var(--color-danger);
  }
`;

export const MobileDropdownWrapper = styled.div`
  position: relative;
  width: 100%;
`;

export const MobileDropdownTrigger = styled.button`
  display: flex;
  align-items: center;
  justify-content: space-between;
  width: 100%;
  height: 32px;
  padding: 4px 8px;
  background: var(--color-white);
  border: 1px solid #f0f2f5;
  border-radius: 8px;
  font-size: 14px;
  color: var(--color-text-primary);
  font-weight: var(--font-weight-medium);
`;

export const MobileDropdownMenu = styled.div`
  position: absolute;
  top: calc(100% + 4px);
  left: 0;
  right: 0;
  background: var(--color-white);
  border-radius: 8px;
  box-shadow: 2px 2px 8px 0 rgba(0, 5, 48, 0.08);
  padding: 12px;
  z-index: 100;
  display: flex;
  flex-direction: column;
  gap: 12px;
`;

export const MobileDropdownOption = styled.button<{ active?: boolean }>`
  display: flex;
  align-items: center;
  justify-content: space-between;
  width: 100%;
  font-size: 14px;
  color: var(--color-text-primary);
  text-align: left;
  padding: 0;

  svg {
    stroke: var(--main-green);
  }
`;

export const PredictionsGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(400px, 1fr));
  gap: 20px;
  margin-top: 40px;
  width: 100%;

  @media (max-width: 1200px) {
    grid-template-columns: repeat(auto-fill, minmax(350px, 1fr));
  }

  @media (max-width: 768px) {
    grid-template-columns: 1fr;
  }
`;
