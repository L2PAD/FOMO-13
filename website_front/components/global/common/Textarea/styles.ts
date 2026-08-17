import styled from "styled-components";

export const TextareaRoot = styled.label`
  display: block;
  width: max-content;

  &.width100 {
    width: 100%;

    textarea {
      width: 100%;
    }
  }
`;

export const LabelWrapper = styled.div`
  display: flex;
  justify-content: space-between;
`;

export const LabelStyle = styled.p`
  margin: 0;
  padding: 0;
  color: var(--color-text-muted);
  font-size: 14px;
  font-weight: var(--font-weight-regular);
  line-height: 16px;
`;

export const ErrorStyle = styled.p`
  margin: 0;
  padding: 0;
  color: var(--color-danger);
  font-size: 12px;
  font-weight: var(--font-weight-regular);
`;

export const TextareaStyle = styled.textarea`
  width: 266px;
  max-width: 100%;
  min-height: 100px;
  margin-top: 7px;
  padding: 10px 12px;
  border: none;
  border-radius: 8px;
  background: #f9f9f9;
  color: var(--color-text-primary);
  font-size: 14px;
  font-weight: var(--font-weight-regular);
  line-height: 18px;
  resize: vertical;
  transition: all 0.3s ease;

  &:hover {
    background: var(--input-hover);
  }

  &:focus {
    background: var(--input-active);
    outline: none;
  }

  &::placeholder {
    color: var(--color-text-soft);
    font-size: 14px;
    font-weight: var(--font-weight-regular);
  }

  &:disabled {
    cursor: not-allowed;
    opacity: 0.9;
    background: #e3e3e3 !important;
  }
`;
