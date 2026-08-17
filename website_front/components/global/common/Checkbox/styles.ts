import styled from "styled-components";

export const CheckboxWrapper = styled.label`
  width: max-content;
  display: flex;
  align-items: center;
  flex-direction: row-reverse;
  gap: 6px;
  cursor: pointer;
  box-sizing: border-box;
  padding-left: 8px;
  height: 16px;
  transition: opacity 0.3s ease;

  &:hover{
    opacity: 0.7;
  }

  &:active{
    opacity: 0.5;
  }
`;

export const Label = styled.p<{ active: boolean }>`
  line-height: 16px;
  font-size: 12px;
  margin-left: 8px;
`;

export const InputWrapper = styled.div`
  position: relative;
`;

export const InputStyle = styled.input`
  position: absolute;
  opacity: 0;
  cursor: pointer;
  height: 0;
  width: 0;
`;

export const Checkmark = styled.span<{ active: boolean }>`
  position: absolute;
  top: -9px;
  left: -8px;
  height: 16px;
  width: 16px;
  border-radius: 4px;
  box-sizing: border-box;
  background: ${({ active }) => (active ? "var(--color-primary)" : "white")};
  border: ${({ active }) =>
    active ? "1px solid var(--color-primary)" : "1px solid rgba(83, 98, 124, 0.25)"};

  &:after {
    content: "";
    position: absolute;
    display: ${({ active }) => (active ? "block" : "none")};
    top: 7.5px;
    left: 3px;
    width: 4px;
    height: 1.5px;
    transform: rotate(45deg);
    background: white;
  }

  &:before {
    content: "";
    position: absolute;
    display: ${({ active }) => (active ? "block" : "none")};
    top: 6px;
    left: 4.5px;
    width: 7px;
    height: 1.5px;
    transform: rotate(-45deg);
    background: white;
  }
`;
