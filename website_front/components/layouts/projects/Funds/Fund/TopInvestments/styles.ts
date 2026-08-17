import styled from "styled-components";
import BaseCard from "../../../../../global/common/BaseCard";

export const Wrapper = styled(BaseCard)`
  width: 100%;
  display: flex;
  flex-direction: column;
  gap: 16px;

  & .item {
    display: flex;
    align-items: center;
    gap: 8px;
    min-width: 0;
  }

  & .name {
    display: flex;
    min-width: 0;
    gap: 8px;

    span {
      font-size: 14px;
      font-weight: var(--font-weight-semibold);
      color: var(--color-text-primary);
    }
  }

  & .description {
    font-size: 14px;
    color: var(--color-text-muted);
  }

  & .info {
    min-width: 0;
    flex: 1;
  }

  & .name span,
  & .description {
    display: block;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  & .roi {
    margin-left: auto;
    display: flex;
    flex-direction: column;
    gap: 4px;
    flex: 0 0 82px;
    align-items: flex-end;

    &.negative .roi-value {
      color: var(--color-danger);
    }
  }
  & .roi-value {
    width: 100%;
    text-align: right;
    font-size: 14px;
    font-weight: var(--font-weight-semibold);
    color: var(--color-primary);
    white-space: nowrap;
  }
`;

export const Items = styled.div`
  display: flex;
  flex-direction: column;
  gap: 20px;
`;

export const Title = styled.div`
  font-weight: var(--font-weight-semibold);
  font-size: 14px;
  line-height: 17.15px;
`;
