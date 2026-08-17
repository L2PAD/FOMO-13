import styled from "styled-components";

export const Body = styled.div`
  margin-top: 21px;
  margin-bottom: 17px;

  @media (max-height: 635px) {
    margin-top: 13px;
    margin-bottom: 13px;
  }
`;

export const Container = styled.div`
  .modal-style {
    width: 100% !important;
    max-width: 820px !important;
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

export const Label = styled.label`
  font-size: 14px;
  color: var(--color-text-muted);
`;

export const Inputs = styled.div`
  display: flex;
  flex-direction: column;
  gap: 20px;
`;

export const InputWrapper = styled.div`
  display: flex;
  flex-direction: column;
  gap: 12px;

  input {
    border: none;
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
    border-radius: 8px !important;
  }

  .red-btn {
    background: #f9f9f9;
    color: var(--color-danger);
    font-size: 16px;
  }
`;

export const ResetWrapper = styled.div`
  max-width: fit-content;
  margin-top: 20px;

  button {
    font-size: 12px;
    width: 100%;
    padding: 0px 10px;
    color: #728094;

    &:hover {
      color: #65686c;
    }
    &:active {
      color: #5d5f60;
    }
  }
`;

export const Input = styled.input`
  width: 100%;
  padding: 12px;

  border-radius: 8px;
  background: #f8f8f9;
  font-family: inherit;
  border: none;
  font-weight: var(--font-weight-regular);
  font-size: 14px;
  line-height: 16px;

  &.time-input {
    max-width: 80px;
  }

  &::placeholder {
    color: rgba(115, 128, 148, 0.5);
    font-size: 14px;
  }
`;

export const SelectedNft = styled.div`
  display: flex;
  align-items: flex-end;
  flex-direction: column;
  margin-top: 16px;
  margin-bottom: 10px;
  color: #000;
  font-size: 14px;
`;

export const SelectedNftTitle = styled.div`
  font-weight: var(--font-weight-semibold);
`;

export const Key = styled.div``;

export const Price = styled.div`
  margin-top: 20px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  color: #000;
  font-weight: var(--font-weight-semibold);
  font-size: 16px;
`;

export const FloorPriceLabel = styled.div`
  text-align: right;
`;

export const FloorPrice = styled.div`
  margin-top: 10px;
  display: flex;
  align-items: center;
  gap: 5px;
`;

export const YourPrice = styled.div`
  display: flex;
  align-items: center;
  gap: 10px;
  margin-top: 12px;
  position: relative;

  ${InputWrapper} {
    width: 275px;
  }
`;

export const CurrencyWrapper = styled.div`
  position: absolute;
  right: 12px;
  top: 50%;

  transform: translateY(-50%);

  .currency-select {
    height: fit-content;

    button {
      padding: 12px;
    }
  }
`;

export const CurrencyList = styled.div`
  display: flex;
  flex-direction: column;
  gap: 10px;
  position: absolute;
  top: 48px;
  left: -8px;
  opacity: 0;
  border-radius: 8px;
  border: 1px solid rgba(83, 98, 124, 0.07);
  background: var(--color-white);
  transition: all 0.3s ease;
  padding: 3px 0;

  &.visible {
    opacity: 1;
    visibility: visible;
  }
`;

export const SelectedCurrency = styled.div`
  padding: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 3px;
`;

export const Duration = styled.div`
  margin-top: 20px;
  display: flex;
  flex-direction: column;
  gap: 12px;
  font-size: 16px;
  font-weight: var(--font-weight-semibold);

  @media (max-height: 635px) {
    margin-top: 10px;
  }
`;

export const DurationInputs = styled.div`
  display: flex;
  align-items: center;
  gap: 12px;
`;

export const DateInput = styled(Input)`
  max-width: 111px;
  font-family: "Gilroy Regular";
`;

export const TimeInput = styled(Input)`
  max-width: 52px;
`;

export const DurationWrapper = styled.div`
  position: relative;
`;

export const DurationList = styled.div`
  position: absolute;
  top: 37px;
  opacity: 0;
  visibility: hidden;
  transition: all 0.3s ease;
  border-radius: 8px;
  border: 1px solid rgba(83, 98, 124, 0.07);
  background: var(--color-white);
  box-shadow: 4px 4px 10px 0px #eeeeee38;
  padding: 8px;
  display: flex;
  flex-direction: column;
  gap: 10px;

  &.visible {
    opacity: 1;
    visibility: visible;
  }
`;

export const TimeBtn = styled.button`
  margin-top: 0px;
  width: 48px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 8px;
  background: #f8f8f9;
  border: none;
  cursor: pointer;
`;

export const Results = styled.div`
  margin-top: 20px;
  font-size: 16px;
  font-weight: var(--font-weight-semibold);

  @media (max-height: 635px) {
    margin-top: 10px;
  }
`;

export const CurrencyBtn = styled.button`
  transition: color 0.3s ease;
  background: none;
  border: none;
  cursor: pointer;

  &:hover {
    color: #ff507d;
  }

  &.rotate {
    transform: rotate(180deg);
  }
`;

export const ApproveNft = styled.div`
  margin: 25px 0 20px;
  display: flex;
  flex-direction: column;
  gap: 20px;
`;

export const ApproveNftWrapper = styled.div`
  display: flex;
  align-items: center;
  gap: 23px;
  border-radius: 18px;
  border: 1px solid rgba(0, 0, 0, 0.3);
  background: rgba(245, 249, 253, 0.5);
  padding: 34px;
`;

export const ApproveNftImg = styled.img`
  max-width: 60px;
  border-radius: 24px;
`;

export const ApproveNftInfo = styled.div`
  display: flex;
  flex-direction: column;
`;

export const ApproveNftTitle = styled.div`
  color: #000;
  font-size: 16px;
  font-weight: var(--font-weight-semibold);
`;

export const ApproveNftDescription = styled.div`
  color: var(--color-text-muted);
  font-size: 14px;
`;

export const ApproveNftText = styled.div`
  span {
    display: block;
    font-weight: var(--font-weight-semibold);
    margin-bottom: 8px;
  }

  div {
    color: var(--color-text-muted);
    font-size: 14px;
    line-height: 1.4;
  }
`;

export const SearchWrapper = styled.div`
  position: relative;
`;

export const SearchResult = styled.div`
  position: absolute;
  z-index: 1;
  top: 63px;
  max-width: 320px;
  width: 100%;
  border-radius: 4px;
  max-height: 202px;
  overflow-y: auto;
  background: white;
  box-shadow: 2px 2px 4px 2px rgba(0, 0, 0, 0.208);
  display: flex;
  flex-direction: column;
`;

export const ResultWrapper = styled.div`
  width: 100%;
`;

export const SearchItemImg = styled.img`
  max-width: 50px;
  border-radius: 50%;
`;

export const SearchItem = styled.button`
  padding: 8px;
  display: flex;
  align-items: center;
  gap: 12px;
  width: 100%;
  cursor: pointer;
  background: white;
  border: none;
  transition: background 0.3s ease;

  &:hover {
    background: rgba(128, 128, 128, 0.283);
  }
`;

export const SearchItemBody = styled.div`
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  gap: 5px;
  text-align: left;
`;

export const SearchItemTitle = styled.div`
  font-size: 17px;
  font-weight: var(--font-weight-semibold);
`;

export const SearchItemDesc = styled.div`
  font-size: 14px;
  color: var(--color-text-muted);
`;

export const SelectedCollection = styled.div`
  margin-top: 8px;
  position: relative;
  display: flex;
  align-items: center;
  gap: 6px;
  width: 100%;
  padding: 7px;
  border-radius: 8px;
  background: #f8f8f9;
`;

export const RemoveCollection = styled.div`
  position: absolute;
  right: 12px;

  button {
    padding: 6px 12px;
  }
`;

export const DurationDateWrapper = styled.div`
  & button {
    max-width: 270px !important;
  }
`;

export const ConfirmWrapper = styled.div`
  margin-top: 10px;
  display: flex;
  grid-template-columns: 1fr 0.05fr;
  flex-direction: column;
  width: 100%;
  gap: 0px;
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

export const Loading = styled.div`
  display: flex;
  align-items: center;
  justify-content: center;
  width: 100%;
  padding: 10px;
  background: white;
  box-shadow: 2px 2px 4px 2px rgba(0, 0, 0, 0.208);
  border-radius: 5px;
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
      top: 8px;
      left: 6px;
    }
    &::after {
      top: 9px;
      left: 5px;
    }
  }
`;
