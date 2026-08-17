import styled from "styled-components";

export const ButtonsWrapper = styled.div`
  margin-bottom: 16px;
  margin-top: 40px;

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

export const BalanceWrapper = styled.div`
  margin-bottom: 20px;
`;

export const BalanceLabel = styled.div`
  font-size: 14px;
  font-weight: var(--font-weight-medium);
  color: var(--color-text-primary);
`;

export const BalanceAmount = styled.div`
  font-size: 14px;
  font-weight: var(--font-weight-semibold);
  color: var(--color-primary);
  text-align: right;
  display: flex;
  flex-direction: column;
  gap: 3px;
`;

export const BalanceButton = styled.button`
  display: flex;
  align-items: center;
  justify-content: center;
  width: 38px;
  height: 26px;
  background: white;
  border: 1px solid var(--color-primary);
  border-radius: 4px;
  cursor: pointer;
  transition: all 0.3s ease;
  background: #F5FBFD;
  path{
    transition: all 0.3s ease;
  }
  &:hover {
    border: 1px solid #02745dff;

    path{
      stroke: #02745dff;
    }
  }

  &:active{
    opacity: 0.5;
  }
`;

export const InputsRow = styled.div`
  display: flex;
  align-items: flex-start;
  gap: 17px;
  margin: 16px 0px;

  & > div {
    flex: 1;
  }

  input {
    width: 100%;
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
  display: flex;
  align-items: center;
  justify-content: space-between;

  &.description-label {
    margin-bottom: 8px;
  }

  .add-payment {
    background: transparent;
    border: none;
    font-size: 12px;
    font-weight: var(--font-weight-semibold);
    color: var(--color-primary);
    cursor: pointer;
    padding: 0;

    &:hover {
      color: #02745d;
    }
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

export const CurrencyWrapper = styled.div`
  .currency-select {
    width: 100%;
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

  .p2p-time-input {
    width: 100%;
    max-width: 100%;
    justify-content: space-between;
    padding: 7px 12px;
    height: 41px;
  }

  .p2p-time-input.success {
    border: 1px solid var(--main-green);
    background: white;
  }

  .p2p-time-input input {
    max-width: none;
    width: 100%;
    min-width: 0;
    margin-left: 0;
    text-align: center;
  }

  .p2p-time-input.success input {
    background: white;
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
  min-width: 100%;

  .react-datepicker__input-container,
  .react-datepicker-wrapper {
    width: 100%;
  }

  .small-picker {
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

  .service-select button {
    padding: 12px;
  }
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

export const ErrorText = styled.div`
  font-size: 14px;
  color: #ff4d4f;
  margin-top: 4px;
`;

export const ThemeWrapper = styled.div`
  margin-bottom: 16px;

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

export const SponsoredDealWrapper = styled.div`
  margin-bottom: 20px;
  display: flex;
  flex-direction: column;
  gap: 8px;
`;

export const SponsoredCheckbox = styled.div`
  display: flex;
  align-items: center;
  gap: 12px;

  &:hover{
    opacity: 0.8;
  }

  input[type="checkbox"] {
    width: 20px;
    height: 20px;
    border: 2px solid #e8e8e8;
    border-radius: 4px;
    cursor: pointer;
    appearance: none;
    position: relative;
    transition: all 0.2s ease;


    &:checked {
      background: var(--color-primary);
      border-color: var(--color-primary);

      &::after {
        content: "";
        position: absolute;
        left: 5.5px;
        top: 1.5px;
        width: 5px;
        height: 9px;
        border: solid white;
        border-width: 0 2px 2px 0;
        transform: rotate(45deg);
      }
    }
  }

  label {
    font-size: 14px;
    font-weight: var(--font-weight-semibold);
    color: var(--color-text-primary);
    cursor: pointer;
    user-select: none;
  }
`;

export const SponsoredDescription = styled.div`
  font-size: 12px;
  color: var(--color-text-muted);
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
    font-size: 14px;
  }

  .big {
    width: 100%;
  }
`;

export const MessageWrapper = styled.div`
  width: 100%;
  margin-bottom: 16px;

  p {
    font-weight: var(--font-weight-semibold);
    font-size: 14px;
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
   transition:background 0.3s ease;

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
      font-weight: var(--font-weight-regular);
      color: var(--color-text-soft);
    }
  }
`;

export const CheckboxWrapper = styled.div`
  margin-left: 20px;

  &.inline-checkbox {
    margin-left: 0;
    margin-bottom: 0;
  }

  p {
    font-size: 14px;
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
    font-size: 14px;
    color: var(--color-primary);
    font-weight: var(--font-weight-medium);
    padding: 4px 14px;
    box-shadow: 2px 2px 8px 0px #00053014;
    border-radius: 4px;
    border: none;
    cursor: pointer;
    background: white;

    &.active {
      background: var(--color-primary);
      color: white;
    }
  }
  @media (max-width: 640px) {
    button {
      width: 100%;
      text-align: center;
    }
  }
`;

// Status Modal Styles
export const StatusModalWrapper = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 40px 20px;
  text-align: center;
`;

export const StatusIcon = styled.div<{ variant?: "reserved" | "completed" }>`
  width: 120px;
  height: 120px;
  border-radius: 50%;
  background: ${(props) =>
    props.variant === "completed" ? "#E6F7F4" : "#E8F4FF"};
  display: flex;
  align-items: center;
  justify-content: center;
  margin-bottom: 24px;

  .icon-inner {
    width: 80px;
    height: 80px;
    border-radius: 50%;
    background: ${(props) =>
    props.variant === "completed" ? "var(--color-primary)" : "#2196F3"};
    display: flex;
    align-items: center;
    justify-content: center;

    svg {
      width: 40px;
      height: 40px;
      color: white;
      stroke-width: 3;
    }
  }
`;

export const StatusTitle = styled.h2<{ variant?: "reserved" | "completed" }>`
  font-size: 24px;
  font-weight: var(--font-weight-semibold);
  color: ${(props) => (props.variant === "completed" ? "var(--color-primary)" : "#2196F3")};
  margin-bottom: 16px;
`;

export const ExpiresWrapper = styled.div`
  margin-bottom: 20px;

  .expires-label {
    font-size: 14px;
    color: var(--color-text-primary);
    font-weight: var(--font-weight-semibold);
    margin-bottom: 4px;
  }

  .expires-time {
    font-size: 24px;
    color: var(--color-text-muted);
  }
`;

export const AstronautImage = styled.div`
  margin: 20px 0;

  img {
    width: 180px;
    height: auto;
  }
`;

export const StatusDescription = styled.div`
  font-size: 14px;
  margin-bottom: 20px;
`;

export const StatusBalanceWrapper = styled.div`
  width: 100%;
  background: #f5fbfd;
  border-radius: 12px;
  padding: 16px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 20px;

  .balance-left {
    display: flex;
    flex-direction: column;
    align-items: flex-start;
  }

  .balance-label {
    font-size: 16px;
    font-weight: var(--font-weight-semibold);
    color: var(--color-text-primary);
    margin-bottom: 4px;
  }

  .balance-amount {
    font-size: 14px;
    font-weight: var(--font-weight-semibold);
    color: var(--color-primary);
  }

  .balance-icon {
    display: flex;
    align-items: center;
    justify-content: center;
    cursor: pointer;
    transition: all 0.2s ease;
    gap: 20px;

    &:hover {
      background: #f9f9f9;
      border-color: var(--color-primary);
    }

    svg {
      width: 16px;
      height: 16px;
      color: var(--color-primary);
    }

    button {
      width: 38px;
      height: 26px;
      background: transparent;
    }
  }
`;

export const DetailsList = styled.div`
  width: 100%;
  background: #f5fbfd;
  border-radius: 12px;
  padding: 20px;
  margin-bottom: 24px;
  display: flex;
  flex-direction: column;
  gap: 12px;

  .detail-row {
    display: flex;
    justify-content: space-between;
    align-items: center;

    &:last-child {
      border-bottom: none;
    }

    .detail-label {
      font-size: 14px;
    }

    .detail-value {
      font-size: 14px;
      color: var(--color-text-primary);
      font-weight: var(--font-weight-semibold);
      display: flex;
      align-items: center;
      gap: 8px;

      &.status-active {
        color: var(--color-primary);
      }

      &.status-completed {
        color: var(--color-primary);
      }

      svg {
        width: 16px;
        height: 16px;
        cursor: pointer;
        color: var(--color-text-muted);

        &:hover {
          color: var(--color-text-primary);
        }
      }
    }
  }
`;

export const InfoBox = styled.div<{ variant?: "warning" | "info" }>`
  width: 100%;
  background: ${(props) =>
    props.variant === "warning" ? "#FFF9E6" : "#FFF9E6"};
  border: 1px solid
    ${(props) => (props.variant === "warning" ? "#FFD700" : "#FFD700")};
  border-radius: 8px;
  padding: 16px;
  margin-bottom: 20px;
  color: ${(props) => (props.variant === "warning" ? "var(--color-text-muted)" : "#000")};
  text-align: left;
`;

export const StatusModalButtons = styled.div`
  width: 100%;
  display: flex;
  gap: 16px;

  button {
    flex: 1;
    padding: 14px;
    font-size: 14px;
    font-weight: var(--font-weight-semibold);
    border-radius: 8px;
    border: none;
    cursor: pointer;
    transition: all 0.2s ease;

    &.return-btn {
      background: #f9f9f9;
      color: var(--color-danger);

      &:hover {
        background: #ffe8e8;
      }
    }

    &.view-btn {
      background: var(--color-primary);
      color: white;

      &:hover {
        background: #038c6e;
      }
    }

    &.close-btn {
      background: #f9f9f9;
      color: var(--color-text-muted);

      &:hover {
        background: #f0f0f0;
      }
    }

    &.new-deal-btn {
      background: var(--color-primary);
      color: white;

      &:hover {
        background: #038c6e;
      }
    }
  }
`;

export const ReturnModalWrapper = styled.div`
  padding: 20px;
`;

export const ReturnModalDescription = styled.div`
  font-size: 14px;
  line-height: 1.6;
  margin-bottom: 20px;

  p {
    margin-bottom: 12px;
  }
`;

export const ReturnModalButtons = styled.div`
  display: flex;
  gap: 16px;
  margin-top: 20px;

  button {
    flex: 1;
    padding: 14px;
    font-size: 14px;
    font-weight: var(--font-weight-semibold);
    border-radius: 8px;
    border: none;
    cursor: pointer;
    transition: all 0.2s ease;

    &.cancel-btn {
      background: #f9f9f9;
      color: var(--color-text-muted);

      &:hover {
        background: #f0f0f0;
      }
    }

    &.confirm-btn {
      background: var(--color-danger);
      color: white;

      &:hover {
        background: #e04848;
      }
    }
  }
`;


export const TokenCurrency = styled.div`
`
