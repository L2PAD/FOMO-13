import styled from "styled-components";
import BaseCard from "../../../../../global/common/BaseCard";

export const Wrapper = styled(BaseCard)`
  width: 100%;
  min-width: 600px;
`;

export const Header = styled.div`
  display: grid;
  align-items: center;
  grid-template-columns: 2.2fr 1.8fr 1.8fr 1.8fr;

  div {
    font-weight: var(--font-weight-semibold);
    font-size: 14px;
    line-height: 17.15px;
    color: var(--main-gray);
    padding: 6.5px 10px;
    cursor: pointer;
  }
`;

export const Body = styled.div``;

export const Row = styled.div`
  display: grid;
  align-items: center;
  grid-template-columns: 2.2fr 1.8fr 1.8fr 1.8fr;
  border-top: 1px solid #f0f2f5;

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

    &.Insufficient {
      color: var(--main-gray);
    }
  }
`;

export const Footer = styled.div`
  margin-top: 12px;
`;
