import styled from "styled-components";

export const Wrapper = styled.div`
  display: flex;
  align-items: center;
  box-shadow: 2px 2px 8px 2px #00053014;
  padding: 12px;
  border-radius: 8px;
`;

export const TabImage = styled.img`
  width: 48px;
  height: 48px;
  margin-left: 10px;
  border-radius: 8px;
  object-fit: cover;
  flex-shrink: 0;
`;

export const TabBody = styled.div`
  padding: 0px 8px;
  width: 100%;
  & .name {
    font-weight: var(--font-weight-semibold);
    font-size: 14px;
    line-height: 17.15px;
  }

  & .description {
    margin: 8px 0px;
    font-weight: var(--font-weight-regular);
    font-size: 14px;
    line-height: 16.8px;
    letter-spacing: 0%;
  }

  & .date {
    font-weight: var(--font-weight-regular);
    font-size: 10px;
    line-height: 12px;
    color: var(--main-gray);
  }
`;

export const ActionsButtons = styled.div`
  position: relative;
  margin-left: 12px;
  display: flex;
  align-items: center;
  gap: 12px;
`;

export const ActionButton = styled.button`
  height: 20px;
`;

export const ActionsModal = styled.div<{ isVisible: boolean }>`
  position: absolute;
  z-index: 1;
  top: 4px;
  right: 20px;
  padding: 8px 4px;
  border-radius: 8px;
  box-shadow: 2px 2px 8px 2px #00053014;
  background: white;
  transition: all 0.3s ease;
  opacity: ${({ isVisible }) => (isVisible ? 1 : 0)};
  transform: ${({ isVisible }) =>
    isVisible ? "translateY(0px)" : "translateY(20px)"};
  pointer-events: ${({ isVisible }) => (isVisible ? "auto" : "none")};
  display: flex;
  flex-direction: column;
  gap: 8px;

  button {
    display: flex;
    align-items: center;
    gap: 4px;
    padding: 6.5px 12px;
    font-weight: var(--font-weight-semibold);
    font-size: 14px;
    line-height: 17.15px;
    letter-spacing: 0px;
    transition: opacity 0.3s ease;

    &:hover {
      opacity: 0.6;
    }

    &:active {
      opacity: 0.5;
    }
  }
`;

export const Overlay = styled.div`
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
`;
