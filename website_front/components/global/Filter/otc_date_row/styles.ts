import styled from "styled-components";

export const DatesWrapper = styled.div`
  display: flex;
  gap: 10px;
  align-items: center;
  justify-content: space-between;

  & .custom-input {
    width: 180px;
  }

  @media (max-width: 480px) {
    .custom-input {
      width: 120px;
    }
  }
`;

export const DatesLine = styled.div`
  color: var(--color-text-muted);
`;
