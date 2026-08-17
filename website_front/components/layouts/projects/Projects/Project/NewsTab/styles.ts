import styled from "styled-components";

export const Wrapper = styled.div`
  width: calc(100% - (100% - 1204px) / 2);
  margin-left: calc((100% - 1204px) / 2);

  @media (max-width: 1024px) {
    width: 100%;
    padding: 0 0 0 16px;
    margin-left: 0;
  }
`;
