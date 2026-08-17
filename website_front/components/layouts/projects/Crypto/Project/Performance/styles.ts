import styled from "styled-components";
import BaseCard from "../../../../../global/common/BaseCard";

export const Wrapper = styled(BaseCard)`
  width: 100%;
  overflow: auto;
  background: var(--color-white);
  border: 1px solid var(--Stroke, #f0f2f5);
  box-shadow: rgba(0, 5, 48, 0.08) 2px 2px 8px 0px;

  .sticky {
    position: sticky;
    left: -1px;
    background: var(--color-white);
    z-index: 10;
    box-shadow: 1px 0 0 #eee;
  }
`;

export const TableContainer = styled.div`
  min-width: 600px;
`;

export const Header = styled.div`
  padding: 7px 10px;
  display: grid;
  align-items: center;
  grid-template-columns: 1.7fr 1fr 1fr 1fr 1fr 1fr 1fr;
  div {
    color: var(--color-text-muted);
    font-size: 14px;
    font-weight: var(--font-weight-semibold);
    line-height: 17px;
  }
`;

export const Body = styled.div``;

export const Row = styled.div`
  padding: 25px 10px;
  display: grid;
  align-items: center;
  grid-template-columns: 1.7fr 1fr 1fr 1fr 1fr 1fr 1fr;
  border-top: 1px solid #f0f2f5;

  & .bold {
    font-size: 14px;
    color: var(--color-text-primary);
    font-weight: var(--font-weight-semibold);
  }

  & .percent {
    span {
      margin-left: 0px;
    }
  }
`;
