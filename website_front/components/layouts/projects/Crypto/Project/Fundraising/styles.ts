import styled from "styled-components";
import BaseCard from "../../../../../global/common/BaseCard";
import Typography from "../../../../../global/common/Typography";

export const Wrapper = styled.div`
  width: 100%;
`;

export const ContentWrapper = styled.div`
  min-width: 100%;
  margin: 0px auto 0;
`;

export const Content = styled.div`
  display: flex;
  gap: 20px;
  width: 100%;
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

export const PieContentWrapper = styled(BaseCard)`
  margin-top: 20px;
  margin-bottom: 30px;
  width: 100%;
  display: flex;
  align-items: center;
  flex-direction: column;

  @media (max-width: 768px) {
    margin-top: 14px;
    margin-bottom: 20px;
    padding: 16px;
  }
`;

export const PieWrapper = styled.div`
  position: relative;
`;

export const PieValuesWrapper = styled.div`
  align-self: flex-start;
  margin-top: 20px;
  width: 100%;

  @media (max-width: 768px) {
    display: block;
    margin-top: 14px;
  }
`;

export const PieValuesTitle = styled(Typography)`
  font-weight: var(--font-weight-regular);
  font-size: 14px;
  line-height: 16px;
  color: var(--color-text-muted);
  display: flex;
  align-items: center;
  gap: 12px;

  &:first-child {
    margin-bottom: 13px !important;
  }

  span {
    font-weight: var(--font-weight-semibold);
    color: var(--color-text-primary);
  }
`;

export const PieValuesPercentageWrapper = styled.div``;

export const PieValuesPercentage = styled(Typography)<{ color: string }>`
  font-weight: var(--font-weight-regular);
  font-size: 14px;
  line-height: 16px;
  color: var(--color-text-primary);
  display: flex;
  gap: 12px;

  & .category {
    width: 100%;
    height: 100%;
  }

  & .right-column {
    margin-left: auto;
    display: flex;
    gap: 5px;
    span {
      font-weight: var(--font-weight-regular);
    }
  }

  @media (max-width: 768px) {
    gap: 8px;
    align-items: flex-start;
    font-size: 13px;
    line-height: 16px;

    & .right-column {
      flex-direction: column;
      align-items: flex-end;
      gap: 2px;
      text-align: right;
    }

    i {
      min-width: 12px;
      min-height: 12px;
      margin-top: 2px;
    }
  }

  & .remove-btn {
    svg {
      width: 14px;
      height: 14px;
    }
  }

  &:not(:last-child) {
    margin-bottom: 12px !important;
  }

  span {
    font-weight: var(--font-weight-semibold);
    color: var(--color-text-primary);
  }

  i {
    min-width: 16px;
    min-height: 16px;
    border-radius: 100%;
    background: ${({ color }) => color};
  }

  &.token-distribution {
    border-top: 1px solid #f0f2f5;
    display: grid;
    grid-template-columns: 1fr 0.5fr 0.5fr;
    align-items: center;
    padding: 15px 10px !important;
    & .name {
      display: flex;
      align-items: center;
      gap: 10px;
    }
    &:not(:last-child) {
      margin-bottom: 0px !important;
    }
  }

  &.row-wrapper {
    border-top: 1px solid #f0f2f5;
    display: grid;
    grid-template-columns: 1fr 1fr;
    align-items: center;
    & .name {
      display: flex;
      align-items: center;
      gap: 10px;
    }
    div {
      padding: 15px 10px 0px 10px;

      &:last-child {
        padding-left: 5px;
      }
    }
  }

  &.edit-item {
    display: flex;
    align-items: center;
    input {
      max-width: 105px;
      font-size: 14px;
      border-radius: 6px;
      border: none;
      padding: 8px;
      height: 25px;
      &::placeholder {
        color: var(--color-text-muted);
        font-size: 14px;
      }
    }
  }

  & .input-wrapper {
    display: flex;
    align-items: center;
    gap: 3px;
    span {
      font-weight: var(--font-weight-regular);
      color: var(--main-gray);
    }
  }

  & .remove-btn {
  }

  & .price-input {
    position: relative;

    & .left-icon {
      position: absolute;
      top: 5px;
      left: 8px;
      font-weight: var(--font-weight-regular);
      font-size: 14px;
      line-height: 100%;
    }
    input {
      padding-left: 25px;
    }
  }
`;

export const MetricsWrapper = styled.div`
  width: 100%;
`;

export const MetricsContentWrapper = styled(BaseCard)`
  display: flex;
  justify-content: space-between;
  width: 100%;
  gap: 20px;
  margin-top: 20px;
  margin-bottom: 20px;

  &.unlocks-metrics-content {
    margin-top: 0;
  }

  @media (max-width: 768px) {
    flex-direction: row;
    flex-wrap: wrap;
    gap: 16px;

    & > div {
      width: 100% !important;
    }
  }
`;

export const MetricsCol = styled.div`
  width: 55%;
  display: flex;
  flex-direction: column;
  gap: 20px;
`;

export const MetricsRow = styled.div`
  display: flex;
  justify-content: space-between;
  gap: 16px;

  span {
    &:first-child {
      font-weight: var(--font-weight-regular);
      font-size: 14px;
      line-height: 16px;
      color: var(--color-text-primary);
    }
    &:last-child {
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

  @media (max-width: 575px) {
    gap: 12px;

    span {
      &:first-child,
      &:last-child {
        width: auto;
      }

      &:last-child {
        min-width: 0;
        text-align: right;
        overflow-wrap: anywhere;
      }
    }
  }
`;

export const TableWrapper = styled.div`
  margin-top: 32px;

  @media (max-width: 768px) {
    margin-top: 22px;
    overflow-x: auto;
    -webkit-overflow-scrolling: touch;
  }
`;

export const Title = styled.h2`
  font-size: 24px;
  font-weight: var(--font-weight-semibold);
  margin-bottom: 20px;

  display: flex;
  align-items: center;
  justify-content: space-between;

  & .edit-btn {
    padding: 6px;
    border: 1px solid var(--main-green);
    display: flex;
    align-items: center;
    justify-content: center;
    border-radius: 6px;
  }

  @media (max-width: 768px) {
    margin-bottom: 14px;
    font-size: 20px;
    line-height: 24px;
  }
`;

export const LeftColumn = styled.div``;

export const ActiveInfo = styled.div<{ isVisible: boolean }>`
  position: absolute;
  top: 35%;
  left: 50%;
  transform: translateX(-50%);
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
  transition: all 0.6s ease;
  opacity: ${({ isVisible }) => (isVisible ? 1 : 0)};
  & .title {
    font-size: 14px;
    color: var(--color-text-primary);
    font-weight: var(--font-weight-semibold);
    text-align: center;
  }
  & .value {
    font-size: 24px;
    color: var(--color-text-primary);
    font-weight: var(--font-weight-semibold);
  }

  & .project-value {
    font-size: 14px;
    font-weight: var(--font-weight-semibold);
    color: var(--color-text-muted);
  }
`;
