import styled from "styled-components";

export const HeaderWrapper = styled.div<{ isOpen: boolean }>`
  display: flex;
  align-items: center;
  gap: 4px;
  transition: 0.3s;
  font-weight: var(--font-weight-semibold);
  font-size: 14px;
  line-height: 17px;

  svg {
    transition: 0.3s;
    transform: rotate(${({ isOpen }) => (isOpen ? "180deg" : 0)});
  }
`;

export const ContentWrapper = styled.div`
  padding: 10px;
`;
