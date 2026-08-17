import styled from "styled-components";

export const ErrorWrapper = styled.div`
`;

export const Wrapper = styled.div<{ isValue: boolean }>`
  position: relative;

  & .success-icon{
    position: absolute;
    bottom: 3px;
    right: 8px;
    svg{
      width: 24px;
      height: 24px;
    }
  }
  p {
    font-weight: var(--font-weight-semibold);
    font-size: 16px;
    line-height: 19px;
    margin-bottom: 12px;

    color: var(--color-text-primary);
  }

  & .light-gray {
    & input::placeholder {
      color: var(--color-text-soft);
    }

    path {
      fill: var(--color-text-soft);
    }
  }

  &.close {
    input {
      padding-left: 30px !important;
    }
  }

  &.dollar {
    input {
      padding-left: 30px !important;
    }
  }

  & .left-icon {
    position: absolute;
    z-index: 0;
    left: 12px;
    bottom: 9px;
    color: ${({ isValue }) => (!isValue ? "var(--color-text-soft)" : "var(--main-black)")};
  }
  & .right-icon {
    position: absolute;
    z-index: 0;
    right: 12px;
    bottom: 9px;
    color: ${({ isValue }) => (!isValue ? "var(--color-text-soft)" : "var(--main-black)")};
  }

  & .right-icon-text {
    position: absolute;
    z-index: 0;
    right: 12px;
    bottom: 12px;
    font-size: 14px;
    color: ${({ isValue }) => (!isValue ? "var(--color-text-soft)" : "var(--main-black)")};
  }
`;

export const Label = styled.div`
  font-weight: var(--font-weight-semibold);
  font-size: 16px;
  line-height: 17px;
  color: var(--main-black);
  margin-bottom: 12px;
`;

export const Input = styled.input`
  background: #f8f8f9;
  border-radius: 8px;
  border: none;
  padding: 10px 12px;
  width: 100%;
  transition: background 0.3s ease;

  &.left-icon {
    padding-left: 32px;
  }

  &:hover {
    background: var(--input-hover);
  }
  &:focus {
    background: var(--input-active);
  }
   &:disabled {
    opacity: 0.9;
    background: #e3e3e3;
    cursor: not-allowed;
  }
  &::placeholder {
    color: rgba(115, 128, 148, 0.5);
    font-weight: var(--font-weight-medium);
    font-size: 14px;
    line-height: 16px;
  }
  
  &.success{
    border: 1px solid var(--main-green);
    background: white;
  }
  &.error{
  }
`;

export const LinkIconWrapper = styled.div`
  position: absolute;
  bottom: 10px;
  left: 10px;
  display: flex;
`;
