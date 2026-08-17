import styled from "styled-components";
import BaseCard from "../../../../../global/common/BaseCard";

export const Wrapper = styled(BaseCard)`
  width: 100%;
  max-width: 100%;
  min-width: 0;
  overflow-x: auto;
  -webkit-overflow-scrolling: touch;

  @media (max-width: 575px) {
    padding: 14px 0;
    border-radius: 12px;
  }

  .sticky {
    position: sticky;
    left: -1px;
    z-index: 5;
    background: var(--color-white);
    box-shadow: 1px 0 0 #eee;
  }
`;

export const Header = styled.div`
  display: grid;
  grid-template-columns: 2fr 0.6fr 0.8fr 1.5fr 1.2fr 1.5fr;
  padding: 6.5px 10px;
  font-size: 14px;
  font-weight: var(--font-weight-semibold);
  line-height: 17.15px;
  color: var(--main-gray);
  min-width: 900px; /* Prevent columns from becoming too narrow */

  & .header-bar {
    display: flex;
    align-items: center;
    justify-content: space-between;
    margin-right: 20px;
  }

  @media (max-width: 767px) {
    min-width: 760px;
    font-size: 13px;
    line-height: 16px;
    padding: 6px 8px;

    .sticky {
      padding-left: 14px;
    }
  }

  & .unlock {
    text-align: center;
  }
`;

export const Body = styled.div`
  min-width: 900px; /* Match with Header to keep alignment */

  @media (max-width: 767px) {
    min-width: 760px;
  }
`;

export const Row = styled.div`
  display: grid;
  grid-template-columns: 2fr 0.6fr 0.8fr 1.5fr 1.2fr 1.5fr;
  align-items: center;
  padding: 25.5px 10px;

  & .round {
    display: flex;
    align-items: center;
    gap: 10px;
  }

  & .round-header {
    display: flex;
    gap: 8px;
    align-items: center;
  }

  & .round-name {
    font-weight: var(--font-weight-semibold);
    font-size: 14px;
    color: var(--main-black);
  }

  & .round-percent {
    font-size: 14px;
    color: var(--main-gray);
  }

  & .round-bottom {
    margin-top: 4px;
    font-size: 14px;
  }

  & .value {
    font-size: 14px;
    color: var(--main-black);
  }

  & .bar-wrapper {
    margin-right: 20px;
  }

  & .bar {
    margin: 4px 0px;
    width: 100%;
    border-radius: 8px;
    height: 8px;
    background: var(--color-danger);
  }

  & .bar-fill {
    border-radius: 8px;
    height: 8px;
    background: var(--color-primary);
  }

  & .bar-header {
    display: flex;
    justify-content: space-between;
    font-size: 14px;
    color: var(--main-black);
  }

  & .bar-bottom {
    display: flex;
    justify-content: space-between;
    font-size: 10px;
    color: var(--main-gray);
  }

  & .lock {
    display: flex;
    flex-direction: column;
    gap: 10px;
    text-align: center;

    & span:nth-child(1) {
      font-size: 14px;
    }
    & span:nth-child(2) {
      font-size: 14px;
      color: var(--main-gray);
    }
  }

  @media (max-width: 767px) {
    padding: 20px 8px;

    .sticky {
      margin-left: -8px;
      padding-left: 22px;
    }

    .round-name,
    .round-percent,
    .round-bottom,
    .value,
    .bar-header,
    .lock span {
      font-size: 13px;
    }
  }
`;

export const Footer = styled.div`
  display: grid;
  grid-template-columns: 2.8fr 2fr 2fr 1.8fr 1.2fr 1.6fr;
  align-items: center;
  padding: 25.5px 10px;
  min-width: 900px; /* Match with Header to keep alignment */

  & .value {
    font-weight: var(--font-weight-semibold);
    font-size: 14px;
    color: var(--main-black);
  }

  & .percent {
    margin-top: 4px;
    font-size: 14px;
    color: var(--main-gray);
  }

  @media (max-width: 767px) {
    min-width: 760px;
    padding: 20px 8px;

    .value,
    .percent {
      font-size: 13px;
    }
  }
`;
