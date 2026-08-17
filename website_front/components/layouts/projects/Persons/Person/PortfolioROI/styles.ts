import styled from "styled-components";
import BaseCard from "../../../../../global/common/BaseCard";

export const Wrapper = styled.div`
  margin-top: 40px;
  width: 100%;
  display: flex;
  gap: 20px;

  @media (max-width: 1100px) {
    flex-direction: column;
  }
`;

export const ChartWrapper = styled.div`
  width: 65%;

  @media (max-width: 1100px) {
    width: 100%;
  }
`;

export const TitleDescriptionWrapper = styled.div`
  position: relative;

  display: flex;
  align-items: center;
  gap: 6px;

  button {
    height: 14px;
  }
`;

export const SearchResults = styled(BaseCard)`
  position: absolute;
  top: calc(100% + 8px);
  left: 0;
  right: 0;
  z-index: 20;
  padding: 8px;
  max-height: 320px;
  overflow-y: auto;
  box-shadow: 0 18px 40px rgba(15, 23, 42, 0.12);
  font-size: 14px;

  &.empty {
    padding: 18px 16px;
    text-align: center;
    color: var(--main-gray);
  }
`;

export const SearchResultItem = styled.button`
  width: 100%;
  display: flex;
  align-items: center;
  justify-content: flex-start;
  gap: 12px;
  border: none;
  background: transparent;
  padding: 10px;
  border-radius: 12px;
  cursor: pointer;

  &:hover {
    background: #f7f8fa;
  }

  & > div:first-child {
    width: auto;
    min-width: 0;
    flex: 0 1 auto;
  }

  & > div:first-child .info {
    width: auto;
    flex-grow: 0;
    align-items: flex-start;
    text-align: left;
  }
`;

export const SearchMeta = styled.div`
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  margin-left: auto;
  text-align: right;
  gap: 4px;
  color: var(--main-gray);
  font-size: 13px;
`;
