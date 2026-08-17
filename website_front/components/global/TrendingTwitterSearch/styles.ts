import styled from "styled-components";
import BaseCard from "../common/BaseCard";

export const Wrapper = styled.div`
  min-width: 100%;
  height: auto;
  overflow: hidden;
`;

export const Header = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;

  h3 {
    font-weight: var(--font-weight-semibold);
    font-size: 16px;
    line-height: 100%;
    color: #1e1e1e;
  }
`;

export const Body = styled.div`
  display: grid;
  grid-template-columns: 1fr 1fr;
  column-gap: 18px;

  @media (max-width: 768px) {
    grid-template-columns: 1fr;
    row-gap: 16px;
    margin-top: 14px;
  }
`;

export const ListItem = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 5px 0px 11px;
  cursor: pointer;

  & .info {
    width: 120px;
    margin-left: auto;
    display: flex;
    flex-direction: column;
    gap: 4px;

    & .info-item {
      display: flex;
      align-items: center;
      justify-content: space-between;
      span {
        font-size: 14px;
        font-weight: var(--font-weight-semibold);
        color: var(--main-black);
      }
      div {
        font-size: 14px;
        color: var(--color-text-muted);
      }
    }
  }
`;
