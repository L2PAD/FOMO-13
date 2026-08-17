import styled from "styled-components";

export const SearchResultsWrapper = styled.div<{ isVisible: boolean, isEmpty: boolean }>`
  width: 100%;
  height: ${({ isEmpty }) => (isEmpty ? "100px" : "420px")};

  position: absolute;
  top: 44px;
  left: 0px;
  background: white;

  overflow-y: auto;
  z-index: 1000;
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
  font-size: 14px;
  font-weight: var(--font-weight-regular);
  color: var(--main-gray);
  display: flex;
  justify-content: space-between;
  align-items: center;
`;

export const SearchResultsList = styled.div``;

export const SearchResultsBlock = styled.div`

`;

export const SearchResultsProjectDetails = styled.div`
  display: flex;
  flex-direction: column;
  align-items: flex-end;

  gap: 4px;
  & .value{
    color: var(--main-black);
    font-size: 14px;
    font-weight: var(--font-weight-semibold);
  }
`

export const SearchResultsItem = styled.a`
  display: flex;
  align-items: center;
  gap: 6px;
  width: 100%;
  padding: 8px;
  border: 0;
  background: transparent;
  color: inherit;
  font: inherit;
  text-align: left;
  text-decoration: none;
  cursor: pointer;
  transition: all 0.3s ease;

  &:hover {
    background: var(--input-hover);
  }

  &:focus-visible {
    outline: 2px solid var(--main-green);
    outline-offset: -2px;
  }

  img {
    max-width: 32px;
    height: 32px;
    object-fit: cover;
    border-radius: 50%;
  }
`;

export const SearchResultsItemInfo = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  width: 100%;
`;

export const SearchResultsItemTitle = styled.div`
  display: flex;
  flex-direction: column;
  gap: 4px;
  span{
    color: var(--main-black);
    font-size: 14px;
    font-weight: var(--font-weight-semibold);
  }

  div{
    color: var(--main-gray);
    font-size: 14px;
    font-weight: var(--font-weight-regular); 
  }
`;

export const SearchResultsItemDescription = styled.div`
  font-size: 14px;
  color: gray;
`;

export const NoResultsMessage = styled.div`
  display:flex;
  align-items: center;
  gap:6px;
  font-size: 14px;
  color: var(--main-gray);
  max-width: fit-content;
  margin: auto auto;
  height: 100%;

  & .lottie-no-results{
    width: 80px; 
  }
`

export const Tabs = styled.div`
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px;

`

export const TabButton = styled.button`
  background: #F9F9F9;
  color:var(--main-gray);
  border-radius:6px;
  padding: 4px 10px;
  font-weight: var(--font-weight-regular);
  font-size:14px;
  &.active{
    background: #E9F8F8;
    color:var(--main-green);
  }

  transition: opacity 0.3s ease;
  
  &:hover{
    opacity:0.7;
  }

  
  &:active{
    opacity:0.5;
  }
`

export const SeeAllButton = styled.button`
  font-size: 14px;
  color: var(--main-green);
  background: transparent; 
  font-weight: var(--font-weight-regular);

  transition: opacity 0.3s ease;
  &:hover{
    opacity:0.7;
  }

  &:active{
    opacity:0.5;
  }
  padding: 8px 12px;
`

export const BlockLine = styled.div`
  height: 1px;
  width: 95%;
  background: #F0F2F5;
  margin: 5px auto;
`
