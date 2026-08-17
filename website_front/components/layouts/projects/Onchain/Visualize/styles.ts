import styled from "styled-components";

export const PageWrapper = styled.div`
  width: 100%;
  min-height: calc(100vh - 93px);
  background: #0a0d16;
  margin-bottom: -60px;
  position: relative;
`;

export const PageContentWrapper = styled.div`
  padding: 26px;
`;

export const HeaderWrapper = styled.div`
  display: flex;
  gap: 10px;
  align-items: center;

  label {
    max-width: 414px;
  }
`;

export const TableWrapper = styled.div`
  width: 592px;
`;

export const TableContent = styled.div`
  width: 592px;
  overflow-y: auto;
  background: white;
  border-radius: 8px;
  margin-top: 8px;
`;

export const TableHeader = styled.div`
  display: flex;
  padding: 8px 16px;
  background: rgba(115, 128, 148, 0.05);
  width: 592px;

  div {
    font-weight: var(--font-weight-regular);
    font-size: 12px;
    line-height: 14px;
    color: var(--color-text-muted);

    &:first-child {
      width: 74px;
    }
    &:nth-child(2) {
      width: 139px;
    }
    &:nth-child(3) {
      width: 139px;
    }
    &:nth-child(4) {
      width: 70px;
    }
    &:nth-child(5) {
      width: 80px;
    }
  }
`;

export const TableRowWrapper = styled.div`
  padding: 12px 16px;
  display: flex;
  align-items: center;

  &:not(:last-child) {
    border-bottom: 2px solid #f8f8f9;
  }

  div {
    font-weight: var(--font-weight-regular);
    font-size: 12px;
    line-height: 14px;
    color: var(--color-text-muted);

    &:first-child {
      width: 74px;
      font-weight: var(--font-weight-semibold);
      font-size: 12px;
      line-height: 15px;
      color: var(--color-text-primary);
    }
    &:nth-child(2) {
      width: 139px;
    }
    &:nth-child(3) {
      width: 139px;
    }
    &:nth-child(4) {
      width: 70px;
    }
    &:nth-child(5) {
      width: 80px;
      span {
        color: var(--color-text-muted);
      }
    }
  }
`;

export const TableRowsWrapper = styled.div`
  height: 280px;
  overflow-y: auto;
  width: 592px;
`;

export const PointsData = styled.div`
  background: var(--color-white);
  border: 1px solid rgba(83, 98, 124, 0.07);
  border-radius: 8px;
  width: max-content;
  padding: 14px 12px;
`;

export const PointsRow = styled.div<{ color: string; disabled?: boolean }>`
  display: flex;
  align-items: flex-start;
  gap: 6px;

  &:not(:last-child) {
    margin-bottom: 10px;
  }

  p {
    font-weight: var(--font-weight-regular);
    font-size: 14px;
    line-height: 16px;
    color: ${({ disabled = false }) =>
      disabled ? "rgba(115, 128, 148, 0.5)" : "var(--color-text-muted)"};
    display: flex;
    justify-content: space-between;
    width: 100%;
  }

  div {
    background: ${({ color }) => color};
    width: 12px;
    height: 12px;
    border-radius: 100px;
  }
`;

export const DateRoll = styled.div`
  position: absolute;
  bottom: 6px;
  display: flex;
  left: 10px;
  width: calc(100vw - 20px);
  justify-content: space-between;
  background: var(--color-white);
  border-radius: 8px;
  padding: 8px 100px 16px 100px;
`;

export const DateRollPoint = styled.div<{ isYear?: boolean }>`
  font-weight: ${({ isYear }) => (isYear ? 700 : 400)};
  font-size: 12px;
  line-height: 14px;
  color: var(--color-text-muted);
`;
