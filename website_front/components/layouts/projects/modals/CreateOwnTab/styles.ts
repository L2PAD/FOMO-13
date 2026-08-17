import styled from "styled-components";

export const Wrapper = styled.div``;

export const BlockWrapper = styled.div`
  margin-top: 40px;
  width: 100%;

  & .bottom-label {
    font-weight: var(--font-weight-regular);
    font-size: 14px;
    line-height: 100%;
    color: var(--main-gray);
  }
`;

export const InputWrapper = styled.div`
  margin: 12px 0px;

  input {
    width: 100%;
    padding: 12px;
    border-radius: 8px;
    background: #f9f9f9;
    border: none;
    font-size: 14px;

    &::placeholder {
      color: var(--color-text-soft);
      font-size: 14px;
    }
  }

  textarea {
    background: #f9f9f9;
    padding: 12px;
    border-radius: 8px;
    border: none;
    font-size: 14px;
    width: 100%;
    max-width: 100%;
    min-width: 100%;
    min-height: 75px;
    transition: background 0.3s ease;

    &::placeholder {
      color: var(--color-text-soft);
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
  }
`;

export const InputLabel = styled.div`
  font-weight: var(--font-weight-semibold);
  font-size: 16px;
  line-height: 100%;
  color: var(--main-black);
`;

export const InputError = styled.div`
  font-weight: var(--font-weight-regular);
  font-size: 14px;
  line-height: 100%;
  color: var(--main-red);
`;

export const ButtonWrapper = styled.div`
  margin-top: 20px;
  max-width: fit-content;
  margin-left: auto;
  button {
    width: 170px;
  }
`;

export const CheckboxWrapper = styled.div`
  margin-top: 20px;

  p {
    color: var(--main-gray);
  }
`;

export const HeaderWrapper = styled.div``;
