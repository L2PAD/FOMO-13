import styled from "styled-components";

export const RedFlagWrapper = styled.div`
  display: flex;
  gap: 7px;
  align-items: center;
  font-weight: var(--font-weight-regular);
  font-size: 14px;
  line-height: 16px;
  color: var(--color-text-primary);

  &.reverse {
    flex-direction: row-reverse;
    justify-content: center;
    font-weight: var(--font-weight-semibold);
  }
`;
