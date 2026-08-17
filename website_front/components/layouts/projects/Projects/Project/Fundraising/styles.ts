import styled from "styled-components";
import BaseCard from "../../../../../global/common/BaseCard";
import Typography from "../../../../../global/common/Typography";

export const ScrollWrapper = styled.div`
  width: calc(100% - (100% - 1204px) / 2);
  margin-left: calc((100% - 1204px) / 2);
  display: flex;
  overflow-x: auto;
  gap: 16px;

  @media (max-width: 1024px) {
    width: 100%;
    margin-left: 0;
    padding: 16px;
  }
`;

export const ContentWrapper = styled.div`
  width: 1204px;
  margin: 30px auto 0;

  @media (max-width: 1024px) {
    width: 100%;
    padding: 16px;
  }
`;

export const Content = styled.div`
  display: flex;
  gap: 89px;

  @media (max-width: 1024px) {
    flex-direction: column;
    gap: 40px;
  }
`;

export const RoundWrapper = styled(BaseCard)`
  min-width: 360px !important;
`;

export const RoundTitle = styled(Typography)`
  font-weight: var(--font-weight-semibold);
  font-size: 16px;
  line-height: 19px;
  color: var(--color-text-primary);
`;

export const RoundValueWrapper = styled.div`
  display: flex;
  margin-top: 10px;

  p {
    width: 50%;
    white-space: normal !important;
  }
`;

export const RoundValue = styled(Typography)`
  font-weight: var(--font-weight-regular);
  font-size: 14px;
  line-height: 16px;
  color: var(--color-text-muted);

  span {
    font-weight: var(--font-weight-semibold);
    color: var(--color-text-primary);
  }
`;

export const PieTitleWrapper = styled.div`
  display: flex;
  align-items: center;
  margin-bottom: 12px;
  gap: 11px;
  font-weight: var(--font-weight-semibold);
  font-size: 20px;
  line-height: 24px;
  color: var(--color-text-muted);

  button {
    background: var(--color-white);
    border: 1px solid rgba(83, 98, 124, 0.07);
    box-shadow: 2px 2px 0 #eeeeee;
    border-radius: 8px;
    width: 32px;
    height: 32px;
    display: flex;
    align-items: center;
    justify-content: center;

    svg {
      width: 13px;
      height: 13px;
    }
  }
`;

export const PieContentWrapper = styled.div`
  display: flex;
  align-items: center;
  gap: 32px;

  @media (max-width: 767px) {
    flex-direction: column;
    align-items: flex-start;
    width: 100%;
  }
`;

export const PieWrapper = styled.div`
  @media (max-width: 767px) {
    display: flex;
    justify-content: center;
    width: 100%;
  }
`;

export const PieValuesWrapper = styled.div`
  margin-top: 8px;
`;

export const PieValuesTitle = styled(Typography)`
  font-weight: var(--font-weight-regular);
  font-size: 14px;
  line-height: 16px;
  color: var(--color-text-muted);
  display: flex;
  gap: 12px;

  &:first-child {
    margin-bottom: 13px !important;
  }

  span {
    font-weight: var(--font-weight-semibold);
    color: var(--color-text-primary);
  }
`;

export const PieValuesPercentageWrapper = styled.div`
  margin-top: 24px;
`;

export const PieValuesPercentage = styled(Typography)<{ color: string }>`
  font-weight: var(--font-weight-regular);
  font-size: 14px;
  line-height: 16px;
  color: var(--color-text-muted);
  display: flex;
  gap: 12px;

  &:not(:last-child) {
    margin-bottom: 12px !important;
  }

  span {
    font-weight: var(--font-weight-semibold);
    color: var(--color-text-primary);
  }

  i {
    width: 12px;
    height: 12px;
    border-radius: 100%;
    background: ${({ color }) => color};
  }
`;

export const MetricsWrapper = styled.div`
  width: 100%;
`;

export const MetricsContentWrapper = styled.div`
  display: flex;
  justify-content: space-between;
  width: 100%;
  margin-top: 24px;

  @media (max-width: 767px) {
    flex-direction: column;
    gap: 14px;
  }
`;

export const MetricsCol = styled.div`
  width: 65%;
  display: flex;
  flex-direction: column;
  gap: 13px;

  &:last-child {
    width: 35%;
  }

  @media (max-width: 1024px) {
    width: 48%;
    &:last-child {
      width: 48%;
    }
  }
  @media (max-width: 767px) {
    width: 100%;
    &:last-child {
      width: 100%;
    }
  }
`;

export const MetricsRow = styled.div`
  display: flex;
  gap: 41px;

  span {
    &:first-child {
      width: 40%;
      font-weight: var(--font-weight-regular);
      font-size: 14px;
      line-height: 16px;
      color: var(--color-text-muted);
    }
    &:last-child {
      width: 60%;
      font-weight: var(--font-weight-semibold);
      font-size: 14px;
      line-height: 17px;
      color: var(--color-text-primary);
    }
  }

  @media (max-width: 1024px) {
    span {
      &:first-child {
        width: 50%;
      }
      &:last-child {
        width: 50%;
      }
    }
  }
`;

export const TableWrapper = styled.div`
  margin-top: 32px;
  width: 1200px;

  @media (max-width: 1200px) {
    width: 100%;

    & > div {
      width: 100%;
    }
  }
`;
