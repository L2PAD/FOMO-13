import styled from "styled-components";

export const Wrapper = styled.div<{ isGrow: boolean }>`
  color: ${({ isGrow }) => (isGrow ? "var(--color-primary)" : "var(--color-danger)")};
  font-size: 14px;
  font-weight: var(--font-weight-semibold);
  line-height: 20px;

  display: flex;
  align-items: center;
  gap: 4px;
`;

export const NullValue = styled.div`
  font-size: 14px;
  line-height: 16px;
  color: var(--main-black);
  text-align: center;
`;
