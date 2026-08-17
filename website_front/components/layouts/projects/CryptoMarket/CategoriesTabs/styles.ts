import styled from "styled-components";

export const Header = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;

  & .header-left {
    display: flex;
    align-items: center;
    gap: 12px;
  }

  & .category-page-link {
    display: flex;
    align-items: center;
    justify-content: center;
    flex-shrink: 0;
  }

  & .header-actions {
    display: flex;
    align-items: center;
    gap: 20px;
  }

  h3 {
    font-weight: var(--font-weight-semibold);
    font-size: 16px;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
    max-width: 220px;

    @media (max-width: 920px) {
      font-size: 14px;
    }
  }
`;
