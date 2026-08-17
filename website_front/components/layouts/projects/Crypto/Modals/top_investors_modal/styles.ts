import styled from "styled-components";
import BaseCard from "../../../../../global/common/BaseCard";

export const Body = styled.div``;

export const Content = styled.div`
  margin-top: 20px;
`;

export const Tabs = styled.div`
  margin: 24px 0px;
  width: 100%;
  padding: 4px;
  background: #f9f9f9;
  border-radius: 8px;
  display: flex;
  gap: 4px;
`;

export const TabButton = styled.button<{ isActive: boolean }>`
  width: 33%;
  font-size: 14px;
  font-weight: var(--font-weight-semibold);
  line-height: 18px;
  text-align: center;
  color: ${({ isActive }) => (isActive ? "var(--color-primary)" : "var(--main-gray)")};
  padding: 10px 4px;
  background: ${({ isActive }) => (isActive ? "white" : "transparent")};
  border-radius: 8px;
`;

export const List = styled(BaseCard)`
  margin-top: 20px;
  width: 100%;
  display: flex;
  flex-direction: column;
  gap: 20px;
`;

export const Item = styled.a`
  width: 100%;
  display: flex;
  justify-content: space-between;

  & .project {
    display: flex;
    align-items: center;
    gap: 8px;
  }

  & .project-info {
    display: flex;
    flex-direction: column;
    gap: 4px;
    div {
      font-size: 14px;
      font-weight: var(--font-weight-semibold);
      color: var(--main-black);
    }

    span {
      font-size: 14px;
      color: var(--main-gray);
    }
  }

  & .twitter-info {
    display: flex;
    flex-direction: column;
    align-items: flex-end;
    gap: 4px;
    font-size: 14px;
    color: var(--main-gray);
  }

  &:hover {
    opacity: 0.8;
  }
`;
