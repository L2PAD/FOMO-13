import styled from "styled-components";

export const Wrapper = styled.label<{ checked: boolean }>`
  display: flex;
  align-items: center;
  gap: 9px;
  cursor: pointer;
  width: 100%;

  & .details-btn {
    position: relative;
    transform: translateY(2px);
    z-index: 1;
  }

  color: var(--main-black);
  font-size: 14px;

  input {
    display: none;
  }

  div {
    width: 18px;
    height: 18px;
    border: 2px solid
      ${({ checked }) => (checked ? "var(--color-primary)" : "rgba(83, 98, 124, 0.25)")};
    border-radius: 99px;
    display: flex;
    align-items: center;
    justify-content: center;

    span {
      display: block;
      border-radius: 99px;
      min-width: 6px;
      min-height: 6px;
      max-width: 6px;
      max-height: 6px;
      background: var(--color-primary);
      display: ${({ checked }) => (checked ? "block" : "none")};
    }
  }

  & .gray {
    color: var(--color-text-primary);
  }
`;

export const RadioWrapper = styled.div`
  & .radio-modal {
    position: absolute;
    z-index: 10;
    top: 20px;
    left: 0px;
    background: white;
    div {
      color: var(--main-gray);
    }
  }

  &.with-description {
    & .radio-input {
      font-weight: var(--font-weight-semibold);
    }

    & .description-text {
      text-align: left;
      margin-left: 24px;
      color: var(--main-gray);
      font-size: 14px;
    }
  }
`;
