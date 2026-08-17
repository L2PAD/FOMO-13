import styled from "styled-components";

export const BlueCheckboxStyles = styled.input`
  appearance: none;
  width: 24px;
  height: 24px;
  border-radius: 4px;
  border: 1px solid rgb(255, 255, 255);
  background-color: transparent;
  cursor: pointer;

  transition: all 0.25s ease;
  &:hover {
    border-color: #ccc;
  }

  &:active {
    border-color: #aaa;
  }

  &:checked {
    background-color: rgba(11, 97, 146, 1);
  }

  &:checked::before {
  }
`;

export const BlueCheckboxWrapper = styled.div`
  position: relative;
  display: flex;
  min-width: 24px;
  height: 24px;
  img {
    position: absolute;
    z-index: 0;
    top: 19%;
    left: 18%;
    pointer-events: none;
    width: 14px;
  }
`;
