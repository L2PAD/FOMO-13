import styled from "styled-components";

export const SearchResultsWrapper = styled.div<{ isVisible: boolean }>`
  width: 100%;
  height: 180px;

  position: absolute;
  top: 40px;
  left: 0px;
  background: white;

  overflow-y: auto;
  z-index: 1000;
  border-radius: 4px;
  box-shadow: 2px 2px 8px 2px #00053014;
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
  font-size: 14px;
  font-weight: var(--font-weight-regular);
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
    max-width: 20px;
    height: 20px;
    object-fit: cover;
    border-radius: 50%;
  }
`;

export const SearchResultsItemInfo = styled.div`
  display: flex;
  align-items: center;
  gap: 4px;
`;

export const SearchResultsItemTitle = styled.div`
  font-size: 14px;
  font-weight: var(--font-weight-regular);
`;

export const SearchResultsItemDescription = styled.div`
  font-size: 14px;
  color: var(--main-gray);
`;
