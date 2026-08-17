import styled from "styled-components";

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
  &::placeholder {
    color: rgba(115, 128, 148, 0.5);
    font-weight: var(--font-weight-medium);
    font-size: 14px;
    line-height: 16px;
  }
  &:disabled {
    opacity: 0.9;
    background: #e3e3e3;
    cursor: not-allowed;
  }
`;

export const LinkIconWrapper = styled.div`
  position: absolute;
  bottom: 10px;
  left: 10px;
  display: flex;
`;
