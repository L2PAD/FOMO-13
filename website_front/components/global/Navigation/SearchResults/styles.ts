import styled from "styled-components";

export const SearchResultsWrapper = styled.div<{ isVisible: boolean }>`
  max-width: 345px;
  width: 100%;
  height: 320px;

  position: absolute;
  top: 48px;
  left: 0px;
  background: white;

  overflow-y: auto;
  z-index: 10000;
  border-radius: 12px;
  box-shadow: 1px 1px 4px 2px var(--input-active);
  scrollbar-width: none;
  -ms-overflow-style: none;
  visibility: ${({ isVisible }) => (isVisible ? "visible" : "hidden")};
  opacity: ${({ isVisible }) => (isVisible ? 1 : 0)};
  transform: ${({ isVisible }) =>
    isVisible ? "translateY(0px)" : "translateY(40px)"};
  transition: all 0.2s ease;
`;

export const SearchResultsItems = styled.div``;

export const SearchResultsTitle = styled.div`
  padding: 12px;
  font-size: 18px;
  font-weight: var(--font-weight-semibold);
  background: #f8f8f9;
`;

export const SearchResultsList = styled.div``;

export const SearchResultsItem = styled.div`
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 8px;
  cursor: pointer;
  transition: all 0.3s ease;

  &:hover {
    background: var(--input-hover);
  }

  img {
    max-width: 32px;
    height: 32px;
    object-fit: cover;
  }
`;

export const SearchResultsItemInfo = styled.div``;

export const SearchResultsItemTitle = styled.div`
  font-size: 16px;
  font-weight: var(--font-weight-semibold);
`;

export const SearchResultsItemDescription = styled.div`
  font-size: 12px;
  color: gray;
`;
