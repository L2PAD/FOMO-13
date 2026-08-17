import styled from "styled-components";
import BaseCard from "../../../../../global/common/BaseCard";

export const Wrapper = styled(BaseCard)`
  margin: 0px 0px 20px;
  width: 100%;
  overflow: auto;
  -webkit-overflow-scrolling: touch;

  .sticky {
    position: sticky;
    left: -1px;
    z-index: 4;
    background: var(--color-white);
    box-shadow: 1px 0 0 #eee;
  }

  @media (max-width: 575px) {
    margin-bottom: 20px;
    padding: 14px 0;
    border-radius: 12px;

    .sticky {
      padding-left: 14px;
    }
  }
`;

export const Header = styled.div`
  width: fit-content;

  span {
    color: var(--color-text-muted);
    font-size: 14px;
    font-weight: var(--font-weight-semibold);
    line-height: 17.15px;
    display: block;
    padding: 6.5px 10px;
    width: 100%;
    min-width: 0;
    box-sizing: border-box;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
    text-align: center;

    &:first-child {
      text-align: left;
    }
  }

  @media (max-width: 575px) {
    span {
      font-size: 13px;
      padding: 6px 8px;
    }
  }
`;

export const Body = styled.div`
  margin-top: 4px;
  display: flex;
  flex-direction: column;
`;

export const Row = styled.div`
  display: grid;
  align-items: center;
  width: fit-content;

  & .item {
    border-top: 1px solid #f0f2f5;
    padding: 16.5px 10px;
    display: flex;
    gap: 6px;
    font-size: 14px;
    width: 100%;
    min-width: 0;
    box-sizing: border-box;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
    justify-content: center;

    &:first-child {
      justify-content: left;
      position: sticky;
      left: -1px;
      z-index: 4;
      background: var(--color-white);
      box-shadow: 1px 0 0 #eee;
    }
    &.bold {
      font-weight: var(--font-weight-semibold);
    }

    & .red {
      color: var(--color-danger);
    }

    & .green {
      color: var(--color-primary);
    }

    &:nth-child(1) {
      display: flex;
      align-items: center;
      gap: 6px;
      font-size: 14px;
      color: var(--color-text-primary);

      button {
        transform: translateY(2px);
      }

      & .wrapper {
        position: absolute;
        top: -50px;
        left: 115px;

        div {
          color: var(--color-text-muted) !important;
        }
      }

      & .metrics {
        width: 210px;
        border-bottom-left-radius: 0px;
      }
    }

    &:nth-child(2) {
      font-size: 14px;
      color: var(--color-text-primary);
    }

    &:nth-child(3) {
    }

    &:nth-child(4) {
      font-size: 14px;
      color: var(--color-text-primary);
    }

    &.bold {
      font-weight: var(--font-weight-semibold);
    }
  }

  @media (max-width: 575px) {
    & .item {
      padding: 14px 8px;
      font-size: 13px;
    }
  }
`;

export const Column = styled.div`
  flex-direction: column;
`;
