import styled from "styled-components";

export const Wrapper = styled.div`
  display: flex;
  flex-direction: column;
  gap: 50px;
`;

export const NewsRow = styled.div`
  display: flex;
  justify-content: space-between;
  flex-wrap: wrap;
  margin-top: 20px;
  row-gap: 20px;

  a {
    width: 32.45%;
    transition: all 0.3s ease;
  }
  a:hover {
    opacity: 0.8;
  }
  a:active {
    opacity: 0.7;
  }

  @media (max-width: 768px) {
    a {
      width: 100%;
    }
    row-gap: 16px;
  }
`;

export const Section = styled.div`
  h2 {
  }
`;
