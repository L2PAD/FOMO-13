import styled, { createGlobalStyle } from "styled-components";

export const DatePickerWrapper = styled.div`
  position: relative;
  width: max-content;
  max-width: 100%;

  .react-datepicker-wrapper,
  .react-datepicker__input-container {
    width: 100%;
  }
`;

export const ModalDatePickerGlobalStyles = createGlobalStyle`
  .modal-date-picker-popper {
    z-index: 1000100 !important;
    max-width: calc(100vw - 24px);
  }

  .modal-date-picker-popper .react-datepicker {
    overflow: hidden;
    border: 1px solid #2a3443;
    border-radius: 14px;
    background: #111720;
    box-shadow:
      0 18px 45px rgba(0, 0, 0, 0.38),
      0 2px 8px rgba(0, 0, 0, 0.3);
    color: #f4f7fb;
    font-family: "Gilroy", sans-serif;
  }

  .modal-date-picker-popper .react-datepicker__month-container {
    float: none;
    background: #111720;
  }

  .modal-date-picker-popper .react-datepicker__header {
    border-bottom: 1px solid #2a3443;
    border-radius: 0;
    background: #171e29;
    padding: 14px 0 10px;
  }

  .modal-date-picker-popper .react-datepicker__day-names {
    display: flex;
    justify-content: center;
    margin: 8px 12px 0;
  }

  .modal-date-picker-popper .react-datepicker__day-name {
    width: 36px;
    margin: 2px;
    color: #93a0b2;
    font-size: 12px;
    font-weight: var(--font-weight-medium);
    line-height: 28px;
  }

  .modal-date-picker-popper .react-datepicker__month {
    margin: 10px 12px 14px;
  }

  .modal-date-picker-popper .react-datepicker__week {
    display: flex;
    justify-content: center;
  }

  .modal-date-picker-popper .react-datepicker__day {
    display: inline-flex;
    width: 36px;
    height: 34px;
    margin: 2px;
    align-items: center;
    justify-content: center;
    border-radius: 8px;
    color: #f4f7fb;
    font-size: 14px;
    font-weight: var(--font-weight-regular);
    line-height: 34px;
    transition:
      background-color 120ms ease,
      color 120ms ease,
      box-shadow 120ms ease;
  }

  .modal-date-picker-popper .react-datepicker__day:hover {
    background: #253040;
    color: #ffffff;
  }

  .modal-date-picker-popper .react-datepicker__day--outside-month {
    color: #596779;
  }

  .modal-date-picker-popper .react-datepicker__day--disabled,
  .modal-date-picker-popper .react-datepicker__day--disabled:hover {
    background: transparent;
    color: #3f4a59;
    cursor: not-allowed;
    opacity: 1;
  }

  .modal-date-picker-popper .react-datepicker__day--selected,
  .modal-date-picker-popper .react-datepicker__day--keyboard-selected {
    background: var(--color-primary-dark);
    box-shadow: 0 4px 12px rgba(4, 165, 132, 0.32);
    color: #ffffff;
    font-weight: var(--font-weight-semibold);
  }

  .modal-date-picker-popper .react-datepicker__day--selected:hover,
  .modal-date-picker-popper .react-datepicker__day--keyboard-selected:hover {
    background: #01614f;
  }

  .modal-date-picker-popper
    .react-datepicker__day--today:not(.react-datepicker__day--selected) {
    box-shadow: inset 0 0 0 1px var(--color-primary);
    color: #6be1c7;
    font-weight: var(--font-weight-semibold);
  }

  .modal-date-picker-popper .react-datepicker__day:focus-visible {
    outline: 2px solid #9cf3df;
    outline-offset: 1px;
  }

  .modal-date-picker-popper .react-datepicker__triangle {
    display: none;
  }

  @media (max-width: 359px) {
    .modal-date-picker-popper .react-datepicker__day-name,
    .modal-date-picker-popper .react-datepicker__day {
      width: 34px;
      margin-right: 1px;
      margin-left: 1px;
    }

    .modal-date-picker-popper .react-datepicker__day-names,
    .modal-date-picker-popper .react-datepicker__month {
      margin-right: 8px;
      margin-left: 8px;
    }
  }
`;

export const DateInputShell = styled.div<{
  $hasError: boolean;
  $showSuccess: boolean;
  $type: "small" | "default";
}>`
  position: relative;
  display: flex;
  width: ${({ $type }) => ($type === "small" ? "120px" : "328px")};
  max-width: 100%;
  align-items: center;
  border: 1px solid
    ${({ $hasError, $showSuccess }) =>
      $hasError
        ? "var(--color-danger)"
        : $showSuccess
          ? "var(--main-green)"
          : "transparent"};
  border-radius: 8px;
  background: #f8f8f9;
  transition:
    border-color 150ms ease,
    background-color 150ms ease,
    box-shadow 150ms ease;

  &:hover {
    background: var(--input-hover);
  }

  &:focus-within {
    border-color: ${({ $hasError }) =>
      $hasError ? "var(--color-danger)" : "var(--color-primary)"};
    background: var(--input-active);
    box-shadow: 0 0 0 3px
      ${({ $hasError }) =>
        $hasError
          ? "var(--color-danger-soft)"
          : "var(--color-primary-soft-strong)"};
  }

  &:has(input:disabled) {
    cursor: not-allowed;
    opacity: 0.65;
  }
`;

export const DateInputField = styled.input<{
  $type: "small" | "default";
}>`
  && {
    min-width: 0;
    width: 100%;
    height: 41px;
    border: 0;
    border-radius: inherit;
    background: transparent;
    padding: ${({ $type }) =>
      $type === "small" ? "10px 31px 10px 8px" : "10px 40px 10px 12px"};
    color: var(--color-text-primary);
    caret-color: var(--color-primary);
    font-size: ${({ $type }) => ($type === "small" ? "13px" : "14px")};
    font-variant-numeric: tabular-nums;
    font-weight: var(--font-weight-medium);
    letter-spacing: ${({ $type }) => ($type === "small" ? "0" : "0.02em")};
    line-height: 19px;

    &::placeholder {
      color: var(--main-gray);
      opacity: 1;
    }

    &:disabled {
      cursor: not-allowed;
    }
  }
`;

export const DateInputIcon = styled.span<{
  $success: boolean;
  $type: "small" | "default";
}>`
  position: absolute;
  top: 50%;
  right: ${({ $type }) => ($type === "small" ? "8px" : "12px")};
  display: inline-flex;
  width: ${({ $success, $type }) =>
    $success ? ($type === "small" ? "20px" : "24px") : "16px"};
  height: ${({ $success, $type }) =>
    $success ? ($type === "small" ? "20px" : "24px") : "17px"};
  align-items: center;
  justify-content: center;
  color: ${({ $success }) =>
    $success ? "var(--main-green)" : "var(--main-gray)"};
  pointer-events: none;
  transform: translateY(-50%);

  svg {
    display: block;
    max-width: 100%;
    max-height: 100%;
  }
`;

export const DatePickerFeedback = styled.p<{
  $type: "small" | "default";
}>`
  width: ${({ $type }) => ($type === "small" ? "120px" : "328px")};
  max-width: 100%;
  margin-top: 5px;
  color: var(--color-danger);
  font-size: 12px;
  font-weight: var(--font-weight-medium);
  line-height: 15px;
  overflow-wrap: anywhere;
`;

export const CustomDateHeaderWrapper = styled.div`
  display: grid;
  grid-template-columns: 32px minmax(150px, 1fr) 32px;
  gap: 10px;
  align-items: center;
  padding: 0 14px;

  span {
    overflow: hidden;
    color: #f4f7fb;
    font-size: 16px;
    font-weight: var(--font-weight-semibold);
    line-height: 22px;
    text-align: center;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  button {
    display: flex;
    width: 32px;
    height: 32px;
    align-items: center;
    justify-content: center;
    border: 1px solid #303b4b;
    border-radius: 50%;
    background: #202936;
    color: #aab5c4;
    cursor: pointer;
    transition:
      border-color 120ms ease,
      background-color 120ms ease,
      color 120ms ease;

    &:first-child {
      transform: rotate(180deg);
    }

    &:hover:not(:disabled) {
      border-color: var(--color-primary);
      background: #263443;
      color: #65d9bf;
    }

    &:focus-visible {
      outline: 2px solid #9cf3df;
      outline-offset: 2px;
    }

    &:disabled {
      cursor: not-allowed;
      opacity: 0.35;
    }
  }
`;
