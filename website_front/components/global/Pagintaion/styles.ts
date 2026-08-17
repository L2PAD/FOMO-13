import styled from "styled-components";

export const PaginationWrapper = styled.div`
  display: grid;
  width: 100%;
  grid-template-columns: 250px 1fr;
  margin-top: 10px;
  align-items: center;

  p {
    text-align: right;
  }

  .showing {
    @media (max-width: 450px) {
      display: none;
    }
  }

  & .showing-label {
    font-size: 14px;
    color: var(--color-text-muted);
    overflow: visible !important;
    margin-left: auto !important;
  }

  & .pagination {
    justify-content: flex-start;
  }

  @media (max-width: 768px) {
    grid-template-columns: 217px 1fr;
    height: 37px;
    justify-content: center;
    text-align: center;
    gap: 10px;

    .showing {
      text-align: center;
      margin-bottom: 10px;
    }
  }

  @media (max-width: 480px) {
    grid-template-columns: minmax(0, 1fr);
    height: auto;
    gap: 6px;

    .pagination {
      justify-content: center;
    }

    .showing-label {
      display: none;
    }
  }
`;
