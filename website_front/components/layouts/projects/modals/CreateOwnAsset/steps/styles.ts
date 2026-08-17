import styled from "styled-components";

export const Wrapper = styled.div`
  .create-own-asset-time-input {
    width: 112px;
    min-width: 112px;
    flex: 0 0 112px;
    justify-content: space-between;
  }

  .create-own-asset-time-input input {
    min-width: 30px;
    max-width: 30px;
    margin-left: 0;
    text-align: center;
  }

  @media (max-width: 768px) {
    .create-own-asset-time-input {
      width: 100%;
      min-width: 0;
      flex: 1 1 auto;
    }

    .create-own-asset-time-input input {
      width: 100%;
      max-width: none;
    }
  }
`;

export const TabsWrapper = styled.div`
  margin: 24px 0;

  & .tab {
    width: 100% !important;
    font-size: 16px !important;
  }
`;

export const InputsWrapper = styled.div`
  display: flex;
  flex-direction: column;
  gap: 20px;

  & .input-label {
    font-weight: var(--font-weight-semibold);
    font-size: 16px;
    line-height: 100%;
    letter-spacing: 0%;
  }

  & .input-bottom-label {
    font-weight: var(--font-weight-regular);
    font-size: 14px;
    line-height: 100%;
    color: var(--main-gray);
  }
`;

export const InputWrapper = styled.div`
  position: relative;
  display: flex;
  flex-direction: column;
  gap: 12px;
  width: 100%;

  & .asset-input {
    width: 100%;
  }

  input {
    width: 100%;
  }

  & .input-select {
    position: absolute;
    top: 32px;
    right: 2px;
    button {
      display: flex;
      gap: 5px;
      font-weight: var(--font-weight-semibold);
      font-size: 14px;
      line-height: 100%;
      letter-spacing: 0%;
      background-color: transparent;
      box-shadow: none;
    }
    svg {
      width: 80%;
    }
    path {
      stroke: black;
    }
  }
`;

export const CustomInputWithSelect = styled.div`
  width: 100%;

  & .input-custom {
    width: 100%;
    padding: 12px;
    border: none;
    background: #f8f8f9;
    border-radius: 8px;
    box-sizing: border-box;
    font-weight: var(--font-weight-semibold);
    max-width: 100%;
    transition: all 0.3s ease;
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

export const TextareaWrapper = styled.div`
  position: relative;
  width: 100%;

  textarea {
    min-width: 100%;
    max-width: 100%;
    max-height: 70px;
    width: 100%;
    margin-top: 12px;
    padding: 8px 12px;
    background: #f9f9f9;
    border-radius: 8px;
    border: none;
    &::placeholder {
      font-weight: var(--font-weight-regular);
      font-size: 14px;
      line-height: 100%;
      letter-spacing: 0%;
      color: var(--color-text-soft);
    }
  }

  & .input-select {
    position: absolute;
    top: 32px;
    right: 2px;
    button {
      display: flex;
      gap: 5px;
      font-weight: var(--font-weight-semibold);
      font-size: 14px;
      line-height: 100%;
      letter-spacing: 0%;
      background-color: transparent;
      box-shadow: none;
    }
    svg {
      width: 80%;
    }
    path {
      stroke: black;
    }
  }
`;

export const ButtonWrapper = styled.div`
  max-width: fit-content;
  margin-top: 28px;
  margin-left: auto;
`;
