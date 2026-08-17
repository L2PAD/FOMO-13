import styled from "styled-components";
import BaseCard from "../../../../../global/common/BaseCard";

export const Wrapper = styled(BaseCard)`
  width: 100%;
  max-width: 100%;
  min-width: 0;
  overflow-x: auto;
  overflow-y: hidden;
  overscroll-behavior-inline: contain;
  scrollbar-width: thin;

  .sticky {
    position: sticky;
    left: 0;
    background: var(--color-white);
    box-shadow: 8px 0 12px -12px rgba(0, 5, 48, 0.3);
    z-index: 2;
  }
`;

export const Header = styled.div`
  display: grid;
  align-items: center;
  grid-template-columns: 1.8fr 1.3fr 1.3fr 1.8fr 0.77fr 0.9fr;
  min-width: 760px;

  div {
    font-weight: var(--font-weight-semibold);
    font-size: 14px;
    line-height: 17.15px;
    color: var(--main-gray);
    padding: 6.5px 10px;
  }
`;

export const Body = styled.div``;

export const Row = styled.div`
  display: grid;
  align-items: center;
  grid-template-columns: 1.8fr 1.3fr 1.3fr 1.8fr 0.77fr 0.9fr;
  border-top: 1px solid #f0f2f5;
  min-width: 760px;

  & .project {
    padding: 10px;
    display: flex;
    align-items: center;
    gap: 4px;
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
    &.Low {
      color: var(--color-primary);
    }

    &.High {
      color: var(--color-danger);
    }

    &.Medium {
      color: var(--color-warning);
    }
  }

  & .best-fund {
    margin-left: 12px;
    display: flex;
    min-width: 0;
    align-items: center;
    gap: 4px;
    font-size: 14px;

    & .name {
      min-width: 0;
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
    }
  }
`;
