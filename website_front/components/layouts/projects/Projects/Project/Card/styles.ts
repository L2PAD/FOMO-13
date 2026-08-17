import styled from "styled-components";

export const PageWrapper = styled.div`
  margin: 27px auto 0;
  width: 1204px;

  @media (max-width: 1204px) {
    width: 100%;
    padding: 0 16px;
    margin-top: 14px;
  }
`;

export const ChardWrapper = styled.div`
  display: grid;
  grid-template-columns: 1fr auto;

  @media (max-width: 800px) {
    grid-template-columns: 1fr;
  }
`;
