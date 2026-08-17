import styled from "styled-components";
import BaseCard from "../../../../../global/common/BaseCard";

export const Wrapper = styled(BaseCard)`
  width: 100%;

  @media (max-width: 575px) {
    border-radius: 12px;
  }
`;

export const Header = styled.div`
  display: flex;
  flex-direction: column;
  gap: 8px;
  font-size: 14px;
  color: var(--main-black);
  span {
    font-weight: var(--font-weight-semibold);
  }

  @media (max-width: 767px) {
    font-size: 13px;
    gap: 6px;
  }
`;

export const Body = styled.div`
  margin-top: 20px;
  margin-bottom: 20px;
  display: flex;
  flex-direction: column;
  gap: 8px;

  & .item {
    display: flex;
    align-items: center;
    gap: 8px;
    font-size: 14px;
    div {
      width: 200px;
    }
    span {
      font-weight: var(--font-weight-semibold);
    }
  }

  @media (max-width: 767px) {
    margin-top: 16px;
    margin-bottom: 16px;

    .item {
      font-size: 13px;

      div {
        width: 160px;
      }
    }
  }

  @media (max-width: 575px) {
    .item {
      font-size: 12px;

      div {
        width: 140px;
      }
    }
  }
`;

export const Breakdowns = styled.div`
  font-size: 14px;
  & .title {
    font-weight: var(--font-weight-semibold);
    margin-bottom: 10px;
  }

  & .breakdown-item {
    margin-top: 8px;
    display: flex;
    align-items: center;
  }

  & .breakdown-name {
    width: 240px;
    display: flex;
    align-items: center;
    gap: 12px;
    font-size: 14px;
  }

  & .breakdown-color {
    min-width: 16px;
    max-width: 16px;
    min-height: 16px;
    max-height: 16px;
    border-radius: 50%;
  }

  & .breakdown-description {
    span {
      font-weight: var(--font-weight-semibold);
    }
  }

  @media (max-width: 767px) {
    font-size: 13px;

    .title {
      margin-bottom: 8px;
    }

    .breakdown-name {
      width: 160px;
      font-size: 13px;
      gap: 8px;
    }

    .breakdown-item {
      margin-top: 6px;
    }
  }

  @media (max-width: 575px) {
    font-size: 12px;

    .breakdown-name {
      width: 140px;
      font-size: 12px;
    }

    .breakdown-description {
      font-size: 12px;
    }
  }
`;

export const Counter = styled.div`
  max-width: fit-content;
  margin: 0 auto;
  margin-top: 20px;
  display: flex;
  align-items: center;
  gap: 20px;

  @media (max-width: 767px) {
    margin-top: 16px;
    gap: 14px;
  }

  @media (max-width: 575px) {
    margin-top: 12px;
    gap: 8px;
    flex-wrap: wrap;
    justify-content: center;
  }
`;

export const CounterItem = styled.div`
  display: flex;
  align-items: center;
  gap: 8px;

  div {
    padding: 14px 11.5px;
    border-radius: 8px;
    background: white;
    font-weight: var(--font-weight-semibold);
    font-size: 16px;
    line-height: 19.6px;
    color: var(--main-black);
  }

  span {
    font-size: 14px;
    color: var(--main-gray);
  }

  @media (max-width: 767px) {
    gap: 6px;

    div {
      padding: 10px 8px;
      font-size: 14px;
      line-height: 17px;
    }

    span {
      font-size: 13px;
    }
  }

  @media (max-width: 575px) {
    min-width: 45%;
    justify-content: center;
    margin-bottom: 8px;

    div {
      padding: 8px 6px;
      font-size: 13px;
      line-height: 16px;
    }

    span {
      font-size: 12px;
    }
  }
`;
