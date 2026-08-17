import styled from "styled-components";

export const Container = styled.div`
  .modal-style {
    width: 100% !important;
    max-width: 820px !important;
  }
`;

export const Description = styled.div`
  margin-top: 8px;
`;

export const CheckboxWrapper = styled.div`
  display: flex;
  flex-direction: row;
  align-items: center;
  gap: 12px;
  font-size: 14px;

  & > .checkbox {
    margin-bottom: 5px;
    margin-left: 4px;
  }
`;

export const LabelWrapper = styled.div``;

export const Details = styled.div`
  display: flex;
  flex-direction: column;
  gap: 12px;
  padding: 12px;
  border-radius: 12px;
  background: #f5fbfd;

  h2 {
    font-size: 16px;
    line-height: 19px;
  }

  .detail-item {
    font-size: 14px;
    line-height: 16px;
    display: flex;
    justify-content: space-between;

    .value {
      font-weight: var(--font-weight-semibold);
    }
  }
`;

export const ThemeWrapper = styled.div`
  p {
    font-weight: var(--font-weight-regular);
    font-size: 14px;
    line-height: 16px;
    color: var(--color-text-muted);
    margin-bottom: 7px;
  }
  input {
    width: 100%;
    padding: 8px 12px;
    border: none;
    background: #f8f8f9;
    border-radius: 8px;
    font-weight: var(--font-weight-regular);
    font-size: 14px;
    line-height: 16px;
  }
`;

export const TextareaWrapper = styled.div`
  label {
    font-weight: var(--font-weight-semibold);
    font-size: 16px;
    line-height: 19.6px;
    color: var(--color-text-primary);
    margin-bottom: 12px;
    display: block;
  }

  textarea {
    min-width: 100%;
    max-width: 100%;
    min-height: 75px;
    width: 100%;
    padding: 12px;
    background: #f8f8f9;
    border-radius: 8px;
    border: none;
    font-weight: var(--font-weight-regular);
    font-size: 14px;
    line-height: 16px;
    resize: vertical;

    &::placeholder {
      color: rgba(115, 128, 148, 0.5);
    }
  }
`;

export const Wrapper = styled.div`
  display: flex;
  flex-direction: column;
  gap: 8px;
  margin-top: 20px;

  p {
    font-size: 16px;
    line-height: 18px;
    font-weight: var(--font-weight-semibold);
    color: var(--color-text-primary);
    margin-bottom: 12px;
    text-align: start;
  }

  .inputRootWrapper,
  input {
    width: 100%;
    max-width: 100%;
  }
  label {
    font-weight: var(--font-weight-semibold);
    font-size: 16px;
    line-height: 19.6px;
    color: var(--color-text-primary);
    margin-bottom: 12px;
    display: block;
  }

  .flex {
    display: flex;
    gap: 30px;
    align-items: center;
    justify-content: center;
  }

  button {
    white-space: nowrap;
    font-size: 20px;
  }
`;

export const ConfirmWrapper = styled.div`
  display: flex;
  flex-direction: column;
  width: 100%;
  gap: 12px;
  align-items: center;

  div {
    width: 100%;
    max-width: 100%;
  }

  button {
    width: 100%;
  }
`;

export const SubmitButton = styled.button`
  padding: 13px;
  background: var(--color-primary);
  border-radius: 8px;
  border: none;
  font-weight: var(--font-weight-semibold);
  font-size: 18px;
  line-height: 22px;
  text-align: center;
  color: var(--color-white);
  width: 100%;
  transition: all 0.3s ease;

  &:hover {
    background: rgba(4, 165, 132, 0.75);
  }

  &:active {
    opacity: 0.8;
  }

  &:disabled {
    cursor: not-allowed;
    opacity: 1;
  }
`;
export const Buttons = styled.div`
  max-width: 390px;
  width: 100%;
  margin-top: 10px;
  display: flex;
  align-items: center;
  gap: 40px;

  button {
    width: 50% !important;
    font-size: 16px;
    border-radius: 8px !important;
  }

  .red-btn {
    background: #f9f9f9;
    color: var(--color-danger);
  }
`;

export const Attachment = styled.div`
  width: 100%;
  display: flex;
  flex-direction: row;
  gap: 12px;
  color: var(--color-text-primary);
  font-size: 14px;
  cursor: pointer;
  margin-bottom: 12px;

  .box {
    border: 2px dashed #e0e0e0;
    border-radius: 8px;
    padding: 20px;
    text-align: center;
    cursor: pointer;
    background: #fafafa;
    width: 64px;
    height: 64px;
    display: flex;
    align-items: center;
    justify-content: center;
    color: var(--color-text-muted);
  }
`;
