import styled from "styled-components";

export const Wrapper = styled.div`
  width: 1204px;
  margin: 0 auto;

  @media (max-width: 1200px) {
    width: 100%;

    & > div {
      width: 100%;
    }
  }
`;
