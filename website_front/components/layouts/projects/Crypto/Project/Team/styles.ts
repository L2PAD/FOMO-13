import styled from "styled-components";

export const Wrapper = styled.div``;

export const Persons = styled.div`
  width: 100%;
  display: flex;
  flex-wrap: wrap;
  gap: 20px;
  margin-bottom: 40px;

  @media (max-width: 768px) {
    gap: 12px;
    margin-bottom: 28px;
  }

  @media (max-width: 480px) {
    gap: 10px;
    margin-bottom: 24px;
  }
`;
