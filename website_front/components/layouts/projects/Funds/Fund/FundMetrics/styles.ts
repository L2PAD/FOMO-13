import styled from "styled-components";
import BaseCard from "../../../../../global/common/BaseCard";

export const Wrapper = styled(BaseCard)`
  display: flex;
  flex-direction: column;
  gap: 0;
  width: 100%;
`;

export const Row = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  min-width: 0;
  padding: 11px 0;

  &:not(:first-child) {
    border-top: 1px solid #edf0f4;
  }

  & .key {
    min-width: 0;
    color: var(--main-black);
    font-size: 14px;
    font-weight: var(--font-weight-semibold);
  }
  & .value {
    min-width: 0;
    max-width: 55%;
    overflow-wrap: anywhere;
    text-align: right;
    color: var(--main-black);
    font-size: 14px;

    &.green-value {
      color: var(--color-primary);
      font-weight: var(--font-weight-semibold);
    }

    &.yellow-value {
      color: var(--color-warning);
      font-weight: var(--font-weight-semibold);
    }

    &.red-value {
      color: var(--color-danger);
      font-weight: var(--font-weight-semibold);
    }

    &.rating-value {
      display: flex;
      align-items: center;
      gap: 3px;
      font-weight: var(--font-weight-semibold);

      svg {
        width: 14px;
        height: 14px;
      }
    }
  }
`;

export const LastInvestmentContent = styled.div`
  display: flex;
  align-items: center;
  justify-content: flex-end;
  gap: 8px;
  min-width: 0;

  span {
    min-width: 0;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }
`;
