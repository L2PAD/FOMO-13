import styled from "styled-components";

export const PageWrapper = styled.div`
  padding: 20px 36px;

  @media (max-width: 1204px) {
    width: 100%;
    padding: 0 16px;
    margin-top: 14px;
  }

  @media (max-width: 768px) {
    padding: 16px 12px;
    margin-top: 8px;
  }

  @media (max-width: 480px) {
    padding: 12px;
  }
`;

export const MainScreen = styled.div`
  height: 100%;
  overflow: hidden;
  display: flex;
  flex-direction: column;
`;

export const MainInfo = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  gap: 40px;
  margin-bottom: 2.5rem;
  height: auto;

  .connection-search-section {
    margin-top: 40px;
    max-width: 100%;

    @media (max-width: 1024px) {
      margin-top: 20px;
    }

    @media (max-width: 768px) {
      margin-top: 16px;
    }
  }
  & > div {
    width: 50%;
    height: 100%;

    @media (max-width: 1024px) {
      width: 100%;
    }
  }

  @media (max-width: 1024px) {
    flex-direction: column;
    gap: 24px;
  }

  @media (max-width: 768px) {
    gap: 20px;

    & .header {
      flex-wrap: wrap;
      margin-bottom: 12px;
    }
  }
`;

export const SearchSection = styled.div`
  flex: 0 0 auto;
  min-width: 300px;
  max-width: 400px;

  @media (max-width: 1024px) {
    min-width: 100%;
    max-width: 100%;
  }

  .connection-search-container {
    position: relative;
  }
`;

export const TabSwitcher = styled.div`
  display: flex;
  gap: 4px;
  margin-top: 16px;
  max-width: fit-content;
  background: #f9f9f9;
  border-radius: 8px;
  padding: 4px;

  @media (max-width: 768px) {
    width: 100%;
    min-width: fit-content;
    padding: 4px 6px;
  }

  & > div {
    white-space: nowrap;
  }
`;

export const TabButton = styled.div<{ active: boolean }>`
  color: ${({ active }) => (active ? "var(--color-primary)" : "var(--color-text-muted)")};
  font-weight: var(--font-weight-semibold);
  padding: 6px 20px;
  box-shadow: ${({ active }) => (active ? "2px 2px 8px 0px #00053014" : "")};
  border-radius: 8px;
  background: ${({ active }) => (active ? "white" : "transparent")};
  cursor: pointer;
  transition: all 0.2s ease;
  font-size: 14px;

  &:hover {
    color: ${({ active }) => (active ? "var(--color-primary)" : "#5a6c7d")};
  }

  @media (max-width: 768px) {
    flex: 1;
    text-align: center;
    padding: 6px 12px;
    font-size: 13px;
  }
`;

export const Container = styled.div`
  position: relative;
  width: 100vw;
  height: 100vh;
  overflow: hidden;
  background: #0a0d16;
`;

export const GraphWrapper = styled.div`
  position: relative;
  width: 100%;
  border-radius: 12px;
  overflow: hidden;

  canvas {
    display: block;
  }
`;

export const TableSection = styled.div`
  margin-top: 40px;
  background: white;

  @media (max-width: 1024px) {
    margin-top: 20px;
    padding: 16px;
  }

  @media (max-width: 768px) {
    margin-top: 16px;
    padding: 12px;
  }

  @media (max-width: 480px) {
    margin-top: 12px;
    padding: 8px;
  }
`;

export const TableContentWrapper = styled.div`
  display: flex;
  gap: 24px;
  align-items: flex-start;

  &.onchain {
    flex-wrap: wrap;
  }

  @media (max-width: 1024px) {
    gap: 16px;
    flex-wrap: wrap;
  }

  @media (max-width: 768px) {
    flex-direction: column;
    gap: 16px;
  }
`;

export const TableWrapper = styled.div`
  flex: 1;
  min-width: 0;
  overflow-x: auto;
  max-width: 100%;

  &.onchain {
    min-width: 100%;
  }

  @media (max-width: 1024px) {
    min-width: 100%;
  }
`;

export const TableTitle = styled.div`
  display: flex;
  align-items: center;
  gap: 8px;
  padding-bottom: 20px;

  @media (max-width: 768px) {
    margin-bottom: 16px;
    padding: 12px 0;
  }
`;

export const EntityAvatar = styled.img`
  width: 32px;
  height: 32px;
  border-radius: 50%;
  object-fit: cover;

  @media (max-width: 768px) {
    width: 24px;
    height: 24px;
  }
`;

export const EntityName = styled.div`
  font-size: 24px;
  font-weight: var(--font-weight-semibold);
  color: var(--color-text-primary);

  @media (max-width: 768px) {
    font-size: 16px;
  }
`;

export const RelationsLabel = styled.span`
  font-size: 24px;
  font-weight: var(--font-weight-semibold);
  color: var(--color-primary);

  @media (max-width: 768px) {
    font-size: 13px;
  }
`;
