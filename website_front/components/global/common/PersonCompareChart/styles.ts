import styled from "styled-components";
import BaseCard from "../BaseCard";

export const Wrapper = styled(BaseCard)`
  width: 100%;
`;

export const Header = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  h3 {
    font-size: 14px;
    font-weight: var(--font-weight-semibold);
    line-height: 17.6px;
    color: var(--main-gray);
  }

  @media (max-width: 768px) {
    flex-direction: column;
    align-items: flex-start;
    gap: 8px;
  }
`;

export const LeftHeader = styled.div`
  display: flex;
  align-items: center;
  gap: 8px;

  @media (max-width: 768px) {
    width: 100%;

    & > div {
      width: 100%;
    }
  }
`;

export const SearchField = styled.div`
  position: relative;
  width: 100%;
`;

export const Tabs = styled.div`
  display: flex;
  align-items: center;
  gap: 20px;
  margin-top: 10px;
  margin-bottom: 20px;
  overflow-x: auto;

  & .tab {
    display: flex;
    align-items: center;
    gap: 6px;
    min-width: fit-content;

    &.is-muted {
      opacity: 0.55;
    }

    & .color {
      max-width: 10px;
      min-width: 10px;
      min-height: 10px;
      max-height: 10px;
      border-radius: 50%;
    }

    span {
      color: var(--color-text-primary);
      font-size: 14px;
    }

    .status-badge {
      display: inline-flex;
      align-items: center;
      border-radius: 999px;
      padding: 2px 8px;
      background: var(--color-surface-muted);
      color: var(--main-gray);
      font-size: 12px;
      font-weight: var(--font-weight-semibold);
      white-space: nowrap;
    }

    .remove-btn {
      width: 18px;
      height: 18px;
      display: inline-flex;
      align-items: center;
      justify-content: center;
      border: none;
      border-radius: 999px;
      background: var(--color-surface-muted);
      color: var(--main-gray);
      cursor: pointer;
      padding: 0;
      margin-left: 2px;
      flex: 0 0 auto;

      &:hover {
        background: #e7ebf0;
      }
    }
  }

  & .btn {
    background: white;
    padding: 4px 8px;
    border-radius: 10px;
  }
`;

export const Body = styled.div`
  display: flex;
  gap: 10px;
  width: 100%;
  height: 380px;
`;

export const Bottom = styled.div`
  margin-top: 10px;
  display: flex;
  width: 100%;

  justify-content: space-between;

  div {
    color: var(--color-text-primary);
    font-size: 14px;
  }
`;

export const MiddleButtons = styled.div`
  display: flex;
  gap: 4px;
`;

export const Labels = styled.div`
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  margin-bottom: 5px;
  width: 44px;

  height: calc(100% - 30px);

  & .date {
    font-size: 14px;
    font-weight: var(--font-weight-regular);
    line-height: 16.8px;
    color: var(--color-text-primary);
  }

  @media (max-width: 768px) {
    height: calc(100% - 44px);
  }
`;
