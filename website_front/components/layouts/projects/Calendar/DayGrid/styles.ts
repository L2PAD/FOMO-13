import styled from "styled-components";

export const Wrapper = styled.div`
  display: grid;
  grid-template-columns: 0.03fr 1fr;
`;

export const TimeInfo = styled.div`
  display: flex;
  flex-direction: column;

  div {
    font-family: Inter;
    border-left: 1px solid var(--color-border-subtle);
    border-right: 1px solid var(--color-border-subtle);
    width: 100%;
    height: 64px;
    color: var(--color-text-muted);
    font-size: 10px;
    padding: 3px;
    font-weight: var(--font-weight-medium);

    &:first-child {
      border-top: 1px solid var(--color-border-subtle);
      border-top-left-radius: 12px;
    }

    &:last-child {
      border-bottom-left-radius: 12px;
      border-bottom: 1px solid var(--color-border-subtle);
    }
  }
`;

export const ContentWrapper = styled.div``;

export const HeaderWrapper = styled.div`
  div {
    &:last-child {
      border-top-right-radius: 12px;
    }
  }
`;

export const WeekDayCell = styled.div<{
  isCurrentMonth: boolean;
  isCurrentDay: boolean;
}>`
  width: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
  text-align: center;
  padding: 22px 5px;
  font-family: Inter;
  font-size: 12px;
  font-weight: var(--font-weight-medium);
  border-top: 1px solid var(--color-border-subtle);
  border-right: 1px solid var(--color-border-subtle);

  span {
    font-weight: var(--font-weight-medium);
    border-radius: 50%;
    background: ${({ isCurrentDay }) =>
      isCurrentDay ? "black" : "transparent"};
    font-size: 12px;
    width: ${({ isCurrentDay }) => (isCurrentDay ? "20px" : "none")};
    height: ${({ isCurrentDay }) => (isCurrentDay ? "20px" : "none")};
    display: flex;
    align-items: center;
    justify-content: center;
    color: ${({ isCurrentDay }) => (isCurrentDay ? "var(--color-white)" : "black")};
  }
`;

export const BodyCells = styled.div`
  display: flex;
  flex-direction: column;
`;

export const BodyCell = styled.div`
  border-bottom: 1px solid var(--color-border-subtle);
  border-right: 1px solid var(--color-border-subtle);
  height: 64px;

  &:nth-child(1) {
    border-top: 1px solid var(--color-border-subtle);
  }

  &:nth-child(2) {
    border-top: 1px solid var(--color-border-subtle);
  }

  &:nth-child(3) {
    border-top: 1px solid var(--color-border-subtle);
  }

  &:nth-child(4) {
    border-top: 1px solid var(--color-border-subtle);
  }

  &:nth-child(5) {
    border-top: 1px solid var(--color-border-subtle);
  }

  &:nth-child(6) {
    border-top: 1px solid var(--color-border-subtle);
  }
  &:nth-child(7) {
    border-top: 1px solid var(--color-border-subtle);
  }
`;
