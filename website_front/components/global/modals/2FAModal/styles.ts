import styled from "styled-components";

export const Text = styled.p`
  color: var(--color-text-muted);
  padding: 5px 0;
`;

export const InputWrapper = styled.div`
  margin: 16px 0;
  max-width: 350px;
`;

export const SubmitButton = styled.button`
  padding: 13px;
  background: var(--color-primary);
  border-radius: 8px;
  border: none;
  font-weight: var(--font-weight-semibold);
  line-height: 22px;
  text-align: center;
  color: var(--color-white);
  width: 100%;
  font-size: 18px;

  &:hover {
    background: rgba(4, 165, 132, 0.75);
  }
`;

export const ListWrapper = styled.div`
  margin: 20px 0 12px;
  display: flex;
  flex-direction: column;
  gap: 12px;

  & .list-item {
    display: flex;
    align-items: center;
    gap: 8px;
  }

  & .list-marker {
    background: var(--main-black);
    min-width: 4px;
    min-height: 4px;
    max-width: 4px;
    max-height: 4px;
    border-radius: 50%;
  }

  & .list-text {
    font-weight: var(--font-weight-regular);
    font-size: 14px;
    line-height: 100%;

    span {
      color: var(--main-green);
      font-weight: var(--font-weight-semibold);
    }
  }
`;

export const QrCodeWrapper = styled.div`
  display: flex;
  gap: 10px;
`;

export const QrCode = styled.div``;

export const QrCodeDetails = styled.div`
  display: flex;
  flex-direction: column;

  & .refetch-btn {
    max-width: fit-content;
    margin-top: auto;
    margin-bottom: 20px;
    font-weight: var(--font-weight-regular);
    font-size: 14px;
    line-height: 100%;
    display: flex;
    align-items: center;
    gap: 4px;

    transition: opacity 0.3s ease;

    &:hover {
      opacity: 0.8;
    }
    &:active {
      opacity: 0.6;
    }
  }
  & .details-block {
    margin-top: 15px;
  }

  & .details-value {
    font-weight: var(--font-weight-regular);
    font-size: 14px;
    line-height: 100%;
    color: var(--main-blue);
    margin-top: 8px;
    cursor: pointer;
  }

  & .details-key {
    font-weight: var(--font-weight-semibold);
    font-size: 14px;
    line-height: 100%;
    letter-spacing: 0%;
  }
`;

export const CodeInputWrapper = styled.div`
  margin-top: 14px;
  p {
    font-weight: var(--font-weight-semibold);
    font-size: 16px;
    line-height: 16px;
    color: var(--main-black);
    margin-bottom: 12px;
  }

  .input {
    display: flex;
    align-items: center;
    background: #f8f8f9;
    padding: 8px 12px;
    gap: 8px;
    border-radius: 8px;
    font-size: 14px;

    .paste {
      cursor: pointer;
    }
  }

  input {
    width: 100%;
    border: none;
    background: #f9f9f9;
    font-weight: var(--font-weight-regular);
    font-size: 14px;
    line-height: 16px;

    &::placeholder {
      color: var(--color-text-soft);
      font-family: inherit;
    }
  }

  & .code-label {
    margin: 12px 0;
    font-weight: var(--font-weight-regular);
    font-size: 14px;
    line-height: 100%;
    color: var(--main-gray);
  }
`;

export const ButtonWrapper = styled.div`
  width: 100%;

  button {
    width: 100%;
  }
`;

export const Form = styled.form``;
