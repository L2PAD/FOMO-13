import styled from "styled-components";
import BaseCard from "../common/BaseCard";

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
`;

export const ListItem = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 5px 0px 15px;

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

  & .description {
    color: var(--main-green);
  }
`;
