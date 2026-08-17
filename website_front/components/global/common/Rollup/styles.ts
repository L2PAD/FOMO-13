import styled from "styled-components";
import BaseCard from "../BaseCard";

export const Wrapper = styled(BaseCard)`
  width: 623px;
  display: flex;
  flex-direction: column;
  gap: 16px;
  margin-bottom: 8px;

  @media (max-width: 650px) {
    width: 100%;
  }
`;

export const HeaderWrapper = styled.div<{ active: boolean }>`
  display: flex;
  align-items: center;
  justify-content: space-between;
  cursor: pointer;

  div {
    display: flex;
    align-items: center;
    gap: 6px;

    button {
      padding: 0;
      border: none;
      background: none;
      margin-top: -7px;
      transition: 0.3s;

      svg {
        transform: rotate(${({ active }) => (active ? "180deg" : 0)});
        transition: 0.3s;
      }
    }
  }
`;
