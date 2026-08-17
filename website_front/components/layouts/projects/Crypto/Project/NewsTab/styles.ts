import styled from "styled-components";

export const Wrapper = styled.div`
  width: 100%;

  h2 {
    font-weight: var(--font-weight-semibold);
    margin-bottom: 20px;
  }

  @media (max-width: 575px) {
    h2 {
      margin-bottom: 14px;
      font-size: 20px;
      line-height: 24px;
    }
  }
`;
