import styled from "styled-components";

export const Wrapper = styled.div<{ isVisible: boolean }>`
  box-shadow: 2px 2px 8px 2px #00053014;
  padding: 12px 20px;
  border-radius: 8px;
  background: white;

  display: flex;
  flex-direction: column;
  gap: 20px;

  transition: all 0.3s ease;
  opacity: ${({ isVisible }) => (isVisible ? 1 : 0)};
  transform: ${({ isVisible }) =>
    isVisible ? "translateY(0px)" : "translateY(20px)"};
  pointer-events: ${({ isVisible }) => (isVisible ? "auto" : "none")};
`;

export const Action = styled.button`
  display: flex;
  align-items: center;
  gap: 8px;

  font-weight: var(--font-weight-semibold);
  font-size: 14px;

  transition: opacity 0.3s ease;

  &:hover {
    opacity: 0.8;
  }
  &:active {
    opacity: 0.6;
  }
`;
