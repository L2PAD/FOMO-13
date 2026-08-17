import styled from "styled-components";
import BaseCard from "../../../../../global/common/BaseCard";

export const Wrapper = styled(BaseCard)`
  width: 100%;
`;

export const Header = styled.div`
  display: grid;
  align-items: center;
  grid-template-columns: 1.6fr 1.3fr 1.35fr 1fr 0.6fr 1.1fr 0.8fr;

  div {
    font-weight: var(--font-weight-semibold);
    font-size: 14px;
    line-height: 17.15px;
    color: var(--main-gray);
    padding: 6.5px 10px;
  }
`;

export const Body = styled.div`
  max-height: 610px;
  overflow-y: auto;
  scrollbar-width: none;
  -ms-overflow-style: none;

  &::-webkit-scrollbar {
    display: none;
  }
`;

export const Row = styled.div`
  display: grid;
  align-items: center;
  grid-template-columns: 1.6fr 1.3fr 1.35fr 1fr 0.6fr 1.1fr 0.8fr;
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
