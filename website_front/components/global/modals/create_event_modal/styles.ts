import styled from "styled-components";

export const ModalWrapper = styled.div<{ isOpen: boolean }>`
  position: absolute;
  top: 0px;
  left: -5%;
  width: ${({ isOpen }) => (isOpen ? "100%" : "100%")};
  z-index: 10000;
  transition:
    opacity 0.3s ease,
    transform 0.3s ease;
  transform: ${({ isOpen }) =>
    isOpen ? "translateY(0px)" : "translateY(20px)"};
  opacity: ${({ isOpen }) => (isOpen ? 1 : 0)};
  pointer-events: ${({ isOpen }) => (isOpen ? "auto" : "none")};
`;

export const ModalBody = styled.div`
  width: 130%;
  background: #f5fbfd;
  padding: 12px;
  box-shadow: 2px 2px 8px 2px #00053014;
  border-radius: 8px;

  & hr {
    margin: 8px 0px;
    border: none;
    height: 2px;
    background: var(--color-border-subtle);
  }
`;

export const TitleInput = styled.input`
  font-family: Inter;
  border: none;
  background: transparent;
  padding: 2px;
  color: var(--color-text-muted);
  font-weight: var(--font-weight-semibold);
  width: 100%;

  &::placeholder {
    font-family: Inter;
    color: rgba(115, 128, 148, 0.62);
    font-weight: var(--font-weight-regular);
  }
`;

export const DaysLabels = styled.div`
  display: flex;
  flex-direction: column;
  gap: 8.5px;
`;

export const CheckboxWrapper = styled.div`
  display: grid;
  grid-template-columns: 0.3fr 1fr;
  gap: 8px;
`;

export const DateWrapper = styled.div`
  position: relative;
  display: grid;
  grid-template-columns: 0.3fr 1fr;
  align-items: center;
  gap: 8px;
`;

export const Label = styled.div`
  font-family: Inter;
  color: var(--color-text-muted);
  text-align: end;
  font-size: 12px;
`;

export const ConfirmButton = styled.button`
  padding: 0px;
  text-align: left;
  background: transparent;
  font-size: 12px;
  color: var(--color-text-muted);
  font-family: Inter;
  transition: opacity 0.3s ease;
  margin-left: 2px;
  &:hover {
    opacity: 0.8;
  }
  &:active {
    opacity: 0.6;
  }
`;

export const TimeWrapper = styled.div`
  position: relative;
  display: grid;
  grid-template-columns: 0.3fr 1fr;
  align-items: center;
  gap: 8px;
`;
