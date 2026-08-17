import styled from "styled-components";
import BaseCard from "../../../../../global/common/BaseCard";

export const Wrapper = styled(BaseCard)`
  width: 100%;
  margin-bottom: 40px;

  & .sticky {
    position: sticky;
    left: 0;
    z-index: 1;
    background: var(--color-white);
  }
`;

export const Header = styled.div`
  display: grid;
  grid-template-columns: 1fr 1fr 1fr 1fr;
  min-width: 600px;

  span {
    color: var(--color-text-muted);
    font-size: 14px;
    font-weight: var(--font-weight-semibold);
    line-height: 17.15px;
    display: block;
    padding: 6.5px 10px;
  }
`;

export const Body = styled.div`
  margin-top: 4px;
  display: flex;
  flex-direction: column;
  min-width: 600px;
`;

export const Row = styled.div`
  display: grid;
  grid-template-columns: 1fr 1fr 1fr 0.7fr;
  align-items: center;

  & .item {
    border-top: 1px solid #f0f2f5;
    padding: 25.5px 10px;

    &:nth-child(1) {
      font-size: 14px;
      color: var(--color-text-primary);
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
`;
