import styled from "styled-components";

export const PageDescription = styled.p`
  font-size: 16px;
  font-weight: var(--font-weight-regular);
  line-height: 1;
  margin-bottom: 8px;
`;

export const TabsContainer = styled.div`
  width: 100%;
  overflow-x: auto;

  @media (max-width: 768px) {
    margin-bottom: 20px;
  }
`;

export const MobileTabsWrapper = styled.div`
  width: 100%;
  overflow-x: auto;
  white-space: nowrap;
  -webkit-overflow-scrolling: touch;

  &::-webkit-scrollbar {
    display: none;
  }

  & > div {
    display: inline-flex;
    min-width: 100%;
  }
`;

export const HeaderSection = styled.div`
  display: flex;
  flex-direction: row;
  justify-content: space-between;
  align-items: flex-start;
  gap: 20px;

  @media (max-width: 1024px) {
    flex-direction: column;
  }
`;

export const HeaderTitleWrapper = styled.div`
  display: flex;
  flex-direction: column;
  flex: 1;

  h1 {
    margin-bottom: 20px;
  }
`;



export const Subtitle = styled.div`
`