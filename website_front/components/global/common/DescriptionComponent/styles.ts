import styled from "styled-components";
import { mainGlobalDark } from "../../../../styles/mainGlobalDark";

export const Wrapper = styled.div<{ isVisible: boolean }>`
  display: flex;
  flex-direction: column;
  gap: 6px;
  padding: 10px 20px;
  box-shadow: 2px 2px 8px 0px #00053014;
  border-radius: 8px;
  background: white;
  transition: all 0.3s ease;
  opacity: ${({ isVisible }) => (isVisible ? 1 : 0)};
  transform: ${({ isVisible }) =>
    isVisible ? "translateY(0px)" : "translateY(20px)"};
  pointer-events: ${({ isVisible }) => (isVisible ? "auto" : "none")};
  &.main-modal-description {
    position: absolute;
    top: 35px;
    left: 0px;
    z-index: 1;
  }

  &.gray-description {
    padding: 10px;
    & .description-modal-text {
      color: var(--main-gray);
      font-size: 14px;
    }
  }

  &.market-dark-tooltip {
    border: 1px solid rgba(255, 255, 255, 0.08);
    background: ${mainGlobalDark.background};
    box-shadow: 0 14px 28px rgba(0, 0, 0, 0.24);

    & .description-modal-text {
      color: ${mainGlobalDark.text};
      font-size: 12px;
      line-height: 16px;
    }
  }
`;

export const Date = styled.div`
  font-size: 10px;
  font-weight: 400 !important;
  line-height: 12px;
  color: var(--color-text-muted);
  margin-bottom: 6px;

  ${Wrapper}.market-dark-tooltip & {
    color: ${mainGlobalDark.textMuted};
  }
`;

export const Text = styled.div`
  font-size: 10px;
  font-weight: 400 !important;
  color: var(--color-text-primary);

  & .bold {
    font-weight: 600 !important;
  }

  ${Wrapper}.market-dark-tooltip & {
    color: ${mainGlobalDark.text};
  }
`;
