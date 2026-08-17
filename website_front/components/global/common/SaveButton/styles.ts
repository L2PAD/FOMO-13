import styled from "styled-components";

export const Wrapper = styled.button`
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 4px;

  span {
    font-weight: var(--font-weight-regular);
    font-size: 10px;
    line-height: 12px;
    color: var(--main-gray);
  }
`;
