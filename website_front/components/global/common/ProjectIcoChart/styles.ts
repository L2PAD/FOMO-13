import styled from "styled-components";
import BaseCard from "../BaseCard";

export const Wrapper = styled(BaseCard)`
  width: 100%;
  padding-bottom: 28px;

  @media (max-width: 900px) {
    padding-bottom: 24px;
  }

  @media (max-width: 480px) {
    padding-bottom: 20px;
  }
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

  @media (max-width: 768px) {
    flex-direction: column;
    align-items: flex-start;
    gap: 10px;
  }
`;

export const LeftHeader = styled.div`
  display: flex;
  align-items: center;
  gap: 8px;
`;

export const ProjectSearchWrapper = styled.div`
  position: relative;
  min-width: 220px;
`;

export const SearchResults = styled(BaseCard)`
  position: absolute;
  top: calc(100% + 6px);
  left: 0;
  z-index: 20;
  width: 100%;
  max-height: 220px;
  overflow-y: auto;
  padding: 6px;

  & .empty-result {
    padding: 8px;
    color: var(--color-text-muted);
    font-size: 13px;
  }
`;

export const SearchResultItem = styled.button`
  width: 100%;
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 7px 8px;
  border-radius: 6px;
  color: var(--color-text-primary);
  font-size: 13px;
  text-align: left;

  &:hover {
    background: #f5fbfd;
  }

  img {
    width: 18px;
    height: 18px;
    object-fit: cover;
    border-radius: 50%;
  }

  span {
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

  & .tab {
    display: flex;
    align-items: center;
    gap: 4px;
    width: max-content;

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
      white-space: nowrap;
    }
  }

  & .btn {
    background: white;
    padding: 4px 8px;
  }
`;

export const Body = styled.div`
  display: flex;
  gap: 10px;
  width: 100%;
  height: 380px;
`;

export const Bottom = styled.div`
  margin-top: 6px;
  display: flex;
  justify-content: space-between;

  div {
    color: var(--color-text-primary);
    font-size: 13px;
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
    font-size: 13px;
    font-weight: var(--font-weight-regular);
    line-height: 16.8px;
    color: var(--color-text-primary);
  }
`;

export const EmptyChartState = styled.div`
  min-height: 180px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: var(--color-text-muted);
  font-size: 14px;
`;
