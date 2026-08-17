import styled from "styled-components";
import BaseCard from "../../../../../global/common/BaseCard";

export const Wrapper = styled(BaseCard)`
  width: 100%;
  overflow-x: auto;

  .sticky {
    position: sticky;
    left: -12px !important;
    background: var(--color-white);
    z-index: 1;
  }
`;

export const Header = styled.div`
  display: grid;
  align-items: center;
  grid-template-columns: 1.8fr 1.8fr 1.2fr 1.8fr 1.2fr;
  min-width: 700px;

  div {
    font-weight: var(--font-weight-semibold);
    font-size: 14px;
    line-height: 17.15px;
    color: var(--main-gray);
    padding: 6.5px 10px;
  }
`;

export const Body = styled.div`
  min-width: 700px;
`;

export const Row = styled.div`
  display: grid;
  align-items: center;
  grid-template-columns: 1.8fr 1.8fr 1.2fr 1.8fr 1.2fr;
  border-top: 1px solid #f0f2f5;

  & > div:first-child {
    position: sticky;
    left: 0;
    z-index: 1;
    background: var(--color-white);
  }

  & .project {
    padding: 10px;
    display: flex;
    align-items: center;
    gap: 4px;
  }

  & .project-info {
    display: flex;
    flex-direction: column;
    gap: 4px;

    div {
      font-weight: var(--font-weight-semibold);
      font-size: 14px;
      line-height: 17.15px;
    }

    span {
      font-size: 10px;
      color: var(--main-gray);
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
    margin-left: 8px;
    display: flex;
    align-items: center;
    gap: 4px;

    & .name {
      font-size: 14px;
    }
  }

  & .empty-value {
    font-size: 12px;
    color: var(--main-gray);
  }
`;
