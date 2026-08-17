import styled from "styled-components";
import BaseCard from "../common/BaseCard";

export const Wrapper = styled(BaseCard)`
  display: flex;
  flex-direction: column;
  gap: 20px;
  width: 100%;
  a {
    display: flex;
    align-items: center;
    justify-content: space-between;

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
      color: var(--color-text-muted);
    }

    & .lead {
      color: var(--color-primary);
      font-weight: var(--font-weight-medium);
      font-size: 12px;
      background: #e9f7f7;
      padding: 2px 8px;
      border-radius: 6px;
    }
  }

  .skeleton-item {
    display: flex;
    align-items: center;
    justify-content: space-between;
  }

  .skeleton-left {
    display: flex;
    align-items: center;
    gap: 8px;
  }

  .skeleton-info {
    display: flex;
    flex-direction: column;
  }

  max-height: 310px;
  overflow-y: auto;
`;
