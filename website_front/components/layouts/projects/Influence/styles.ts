import styled from "styled-components";

export const PageWrapper = styled.div`
  padding: 40px 36px;

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
  z-index: 1000;

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
export const FilterButton = styled.button`
  z-index: 10;
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 6px 10px;
  background: white;
  border: none;
  border-radius: 8px;
  font-size: 14px;
  font-weight: var(--font-weight-semibold);
  color: var(--color-text-primary);
  cursor: pointer;
  box-shadow: 0px 2px 8px rgba(0, 0, 0, 0.1);
  transition: all 0.2s ease;

  &:hover {
    box-shadow: 0px 4px 12px rgba(0, 0, 0, 0.15);
  }

  svg {
    width: 20px;
    height: 20px;
  }

  @media (max-width: 768px) {
    padding: 8px 12px;
    font-size: 14px;
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

export const TableSection = styled.div`
  background: white;
  border-radius: 12px;

  .flex-row {
    width: 100%;
    display: flex;
    flex-direction: row;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 20px;

    .ad {
      font-size: 12px;
    }

    .ad-mode-wrapper {
      position: relative;

      .icon {
        position: absolute;
        top: -22px;
        left: 40px;

        &.green {
          left: 18px;
        }
      }
    }

    .buttons {
      display: flex;
      gap: 23px;
      flex-direction: row;
    }

    @media (max-width: 768px) {
      flex-wrap: wrap;
      gap: 12px;
      align-items: center;
      justify-content: center;

      .buttons {
        width: 100%;
        justify-content: flex-start;
      }
    }
  }
`;

export const TableWrapper = styled.div`
  flex: 1;
  min-width: 0;
  overflow-x: auto;
  max-width: 100%;

  &.table-wrapper {
    .universal-table-rows-wrapper,
    .influence-table-header {
      min-width: 900px;
    }
    p {
      font-weight: var(--font-weight-regular);
    }

    .influence-table-header {
      button {
        font-weight: 550;
      }
    }
    .universal-table-rows-wrapper .influence-table {
      border-radius: 0 !important;

      &:hover {
        background-color: var(--color-white) !important;

        & > div {
          background-color: var(--color-white) !important;
        }
      }
    }
  }

  @media (max-width: 1024px) {
    min-width: 100%;
  }
`;

export const TableTitle = styled.div`
  display: flex;
  align-items: center;
  gap: 8px;
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
    font-size: 20px;
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
