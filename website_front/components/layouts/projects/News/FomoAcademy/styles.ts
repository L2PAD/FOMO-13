import styled from "styled-components";

export const NewsItems = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 20px;
  align-items: stretch;

  @media (max-width: 768px) {
    gap: 16px;
  }
`;
