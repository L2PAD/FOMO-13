import styled from "styled-components";
import BaseCard from "../../../../../global/common/BaseCard";

export const Wrapper = styled(BaseCard)`
  width: 100%;
  min-width: 820px;
`;

export const Header = styled.div`
  display: grid;
  align-items: center;
  grid-template-columns: 1.6fr 1.3fr 1.35fr 1fr 0.6fr 1.1fr 0.8fr;

  > div:first-child {
    position: sticky;
    left: 0;
    background: var(--color-white);
    box-shadow: 8px 0 12px -12px rgba(0, 5, 48, 0.3);
    z-index: 2;
  }

  div {
    font-weight: var(--font-weight-semibold);
    font-size: 14px;
    line-height: 17.15px;
    color: var(--main-gray);
    padding: 6.5px 10px;
  }
`;

export const Body = styled.div`
  & .loading-row {
    padding: 20px 10px;
    color: var(--main-gray);
    font-size: 14px;
  }
`;

export const Row = styled.div`
  display: grid;
  align-items: center;
  grid-template-columns: 1.6fr 1.3fr 1.35fr 1fr 0.6fr 1.1fr 0.8fr;
  border-top: 1px solid #f0f2f5;

  & .project {
    position: sticky;
    left: 0;
    padding: 10px;
    display: flex;
    min-width: 0;
    align-items: center;
    gap: 4px;
    background: var(--color-white);
    box-shadow: 8px 0 12px -12px rgba(0, 5, 48, 0.3);
    z-index: 1;
  }

  & .project-info {
    display: flex;
    min-width: 0;
    flex-direction: column;
    gap: 4px;

    div {
      overflow: hidden;
      font-weight: var(--font-weight-semibold);
      font-size: 14px;
      line-height: 17.15px;
      text-overflow: ellipsis;
      white-space: nowrap;
    }

    span {
      overflow: hidden;
      font-size: 10px;
      color: var(--main-gray);
      text-overflow: ellipsis;
      white-space: nowrap;
    }
  }

  & .value {
    padding: 10px;
    font-size: 14px;
    line-height: 17.15px;
  }

  & .bold {
    padding: 10px;
    font-weight: var(--font-weight-semibold);
    font-size: 14px;
    line-height: 17.15px;
  }

  & .roi {
    padding: 10px;
    font-size: 14px;
  }

  & .status {
    padding: 10px;
    font-weight: var(--font-weight-regular);
    font-size: 14px;
    line-height: 16.8px;
    letter-spacing: 0%;
    &.Active {
      color: var(--color-primary);
    }

    &.Exit {
      color: var(--color-danger);
    }

    &.Ended {
      color: var(--color-danger);
    }
  }
`;
