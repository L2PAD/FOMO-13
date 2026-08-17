import styled from "styled-components";

export const Description = styled.div`
  margin-top: 8px;
  margin-bottom: 16px;
`;

export const ButtonsWrapper = styled.div`
  margin-bottom: 16px;

  & .deal-switch {
    padding: 4px;
    background: #f9f9f9;
    border-radius: 8px;

    div {
      width: 50%;
      text-align: center;
    }
  }
`;

export const InputsRow = styled.div`
  display: flex;
  align-items: center;
  gap: 17px;
  margin: 16px 0px;
  input {
    max-width: 135px;
  }

  @media (max-width: 768px) {
    flex-wrap: wrap;
    gap: 12px;
    input {
      max-width: 100%;
      width: 100%;
    }
  }
`;

export const DealInputLabel = styled.div`
  font-size: 16px;
  font-weight: var(--font-weight-semibold);
  color: var(--color-text-primary);
  margin-bottom: 12px;

  &.description-label {
    margin-bottom: 8px;
  }
`;

export const DateRow = styled.div`
  display: flex;
  align-items: center;

  @media (max-width: 768px) {
    flex-direction: column;
    align-items: stretch;
    gap: 12px;
  }
`;

export const SelectWrapper = styled.div`
  p {
    font-weight: var(--font-weight-regular);
    font-size: 14px;
    line-height: 16px;
    color: var(--color-text-muted);
    margin-bottom: 12px;
  }

  input {
    padding: 12px;
    border: none;
    background: #f8f8f9;
    border-radius: 8px;
    font-weight: var(--font-weight-regular);
    font-size: 14px;
    line-height: 16px;
  }

  select {
    border: none;
    font-weight: var(--font-weight-semibold);
  }
`;

export const CurrencyWrapper = styled.div`
  .currency-select {
    height: fit-content;

    button {
      padding: 12px;
    }
  }
`;

export const PriceInput = styled.div`
  input {
    padding: 12px;
    border: none;
    background: #f8f8f9;
    border-radius: 8px;
    font-weight: var(--font-weight-regular);
    font-size: 14px;
    line-height: 16px;
  }
`;

export const DateWrapper = styled.div`
  margin-bottom: 16px;

  .deal-checkbox p {
    font-size: 14px;
  }
  p {
    font-weight: var(--font-weight-regular);
    font-size: 14px;
    line-height: 16px;
    color: var(--color-text-muted);
    margin-bottom: 7px;
  }
`;

export const DateContainer = styled.div`
  display: flex;
  align-items: center;
  gap: 15px;

  input {
    width: 100%;
    padding: 12px;
    border: none;
    background: #f8f8f9;
    border-radius: 8px;
    font-weight: var(--font-weight-regular);
    font-size: 14px;
    line-height: 16px;
  }

  @media (max-width: 768px) {
    width: 100%;
    gap: 10px;
    & > div,
    & > button {
      width: 100%;
    }
  }
`;

export const DatePickerWrapper = styled.div`
  min-width: 160px;

  .react-datepicker__input-container,
  .react-datepicker-wrapper {
    max-width: 180px;
    width: 100%;
  }

  .small-picker {
    max-width: 180px;
    width: 100% !important;
  }
  @media (max-width: 768px) {
    button {
      max-width: 100%;
      width: 100%;
    }
  }
`;

export const ServiceWrapper = styled.div`
  margin-bottom: 16px;
`;
export const AmountWrapper = styled.div`
  input {
    width: 100%;
    padding: 12px;
    border: none;
    background: #f8f8f9;
    border-radius: 8px;
    font-weight: var(--font-weight-regular);
    font-size: 14px;
    line-height: 16px;
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
    padding: 12px;
    border: none;
    background: #f8f8f9;
    border-radius: 8px;
    font-weight: var(--font-weight-regular);
    font-size: 14px;
    line-height: 16px;
  }
`;

export const ProjectsWrapper = styled.div`
  margin-bottom: 16px;

  p {
    font-weight: var(--font-weight-regular);
    font-size: 14px;
    line-height: 16px;
    color: var(--color-text-muted);
    margin-bottom: 7px;
  }
`;

export const DropdownWrapper = styled.div`
  padding: 16px;
  background: white;
  border-radius: 8px;
  position: absolute;
  top: 30px;
  width: 100%;
  left: 0;
  max-height: 200px;
  height: max-content;
  overflow-y: auto;
  border: 1px solid rgba(83, 98, 124, 0.07);

  div {
    cursor: pointer;
    margin-bottom: 10px;
    font-weight: var(--font-weight-semibold);
  }
`;

export const Buttons = styled.div`
  display: flex;
  flex-direction: column;
  gap: 20px;
  width: 100%;

  .default {
    width: 100%;
    display: flex;
    flex-direction: row;
    gap: 20px;
  }

  .red-btn {
    background: #f9f9f9;
    color: var(--color-danger);
    font-size: 16px;
  }

  .reset {
    display: flex;
    align-items: center;
    justify-content: center;
    max-width: 100%;
  }
  .big {
    width: 100%;
  }
`;

export const MessageWrapper = styled.div`
  width: 100%;
  margin-bottom: 40px;

  p {
    font-weight: var(--font-weight-semibold);
    font-size: 16px;
    line-height: 19.6px;
    color: var(--color-text-primary);
    margin-bottom: 7px;
  }

  span {
    margin-top: 8px;
    display: block;
    font-weight: var(--font-weight-regular);
    font-size: 12px;
    line-height: 14px;
    color: var(--color-text-muted);
  }

  textarea {
    width: 100%;
    height: 109px;
    background: #f8f8f9;
    border-radius: 8px;
    resize: none;
    border: none;
    padding: 12px;

    &::placeholder {
      font-weight: var(--font-weight-regular);
      color: var(--color-text-soft);
    }
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
    background: var(--color-primary);
  }
`;

export const CheckboxWrapper = styled.div`
  margin-left: 20px;
  p {
    font-size: 16px;
    font-weight: var(--font-weight-semibold);
    line-height: 19.6px;
    color: var(--color-text-primary);
    margin: 0px;
    margin-left: 12px;
  }

  span {
    width: 20px;
    height: 20px;

    &:before {
      top: 9px;
      left: 7px;
    }
    &::after {
      top: 10px;
      left: 5px;
    }
  }
`;

export const OfferType = styled.div`
  margin-top: 5px;
  button {
    padding: 2px 8px;
    font-size: 16px;
    color: var(--color-primary);
    font-weight: var(--font-weight-medium);
    padding: 4px 14px;
    box-shadow: 2px 2px 8px 0px #00053014;
    border-radius: 4px;
  }
  @media (max-width: 640px) {
    button {
      width: 100%;
      text-align: center;
    }
  }
`;
