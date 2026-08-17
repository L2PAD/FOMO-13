import styled from "styled-components";
import BaseCard from "../BaseCard";

export const Wrapper = styled(BaseCard)`
  width: 100%;
`;

export const Header = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  h3 {
    font-size: 14px;
    font-weight: var(--font-weight-semibold);
    line-height: 17.6px;
    color: var(--main-gray);
  }

  @media (max-width: 600px) {
    flex-direction: column;
    align-items: flex-start;
    gap: 10px;
  }
`;

export const LeftHeader = styled.div`
  display: flex;
  align-items: center;
  gap: 8px;

  @media (max-width: 600px) {
    width: 100%;

    & > div {
      width: 100%;
    }
  }
`;

export const SearchField = styled.div`
  position: relative;
  width: 300px;

  @media (max-width: 600px) {
    width: 100%;
  }
`;

export const SearchDropdown = styled.div`
  position: absolute;
  top: calc(100% + 6px);
  left: 0;
  right: 0;
  z-index: 5;
  max-height: 280px;
  overflow-y: auto;
  border: 1px solid #e2e8f0;
  border-radius: 8px;
  background: var(--color-white);
  box-shadow: 0 12px 28px rgba(7, 11, 53, 0.12);
`;

export const SearchOption = styled.button`
  display: flex;
  align-items: center;
  width: 100%;
  padding: 9px 10px;
  border: 0;
  background: transparent;
  text-align: left;
  cursor: pointer;

  &:hover {
    background: #f5fbfd;
  }

  &:disabled {
    cursor: default;
    opacity: 0.55;
  }

  .name {
    display: block;
    color: var(--color-text-primary);
    font-size: 13px;
    font-weight: var(--font-weight-semibold);
    line-height: 16px;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  .meta {
    display: block;
    color: var(--color-text-muted);
    font-size: 12px;
    line-height: 15px;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }
`;

export const Tabs = styled.div`
  display: flex;
  align-items: center;
  gap: 20px;
  margin-top: 10px;
  margin-bottom: 20px;
  overflow-x: auto;

  @media (max-width: 600px) {
    gap: 10px;
    flex-wrap: wrap;
    margin-bottom: 10px;
  }

  & .tab {
    display: flex;
    align-items: center;
    gap: 4px;
    min-width: fit-content;

    & .color {
      max-width: 10px;
      min-width: 10px;
      min-height: 10px;
      max-height: 10px;
      border-radius: 50%;
    }

    span {
      color: var(--color-text-primary);
      font-size: 14px;
    }
  }

  & .btn {
    background: white;
    padding: 4px 8px;
    border-radius: 10px;
  }
`;

export const Body = styled.div`
  display: flex;
  gap: 10px;
  width: 100%;
  height: 380px;
`;

export const Bottom = styled.div`
  margin-top: 0;
  display: flex;
  justify-content: space-between;
  gap: 6px;
  overflow: hidden;

  div {
    flex: 1 1 0;
    min-width: 0;
    color: var(--color-text-primary);
    font-size: 12px;
    line-height: 14.4px;
    overflow: hidden;
    text-align: center;
    text-overflow: ellipsis;
    white-space: nowrap;

    @media (max-width: 480px) {
      font-size: 10px;
      line-height: 12px;
    }
  }
`;

export const MiddleButtons = styled.div`
  display: flex;
  gap: 4px;
`;

export const Labels = styled.div`
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  margin-bottom: 5px;
  width: 44px;
  & .date {
    font-size: 14px;
    font-weight: var(--font-weight-regular);
    line-height: 16.8px;
    color: var(--color-text-primary);
  }
`;
