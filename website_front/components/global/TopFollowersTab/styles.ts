import styled from "styled-components";
import BaseCard from "../common/BaseCard";

export const Wrapper = styled(BaseCard)`
  display: flex;
  flex-direction: column;
  gap: 12px;
  width: 100%;
  background: rgb(255, 255, 255);
  border: 1px solid var(--Stroke, #f0f2f5);
  box-shadow: rgba(0, 5, 48, 0.08) 2px 2px 8px 0px;
  border-radius: 12px;

  a {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 12px;
    padding: 10px;
    border: 1px solid transparent;
    border-radius: 8px;

    & .item {
      display: flex;
      align-items: center;
      gap: 8px;
    }

    & .name {
      display: flex;
      gap: 8px;

      span {
        font-size: 14px;
        font-weight: var(--font-weight-semibold);
        color: var(--color-text-primary);
      }
    }

    & .description {
      font-size: 14px;
      color: var(--color-primary);
    }

    & .lead {
      color: var(--color-primary);
      font-weight: var(--font-weight-medium);
      font-size: 12px;
      background: var(--color-surface-subtle);
      border: 1px solid #eef2f6;
      padding: 2px 8px;
      border-radius: 6px;
    }

    & .followers {
      font-size: 14px;
      color: var(--color-text-muted);
    }
  }

  max-height: 310px;
  overflow-y: auto;
`;
